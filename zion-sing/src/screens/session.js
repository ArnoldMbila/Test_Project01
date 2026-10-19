// Sing-Session: Notenbahn + Karaoke-Lyrics + Live-Bewertung.
// Funktioniert für Songs (Audio-Player) und Übungen (Synthesizer).
import { audioCtx, mic, ensureMic, latency } from '../audio/engine.js';
import { SongPlayer } from '../audio/player.js';
import { PerformanceRecorder } from '../audio/recorder.js';
import { tone, sfx } from '../audio/synth.js';
import { Scorer, LEVELS, praiseFor } from '../core/scoring.js';
import { foldOctave, fitToRange } from '../core/notes.js';
import { store, recordSession } from '../core/store.js';
import { getSong, songFit } from '../core/catalog.js';
import { EXERCISES, baseNote, findLesson, songPhraseExercise } from '../core/lessons.js';
import { stageById, stagePart } from '../core/stages.js';
import { recordings, unlock } from '../core/store.js';
import { Lane } from '../ui/lane.js';
import { LyricsView } from '../ui/lyrics.js';
import { sheet, chips, bindChips, go, toast, fmtTime, escapeHtml } from '../ui/dom.js';

export let lastResult = null;

/** Spielt Übungsnoten mit dem Synthesizer ab und liefert eine Zeitachse. */
class SynthTransport {
  constructor(notes, duration, guide) {
    this.notes = notes; this.duration = duration; this.guide = guide;
    this.pos = 0; this.start = null; this.handles = []; this.rate = 1; this.onended = null;
  }
  get time() { return this.start == null ? this.pos : this.pos + (audioCtx().currentTime - this.start) * this.rate; }
  get playing() { return this.start != null; }
  play() {
    const c = audioCtx();
    this.start = c.currentTime;
    for (const n of this.notes) {
      const end = n[0] + n[1];
      if (end <= this.pos) continue;
      const vol = n[3] === 'L' ? 0.22 : this.guide ? 0.06 : 0;
      if (!vol) continue;
      const from = Math.max(n[0], this.pos);
      this.handles.push(tone(n[2], (end - from) / this.rate, (from - this.pos) / this.rate, { vol }));
    }
  }
  pause() { this.pos = this.time; this.start = null; this.handles.forEach((h) => h.stop()); this.handles = []; }
  seek(t) { const p = this.playing; if (p) this.pause(); this.pos = Math.max(0, t); if (p) this.play(); }
  setRate(r) { const p = this.playing; if (p) this.pause(); this.rate = r; if (p) this.play(); }
  tick() { if (this.playing && this.time >= this.duration) { this.pause(); this.onended && this.onended(); } }
  destroy() { this.pause(); }
}

