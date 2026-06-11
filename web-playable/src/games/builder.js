// "Stadt des Lichts" — kingdom-builder meta-game: spend coins on buildings;
// each purchase requires passing one question ("Bauprüfung"). Owned buildings
// persist in localStorage, so the city grows across sessions.

import { MiniGame } from './base.js';
import { makeGroup, makeBox, makeAnswerBlock, setColor, setCamera, COLORS, GREEN, RED, disposeGroup } from '../core/scene3d.js';
import { setPrompt, setProgress } from '../core/hud.js';
import { state, trySpendCoins, save } from '../core/state.js';
import { getSession } from '../core/questions.js';
import { report } from '../core/feedback.js';
import { audio } from '../core/audio.js';

const CATALOG = [
  { id: 'well',   label: 'Brunnen (10)',      cost: 10,  size: [1.2, 1.0, 1.2], color: 0x6699e6 },
  { id: 'house',  label: 'Haus (25)',         cost: 25,  size: [2.0, 1.8, 2.0], color: 0xccb380 },
  { id: 'garden', label: 'Garten (40)',       cost: 40,  size: [3.0, 0.4, 3.0], color: 0x4db34d },
  { id: 'tower',  label: 'Wachturm (60)',     cost: 60,  size: [1.5, 4.0, 1.5], color: 0x9999b3 },
  { id: 'hall',   label: 'Halle (100)',       cost: 100, size: [4.0, 2.5, 3.0], color: 0xd9cc99 },
  { id: 'beacon', label: 'Leuchtfeuer (150)', cost: 150, size: [1.2, 5.5, 1.2], color: 0xffd94d },
];

export class BuilderGame extends MiniGame {
  get supportedTypes() { return ['multipleChoice']; }

  // Builder replaces the base session loop with: browse → buy → one question.
  startSession() {
    setProgress(0, 0);
    this.buildCity();
    this.shopPrompt();
  }

  buildCity() {
    disposeGroup(this.city);
    this.city = makeGroup();
    setCamera([0, 15, -17], [0, 0, 2]);
    makeBox(this.city, [0, -0.25, 0], [26, 0.5, 22], 0x59734d);

    // owned buildings on a grid, in purchase order
    state.profile.unlockedBuildings.forEach((id, i) => {
      const def = CATALOG.find((d) => d.id === id);
      if (!def) return;
      const col = i % 5, row = Math.floor(i / 5);
      makeBox(this.city,
        [-8 + col * 4, def.size[1] / 2 + 0.25, 4 - row * 4],
        def.size, def.color);
    });

    // shop row along the back edge
    this.shopBlocks = [];
    CATALOG.forEach((def, i) => {
      const affordable = state.profile.coins >= def.cost;
      const b = makeAnswerBlock(this.city, def.label,
        [-10 + i * 4, 1, 9.5], [3.2, 1.6, 0.5],
        affordable ? def.color : 0x555560);
      b.userData.shopId = def.id;
      this.shopBlocks.push(b);
    });
  }

  shopPrompt() {
    setPrompt(`Stadt des Lichts – Münzen: ${state.profile.coins}. Tippe ein Gebäude im Schaufenster, um es zu bauen!`);
  }

  onPick(mesh) {
    if (this.quizActive) {
      this.handleQuizPick(mesh);
      return;
    }
    const id = mesh.userData.shopId;
    if (!id) return;
    const def = CATALOG.find((d) => d.id === id);
    if (state.profile.coins < def.cost) {
      audio.wrong();
      setPrompt(`Noch nicht genug Münzen für ${def.label}. Spiele andere Spiele, um mehr zu verdienen!`);
      return;
    }
    audio.click();
    this.pending = def;
    this.startQuiz();
  }

  startQuiz() {
    const qs = getSession(this.category, this.supportedTypes, 1);
    if (!qs.length) { this.completePurchase(true); return; }
    this.quizQuestion = qs[0];
    this.quizStart = performance.now();
    this.quizActive = true;

    setPrompt('Bauprüfung: ' + this.quizQuestion.prompt);
    this.quiz = makeGroup();
    const n = this.quizQuestion.options.length;
    const w = 18 / n;
    this.quizBlocks = [];
    for (let i = 0; i < n; i++) {
      const b = makeAnswerBlock(this.quiz, this.quizQuestion.options[i],
        [-9 + w * (i + 0.5), 1.2, -8], [w * 0.85, 2, 0.5],
        COLORS[i % COLORS.length]);
      b.userData.option = i;
      this.quizBlocks.push(b);
    }
  }

  handleQuizPick(mesh) {
    if (!('option' in mesh.userData)) return;
    this.quizActive = false;
    const i = mesh.userData.option;
    const correct = i === this.quizQuestion.correctIndex;
    setColor(mesh, correct ? GREEN : RED);
    setColor(this.quizBlocks[this.quizQuestion.correctIndex], GREEN);
    const seconds = (performance.now() - this.quizStart) / 1000;
    const pauseMs = report(this.quizQuestion, correct, seconds);
    this.after(pauseMs, () => this.completePurchase(correct));
  }

  completePurchase(correct) {
    disposeGroup(this.quiz);
    this.quiz = null;
    if (correct && this.pending && trySpendCoins(this.pending.cost)) {
      state.profile.unlockedBuildings.push(this.pending.id);
      save();
      audio.levelUp();
    }
    this.pending = null;
    this.buildCity();
    this.shopPrompt();
  }

  cleanup() {
    disposeGroup(this.quiz);
    this.quiz = null;
  }

  destroy() {
    disposeGroup(this.city);
    this.city = null;
    super.destroy();
  }
}
