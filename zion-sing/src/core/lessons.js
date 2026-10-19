// Gesangstraining: Übungen werden passend zu deinem Stimmumfang erzeugt.
// Jede Übung = Folge von Phrasen: erst hören (Klavier spielt vor, „L“-Noten),
// dann nachsingen (bewertete Noten). Notenformat: [start, dauer, midi, flag?]

export function baseNote(profile) {
  const speak = profile && profile.speakingNote;
  if (profile && profile.range) {
    const [lo, hi] = profile.range;
    const fromRange = lo + (hi - lo) * 0.35;
    // Sprechstimme ist ein guter Anker für die bequeme Lage (wie im Simply-Sing-Stimmtest)
    return Math.round(speak ? (fromRange + speak + 2) / 2 : fromRange);
  }
  if (speak) return Math.round(speak + 2);
  return 55;
}

/** Baut aus Phrasen (Arrays von [relStart, dauer, Halbtonabstand]) eine Übung. */
function echo(phrases, base, { listen = true, gap = 0.6 } = {}) {
  const notes = [];
  let t = 1.5;
  for (const ph of phrases) {
    const len = Math.max(...ph.map((n) => n[0] + n[1]));
    if (listen) {
      ph.forEach((n) => notes.push([t + n[0], n[1], base + n[2], 'L']));
      t += len + gap;
    }
    ph.forEach((n) => notes.push([t + n[0], n[1], base + n[2]]));
    t += len + gap + 0.4;
  }
  return { notes, duration: t + 1 };
}

const seq = (steps, d = 0.5, rest = 0.05) => steps.map((s, i) => [i * d, d - rest, s]);

export const EXERCISES = {
  sustain: (b) => echo([[[0, 2.5, 0]], [[0, 2.5, 2]], [[0, 2.5, 4]], [[0, 2.5, 5]], [[0, 2.5, 7]]], b),
  scale5: (b) => echo([0, 1, 2, 3, 4].map((k) => seq([0, 2, 4, 5, 7, 5, 4, 2, 0].map((s) => s + k), 0.42)), b - 2),
  arpeggio: (b) => echo([0, 2, 4].map((k) => seq([0, 4, 7, 12, 7, 4, 0].map((s) => s + k), 0.5)), b - 3),
  intervals: (b) => echo([[0, 7], [0, 5], [0, 4], [0, 9], [0, 12]].map(([a, c]) => [[0, 1, a], [1.1, 1.4, c]]), b - 3),
  siren: (b) => {
    const glide = [];
    for (let i = 0; i <= 24; i++) glide.push([i * 0.12, 0.12, Math.round(-2 + (i <= 12 ? i : 24 - i) * 0.9)]);
    return echo([glide, glide.map((n) => [n[0], n[1], n[2] + 2])], b - 2, { listen: true, gap: 0.8 });
  },
  high: (b) => echo([3, 5, 7, 9].map((k) => seq([0, 2, 4, 2, 0].map((s) => s + k), 0.5)), b),
  low: (b) => echo([0, -2, -4, -5].map((k) => seq([0, -2, -4, -2, 0].map((s) => s + k), 0.55)), b),
  octave: (b) => echo([0, 1, 2, 3].map((k) => [[0, 0.9, k], [1, 1.3, k + 12], [2.4, 0.9, k]]), b - 4),
  breath: (b) => echo([[[0, 4, 0]], [[0, 5, 0]], [[0, 6, 0]]], b, { listen: false, gap: 1.6 }),
  /** Tägliches Warm-up (~5 Min.): Atem → lange Töne → Sirene → Leiter → Intervalle → Arpeggio → Höhe → Oktave */
  daily: (b) => chain(['breath', 'sustain', 'siren', 'scale5', 'intervals', 'arpeggio', 'high', 'octave'].map((k) => EXERCISES[k](b))),
};

/** Hängt mehrere Übungen zeitlich hintereinander. */
export function chain(list, pause = 1.5) {
  const notes = [];
  let off = 0;
  for (const ex of list) {
    ex.notes.forEach((n) => notes.push([n[0] + off, n[1], n[2], n[3]].filter((x) => x !== undefined)));
    off += ex.duration + pause;
  }
  return { notes, duration: off };
}

/** Tipp des Tages (rotiert täglich). */
export const TIPS = [
  'Trink vor dem Singen ein Glas lauwarmes Wasser – keine eiskalten Getränke.',
  'Atme in den Bauch, nicht in die Schultern. Die Schultern bleiben unten.',
  'Lächle leicht beim Singen – das hebt den Gaumen und macht den Klang heller.',
  'Hohe Töne nicht lauter, sondern leichter singen.',
  'Hör erst genau hin: Wer die Melodie innerlich hört, trifft sie leichter.',
  'Kurze tägliche Übung bringt mehr als eine lange pro Woche.',
  'Konsonanten deutlich, Vokale lang – so versteht man jedes Wort.',
  'Wenn es kratzt: Pause. Singen darf nie wehtun.',
  'Summen ist das sanfteste Warm-up für die Stimmbänder.',
  'Nimm dich auf und hör zu – du hörst dich von außen anders als von innen.',
  'Steh beim Singen – das gibt dem Atem mehr Raum als Sitzen.',
  'Lerne den Text zuerst rhythmisch zu sprechen, dann zu singen.',
];

export function tipOfTheDay(d = new Date()) {
  return TIPS[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % TIPS.length];
}