export async function sessionScreen(root, params) {
  const kind = params.kind || 'song';
  const prof = store.profile;
  const stage = kind === 'song' ? stageById(params.stage) : null;
  const studio = kind === 'song' && params.studio === '1';
  const cfg = {
    difficulty: params.difficulty || prof.difficulty,
    key: params.key ?? 'auto',
    rate: +(params.rate || (params.mode === 'practice' ? 0.9 : 1)),
    vocal: params.vocal != null ? +params.vocal : prof.guideVocal,
    music: 1,
    lyricsMode: params.lyrics || prof.lyricsMode,
    guide: true,
  };
  if (stage) Object.assign(cfg, { difficulty: stage.difficulty, vocal: stage.vocal, lyricsMode: stage.lyrics, key: params.key ?? 'auto', rate: 1 });
  if (studio) Object.assign(cfg, { vocal: params.vocal != null ? +params.vocal : 0, rate: 1 });
  let song = null, lesson = null, ex = null;
  if (kind === 'song') {
    song = await getSong(params.id);
    if (!song) { root.innerHTML = '<div class="empty">Song nicht gefunden.</div>'; return; }
  } else {
    lesson = findLesson(params.id);
    if (!lesson) { root.innerHTML = '<div class="empty">Übung nicht gefunden.</div>'; return; }
    if (lesson.song) {
      const s = await getSong(lesson.song);
      ex = songPhraseExercise(s, lesson.lines[0], lesson.lines[1], baseNote(prof));
    } else ex = EXERCISES[lesson.ex](baseNote(prof));
    cfg.rate = 1;
  }
  const color = song ? song.color : '#3fe0c5';
  const mode = kind === 'song' ? (params.mode || 'full') : 'lesson';
  const lines = song ? song.lines : [];
  const part = stage && song ? stagePart(song, stage) : null;
  const lf = params.from != null ? +params.from : part ? part.from : null;
  const lt = params.to != null ? +params.to : part ? part.to : null;
  const sectionFrom = song && lf != null ? lines[lf].t0 - 0.3 : 0;
  const sectionTo = song && lt != null ? lines[lt].t1 + 0.5 : Infinity;
  const leadIn = song && lf != null ? Math.max(0, sectionFrom - 2.2) : 0;

  root.innerHTML = `
  <div class="session${studio ? ' studio' : ''}" style="--c:${color}">
    <header class="ses-top">
      <button class="icon-btn" data-act="close" aria-label="Beenden">✕</button>
      <div class="ses-title"><b>${escapeHtml(song ? song.title : lesson.title)}</b>
        <small>${escapeHtml(song ? song.ref : lesson.unit || 'Warm-up')} · ${studio ? '🎙️ Studio' : stage ? `Stufe ${stage.label}` : mode === 'practice' ? 'Üben' : mode === 'lesson' ? 'Übung' : LEVELS[cfg.difficulty].label}</small></div>
      <div class="ses-score"><span data-score>0</span><small>Punkte</small></div>
      <button class="icon-btn" data-act="settings" aria-label="Einstellungen">⚙︎</button>
    </header>
    <div class="ses-progress"><i></i></div>
    <div class="ses-stage">
      <canvas class="lane"></canvas>
      <div class="ses-feedback"></div>
      <div class="ses-hint"></div>
      <div class="ses-combo"></div>
      <div class="ses-cue"></div>
      <div class="ses-count"></div>
      <div class="ses-banner" hidden></div>
      ${studio ? '<div class="rec-dot">● REC</div>' : ''}
    </div>
    <div class="ses-lyrics ${kind === 'lesson' ? 'lesson' : ''}"></div>
    <footer class="ses-controls">
      <button class="ctl" data-act="back" aria-label="5 Sekunden zurück">⏪<small>5 s</small></button>
      <button class="ctl" data-act="line" aria-label="Zeile wiederholen">↺<small>Zeile</small></button>
      <button class="ctl play" data-act="play" aria-label="Start/Pause">▶</button>
      <button class="ctl" data-act="skip" aria-label="Intro überspringen">⏭<small>Intro</small></button>
      <div class="ctl meter" aria-label="Mikrofonpegel"><i></i><small>Mikro</small></div>
    </footer>
  </div>`;

  const el = (s) => root.querySelector(s);
  const scoreEl = el('[data-score]'), progEl = el('.ses-progress i'), playBtn = el('[data-act="play"]');
  const fbEl = el('.ses-feedback'), hintEl = el('.ses-hint'), comboEl = el('.ses-combo'), cueEl = el('.ses-cue');
  const countEl = el('.ses-count'), banner = el('.ses-banner'), meterEl = el('.meter i');
  if (kind === 'lesson' || !lines.length || lines[0].t0 < 8) el('[data-act="skip"]').style.display = 'none';
  if (kind === 'lesson') el('[data-act="line"]').style.display = 'none';

  // ---------- Noten vorbereiten (Tonart / Oktave) ----------
  let audioSemis = 0, notes = [], level = LEVELS[cfg.difficulty];
  function buildNotes() {
    level = LEVELS[cfg.difficulty];
    if (kind === 'lesson') { notes = ex.notes; audioSemis = 0; return; }
    const fit = songFit(song);
    audioSemis = cfg.key === 'auto' ? (fit ? fit.semis : 0) : +cfg.key;
    let octave = 0;
    if (prof.range) {
      const shifted = song.notes.map((n) => [n[0], n[1], n[2] + audioSemis]);
      octave = fitToRange(shifted, prof.range[0], prof.range[1]).octave;
    }
    const shift = audioSemis + octave * 12;
    notes = song.notes.map((n) => [n[0], n[1], n[2] + shift]);
  }
  buildNotes();

  // ---------- Transport ----------
  let transport;
  if (kind === 'song') {
    transport = new SongPlayer(song.audio);
    transport.setVocal(cfg.vocal);
    transport.setRate(cfg.rate);
    banner.hidden = false; banner.textContent = 'Lade Song …';
    await transport.ready();
    banner.hidden = true;
    if (audioSemis) await transport.setTranspose(audioSemis);
    transport.seek(leadIn);
  } else {
    transport = new SynthTransport(notes, ex.duration, cfg.guide);
  }
  const endTime = kind === 'song' ? Math.min(sectionTo, (transport.duration || song.duration)) : ex.duration;

  // ---------- Bewertung & Anzeige ----------
  let scorer;
  const newScorer = () => {
    scorer = new Scorer(notes, lines, { tol: level.tol, octaveFree: level.octaveFree, from: sectionFrom, to: sectionTo });
    lane.setNotes(notes, (i) => scorer.noteScore(i));
    lineDone = new Set();
  };
  const lane = new Lane(el('canvas.lane'), { color, notation: prof.notation, future: kind === 'lesson' ? 3.2 : 5 });
  let lineDone = new Set();
  newScorer();
  let lyrics = kind === 'song' ? new LyricsView(el('.ses-lyrics'), lines, { mode: cfg.lyricsMode }) : null;
  if (kind === 'lesson') el('.ses-lyrics').innerHTML = `<div class="lesson-tip">${escapeHtml(lesson.tips[0])}</div>`;

  // ---------- Mikrofon ----------
  const micRes = await ensureMic();
  const micOk = micRes.ok;
  if (!micOk) {
    banner.hidden = false;
    banner.innerHTML = `🎙️ ${escapeHtml(micRes.msg)}<br><small>Du kannst trotzdem mitsingen – nur ohne Bewertung.</small>`;
  }
  let recorder = null;
  if (micOk && kind === 'song' && PerformanceRecorder.supported()) recorder = new PerformanceRecorder(transport.outputNode);
  let recStarted = false;

  // ---------- Zustand ----------
  let raf = 0, lastNow = performance.now(), lastTS = transport.time, sungSeconds = 0;
  let loops = 0, bestLoop = null, finished = false, counting = false, lastScoreUpd = 0;
  let fbTimer = 0;

  function feedback(text, tier) {
    fbEl.textContent = text;
    fbEl.className = 'ses-feedback show t' + tier;
    clearTimeout(fbTimer);
    fbTimer = setTimeout(() => { fbEl.className = 'ses-feedback'; }, 1100);
    if (tier >= 3) { sfx.perfect(); lane.burst(lane.w * 0.3, lane.h * 0.5, 24); }
  }

  function countdown() {
    if (counting) return;
    counting = true;
    let n = 3;
    countEl.classList.add('show');
    const stepFn = () => {
      if (destroyed) return;
      if (n === 0) {
        countEl.classList.remove('show');
        counting = false;
        startPlayback();
        return;
      }
      countEl.textContent = n;
      countEl.classList.remove('pop'); void countEl.offsetWidth; countEl.classList.add('pop');
      sfx.count(n === 1);
      n--;
      setTimeout(stepFn, 700);
    };
    stepFn();
  }

  async function startPlayback() {
    await transport.play();
    lastTS = transport.time - (micOk ? latency() * cfg.rate : 0);
    playBtn.textContent = '❚❚';
    if (recorder) { if (!recStarted) { recorder.start(); recStarted = true; } else recorder.resume(); }
  }

  function pause() {
    if (counting) return;
    transport.pause();
    playBtn.textContent = '▶';
    if (recorder) recorder.pause();
  }

  function togglePlay() { if (transport.playing) pause(); else countdown(); }

  function sectionScore() {
    const s = scorer.summary();
    return s;
  }

  function loopRestart() {
    loops++;
    const s = sectionScore();
    if (!bestLoop || s.score > bestLoop.score) bestLoop = s;
    feedback(`Runde ${loops}: ${s.score} Punkte`, s.score >= 85 ? 3 : 2);
    newScorer();
    lane.clearTrail();
    transport.seek(leadIn);
    lastTS = transport.time;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dtF = Math.min(0.1, (now - lastNow) / 1000);
    lastNow = now;
    transport.tick && transport.tick();
    const tA = transport.time;
    const lat = micOk ? latency() : 0;
    const tS = tA - lat * cfg.rate;
    const playing = transport.playing;

    if (mode === 'practice' && playing && tA > sectionTo + 0.6) { loopRestart(); return; }
    if (mode === 'full' && playing && sectionTo !== Infinity && tA > sectionTo + 0.8) { finish(); return; }

    let level01 = 0;
    if (playing && micOk) {
      const p = mic.read();
      level01 = Math.min(1, p.rms * 12);
      const dt = Math.max(0, Math.min(0.1, tS - lastTS));
      sungSeconds += dt / cfg.rate;
      const r = scorer.update(tS, p.midi, dt);
      let disp = p.midi;
      if (p.midi != null && level.octaveFree) {
        const ref = r.target != null ? r.target : (lane.lo + lane.hi) / 2;
        disp = ref + foldOctave(p.midi - ref);
      }
      lane.pushPitch(tS, disp, r.hit);
      const h = r.target != null && p.midi != null ? scorer.hint() : null;
      hintEl.className = 'ses-hint' + (h ? ' show ' + h : '');
      hintEl.textContent = h === 'up' ? '↑ höher' : h === 'down' ? '↓ tiefer' : '';
      if (scorer.combo >= 5) { comboEl.textContent = `${scorer.combo}× Combo`; comboEl.classList.add('show'); }
      else comboEl.classList.remove('show');
    }
    lastTS = tS;
    meterEl.style.transform = `scaleY(${Math.max(0.05, level01)})`;
    lane.render(tS, dtF);

    if (lyrics) lyrics.update(tA);
    if (kind === 'lesson') {
      // „Hör zu“ vs. „Jetzt du!“
      const cur = notes.find((n) => tS >= n[0] - 0.4 && tS < n[0] + n[1] + 0.3);
      const listen = cur && cur[3] === 'L';
      cueEl.textContent = !playing ? '' : listen ? '👂 Hör zu' : cur ? '🎤 Jetzt du!' : '';
      cueEl.className = 'ses-cue' + (playing && cur ? ' show' + (listen ? ' listen' : ' sing') : '');
    }

    // Zeilen-Feedback
    if (playing && micOk && kind === 'song') {
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (lineDone.has(i) || l.t1 > tS - 0.3 || l.t1 < tS - 2) continue;
        lineDone.add(i);
        if (l.t0 < sectionFrom || l.t1 > sectionTo) continue;
        const acc = scorer.lineAccuracy(i);
        const pr = praiseFor(acc);
        if (pr) feedback(pr.text, pr.tier);
      }
    }
    if (now - lastScoreUpd > 250) {
      lastScoreUpd = now;
      if (micOk) scoreEl.textContent = scorer.summary(tS).score;
      const span = (endTime === Infinity ? transport.duration : endTime) - leadIn;
      progEl.style.width = Math.max(0, Math.min(100, ((tA - leadIn) / Math.max(1, span)) * 100)) + '%';
    }
  }

  transport.onended = () => { if (mode === 'practice') loopRestart(), transport.play(); else finish(); };

  async function finish(abort = false) {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    transport.pause();
    const blob = recorder ? await recorder.stop() : null;
    if (abort || (!micOk && kind === 'song') || sungSeconds < 5) { cleanup(); history.back(); return; }
    let sum = scorer.summary(transport.time);
    if (mode === 'practice' && bestLoop && bestLoop.score > sum.score) sum = bestLoop;
    const title = song ? song.title : lesson.title;
    const res = recordSession({
      songId: song ? song.id : lesson.id, title, score: sum.score, stars: sum.stars,
      mode, seconds: sungSeconds, bestCombo: sum.bestCombo, lyricsMode: cfg.lyricsMode,
      kind: kind === 'song' ? 'song' : 'lesson', stage: stage && stage.id,
    });
    let savedId = null;
    if (studio && blob) {
      savedId = 'rec_' + Date.now();
      await recordings.put({ id: savedId, songId: song.id, title, ref: song.ref, score: sum.score, stars: sum.stars,
        date: new Date().toISOString(), seconds: sungSeconds, blob, type: blob.type });
      const a = unlock('studio');
      if (a) res.unlocked.push(a);
    }
    lastResult = {
      kind, id: song ? song.id : lesson.id, title, ref: song ? song.ref : lesson.unit || 'Warm-up',
      color, cover: song && song.audio.cover, ...sum, lines, seconds: sungSeconds, mode, loops,
      from: lf, to: lt, difficulty: cfg.difficulty, lyricsMode: cfg.lyricsMode, ...res,
      recordingUrl: blob ? URL.createObjectURL(blob) : null, recordingType: blob ? blob.type : null,
      recordingBlob: blob, stage: stage && stage.id, studio, savedId,
    };
    cleanup();
    go('#/results');
  }

  let destroyed = false;
  function cleanup() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(raf);
    transport.destroy();
    lane.destroy();
    if (recorder) recorder.cleanup();
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
  }

  // ---------- Bedienung ----------
  function openSettings() {
    const wasPlaying = transport.playing;
    if (wasPlaying) pause();
    const keyOpts = [['auto', 'Auto']];
    for (let k = -5; k <= 5; k++) keyOpts.push([k, (k > 0 ? '+' : '') + k]);
    const sh = sheet('Einstellungen', `
      ${kind === 'song' ? `
      <label class="field">Leitstimme <span class="val" data-vv>${Math.round(cfg.vocal * 100)} %</span>
        <input type="range" min="0" max="1" step="0.05" value="${cfg.vocal}" data-in="vocal"></label>
      <label class="field">Musik <span class="val" data-mv>${Math.round(cfg.music * 100)} %</span>
        <input type="range" min="0" max="1" step="0.05" value="${cfg.music}" data-in="music"></label>
      <div class="field">Tempo ${chips('rate', [[0.6, '60 %'], [0.75, '75 %'], [0.9, '90 %'], [1, '100 %']], cfg.rate)}</div>
      <div class="field">Tonart ${chips('key', keyOpts, cfg.key)}</div>
      <div class="field">Lyrics ${chips('lyr', [['all', 'Alles zeigen'], ['learn', 'Lern-Modus'], ['memory', 'Auswendig']], cfg.lyricsMode)}</div>`
      : `<div class="field">Hilfston beim Singen ${chips('guide', [['1', 'An'], ['0', 'Aus']], cfg.guide ? '1' : '0')}</div>`}
      <div class="field">Schwierigkeit ${chips('diff', Object.values(LEVELS).map((l) => [l.id, l.label]), cfg.difficulty)}</div>
      <p class="muted small">Tonart- und Schwierigkeits-Änderungen setzen den Punktestand zurück.</p>`,
    () => { if (wasPlaying) countdown(); });
    const q = (s) => sh.el.querySelector(s);
    const vin = q('[data-in="vocal"]');
    if (vin) vin.oninput = (e) => { cfg.vocal = +e.target.value; transport.setVocal(cfg.vocal); q('[data-vv]').textContent = Math.round(cfg.vocal * 100) + ' %'; store.setProfile({ guideVocal: cfg.vocal }); };
    const min = q('[data-in="music"]');
    if (min) min.oninput = (e) => { cfg.music = +e.target.value; transport.setMusic(cfg.music); q('[data-mv]').textContent = Math.round(cfg.music * 100) + ' %'; };
    bindChips(sh.el, 'rate', (v) => { cfg.rate = +v; transport.setRate(cfg.rate); });
    bindChips(sh.el, 'key', async (v) => { cfg.key = v === 'auto' ? 'auto' : +v; buildNotes(); await transport.setTranspose(audioSemis); newScorer(); });
    bindChips(sh.el, 'lyr', (v) => { cfg.lyricsMode = v; lyrics && lyrics.setMode(v); store.setProfile({ lyricsMode: v }); });
    bindChips(sh.el, 'guide', (v) => { cfg.guide = v === '1'; transport.guide = cfg.guide; });
    bindChips(sh.el, 'diff', (v) => { cfg.difficulty = v; buildNotes(); newScorer(); });
  }

  function replayLine() {
    const t = transport.time;
    let i = lines.findIndex((l) => l.t1 > t);
    if (i < 0) i = lines.length - 1;
    const l = lines[Math.max(0, i)];
    const target = t < l.t0 + 0.5 && i > 0 ? lines[i - 1].t0 : l.t0;
    transport.seek(Math.max(0, target - 1.5));
    lane.clearTrail();
  }

  root.querySelector('.ses-controls').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'play') togglePlay();
    if (a === 'back') { transport.seek(Math.max(leadIn, transport.time - 5)); lane.clearTrail(); }
    if (a === 'line') replayLine();
    if (a === 'skip') { transport.seek(Math.max(0, lines[0].t0 - 3)); b.style.display = 'none'; lane.clearTrail(); }
  });
  root.querySelector('[data-act="close"]').onclick = () => {
    if (sungSeconds > 20 && micOk) finish(); else finish(true);
  };
  root.querySelector('[data-act="settings"]').onclick = openSettings;
  function onKey(e) {
    if (e.target.closest('input,textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    if (e.code === 'ArrowLeft') transport.seek(Math.max(leadIn, transport.time - 5));
    if (e.code === 'ArrowRight') transport.seek(transport.time + 5);
    if (e.code === 'Escape') root.querySelector('[data-act="close"]').click();
  }
  function onVis() { if (document.hidden && transport.playing) pause(); }
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVis);

  raf = requestAnimationFrame(frame);
  if (params.autostart !== '0') countdown();
  if (kind === 'song' && mode === 'practice') toast(`Übe ${lf === lt ? 'Zeile' : 'Abschnitt'} in Dauerschleife – Tempo ${Math.round(cfg.rate * 100)} %`);
  window.__zs = { transport, scorer: () => scorer, finish, cfg }; // für Tests/Debugging

  return () => { if (!finished) { finished = true; transport.pause(); recorder && recorder.stop(); } cleanup(); };
}

export function fmtDur(s) { return fmtTime(s); }
