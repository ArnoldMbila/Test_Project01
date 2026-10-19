import test from 'node:test';
import assert from 'node:assert/strict';
import { hzToMidi, midiToHz, noteName, classifyVoice, fitToRange, foldOctave, centsOff } from '../src/core/notes.js';
import { yin } from '../src/audio/yin.js';
import { Scorer, activeNoteAt, starsFor, praiseFor, LEVELS } from '../src/core/scoring.js';
import { framesToNotes, textToLines, buildTimedLines } from '../src/audio/analyze.js';
import { EXERCISES, songPhraseExercise, COURSE, findLesson } from '../src/core/lessons.js';

const sine = (hz, sr = 24000, n = 1024, amp = 0.3) => Float32Array.from({ length: n }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / sr));

test('MIDI ↔ Hz und Notennamen', () => {
  assert.equal(Math.round(hzToMidi(440)), 69);
  assert.ok(Math.abs(midiToHz(60) - 261.63) < 0.01);
  assert.equal(noteName(60), 'C4');
  assert.equal(noteName(71), 'H4');
  assert.equal(noteName(71, 'int'), 'B4');
  assert.equal(noteName(67, 'solf'), 'Sol4');
  assert.equal(centsOff(60.25), 25);
});

test('foldOctave faltet auf ±6', () => {
  assert.equal(foldOctave(12), 0);
  assert.equal(foldOctave(-11), 1);
  assert.equal(foldOctave(13.5), 1.5);
  assert.equal(foldOctave(-12.5), -0.5);
});

test('Stimmlagen-Erkennung', () => {
  assert.equal(classifyVoice(43, 67).id, 'bariton');
  assert.equal(classifyVoice(60, 84).id, 'sopran');
  assert.equal(classifyVoice(41, 62).id, 'bass');
});

test('fitToRange verschiebt Songs in den Umfang', () => {
  const notes = [[0, 1, 60], [1, 1, 64], [2, 1, 67]];
  assert.equal(fitToRange(notes, 58, 70).octave, 0);
  assert.equal(fitToRange(notes, 46, 58).octave, -1);
  const f = fitToRange(notes, 63, 72);
  assert.ok(f.fit > 0.9 && f.semis > 0);
});

test('YIN erkennt Sinustöne genau', () => {
  for (const hz of [110, 196, 261.63, 440, 660]) {
    const r = yin(sine(hz), 24000, { fmin: 70, fmax: 1100 });
    assert.ok(Math.abs(hzToMidi(r.hz) - hzToMidi(hz)) < 0.1, `${hz} → ${r.hz}`);
  }
  assert.equal(yin(new Float32Array(1024), 24000).hz, 0);
});

test('YIN mit Obertönen (Stimme) bleibt beim Grundton', () => {
  const sr = 24000, n = 1024, f = 180;
  const buf = Float32Array.from({ length: n }, (_, i) => {
    const t = i / sr;
    return 0.3 * Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t) + 0.15 * Math.sin(6 * Math.PI * f * t);
  });
  assert.ok(Math.abs(yin(buf, sr).hz - f) < 2);
});

test('activeNoteAt (Binärsuche)', () => {
  const notes = [[0, 1, 60], [2, 0.5, 62], [3, 1, 64]];
  assert.equal(activeNoteAt(notes, 0.5), 0);
  assert.equal(activeNoteAt(notes, 1.5), -1);
  assert.equal(activeNoteAt(notes, 2.2), 1);
  assert.equal(activeNoteAt(notes, 3.9), 2);
  assert.equal(activeNoteAt(notes, -1), -1);
});

function simulate(level, sungFn) {
  const notes = [[0, 1, 60], [1, 1, 62], [2, 1, 64]];
  const lines = [{ t0: 0, t1: 3, words: [] }];
  const s = new Scorer(notes, lines, LEVELS[level]);
  for (let t = 0; t < 3.2; t += 0.02) s.update(t, sungFn(t, notes), 0.02);
  return s;
}

test('Scorer: perfekt gesungen → ~100 Punkte, 3 Sterne', () => {
  const s = simulate('mittel', (t, n) => { const i = activeNoteAt(n, t); return i >= 0 ? n[i][2] + 0.2 : null; });
  const sum = s.summary();
  assert.ok(sum.score >= 95, String(sum.score));
  assert.equal(sum.stars, 3);
  assert.equal(sum.notesHit, 3);
  assert.ok(s.lineAccuracy(0) > 0.95);
});

test('Scorer: Oktave egal auf Leicht/Mittel, nicht auf Profi', () => {
  const oct = (t, n) => { const i = activeNoteAt(n, t); return i >= 0 ? n[i][2] - 12 : null; };
  assert.ok(simulate('mittel', oct).summary().score >= 95);
  assert.equal(simulate('profi', oct).summary().score, 0);
});

