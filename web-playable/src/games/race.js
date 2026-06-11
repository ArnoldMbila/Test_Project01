// "Lauf der Boten" — race a rival: the rival advances every question, you
// sprint only on correct answers. Cross the line first to win bonus coins.

import { MiniGame } from './base.js';
import { makeGroup, makeBox, makeSphere, makeAnswerBlock, makeLabel, setColor, setCamera, COLORS, GREEN, RED, disposeGroup } from '../core/scene3d.js';
import { setPrompt } from '../core/hud.js';
import { addCoins } from '../core/state.js';

const TRACK_LEN = 60;
const RIVAL_STEP = 8;
const PLAYER_STEP = 11;

export class RaceGame extends MiniGame {
  get supportedTypes() { return ['multipleChoice']; }

  startSession() {
    this.disposeTrack();
    super.startSession();
  }

  buildTrack() {
    this.track = makeGroup();
    makeBox(this.track, [-4, -0.5, TRACK_LEN / 2], [7, 1, TRACK_LEN + 20], 0x344d33);
    makeBox(this.track, [4, -0.5, TRACK_LEN / 2], [7, 1, TRACK_LEN + 20], 0x4d382e);
    makeBox(this.track, [0, 0.05, TRACK_LEN], [16, 0.1, 1.5], 0xffffff);
    makeLabel(this.track, '🏁 ZIEL', [0, 4, TRACK_LEN], 5);

    this.player = makeSphere(this.track, [-4, 0.6, 0], 0.6, 0xf2e54d);
    this.rival = makeSphere(this.track, [4, 0.6, 0], 0.6, 0xb34040);
    this.playerZ = 0;
    this.rivalZ = 0;
    this.moveCamera();
  }

  moveCamera() {
    this.player.position.z = this.playerZ;
    this.rival.position.z = this.rivalZ;
    setCamera([0, 9, this.playerZ - 12], [0, 1, this.playerZ + 8]);
  }

  present(q) {
    if (!this.track) this.buildTrack();
    setPrompt(q.prompt);
    this.root = makeGroup();
    const n = q.options.length;
    const w = 16 / n;
    this.blocks = [];
    for (let i = 0; i < n; i++) {
      const b = makeAnswerBlock(this.root, q.options[i],
        [-8 + w * (i + 0.5), 1, this.playerZ - 6], [w * 0.85, 1.8, 0.5],
        COLORS[i % COLORS.length]);
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

    if (correct) this.playerZ += PLAYER_STEP;
    this.rivalZ += RIVAL_STEP;
    this.moveCamera();
    this.submit(correct);
  }

  onSessionFinished() {
    const won = this.playerZ >= this.rivalZ;
    setPrompt(won ? 'Du hast das Rennen gewonnen! +20 Münzen' : 'Knapp! Der Rivale war schneller.');
    if (won) addCoins(20);
    this.disposeTrack();
    super.onSessionFinished();
  }

  disposeTrack() {
    disposeGroup(this.track);
    this.track = null;
  }

  cleanup() {
    this.disposeRoot();
  }

  destroy() {
    this.disposeTrack();
    super.destroy();
  }
}
