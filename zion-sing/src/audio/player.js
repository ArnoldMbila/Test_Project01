// Song-Wiedergabe: Instrumental + Leitstimme getrennt regelbar, Tempo
// (tonhöhenerhaltend), Tonart-Transposition (AudioWorklet) und Karaoke-Filter
// für eigene Songs (Mitten-Auslöschung L−R).
import { audioCtx } from './engine.js';

const SHIFTER_SRC = `
class ZsPitchShifter extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'ratio', defaultValue: 1, minValue: 0.25, maxValue: 4 }]; }
  constructor() {
    super();
    this.N = 8192; this.win = 2048;
    this.buf = [new Float32Array(this.N), new Float32Array(this.N)];
    this.w = 0; this.phase = 0;
  }
  read(b, pos) {
    const N = this.N; pos = ((pos % N) + N) % N;
    const i = Math.floor(pos), f = pos - i;
    return b[i] * (1 - f) + b[(i + 1) % N] * f;
  }
  process(inputs, outputs, params) {
    const input = inputs[0], output = outputs[0];
    const ratio = params.ratio[0];
    const n = output[0].length, chs = output.length;
    for (let s = 0; s < n; s++) {
      this.phase += (1 - ratio) / this.win;
      if (this.phase >= 1) this.phase -= 1; else if (this.phase < 0) this.phase += 1;
      const p2 = (this.phase + 0.5) % 1;
      const g1 = Math.sin(Math.PI * this.phase) ** 2, g2 = Math.sin(Math.PI * p2) ** 2;
      for (let c = 0; c < chs; c++) {
        const b = this.buf[c] || this.buf[0];
        const x = input[c] ? input[c][s] : (input[0] ? input[0][s] : 0);
        b[this.w] = x;
        output[c][s] = this.read(b, this.w - this.phase * this.win - 2) * g1 + this.read(b, this.w - p2 * this.win - 2) * g2;
      }
      this.w = (this.w + 1) % this.N;
    }
    return true;
  }
}
registerProcessor('zs-pitch-shifter', ZsPitchShifter);`;

let workletReady = null;
function loadWorklet(c) {
  if (!c.audioWorklet) return Promise.resolve(false);
  if (!workletReady) {
    const url = URL.createObjectURL(new Blob([SHIFTER_SRC], { type: 'application/javascript' }));
    workletReady = c.audioWorklet.addModule(url).then(() => true, () => false);
  }
  return workletReady;
}

function makeEl(src) {
  const el = new Audio();
  el.crossOrigin = 'anonymous';
  el.preload = 'auto';
  el.src = src;
  el.preservesPitch = true;
  el.webkitPreservesPitch = true;
  return el;
}

export class SongPlayer {
  /**
   * @param {{instrumental?:string, vocals?:string, mix?:string}} tracks  URLs
   */
  constructor(tracks) {
    const c = audioCtx();
    this.c = c;
    this.mode = tracks.mix ? 'mix' : 'stems';
    this.els = [];
    this.bus = c.createGain();
    this.master = c.createGain();
    this.musicGain = c.createGain();
    this.vocalGain = c.createGain();
    this.musicGain.connect(this.bus);
    this.vocalGain.connect(this.bus);
    this.master.connect(c.destination);
    this.bus.connect(this.master);
    this.shifter = null;
    this.transpose = 0;
    this.onended = null;

    if (this.mode === 'stems') {
      this.main = makeEl(tracks.instrumental);
      this.voc = makeEl(tracks.vocals);
      c.createMediaElementSource(this.main).connect(this.musicGain);
      c.createMediaElementSource(this.voc).connect(this.vocalGain);
      this.els = [this.main, this.voc];
    } else {
      // Eigener Song: Original (= „mit Gesang“) und L−R-Karaoke (= „ohne Gesang“) überblenden
      this.main = makeEl(tracks.mix);
      this.voc = null;
      const src = c.createMediaElementSource(this.main);
      src.connect(this.vocalGain);
      const split = c.createChannelSplitter(2);
      const l = c.createGain(), r = c.createGain();
      r.gain.value = -1;
      src.connect(split);
      split.connect(l, 0);
      split.connect(r, 1);
      const kara = c.createGain();
      kara.channelCount = 1;
      kara.channelCountMode = 'explicit';
      l.connect(kara); r.connect(kara);
      kara.connect(this.musicGain);
      this.els = [this.main];
    }
    this.main.addEventListener('ended', () => this.onended && this.onended());
  }

  ready() {
    return Promise.all(this.els.map((el) => new Promise((res) => {
      if (el.readyState >= 3) return res();
      const done = () => { el.removeEventListener('canplaythrough', done); el.removeEventListener('error', done); res(); };
      el.addEventListener('canplaythrough', done);
      el.addEventListener('error', done);
      setTimeout(done, 8000);
    })));
  }

  get time() { return this.main.currentTime; }
  get duration() { return this.main.duration || 0; }
  get playing() { return !this.main.paused; }

  async play() {
    audioCtx();
    if (this.voc) this.voc.currentTime = this.main.currentTime;
    await Promise.all(this.els.map((el) => el.play().catch(() => {})));
  }

  pause() { this.els.forEach((el) => el.pause()); }

  seek(t) {
    const tt = Math.max(0, Math.min(t, (this.duration || 1e9) - 0.05));
    this.els.forEach((el) => { el.currentTime = tt; });
  }

  /** Muss regelmäßig aufgerufen werden: hält die Leitstimme synchron. */
  tick() {
    if (this.voc && !this.main.paused && Math.abs(this.voc.currentTime - this.main.currentTime) > 0.06) {
      this.voc.currentTime = this.main.currentTime;
    }
  }

  setRate(r) { this.els.forEach((el) => { el.playbackRate = r; }); }

  /** Leitstimme 0…1 (bei eigenen Songs: Überblendung Original ↔ Karaoke-Filter). */
  setVocal(v) {
    this.vocalGain.gain.value = this.mode === 'stems' ? v * 1.0 : v;
    if (this.mode === 'mix') this.musicGain.gain.value = (1 - v) * 0.9;
  }

  setMusic(v) {
    if (this.mode === 'stems') this.musicGain.gain.value = v;
    else this.master.gain.value = v;
  }

  /** Tonart in Halbtönen verschieben (−6 … +6). */
  async setTranspose(semi) {
    this.transpose = semi;
    if (semi && !this.shifter) {
      if (!(await loadWorklet(this.c))) return false;
      this.shifter = new AudioWorkletNode(this.c, 'zs-pitch-shifter', { outputChannelCount: [2] });
    }
    this.bus.disconnect();
    if (semi && this.shifter) {
      this.shifter.parameters.get('ratio').value = Math.pow(2, semi / 12);
      this.bus.connect(this.shifter);
      this.shifter.connect(this.master);
    } else {
      if (this.shifter) this.shifter.disconnect();
      this.bus.connect(this.master);
    }
    return true;
  }

  /** Knoten, der die hörbare Musik liefert (für die Aufnahme). */
  get outputNode() { return this.shifter && this.transpose ? this.shifter : this.bus; }

  destroy() {
    this.pause();
    this.els.forEach((el) => { el.removeAttribute('src'); el.load(); });
    try { this.master.disconnect(); } catch (_) {}
  }
}
