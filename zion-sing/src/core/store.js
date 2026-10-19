// Persistenz: Profil, Fortschritt, Erfolge (localStorage) + eigene Songs (IndexedDB).

const KEY = 'zionSing.v1';

const DEFAULTS = {
  profile: {
    name: '',
    range: null,          // [tiefste, höchste] MIDI-Note
    voiceType: null,
    notation: 'de',
    difficulty: 'mittel',
    latencyMs: null,      // null = automatisch
    echoCancel: true,
    dailyGoalMin: 10,
    lyricsMode: 'all',    // 'all' | 'learn' | 'memory'
    guideVocal: 0.6,
    onboarded: false,
  },
  stats: {
    xp: 0,
    seconds: 0,
    sessions: 0,
    streak: { count: 0, last: null },
    daily: {},            // 'YYYY-MM-DD' → gesungene Sekunden
    history: [],          // { songId, title, score, stars, date, mode, seconds }
    best: {},             // songId → { score, stars }
    lessons: {},          // lessonId → { stars, date }
    stages: {},           // songId → { basic: {score, stars}, easy: …, … }
    warmups: {},          // 'YYYY-MM-DD' → true (tägliches 5-Minuten-Warm-up erledigt)
    achievements: {},     // id → Datum
  },
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw) return { profile: { ...DEFAULTS.profile, ...raw.profile }, stats: { ...DEFAULTS.stats, ...raw.stats } };
  } catch (_) { /* privater Modus o. Ä. */ }
  return structuredClone(DEFAULTS);
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* ignorieren */ }
  listeners.forEach((fn) => fn(state));
}

export const store = {
  get profile() { return state.profile; },
  get stats() { return state.stats; },
  setProfile(patch) { Object.assign(state.profile, patch); save(); },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  reset() { state = structuredClone(DEFAULTS); save(); },
};

