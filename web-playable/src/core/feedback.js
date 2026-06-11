// Single entry point for every answered question (mirror of Unity's
// FeedbackSystem.Report): updates state, plays SFX, shows the popup, and
// returns the ms the game should pause before the next question.

import { registerAnswer } from './state.js';
import { audio } from './audio.js';
import { showPopup, refreshStats, FEEDBACK_MS } from './hud.js';

export function report(question, correct, answerSeconds) {
  const { xpGain, leveledUp } = registerAnswer(question, correct, answerSeconds);

  if (correct) {
    audio.correct();
    if (leveledUp) audio.levelUp();
    else setTimeout(() => audio.coin(), 150);
  } else {
    audio.wrong();
  }
  refreshStats();

  const showExplanation = !correct && !!question.explanation;
  if (correct) {
    showPopup(true, `Richtig!  +${xpGain} XP`, '', FEEDBACK_MS.correct);
    return FEEDBACK_MS.correct;
  }
  showPopup(false, 'Nicht ganz – merk dir das:', question.explanation || '', FEEDBACK_MS.explanation);
  return showExplanation ? FEEDBACK_MS.explanation : FEEDBACK_MS.correct;
}
