// DOM HUD: stats bar, prompt banner, feedback popup, results modal.
// One place owns the DOM; games only call these functions.

import { state, level, onStateChanged } from './state.js';

const el = (id) => document.getElementById(id);

export const FEEDBACK_MS = { correct: 1200, explanation: 5000 };

let popupTimer = null;

export function initHud() {
  onStateChanged(refreshStats);
  refreshStats();
}

export function showHud(visible) {
  el('hud').classList.toggle('hidden', !visible);
  if (!visible) {
    hidePopup();
    hideResults();
  }
}

export function setPrompt(text) { el('hud-prompt').textContent = text; }
export function setProgress(current, total) {
  el('hud-progress').textContent = total ? `Frage ${current}/${total}` : '';
}

export function refreshStats() {
  el('hud-level').textContent = `Lv ${level()} · ${state.profile.xp} XP`;
  el('hud-coins').textContent = `⬤ ${state.profile.coins}`;
  el('hud-streak').textContent = state.sessionStreak >= 2 ? `🔥 x${state.sessionStreak}` : '';
}

export function showPopup(correct, title, body, ms) {
  const popup = el('popup');
  popup.classList.remove('hidden', 'correct', 'wrong');
  popup.classList.add(correct ? 'correct' : 'wrong');
  el('popup-title').textContent = title;
  el('popup-body').textContent = body || '';
  clearTimeout(popupTimer);
  popupTimer = setTimeout(hidePopup, ms);
}

export function hidePopup() {
  el('popup').classList.add('hidden');
}

export function showResults(correct, total, onAgain, onMenu) {
  const pct = total ? Math.round((100 * correct) / total) : 0;
  const praise = pct >= 80 ? 'Stark! 🌟' : pct >= 50 ? 'Gut gemacht – weiter so!' : 'Jede Runde macht dich besser!';
  el('results-text').textContent = `Runde geschafft!\n\n${correct} von ${total} richtig (${pct} %)\n\n${praise}`;
  el('results').classList.remove('hidden');
  el('btn-again').onclick = () => { hideResults(); onAgain(); };
  el('btn-results-menu').onclick = () => { hideResults(); onMenu(); };
}

export function hideResults() {
  el('results').classList.add('hidden');
}
