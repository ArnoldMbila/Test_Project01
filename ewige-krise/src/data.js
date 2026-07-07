/* =========================================================
 * EWIGE KRISE — Spieldaten
 * Original-Charaktere nach eigenen Design-Sheets.
 * Elemente: physisch, feuer, blitz, erde, licht, schatten
 * ========================================================= */

const ELEMENT_NAMES = {
  physisch: 'Physisch', feuer: 'Feuer', blitz: 'Blitz',
  erde: 'Erde', licht: 'Licht', schatten: 'Schatten'
};

const ELEMENT_COLORS = {
  physisch: '#c8c8d0', feuer: '#e0742a', blitz: '#e8d44a',
  erde: '#a07a3a', licht: '#ffe98a', schatten: '#8a5ae0'
};

/* ---------------- Fähigkeiten ----------------
 * pow      : Multiplikator auf ATK bzw. MAG
 * stat     : 'atk' | 'mag'
 * target   : 'enemy' | 'all-enemies' | 'ally' | 'party' | 'self'
 * breakPow : Zusatzfüllung der Bruch-Leiste (Prozentpunkte)
 * hits     : Anzahl Treffer
 */
const SKILLS = {
  angriff: {
    name: 'Angriff', mp: 0, stat: 'atk', pow: 1.0, element: 'physisch',
    target: 'enemy', breakPow: 8, hits: 1,
    desc: 'Einfacher Angriff. Kostet nichts, lädt 4 MP auf.'
  },
  verteidigen: {
    name: 'Verteidigen', mp: 0, target: 'self', guard: true,
    desc: 'Halbiert erlittenen Schaden bis zum nächsten Zug.'
  },

  /* Aurel */
  schildwall: {
    name: 'Schildwall', mp: 10, target: 'party', buff: { def: 0.4, dauer: 3 },
    desc: 'Erhöht die Verteidigung der Gruppe 3 Züge lang um 40 %.'
  },
  urteil: {
    name: 'Gerechtes Urteil', mp: 14, stat: 'atk', pow: 1.9, element: 'licht',
    target: 'enemy', breakPow: 14, hits: 1,
    desc: 'Heiliger Hieb mit hoher Bruch-Wirkung.'
  },
  lichtlanze: {
    name: 'Lichtlanze', mp: 20, stat: 'mag', pow: 1.6, element: 'licht',
    target: 'all-enemies', breakPow: 6, hits: 1,
    desc: 'Lichtschaden auf alle Gegner.'
  },

  /* Elior */
  heilung: {
    name: 'Heilwort', mp: 12, target: 'ally', heal: 0.4,
    desc: 'Heilt einen Verbündeten um 40 % seiner max. LP.'
  },
  segen: {
    name: 'Segen', mp: 10, target: 'party', buff: { atk: 0.3, dauer: 3 },
    desc: 'Erhöht den Angriff der Gruppe 3 Züge lang um 30 %.'
  },
  donnerwort: {
    name: 'Donnerwort', mp: 16, stat: 'mag', pow: 1.7, element: 'blitz',
    target: 'enemy', breakPow: 10, hits: 1,
    desc: 'Blitzschlag auf einen Gegner.'
  },

  /* Seraph */
  wortklinge: {
    name: 'Klinge des Wortes', mp: 18, stat: 'mag', pow: 2.2, element: 'licht',
    target: 'enemy', breakPow: 10, hits: 1,
    desc: 'Schneidendes Licht — massiver Schaden an einem Gegner.'
  },
  flammenzunge: {
    name: 'Flammenzunge', mp: 14, stat: 'mag', pow: 1.6, element: 'feuer',
    target: 'enemy', breakPow: 8, hits: 1,
    desc: 'Feuerschaden auf einen Gegner.'
  },
  sternenfall: {
    name: 'Sternenfall', mp: 24, stat: 'mag', pow: 1.4, element: 'licht',
    target: 'all-enemies', breakPow: 8, hits: 1,
    desc: 'Lichtschauer auf alle Gegner.'
  },

  /* Kade */
  schattenhieb: {
    name: 'Schattenhieb', mp: 12, stat: 'atk', pow: 1.8, element: 'schatten',
    target: 'enemy', breakPow: 8, hits: 1,
    desc: 'Schneller Hieb aus dem Dunkel.'
  },
  klingentanz: {
    name: 'Klingentanz', mp: 18, stat: 'atk', pow: 0.75, element: 'physisch',
    target: 'enemy', breakPow: 5, hits: 3,
    desc: 'Drei blitzschnelle Treffer auf einen Gegner.'
  },

  /* Malik */
  wuchtschlag: {
    name: 'Wuchtschlag', mp: 12, stat: 'atk', pow: 1.3, element: 'physisch',
    target: 'enemy', breakPow: 30, hits: 1,
    desc: 'Gewaltiger Schlag — füllt die Bruch-Leiste stark.'
  },
  beben: {
    name: 'Beben', mp: 18, stat: 'atk', pow: 1.3, element: 'erde',
    target: 'all-enemies', breakPow: 10, hits: 1,
    desc: 'Erdstoß gegen alle Gegner.'
  }
};

