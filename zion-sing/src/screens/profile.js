// Profil: Fortschritt, Statistik, Erfolge, Stimmumfang, Einstellungen, Latenz-Test.
import { store, levelFor, currentStreak, ACHIEVEMENTS, today } from '../core/store.js';
import { classifyVoice, noteName } from '../core/notes.js';
import { audioCtx, mic, ensureMic, latency } from '../audio/engine.js';
import { click } from '../audio/synth.js';
import { LEVELS } from '../core/scoring.js';
import { stars, chips, bindChips, keyboardSvg, sheet, toast, escapeHtml, fmtTime } from '../ui/dom.js';

function weekBars() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2), sec: store.stats.daily[today(d)] || 0 });
  }
  const max = Math.max(60, ...days.map((d) => d.sec));
  return `<div class="week">${days.map((d) => `<div class="wd"><i style="height:${Math.round((d.sec / max) * 100)}%"></i><small>${d.label}</small></div>`).join('')}</div>`;
}

export function profileScreen(root) {
  const p = store.profile, s = store.stats;
  const lv = levelFor(s.xp);
  const vt = p.range ? classifyVoice(p.range[0], p.range[1]) : null;
  const songs = s.history.filter((h) => h.kind !== 'lesson');
  const avg = songs.length ? Math.round(songs.reduce((a, h) => a + h.score, 0) / songs.length) : 0;
  root.innerHTML = `
  <div class="profile">
    <header class="prof-head">
      <div class="avatar">${escapeHtml((p.name || '?').slice(0, 1).toUpperCase())}</div>
      <div><h1>${escapeHtml(p.name || 'Sänger:in')}</h1><small class="muted">Level ${lv.level} · ${s.xp} XP</small>
      <div class="bar thin"><i style="width:${Math.round(lv.progress * 100)}%"></i></div></div>
    </header>
    <div class="res-grid">
      <div class="stat"><b>🔥 ${currentStreak()}</b><small>Tage Serie</small></div>
      <div class="stat"><b>${Math.round(s.seconds / 60)}</b><small>Minuten</small></div>
      <div class="stat"><b>${s.sessions}</b><small>Sessions</small></div>
      <div class="stat"><b>${avg}</b><small>Ø Punkte</small></div>
    </div>
    <section class="card"><h3>Diese Woche</h3>${weekBars()}</section>
    <section class="card">
      <div class="row between"><h3>Stimmumfang</h3><a class="btn small ghost" href="#/range">${vt ? 'Neu testen' : 'Testen'}</a></div>
      ${vt ? `<b class="vt-sm">${vt.name}</b> <small class="muted">${noteName(p.range[0], p.notation)} – ${noteName(p.range[1], p.notation)}</small>${keyboardSvg(p.range[0], p.range[1], 36, 84)}`
        : '<p class="muted">Noch nicht gemessen.</p>'}
    </section>
    <section class="card"><h3>Erfolge <small class="muted">${Object.keys(s.achievements).length}/${ACHIEVEMENTS.length}</small></h3>
      <div class="ach">${ACHIEVEMENTS.map((a) => `<div class="a ${s.achievements[a.id] ? 'on' : ''}" title="${escapeHtml(a.desc)}"><span>${a.icon}</span><b>${escapeHtml(a.name)}</b><small>${escapeHtml(a.desc)}</small></div>`).join('')}</div>
    </section>
    ${s.history.length ? `<section class="card"><h3>Verlauf</h3>${s.history.slice(0, 12).map((h) => `<div class="hist"><span>${new Date(h.date).toLocaleDateString('de-DE')}</span><span class="grow">${escapeHtml(h.title)}</span>${stars(h.stars)}<b>${h.score}</b></div>`).join('')}</section>` : ''}
    <section class="card settings">
      <h3>Einstellungen</h3>
      <label class="field">Name<input type="text" data-in="name" value="${escapeHtml(p.name)}" maxlength="24"></label>
      <div class="field">Notennamen ${chips('nota', [['de', 'C D E … H'], ['int', 'C D E … B'], ['solf', 'Do Re Mi']], p.notation)}</div>
      <div class="field">Standard-Schwierigkeit ${chips('diff', Object.values(LEVELS).map((l) => [l.id, l.label]), p.difficulty)}</div>
      <div class="field">Tagesziel ${chips('goal', [[5, '5 Min.'], [10, '10 Min.'], [15, '15 Min.'], [20, '20 Min.']], p.dailyGoalMin)}</div>
      <div class="field">Echo-Unterdrückung (ohne Kopfhörer) ${chips('echo', [['1', 'An'], ['0', 'Aus']], p.echoCancel ? '1' : '0')}</div>
      <div class="field">Latenz-Ausgleich <span class="val" data-lat>${p.latencyMs == null ? 'Auto' : p.latencyMs + ' ms'}</span>
        <input type="range" min="0" max="400" step="10" value="${p.latencyMs ?? 120}" data-in="lat">
        <div class="row gap"><button class="btn small ghost" data-act="auto">Auto</button><button class="btn small ghost" data-act="calib">🥁 Klatsch-Test</button></div>
        <small class="muted">Wenn deine Stimm-Spur immer hinter den Noten herläuft, erhöhe den Wert.</small></div>
      <button class="btn ghost danger" data-act="reset">Fortschritt zurücksetzen</button>
    </section>
    <p class="muted small center">Zion Sing · Offenbarung (Elberfelder) · Alle Daten bleiben auf diesem Gerät.</p>
  </div>`;

  root.querySelector('[data-in="name"]').onchange = (e) => store.setProfile({ name: e.target.value.trim() });
  bindChips(root, 'nota', (v) => store.setProfile({ notation: v }));
  bindChips(root, 'diff', (v) => store.setProfile({ difficulty: v }));
  bindChips(root, 'goal', (v) => store.setProfile({ dailyGoalMin: +v }));
  bindChips(root, 'echo', (v) => { store.setProfile({ echoCancel: v === '1' }); mic.stop(); });
  const latEl = root.querySelector('[data-lat]');
  root.querySelector('[data-in="lat"]').oninput = (e) => { store.setProfile({ latencyMs: +e.target.value }); latEl.textContent = e.target.value + ' ms'; };
  root.querySelector('[data-act="auto"]').onclick = () => { store.setProfile({ latencyMs: null }); latEl.textContent = 'Auto'; };
  root.querySelector('[data-act="calib"]').onclick = () => calibrate((ms) => {
    store.setProfile({ latencyMs: ms });
    latEl.textContent = ms + ' ms';
    root.querySelector('[data-in="lat"]').value = ms;
  });
  root.querySelector('[data-act="reset"]').onclick = () => {
    if (confirm('Wirklich alle Punkte, Erfolge und Einstellungen löschen?')) { store.reset(); location.hash = '#/'; location.reload(); }
  };
}

