// Notenbahn (Canvas): Ziel-Noten laufen von rechts zur Spiellinie, deine
// Stimme liegt als Spur darüber. Farben: Ziel-Noten neutral grau, die eine
// Datenfarbe (Gold) nur auf getroffenen Noten und der treffenden Stimme.
const GOLD = '#f2b33d';
const NOTE = '#5c5c5c';
const NOTE_ACTIVE = '#e6e6e6';
const NOTE_MISSED = '#262626';
import { noteName } from '../core/notes.js';

const PAST = 2.2;     // Sekunden links der Spiellinie
const FUTURE = 5.0;   // Sekunden rechts der Spiellinie (Standard)
const HEAD = 0.3;     // Position der Spiellinie (Anteil der Breite)

export class Lane {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.notation = opts.notation || 'de';
    this.notes = [];
    this.scoreOf = () => 0;
    this.lo = 48; this.hi = 72;
    this.trail = [];
    this.particles = [];
    this.lastHitBurst = 0;
    this.future = opts.future || FUTURE;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
  }

  resize() {
    const r = this.cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(10, r.width); this.h = Math.max(10, r.height);
    this.cv.width = this.w * dpr; this.cv.height = this.h * dpr;
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setNotes(notes, scoreOf) {
    this.notes = notes;
    if (scoreOf) this.scoreOf = scoreOf;
    if (notes.length) {
      let lo = Infinity, hi = -Infinity;
      for (const n of notes) { lo = Math.min(lo, n[2]); hi = Math.max(hi, n[2]); }
      this.setRange(lo, hi);
    }
  }

  setRange(lo, hi) {
    const pad = Math.max(2, (14 - (hi - lo)) / 2);
    this.lo = Math.floor(lo - pad); this.hi = Math.ceil(hi + pad);
  }

  y(m) { return this.h - ((m - this.lo + 0.5) / (this.hi - this.lo + 1)) * this.h; }
  x(dt) { const head = this.w * HEAD; return dt < 0 ? head + (dt / PAST) * head : head + (dt / this.future) * (this.w - head); }

  /** Gesungene Tonhöhe (bereits für die Anzeige gefaltet) zum Zeitpunkt t. */
  pushPitch(t, midi, hit) {
    this.trail.push({ t, m: midi, hit });
    while (this.trail.length && this.trail[0].t < t - PAST - 0.2) this.trail.shift();
    // auch Rücksprünge (Seek) erlauben
    if (this.trail.length > 2 && this.trail[this.trail.length - 2].t > t + 0.1) this.trail = [{ t, m: midi, hit }];
    if (hit && performance.now() - this.lastHitBurst > 90 && midi != null) {
      this.lastHitBurst = performance.now();
      this.burst(this.w * HEAD, this.y(midi), 3);
    }
  }

  burst(x, y, n = 10, color = GOLD) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 120;
      this.particles.push({ x, y, vx: Math.cos(a) * s - 60, vy: Math.sin(a) * s, life: 1, color });
    }
  }

  clearTrail() { this.trail = []; }

  render(t, dtFrame = 1 / 60, follow = null) {
    const g = this.g, w = this.w, h = this.h;
    if (follow != null) { // Tuner/Stimmtest: Bereich folgt der Stimme
      const mid = (this.lo + this.hi) / 2;
      if (Math.abs(follow - mid) > 4) { const d = follow - mid; this.lo += d * 0.1; this.hi += d * 0.1; }
    }
    g.clearRect(0, 0, w, h);
    const rowH = h / (this.hi - this.lo + 1);

    // Halbton-Raster
    g.font = `${Math.max(9, Math.min(12, rowH * 0.7))}px system-ui, sans-serif`;
    g.textBaseline = 'middle';
    for (let m = Math.ceil(this.lo); m <= this.hi; m++) {
      const y = this.y(m);
      const isC = ((m % 12) + 12) % 12 === 0;
      const black = [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
      g.fillStyle = black ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.045)';
      g.fillRect(0, y - rowH / 2, w, rowH);
      g.fillStyle = isC ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
      g.fillRect(0, y + rowH / 2 - 0.5, w, isC ? 1 : 0.5);
      if (!black && rowH > 7) {
        g.fillStyle = isC ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)';
        g.fillText(noteName(m, this.notation), 6, y);
      }
    }

    // Ziel-Noten
    const head = w * HEAD;
    const bh = Math.max(6, rowH * 0.78);
    for (let i = 0; i < this.notes.length; i++) {
      const [s, d, m] = this.notes[i];
      if (s + d < t - PAST || s > t + this.future) continue;
      const x0 = this.x(s - t), x1 = this.x(s + d - t);
      const y = this.y(m) - bh / 2;
      const done = s + d < t, active = s <= t && !done;
      const sc = this.scoreOf(i);
      let fill;
      if (done) fill = sc >= 0.6 ? GOLD : NOTE_MISSED;
      else if (active) fill = sc > 0.3 ? GOLD : NOTE_ACTIVE;
      else fill = NOTE;
      roundRect(g, x0, y, Math.max(4, x1 - x0 - 1.5), bh, bh / 2);
      if (this.notes[i][3] === 'L') { // nur hören: Umriss
        g.strokeStyle = active ? NOTE_ACTIVE : '#7a7a7a'; g.lineWidth = 2; g.setLineDash([5, 4]); g.stroke(); g.setLineDash([]);
      } else {
        g.fillStyle = fill;
        g.fill();
      }
    }

    // Spiellinie: vergangene Zeit eine Tonstufe heller, dann eine 2px-Linie
    g.fillStyle = 'rgba(255,255,255,0.03)';
    g.fillRect(0, 0, head, h);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillRect(head - 1, 0, 2, h);

    // Stimm-Spur
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = Math.max(3, rowH * 0.32);
    let prev = null;
    for (const p of this.trail) {
      if (p.m == null || p.t > t + 0.05) { prev = null; continue; }
      if (prev && p.t - prev.t < 0.15) {
        g.strokeStyle = p.hit ? GOLD : '#ffffff';
        g.beginPath();
        g.moveTo(this.x(prev.t - t), this.y(prev.m));
        g.lineTo(this.x(p.t - t), this.y(p.m));
        g.stroke();
      }
      prev = p;
    }
    const last = this.trail[this.trail.length - 1];
    if (last && last.m != null && t - last.t < 0.2) {
      const y = this.y(last.m);
      g.fillStyle = last.hit ? GOLD : '#ffffff';
      g.beginPath(); g.arc(head, y, Math.max(6, rowH * 0.45), 0, Math.PI * 2); g.fill();
    }

    // Partikel
    for (const p of this.particles) {
      p.x += p.vx * dtFrame; p.y += p.vy * dtFrame; p.vy += 200 * dtFrame; p.life -= dtFrame * 1.6;
      if (p.life <= 0) continue;
      g.globalAlpha = p.life;
      g.fillStyle = p.color;
      g.beginPath(); g.arc(p.x, p.y, 2.5 * p.life + 0.5, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  destroy() { this.ro.disconnect(); }
}

function roundRect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
