// Ergebnis nach einer Session: Punkte, Sterne, XP, Zeilen-Heatmap, Aufnahme.
import { lastResult } from './session.js';
import { levelFor, store } from '../core/store.js';
import { sfx } from '../audio/synth.js';
import { stars, go, toast, confetti, escapeHtml, fmtTime } from '../ui/dom.js';
import { LEVELS } from '../core/scoring.js';
import { stageById, nextStage } from '../core/stages.js';
import { recordings, unlock } from '../core/store.js';

const MSG = [
  'Guter Anfang – jede Runde macht dich sicherer!',
  'Schön gesungen! Da geht noch mehr.',
  'Stark! Du hast den Song im Griff.',
  'Fantastisch – das war bühnenreif!',
];

/** Schwächster zusammenhängender Abschnitt (2–4 Zeilen) zum Üben. */
function weakest(perLine) {
  let best = null;
  for (let i = 0; i < perLine.length; i++) {
    for (let len = 2; len <= 4; len++) {
      const seg = perLine.slice(i, i + len).filter((x) => x != null);
      if (seg.length < 2) continue;
      const avg = seg.reduce((a, b) => a + b, 0) / seg.length;
      if (!best || avg < best.avg) best = { from: i, to: i + len - 1, avg };
    }
  }
  return best;
}

