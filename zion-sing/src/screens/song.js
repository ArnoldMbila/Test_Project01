// Song-Detail: Infos, Einstellungen vor dem Singen, Abschnitte zum Üben, Text.
import { store } from '../core/store.js';
import { getSong, songFit, difficultyOf, rangeLabel } from '../core/catalog.js';
import { LEVELS } from '../core/scoring.js';
import { cover, stars, chips, bindChips, go, escapeHtml, fmtTime } from '../ui/dom.js';

/** Zeilen nach Vers gruppieren → Abschnitte. */
export function sections(song) {
  const out = [];
  song.lines.forEach((l, i) => {
    const last = out[out.length - 1];
    if (last && last.v === l.v) last.to = i;
    else out.push({ v: l.v, from: i, to: i });
  });
  return out;
}

export async function songScreen(root, params) {
  const song = await getSong(params.id);
  if (!song) { root.innerHTML = '<div class="empty">Song nicht gefunden.</div>'; return; }
  const p = store.profile;
  const best = store.stats.best[song.id];
  const fit = songFit(song);
  const hist = store.stats.history.filter((h) => h.songId === song.id).slice(0, 5);
  const secs = sections(song);
  const cfg = { difficulty: p.difficulty, rate: 1, lyrics: p.lyricsMode, key: 'auto' };

  root.innerHTML = `
  <div class="song-detail" style="--c:${song.color || '#7a5cff'}">
    <div class="sd-hero">
      ${song.audio.cover ? `<img class="sd-bg" src="${song.audio.cover}" alt="">` : ''}
      <button class="icon-btn back" onclick="history.back()" aria-label="Zurück">‹</button>
      ${cover(song, 'lg')}
      <h1>${escapeHtml(song.title)}</h1>
      <p class="muted">${escapeHtml(song.ref || 'Eigener Song')}${song.subtitle ? ' · ' + escapeHtml(song.subtitle) : ''}</p>
      <div class="sd-meta">
        <span>⏱ ${fmtTime(song.duration || 0)}</span>
        ${song.bpm ? `<span>🥁 ${song.bpm} BPM</span>` : ''}
        <span>🎼 ${rangeLabel(song, p.notation)}</span>
        <span>${'●'.repeat(difficultyOf(song))}${'○'.repeat(5 - difficultyOf(song))}</span>
      </div>
      ${best ? `<div class="sd-best">${stars(best.stars)} <b>${best.score}</b> <small class="muted">Bestwert</small></div>` : ''}
      ${fit ? `<div class="fit ${fit.fit >= 0.85 ? 'good' : fit.fit >= 0.6 ? 'ok' : 'hard'}">${fit.label} · ${Math.round(fit.fit * 100)} % in deinem Umfang</div>`
        : `<a class="fit ok" href="#/range">Stimmumfang testen → Song an deine Stimme anpassen</a>`}
      <div class="sd-actions">
        <button class="btn primary big" data-act="sing">▶ Singen</button>
        <button class="btn ghost big" data-act="listen">🎧 Anhören</button>
      </div>
    </div>

    <section class="card">
      <h3>Einstellungen</h3>
      <div class="field">Schwierigkeit ${chips('diff', Object.values(LEVELS).map((l) => [l.id, l.label]), cfg.difficulty)}
        <small class="muted" data-diffdesc>${LEVELS[cfg.difficulty].desc}</small></div>
      <div class="field">Tonart ${chips('key', [['auto', 'Auto'], [-3, '−3'], [-2, '−2'], [-1, '−1'], [0, 'Original'], [1, '+1'], [2, '+2'], [3, '+3']], cfg.key)}</div>
      <div class="field">Lyrics ${chips('lyr', [['all', 'Alles zeigen'], ['learn', 'Lern-Modus'], ['memory', 'Auswendig']], cfg.lyrics)}</div>
      ${song.builtin ? '' : '<p class="muted small">Eigener Song: „Leitstimme“ blendet zwischen Original und Karaoke-Filter (Gesang ausgeblendet) über.</p>'}
    </section>

    <section class="card">
      <div class="row between"><h3>Abschnitte üben</h3><small class="muted">Dauerschleife · 90 % Tempo</small></div>
      <div class="sections">${secs.map((s) => {
        const txt = song.lines[s.from].words.map((w) => w[0]).join(' ');
        return `<button class="section" data-from="${s.from}" data-to="${s.to}">
          <span class="sv">${s.v ? 'V. ' + s.v : '♪'}</span><span class="st">${escapeHtml(txt)}</span><span class="sp">▶</span></button>`;
      }).join('')}</div>
    </section>

    <section class="card">
      <div class="row between"><h3>Songtext</h3><button class="btn small ghost" data-act="lyrics">Anzeigen</button></div>
      <div class="full-lyrics" hidden>${song.lines.map((l) => `<p class="${l.adlib ? 'adlib' : ''}">${l.v && !l.adlib ? `<sup>${l.v}</sup>` : ''}${escapeHtml(l.words.map((w) => w[0]).join(' '))}</p>`).join('')}</div>
    </section>

    ${hist.length ? `<section class="card"><h3>Verlauf</h3>${hist.map((h) => `<div class="hist"><span>${new Date(h.date).toLocaleDateString('de-DE')}</span><span>${h.mode === 'practice' ? 'Üben' : 'Song'}</span>${stars(h.stars)}<b>${h.score}</b></div>`).join('')}</section>` : ''}
  </div>`;

  const q = () => `difficulty=${cfg.difficulty}&key=${cfg.key}&lyrics=${cfg.lyrics}`;
  bindChips(root, 'diff', (v) => { cfg.difficulty = v; store.setProfile({ difficulty: v }); root.querySelector('[data-diffdesc]').textContent = LEVELS[v].desc; });
  bindChips(root, 'key', (v) => { cfg.key = v; });
  bindChips(root, 'lyr', (v) => { cfg.lyrics = v; store.setProfile({ lyricsMode: v }); });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act],[data-from]');
    if (!b) return;
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
