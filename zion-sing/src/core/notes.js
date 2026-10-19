// Noten-Mathematik: MIDI ↔ Hz, Notennamen, Stimmlagen, Oktav-Anpassung.

export const A4 = 440;

export function hzToMidi(hz) {
  return 69 + 12 * Math.log2(hz / A4);
}

export function midiToHz(m) {
  return A4 * Math.pow(2, (m - 69) / 12);
}

const NAMES_DE = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'H'];
const NAMES_INT = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NAMES_SOLF = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];

/** notation: 'de' (C D E … H), 'int' (… B), 'solf' (Do Re Mi) */
export function noteName(midi, notation = 'de', withOctave = true) {
  const m = Math.round(midi);
  const table = notation === 'solf' ? NAMES_SOLF : notation === 'int' ? NAMES_INT : NAMES_DE;
  const name = table[((m % 12) + 12) % 12];
  return withOctave ? name + (Math.floor(m / 12) - 1) : name;
}

/** Abweichung in Cent zur nächsten Halbtonstufe (-50 … +50). */
export function centsOff(midi) {
  return Math.round((midi - Math.round(midi)) * 100);
}

export const VOICE_TYPES = [
  { id: 'bass', name: 'Bass', lo: 40, hi: 64, desc: 'Tief, warm und tragend.' },
  { id: 'bariton', name: 'Bariton', lo: 45, hi: 69, desc: 'Die häufigste Männerstimme – voll in der Mitte.' },
  { id: 'tenor', name: 'Tenor', lo: 48, hi: 72, desc: 'Hell und kraftvoll in der Höhe.' },
  { id: 'alt', name: 'Alt', lo: 53, hi: 77, desc: 'Tiefe Frauenstimme – dunkel und rund.' },
  { id: 'mezzo', name: 'Mezzosopran', lo: 57, hi: 81, desc: 'Flexibel zwischen Tiefe und Höhe.' },
  { id: 'sopran', name: 'Sopran', lo: 60, hi: 84, desc: 'Hoch, klar und strahlend.' },
];

/** Stimmlage mit der größten Überlappung zum gemessenen Umfang [lo, hi]. */
export function classifyVoice(lo, hi) {
  let best = VOICE_TYPES[1], bestScore = -Infinity;
  for (const v of VOICE_TYPES) {
    const overlap = Math.min(hi, v.hi) - Math.max(lo, v.lo);
    const centre = -Math.abs((lo + hi) / 2 - (v.lo + v.hi) / 2) * 0.3;
    const s = overlap + centre;
    if (s > bestScore) { bestScore = s; best = v; }
  }
  return best;
}

/**
 * Beste Transposition (Halbtöne), damit die Song-Noten möglichst im
 * Stimmumfang liegen. Bevorzugt ganze Oktaven (klingt natürlich), sonst
 * kleine Verschiebungen. Gibt { octave, semis, fit } zurück.
 */
export function fitToRange(notes, userLo, userHi) {
  if (!notes.length || userLo == null || userHi == null) return { octave: 0, semis: 0, fit: 1 };
  const total = notes.reduce((a, n) => a + n[1], 0);
  const fitFor = (shift) => notes.reduce((a, n) => {
    const p = n[2] + shift;
    return a + (p >= userLo - 0.5 && p <= userHi + 0.5 ? n[1] : 0);
  }, 0) / total;
  let best = { octave: 0, semis: 0, fit: fitFor(0) };
  for (const o of [-2, -1, 1, 2]) {
    const f = fitFor(o * 12);
    if (f > best.fit + 0.02) best = { octave: o, semis: 0, fit: f };
  }
  for (let s = -5; s <= 5; s++) {
    if (!s) continue;
    const f = fitFor(best.octave * 12 + s);
    if (f > best.fit + 0.08 + Math.abs(s) * 0.01) best = { octave: best.octave, semis: s, fit: f };
  }
  return best;
}

/** Faltet einen Fehler (in Halbtönen) auf -6 … +6 (Oktave egal). */
export function foldOctave(err) {
  return ((((err + 6) % 12) + 12) % 12) - 6;
}
