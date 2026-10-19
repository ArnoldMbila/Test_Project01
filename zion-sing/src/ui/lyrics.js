// Karaoke-Lyrics: aktuelle Zeile mit Wort-für-Wort-Füllung, nächste Zeile als
// Vorschau. Lern-Modi blenden Wörter aus, bis sie gesungen werden.

const PRE = 0.6; // Zeile erscheint so viele Sekunden vor dem Einsatz

function hiddenSet(lines, mode) {
  const hide = new Set();
  if (mode === 'all') return hide;
  lines.forEach((l, li) => l.words.forEach((w, wi) => {
    const plain = w[0].replace(/[^\p{L}\d]/gu, '');
    if (l.adlib || !plain) return;
    if (mode === 'memory' || (plain.length > 3 && (li * 7 + wi * 3) % 5 < 3)) hide.add(li + ':' + wi);
  }));
  return hide;
}

export class LyricsView {
  constructor(el, lines, opts = {}) {
    this.el = el;
    this.lines = lines;
    this.mode = opts.mode || 'all';
    this.hidden = hiddenSet(lines, this.mode);
    this.idx = -2;
    this.el.innerHTML = '<div class="ly-verse"></div><div class="ly-cur"></div><div class="ly-next"></div>';
    this.vEl = el.querySelector('.ly-verse');
    this.curEl = el.querySelector('.ly-cur');
    this.nextEl = el.querySelector('.ly-next');
    this.wordEls = [];
  }

  setMode(mode) { this.mode = mode; this.hidden = hiddenSet(this.lines, mode); this.idx = -2; }

  lineAt(t) {
    let idx = -1;
    for (let i = 0; i < this.lines.length; i++) {
      if (t >= this.lines[i].t0 - PRE) idx = i; else break;
    }
    return idx;
  }

  renderLine(target, li, withWords) {
    const l = this.lines[li];
    if (!l) { target.innerHTML = ''; return []; }
    target.classList.toggle('adlib', !!l.adlib);
    target.innerHTML = l.words.map((w, wi) => {
      const hid = this.hidden.has(li + ':' + wi);
      return `<span class="w${hid ? ' hid' : ''}" data-i="${wi}">${escapeHtml(w[0])}</span>`;
    }).join(' ');
    return withWords ? [...target.querySelectorAll('.w')] : [];
  }

  update(t) {
    let idx = this.lineAt(t);
    const first = this.lines[0];
    // langes Zwischenspiel → Instrumental-Hinweis
    const cur = this.lines[idx];
    const next = this.lines[idx + 1];
    const instrumental = (idx < 0 && first && first.t0 - t > 2.5) ||
      (cur && t > cur.t1 + 1.2 && next && next.t0 - t > 2.5);
    const key = instrumental ? 'i' + idx : idx;
    if (key !== this.idx) {
      this.idx = key;
      if (instrumental) {
        const up = idx < 0 ? 0 : idx + 1;
        this.curEl.innerHTML = '<span class="ly-inst">Instrumental</span>';
        this.curEl.classList.remove('adlib');
        this.renderLine(this.nextEl, up, false);
        this.wordEls = [];
        this.vEl.textContent = this.lines[up] && this.lines[up].v ? `Gleich: Vers ${this.lines[up].v}` : '';
      } else {
        this.wordEls = this.renderLine(this.curEl, Math.max(0, idx), true);
        this.renderLine(this.nextEl, Math.max(0, idx) + 1, false);
        const l = this.lines[Math.max(0, idx)];
        this.vEl.textContent = l && l.v ? `Vers ${l.v}` : '';
      }
    }
    if (!instrumental && this.wordEls.length) {
      const l = this.lines[Math.max(0, idx)];
      this.wordEls.forEach((el, wi) => {
        const [, a, b] = l.words[wi];
        const p = t <= a ? 0 : t >= b ? 1 : (t - a) / Math.max(0.05, b - a);
        el.style.setProperty('--p', (p * 100).toFixed(1) + '%');
        if (p > 0 && el.classList.contains('hid')) el.classList.add('revealed');
      });
    }
    return Math.max(0, idx);
  }
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