test('Scorer: Stille/falsch → 0 Punkte, Hinweis höher', () => {
  assert.equal(simulate('leicht', () => null).summary().score, 0);
  const s = simulate('profi', (t, n) => { const i = activeNoteAt(n, t); return i >= 0 ? n[i][2] - 3 : null; });
  assert.equal(s.summary().score, 0);
  const s2 = new Scorer([[0, 2, 60]], [], LEVELS.profi);
  for (let t = 0.1; t < 1; t += 0.02) s2.update(t, 57, 0.02);
  assert.equal(s2.hint(), 'up');
});

test('Scorer: Vorspiel-Noten (L) zählen nicht', () => {
  const s = new Scorer([[0, 1, 60, 'L'], [1.5, 1, 60]], [], LEVELS.mittel);
  for (let t = 0; t < 3; t += 0.02) s.update(t, t > 1.5 ? 60 : null, 0.02);
  const sum = s.summary();
  assert.equal(sum.notesTotal, 1);
  assert.ok(sum.score >= 95);
});

test('Sterne & Lob', () => {
  assert.deepEqual([starsFor(40), starsFor(55), starsFor(75), starsFor(90)], [0, 1, 2, 3]);
  assert.equal(praiseFor(0.9).text, 'Perfekt!');
  assert.equal(praiseFor(null), null);
});

test('framesToNotes gruppiert stabile Frames', () => {
  const p = [...Array(20).fill(60.1), ...Array(5).fill(0), ...Array(20).fill(64.2), ...Array(2).fill(70)];
  const notes = framesToNotes(Float32Array.from(p), 0.01);
  assert.equal(notes.length, 2);
  assert.deepEqual(notes.map((n) => n[2]), [60, 64]);
});

test('Text → Zeilen und getimte Lyrics', () => {
  const lines = textToLines('Und ich sah einen neuen Himmel und eine neue Erde; denn der erste Himmel ist vergangen.\nAmen.');
  assert.ok(lines.length >= 2);
  const timed = buildTimedLines(lines, lines.map((_, i) => i * 4), 30);
  timed.forEach((l) => {
    assert.ok(l.t1 > l.t0);
    l.words.forEach((w) => assert.ok(w[1] >= l.t0 - 1e-6 && w[2] <= l.t1 + 1e-6));
  });
});

test('Übungen erzeugen sortierte Noten mit Hör- und Sing-Teil', () => {
  for (const [name, fn] of Object.entries(EXERCISES)) {
    const ex = fn(55);
    assert.ok(ex.notes.length > 0, name);
    for (let i = 1; i < ex.notes.length; i++) assert.ok(ex.notes[i][0] >= ex.notes[i - 1][0], name);
    assert.ok(ex.notes.some((n) => n[3] !== 'L'), name);
    assert.ok(ex.duration > ex.notes[ex.notes.length - 1][0], name);
  }
  assert.ok(findLesson('l1') && findLesson('w_siren'));
  assert.equal(COURSE.flatMap((u) => u.lessons).length, 12);
});

test('Song-Phrasen-Übung aus echten Song-Daten', async () => {
  globalThis.window = {};
  await import('../data/songs.js');
  const song = window.ZS_SONGS.find((s) => s.id === 'offb_8_7_13');
  const ex = songPhraseExercise(song, 0, 1, 55);
  assert.ok(ex.notes.filter((n) => n[3] !== 'L').length >= 5);
});

test('Song-Stufen: Abschnitte und Freischalt-Reihenfolge', async () => {
  globalThis.window = globalThis.window || {};
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
  await import('../data/songs.js');
  const { STAGES, stagePart, nextStage } = await import('../src/core/stages.js');
  assert.deepEqual(STAGES.map((s) => s.id), ['basic', 'easy', 'medium', 'hard', 'extreme']);
  for (const song of window.ZS_SONGS) {
    const b = stagePart(song, 'basic'), e = stagePart(song, 'easy');
    assert.ok(!song.lines[b.from].adlib, song.id);
    assert.ok(b.to - b.from + 1 >= 3 && b.to < e.to, song.id);
    assert.equal(stagePart(song, 'medium'), null);
  }
  assert.equal(nextStage('hard').id, 'extreme');
  assert.equal(nextStage('extreme'), null);
});

test('Tägliches Warm-up verkettet Übungen (~5 Min.)', async () => {
  const { EXERCISES, chain } = await import('../src/core/lessons.js');
  const d = EXERCISES.daily(55);
  assert.ok(d.duration > 230 && d.duration < 330);
  for (let i = 1; i < d.notes.length; i++) assert.ok(d.notes[i][0] >= d.notes[i - 1][0]);
  assert.equal(chain([{ notes: [[0, 1, 60]], duration: 2 }, { notes: [[0, 1, 62, 'L']], duration: 2 }], 1).notes[1][0], 3);
});
