// Offline-Analyse für eigene Songs: Melodie (Ziel-Noten) aus der Audiodatei
// schätzen. Ohne Stimmen-Trennung ist das eine Näherung – die Mitte (L+R)
// betont den Gesang, L−R (Begleitung) wird abgezogen.
import { yin } from './yin.js';
import { hzToMidi } from '../core/notes.js';

const SR = 22050, HOP = 256, WIN = 1024;

export async function decodeFile(file) {
  const buf = await file.arrayBuffer();
  const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const tmp = new AC(1, 1, 44100);
  const audio = await tmp.decodeAudioData(buf);
  // auf 22,05 kHz mono (Mitte) heruntermischen
  const off = new AC(1, Math.ceil(audio.duration * SR), SR);
  const src = off.createBufferSource();
  src.buffer = audio;
  const bp = off.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 0.5;
  src.connect(bp).connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  return { duration: audio.duration, mono: rendered.getChannelData(0) };
}

/**
 * Tonhöhenverlauf → Noten [[start, dauer, midi], …].
 * onProgress(0…1) wird regelmäßig aufgerufen (UI bleibt bedienbar).
 */
export async function extractNotes(mono, onProgress = () => {}) {
  const frames = Math.floor((mono.length - WIN) / HOP);
  const pitch = new Float32Array(frames);
  const frame = new Float32Array(WIN);
  for (let f = 0; f < frames; f++) {
    frame.set(mono.subarray(f * HOP, f * HOP + WIN));
    const r = yin(frame, SR, { fmin: 80, fmax: 900, threshold: 0.12, minRms: 0.02 });
    pitch[f] = r.hz > 0 && r.clarity > 0.75 ? hzToMidi(r.hz) : 0;
    if (f % 2000 === 0) { onProgress(f / frames); await new Promise((r2) => setTimeout(r2)); }
  }
  onProgress(1);
  return framesToNotes(pitch, HOP / SR);
}

/** Gruppiert stabile Tonhöhen-Frames zu Noten (auch in Tests genutzt). */
export function framesToNotes(pitch, dt, minDur = 0.1) {
  const notes = [];
  let cur = null;
  const close = () => {
    if (!cur) return;
    const d = (cur.e - cur.s + 1) * dt;
    if (d >= minDur) {
      const vals = cur.v.slice().sort((a, b) => a - b);
      const p = Math.round(vals[vals.length >> 1]);
      const s = cur.s * dt;
      const last = notes[notes.length - 1];
      if (last && last[2] === p && s - (last[0] + last[1]) < 0.08) last[1] = +(s + d - last[0]).toFixed(3);
      else notes.push([+s.toFixed(3), +d.toFixed(3), p]);
    }
    cur = null;
  };
  for (let i = 0; i < pitch.length; i++) {
    const m = pitch[i];
    if (!m) { close(); continue; }
    if (cur) {
      const vals = cur.v;
      const med = vals[vals.length >> 1];
      if (Math.abs(m - med) < 0.8) { cur.v.push(m); cur.e = i; continue; }
      close();
    }
    cur = { s: i, e: i, v: [m] };
  }
  close();
  if (!notes.length) return notes;
  const sorted = notes.map((n) => n[2]).sort((a, b) => a - b);
  const med = sorted[sorted.length >> 1];
  return notes.filter((n) => Math.abs(n[2] - med) <= 12);
}

/** Text → Zeilen ohne Timing (Leerzeilen/Satzzeichen trennen lange Zeilen). */
export function textToLines(text) {
  const out = [];
  for (const raw of text.split(/\n+/)) {
    const words = raw.trim().split(/\s+/).filter(Boolean);
    let cur = [];
    for (const w of words) {
      cur.push(w);
      if (cur.length >= 8 || (cur.length >= 4 && /[,;:.!?]$/.test(w))) { out.push(cur); cur = []; }
    }
    if (cur.length) out.push(cur);
  }
  return out;
}

/**
 * Aus getappten Zeilen-Startzeiten Lyrics mit Wort-Timing bauen.
 * Wörter werden nach Silbenlänge über die Zeile verteilt.
 */
export function buildTimedLines(lineWords, starts, duration) {
  return lineWords.map((words, i) => {
    const t0 = starts[i];
    const nextStart = i + 1 < starts.length ? starts[i + 1] : Math.min(duration, t0 + 6);
    const t1 = Math.max(t0 + 0.5, Math.min(nextStart - 0.15, t0 + words.length * 0.55 + 0.6));
    const weights = words.map((w) => Math.max(1, w.replace(/[^\p{L}]/gu, '').length));
    const total = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    return {
      t0, t1, v: null, adlib: false,
      words: words.map((w, k) => {
        const a = t0 + ((t1 - t0) * acc) / total;
        acc += weights[k];
        return [w, +a.toFixed(3), +(t0 + ((t1 - t0) * acc) / total).toFixed(3)];
      }),
    };
  });
}
