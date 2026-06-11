// Question bank loading + session selection (mastery-weighted, like Unity's
// QuestionDatabase). Banks are plain JSON files under data/.

import { isMastered, masteryFor } from './state.js';

const banks = new Map(); // categoryId -> bank

export const CATEGORY_FILES = [
  'data/questions_grundstufe.json',
  'data/questions_mittelstufe.json',
  'data/questions_oberstufe.json',
];

export function validateQuestion(q) {
  if (!q || !q.id || !q.prompt) return false;
  switch (q.type) {
    case 'multipleChoice':
      return Array.isArray(q.options) && q.options.length >= 2 &&
        q.correctIndex >= 0 && q.correctIndex < q.options.length;
    case 'ordering':
      return Array.isArray(q.orderedItems) && q.orderedItems.length >= 3;
    case 'matching':
      return Array.isArray(q.pairs) && q.pairs.length >= 2;
    default:
      return false;
  }
}

export function registerBank(bank) {
  if (!bank || !bank.categoryId || !Array.isArray(bank.questions)) return false;
  bank = { ...bank, questions: bank.questions.filter(validateQuestion) };
  banks.set(bank.categoryId, bank);
  return true;
}

export async function loadAllBanks(baseUrl = '') {
  const results = await Promise.allSettled(
    CATEGORY_FILES.map(async (file) => {
      const res = await fetch(baseUrl + file);
      if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
      return res.json();
    })
  );
  for (const r of results) {
    if (r.status === 'fulfilled') registerBank(r.value);
    else console.error('[questions] bank failed:', r.reason);
  }
  return banks.size;
}

export function categories() {
  return [...banks.values()].map((b) => ({ id: b.categoryId, name: b.displayName }));
}

export function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * Up to `count` shuffled questions of the allowed types. Unmastered questions
 * come first so weak items resurface (light spaced repetition).
 */
export function getSession(categoryId, allowedTypes, count) {
  const bank = banks.get(categoryId);
  if (!bank) return [];
  const pool = bank.questions.filter(
    (q) => !allowedTypes || allowedTypes.includes(q.type)
  );
  shuffle(pool);
  pool.sort((a, b) => {
    const ma = isMastered(a.id) ? 1 : 0;
    const mb = isMastered(b.id) ? 1 : 0;
    if (ma !== mb) return ma - mb;
    return masteryFor(a.id).streak - masteryFor(b.id).streak;
  });
  return pool.slice(0, count);
}
