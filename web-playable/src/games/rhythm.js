// "Takt der Wahrheit" — a pulse ring beats steadily; answering while the ring
// is tight ("on beat") earns bonus XP. Gentle time limit of 4 bars.

import * as THREE from 'three';
import { MiniGame } from './base.js';
import { makeGroup, makeBox, makeAnswerBlock, makeLabel, setColor, setCamera, COLORS, GREEN, RED, disposeGroup } from '../core/scene3d.js';
import { setPrompt } from '../core/hud.js';
import { addXp } from '../core/state.js';
import { audio } from '../core/audio.js';

const BPM = 100;
const BARS = 4;

export class RhythmGame extends MiniGame {
  get supportedTypes() { return ['multipleChoice']; }

  constructor(opts) {
    super(opts);
    this.beatLength = 60 / BPM;
    this.timeLimit = this.beatLength * 4 * BARS;
  }

  present(q) {
    setPrompt(q.prompt);
    setCamera([0, 9, -10], [0, 0.5, 2]);
    this.root = makeGroup();
    makeBox(this.root, [0, -0.2, 1], [18, 0.4, 14], 0x241a40);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.12, 10, 40),
      new THREE.MeshLambertMaterial({ color: 0xe666cc })
    );
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.set(0, 0.4, 1.5);
    this.root.add(this.ring);

    const n = q.options.length;
    this.pedestals = [];
    for (let i = 0; i < n; i++) {
      const angle = Math.PI * (0.18 + (0.64 * i) / Math.max(n - 1, 1));
      const p = makeAnswerBlock(this.root, q.options[i],
        [Math.cos(angle) * 7, 1, 1.5 + Math.sin(angle) * 4.5],
        [3.1, 1.9, 0.6], COLORS[i % COLORS.length]);
      p.userData.option = i;
      this.pedestals.push(p);
    }

    this.timerGroup = makeGroup();
    this.timer = 0;
    this.lastBeat = -1;
    this.timeLabel = null;
    this.active = true;
  }

  update(dt) {
    if (!this.active || !this.ring) return;
    this.timer += dt;

    const beatPhase = (this.timer % this.beatLength) / this.beatLength;
    const beatIdx = Math.floor(this.timer / this.beatLength);
    if (beatIdx !== this.lastBeat) {
      this.lastBeat = beatIdx;
      audio.beat();
    }
    const s = 6 - 4.8 * beatPhase; // shrink toward the beat
    this.ring.scale.set(s, s, 1);
    this.onBeat = beatPhase > 0.75;

    const remaining = Math.ceil(this.timeLimit - this.timer);
    if (remaining !== this.shownRemaining) {
      this.shownRemaining = remaining;
      disposeGroup(this.timerGroup);
      this.timerGroup = makeGroup();
      this.timeLabel = makeLabel(this.timerGroup, `♪ ${remaining}s`, [0, 5.5, 4], 2.4);
    }

    if (this.timer >= this.timeLimit) {
      this.active = false;
      setColor(this.pedestals[this.current.correctIndex], GREEN);
      this.submit(false); // timeout counts as miss → explanation shows
    }
  }

  onPick(mesh) {
    if (!this.active || this.locked || !('option' in mesh.userData)) return;
    this.active = false;
    const i = mesh.userData.option;
    const correct = i === this.current.correctIndex;
    setColor(mesh, correct ? GREEN : RED);
    setColor(this.pedestals[this.current.correctIndex], GREEN);
    if (correct && this.onBeat) addXp(5); // tempo bonus
    this.submit(correct);
  }

  cleanup() {
    this.active = false;
    disposeGroup(this.timerGroup);
    this.timerGroup = null;
    this.ring = null;
    this.disposeRoot();
  }
}
