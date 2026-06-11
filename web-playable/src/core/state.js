// Player profile + progression + streaks, persisted in localStorage.
// Mirrors the Unity ProgressionSystem/StreakSystem/SaveSystem reward maths.

const SAVE_KEY = 'bible-arcade-profile-v1';

const TUNING = {
  xpPerCorrect: 10,
  xpDifficultyBonus: 5,     // per difficulty point above 1
  xpSpeedBonus: 5,          // answered under speedThreshold
  speedThresholdSeconds: 5,
  coinsPerCorrect: 2,
  coinsMasteryBonus: 10,    // first time a question reaches mastery (3 in a row)
  dailyBonusCoinsPerDay: 5,
  dailyBonusCap: 50,
};

function storage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

function freshProfile() {
  return {
    xp: 0,
    coins: 0,
    dailyStreak: 0,
    lastPlayedDate: '',
    bestSessionStreak: 0,
    mastery: {},            // questionId -> {seen, correct, streak}
    unlockedBuildings: [],
  };
}

export const state = {
  profile: freshProfile(),
  sessionStreak: 0,
  listeners: new Set(),
};

export function onStateChanged(fn) { state.listeners.add(fn); }
function emit() { for (const fn of state.listeners) fn(state); }

export function load() {
  const s = storage();
  if (!s) return;
  try {
    const raw = s.getItem(SAVE_KEY);
    if (raw) state.profile = { ...freshProfile(), ...JSON.parse(raw) };
  } catch (e) {
    console.error('[state] load failed, starting fresh:', e);
    state.profile = freshProfile();
  }
}

export function save() {
  const s = storage();
  if (!s) return;
  try { s.setItem(SAVE_KEY, JSON.stringify(state.profile)); }
  catch (e) { console.error('[state] save failed:', e); }
}

export function levelForXp(xp) { return 1 + Math.floor(Math.sqrt(xp / 100)); }
export function level() { return levelForXp(state.profile.xp); }

export function masteryFor(questionId) {
  const m = state.profile.mastery;
  if (!m[questionId]) m[questionId] = { seen: 0, correct: 0, streak: 0 };
  return m[questionId];
}
export function isMastered(questionId) { return masteryFor(questionId).streak >= 3; }

export function addXp(amount) { state.profile.xp += amount; emit(); }
export function addCoins(amount) { state.profile.coins += amount; emit(); }

export function trySpendCoins(amount) {
  if (state.profile.coins < amount) return false;
  state.profile.coins -= amount;
  save();
  emit();
  return true;
}

/**
 * Apply one answered question. Returns { xpGain, coinGain, leveledUp, mastered }.
 */
export function registerAnswer(question, correct, answerSeconds) {
  const levelBefore = level();
  const m = masteryFor(question.id);
  const wasMastered = m.streak >= 3;
  m.seen++;

  let xpGain = 0, coinGain = 0, mastered = false;
  if (correct) {
    m.correct++;
    m.streak++;
    xpGain = TUNING.xpPerCorrect + ((question.difficulty || 1) - 1) * TUNING.xpDifficultyBonus;
    if (answerSeconds <= TUNING.speedThresholdSeconds) xpGain += TUNING.xpSpeedBonus;
    coinGain = TUNING.coinsPerCorrect;
    if (!wasMastered && m.streak >= 3) {
      coinGain += TUNING.coinsMasteryBonus;
      mastered = true;
    }
    state.sessionStreak++;
    if (state.sessionStreak > state.profile.bestSessionStreak) {
      state.profile.bestSessionStreak = state.sessionStreak;
    }
  } else {
    m.streak = 0;
    state.sessionStreak = 0;
  }

  state.profile.xp += xpGain;
  state.profile.coins += coinGain;
  save();
  emit();
  return { xpGain, coinGain, leveledUp: level() > levelBefore, mastered };
}

export function resetSessionStreak() {
  state.sessionStreak = 0;
  emit();
}

/** Daily streak: consecutive calendar days played. Returns bonus coins granted (0 if already counted). */
export function evaluateDailyStreak(today = new Date()) {
  const p = state.profile;
  const todayIso = today.toISOString().slice(0, 10);
  if (p.lastPlayedDate === todayIso) return 0;

  if (p.lastPlayedDate) {
    const days = Math.round((Date.parse(todayIso) - Date.parse(p.lastPlayedDate)) / 86400000);
    p.dailyStreak = days <= 1 ? p.dailyStreak + 1 : 1;
  } else {
    p.dailyStreak = 1;
  }
  p.lastPlayedDate = todayIso;
  const bonus = Math.min(p.dailyStreak * TUNING.dailyBonusCoinsPerDay, TUNING.dailyBonusCap);
  p.coins += bonus;
  save();
  emit();
  return bonus;
}
