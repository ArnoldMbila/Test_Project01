// "Brücke der Zeitalter" — tap the floating stones in the correct sequence;
// each correct stone flies into place as the next bridge plank.

import { MiniGame } from './base.js';
import { makeGroup, makeBox, makeAnswerBlock, syncLabel, setColor, setCamera, GREEN } from '../core/scene3d.js';
import { setPrompt } from '../core/hud.js';
import { shuffle } from '../core/questions.js';
import { audio } from '../core/audio.js';

const STONE_COLOR = 0x6e6e84;
const PLANK_COLOR = 0xbf9a4d;

export class OrderGame extends MiniGame {
  get supportedTypes() { return ['ordering']; }

  present(q) {
    setPrompt(q.prompt);
    setCamera([0, 4.5, -15], [0, 1.5, 2]);
    this.root = makeGroup();
    this.nextExpected = 0;
    this.mistakes = 0;

    // cliffs flanking the gap
    makeBox(this.root, [-11, -1, 4], [8, 2, 10], 0x40503f);
    makeBox(this.root, [11, -1, 4], [8, 2, 10], 0x40503f);

    const n = q.orderedItems.length;
    const order = shuffle([...Array(n).keys()]);
    const cols = Math.ceil(n / 2);

    this.stones = [];
    for (let s = 0; s < n; s++) {
      const idx = order[s];
      const row = Math.floor(s / cols), col = s % cols;
      const x = -6 + (cols > 1 ? col * (12 / (cols - 1)) : 6);
      const stone = makeAnswerBlock(this.root, q.orderedItems[idx],
        [x, 5.2 - row * 2.8, -2], [3.4, 1.3, 0.5], STONE_COLOR);
      stone.userData.order = idx;
      this.stones[idx] = stone;
    }
  }

  onPick(mesh) {
    if (this.locked || !('order' in mesh.userData) || mesh.userData.placed) return;
    const idx = mesh.userData.order;

    if (idx !== this.nextExpected) {
      this.mistakes++;
      audio.wrong();
      this.shake(mesh);
      return;
    }

    audio.coin();
    mesh.userData.placed = true;
    const n = this.current.orderedItems.length;
    const span = 14;
    mesh.position.set(-span / 2 + span * (idx + 0.5) / n, 0, 4);
    mesh.scale.set((span / n) * 0.27, 0.4, 4.5);
    setColor(mesh, PLANK_COLOR);
    syncLabel(mesh, 0.5);

    this.nextExpected++;
    if (this.nextExpected >= n) {
      this.stones.forEach((s) => setColor(s, GREEN));
      this.submit(this.mistakes <= 1);
    }
  }

  shake(mesh) {
    const ox = mesh.position.x;
    let t = 0;
    const id = setInterval(() => {
      t += 0.04;
      mesh.position.x = ox + Math.sin(t * 60) * 0.12 * (1 - t / 0.3);
      if (t >= 0.3) { clearInterval(id); mesh.position.x = ox; }
    }, 16);
    this._timers.push(id);
  }

  cleanup() {
    this.disposeRoot();
  }
}