export function resultsScreen(root) {
  const r = lastResult;
  if (!r) { go('#/'); return; }
  const lv = levelFor(store.stats.xp);
  const prevLv = levelFor(store.stats.xp - r.xp);
  const weak = r.kind === 'song' ? weakest(r.perLine) : null;
  const heat = r.kind === 'song' ? r.lines.map((l, i) => ({ l, i, acc: r.perLine[i] }))
    .filter((x) => x.acc != null && (r.from == null || (x.i >= r.from && x.i <= r.to))) : [];

  root.innerHTML = `
  <div class="results" style="--c:${r.color}">
    <div class="res-hero">
      ${r.cover ? `<img class="res-bg" src="${r.cover}" alt="">` : ''}
      <div class="res-title"><small>${escapeHtml(r.ref)}${r.mode === 'practice' ? ' · Üben' : ''}${r.stage ? ' · Stufe ' + stageById(r.stage).label : ''}${r.studio ? ' · Studio' : ''}</small><h2>${escapeHtml(r.title)}</h2></div>
      <div class="score-ring" style="--p:${r.score}">
        <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg"/></svg>
        <div><b data-count>0</b><small>Punkte</small></div>
      </div>
      <div class="res-stars">${stars(r.stars)}</div>
      ${r.newBest ? '<div class="badge gold">🏅 Neuer Rekord!</div>' : ''}
      ${r.stageUnlocked && nextStage(r.stageUnlocked) ? `<div class="badge gold">🔓 Stufe ${nextStage(r.stageUnlocked).label} freigeschaltet!</div>` : ''}
      ${r.stage && r.stars < 2 ? `<p class="muted small">Hol 2 Sterne, um die nächste Stufe freizuschalten.</p>` : ''}
      <p class="res-msg">${MSG[r.stars]}</p>
    </div>
    <div class="res-grid">
      <div class="stat"><b>${r.notesHit}/${r.notesTotal}</b><small>Noten getroffen</small></div>
      <div class="stat"><b>${r.bestCombo}×</b><small>beste Combo</small></div>
      <div class="stat"><b>${fmtTime(r.seconds)}</b><small>gesungen</small></div>
      <div class="stat"><b>+${r.xp}</b><small>XP</small></div>
    </div>
    <div class="card lvl">
      <div class="row between"><b>Level ${lv.level}</b><small class="muted">${lv.toNext} XP bis Level ${lv.level + 1}</small></div>
      <div class="bar"><i style="width:${Math.round(lv.progress * 100)}%"></i></div>
      <small class="muted">${LEVELS[r.difficulty] ? 'Schwierigkeit: ' + LEVELS[r.difficulty].label : ''}${r.loops ? ` · ${r.loops} Runden` : ''}</small>
    </div>
    ${r.recordingUrl ? `<div class="card">
      <h3>🎧 Deine Aufnahme</h3>
      <audio controls src="${r.recordingUrl}" class="rec"></audio>
      ${r.savedId ? '<p class="muted small">✓ Im Studio gespeichert</p>' : '<button class="btn ghost small" data-act="save">💾 Im Studio speichern</button>'}
      <a class="btn ghost small" download="ZionSing-${r.id}.${(r.recordingType || '').includes('mp4') ? 'm4a' : 'webm'}" href="${r.recordingUrl}">⬇︎ Herunterladen</a>
    </div>` : ''}
    ${heat.length ? `<div class="card">
      <h3>Zeile für Zeile</h3><p class="muted small">Tippe auf eine Zeile, um sie gezielt zu üben.</p>
      <div class="heat">${heat.map((x) => `<button class="heat-row" data-line="${x.i}">
        <span class="hb" style="--a:${x.acc.toFixed(2)}"></span>
        <span class="ht">${escapeHtml(x.l.words.map((w) => w[0]).join(' '))}</span>
        <span class="hp">${Math.round(x.acc * 100)}</span></button>`).join('')}</div>
    </div>` : ''}
    <div class="res-actions">
      ${r.stage && r.stars >= 2 && nextStage(r.stage) ? `<button class="btn primary" data-act="next">▶ Weiter: Stufe ${nextStage(r.stage).label}</button>` : ''}
      ${r.studio ? '<a class="btn ghost" href="#/studio">🎧 Zum Studio</a>' : ''}
      ${weak && weak.avg < 0.8 ? `<button class="btn primary" data-act="weak">🎯 Schwache Stelle üben</button>` : ''}
      <button class="btn ${weak && weak.avg < 0.8 ? 'ghost' : 'primary'}" data-act="again">↻ Nochmal</button>
      <button class="btn ghost" data-act="done">Fertig</button>
    </div>
  </div>`;

  // Animationen (Timer werden beim Verlassen abgebrochen)
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const cnt = root.querySelector('[data-count]');
  const t0 = performance.now();
  const anim = (now) => {
    const p = Math.min(1, (now - t0) / 1200);
    cnt.textContent = Math.round(r.score * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);
  root.querySelectorAll('.res-stars .star.on').forEach((s, i) => later(() => { s.classList.add('pop'); sfx.star(); }, 900 + i * 350));
  if (r.stars >= 3) later(() => confetti(), 1600);
  if (lv.level > prevLv.level) later(() => { sfx.level(); toast(`🎉 Level ${lv.level} erreicht!`); }, 2200);
  r.unlocked.forEach((a, i) => later(() => toast(`<b>${a.icon} Erfolg freigeschaltet</b><br>${escapeHtml(a.name)}`, 3200), 2600 + i * 1200));

  const base = r.kind === 'song' ? `#/sing/${r.id}` : `#/lesson/${r.id}`;
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act],[data-line]');
    if (!b) return;
    if (b.dataset.line != null) {
      const i = +b.dataset.line;
      go(`#/sing/${r.id}?mode=practice&from=${Math.max(0, i)}&to=${i}`);
    } else if (b.dataset.act === 'weak') go(`#/sing/${r.id}?mode=practice&from=${weak.from}&to=${weak.to}`);
    else if (b.dataset.act === 'next') go(`#/sing/${r.id}?stage=${nextStage(r.stage).id}`);
    else if (b.dataset.act === 'save') {
      b.disabled = true;
      r.savedId = 'rec_' + Date.now();
      recordings.put({ id: r.savedId, songId: r.id, title: r.title, ref: r.ref, score: r.score, stars: r.stars,
        date: new Date().toISOString(), seconds: r.seconds, blob: r.recordingBlob, type: r.recordingType })
        .then(() => { b.outerHTML = '<p class="muted small">✓ Im Studio gespeichert</p>'; const a = unlock('studio'); if (a) toast(`<b>${a.icon} ${a.name}</b>`); });
    } else if (b.dataset.act === 'again') {
      const q = r.mode === 'practice' ? `?mode=practice&from=${r.from}&to=${r.to}` : r.stage ? `?stage=${r.stage}` : r.studio ? '?studio=1' : '';
      go(base + q + (q ? '&' : '?') + 'n=' + Date.now());
    } else if (b.dataset.act === 'done') go(r.kind === 'song' ? `#/song/${r.id}` : '#/train');
  });
  return () => timers.forEach(clearTimeout);
}
