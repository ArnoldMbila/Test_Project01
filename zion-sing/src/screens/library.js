// Bibliothek (Songs, eigene Songs, alle Kapitel, Suche) + Kapitel-Ansicht.
import { store, customSongs } from '../core/store.js';
import { allSongs, songFit, difficultyOf, BIBLE, searchVerses, songForVerse, rangeLabel } from '../core/catalog.js';
import { cover, stars, go, escapeHtml, fmtTime, toast } from '../ui/dom.js';

function songRow(song) {
  const best = store.stats.best[song.id];
  const fit = songFit(song);
  const diff = difficultyOf(song);
  return `<a class="song-row" href="#/song/${song.id}" style="--c:${song.color || '#7a5cff'}">
    ${cover(song, 'sm')}
    <div class="sr-main"><b>${escapeHtml(song.title)}</b>
      <small>${escapeHtml(song.ref || 'Eigener Song')} · ${song.genre || 'Import'} · ${fmtTime(song.duration || 0)}</small>
      <div class="row"><span class="dots" title="Schwierigkeit">${'●'.repeat(diff)}${'○'.repeat(5 - diff)}</span>
      ${fit ? `<span class="fit ${fit.fit >= 0.85 ? 'good' : fit.fit >= 0.6 ? 'ok' : 'hard'}">${fit.label}</span>` : ''}</div>
    </div>
    <div class="sr-side">${best ? stars(best.stars) + `<small>${best.score}</small>` : '<span class="chev">›</span>'}</div>
  </a>`;
}

export async function libraryScreen(root, params) {
  const songs = await allSongs();
  let tab = params.tab || 'songs';
  root.innerHTML = `
  <div class="library">
    <header class="page-head"><h1>Songs</h1><a class="btn small ghost" href="#/import">＋ Import</a></header>
    <div class="search"><input type="search" placeholder="Song, Vers oder Wort suchen …" data-q aria-label="Suche"></div>
    <div class="tabs" role="tablist">
      <button data-tab="songs">Songs</button><button data-tab="mine">Meine</button><button data-tab="chapters">Kapitel</button>
    </div>
    <div data-body></div>
  </div>`;
  const body = root.querySelector('[data-body]');
  const qIn = root.querySelector('[data-q]');

  function render() {
    root.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const q = qIn.value.trim().toLowerCase();
    if (q) {
      const hitSongs = songs.filter((s) => (s.title + ' ' + (s.ref || '') + ' ' + s.lines.map((l) => l.words.map((w) => w[0]).join(' ')).join(' ')).toLowerCase().includes(q));
      const verses = searchVerses(q);
      body.innerHTML = `
        ${hitSongs.length ? `<h3 class="sub">Songs</h3><div class="list">${hitSongs.map(songRow).join('')}</div>` : ''}
        <h3 class="sub">Verse (${verses.length}${verses.length === 30 ? '+' : ''})</h3>
        <div class="list">${verses.map((v) => {
          const s = songForVerse(v.ch, v.v);
          const txt = escapeHtml(v.text).replace(new RegExp(escapeRe(escapeHtml(q)), 'gi'), (m) => `<mark>${m}</mark>`);
          return `<a class="verse-hit" href="${s ? `#/song/${s.id}` : `#/chapter/${v.ch}?v=${v.v}`}"><b>Offb ${v.ch},${v.v}</b>${s ? ' <span class="tag">🎵 Song</span>' : ''}<p>${txt}</p></a>`;
        }).join('') || '<p class="muted">Keine Treffer.</p>'}</div>`;
      return;
    }
    if (tab === 'songs') {
      const b = songs.filter((s) => s.builtin);
      body.innerHTML = `<div class="album">
          <div class="album-art">${b.slice(0, 3).map((s) => cover(s)).join('')}</div>
          <div><small class="muted">Album</small><b>Offenbarung – Afro</b><small class="muted">${b.length} Songs · Elberfelder</small></div>
        </div>
        <div class="list">${b.map(songRow).join('')}</div>`;
    } else if (tab === 'mine') {
      const c = songs.filter((s) => !s.builtin);
      body.innerHTML = c.length ? `<div class="list">${c.map((s) => `<div class="row-wrap">${songRow(s)}<button class="icon-btn danger" data-del="${s.id}" aria-label="Löschen">🗑</button></div>`).join('')}</div>`
        : `<div class="empty"><div class="big-ic">🎼</div><p>Noch keine eigenen Songs.</p><p class="muted small">Importiere eine MP3 und füge den Text ein – die App erkennt die Melodie und du tippst das Timing.</p><a class="btn primary" href="#/import">Song importieren</a></div>`;
    } else {
      body.innerHTML = `<div class="chapters">${BIBLE.map((c) => {
        const has = songs.some((s) => s.chapter === c.n);
        return `<a class="chapter" href="#/chapter/${c.n}"><span class="ch-em">${c.emoji}</span><div><b>Kapitel ${c.n}</b><small>${escapeHtml(c.title)}</small></div><small class="muted">${c.v.length} V.${has ? ' · 🎵' : ''}</small></a>`;
      }).join('')}</div>`;
    }
  }
  root.querySelector('.tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; qIn.value = ''; render(); } });
  qIn.addEventListener('input', render);
  body.addEventListener('click', async (e) => {
    const d = e.target.closest('[data-del]');
    if (!d) return;
    e.preventDefault();
    if (!confirm('Diesen Song wirklich löschen?')) return;
    await customSongs.remove(d.dataset.del);
    const i = songs.findIndex((s) => s.id === d.dataset.del);
    if (i >= 0) songs.splice(i, 1);
    toast('Song gelöscht');
    render();
  });
  render();
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export function chapterScreen(root, params) {
  const n = +params.id;
  const ch = BIBLE[n - 1];
  if (!ch) { root.innerHTML = '<div class="empty">Kapitel nicht gefunden.</div>'; return; }
  let hide = false;
  root.innerHTML = `
  <div class="chapter-view">
    <header class="page-head"><button class="icon-btn" onclick="history.back()" aria-label="Zurück">‹</button>
      <div><small class="muted">Offenbarung ${n}</small><h1>${ch.emoji} ${escapeHtml(ch.title)}</h1></div></header>
    <div class="row gap">
      <button class="btn small ghost" data-act="hide">🧠 Lernmodus</button>
      <a class="btn small primary" href="#/import?ch=${n}">🎼 Song daraus erstellen</a>
    </div>
    <ol class="verses">${ch.v.map((t, i) => {
      const s = songForVerse(n, i + 1);
      return `<li id="v${i + 1}" class="${s ? 'sung' : ''}"><b>${i + 1}</b> <span class="vt">${escapeHtml(t)}</span>${s && s.v0 === i + 1 ? ` <a class="tag" href="#/song/${s.id}">🎵 ${escapeHtml(s.title)} singen</a>` : ''}</li>`;
    }).join('')}</ol>
  </div>`;
  root.querySelector('[data-act="hide"]').onclick = (e) => {
    hide = !hide;
    e.target.classList.toggle('on', hide);
    root.querySelector('.verses').classList.toggle('memo', hide);
  };
  root.querySelector('.verses').addEventListener('click', (e) => { const li = e.target.closest('li'); if (li && hide) li.classList.toggle('show'); });
  if (params.v) setTimeout(() => { const el = root.querySelector('#v' + params.v); el && el.scrollIntoView({ block: 'center' }); el && el.classList.add('flash'); }, 50);
}

export { rangeLabel };
