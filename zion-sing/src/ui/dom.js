// Kleine DOM-Helfer: Toasts, Bottom-Sheets, Sterne, Cover.
import { escapeHtml } from './lyrics.js';
import { icon } from './icons.js';

export { escapeHtml };

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function go(hash) {
  if (location.hash === hash || (hash === '#/' && !location.hash)) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

export function toast(html, ms = 2600) {
  const host = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, ms);
}

/** Bottom-Sheet; gibt { el, close } zurück. */
export function sheet(title, bodyHtml, onClose) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-label="${escapeHtml(title)}">
    <div class="sheet-grip"></div>
    <div class="sheet-head"><h3>${escapeHtml(title)}</h3><button class="icon-btn" data-close aria-label="Schließen">${icon('close', 18)}</button></div>
    <div class="sheet-body">${bodyHtml}</div></div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  const close = () => {
    wrap.classList.remove('open');
    setTimeout(() => wrap.remove(), 300);
    onClose && onClose();
  };
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
  return { el: wrap.querySelector('.sheet'), close };
}

export function stars(n, max = 3) {
  let s = '';
  for (let i = 0; i < max; i++) s += `<span class="star${i < n ? ' on' : ''}">${icon('star', 16)}</span>`;
  return `<span class="stars" aria-label="${n} von ${max} Sternen">${s}</span>`;
}

export function cover(song, cls = '') {
  if (song.audio && song.audio.cover) {
    return `<div class="cover ${cls}"><img src="${song.audio.cover}" alt="Cover: ${escapeHtml(song.title)}" loading="lazy"></div>`;
  }
  const initials = (song.title || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<div class="cover ${cls} cover-gen"><span>${escapeHtml(initials)}</span></div>`;
}

export function fmtTime(s) {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Bewertung 1–5 als kleine Leiste. */
export function meter(n, max = 5) {
  let s = '';
  for (let i = 0; i < max; i++) s += `<i class="${i < n ? 'on' : ''}"></i>`;
  return `<span class="meter" aria-label="Schwierigkeit ${n} von ${max}">${s}</span>`;
}

/** Segment-Auswahl (Chips). onPick(value) */
export function chips(name, options, value) {
  return `<div class="chips" data-chips="${name}">${options.map(([v, label]) =>
    `<button class="chip${String(v) === String(value) ? ' on' : ''}" data-v="${v}">${label}</button>`).join('')}</div>`;
}

export function bindChips(root, name, onPick) {
  const box = root.querySelector(`[data-chips="${name}"]`);
  if (!box) return;
  box.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    box.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
    onPick(b.dataset.v);
  });
}

/** Mini-Klaviatur als SVG mit hervorgehobenem Bereich [lo, hi]. */
export function keyboardSvg(lo, hi, from = 36, to = 84, mark = null) {
  const whites = [];
  for (let m = from; m <= to; m++) if (![1, 3, 6, 8, 10].includes(m % 12)) whites.push(m);
  const W = 100 / whites.length;
  let out = `<svg class="kbd" viewBox="0 0 100 24" preserveAspectRatio="none">`;
  whites.forEach((m, i) => {
    const on = lo != null && m >= lo && m <= hi;
    const mk = mark != null && Math.round(mark) === m;
    out += `<rect x="${i * W}" y="0" width="${W - 0.25}" height="24" rx="0.6" class="wk${on ? ' on' : ''}${mk ? ' mk' : ''}"/>`;
  });
  whites.forEach((m, i) => {
    const b = m + 1;
    if (b > to || [4, 11].includes(m % 12)) return;
    const on = lo != null && b >= lo && b <= hi;
    const mk = mark != null && Math.round(mark) === b;
    out += `<rect x="${(i + 1) * W - W * 0.32}" y="0" width="${W * 0.64}" height="14" rx="0.5" class="bk${on ? ' on' : ''}${mk ? ' mk' : ''}"/>`;
  });
  return out + '</svg>';
}
