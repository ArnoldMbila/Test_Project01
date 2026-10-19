// Training: Kurs mit Lektionen (Pfad), Warm-ups und Lektions-Intro.
import { store, today } from '../core/store.js';
import { COURSE, WARMUPS, DAILY, findLesson } from '../core/lessons.js';
import { stars, go, escapeHtml } from '../ui/dom.js';

export function trainScreen(root) {
  const done = store.stats.lessons;
  let unlocked = true;
  root.innerHTML = `
  <div class="train">
    <header class="page-head"><h1>Training</h1><a class="btn small ghost" href="#/tuner">🎯 Stimmgerät</a></header>
    <a class="card daily" href="#/lesson-intro/${DAILY.id}"><div class="cta-ic">${store.stats.warmups[today()] ? '✅' : DAILY.icon}</div>
      <div><b>${DAILY.title}</b><p class="muted small">~5 Min. · Atem, lange Töne, Sirene, Leiter, Intervalle, Arpeggio, Höhe, Oktave</p></div><span class="chev">›</span></a>
    <div class="sec-head"><h2>Einzelne Warm-ups</h2><small class="muted">je ~1 Minute</small></div>
    <div class="warmups">${WARMUPS.map((w) => `<a class="warm" href="#/lesson/${w.id}"><span>${w.icon}</span><b>${w.title}</b>${done[w.id] ? stars(done[w.id].stars) : ''}</a>`).join('')}</div>
    <div class="sec-head"><h2>Gesangskurs</h2><small class="muted">Schritt für Schritt</small></div>
    <div class="path">${COURSE.map((u) => `
      <div class="unit"><div class="unit-head"><span>${u.icon}</span><b>${u.unit}</b></div>
      ${u.lessons.map((l, i) => {
        const d = done[l.id];
        const open = unlocked;
        if (!d) unlocked = false;
        return `<a class="node ${d ? 'done' : open ? 'open' : 'locked'} ${i % 2 ? 'r' : 'l'}" ${open || d ? `href="#/lesson-intro/${l.id}"` : ''}>
          <span class="bubble">${d ? '✓' : open ? '▶' : '🔒'}</span><span class="nl"><b>${escapeHtml(l.title)}</b>${d ? stars(d.stars) : ''}</span></a>`;
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
      <header class="page-head"><button class="icon-btn" onclick="history.back()" aria-label="Zurück">‹</button><div><small class="muted">${escapeHtml(l.unit || 'Warm-up')}</small><h1>${escapeHtml(l.title)}</h1></div></header>
      <div class="tip-card"><span class="tip-n">Tipp ${i + 1}/${l.tips.length}</span><p>${escapeHtml(l.tips[i])}</p>
        <button class="btn small ghost" data-act="speak">🔊 Vorlesen</button></div>
      <div class="dots-nav">${l.tips.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <p class="muted small center">So läuft die Übung: Gestrichelte Noten 👂 <b>hören</b>, volle Noten 🎤 <b>nachsingen</b>.</p>
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