/* ---------------- Limit-Techniken ---------------- */
const LIMITS = {
  aurel: {
    name: 'Imperium Lux', stat: 'atk', pow: 3.2, element: 'licht',
    target: 'all-enemies', breakPow: 25,
    desc: 'Der Kaiser entfesselt das Licht seines Throns über alle Feinde.'
  },
  elior: {
    name: 'Posaunenschall', stat: 'mag', pow: 2.0, element: 'blitz',
    target: 'all-enemies', breakPow: 15, healParty: 0.35,
    desc: 'Ein Schall, der Feinde trifft und die Gruppe um 35 % heilt.'
  },
  seraph: {
    name: 'Klinge der Wahrheit', stat: 'mag', pow: 4.5, element: 'licht',
    target: 'enemy', breakPow: 30,
    desc: 'Die Klinge aus seinem Mund durchschneidet einen Feind.'
  },
  kade: {
    name: 'Nachtsturm', stat: 'atk', pow: 1.1, element: 'schatten',
    target: 'enemy', breakPow: 8, hits: 5,
    desc: 'Fünf Schnitte, schneller als der Blick.'
  },
  malik: {
    name: 'Titanenfaust', stat: 'atk', pow: 3.5, element: 'erde',
    target: 'enemy', breakPow: 60,
    desc: 'Ein Schlag, der jede Panzerung zerbricht.'
  }
};

/* ---------------- Helden ---------------- */
const HEROES = {
  aurel: {
    id: 'aurel', name: 'Kaiser Aurel', rolle: 'Wächter',
    hp: 360, mp: 42, atk: 30, mag: 24, def: 34, spd: 21,
    skills: ['schildwall', 'urteil', 'lichtlanze'],
    beschreibung: 'Der Herrscher im Lorbeerkranz. Hält, was andere bricht.'
  },
  elior: {
    id: 'elior', name: 'Prophet Elior', rolle: 'Seher',
    hp: 280, mp: 60, atk: 20, mag: 34, def: 24, spd: 23,
    skills: ['heilung', 'segen', 'donnerwort'],
    beschreibung: 'Der alte Seher. Seine Worte heilen — oder donnern.'
  },
  seraph: {
    id: 'seraph', name: 'Seraph', rolle: 'Klinge',
    hp: 250, mp: 70, atk: 24, mag: 40, def: 20, spd: 26,
    skills: ['wortklinge', 'flammenzunge', 'sternenfall'],
    beschreibung: 'Augen wie Feuer, Haar wie Wolle, ein Schwert aus Wahrheit.'
  },
  kade: {
    id: 'kade', name: 'Kade', rolle: 'Schatten',
    hp: 290, mp: 48, atk: 36, mag: 18, def: 24, spd: 32,
    skills: ['schattenhieb', 'klingentanz'],
    beschreibung: 'Der Mann im schwarzen Mantel. Erst siehst du nichts — dann ihn.'
  },
  malik: {
    id: 'malik', name: 'Malik', rolle: 'Brecher',
    hp: 330, mp: 44, atk: 34, mag: 16, def: 30, spd: 22,
    skills: ['wuchtschlag', 'beben'],
    beschreibung: 'Ruhige Hände, schwere Schläge. Panzerungen fürchten ihn.'
  }
};

const HERO_ORDER = ['aurel', 'elior', 'seraph', 'kade', 'malik'];

/* Statwachstum pro Level */
function heroStatsAt(heroId, level) {
  const b = HEROES[heroId];
  const f = Math.pow(1.09, level - 1);
  return {
    hp: Math.round(b.hp * f), mp: Math.round(b.mp * Math.pow(1.05, level - 1)),
    atk: Math.round(b.atk * f), mag: Math.round(b.mag * f),
    def: Math.round(b.def * f), spd: b.spd
  };
}

function expForLevel(level) {
  return Math.round(60 * Math.pow(level, 1.6));
}

