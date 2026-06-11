// "Karten der Weisheit" — duel: the opponent plays a question; tap the right
// answer card from your fan. The duel marker tracks who is winning.

import { MiniGame } from './base.js';
import { makeGroup, makeBox, makeSphere, makeAnswerBlock, syncLabel, setColor, setCamera, GREEN, RED, disposeGroup } from '../core/scene3d.js';
import { setPrompt } from '../core/hud.js';
import { addCoins } from '../core/state.js';

const CARD_COLOR = 0xe9e0c8;

export class CardsGame extends MiniGame {
  get supportedTypes() { return ['multipleChoice']; }

  startSession() {
    this.disposeTable();
    super.startSession();
  }

  buildTable() {
    this.table = makeGroup();
    makeBox(this.table, [0, 0, 0], [18, 0.4, 14], 0x1f5938);
    // opponent silhouette
    makeBox(this.table, [0, 1.8, 7.5], [1.6, 2.6, 1], 0x66338c);
    makeSphere(this.table, [0, 3.6, 7.5], 0.7, 0x66338c);
    this.marker = makeSphere(this.table, [8, 0.6, 2], 0.55, 0xf2e54d);
    this.score = 0;
    setCamera([0, 8, -9], [0, 0.5, 3]);
  }

  present(q) {
    if (!this.table) this.buildTable();
    setPrompt('Gegner spielt: ' + q.prompt);
    this.root = makeGroup();
    const n = q.options.length;
    this.cards = [];
    for (let i = 0; i < n; i++) {
      const x = n > 1 ? -6 + (12 * i) / (n - 1) : 0;
      const card = makeAnswerBlock(this.root, q.options[i],
        [x, 0.7, -3.5], [3.3, 0.12, 2.2], CARD_COLOR);
      card.rotation.y = (x / 6) * 0.14; // fan effect
      card.userData.option = i;
      this.cards.push(card);
    }
  }

  onPick(mesh) {
    if (this.locked || !('option' in mesh.userData)) return;
    const i = mesh.userData.option;
    const correct = i === this.current.correctIndex;
    setColor(mesh, correct ? GREEN : RED);
    setColor(this.cards[this.current.correctIndex], GREEN);
    mesh.position.set(0, 0.85, 2); // played card slides to table center
    syncLabel(mesh);

    this.score += correct ? 1 : -1;
    this.marker.position.z = 2 + this.score * 0.8;
    this.submit(correct);
  }

  onSessionFinished() {
    if (this.score > 0) {
      setPrompt(`Duell gewonnen (${this.score > 0 ? '+' : ''}${this.score})! +15 Münzen`);
      addCoins(15);
    }
    this.disposeTable();
    super.onSessionFinished();
  }

  disposeTable() {
    disposeGroup(this.table);
    this.table = null;
  }

  cleanup() {
    this.disposeRoot();
  }

  destroy() {
    this.disposeTable();
    super.destroy();
  }
}
