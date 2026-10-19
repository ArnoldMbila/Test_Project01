// Profil: Fortschritt, Statistik, Erfolge, Stimmumfang, Einstellungen, Latenz-Test.
import { store, levelFor, currentStreak, ACHIEVEMENTS, today } from '../core/store.js';
import { classifyVoice, noteName, VOICE_TYPES } from '../core/notes.js';
import { audioCtx, mic, ensureMic, latency } from '../audio/engine.js';
import { click } from '../audio/synth.js';
import { LEVELS } from '../core/scoring.js';
import { stars, chips, bindChips, keyboardSvg, sheet, toast, escapeHtml, fmtTime } from '../ui/dom.js';
import { icon } from '../ui/icons.js';

function weekBars() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2), sec: store.stats.daily[today(d)] || 0, today: i === 0 });
  }
  const goal = store.profile.dailyGoalMin * 60;
  const max = Math.max(goal * 1.25, ...days.map((d) => d.sec));
  const total = days.reduce((a, d) => a + d.sec, 0);
  const goalDays = days.filter((d) => d.sec >= goal).length;
  return `<div class="week" style="--g:${(goal / max).toFixed(3)}"><span class="goal-line"><small>Ziel ${store.profile.dailyGoalMin} Min.</small></span>${days.map((d) => `<div class="wd" title="${Math.round(d.sec / 60)} Min."><div class="wb"><i class="${d.today ? 'today' : ''}" style="height:${Math.round((d.sec / max) * 100)}%"></i></div><small>${d.label}</small></div>`).join('')}</div>
    <p class="muted small" style="margin:12px 0 0">${Math.round(total / 60)} Min. in 7 Tagen · Ziel an ${goalDays} von 7 Tagen erreicht</p>`;
}

export function profileScreen(root) {
  const p = store.profile, s = store.stats;
  const lv = levelFor(s.xp);
  const vt = p.range ? classifyVoice(p.range[0], p.range[1]) : null;
  const songs = s.history.filter((h) => h.kind !== 'lesson');
  const avg = songs.length ? Math.round(songs.reduce((a, h) => a + h.score, 0) / songs.length) : 0;
  const earned = Object.keys(s.achievements).length;
  root.innerHTML = `
  <div class="profile">
    <header class="prof-head">
      <div class="avatar">${escapeHtml((p.name || '?').slice(0, 1).toUpperCase())}</div>
      <div><h1>${escapeHtml(p.name || 'Profil')}</h1><p class="sub muted">Level ${lv.level} · ${s.xp} XP · noch ${lv.toNext} XP bis Level ${lv.level + 1}</p>
      <div class="bar thin"><i style="width:${Math.round(lv.progress * 100)}%"></i></div></div>
    </header>
    <section class="res-grid" aria-label="Statistik">
      <div class="stat"><b>${currentStreak()}</b><small>Tage in Folge</small></div>
      <div class="stat"><b>${Math.round(s.seconds / 60)}</b><small>Minuten gesungen</small></div>
      <div class="stat"><b>${s.sessions}</b><small>Sessions</small></div>
      <div class="stat"><b>${songs.length ? avg : '—'}</b><small>Ø Punkte pro Song</small></div>
    </section>
    <div class="grid stretch">
      <section class="card span-3 week-card"><div class="row between"><h3>Diese Woche</h3><small class="faint">Minuten pro Tag</small></div>${weekBars()}</section>
      <section class="card span-3">
        <div class="row between"><h3>Stimmumfang</h3><a class="btn small" href="#/range">${vt ? 'Neu testen' : 'Testen'}</a></div>
        ${vt ? `<p class="vt">${vt.name}</p><p class="muted">${noteName(p.range[0], p.notation)} – ${noteName(p.range[1], p.notation)} · ${p.range[1] - p.range[0]} Halbtöne</p>${keyboardSvg(p.range[0], p.range[1], 36, 84)}`
          : `<p class="muted">Noch nicht gemessen. Der Test dauert eine Minute. So liegen die Stimmlagen:</p>
             <div class="vt-ref">${VOICE_TYPES.map((v) => `<div class="hist"><span>${v.name}</span><span class="faint num">${noteName(v.lo, p.notation)} – ${noteName(v.hi, p.notation)}</span></div>`).join('')}</div>`}
      </section>
      <a class="card span-6 link-card" href="#/studio"><div><h3 style="margin:0">Aufnahme-Studio</h3><p class="muted small">Deine gespeicherten Aufnahmen anhören und herunterladen</p></div><span class="chev">${icon('chevron', 18)}</span></a>
      <section class="card span-6"><div class="row between"><h3>Erfolge</h3><small class="faint num">${earned} von ${ACHIEVEMENTS.length}</small></div>
        <div class="ach">${ACHIEVEMENTS.map((a) => `<div class="a ${s.achievements[a.id] ? 'on' : ''}">${icon(s.achievements[a.id] ? 'check' : 'lock', 16)}<div><b>${escapeHtml(a.name)}</b><small>${escapeHtml(a.desc)}</small></div></div>`).join('')}</div>
      </section>
      ${s.history.length ? `<section class="card span-6"><h3>Verlauf</h3>${s.history.slice(0, 12).map((h) => `<div class="hist"><span class="faint num">${new Date(h.date).toLocaleDateString('de-DE')}</span><span class="grow">${escapeHtml(h.title)}</span>${stars(h.stars)}<span class="num">${h.score}</span></div>`).join('')}</section>` : ''}
      <section class="card span-6 settings">
        <h3>Einstellungen</h3>
        <label class="field">Name<input type="text" data-in="name" value="${escapeHtml(p.name)}" maxlength="24"></label>
        <div class="field">Notennamen ${chips('nota', [['de', 'C Cis D … H'], ['int', 'C C# D … B'], ['solf', 'Do Re Mi']], p.notation)}</div>
        <div class="field">Standard-Schwierigkeit ${chips('diff', Object.values(LEVELS).map((l) => [l.id, l.label]), p.difficulty)}</div>
        <div class="field">Tagesziel ${chips('goal', [[5, '5 Min.'], [10, '10 Min.'], [15, '15 Min.'], [20, '20 Min.']], p.dailyGoalMin)}</div>
        <div class="field">Echo-Unterdrückung ${chips('echo', [['1', 'An'], ['0', 'Aus']], p.echoCancel ? '1' : '0')}<span class="hint">An, wenn du ohne Kopfhörer singst.</span></div>
        <div class="field">Latenz-Ausgleich <span class="val num" data-lat>${p.latencyMs == null ? 'Auto' : p.latencyMs + ' ms'}</span>
          <input type="range" min="0" max="400" step="10" value="${p.latencyMs ?? 120}" data-in="lat" aria-label="Latenz in Millisekunden">
          <div class="row gap"><button class="btn small" data-act="auto">Auto</button><button class="btn small" data-act="calib">Klatsch-Test</button></div>
          <span class="hint">Läuft deine Stimm-Spur hinter den Noten her, erhöhe den Wert.</span></div>
        <button class="btn danger" data-act="reset">Fortschritt zurücksetzen</button>
      </section>
    </div>
    <p class="faint small center" style="margin-top:20px">Alle Daten bleiben auf diesem Gerät.</p>
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
