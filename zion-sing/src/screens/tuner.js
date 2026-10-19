// Stimmgerät: Live-Note, Cent-Abweichung, Verlauf, Referenztöne.
import { mic, ensureMic } from '../audio/engine.js';
import { tone } from '../audio/synth.js';
import { store } from '../core/store.js';
import { noteName, centsOff } from '../core/notes.js';
import { Lane } from '../ui/lane.js';
import { keyboardSvg, escapeHtml } from '../ui/dom.js';
import { icon } from '../ui/icons.js';

export async function tunerScreen(root) {
  const notation = store.profile.notation;
  root.innerHTML = `
  <div class="tuner">
    <a class="back-row" href="#/train">${icon('back', 16)} Training</a>
    <header class="page-head"><div><h1>Stimmgerät</h1><p class="sub">Sing einen Ton und sieh Note und Abweichung in Cent.</p></div></header>
    <div class="grid stretch">
      <section class="card span-3">
        <div class="tn-note"><span data-n>–</span><small data-hz>Sing einen Ton</small></div>
        <div class="needle"><div class="scale"><span>−50</span><span>0</span><span>+50</span></div><i data-needle></i></div>
        <div class="tn-kbd" data-kbd>${keyboardSvg(null, null, 40, 79)}</div>
        <h3 style="margin-top:18px">Referenzton</h3>
        <div class="ref-notes">${[48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72].map((m) => `<button class="chip" data-m="${m}">${noteName(m, notation)}</button>`).join('')}</div>
      </section>
      <section class="card span-3 tn-card"><div class="row between"><h3>Verlauf</h3><small class="faint">die letzten 2 Sekunden</small></div><canvas class="lane tn-lane"></canvas></section>
    </div>
    <p class="banner" data-err hidden></p>
  </div>`;
  const r = await ensureMic();
  if (!r.ok) { const e = root.querySelector('[data-err]'); e.hidden = false; e.textContent = r.msg; }
  const lane = new Lane(root.querySelector('canvas'), { color: '#3fe0c5', notation });
  lane.setRange(48, 66);
  const nEl = root.querySelector('[data-n]'), hzEl = root.querySelector('[data-hz]');
  const needle = root.querySelector('[data-needle]'), kbd = root.querySelector('[data-kbd]');
  let raf = 0, t0 = performance.now(), lastKey = null;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    const p = mic.read();
    const c = p.midi != null ? centsOff(p.midi) : 0;
    const good = p.midi != null && Math.abs(c) < 12;
    lane.pushPitch(t, p.midi, good);
    lane.render(t, 1 / 60, p.midi);
    if (p.midi != null) {
      nEl.textContent = noteName(p.midi, notation);
      nEl.className = good ? 'good' : '';
      hzEl.textContent = `${p.hz.toFixed(1)} Hz · ${c > 0 ? '+' : ''}${c} Cent`;
      needle.style.left = 50 + c + '%';
      needle.className = good ? 'good' : '';
      const k = Math.round(p.midi);
      if (k !== lastKey) { lastKey = k; kbd.innerHTML = keyboardSvg(null, null, 40, 79, k); }
    }
  };
  raf = requestAnimationFrame(frame);
  root.querySelector('.ref-notes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]');
    if (b) tone(+b.dataset.m, 1.5, 0, { vol: 0.25 });
  });
  return () => { cancelAnimationFrame(raf); lane.destroy(); };
}

export { escapeHtml };
