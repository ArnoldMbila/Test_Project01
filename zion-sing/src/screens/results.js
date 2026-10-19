// Ergebnis nach einer Session: Punkte, Sterne, XP, Zeilen-Heatmap, Aufnahme.
import { lastResult } from './session.js';
import { levelFor, store } from '../core/store.js';
import { sfx } from '../audio/synth.js';
import { stars, go, toast, escapeHtml, fmtTime } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
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

  const ctx = [r.ref, r.mode === 'practice' ? 'Üben' : '', r.stage ? 'Stufe ' + stageById(r.stage).label : '', r.studio ? 'Studio' : ''].filter(Boolean).join(' · ');
  const next = r.stage && r.stars >= 2 ? nextStage(r.stage) : null;
  root.innerHTML = `
  <div class="results">
    <header class="res-head">
      ${r.cover ? `<div class="cover md"><img src="${r.cover}" alt="Cover: ${escapeHtml(r.title)}"></div>` : ''}
      <div><small>${escapeHtml(ctx)}</small><h1>${escapeHtml(r.title)}</h1></div>
    </header>

    <section class="card res-score">
      <div class="score-ring" style="--p:${r.score}">
        <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg"/></svg>
        <div><b data-count>0</b><small>von 100</small></div>
      </div>
      <div class="rs-side">
        <div class="res-stars">${stars(r.stars)}</div>
        <p class="res-msg">${MSG[r.stars]}</p>
        <div class="row">
          ${r.newBest ? '<span class="pill gold">Neuer Bestwert</span>' : ''}
          ${r.stageUnlocked && nextStage(r.stageUnlocked) ? `<span class="pill gold">Stufe ${nextStage(r.stageUnlocked).label} freigeschaltet</span>` : ''}
          ${r.stage && r.stars < 2 ? '<span class="pill">2 Sterne schalten die nächste Stufe frei</span>' : ''}
        </div>
      </div>
    </section>

    <section class="res-grid" aria-label="Auswertung">
      <div class="stat"><b>${r.notesHit}<span class="faint"> / ${r.notesTotal}</span></b><small>Noten getroffen</small></div>
      <div class="stat"><b>${r.bestCombo}</b><small>Noten in Folge</small></div>
      <div class="stat"><b>${fmtTime(r.seconds)}</b><small>gesungen</small></div>
      <div class="stat"><b>+${r.xp}</b><small>XP · Level ${lv.level}</small></div>
    </section>

    ${r.recordingUrl ? `<section class="card">
      <div class="row between"><h3>Deine Aufnahme</h3>${r.savedId ? '<span class="pill">Im Studio gespeichert</span>' : ''}</div>
      <audio controls src="${r.recordingUrl}" class="rec"></audio>
      <div class="row gap">
        ${r.savedId ? '' : `<button class="btn small" data-act="save">${icon('save', 14)} Im Studio speichern</button>`}
        <a class="btn small" download="ZionSing-${r.id}.${(r.recordingType || '').includes('mp4') ? 'm4a' : 'webm'}" href="${r.recordingUrl}">${icon('download', 14)} Herunterladen</a>
      </div>
    </section>` : ''}

    ${heat.length ? `<section class="card">
      <div class="row between"><h3>Zeile für Zeile</h3><small class="faint">Zeile antippen zum Üben</small></div>
      <div class="heat">${heat.map((x) => `<button class="heat-row" data-line="${x.i}">
        <span class="hb${x.acc < 0.4 ? ' low' : ''}"><i style="width:${Math.round(x.acc * 100)}%"></i></span>
        <span class="ht">${escapeHtml(x.l.words.map((w) => w[0]).join(' '))}</span>
        <span class="hp">${Math.round(x.acc * 100)}</span></button>`).join('')}</div>
    </section>` : ''}

    <div class="res-actions">
      ${next ? `<button class="btn primary big" data-act="next">Weiter mit Stufe ${next.label}</button>` : ''}
      ${!next && weak && weak.avg < 0.8 ? '<button class="btn primary big" data-act="weak">Schwächste Stelle üben</button>' : ''}
      <button class="btn big ${!next && !(weak && weak.avg < 0.8) ? 'primary' : ''}" data-act="again">${icon('repeat', 16)} Nochmal</button>
      ${r.studio ? '<a class="btn big" href="#/studio">Zum Studio</a>' : ''}
      <button class="btn big" data-act="done">Fertig</button>
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
  if (lv.level > prevLv.level) later(() => { sfx.level(); toast(`<b>Level ${lv.level} erreicht</b>`); }, 2200);
  r.unlocked.forEach((a, i) => later(() => toast(`<b>Erfolg: ${escapeHtml(a.name)}</b><br>${escapeHtml(a.desc)}`, 3200), 2600 + i * 1200));

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
        .then(() => { b.outerHTML = '<span class="pill">Im Studio gespeichert</span>'; const a = unlock('studio'); if (a) toast(`<b>Erfolg: ${escapeHtml(a.name)}</b>`); });
    } else if (b.dataset.act === 'again') {
      const q = r.mode === 'practice' ? `?mode=practice&from=${r.from}&to=${r.to}` : r.stage ? `?stage=${r.stage}` : r.studio ? '?studio=1' : '';
      go(base + q + (q ? '&' : '?') + 'n=' + Date.now());
    } else if (b.dataset.act === 'done') go(r.kind === 'song' ? `#/song/${r.id}` : '#/train');
  });
  return () => timers.forEach(clearTimeout);
}
