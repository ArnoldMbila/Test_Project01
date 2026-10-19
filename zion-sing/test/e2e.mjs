// End-to-End-Test im echten Chromium mit simuliertem Sänger.
//   npm i --no-save playwright-core && node test/e2e.mjs [--shots <ordner>]
// Optional: CHROMIUM=/pfad/zu/chrome
// Der „Sänger“ ersetzt getUserMedia: ein Oszillator singt exakt die Ziel-Noten
// der laufenden Session (window.__zs) – so lässt sich die komplette Kette
// Mikrofon → YIN → Bewertung → Ergebnis prüfen.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8099;
const shotsArg = process.argv.indexOf('--shots');
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const server = spawn(process.execPath, [join(ROOT, 'server.mjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream'],
});

const FAKE_SINGER = () => {
  const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  navigator.mediaDevices.getUserMedia = async () => {
    const ac = new AudioContext();
    const osc = ac.createOscillator(), osc2 = ac.createOscillator(), g = ac.createGain();
    const h = ac.createGain(); h.gain.value = 0.35;
    osc.connect(g); osc2.connect(h).connect(g);
    const dest = ac.createMediaStreamDestination();
    g.connect(dest);
    g.gain.value = 0;
    osc.start(); osc2.start();
    const tick = () => {
      const zs = window.__zs;
      let hz = 0;
      if (window.__silent) hz = 0;
      else if (zs && zs.transport.playing) {
        const t = zs.transport.time, notes = zs.scorer().notes;
        const n = notes.find((x) => t >= x[0] && t < x[0] + x[1] && x[3] !== 'L');
        if (n) hz = midiToHz(n[2] + (window.__detune || 0));
      } else if (window.__fakeHz) hz = window.__fakeHz;
      if (hz) { osc.frequency.value = hz; osc2.frequency.value = hz * 2; g.gain.value = 0.3; } else g.gain.value = 0;
      setTimeout(tick, 8);
    };
    tick();
    return dest.stream;
  };
};

const results = [];
const errors = [];
const check = (name, ok, info = '') => { results.push({ name, ok, info }); console.log(`${ok ? '✔' : '✘'} ${name}${info ? ' – ' + info : ''}`); };

