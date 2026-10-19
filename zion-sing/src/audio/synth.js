// Kleiner Synthesizer: Referenztöne für Übungen, Metronom und Effekt-Sounds.
import { audioCtx } from './engine.js';
import { midiToHz } from '../core/notes.js';

let master = null;
function out() {
  const c = audioCtx();
  if (!master) {
    master = c.createGain();
    master.gain.value = 0.5;
    master.connect(c.destination);
  }
  return master;
}

/** Weicher, „stimmhafter“ Ton (zwei leicht verstimmte Oszillatoren + Tiefpass). */
export function tone(midi, dur, when = 0, opts = {}) {
  const c = audioCtx();
  const t0 = c.currentTime + Math.max(0, when);
  const vol = opts.vol ?? 0.22;
  const g = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.04);
  g.gain.setValueAtTime(vol, t0 + Math.max(0.05, dur - 0.08));
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  const oscs = [-4, 4].map((det) => {
    const o = c.createOscillator();
    o.type = opts.type || 'triangle';
    o.frequency.setValueAtTime(midiToHz(midi), t0);
    if (opts.glideTo != null) o.frequency.exponentialRampToValueAtTime(midiToHz(opts.glideTo), t0 + dur);
    o.detune.value = det;
    o.connect(lp);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    return o;
  });
  lp.connect(g).connect(out());
  return { stop: () => oscs.forEach((o) => { try { o.stop(); } catch (_) {} }) };
}

/** Plant eine Notenfolge [[start, dauer, midi, glideTo?], …] relativ zu jetzt. */
export function playSequence(notes, offset = 0, opts = {}) {
  const handles = notes.map((n) => tone(n[2], n[1], n[0] + offset, { ...opts, glideTo: n[3] }));
  return { stop: () => handles.forEach((h) => h.stop()) };
}

export function click(when = 0, accent = false) {
  const c = audioCtx();
  const t0 = c.currentTime + when;
  const o = c.createOscillator(), g = c.createGain();
  o.frequency.value = accent ? 1500 : 1000;
  g.gain.setValueAtTime(0.3, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
  o.connect(g).connect(out());
  o.start(t0); o.stop(t0 + 0.06);
}

export const sfx = {
  count(final = false) { tone(final ? 84 : 79, 0.12, 0, { type: 'sine', vol: 0.15 }); },
  perfect() { [76, 79, 84].forEach((m, i) => tone(m, 0.14, i * 0.06, { type: 'sine', vol: 0.08 })); },
  star() { [72, 76, 79, 84, 88].forEach((m, i) => tone(m, 0.18, i * 0.07, { type: 'sine', vol: 0.12 })); },
  level() { [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => tone(m, 0.2, i * 0.06, { type: 'square', vol: 0.05 })); },
  tap() { tone(88, 0.05, 0, { type: 'sine', vol: 0.06 }); },
};
