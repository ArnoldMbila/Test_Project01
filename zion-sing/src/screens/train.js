// Training: Kurs mit Lektionen (Pfad), Warm-ups und Lektions-Intro.
import { store, today } from '../core/store.js';
import { COURSE, WARMUPS, DAILY, findLesson } from '../core/lessons.js';
import { stars, go, escapeHtml } from '../ui/dom.js';
import { icon } from '../ui/icons.js';

export function trainScreen(root) {
  const done = store.stats.lessons;
  let unlocked = true;
  root.innerHTML = `
  <div class="train">
    <header class="page-head"><div><h1>Training</h1><p class="sub">${COURSE.flatMap((u) => u.lessons).filter((l) => done[l.id]).length} von ${COURSE.reduce((a, u) => a + u.lessons.length, 0)} Lektionen geschafft</p></div>
      <a class="btn small" href="#/tuner">${icon('tuner', 16)} Stimmgerät</a></header>
    <a class="card link-card" href="#/lesson-intro/${DAILY.id}">
      <div><h2>${DAILY.title}</h2><p class="muted small">${DAILY.min} Min. · Atem, lange Töne, Sirene, Leiter, Intervalle, Arpeggio, Höhe, Oktave</p></div>
      ${store.stats.warmups[today()] ? `<span class="pill gold">${icon('check', 14)} Heute erledigt</span>` : `<span class="chev">${icon('chevron', 18)}</span>`}</a>
    <div class="sec-head"><h2>Einzelne Warm-ups</h2><small class="faint">je etwa 1 Minute</small></div>
    <div class="warmups">${WARMUPS.map((w) => `<a class="warm" href="#/lesson/${w.id}"><b>${w.title}</b>${done[w.id] ? stars(done[w.id].stars) : `<span class="chev">${icon('play', 14)}</span>`}</a>`).join('')}</div>
    <div class="sec-head"><h2>Gesangskurs</h2><small class="faint">Lektion für Lektion</small></div>
    <div class="path">${COURSE.map((u) => `
      <div class="unit"><div class="unit-head"><b>${u.unit}</b><small>${u.lessons.filter((l) => done[l.id]).length} von ${u.lessons.length}</small></div>
      ${u.lessons.map((l, i) => {
        const d = done[l.id];
        const open = unlocked;
        if (!d) unlocked = false;
        return `<a class="node ${d ? 'done' : open ? 'open' : 'locked'}" ${open || d ? `href="#/lesson-intro/${l.id}"` : 'aria-disabled="true"'}>
          <span class="bubble">${d ? icon('check', 16) : open ? icon('play', 14) : icon('lock', 14)}</span><span class="nl"><b>${escapeHtml(l.title)}</b>${d ? stars(d.stars) : ''}</span></a>`;
      }).join('')}</div>`).join('')}
    </div>
  </div>`;
}

export function lessonIntroScreen(root, params) {
  const l = findLesson(params.id);
  if (!l) { go('#/train'); return; }
  let i = 0;
  const speak = (txt) => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'de-DE'; u.rate = 1.02;
    speechSynthesis.speak(u);
  };
  const render = () => {
    root.innerHTML = `
    <div class="lesson-intro">
      <a class="back-row" href="#/train">${icon('back', 16)} Training</a>
      <header class="page-head"><div><h1>${escapeHtml(l.title)}</h1><p class="sub">${escapeHtml(l.unit || 'Warm-up')}</p></div></header>
      <div class="tip-card"><span class="tip-n">Tipp ${i + 1} von ${l.tips.length}</span><p>${escapeHtml(l.tips[i])}</p>
        <button class="btn small" data-act="speak">${icon('volume', 14)} Vorlesen</button></div>
      <div class="dots-nav">${l.tips.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <p class="muted small center">Gestrichelte Noten hörst du, volle Noten singst du nach.</p>
      <button class="btn primary big" data-act="next">${i < l.tips.length - 1 ? 'Weiter' : 'Übung starten'}</button>
    </div>`;
    root.querySelector('[data-act="speak"]').onclick = () => speak(l.tips[i]);
    root.querySelector('[data-act="next"]').onclick = () => {
      if (i < l.tips.length - 1) { i++; render(); } else go(`#/lesson/${l.id}`);
    };
  };
  render();
  return () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); };
}