/* ---------------- Gegner ---------------- */
const ENEMIES = {
  heuschrecke: {
    id: 'heuschrecke', name: 'Heuschrecken-Schwarm', sprite: 'heuschrecke',
    hp: 170, atk: 22, mag: 16, def: 16, spd: 26,
    weak: ['feuer'], resist: ['erde'], breakMax: 60,
    exp: 34, gold: 18, scale: 4,
    attacks: [
      { name: 'Stachelstich', pow: 1.0, element: 'physisch', target: 'hero' },
      { name: 'Schwarmwolke', pow: 0.7, element: 'physisch', target: 'all-heroes' }
    ]
  },
  kriecher: {
    id: 'kriecher', name: 'Aschekriecher', sprite: 'kriecher',
    hp: 220, atk: 26, mag: 14, def: 22, spd: 18,
    weak: ['licht'], resist: ['feuer'], breakMax: 80,
    exp: 42, gold: 24, scale: 4,
    attacks: [
      { name: 'Glutbiss', pow: 1.1, element: 'feuer', target: 'hero' },
      { name: 'Aschewolke', pow: 0.6, element: 'feuer', target: 'all-heroes' }
    ]
  },
  wache: {
    id: 'wache', name: 'Schattenwache', sprite: 'wache',
    hp: 260, atk: 28, mag: 26, def: 24, spd: 24,
    weak: ['licht'], resist: ['schatten'], breakMax: 90,
    exp: 55, gold: 32, scale: 4,
    attacks: [
      { name: 'Dunkelklaue', pow: 1.2, element: 'schatten', target: 'hero' },
      { name: 'Schleier', pow: 0.8, element: 'schatten', target: 'all-heroes' }
    ]
  },
  stern: {
    id: 'stern', name: 'Gefallener Stern', sprite: 'stern', boss: true,
    hp: 700, atk: 30, mag: 32, def: 26, spd: 22,
    weak: ['erde'], resist: ['feuer'], breakMax: 130,
    exp: 160, gold: 120, scale: 5,
    attacks: [
      { name: 'Wermutstrahl', pow: 1.3, element: 'feuer', target: 'hero' },
      { name: 'Sternschnuppenregen', pow: 0.9, element: 'feuer', target: 'all-heroes' },
      { name: 'Kernpuls', pow: 1.6, element: 'feuer', target: 'hero', charge: 'Der Kern glüht auf …' }
    ]
  },
  bestie: {
    id: 'bestie', name: 'Bestie aus der Tiefe', sprite: 'bestie', boss: true,
    hp: 1050, atk: 36, mag: 26, def: 30, spd: 20,
    weak: ['blitz'], resist: ['erde'], breakMax: 160,
    exp: 260, gold: 200, scale: 5,
    attacks: [
      { name: 'Doppelbiss', pow: 1.2, element: 'physisch', target: 'hero' },
      { name: 'Flutwelle', pow: 0.9, element: 'physisch', target: 'all-heroes' },
      { name: 'Lästerbrüllen', pow: 1.7, element: 'schatten', target: 'hero', charge: 'Die Bestie holt tief Luft …' }
    ]
  },
  drache: {
    id: 'drache', name: 'Der Drache', sprite: 'drache', boss: true,
    hp: 1500, atk: 40, mag: 38, def: 34, spd: 24,
    weak: ['licht'], resist: ['feuer', 'schatten'], breakMax: 200,
    exp: 500, gold: 500, scale: 5,
    attacks: [
      { name: 'Feuerodem', pow: 1.2, element: 'feuer', target: 'all-heroes' },
      { name: 'Schwanzfeger', pow: 1.4, element: 'physisch', target: 'hero' },
      { name: 'Sieben Häupter', pow: 0.6, element: 'feuer', target: 'hero', hits: 3 },
      { name: 'Zornesglut', pow: 2.0, element: 'feuer', target: 'all-heroes', charge: 'Alle sieben Häupter glühen …' }
    ]
  }
};

/* ---------------- Kapitel ---------------- */
const CHAPTERS = [
  {
    id: 0, name: 'Kapitel 1 — Die versiegelte Ebene',
    ort: 'Aschefelder', himmel: ['#2a1a30', '#5a2a3a', '#c05a3a'],
    boden: '#3a2a26',
    waves: [
      ['heuschrecke', 'heuschrecke'],
      ['heuschrecke', 'kriecher'],
      ['stern']
    ]
  },
  {
    id: 1, name: 'Kapitel 2 — Die dunkle Küste',
    ort: 'Meer aus Glas', himmel: ['#0e1a2e', '#1e3a54', '#3a6a80'],
    boden: '#1c2a34',
    waves: [
      ['kriecher', 'kriecher', 'heuschrecke'],
      ['wache', 'kriecher'],
      ['bestie']
    ]
  },
  {
    id: 2, name: 'Kapitel 3 — Der Thron des Drachen',
    ort: 'Zerbrochene Stadt', himmel: ['#1a0e0e', '#4a1414', '#8a2a1a'],
    boden: '#2e1a16',
    waves: [
      ['wache', 'wache'],
      ['wache', 'kriecher', 'heuschrecke'],
      ['drache']
    ]
  }
];

/* ---------------- Items ---------------- */
const ITEMS = {
  trank: { name: 'Trank', desc: 'Stellt 120 LP wieder her.', heal: 120 },
  aether: { name: 'Äther', desc: 'Stellt 30 MP wieder her.', mp: 30 },
  elixier: { name: 'Elixier', desc: 'Belebt einen Gefallenen mit 50 % LP.', revive: 0.5 }
};
