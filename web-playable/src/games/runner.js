// "Wortlauf" — runner: the orb auto-runs down the lane; steer by holding the
// left/right half of the screen (or arrow keys / A,D) and pass through the
// gate you believe is correct.

import { MiniGame } from './base.js';
import { makeGroup, makeBox, makeSphere, makeAnswerBlock, setColor, setCamera, COLORS, GREEN, RED } from '../core/scene3d.js';
import { setPrompt } from '../core/hud.js';

const GATE_Z = 42;
const RUN_SPEED = 9;
const STEER_SPEED = 9;

export class RunnerGame extends MiniGame {
  get supportedTypes() { return ['multipleChoice']; }

  constructor(opts) {
    super(opts);
    this.steer = 0;
    this._onKey = (e) => {
      if (e.type === 'keyup') { this.keySteer = 0; return; }
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keySteer = 1;   // +x is screen-left here
      if (e.key === 'ArrowRight' || e.key === 'd') this.keySteer = -1;
    };
    this._onTouch = (e) => {
      if (e.type === 'pointerup' || e.type === 'pointercancel') { this.touchSteer = 0; return; }
      this.touchSteer = e.clientX < innerWidth / 2 ? 1 : -1;
    };
    this.keySteer = 0;
    this.touchSteer = 0;
    addEventListener('keydown', this._onKey);
    addEventListener('keyup', this._onKey);
    addEventListener('pointerdown', this._onTouch);
    addEventListener('pointermove', this._onTouch);
    addEventListener('pointerup', this._onTouch);
    addEventListener('pointercancel', this._onTouch);
  }

  present(q) {
    setPrompt(q.prompt + '  —  Tippe links/rechts zum Steuern!');
    this.root = makeGroup();
    makeBox(this.root, [0, -0.5, GATE_Z / 2], [14, 1, GATE_Z + 30], 0x29304d);

    this.player = makeSphere(this.root, [0, 0.6, 0], 0.6, 0xf2e54d);
    this.running = true;

    const n = q.options.length;
    this.gates = [];
    const laneW = 14 / n;
    for (let i = 0; i < n; i++) {
      const x = -7 + laneW * (i + 0.5);
      const gate = makeAnswerBlock(this.root, q.options[i],
        [x, 1.6, GATE_Z], [laneW * 0.85, 3.2, 0.6], COLORS[i % COLORS.length]);
      gate.userData.option = i;
      this.gates.push(gate);
    }
  }

  update(dt) {
    if (!this.running || !this.player) return;
    const steer = this.touchSteer || this.keySteer;
    const p = this.player.position;
    p.x = Math.max(-6.5, Math.min(6.5, p.x + steer * STEER_SPEED * dt));
    p.z += RUN_SPEED * dt;
    setCamera([p.x * 0.6, 5.5, p.z - 10], [p.x * 0.6, 1.5, p.z + 8]);

    if (p.z >= GATE_Z - 0.5) {
      this.running = false;
      let best = 0, bestDist = Infinity;
      this.gates.forEach((g, i) => {
        const d = Math.abs(g.position.x - p.x);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      const correct = this.gates[best].userData.option === this.current.correctIndex;
      setColor(this.gates[best], correct ? GREEN : RED);
      setColor(this.gates[this.current.correctIndex], GREEN);
      this.submit(correct);
    }
  }

  cleanup() {
    this.running = false;
    this.disposeRoot();
  }

  destroy() {
    removeEventListener('keydown', this._onKey);
    removeEventListener('keyup', this._onKey);
    removeEventListener('pointerdown', this._onTouch);
    removeEventListener('pointermove', this._onTouch);
    removeEventListener('pointerup', this._onTouch);
    removeEventListener('pointercancel', this._onTouch);
    super.destroy();
  }
}
