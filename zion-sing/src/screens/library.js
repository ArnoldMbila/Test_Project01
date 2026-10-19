// Bibliothek (Songs, eigene Songs, alle Kapitel, Suche) + Kapitel-Ansicht.
import { store, customSongs } from '../core/store.js';
import { allSongs, songFit, difficultyOf, BIBLE, searchVerses, songForVerse, rangeLabel, moodsOf } from '../core/catalog.js';
import { currentStage } from '../core/stages.js';
import { cover, stars, meter, go, escapeHtml, fmtTime, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';

function songCard(song) {
  const best = store.stats.best[song.id];
  const fit = songFit(song);
  return `<a class="song-card" href="#/song/${song.id}">
    ${cover(song)}
    <div class="sc-main"><b>${escapeHtml(song.title)}</b>
      <small>${escapeHtml(song.ref || 'Eigener Song')} · ${fmtTime(song.duration || 0)}</small>
      <div class="row">${meter(difficultyOf(song))}<span class="tag">Stufe ${currentStage(song.id).label}</span>
        ${fit && fit.fit < 0.6 ? `<span class="fit hard">${fit.label}</span>` : ''}${best ? stars(best.stars) : ''}</div>
    </div></a>`;
}

function songRow(song) {
  const best = store.stats.best[song.id];
  const fit = songFit(song);
  const diff = difficultyOf(song);
  return `<a class="song-row" href="#/song/${song.id}">
    ${cover(song, 'sm')}
    <div class="sr-main"><b>${escapeHtml(song.title)}</b>
      <small>${escapeHtml(song.ref || 'Eigener Song')} · ${song.genre || 'Import'} · ${fmtTime(song.duration || 0)}</small>
      <div class="row">${meter(diff)}<span class="tag">Stufe ${currentStage(song.id).label}</span>
      ${fit && fit.fit < 0.6 ? `<span class="fit hard">${fit.label}</span>` : ''}</div>
    </div>
    <div class="sr-side">${best ? stars(best.stars) + `<small class="num faint">${best.score} Punkte</small>` : `<span class="chev">${icon('chevron', 18)}</span>`}</div>
  </a>`;
}

export async function libraryScreen(root, params) {
  const songs = await allSongs();
  let tab = params.tab || 'songs';
  let mood = 'Alle';
  root.innerHTML = `
  <div class="library">
    <header class="page-head"><h1>Songs</h1><a class="btn small" href="#/import">${icon('plus', 14)} Song importieren</a></header>
    <div class="search">${icon('search', 18)}<input type="search" placeholder="Song, Vers oder Wort suchen" data-q aria-label="Suche"></div>
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
        ${hitSongs.length ? `<h3 class="sub-h">Songs</h3><div class="list">${hitSongs.map(songRow).join('')}</div>` : ''}
        <h3 class="sub-h">Verse <span class="faint num">${verses.length}${verses.length === 30 ? '+' : ''}</span></h3>
        <div class="list">${verses.map((v) => {
          const s = songForVerse(v.ch, v.v);
          const txt = escapeHtml(v.text).replace(new RegExp(escapeRe(escapeHtml(q)), 'gi'), (m) => `<mark>${m}</mark>`);
          return `<a class="verse-hit" href="${s ? `#/song/${s.id}` : `#/chapter/${v.ch}?v=${v.v}`}"><b>Offb ${v.ch},${v.v}</b>${s ? ` <span class="tag">Im Song „${escapeHtml(s.title)}“</span>` : ''}<p>${txt}</p></a>`;
        }).join('') || '<p class="muted">Keine Treffer.</p>'}</div>`;
      return;
    }
    if (tab === 'songs') {
      const all = songs.filter((s) => s.builtin);
      const moods = ['Alle', ...new Set(all.flatMap(moodsOf))];
      const b = mood === 'Alle' ? all : all.filter((s) => moodsOf(s).includes(mood));
      body.innerHTML = `<div class="chips moods" data-moods>${moods.map((m) => `<button class="chip${m === mood ? ' on' : ''}" data-mood="${escapeHtml(m)}">${escapeHtml(m)}</button>`).join('')}</div>
        <div class="album">
          <div class="album-art">${b.slice(0, 3).map((s) => cover(s)).join('')}</div>
          <div><b>Offenbarung – Afro</b><small class="faint">${b.length} Songs · Elberfelder-Text</small></div>
        </div>
        <div class="song-grid">${b.map(songCard).join('')}</div>`;
    } else if (tab === 'mine') {
      const c = songs.filter((s) => !s.builtin);
      body.innerHTML = c.length ? `<div class="list">${c.map((s) => `<div class="row-wrap">${songRow(s)}<button class="icon-btn danger" data-del="${s.id}" aria-label="Song löschen">${icon('trash', 16)}</button></div>`).join('')}</div>`
        : `<div class="empty"><p>Noch keine eigenen Songs.</p><p class="muted small">Importiere eine MP3 und füge den Text ein – die App erkennt die Melodie und du tippst das Timing.</p><a class="btn primary" href="#/import">Song importieren</a></div>`;
    } else {
      body.innerHTML = `<div class="chapters">${BIBLE.map((c) => {
        const has = songs.some((s) => s.chapter === c.n);
        return `<a class="chapter" href="#/chapter/${c.n}"><span class="ch-n">${c.n}</span><div><b>${escapeHtml(c.title)}</b><small>${c.v.length} Verse${has ? ' · mit Song' : ''}</small></div></a>`;
      }).join('')}</div>`;
    }
  }
  root.querySelector('.tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; qIn.value = ''; render(); } });
  qIn.addEventListener('input', render);
  body.addEventListener('click', async (e) => {
    const m = e.target.closest('[data-mood]');
    if (m) { mood = m.dataset.mood; render(); return; }
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
    <a class="back-row" href="#/songs?tab=chapters">${icon('back', 16)} Kapitel</a>
    <header class="page-head"><div><h1>Offenbarung ${n}: ${escapeHtml(ch.title)}</h1><p class="sub">${ch.v.length} Verse · Elberfelder</p></div></header>
    <div class="row gap">
      <button class="btn small" data-act="hide">Lernmodus: Verse verbergen</button>
      <a class="btn small" href="#/import?ch=${n}">${icon('plus', 14)} Song daraus erstellen</a>
    </div>
    <div class="ch-layout"><ol class="verses">${ch.v.map((t, i) => {
      const s = songForVerse(n, i + 1);
      return `<li id="v${i + 1}" class="${s ? 'sung' : ''}"><b>${i + 1}</b> <span class="vtext">${escapeHtml(t)}</span>${s && s.v0 === i + 1 ? ` <a class="tag" href="#/song/${s.id}">„${escapeHtml(s.title)}“ singen</a>` : ''}</li>`;
    }).join('')}</ol>
    <aside class="ch-rail" aria-label="Kapitel"><h2>Alle Kapitel</h2>${BIBLE.map((c) => `<a class="ch-link${c.n === n ? ' on' : ''}" href="#/chapter/${c.n}"><span class="num">${c.n}</span>${escapeHtml(c.title)}</a>`).join('')}</aside></div>
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
