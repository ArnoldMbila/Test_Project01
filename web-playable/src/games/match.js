// "Gleichnis-Paare" — tap a left block (term), then the matching right block
// (meaning). Correct pairs lock green; counts as correct with ≤1 mismatch.

import { MiniGame } from './base.js';
import { makeGroup, makeAnswerBlock, setColor, setCamera, GREEN, RED } from '../core/scene3d.js';
import { setPrompt } from '../core/hud.js';
import { shuffle } from '../core/questions.js';
import { audio } from '../core/audio.js';

const LEFT_COLOR = 0x3866b8;
const RIGHT_COLOR = 0x99692e;
const SELECT_COLOR = 0xf2e54d;

export class MatchGame extends MiniGame {
  get supportedTypes() { return ['matching']; }

  present(q) {
    setPrompt(q.prompt);
    setCamera([0, 1.5, -14], [0, 0.5, 0]);
    this.root = makeGroup();
    this.selectedLeft = -1;
    this.locked = false;
    this.pairsLocked = 0;
    this.mistakes = 0;

    const n = q.pairs.length;
    const order = shuffle([...Array(n).keys()]);
    const spacing = Math.min(2.6, 10 / n * 1.4);
    const top = ((n - 1) * spacing) / 2;

    this.leftBlocks = [];
    this.rightBlocks = [];
    for (let i = 0; i < n; i++) {
      const left = makeAnswerBlock(this.root, q.pairs[i].left,
        [-4.8, top - i * spacing, 0], [4.2, 1.3, 0.4], LEFT_COLOR);
      left.userData.side = 'left';
      left.userData.idx = i;
      this.leftBlocks.push(left);

      const pi = order[i];
      const right = makeAnswerBlock(this.root, q.pairs[pi].right,
        [4.8, top - i * spacing, 0], [4.2, 1.3, 0.4], RIGHT_COLOR);
      right.userData.side = 'right';
      right.userData.idx = pi;
      this.rightBlocks[pi] = right;
    }
  }

  onPick(mesh) {
    if (this.locked || mesh.userData.done || !('side' in mesh.userData)) return;

    if (mesh.userData.side === 'left') {
      audio.click();
      if (this.selectedLeft >= 0) setColor(this.leftBlocks[this.selectedLeft], LEFT_COLOR);
      this.selectedLeft = mesh.userData.idx;
      setColor(mesh, SELECT_COLOR);
      return;
    }

    if (this.selectedLeft < 0) return;
    const rightIdx = mesh.userData.idx;
    if (rightIdx === this.selectedLeft) {
      audio.coin();
      const l = this.leftBlocks[rightIdx], r = this.rightBlocks[rightIdx];
      setColor(l, GREEN); setColor(r, GREEN);
      l.userData.done = r.userData.done = true;
      this.selectedLeft = -1;
      this.pairsLocked++;
      if (this.pairsLocked >= this.current.pairs.length) {
        this.submit(this.mistakes <= 1);
      }
    } else {
      this.mistakes++;
      audio.wrong();
      setColor(mesh, RED);
      this.after(400, () => { if (!mesh.userData.done) setColor(mesh, RIGHT_COLOR); });
      setColor(this.leftBlocks[this.selectedLeft], LEFT_COLOR);
      this.selectedLeft = -1;
    }
  }

  cleanup() {
    this.disposeRoot();
  }
}
