// Shared mini-game session loop (mirror of Unity's MiniGameBase):
// fetch questions → present one → answer → feedback pause → next → results.
// Subclasses implement supportedTypes / present / cleanup and call
// this.submit(correct) when the player commits.

import { getSession } from '../core/questions.js';
import { report } from '../core/feedback.js';
import { resetSessionStreak } from '../core/state.js';
import { setProgress, setPrompt, showResults } from '../core/hud.js';
import { three, disposeGroup } from '../core/scene3d.js';

export class MiniGame {
  /** @param {{category:string, onExit:()=>void, questionsPerSession?:number}} opts */
  constructor(opts) {
    this.category = opts.category;
    this.onExit = opts.onExit;
    this.questionsPerSession = opts.questionsPerSession ?? 6;
    this.sessionQuestions = [];
    this.index = -1;
    this.correctCount = 0;
    this.current = null;
    this.locked = false;
    this.destroyed = false;
    this._timers = [];
  }

  // --- subclass contract ---
  get supportedTypes() { return ['multipleChoice']; }
  present(_question) {}
  cleanup() {}
  onBeforeNext() {}
  update(_dt) {}
  onPick(_mesh) {}

  // --- lifecycle ---
  start() {
    three.updateHook = (dt) => { if (!this.destroyed) this.update(dt); };
    three.pickHandler = (mesh) => { if (!this.destroyed) this.onPick(mesh); };
    this.startSession();
  }

  startSession() {
    this.sessionQuestions = getSession(this.category, this.supportedTypes, this.questionsPerSession);
    this.index = -1;
    this.correctCount = 0;
    resetSessionStreak();
    if (!this.sessionQuestions.length) {
      setPrompt(`Keine passenden Fragen in "${this.category}" gefunden.`);
      return;
    }
    this.next();
  }

  next() {
    this.cleanup();
    this.index++;
    if (this.index >= this.sessionQuestions.length) {
      this.onSessionFinished();
      return;
    }
    this.current = this.sessionQuestions[this.index];
    this.locked = false;
    this.questionStart = performance.now();
    setProgress(this.index + 1, this.sessionQuestions.length);
    this.present(this.current);
  }

  /** Player committed an answer. */
  submit(correct) {
    if (this.locked) return;
    this.locked = true;
    if (correct) this.correctCount++;
    const seconds = (performance.now() - this.questionStart) / 1000;
    const pauseMs = report(this.current, correct, seconds);
    this.after(pauseMs, () => {
      this.onBeforeNext();
      this.next();
    });
  }

  /** Skip remaining questions and show results after the current feedback. */
  endSessionEarly() {
    this.index = this.sessionQuestions.length - 1;
  }

  onSessionFinished() {
    setProgress(0, 0);
    showResults(
      this.correctCount,
      this.sessionQuestions.length,
      () => this.startSession(),
      () => this.onExit()
    );
  }

  after(ms, fn) {
    this._timers.push(setTimeout(() => { if (!this.destroyed) fn(); }, ms));
  }

  destroy() {
    this.destroyed = true;
    for (const t of this._timers) clearTimeout(t);
    this.cleanup();
    three.updateHook = null;
    three.pickHandler = null;
  }

  // convenience for subclasses managing one root group
  disposeRoot() {
    if (this.root) {
      disposeGroup(this.root);
      this.root = null;
    }
  }
}
