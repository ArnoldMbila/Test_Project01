// Song-Stufen wie bei Simply Sing: Basic → Easy → Medium → Hard → Extreme.
// Jede Stufe macht denselben Song schwerer (länger, strengere Bewertung,
// leisere Leitstimme, weniger Text). Ab 2 Sternen wird die nächste frei.
import { store } from './store.js';

export const STAGES = [
  { id: 'basic', label: 'Basic', icon: '🌱', difficulty: 'leicht', vocal: 1, part: 'first', lyrics: 'all',
    desc: 'Ein Abschnitt, laute Leitstimme, großzügige Bewertung' },
  { id: 'easy', label: 'Easy', icon: '🙂', difficulty: 'leicht', vocal: 0.8, part: 'half', lyrics: 'all',
    desc: 'Erste Hälfte des Songs mit Leitstimme' },
  { id: 'medium', label: 'Medium', icon: '🎯', difficulty: 'mittel', vocal: 0.5, part: 'full', lyrics: 'all',
    desc: 'Ganzer Song, Bewertung ±1 Halbton' },
  { id: 'hard', label: 'Hard', icon: '🔥', difficulty: 'mittel', vocal: 0.15, part: 'full', lyrics: 'learn',
    desc: 'Leise Leitstimme, Lücken im Text' },
  { id: 'extreme', label: 'Extreme', icon: '💎', difficulty: 'profi', vocal: 0, part: 'full', lyrics: 'memory',
    desc: 'Ohne Leitstimme, auswendig, exakte Oktave' },
];

export const stageById = (id) => STAGES.find((s) => s.id === id) || null;

/** Zeilen nach Vers gruppieren → Abschnitte { v, from, to }. */
export function sections(song) {
  const out = [];
  song.lines.forEach((l, i) => {
    const last = out[out.length - 1];
    if (last && last.v === l.v) last.to = i;
    else out.push({ v: l.v, from: i, to: i });
  });
  return out;
}

/** Zeilenbereich einer Stufe → { from, to } (Indizes) oder null = ganzer Song. */
export function stagePart(song, stage) {
  const st = typeof stage === 'string' ? stageById(stage) : stage;
  if (!st || st.part === 'full' || !song.lines.length) return null;
  const first = Math.max(0, song.lines.findIndex((l) => !l.adlib));
  const secs = sections(song).filter((s) => s.to >= first);
  if (st.part === 'first') {
    let to = Math.max(first, secs[0].to);
    // mindestens 3 Zeilen bzw. 10 Sekunden
    for (const s of secs) {
      if (to - first + 1 >= 3 && song.lines[to].t1 - song.lines[first].t0 >= 10) break;
      to = Math.max(to, s.to);
    }
    return { from: first, to };
  }
  const t0 = song.lines[first].t0, t1 = song.lines[song.lines.length - 1].t1;
  const mid = t0 + (t1 - t0) / 2;
  const sec = secs.find((s) => song.lines[s.to].t1 >= mid) || secs[secs.length - 1];
  return { from: first, to: sec.to };
}

/** Status aller Stufen eines Songs: [{ ...stage, unlocked, best }] */
export function stageStatus(songId) {
  const rec = store.stats.stages[songId] || {};
  let open = true;
  return STAGES.map((s) => {
    const best = rec[s.id] || null;
    const row = { ...s, unlocked: open, best };
    open = open && !!best && best.stars >= 2;
    return row;
  });
}

/** Stufe, die als Nächstes dran ist: die höchste freigeschaltete. */
export function currentStage(songId) {
  const st = stageStatus(songId).filter((s) => s.unlocked);
  return st[st.length - 1];
}

export function nextStage(id) {
  const i = STAGES.findIndex((s) => s.id === id);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}
