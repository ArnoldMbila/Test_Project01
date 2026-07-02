// Boot + arcade menu. Loads question banks, evaluates the daily streak,
// renders the menu, and launches/tears down mini-games.

import { initScene, three, disposeGroup, makeGroup, makeBox } from './core/scene3d.js';
import { load, state, level, evaluateDailyStreak } from './core/state.js';
import { loadAllBanks, categories } from './core/questions.js';
import { initHud, showHud, setPrompt, setProgress, showPopup, FEEDBACK_MS } from './core/hud.js';
import { audio } from './core/audio.js';

import { RunnerGame } from './games/runner.js';
import { MatchGame } from './games/match.js';
import { BossGame } from './games/boss.js';
import { OrderGame } from './games/order.js';
import { CardsGame } from './games/cards.js';
import { RhythmGame } from './games/rhythm.js';
import { RaceGame } from './games/race.js';
import { BuilderGame } from './games/builder.js';

const GAMES = [
  { title: 'Wortlauf', desc: '3D-Runner: lauf durch das richtige Tor!', cls: RunnerGame },
  { title: 'Gleichnis-Paare', desc: 'Finde die zusammengehörenden Paare.', cls: MatchGame },
  { title: 'Wächter des Wissens', desc: 'Besiege den Wächter mit Wissen!', cls: BossGame },
  { title: 'Brücke der Zeitalter', desc: 'Baue die Brücke in der richtigen Reihenfolge.', cls: OrderGame },
  { title: 'Karten der Weisheit', desc: 'Spiele die richtige Antwort-Karte.', cls: CardsGame },
  { title: 'Takt der Wahrheit', desc: 'Antworte im Takt für Bonus-XP!', cls: RhythmGame },
  { title: 'Lauf der Boten', desc: 'Gewinne das Rennen gegen den Rivalen.', cls: RaceGame },
  { title: 'Stadt des Lichts', desc: 'Baue deine Stadt mit verdienten Münzen.', cls: BuilderGame },
];

const el = (id) => document.getElementById(id);

let selectedCategory = 'grundstufe';
let activeGame = null;
let idleScene = null;

function renderMenu() {
  // categories
  const catBox = el('menu-categories');
  catBox.innerHTML = '';
  for (const cat of categories()) {
    const btn = document.createElement('button');
    btn.textContent = cat.name.split('–')[0].trim();
    btn.classList.toggle('active', cat.id === selectedCategory);
    btn.onclick = () => {
      audio.click();
      selectedCategory = cat.id;
      renderMenu();
    };
    catBox.appendChild(btn);
  }

  // games
  const gamesBox = el('menu-games');
  gamesBox.innerHTML = '';
  GAMES.forEach((g, i) => {
    const btn = document.createElement('button');
    btn.className = 'game-card';
    btn.innerHTML = `<span class="title">${g.title}</span><span class="desc">${g.desc}</span>`;
    btn.onclick = () => launchGame(i);
    gamesBox.appendChild(btn);
  });

  // stats
  const p = state.profile;
  el('menu-stats').textContent =
    `Lv ${level()} · ${p.xp} XP · ${p.coins} Münzen · Tagesserie: ${p.dailyStreak} 🔥 · Beste Serie: x${p.bestSessionStreak}`;
}

function showMenu() {
  if (activeGame) {
    activeGame.destroy();
    activeGame = null;
  }
  showHud(false);
  setPrompt('');
  setProgress(0, 0);
  startIdleScene();
  renderMenu();
  el('menu').classList.remove('hidden');
}

function launchGame(index) {
  audio.click();
  stopIdleScene();
  el('menu').classList.add('hidden');
  showHud(true);
  activeGame = new GAMES[index].cls({ category: selectedCategory, onExit: showMenu });
  activeGame.start();
}

// slowly rotating decorative blocks behind the menu
function startIdleScene() {
  stopIdleScene();
  idleScene = makeGroup();
  for (let i = 0; i < 14; i++) {
    const s = 0.5 + Math.random() * 1.5;
    makeBox(idleScene,
      [(Math.random() - 0.5) * 24, (Math.random() - 0.5) * 12, 8 + Math.random() * 20],
      [s, s, s],
      [0x3380e6, 0xe68c26, 0x8c4dcc, 0x26b38c, 0xffd94d][i % 5]);
  }
  three.camera.position.set(0, 0, -14);
  three.camera.lookAt(0, 0, 10);
  three.updateHook = (dt) => {
    if (idleScene) idleScene.rotation.y += dt * 0.15;
  };
}

function stopIdleScene() {
  if (idleScene) {
    disposeGroup(idleScene);
    idleScene = null;
  }
  three.updateHook = null;
}

async function boot() {
  load();
  initHud();
  initScene(el('game-canvas'));

  const count = await loadAllBanks(new URL('../', import.meta.url).href);
  el('loading').classList.add('hidden');
  if (!count) {
    el('menu').innerHTML = '<h1>Fehler</h1><p style="text-align:center">Fragen konnten nicht geladen werden.<br>Bitte über einen Webserver starten (siehe README).</p>';
    return;
  }

  const bonus = evaluateDailyStreak();
  el('btn-menu').onclick = () => { audio.click(); showMenu(); };
  showMenu();

  if (bonus > 0) {
    setTimeout(() => {
      showPopup(true, `Tagesserie: ${state.profile.dailyStreak} Tag(e) 🔥`, `+${bonus} Münzen Login-Bonus!`, FEEDBACK_MS.explanation);
    }, 400);
  }
}

boot().catch((e) => {
  console.error('[boot]', e);
  el('loading').classList.add('hidden');
  if (globalThis.__showError) globalThis.__showError(e.message || String(e));
});
