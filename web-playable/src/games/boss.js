// "Wächter des Wissens" — boss battle: correct answers shrink the guardian,
// mistakes cost a heart. 0 hearts ends the run early.

import { MiniGame } from './base.js';
import { makeGroup, makeBox, makeAnswerBlock, makeLabel, setColor, setCamera, COLORS, GREEN, RED, disposeGroup } from '../core/scene3d.js';
import { setPrompt } from '../core/hud.js';

const BOSS_COLOR = 0x73201f;

export class BossGame extends MiniGame {
  get supportedTypes() { return ['multipleChoice']; }

  startSession() {
    this.disposeArena();
    super.startSession();
  }

  buildArena() {
    this.arena = makeGroup();
    makeBox(this.arena, [0, -0.5, 2], [20, 1, 22], 0x402e48);
    this.boss = makeBox(this.arena, [0, 2.2, 9], [4, 4.4, 3], BOSS_COLOR);
    this.bossMaxHp = this.sessionQuestions.length;
    this.bossHp = this.bossMaxHp;
    this.hearts = 3;
    this.refreshLabels();
    setCamera([0, 4, -12], [0, 2, 4]);
  }

  bossText() { return `Wächter ${this.bossHp}/${this.bossMaxHp}`; }
  heartsText() { return '♥'.repeat(Math.max(this.hearts, 0)) || '–'; }

  refreshLabels() {
    // labels are canvas sprites: rebuild them cheaply
    disposeGroup(this.labelGroup);
    this.labelGroup = makeGroup();
    makeLabel(this.labelGroup, this.bossText(), [0, 5.4, 9], 5);
    makeLabel(this.labelGroup, this.heartsText(), [-7, 4.5, -2], 3);
  }

  present(q) {
    if (!this.arena) this.buildArena();
    setPrompt(q.prompt);
    this.root = makeGroup();
    const n = q.options.length;
    const w = 16 / n;
    this.blocks = [];
    for (let i = 0; i < n; i++) {
      const b = makeAnswerBlock(this.root, q.options[i],
        [-8 + w * (i + 0.5), 0.9, -4], [w * 0.85, 1.6, 0.5], COLORS[i % COLORS.length]);
      b.userData.option = i;
      this.blocks.push(b);
    }
  }

  onPick(mesh) {
    if (this.locked || !('option' in mesh.userData)) return;
    const i = mesh.userData.option;
    const correct = i === this.current.correctIndex;
    setColor(mesh, correct ? GREEN : RED);
    setColor(this.blocks[this.current.correctIndex], GREEN);

    if (correct) {
      this.bossHp--;
      this.boss.scale.multiplyScalar(0.92);
      const t = 1 - this.bossHp / this.bossMaxHp;
      this.boss.material.color.lerpColors(
        new this.boss.material.color.constructor(BOSS_COLOR),
        new this.boss.material.color.constructor(0x777788), t);
    } else {
      this.hearts--;
    }
    this.refreshLabels();
    this.submit(correct);
  }

  onBeforeNext() {
    if (this.hearts <= 0 && this.index < this.sessionQuestions.length - 1) {
      setPrompt('Der Wächter war diesmal stärker – gleich nochmal!');
      this.endSessionEarly();
    }
  }

  onSessionFinished() {
    this.disposeArena();
    super.onSessionFinished();
  }

  disposeArena() {
    disposeGroup(this.arena);
    disposeGroup(this.labelGroup);
    this.arena = null;
    this.labelGroup = null;
  }

  cleanup() {
    this.disposeRoot();
  }

  destroy() {
    this.disposeArena();
    super.destroy();
  }
}
