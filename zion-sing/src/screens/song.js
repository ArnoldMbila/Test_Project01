// Song-Detail: Infos, Einstellungen vor dem Singen, Abschnitte zum Üben, Text.
import { store } from '../core/store.js';
import { getSong, songFit, difficultyOf, rangeLabel } from '../core/catalog.js';
import { LEVELS } from '../core/scoring.js';
import { cover, stars, meter, chips, bindChips, go, escapeHtml, fmtTime } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { sections, stageStatus, currentStage } from '../core/stages.js';
import { moodsOf } from '../core/catalog.js';

export { sections };

export async function songScreen(root, params) {
  const song = await getSong(params.id);
  if (!song) { root.innerHTML = '<div class="empty">Song nicht gefunden.</div>'; return; }
  const p = store.profile;
  const best = store.stats.best[song.id];
  const fit = songFit(song);
  const hist = store.stats.history.filter((h) => h.songId === song.id).slice(0, 5);
  const secs = sections(song);
  const cfg = { difficulty: p.difficulty, rate: 1, lyrics: p.lyricsMode, key: 'auto' };
  const ladder = stageStatus(song.id);
  const cur = currentStage(song.id);

  const diff = difficultyOf(song);
  root.innerHTML = `
  <div class="song-detail">
    <a class="back-row" href="#/songs">${icon('back', 16)} Songs</a>
    <header class="obj-head">
      ${cover(song, 'lg')}
      <div class="oh-main">
        <h1>${escapeHtml(song.title)}</h1>
        <div class="meta"><span>${escapeHtml(song.ref || 'Eigener Song')}</span><span class="num">${fmtTime(song.duration || 0)}</span>${song.bpm ? `<span class="num">${song.bpm} BPM</span>` : ''}<span>${rangeLabel(song, p.notation)}</span></div>
        <div class="row">${moodsOf(song).map((m) => `<span class="tag">${escapeHtml(m)}</span>`).join('')}
          ${fit ? `<span class="fit ${fit.fit < 0.6 ? 'hard' : ''}">${fit.label} · ${Math.round(fit.fit * 100)} % in deinem Umfang</span>` : '<a class="fit" href="#/range">Stimmumfang testen</a>'}</div>
        <div class="row">${best ? `${stars(best.stars)}<span class="muted num">Bestwert ${best.score}</span>` : '<span class="faint">Noch nicht gesungen</span>'}<span class="faint">·</span><span class="faint">Schwierigkeit</span>${meter(diff)}</div>
        <div class="acts">
          <button class="btn primary" data-stage="${cur.id}">${icon('play', 14)} Stufe ${cur.label} singen</button>
          <button class="btn" data-act="listen">${icon('headphones', 16)} Anhören</button>
          <button class="btn" data-act="studio">${icon('record', 12)} Aufnehmen</button>
        </div>
      </div>
    </header>

    <div class="grid stretch">
      <section class="card span-4">
        <div class="row between"><h3>Stufen</h3><small class="faint">2 Sterne schalten die nächste frei</small></div>
        <div class="ladder">${ladder.map((s, i) => {
          const done = s.best && s.best.stars >= 2;
          return `<button class="rung ${s.unlocked ? 'open' : 'locked'} ${s.id === cur.id ? 'cur' : ''} ${done ? 'done' : ''}" data-stage="${s.id}" ${s.unlocked ? '' : 'disabled'}>
          <span class="ri">${s.unlocked ? (done ? icon('check', 14) : i + 1) : icon('lock', 13)}</span><span class="rl"><b>${s.label}</b><small>${s.desc}</small></span>
          <span class="rs">${s.best ? stars(s.best.stars) + `<span class="num">${s.best.score}</span>` : s.unlocked ? '<small class="faint">offen</small>' : ''}</span></button>`;
        }).join('')}</div>
      </section>

      <section class="card span-2">
        <h3>Frei singen</h3>
        <div class="field">Schwierigkeit ${chips('diff', Object.values(LEVELS).map((l) => [l.id, l.label]), cfg.difficulty)}
          <span class="hint" data-diffdesc>${LEVELS[cfg.difficulty].desc}</span></div>
        <div class="field">Tonart ${chips('key', [['auto', 'Auto'], [-2, '−2'], [-1, '−1'], [0, '0'], [1, '+1'], [2, '+2']], cfg.key)}</div>
        <div class="field">Text ${chips('lyr', [['all', 'Ganz'], ['learn', 'Lücken'], ['memory', 'Auswendig']], cfg.lyrics)}</div>
        ${song.builtin ? '' : '<p class="faint small">Eigener Song: Die Leitstimme blendet zwischen Original und Karaoke-Filter über.</p>'}
        <button class="btn full foot" data-act="sing">${icon('play', 14)} Mit diesen Einstellungen singen</button>
      </section>

      <section class="card span-6">
        <div class="row between"><h3>Abschnitte üben</h3><small class="faint">Dauerschleife, 90 % Tempo</small></div>
        <div class="sections two">${secs.map((s) => {
          const txt = song.lines[s.from].words.map((w) => w[0]).join(' ');
          return `<button class="section" data-from="${s.from}" data-to="${s.to}">
            <span class="sv">${s.v ? 'Vers ' + s.v : 'Intro'}</span><span class="st">${escapeHtml(txt)}</span><span class="sp">${icon('play', 14)}</span></button>`;
        }).join('')}</div>
      </section>

      <section class="card span-6">
        <div class="row between"><h3>Songtext</h3><button class="btn small" data-act="lyrics">Anzeigen</button></div>
        <div class="full-lyrics" hidden>${song.lines.map((l) => `<p class="${l.adlib ? 'adlib' : ''}">${l.v && !l.adlib ? `<sup>${l.v}</sup>` : ''}${escapeHtml(l.words.map((w) => w[0]).join(' '))}</p>`).join('')}</div>
      </section>
    </div>
  </div>`;

  const q = () => `difficulty=${cfg.difficulty}&key=${cfg.key}&lyrics=${cfg.lyrics}`;
  bindChips(root, 'diff', (v) => { cfg.difficulty = v; store.setProfile({ difficulty: v }); root.querySelector('[data-diffdesc]').textContent = LEVELS[v].desc; });
  bindChips(root, 'key', (v) => { cfg.key = v; });
  bindChips(root, 'lyr', (v) => { cfg.lyrics = v; store.setProfile({ lyricsMode: v }); });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act],[data-from],[data-stage]');
    if (!b) return;
    if (b.dataset.stage) return go(`#/sing/${song.id}?stage=${b.dataset.stage}&key=${cfg.key}`);
    if (b.dataset.act === 'studio') return go(`#/sing/${song.id}?studio=1&key=${cfg.key}`);
    if (b.dataset.from != null) return go(`#/sing/${song.id}?mode=practice&from=${b.dataset.from}&to=${b.dataset.to}&${q()}`);
    if (b.dataset.act === 'sing') go(`#/sing/${song.id}?${q()}`);
    if (b.dataset.act === 'listen') go(`#/sing/${song.id}?${q()}&vocal=1`);
    if (b.dataset.act === 'lyrics') {
      const fl = root.querySelector('.full-lyrics');
      fl.hidden = !fl.hidden;
      b.textContent = fl.hidden ? 'Anzeigen' : 'Ausblenden';
    }
  });
}
