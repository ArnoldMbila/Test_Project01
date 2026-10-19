// Eigenen Song importieren: Audio + Text → Melodie-Analyse → Timing tappen → speichern.
import { customSongs, unlock } from '../core/store.js';
import { BIBLE } from '../core/catalog.js';
import { decodeFile, extractNotes, textToLines, buildTimedLines } from '../audio/analyze.js';
import { sfx } from '../audio/synth.js';
import { go, toast, escapeHtml, fmtTime } from '../ui/dom.js';

const COLORS = ['#ff7a45', '#3fb6ff', '#b06cff', '#3fe0c5', '#ff5fa2', '#ffc53d'];

export function importScreen(root, params) {
  const st = { file: null, title: '', text: '', ref: '', notes: null, duration: 0, lineWords: [], starts: [] };
  if (params.ch) {
    const ch = BIBLE[+params.ch - 1];
    if (ch) { st.text = ch.v.join('\n'); st.ref = `Offb ${ch.n},1-${ch.v.length}`; st.title = ch.title; }
  }
  let cleanup = () => {};

  function stepForm() {
    root.innerHTML = `
    <div class="import">
      <header class="page-head"><button class="icon-btn" onclick="history.back()" aria-label="Zurück">‹</button><h1>Song importieren</h1></header>
      <ol class="wizard"><li class="on">Datei & Text</li><li>Analyse</li><li>Timing</li></ol>
      <label class="drop" data-drop><input type="file" accept="audio/*" data-file hidden>
        <span class="big-ic">🎵</span><b data-fname>${st.file ? escapeHtml(st.file.name) : 'Audiodatei wählen (MP3, M4A, WAV)'}</b><small class="muted">Wird nur lokal auf diesem Gerät gespeichert.</small></label>
      <label class="field">Titel<input type="text" data-title value="${escapeHtml(st.title)}" placeholder="z. B. Offb 21 – Das neue Jerusalem"></label>
      <div class="field">Text aus der Offenbarung übernehmen
        <div class="row gap">
          <select data-ch>${BIBLE.map((c) => `<option value="${c.n}">Kapitel ${c.n} – ${escapeHtml(c.title)}</option>`).join('')}</select>
          <input type="number" min="1" value="1" data-v0 aria-label="Von Vers" class="num"> – <input type="number" min="1" value="5" data-v1 aria-label="Bis Vers" class="num">
          <button class="btn small ghost" data-act="verses">Einfügen</button>
        </div></div>
      <label class="field">Songtext (eine Zeile pro Phrase)<textarea rows="9" data-text placeholder="Text hier einfügen …">${escapeHtml(st.text)}</textarea></label>
      <button class="btn primary big" data-act="next">Weiter: Melodie analysieren</button>
    </div>`;
    const q = (s) => root.querySelector(s);
    q('[data-drop]').onclick = (e) => { if (e.target.tagName !== 'INPUT') q('[data-file]').click(); };
    q('[data-file]').onchange = (e) => {
      st.file = e.target.files[0];
      if (st.file) { q('[data-fname]').textContent = st.file.name; if (!q('[data-title]').value) q('[data-title]').value = st.file.name.replace(/\.[^.]+$/, ''); }
    };
    if (params.ch) q('[data-ch]').value = params.ch;
    q('[data-act="verses"]').onclick = () => {
      const ch = BIBLE[+q('[data-ch]').value - 1];
      const v0 = Math.max(1, +q('[data-v0]').value), v1 = Math.min(ch.v.length, Math.max(v0, +q('[data-v1]').value));
      q('[data-text]').value = ch.v.slice(v0 - 1, v1).join('\n');
      st.ref = `Offb ${ch.n},${v0}-${v1}`;
      if (!q('[data-title]').value) q('[data-title]').value = ch.title;
    };
    q('[data-act="next"]').onclick = () => {
      st.title = q('[data-title]').value.trim() || 'Mein Song';
      st.text = q('[data-text]').value.trim();
      if (!st.file) return toast('Bitte zuerst eine Audiodatei wählen.');
      if (!st.text) return toast('Bitte den Songtext einfügen.');
      st.lineWords = textToLines(st.text);
      stepAnalyze();
    };
  }

  async function stepAnalyze() {
    root.innerHTML = `
    <div class="import">
      <header class="page-head"><h1>Analyse</h1></header>
      <ol class="wizard"><li class="ok">Datei & Text</li><li class="on">Analyse</li><li>Timing</li></ol>
      <div class="analyze"><div class="spinner"></div><b data-stage>Audio wird dekodiert …</b><div class="bar"><i data-prog></i></div>
      <p class="muted small">Die Melodie wird direkt im Browser aus der Aufnahme geschätzt (YIN-Tonhöhenerkennung).</p></div>
    </div>`;
    const stage = root.querySelector('[data-stage]'), prog = root.querySelector('[data-prog]');
    try {
      const { duration, mono } = await decodeFile(st.file);
      st.duration = duration;
      stage.textContent = 'Melodie wird erkannt …';
      st.notes = await extractNotes(mono, (p) => { prog.style.width = Math.round(p * 100) + '%'; });
      stage.textContent = `${st.notes.length} Noten erkannt`;
      setTimeout(stepTap, 500);
    } catch (e) {
      stage.textContent = 'Datei konnte nicht gelesen werden. Bitte ein anderes Format probieren.';
    }
  }

  function stepTap() {
    st.starts = [];
    const url = URL.createObjectURL(st.file);
    const audio = new Audio(url);
    audio.preservesPitch = true;
    root.innerHTML = `
    <div class="import tap">
      <header class="page-head"><h1>Timing</h1></header>
      <ol class="wizard"><li class="ok">Datei & Text</li><li class="ok">Analyse</li><li class="on">Timing</li></ol>
      <p class="muted">Starte den Song und tippe <b>TAP</b> (oder Leertaste) genau, wenn die hervorgehobene Zeile beginnt.</p>
      <div class="tap-lines" data-lines></div>
      <div class="row between"><small data-time>0:00</small><small data-count>0/${st.lineWords.length}</small></div>
      <div class="row gap center">
        <button class="btn ghost" data-act="play">▶ Start</button>
        <button class="btn ghost" data-act="undo">↶ Zurück</button>
        <button class="btn ghost" data-act="slow">🐢 75 %</button>
      </div>
      <button class="tap-btn" data-act="tap">TAP</button>
      <div class="row gap center"><button class="btn small ghost" data-act="auto">Automatisch verteilen</button>
        <button class="btn primary" data-act="save" disabled>Speichern</button></div>
    </div>`;
    const q = (s) => root.querySelector(s);
    const linesEl = q('[data-lines]');
    const renderLines = () => {
      const i = st.starts.length;
      linesEl.innerHTML = st.lineWords.map((w, k) => `<p class="${k < i ? 'done' : k === i ? 'cur' : ''}">${escapeHtml(w.join(' '))}${k < i ? ` <small>${fmtTime(st.starts[k])}</small>` : ''}</p>`).join('');
      const cur = linesEl.querySelector('.cur');
      cur && cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
      q('[data-count]').textContent = `${i}/${st.lineWords.length}`;
      q('[data-act="save"]').disabled = i < st.lineWords.length;
    };
    const tap = () => {
      if (audio.paused || st.starts.length >= st.lineWords.length) return;
      st.starts.push(Math.max(0, audio.currentTime - 0.12));
      sfx.tap();
      renderLines();
    };
    const timer = setInterval(() => { q('[data-time]') && (q('[data-time]').textContent = fmtTime(audio.currentTime)); }, 250);
    q('[data-act="play"]').onclick = (e) => { if (audio.paused) { audio.play(); e.target.textContent = '❚❚ Pause'; } else { audio.pause(); e.target.textContent = '▶ Weiter'; } };
    q('[data-act="undo"]').onclick = () => { const t = st.starts.pop(); if (t != null) audio.currentTime = Math.max(0, t - 2); renderLines(); };
    q('[data-act="slow"]').onclick = (e) => { audio.playbackRate = audio.playbackRate === 1 ? 0.75 : 1; e.target.classList.toggle('on', audio.playbackRate !== 1); };
    q('[data-act="tap"]').onclick = tap;
    q('[data-act="auto"]').onclick = () => {
      // Zeilen nach Wortanzahl über den Bereich mit erkannten Noten verteilen
      const a = st.notes.length ? st.notes[0][0] : 2, b = st.notes.length ? st.notes[st.notes.length - 1][0] : st.duration - 2;
      const counts = st.lineWords.map((w) => w.length), total = counts.reduce((x, y) => x + y, 0);
      let acc = 0;
      st.starts = counts.map((c) => { const t = a + ((b - a) * acc) / total; acc += c; return +t.toFixed(2); });
      renderLines();
      toast('Grob verteilt – für exaktes Timing lieber tappen.');
    };
    q('[data-act="save"]').onclick = async () => {
      const lines = buildTimedLines(st.lineWords, st.starts, st.duration);
      const ps = st.notes.map((n) => n[2]);
      const rec = {
        id: 'custom_' + Date.now(), title: st.title, ref: st.ref || '', subtitle: 'Eigener Song', genre: 'Eigener Song',
        color: COLORS[Math.floor(Math.random() * COLORS.length)], emoji: '🎵', duration: st.duration,
        range: ps.length ? [Math.min(...ps), Math.max(...ps)] : [55, 67], lines, notes: st.notes,
        blob: st.file, createdAt: new Date().toISOString(),
      };
      await customSongs.put(rec);
      const a = unlock('own_song');
      toast(a ? `<b>${a.icon} ${a.name}</b><br>Song gespeichert!` : 'Song gespeichert!');
      audio.pause();
      go(`#/song/${rec.id}`);
    };
    const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); tap(); } };
    document.addEventListener('keydown', onKey);
    cleanup = () => { clearInterval(timer); audio.pause(); URL.revokeObjectURL(url); document.removeEventListener('keydown', onKey); };
    renderLines();
  }

  stepForm();
  return () => cleanup();
}