/** Klatsch-Test: 8 Klicks, du klatschst mit → Median-Versatz = Latenz. */
async function calibrate(onDone) {
  const r = await ensureMic();
  if (!r.ok) return toast(escapeHtml(r.msg), 4000);
  const sh = sheet('Klatsch-Test', `
    <p>Klatsche <b>genau im Takt</b> mit den 8 Klicks (oder lass das Mikro die Klicks über den Lautsprecher hören).</p>
    <div class="calib"><div class="beats">${'<i></i>'.repeat(8)}</div><b data-res>Bereit …</b></div>`);
  const c = audioCtx();
  const start = c.currentTime + 1.2, step = 0.6;
  const clicks = [];
  for (let i = 0; i < 8; i++) { clicks.push(start + i * step); click(start + i * step - c.currentTime, i % 4 === 0); }
  const onsets = [];
  let above = false, floor = 0.01;
  const beats = sh.el.querySelectorAll('.beats i');
  const poll = () => {
    const now = c.currentTime;
    mic.read();
    const lv = mic.level;
    if (!above && lv > Math.max(0.04, floor * 4)) { above = true; onsets.push(now); }
    if (above && lv < Math.max(0.02, floor * 2)) above = false;
    if (!above) floor = floor * 0.95 + lv * 0.05;
    clicks.forEach((t, i) => beats[i].classList.toggle('on', now >= t));
    if (now < start + 8 * step + 0.5) requestAnimationFrame(poll);
    else finish();
  };
  const finish = () => {
    const offs = clicks.map((t) => onsets.find((o) => o > t - 0.15 && o < t + 0.45)).map((o, i) => (o == null ? null : o - clicks[i])).filter((x) => x != null);
    const res = sh.el.querySelector('[data-res]');
    if (offs.length < 4) { res.textContent = 'Zu wenige Klatscher erkannt – bitte nochmal.'; return; }
    offs.sort((a, b) => a - b);
    const ms = Math.max(0, Math.min(400, Math.round((offs[offs.length >> 1] * 1000) / 10) * 10));
    res.textContent = `Gemessen: ${ms} ms (vorher ${Math.round(latency() * 1000)} ms)`;
    onDone(ms);
  };
  requestAnimationFrame(poll);
}

export { fmtTime };