export function today(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function levelFor(xp) {
  const level = Math.floor(Math.sqrt(xp / 120)) + 1;
  const cur = (level - 1) ** 2 * 120, next = level ** 2 * 120;
  return { level, progress: (xp - cur) / (next - cur), toNext: next - xp };
}

/** Tagesserie aktualisieren (bei jeder gesungenen Session). */
function touchStreak(s) {
  const t = today();
  if (s.streak.last === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  s.streak.count = s.streak.last === today(y) ? s.streak.count + 1 : 1;
  s.streak.last = t;
}

export function currentStreak() {
  const s = state.stats.streak;
  const y = new Date(); y.setDate(y.getDate() - 1);
  return s.last === today() || s.last === today(y) ? s.count : 0;
}

export const ACHIEVEMENTS = [
  { id: 'first_song', icon: '🎤', name: 'Erster Auftritt', desc: 'Singe deinen ersten Song.' },
  { id: 'three_stars', icon: '⭐', name: 'Drei Sterne', desc: 'Hole 3 Sterne in einem Song.' },
  { id: 'all_songs', icon: '📀', name: 'Ganzes Album', desc: 'Singe alle drei Offenbarungs-Songs.' },
  { id: 'range_test', icon: '🎚️', name: 'Stimme vermessen', desc: 'Mache den Stimmumfang-Test.' },
  { id: 'warmup5', icon: '🔥', name: 'Aufgewärmt', desc: 'Schließe 5 Übungen ab.' },
  { id: 'streak3', icon: '📅', name: 'Drei Tage am Stück', desc: 'Singe 3 Tage hintereinander.' },
  { id: 'streak7', icon: '🏆', name: 'Wochen-Serie', desc: 'Singe 7 Tage hintereinander.' },
  { id: 'combo25', icon: '⚡', name: 'Combo-Meister', desc: '25 Noten in Folge getroffen.' },
  { id: 'memory', icon: '🧠', name: 'Auswendig!', desc: 'Singe einen Song im Auswendig-Modus mit 70+ Punkten.' },
  { id: 'own_song', icon: '🎼', name: 'Eigener Song', desc: 'Importiere einen eigenen Song.' },
  { id: 'ten_sessions', icon: '💪', name: 'Dranbleiben', desc: '10 Sessions gesungen.' },
  { id: 'hour', icon: '⏱️', name: 'Eine Stunde Gesang', desc: 'Insgesamt 60 Minuten gesungen.' },
  { id: 'extreme', icon: '💎', name: 'Extrem gut', desc: 'Bestehe eine Song-Stufe „Extreme“.' },
  { id: 'studio', icon: '🎙️', name: 'Im Studio', desc: 'Speichere deine erste Studio-Aufnahme.' },
  { id: 'daily3', icon: '☀️', name: 'Morgenroutine', desc: 'Mache das tägliche Warm-up an 3 Tagen.' },
];

/** Erfolg vergeben; gibt das Achievement zurück, falls neu. */
export function unlock(id) {
  if (state.stats.achievements[id]) return null;
  state.stats.achievements[id] = today();
  save();
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}

/**
 * Session verbuchen. Gibt { xp, newBest, unlocked:[...] } zurück.
 * entry: { songId, title, score, stars, mode, seconds, bestCombo, lyricsMode, kind:'song'|'lesson' }
 */
export function recordSession(entry) {
  const s = state.stats;
  touchStreak(s);
  s.sessions++;
  s.seconds += entry.seconds;
  const t = today();
  s.daily[t] = (s.daily[t] || 0) + entry.seconds;
  const xp = Math.round(10 + entry.score * Math.min(3, entry.seconds / 60) * 0.6 + entry.stars * 15);
  s.xp += xp;
  let newBest = false;
  let stageUnlocked = null;
  if (entry.kind === 'lesson') {
    const prev = s.lessons[entry.songId];
    if (!prev || prev.stars < entry.stars) s.lessons[entry.songId] = { stars: entry.stars, date: t };
    if (entry.songId === 'daily') s.warmups[t] = true;
  } else {
    if (entry.stage) {
      const st = (s.stages[entry.songId] = s.stages[entry.songId] || {});
      const before = st[entry.stage];
      if (!before || entry.score > before.score) st[entry.stage] = { score: entry.score, stars: entry.stars };
      if (entry.stars >= 2 && (!before || before.stars < 2)) stageUnlocked = entry.stage;
    }
    const prev = s.best[entry.songId];
    const wholeSong = !entry.stage || ['medium', 'hard', 'extreme'].includes(entry.stage);
    if (entry.mode === 'full' && wholeSong && (!prev || entry.score > prev.score)) {
      s.best[entry.songId] = { score: entry.score, stars: entry.stars };
      newBest = true;
    }
  }
  s.history.unshift({ songId: entry.songId, title: entry.title, score: entry.score, stars: entry.stars,
    date: new Date().toISOString(), mode: entry.mode, seconds: Math.round(entry.seconds), kind: entry.kind });
  s.history = s.history.slice(0, 200);
  save();

  const unlocked = [];
  const tryU = (cond, id) => { if (cond) { const a = unlock(id); if (a) unlocked.push(a); } };
  tryU(entry.kind !== 'lesson', 'first_song');
  tryU(entry.stars >= 3 && entry.kind !== 'lesson', 'three_stars');
  tryU(['offb_2_12_29', 'offb_8_7_13', 'offb_13_10_18'].every((id) => s.history.some((h) => h.songId === id)), 'all_songs');
  tryU(Object.keys(s.lessons).length >= 5, 'warmup5');
  tryU(s.streak.count >= 3, 'streak3');
  tryU(s.streak.count >= 7, 'streak7');
  tryU((entry.bestCombo || 0) >= 25, 'combo25');
  tryU(entry.lyricsMode === 'memory' && entry.score >= 70, 'memory');
  tryU(s.sessions >= 10, 'ten_sessions');
  tryU(s.seconds >= 3600, 'hour');
  tryU(entry.stage === 'extreme' && entry.stars >= 2, 'extreme');
  tryU(Object.keys(s.warmups).length >= 3, 'daily3');
  return { xp, newBest, unlocked, stageUnlocked };
}

// ---------- IndexedDB: eigene Songs + Studio-Aufnahmen (Audio-Blobs) ----------
const DB = 'zionSingDB';
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 2);
    r.onupgradeneeded = () => {
      for (const name of ['songs', 'recordings']) {
        if (!r.result.objectStoreNames.contains(name)) r.result.createObjectStore(name, { keyPath: 'id' });
      }
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx(storeName, mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(storeName, mode);
    const out = fn(t.objectStore(storeName));
    t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
    t.onerror = () => rej(t.error);
  });
}
function objectStore(name) {
  return {
    async all() { try { return (await tx(name, 'readonly', (s) => s.getAll())) || []; } catch (_) { return []; } },
    async get(id) { return tx(name, 'readonly', (s) => s.get(id)); },
    async put(rec) { return tx(name, 'readwrite', (s) => s.put(rec)); },
    async remove(id) { return tx(name, 'readwrite', (s) => s.delete(id)); },
  };
}
export const customSongs = objectStore('songs');
/** Studio-Aufnahmen: { id, songId, title, ref, score, stars, date, seconds, blob } */
export const recordings = objectStore('recordings');