/** Kurze Phrase aus einem Song als Nachsing-Übung (Noten relativ zum Grundton). */
export function songPhraseExercise(song, lineFrom, lineTo, base) {
  const l0 = song.lines[lineFrom], l1 = song.lines[lineTo];
  const notes = song.notes.filter((n) => n[0] >= l0.t0 - 0.2 && n[0] <= l1.t1 + 0.2);
  if (!notes.length) return echo([[[0, 2, 0]]], base);
  const sorted = notes.map((n) => n[2]).sort((a, b) => a - b);
  const med = sorted[sorted.length >> 1];
  const start = notes[0][0];
  const ph = notes.map((n) => [n[0] - start, Math.min(n[1], 1.2), n[2] - med]);
  return echo([ph], base);
}

export const COURSE = [
  {
    unit: 'Grundlagen', lessons: [
      { id: 'l1', title: 'Atem & Haltung', ex: 'breath', tips: [
        'Stell dich aufrecht hin, Schultern locker, Knie leicht gebeugt.',
        'Atme tief in den Bauch – die Hand auf dem Bauch soll sich nach außen bewegen.',
        'Halte einen bequemen Ton so ruhig und lang wie möglich.'] },
      { id: 'l2', title: 'Töne treffen', ex: 'sustain', tips: [
        'Hör erst genau zu – der Klavierton zeigt dir das Ziel.',
        'Sing auf „mah“ oder „noo“ und halte den Ton gerade auf der Linie.'] },
      { id: 'l3', title: 'Die Fünfton-Leiter', ex: 'scale5', tips: [
        'Do-Re-Mi-Fa-Sol-Fa-Mi-Re-Do: jede Runde einen Halbton höher.',
        'Bleib locker – lieber leiser und sauber als laut und gepresst.'] },
    ],
  },
  {
    unit: 'Tonhöhe', lessons: [
      { id: 'l4', title: 'Dreiklang-Arpeggio', ex: 'arpeggio', tips: [
        'Ein Dreiklang springt: Grundton, Terz, Quinte, Oktave.',
        'Stell dir die Töne wie Treppenstufen vor – denk sie vor dem Singen.'] },
      { id: 'l5', title: 'Intervall-Sprünge', ex: 'intervals', tips: [
        'Quinte, Quarte, Terz, Sexte, Oktave – große Sprünge mit wenig Druck.',
        'Tipp: Denk an bekannte Melodien, die mit diesem Sprung beginnen.'] },
      { id: 'l6', title: 'Sirene', ex: 'siren', tips: [
        'Gleite stufenlos von tief nach hoch und zurück – wie eine Sirene.',
        'Ein Lippenflattern („brrr“) macht es noch leichter.'] },
    ],
  },
  {
    unit: 'Umfang erweitern', lessons: [
      { id: 'l7', title: 'Nach oben', ex: 'high', tips: [
        'Je höher, desto mehr „Kopf“ – denk den Ton nach vorne-oben.',
        'Nicht die Lautstärke steigern, nur die Tonhöhe.'] },
      { id: 'l8', title: 'Nach unten', ex: 'low', tips: [
        'Tiefe Töne brauchen Entspannung – Kiefer locker lassen.',
        'Lass die Töne „fallen“, statt sie nach unten zu drücken.'] },
      { id: 'l9', title: 'Oktavsprung', ex: 'octave', tips: [
        'Der Oktavsprung verbindet Brust- und Kopfstimme.',
        'Leichter, luftiger Klang oben ist ausdrücklich erlaubt!'] },
    ],
  },
  {
    unit: 'Song-Technik', lessons: [
      { id: 'l10', title: 'Phrase: Die vier Posaunen', song: 'offb_8_7_13', lines: [0, 1], tips: [
        'Erst hören, dann nachsingen – genau die Melodie aus dem Song.',
        'Achte auf die Einsätze: „Und der erste posaunte …“'] },
      { id: 'l11', title: 'Phrase: Die Zahl des Tieres', song: 'offb_13_10_18', lines: [0, 1], tips: [
        'Ruhige, getragene Linie – bleib auf dem Atem.'] },
      { id: 'l12', title: 'Phrase: Pergamon', song: 'offb_2_12_29', lines: [5, 6], tips: [
        'Rhythmisch und sprechnah – deutliche Konsonanten.'] },
    ],
  },
];

export const DAILY = { id: 'daily', title: 'Tägliches Warm-up', ex: 'daily', min: 5,
  tips: ['5 Minuten für Atem, Tonhöhe und Selbstvertrauen.', 'Erst atmen, dann lange Töne, Sirene, Leiter, Arpeggio und Oktavsprung.', 'Sing locker – Warm-up heißt aufwärmen, nicht anstrengen.'] };

export const WARMUPS = [
  { id: 'w_sustain', title: 'Lange Töne', ex: 'sustain', min: 1 },
  { id: 'w_scale', title: 'Fünfton-Leiter', ex: 'scale5', min: 1 },
  { id: 'w_siren', title: 'Sirene', ex: 'siren', min: 1 },
  { id: 'w_arp', title: 'Arpeggio', ex: 'arpeggio', min: 1 },
  { id: 'w_oct', title: 'Oktavsprung', ex: 'octave', min: 1 },
  { id: 'w_breath', title: 'Atem-Ausdauer', ex: 'breath', min: 1 },
];

export function findLesson(id) {
  for (const u of COURSE) for (const l of u.lessons) if (l.id === id) return { ...l, unit: u.unit };
  if (id === DAILY.id) return { ...DAILY, unit: 'Warm-up' };
  const w = WARMUPS.find((x) => x.id === id);
  return w ? { ...w, tips: ['Kurzes Warm-up: erst hören, dann nachsingen.'] } : null;
}
