// AudioContext, Mikrofon und Live-Tonhöhe.
import { yin } from './yin.js';
import { hzToMidi } from '../core/notes.js';
import { store } from '../core/store.js';

let ctx = null;

export function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Geschätzte Gesamt-Latenz (Ausgabe + Eingabe + halbes Analysefenster) in Sekunden. */
export function latency() {
  const ms = store.profile.latencyMs;
  if (ms != null) return ms / 1000;
  const c = audioCtx();
  const out = (c.outputLatency || 0) + (c.baseLatency || 0);
  return Math.min(0.35, out + 0.045);
}

class Mic {
  constructor() {
    this.stream = null;
    this.source = null;
    this.analyser = null;
    this.buf = null;
    this.small = null;
    this.history = []; // { t, midi }
    this.level = 0;
  }

  get active() { return !!this.stream; }

  async start() {
    const c = audioCtx();
    if (this.stream) return true;
    const echo = store.profile.echoCancel;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: echo, noiseSuppression: false, autoGainControl: false },
    });
    this.source = c.createMediaStreamSource(this.stream);
    this.analyser = c.createAnalyser();
    this.analyser.fftSize = 2048;
    this.source.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.small = new Float32Array(this.analyser.fftSize / 2);
    return true;
  }

  stop() {
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = this.source = this.analyser = null;
    this.history = [];
  }

  /**
   * Aktuelle Tonhöhe. Glättet über einen kleinen Median und unterdrückt
   * einzelne Oktavsprünge. Rückgabe: { midi|null, hz, clarity, rms }
   */
  read() {
    if (!this.analyser) return { midi: null, hz: 0, clarity: 0, rms: 0 };
    const c = audioCtx();
    this.analyser.getFloatTimeDomainData(this.buf);
    let data = this.buf, sr = c.sampleRate;
    if (sr >= 44100) { // auf halbe Rate dezimieren – spart ~75 % Rechenzeit
      for (let i = 0; i < this.small.length; i++) this.small[i] = (this.buf[2 * i] + this.buf[2 * i + 1]) * 0.5;
      data = this.small; sr /= 2;
    }
    const r = yin(data, sr, { fmin: 70, fmax: 1100, threshold: 0.15, minRms: 0.008 });
    this.level = this.level * 0.7 + r.rms * 0.3;
    const now = performance.now();
    this.history = this.history.filter((h) => now - h.t < 160);
    if (r.hz > 0 && r.clarity > 0.6) {
      let m = hzToMidi(r.hz);
      const prev = this.history.length ? this.history[this.history.length - 1].midi : null;
      if (prev != null && Math.abs(Math.abs(m - prev) - 12) < 0.8) m += m > prev ? -12 : 12; // Oktavfehler
      this.history.push({ t: now, midi: m });
      const sorted = this.history.map((h) => h.midi).sort((a, b) => a - b);
      return { midi: sorted[sorted.length >> 1], hz: r.hz, clarity: r.clarity, rms: r.rms };
    }
    return { midi: null, hz: 0, clarity: r.clarity, rms: r.rms };
  }
}

export const mic = new Mic();

/** Fragt das Mikrofon an und gibt eine verständliche Fehlermeldung zurück. */
export async function ensureMic() {
  try {
    await mic.start();
    return { ok: true };
  } catch (e) {
    let msg = 'Mikrofon nicht verfügbar.';
    if (e && e.name === 'NotAllowedError') msg = 'Mikrofon-Zugriff wurde verweigert. Erlaube ihn in den Browser-Einstellungen.';
    else if (!window.isSecureContext) msg = 'Das Mikrofon funktioniert nur über https:// oder http://localhost (siehe README).';
    else if (e && e.name === 'NotFoundError') msg = 'Kein Mikrofon gefunden.';
    return { ok: false, msg };
  }
}