async function newPage(profile, viewport = { width: 820, height: 1180 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.addInitScript(FAKE_SINGER);
  if (profile) await ctx.addInitScript((p) => { if (!localStorage.getItem('zionSing.v1')) localStorage.setItem('zionSing.v1', JSON.stringify(p)); }, profile);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return page;
}
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, name + '.png') }); };
const url = (h) => `http://localhost:${PORT}/index.html${h}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  // 1) Onboarding
  let page = await newPage(null);
  await page.goto(url('#/'));
  await page.waitForSelector('.onboard');
  check('Onboarding erscheint beim ersten Start', true);
  await shot(page, '01-onboarding');
  await page.fill('[data-name]', 'Arnold');
  await page.click('[data-act="skip"]');
  await page.waitForSelector('.home');
  check('Startseite nach Onboarding', (await page.textContent('.home-top h1')).includes('Arnold'));
  await page.context().close();

  // 2) Profil mit Stimmumfang
  const profile = { profile: { name: 'Arnold', onboarded: true, range: [45, 67], voiceType: 'bariton', latencyMs: 30, difficulty: 'mittel', notation: 'de', lyricsMode: 'all', guideVocal: 0.6, echoCancel: true, dailyGoalMin: 10 }, stats: {} };
  page = await newPage(profile);
  await page.goto(url('#/'));
  await page.waitForSelector('.song-tile');
  check('Songs-für-dich-Karussell', (await page.$$('.song-tile')).length >= 4);
  await shot(page, '02-home');
  await page.goto(url('#/songs'));
  await page.waitForSelector('.song-card');
  await shot(page, '03-library');
  await page.fill('[data-q]', 'Wermut');
  await page.waitForSelector('.verse-hit');
  check('Suche findet Vers „Wermut“', (await page.$$('.verse-hit')).length >= 1);
  await page.goto(url('#/song/offb_8_7_13'));
  await page.waitForSelector('.section');
  check('Song-Detail mit Abschnitten', (await page.$$('.section')).length >= 5);
  await shot(page, '04-song');

  // 3) Song singen (perfekter Sänger)
  await page.goto(url('#/sing/offb_8_7_13?key=0'));
  await page.waitForFunction(() => window.__zs && window.__zs.transport.playing, null, { timeout: 15000 });
  await page.click('[data-act="skip"]');
  await wait(22000);
  await shot(page, '05-session');
  const live = await page.evaluate(() => ({ t: window.__zs.transport.time, s: window.__zs.scorer().summary(window.__zs.transport.time) }));
  check('Song läuft & Zeit schreitet voran', live.t > 30, `t=${live.t.toFixed(1)}s`);
  check('Perfekter Sänger bekommt hohe Punktzahl', live.s.score >= 70, `Score ${live.s.score}, ${live.s.notesHit}/${live.s.notesTotal} Noten`);
  const lyric = await page.textContent('.ly-cur');
  check('Karaoke-Zeile sichtbar', lyric.trim().length > 3, lyric.trim().slice(0, 50));
  await page.evaluate(() => window.__zs.finish());
  await page.waitForSelector('.results');
  await wait(1600);
  await shot(page, '06-results');
  check('Ergebnis-Screen mit Heatmap', (await page.$$('.heat-row')).length > 3);
  check('Aufnahme vorhanden', !!(await page.$('audio.rec')));

  // 4) Stiller Sänger → niedrige Punkte
  await page.evaluate(() => { window.__silent = true; });
  await page.goto(url('#/sing/offb_13_10_18?key=0'));
  await page.waitForFunction(() => window.__zs && window.__zs.transport.playing, null, { timeout: 15000 });
  await page.click('[data-act="skip"]');
  await wait(9000);
  const silent = await page.evaluate(() => window.__zs.scorer().summary(window.__zs.transport.time).score);
  check('Stille ergibt 0 Punkte', silent === 0, `Score ${silent}`);
  await page.evaluate(() => { window.__silent = false; window.__detune = 4; });
  await wait(6000);
  const off = await page.evaluate(() => window.__zs.scorer().summary(window.__zs.transport.time).score);
  check('Falsche Töne (+4 Halbtöne) ergeben wenig Punkte', off < 30, `Score ${off}`);
  await page.evaluate(() => { window.__detune = 0; });

  // 5) Übungs-Modus (Abschnitt in Schleife, 90 %)
  await page.goto(url('#/sing/offb_2_12_29?mode=practice&from=5&to=7'));
  await page.waitForFunction(() => window.__zs && window.__zs.transport.playing, null, { timeout: 15000 });
  const rate = await page.evaluate(() => window.__zs.cfg.rate);
  check('Üben: Tempo 90 %', rate === 0.9);
  await wait(12000);
  const t2 = await page.evaluate(() => window.__zs.transport.time);
  check('Üben: Abschnitt läuft in Schleife', t2 > 15 && t2 < 32, `t=${t2.toFixed(1)}`);

  // 6) Lektion (Synthesizer + Hören/Nachsingen)
  await page.goto(url('#/lesson/w_scale'));
  await page.waitForFunction(() => window.__zs && window.__zs.transport.playing, null, { timeout: 15000 });
  await wait(14000);
  await shot(page, '07-lesson');
  const ls = await page.evaluate(() => window.__zs.scorer().summary(window.__zs.transport.time));
  check('Lektion: Nachsingen wird bewertet', ls.score >= 70, `Score ${ls.score}`);
  await page.evaluate(() => window.__zs.finish());
  await page.waitForSelector('.results');

  // 6a) Song-Stufe Basic (nur erster Abschnitt, Leicht, laute Leitstimme) → Ergebnis + Freischaltung
  await page.goto(url('#/song/offb_8_7_13'));
  await page.waitForSelector('.ladder');
  check('Stufen-Leiter: nur Basic offen', (await page.$$('.rung.open')).length === 1 && (await page.$$('.rung.locked')).length === 4);
  await shot(page, '04b-song-stages');
  await page.click('.obj-head .acts [data-stage]');
  await page.waitForFunction(() => window.__zs && window.__zs.transport.playing, null, { timeout: 15000 });
  const stCfg = await page.evaluate(() => ({ d: window.__zs.cfg.difficulty, v: window.__zs.cfg.vocal }));
  check('Stufe Basic: Leicht + volle Leitstimme', stCfg.d === 'leicht' && stCfg.v === 1, JSON.stringify(stCfg));
  await page.waitForSelector('.results', { timeout: 60000 });
  await wait(800);
  const unlockedTxt = await page.textContent('.results');
  check('Basic bestanden → Easy freigeschaltet', unlockedTxt.includes('Easy freigeschaltet'), unlockedTxt.replace(/\s+/g, ' ').slice(0, 120));
  await shot(page, '06b-stage-result');
  await page.goto(url('#/song/offb_8_7_13'));
  await page.waitForSelector('.ladder');
  check('Stufen-Leiter: jetzt 2 Stufen offen', (await page.$$('.rung.open')).length === 2);

  // 6a2) Studio-Aufnahme
  await page.goto(url('#/sing/offb_8_7_13?studio=1'));
  await page.waitForFunction(() => window.__zs && window.__zs.transport.playing, null, { timeout: 15000 });
  await page.click('[data-act="skip"]');
  await wait(8000);
  await shot(page, '05b-studio');
  await page.evaluate(() => window.__zs.finish());
  await page.waitForSelector('.results');
  await page.goto(url('#/studio'));
  await page.waitForSelector('.studio');
  check('Studio: Aufnahme gespeichert', (await page.$$('.rec-card')).length === 1);
  await shot(page, '15-studio');

  // 6a3) Tägliches Warm-up
  await page.goto(url('#/lesson/daily'));
  await page.waitForFunction(() => window.__zs && window.__zs.transport.playing, null, { timeout: 15000 });
  const dd = await page.evaluate(() => window.__zs.transport.duration);
  check('Tägliches Warm-up ≈ 4–5 Minuten', dd > 230 && dd < 330, `${Math.round(dd)} s`);

  // 6b) Tonart +2 (AudioWorklet-Pitch-Shifter)
  await page.goto(url('#/sing/offb_8_7_13?key=2'));
  await page.waitForFunction(() => window.__zs && window.__zs.transport.playing, null, { timeout: 15000 });
  await page.click('[data-act="skip"]');
  await wait(9000);
  const tr = await page.evaluate(() => ({ k: window.__zs.transport.transpose, s: window.__zs.scorer().summary(window.__zs.transport.time).score }));
  check('Tonart +2 aktiv & bewertbar', tr.k === 2 && tr.s >= 60, `transpose=${tr.k}, Score ${tr.s}`);

  // 6c) Stimmumfang-Test mit gehaltenen Tönen
  await page.goto(url('#/range'));
  await page.click('[data-act="start"]');
  await page.waitForSelector('.speak-text');
  await page.evaluate(() => { window.__fakeHz = 130; });
  await page.waitForSelector('[data-act="next"]:not([disabled])', { timeout: 10000 });
  await page.click('[data-act="next"]');
  await page.waitForSelector('.rt-now');
  await page.evaluate(() => { window.__fakeHz = 110; });
  await wait(1500);
  await page.click('[data-act="next"]');
  await page.evaluate(() => { window.__fakeHz = 392; });
  await wait(1500);
  await page.click('[data-act="next"]');
  await page.waitForSelector('.rt-result');
  const vt = await page.textContent('.vt');
  check('Stimmumfang A2–G4 → Bariton', vt.trim() === 'Bariton', vt);
  await shot(page, '12b-range-result');
  await page.evaluate(() => { window.__fakeHz = 0; });

  // 6d) Eigenen Song importieren (Datei + Verse + automatisches Timing)
  await page.goto(url('#/import'));
  await page.setInputFiles('[data-file]', join(ROOT, 'audio/offb_8_7_13_vocals.mp3'));
  await page.selectOption('[data-ch]', '8');
  await page.fill('[data-v0]', '7');
  await page.fill('[data-v1]', '13');
  await page.click('[data-act="verses"]');
  await page.fill('[data-title]', 'Test-Import');
  await page.click('[data-act="next"]');
  await page.waitForSelector('.tap', { timeout: 90000 });
  await page.click('[data-act="auto"]');
  await page.click('[data-act="save"]');
  await page.waitForSelector('.song-detail');
  const id = await page.evaluate(() => location.hash.split('/').pop());
  const imported = await page.evaluate(async (sid) => {
    const db = await new Promise((r) => { const q = indexedDB.open('zionSingDB'); q.onsuccess = () => r(q.result); });
    return new Promise((r) => { const g = db.transaction('songs').objectStore('songs').get(sid); g.onsuccess = () => r({ notes: g.result.notes.length, lines: g.result.lines.length }); });
  }, id);
  check('Import: Melodie erkannt & Zeilen getimt', imported.notes > 50 && imported.lines > 10, `${imported.notes} Noten, ${imported.lines} Zeilen`);
  await page.goto(url(`#/sing/${id}`));
  await page.waitForFunction(() => window.__zs && window.__zs.transport.playing, null, { timeout: 15000 });
  await wait(4000);
  const it = await page.evaluate(() => window.__zs.transport.time);
  check('Import: eigener Song spielt (Karaoke-Filter-Modus)', it > 2, `t=${it.toFixed(1)}`);
  await page.evaluate(() => window.__zs.finish(true));

  // 7) Weitere Screens
  for (const [h, sel, name] of [['#/train', '.path', '08-train'], ['#/profile', '.ach', '09-profile'], ['#/chapter/13?v=18', '.verses', '10-chapter'], ['#/import', '.drop', '11-import'], ['#/range', '.range-test', '12-range']]) {
    await page.goto(url(h));
    await page.waitForSelector(sel);
    await shot(page, name);
  }
  await page.evaluate(() => { window.__fakeHz = 220; });
  await page.goto(url('#/tuner'));
  await page.waitForSelector('.tuner');
  await wait(1500);
  const tn = await page.textContent('[data-n]');
  check('Stimmgerät erkennt A3 (220 Hz)', tn.trim() === 'A3', tn);
  await shot(page, '13-tuner');
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('zionSing.v1')).stats);
  check('Fortschritt gespeichert (XP, Verlauf, Erfolge)', st.xp > 0 && st.history.length >= 2 && st.achievements.first_song, `XP ${st.xp}`);
  await page.context().close();

  // 8) Handy-Ansicht
  page = await newPage(profile, { width: 390, height: 844 });
  await page.goto(url('#/sing/offb_8_7_13'));
  await page.waitForFunction(() => window.__zs && window.__zs.transport.playing, null, { timeout: 15000 });
  await page.click('[data-act="skip"]');
  await wait(6000);
  await shot(page, '14-phone-session');
  await page.context().close();
} catch (e) {
  check('Unerwarteter Fehler', false, String(e && e.stack || e));
} finally {
  await browser.close();
  server.kill();
}
const relevant = errors.filter((e) => !/favicon|ServiceWorker|service worker/i.test(e));
check('Keine JS-Fehler in der Konsole', relevant.length === 0, relevant.slice(0, 3).join(' | '));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} Checks bestanden`);
process.exit(failed.length ? 1 : 0);
