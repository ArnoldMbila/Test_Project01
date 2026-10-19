// Aufnahme-Studio: gespeicherte Performances anhören, herunterladen, löschen.
import { recordings } from '../core/store.js';
import { allSongs } from '../core/catalog.js';
import { cover, stars, toast, escapeHtml, fmtTime } from '../ui/dom.js';

export async function studioScreen(root) {
  const [recs, songs] = await Promise.all([recordings.all(), allSongs()]);
  recs.sort((a, b) => b.date.localeCompare(a.date));
  const urls = [];
  const url = (blob) => { const u = URL.createObjectURL(blob); urls.push(u); return u; };
  root.innerHTML = `
  <div class="studio">
    <header class="page-head"><button class="icon-btn" onclick="history.back()" aria-label="Zurück">‹</button><h1>🎙️ Studio</h1></header>
    <p class="muted">Sing einen Song zum Playback – ohne Notenbahn, ohne Leitstimme, wie auf der Bühne. Deine Aufnahme (Stimme + Musik) landet hier.</p>
    <div class="sec-head"><h2>Neue Aufnahme</h2></div>
    <div class="carousel">${songs.map((s) => `<a class="song-tile" href="#/sing/${s.id}?studio=1" style="--c:${s.color || '#7a5cff'}">${cover(s)}<b>${escapeHtml(s.title)}</b><small>● Aufnehmen</small></a>`).join('')}</div>
    <div class="sec-head"><h2>Meine Aufnahmen</h2><small class="muted">${recs.length}</small></div>
    <div class="list" data-list>${recs.length ? recs.map((r) => {
      const ext = (r.type || '').includes('mp4') ? 'm4a' : 'webm';
      const u = url(r.blob);
      return `<div class="card rec-card" data-id="${r.id}">
        <div class="row between"><div><b>${escapeHtml(r.title)}</b><br><small class="muted">${escapeHtml(r.ref || '')} · ${new Date(r.date).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} · ${fmtTime(r.seconds || 0)}</small></div>
        <div>${stars(r.stars)} <b>${r.score}</b></div></div>
        <audio controls preload="none" src="${u}" class="rec"></audio>
        <div class="row gap"><a class="btn small ghost" href="${u}" download="ZionSing-${escapeHtml(r.title)}.${ext}">⬇︎ Herunterladen</a>
        <button class="btn small ghost danger" data-del="${r.id}">🗑 Löschen</button></div></div>`;
    }).join('') : '<div class="empty"><div class="big-ic">🎧</div><p>Noch keine Aufnahmen.</p><p class="muted small">Wähle oben einen Song und leg los.</p></div>'}</div>
  </div>`;
  root.querySelector('[data-list]').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-del]');
    if (!b || !confirm('Aufnahme löschen?')) return;
    await recordings.remove(b.dataset.del);
    b.closest('.rec-card').remove();
    toast('Aufnahme gelöscht');
  });
  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}
