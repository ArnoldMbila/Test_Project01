// Stimmumfang-Test: tiefsten und höchsten gehaltenen Ton finden → Stimmlage.
import { mic, ensureMic } from '../audio/engine.js';
import { tone } from '../audio/synth.js';
import { store, unlock } from '../core/store.js';
import { classifyVoice, noteName } from '../core/notes.js';
import { BUILTIN, songFit } from '../core/catalog.js';
import { Lane } from '../ui/lane.js';
import { keyboardSvg, go, toast, escapeHtml } from '../ui/dom.js';

const HOLD = 0.45; // Sekunden stabil halten, damit ein Ton zählt

export async function rangeScreen(root) {
  const notation = store.profile.notation;
  let step = 'intro', low = null, high = null, raf = 0, lane = null, destroyed = false;

  function render() {
    cancelAnimationFrame(raf);
    if (lane) { lane.destroy(); lane = null; }
    if (step === 'intro') {
      root.innerHTML = `
      <div class="range-test">
        <header class="page-head"><button class="icon-btn" onclick="history.back()" aria-label="Zurück">‹</button><h1>Stimmumfang</h1></header>
        <div class="rt-hero">🎚️</div>
        <h2>Finde deine Stimmlage</h2>
        <ol class="steps"><li>Sing auf „aah“ <b>so tief</b> du bequem kannst und halte den Ton kurz.</li>
          <li>Dann <b>so hoch</b> du bequem kannst – ohne zu pressen.</li>
          <li>Wir berechnen deine Stimmlage und passen alle Songs an.</li></ol>
        <p class="muted small">🎧 Ruhige Umgebung hilft. Kopfhörer sind hier nicht nötig.</p>
        <button class="btn primary big" data-act="start">Los geht's</button>
      </div>`;
      root.querySelector('[data-act="start"]').onclick = async () => {
        const r = await ensureMic();
        if (!r.ok) return toast(escapeHtml(r.msg), 4000);
        step = 'low'; render();
      };
    } else if (step === 'low' || step === 'high') {
      const isLow = step === 'low';
      root.innerHTML = `
      <div class="range-test live">
        <header class="page-head"><button class="icon-btn" data-act="back" aria-label="Zurück">‹</button><h1>${isLow ? '1/2 · Tiefster Ton' : '2/2 · Höchster Ton'}</h1></header>
        <p class="lead">${isLow ? 'Rutsche mit deiner Stimme langsam <b>nach unten</b> und halte den tiefsten Ton.' : 'Jetzt langsam <b>nach oben</b> – halte den höchsten bequemen Ton.'}</p>
        <div class="rt-now"><span data-note>–</span><small data-hz>Sing einfach los …</small></div>
        <canvas class="lane rt-lane"></canvas>
        <div class="rt-best">${isLow ? 'Tiefster' : 'Höchster'} gehaltener Ton: <b data-best>–</b></div>
        <div class="hold"><i data-hold></i></div>
        <div class="row gap center">
          <button class="btn ghost" data-act="ref">🔈 Hilfston</button>
          <button class="btn primary" data-act="next" disabled>${isLow ? 'Weiter' : 'Auswerten'}</button>
        </div>
      </div>`;
      lane = new Lane(root.querySelector('canvas'), { color: '#3fe0c5', notation });
      lane.setRange(isLow ? 40 : 55, isLow ? 60 : 78);
      const noteEl = root.querySelector('[data-note]'), hzEl = root.querySelector('[data-hz]');
      const bestEl = root.querySelector('[data-best]'), holdEl = root.querySelector('[data-hold]');
      const nextBtn = root.querySelector('[data-act="next"]');
      let stableSince = 0, stableNote = null, t0 = performance.now();
      const frame = (now) => {
        if (destroyed) return;
        raf = requestAnimationFrame(frame);
        const t = (now - t0) / 1000;
        const p = mic.read();
        lane.pushPitch(t, p.midi, false);
        lane.render(t, 1 / 60, p.midi);
        if (p.midi != null) {
          noteEl.textContent = noteName(p.midi, notation);
          hzEl.textContent = Math.round(p.hz) + ' Hz';
          if (stableNote != null && Math.abs(p.midi - stableNote) < 0.6) {
            const held = (now - stableSince) / 1000;
            holdEl.style.width = Math.min(100, (held / HOLD) * 100) + '%';
            if (held >= HOLD) {
              const n = Math.round(stableNote);
              if (isLow && (low == null || n < low)) { low = n; bestEl.textContent = noteName(n, notation); nextBtn.disabled = false; }
              if (!isLow && (high == null || n > high)) { high = n; bestEl.textContent = noteName(n, notation); nextBtn.disabled = false; }
            }
          } else { stableNote = p.midi; stableSince = now; holdEl.style.width = '0'; }
        } else { stableNote = null; holdEl.style.width = '0'; }
      };
      raf = requestAnimationFrame(frame);
      root.querySelector('[data-act="ref"]').onclick = () => tone(isLow ? (low ?? 48) : (high ?? 64), 1.2, 0, { vol: 0.25 });
      root.querySelector('[data-act="back"]').onclick = () => { step = isLow ? 'intro' : 'low'; render(); };
      nextBtn.onclick = () => { step = isLow ? 'high' : 'result'; render(); };
    } else if (step === 'result') {
      if (high <= low) { const tmp = low; low = Math.min(low, high); high = Math.max(tmp, high); }
      const vt = classifyVoice(low, high);
      store.setProfile({ range: [low, high], voiceType: vt.id });
      const a = unlock('range_test');
      if (a) toast(`<b>${a.icon} Erfolg freigeschaltet</b><br>${a.name}`);
      const fits = BUILTIN.map((s) => ({ s, f: songFit(s) }));
      root.innerHTML = `
      <div class="range-test">
        <header class="page-head"><h1>Dein Ergebnis</h1></header>
        <div class="rt-result">
          <small class="muted">Deine Stimmlage</small>
          <h2 class="vt">${vt.name}</h2>
          <p>${vt.desc}</p>
          ${keyboardSvg(low, high, 36, 84)}
          <div class="row between small"><span>${noteName(low, notation)}</span><b>${high - low} Halbtöne</b><span>${noteName(high, notation)}</span></div>
        </div>
        <section class="card"><h3>So passen deine Songs</h3>
          ${fits.map(({ s, f }) => `<div class="hist"><span>${escapeHtml(s.title)}</span><span class="fit ${f.fit >= 0.85 ? 'good' : f.fit >= 0.6 ? 'ok' : 'hard'}">${f.label}</span></div>`).join('')}
          <p class="muted small">„Auto“-Tonart verschiebt die Songs automatisch in deinen Bereich.</p>
        </section>
        <div class="row gap center">
          <button class="btn ghost" data-act="again">Nochmal</button>
          <button class="btn primary" data-act="done">Fertig</button>
        </div>
      </div>`;
      root.querySelector('[data-act="again"]').onclick = () => { low = high = null; step = 'low'; render(); };
      root.querySelector('[data-act="done"]').onclick = () => go('#/');
    }
  }
  render();
  return () => { destroyed = true; cancelAnimationFrame(raf); lane && lane.destroy(); };
}
