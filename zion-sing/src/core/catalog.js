// Song-Katalog: eingebaute Songs (data/songs.js) + eigene Songs (IndexedDB).
import { customSongs, store } from './store.js';
import { fitToRange, noteName } from './notes.js';

export const BUILTIN = (window.ZS_SONGS || []).map((s) => ({ ...s, builtin: true }));
export const BIBLE = window.ZS_BIBLE || [];

const urlCache = new Map();

function hydrate(rec) {
  if (!urlCache.has(rec.id) && rec.blob) urlCache.set(rec.id, URL.createObjectURL(rec.blob));
  return { ...rec, builtin: false, audio: { mix: urlCache.get(rec.id), cover: null }, blob: undefined };
}

export async function allSongs() {
  const custom = (await customSongs.all()).map(hydrate);
  return [...BUILTIN, ...custom];
}

export async function getSong(id) {
  const b = BUILTIN.find((s) => s.id === id);
  if (b) return b;
  const rec = await customSongs.get(id);
  return rec ? hydrate(rec) : null;
}

/** Wie gut passt ein Song zur Stimme? { fit, octave, semis, label } */
export function songFit(song) {
  const r = store.profile.range;
  if (!r || !song.notes || !song.notes.length) return null;
  const f = fitToRange(song.notes, r[0], r[1]);
  const shift = f.octave * 12 + f.semis;
  let label;
  if (f.fit >= 0.85) label = f.semis ? `passt (Tonart ${f.semis > 0 ? '+' : ''}${f.semis})` : 'passt perfekt';
  else if (f.fit >= 0.6) label = 'gut machbar';
  else label = 'Herausforderung';
  return { ...f, shift, label };
}

/** Sammlungen nach Genre & Stimmung (wie die Song-Kategorien bei Simply Sing). */
const MOODS = {
  offb_2_12_29: ['Rhythmisch', 'Sendschreiben', 'Ermutigend'],
  offb_8_7_13: ['Kraftvoll', 'Posaunen & Siegel', 'Dramatisch'],
  offb_13_10_18: ['Ruhig', 'Prophetie', 'Ernst'],
};
export function moodsOf(song) {
  return [song.genre || 'Eigener Song', ...(MOODS[song.id] || song.moods || [])];
}

export function difficultyOf(song) {
  if (!song.notes || !song.notes.length) return 1;
  const span = song.range ? song.range[1] - song.range[0] : 12;
  const dens = song.notes.length / Math.max(30, song.duration || 180);
  return Math.max(1, Math.min(5, Math.round(span / 6 + dens * 1.5)));
}

export function rangeLabel(song, notation) {
  if (!song.range) return '–';
  return `${noteName(song.range[0], notation)} – ${noteName(song.range[1], notation)}`;
}

/** Volltextsuche über Songs und alle Verse. */
export function searchVerses(q, limit = 30) {
  const n = q.trim().toLowerCase();
  if (n.length < 3) return [];
  const out = [];
  for (const ch of BIBLE) {
    ch.v.forEach((text, i) => {
      if (out.length < limit && text.toLowerCase().includes(n)) out.push({ ch: ch.n, v: i + 1, text });
    });
  }
  return out;
}

export function songForVerse(ch, v) {
  return BUILTIN.find((s) => s.chapter === ch && v >= s.v0 && v <= s.v1) || null;
}

export function verseOfTheDay() {
  const all = [];
  BIBLE.forEach((c) => c.v.forEach((t, i) => all.push({ ch: c.n, v: i + 1, text: t })));
  if (!all.length) return null;
  const d = new Date();
  const seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  return all[(seed * 2654435761) % all.length >>> 0];
}
