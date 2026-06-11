// Node smoke test for the framework-free core modules (no browser needed):
// question validation/session selection and the progression/streak maths.
// Run: npm test  (from web-playable/)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

// localStorage shim before importing state.js
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stateMod = await import('../src/core/state.js');
const qMod = await import('../src/core/questions.js');

// ---- banks load & validate ----
let total = 0;
for (const file of qMod.CATEGORY_FILES) {
  const bank = JSON.parse(readFileSync(join(root, file), 'utf8'));
  assert.ok(qMod.registerBank(bank), `bank ${file} registers`);
  for (const q of bank.questions) {
    assert.ok(qMod.validateQuestion(q), `question ${q.id} valid`);
  }
  total += bank.questions.length;
}
assert.equal(total, 80, 'all 80 questions present');
assert.equal(qMod.categories().length, 3, '3 categories');

// ---- session selection ----
const mc = qMod.getSession('grundstufe', ['multipleChoice'], 6);
assert.equal(mc.length, 6, 'MC session has 6 questions');
assert.ok(mc.every((q) => q.type === 'multipleChoice'), 'type filter works');

const ordering = qMod.getSession('oberstufe', ['ordering'], 99);
assert.ok(ordering.length >= 3, 'oberstufe has ordering questions');

const none = qMod.getSession('does-not-exist', null, 5);
assert.equal(none.length, 0, 'unknown category returns empty');

// ---- progression maths ----
const { state, registerAnswer, levelForXp, evaluateDailyStreak, trySpendCoins, load, save } = stateMod;
load();
assert.equal(state.profile.xp, 0, 'fresh profile');

const q1 = mc[0];
let r = registerAnswer(q1, true, 2.0); // fast + correct
assert.ok(r.xpGain >= 15, 'fast correct answer pays base + speed bonus');
assert.equal(state.sessionStreak, 1, 'session streak increments');

r = registerAnswer(q1, true, 10.0);
r = registerAnswer(q1, true, 10.0);
assert.ok(r.mastered, 'third consecutive correct masters the question');
assert.ok(r.coinGain >= 12, 'mastery pays bonus coins');

r = registerAnswer(q1, false, 3.0);
assert.equal(r.xpGain, 0, 'wrong answer pays nothing');
assert.equal(state.sessionStreak, 0, 'streak resets on mistake');

assert.equal(levelForXp(0), 1, 'level 1 at 0 XP');
assert.equal(levelForXp(100), 2, 'level 2 at 100 XP');
assert.equal(levelForXp(400), 3, 'level 3 at 400 XP');

// ---- coins ----
state.profile.coins = 30;
assert.equal(trySpendCoins(25), true, 'can spend within balance');
assert.equal(state.profile.coins, 5, 'balance reduced');
assert.equal(trySpendCoins(25), false, 'cannot overspend');

// ---- daily streak ----
state.profile.lastPlayedDate = '';
state.profile.dailyStreak = 0;
let bonus = evaluateDailyStreak(new Date('2026-06-10T08:00:00Z'));
assert.equal(state.profile.dailyStreak, 1, 'first day starts streak');
assert.ok(bonus > 0, 'first day pays bonus');
bonus = evaluateDailyStreak(new Date('2026-06-10T20:00:00Z'));
assert.equal(bonus, 0, 'same day pays nothing');
evaluateDailyStreak(new Date('2026-06-11T08:00:00Z'));
assert.equal(state.profile.dailyStreak, 2, 'next day continues streak');
evaluateDailyStreak(new Date('2026-06-14T08:00:00Z'));
assert.equal(state.profile.dailyStreak, 1, 'gap resets streak');

// ---- persistence roundtrip ----
save();
const raw = JSON.parse(globalThis.localStorage.getItem('bible-arcade-profile-v1'));
assert.equal(raw.dailyStreak, 1, 'profile persisted to localStorage');

console.log('✓ all smoke tests passed');
