import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = globalThis.window || {};
await import('../data/songs.js');
await import('../data/offenbarung.js');
const SONGS = window.ZS_SONGS, BIBLE = window.ZS_BIBLE;

test('Offenbarung: 22 Kapitel, 405 Verse', () => {
  assert.equal(BIBLE.length, 22);
  assert.equal(BIBLE.reduce((a, c) => a + c.v.length, 0), 405);
  assert.ok(BIBLE[12].v[17].includes('666'));
});

test('Drei Songs mit Audio, Cover, Lyrics und Noten', () => {
  assert.equal(SONGS.length, 3);
  for (const s of SONGS) {
    for (const f of [s.audio.instrumental, s.audio.vocals, s.audio.cover]) {
      assert.ok(existsSync(join(ROOT, f)) && statSync(join(ROOT, f)).size > 10000, f);
    }
    assert.ok(s.lines.length > 30 && s.notes.length > 200, s.id);
    assert.ok(s.duration > 100, s.id);
  }
});

test('Lyrics zeitlich sortiert, Wörter innerhalb der Zeile', () => {
  for (const s of SONGS) {
    let prev = -1;
    for (const l of s.lines) {
      assert.ok(l.t0 >= prev - 0.01, `${s.id} ${l.t0} < ${prev}`);
      assert.ok(l.t1 >= l.t0);
      assert.ok(l.t1 <= s.duration);
      for (const w of l.words) assert.ok(w[1] >= l.t0 - 1e-3 && w[2] <= l.t1 + 1e-3);
      prev = l.t0;
    }
  }
});

test('Liedtext = Elberfelder-Verse (alle Verse des Bereichs enthalten)', () => {
  const norm = (x) => x.toLowerCase().replace(/[^a-zäöüß0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  for (const s of SONGS) {
    const sung = norm(s.lines.filter((l) => !l.adlib).map((l) => l.words.map((w) => w[0]).join(' ')).join(' '));
    const ch = BIBLE[s.chapter - 1];
    const canon = norm(ch.v.slice(s.v0 - 1, s.v1).join(' '));
    assert.equal(sung, canon, s.id);
  }
});

test('Noten sortiert, plausibler Umfang', () => {
  for (const s of SONGS) {
    for (let i = 1; i < s.notes.length; i++) assert.ok(s.notes[i][0] >= s.notes[i - 1][0]);
    for (const n of s.notes) assert.ok(n[1] > 0 && n[2] >= 36 && n[2] <= 84);
    assert.ok(s.range[1] - s.range[0] <= 26);
  }
});
