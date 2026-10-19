// Bewertung: vergleicht die gesungene Tonhöhe Frame für Frame mit den Ziel-Noten.
import { foldOctave } from './notes.js';

export const LEVELS = {
  leicht: { id: 'leicht', label: 'Leicht', tol: 2.0, octaveFree: true, desc: '±2 Halbtöne, Oktave egal' },
  mittel: { id: 'mittel', label: 'Mittel', tol: 1.2, octaveFree: true, desc: '±1 Halbton, Oktave egal' },
  profi: { id: 'profi', label: 'Profi', tol: 0.6, octaveFree: false, desc: '±½ Halbton, exakte Oktave' },
};

export function starsFor(score) {
  return score >= 85 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
}

export function praiseFor(acc) {
  if (acc == null) return null;
  if (acc >= 0.85) return { text: 'Perfekt!', tier: 3 };
  if (acc >= 0.65) return { text: 'Super!', tier: 2 };
  if (acc >= 0.4) return { text: 'Gut!', tier: 1 };
  return { text: 'Weiter so!', tier: 0 };
}

/** Index der Note, die zum Zeitpunkt t klingt (oder -1). notes sortiert nach Start. */
export function activeNoteAt(notes, t) {
  let lo = 0, hi = notes.length - 1, idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (notes[mid][0] <= t) { idx = mid; lo = mid + 1; } else hi = mid - 1;
  }
  if (idx >= 0 && t < notes[idx][0] + notes[idx][1]) return idx;
  return -1;
}

export class Scorer {
  /**
   * @param {Array<[number,number,number]>} notes  [start, dauer, midi] – bereits transponiert
   * @param {Array} lines                            Lyrics-Zeilen ({t0,t1})
   * @param {{tol:number, octaveFree:boolean, from?:number, to?:number}} opts
   */
  constructor(notes, lines, opts) {
    this.notes = notes;
    this.lines = lines || [];
    this.tol = opts.tol;
    this.octaveFree = opts.octaveFree;
    this.from = opts.from ?? 0;
    this.to = opts.to ?? Infinity;
    this.active = new Float32Array(notes.length);
    this.hit = new Float32Array(notes.length);
    this.errSum = new Float32Array(notes.length);
    this.trend = 0; // geglätteter, vorzeichenbehafteter Fehler (für „höher/tiefer“)
    this.combo = 0;
    this.bestCombo = 0;
    this._lastNote = -1;
  }

  inWindow(i) {
    const n = this.notes[i];
    if (n[3] === 'L') return false; // Vorspiel-Noten (nur hören) zählen nicht
    return n[0] + n[1] > this.from && n[0] < this.to;
  }

  /** Fehler in Halbtönen (gefaltet, wenn Oktave egal). */
  errorFor(target, userMidi) {
    const e = userMidi - target;
    return this.octaveFree ? foldOctave(e) : e;
  }

  /**
   * Ein Analyse-Frame.
   * @returns {{idx:number, target:number|null, err:number|null, hit:boolean}}
   */
  update(t, userMidi, dt) {
    const idx = activeNoteAt(this.notes, t);
    if (idx !== this._lastNote) {
      if (this._lastNote >= 0) this._closeNote(this._lastNote);
      this._lastNote = idx;
    }
    if (idx < 0 || !this.inWindow(idx)) return { idx, target: null, err: null, hit: false };
    const n = this.notes[idx];
    const grace = Math.min(0.08, n[1] * 0.2); // Einschwingzeit zählt nicht
    if (t - n[0] < grace) return { idx, target: n[2], err: null, hit: false };
    this.active[idx] += dt;
    if (userMidi == null) {
      this.trend *= 0.9;
      return { idx, target: n[2], err: null, hit: false };
    }
    const err = this.errorFor(n[2], userMidi);
    const hit = Math.abs(err) <= this.tol;
    if (hit) this.hit[idx] += dt;
    this.errSum[idx] += Math.abs(err) * dt;
    this.trend = this.trend * 0.85 + err * 0.15;
    return { idx, target: n[2], err, hit };
  }

  _closeNote(i) {
    if (!this.inWindow(i) || this.active[i] <= 0) return;
    if (this.noteScore(i) >= 0.6) {
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
    } else this.combo = 0;
  }

  /** 0…1 – 80 % getroffene Zeit zählen als voller Treffer. */
  noteScore(i) {
    const a = this.active[i];
    if (a <= 0) return 0;
    return Math.min(1, this.hit[i] / a / 0.8);
  }

  /** Live-Hinweis: 'up' | 'down' | null */
  hint() {
    if (Math.abs(this.trend) < this.tol * 0.9) return null;
    return this.trend < 0 ? 'up' : 'down';
  }

  lineAccuracy(li, upTo = Infinity) {
    const l = this.lines[li];
    if (!l) return null;
    let w = 0, s = 0;
    for (let i = 0; i < this.notes.length; i++) {
      const n = this.notes[i];
      const mid = n[0] + n[1] / 2;
      if (mid < l.t0 - 0.25 || mid > l.t1 + 0.25 || !this.inWindow(i) || n[0] > upTo) continue;
      w += n[1];
      s += this.noteScore(i) * n[1];
    }
    return w ? s / w : null;
  }

  summary(upTo = Infinity) {
    let w = 0, s = 0, hits = 0, total = 0;
    for (let i = 0; i < this.notes.length; i++) {
      const n = this.notes[i];
      if (!this.inWindow(i) || n[0] > upTo) continue;
      total++;
      w += n[1];
      const ns = this.noteScore(i);
      s += ns * n[1];
      if (ns >= 0.6) hits++;
    }
    const score = w ? Math.round((s / w) * 100) : 0;
    const perLine = this.lines.map((_, li) => this.lineAccuracy(li, upTo));
    return { score, stars: starsFor(score), notesHit: hits, notesTotal: total, perLine, bestCombo: this.bestCombo };
  }
}
