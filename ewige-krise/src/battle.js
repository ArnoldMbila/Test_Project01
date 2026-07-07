/* =========================================================
 * EWIGE KRISE — Kampf-Engine
 * Active-Time-Battle im Warte-Modus: Leisten füllen sich in
 * Echtzeit, pausieren aber, solange ein Befehlsmenü offen ist.
 * Bruch-Leiste: Treffer (v. a. auf Schwächen) füllen sie;
 * voll => Gegner erschüttert (kann nicht handeln, +50 % Schaden).
 * Limit-Leiste: füllt sich durch ausgeteilten/erlittenen Schaden.
 * ========================================================= */

const Battle = (() => {

  const ATB_MAX = 100;
  const STAGGER_ZEIT = 6.5;   // Sekunden erschüttert
  const SCALE_HERO = 4;

  let canvas, ctx;
  let state = null;
  let callbacks = {};

  /* ---------------- Aufbau ---------------- */

  function heroUnit(heroId, level) {
    const base = HEROES[heroId];
    const s = heroStatsAt(heroId, level);
    return {
      kind: 'hero', id: heroId, name: base.name, level,
      hp: s.hp, hpMax: s.hp, mp: Math.round(s.mp * 0.7), mpMax: s.mp,
      atk: s.atk, mag: s.mag, def: s.def, spd: s.spd,
      skills: base.skills,
      atb: Math.random() * 40, limit: 0,
      guard: false, buffs: [],
      x: 0, y: 0, homeX: 0, homeY: 0,
      flash: 0, lunge: 0, dead: false, sprite: heroId, scale: SCALE_HERO
    };
  }

  function enemyUnit(enemyId, chapterIdx) {
    const base = ENEMIES[enemyId];
    const f = Math.pow(1.35, chapterIdx);
    return {
      kind: 'enemy', id: enemyId, name: base.name, boss: !!base.boss,
      hp: Math.round(base.hp * f), hpMax: Math.round(base.hp * f),
      atk: Math.round(base.atk * f), mag: Math.round(base.mag * f),
      def: Math.round(base.def * f), spd: base.spd,
      weak: base.weak, resist: base.resist,
      breakVal: 0, breakMax: base.breakMax, staggered: 0,
      attacks: base.attacks, charging: null,
      exp: Math.round(base.exp * f), gold: Math.round(base.gold * f),
      atb: Math.random() * 30,
      x: 0, y: 0, homeX: 0, homeY: 0,
      flash: 0, lunge: 0, dead: false, sprite: base.sprite, scale: base.scale
    };
  }

  function start(opts) {
    canvas = opts.canvas;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    callbacks = opts.callbacks || {};

    const chapter = CHAPTERS[opts.chapterIdx];
    state = {
      chapterIdx: opts.chapterIdx,
      chapter,
      waveIdx: 0,
      heroes: opts.party.map(id => heroUnit(id, opts.levels[id] || 1)),
      enemies: [],
      items: Object.assign({}, opts.items),
      queue: [],          // Helden mit voller Leiste, warten auf Befehl
      menuOffen: false,
      anim: null,         // laufende Aktions-Animation
      floaters: [],       // Schadenszahlen
      partikel: [],
      log: [],
      zeit: 0,
      vorbei: false,
      belohnung: { exp: 0, gold: 0 }
    };

    spawnWave();
    positionUnits();
    lastT = performance.now();
    requestAnimationFrame(loop);
    logMsg(chapter.name + ' — Welle 1');
  }

  function spawnWave() {
    const wave = state.chapter.waves[state.waveIdx];
    state.enemies = wave.map(id => enemyUnit(id, state.chapterIdx));
    positionUnits();
  }

  function positionUnits() {
    const W = canvas.width, H = canvas.height;
    const bodenY = H * 0.78;
    state.heroes.forEach((h, i) => {
      const spr = SpriteFactory.get(h.sprite, h.scale);
      h.homeX = W * 0.68 + i * 70;
      h.homeY = bodenY - spr.h + i * 30 - 30;
      h.x = h.homeX; h.y = h.homeY;
    });
    state.enemies.forEach((e, i) => {
      const spr = SpriteFactory.get(e.sprite, e.scale);
      e.homeX = W * 0.08 + i * 105;
      e.homeY = bodenY - spr.h + (i % 2) * 34 - 24;
      e.x = e.homeX; e.y = e.homeY;
    });
  }

  /* ---------------- Hilfen ---------------- */

  function logMsg(text) {
    state.log.push(text);
    if (state.log.length > 4) state.log.shift();
    if (callbacks.onLog) callbacks.onLog(state.log);
  }

  function lebendeHelden() { return state.heroes.filter(h => !h.dead); }
  function lebendeGegner() { return state.enemies.filter(e => !e.dead); }

  function buffFaktor(unit, stat) {
    let f = 1;
    unit.buffs.forEach(b => { if (b[stat]) f += b[stat]; });
    return f;
  }

  function elementFaktor(ziel, element) {
    if (!element || element === 'physisch') {
      if (ziel.weak && ziel.weak.includes('physisch')) return 1.5;
      return 1;
    }
    if (ziel.weak && ziel.weak.includes(element)) return 1.5;
    if (ziel.resist && ziel.resist.includes(element)) return 0.5;
    return 1;
  }

  function schaden(quelle, ziel, skill) {
    const statWert = skill.stat === 'mag'
      ? quelle.mag * buffFaktor(quelle, 'mag')
      : quelle.atk * buffFaktor(quelle, 'atk');
    const defWert = ziel.def * (ziel.kind === 'hero' ? buffFaktor(ziel, 'def') : 1);
    let dmg = statWert * (skill.pow || 1) * 2.2 - defWert * 0.9;
    dmg *= elementFaktor(ziel, skill.element);
    if (ziel.kind === 'enemy' && ziel.staggered > 0) dmg *= 1.5;
    if (ziel.kind === 'hero' && ziel.guard) dmg *= 0.5;
    const krit = Math.random() < 0.08;
    if (krit) dmg *= 1.6;
    dmg *= 0.9 + Math.random() * 0.2;
    return { wert: Math.max(1, Math.round(dmg)), krit };
  }

  function floater(x, y, text, farbe, gross) {
    state.floaters.push({ x, y, text, farbe, gross: !!gross, t: 0 });
  }

  function burst(x, y, farbe, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 40 + Math.random() * 140;
      state.partikel.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40,
        farbe, t: 0, dauer: 0.5 + Math.random() * 0.4
      });
    }
  }

  function unitMitte(u) {
    const spr = SpriteFactory.get(u.sprite, u.scale);
    return { x: u.x + spr.w / 2, y: u.y + spr.h / 2 };
  }

  /* ---------------- Treffer anwenden ---------------- */

  function triffGegner(quelle, ziel, skill, multi) {
    const { wert, krit } = schaden(quelle, ziel, skill);
    ziel.hp = Math.max(0, ziel.hp - wert);
    ziel.flash = 0.18;
    const m = unitMitte(ziel);
    const ef = elementFaktor(ziel, skill.element);
    floater(m.x, m.y - 20, String(wert) + (krit ? '!' : ''), krit ? '#ffd44a' : '#ffffff', krit);
    if (ef > 1) floater(m.x, m.y + 4, 'SCHWÄCHE', '#ffb03a');
    if (ef < 1) floater(m.x, m.y + 4, 'Resistenz', '#8aa0b0');
    burst(m.x, m.y, ELEMENT_COLORS[skill.element] || '#fff', krit ? 22 : 12);

    // Bruch-Leiste
    if (ziel.staggered <= 0) {
      let bp = (skill.breakPow || 6) * (multi ? 0.6 : 1);
      if (ef > 1) bp *= 1.8;
      ziel.breakVal = Math.min(ziel.breakMax, ziel.breakVal + bp);
      if (ziel.breakVal >= ziel.breakMax) {
        ziel.staggered = STAGGER_ZEIT;
        ziel.charging = null;
        ziel.atb = 0;
        floater(m.x, m.y - 44, 'ERSCHÜTTERT!', '#ff6a3a', true);
        logMsg(ziel.name + ' ist erschüttert!');
      }
    }

    // Limit-Aufladung des Angreifers
    quelle.limit = Math.min(100, quelle.limit + wert * 0.045);

    if (ziel.hp <= 0) {
      ziel.dead = true;
      state.belohnung.exp += ziel.exp;
      state.belohnung.gold += ziel.gold;
      burst(m.x, m.y, '#ffffff', 30);
      logMsg(ziel.name + ' wurde besiegt.');
    }
  }

  function triffHeld(quelle, ziel, atk) {
    const skill = { stat: 'atk', pow: atk.pow, element: atk.element };
    const { wert, krit } = schaden(quelle, ziel, skill);
    ziel.hp = Math.max(0, ziel.hp - wert);
    ziel.flash = 0.18;
    ziel.limit = Math.min(100, ziel.limit + wert * 0.09);
    const m = unitMitte(ziel);
    floater(m.x, m.y - 20, String(wert) + (krit ? '!' : ''), '#ff7a6a', krit);
    burst(m.x, m.y, ELEMENT_COLORS[atk.element] || '#fff', 10);
    if (ziel.hp <= 0) {
      ziel.dead = true;
      logMsg(ziel.name + ' ist gefallen!');
    }
  }

  /* ---------------- Aktionen ---------------- */

  function heldAktion(held, aktion) {
    // aktion: {typ:'angriff'|'skill'|'limit'|'item'|'verteidigen', skillId, itemId, ziel}
    state.menuOffen = false;
    held.guard = false;
    held.atb = 0;

    if (aktion.typ === 'verteidigen') {
      held.guard = true;
      held.mp = Math.min(held.mpMax, held.mp + 6);
      logMsg(held.name + ' verteidigt.');
      naechsterBefehl();
      return;
    }

    if (aktion.typ === 'item') {
      const item = ITEMS[aktion.itemId];
      state.items[aktion.itemId]--;
      const z = aktion.ziel;
      const m = unitMitte(z);
      if (item.heal) {
        z.hp = Math.min(z.hpMax, z.hp + item.heal);
        floater(m.x, m.y - 20, '+' + item.heal, '#6ae08a');
      }
      if (item.mp) {
        z.mp = Math.min(z.mpMax, z.mp + item.mp);
        floater(m.x, m.y - 20, '+' + item.mp + ' MP', '#6ab0e0');
      }
      if (item.revive && z.dead) {
        z.dead = false;
        z.hp = Math.round(z.hpMax * item.revive);
        z.atb = 0;
        floater(m.x, m.y - 20, 'WIEDERBELEBT', '#ffe98a', true);
      }
      burst(m.x, m.y, '#6ae08a', 14);
      logMsg(held.name + ' benutzt ' + item.name + '.');
      naechsterBefehl();
      return;
    }

    let skill, istLimit = false;
    if (aktion.typ === 'limit') {
      skill = LIMITS[held.id];
      istLimit = true;
      held.limit = 0;
    } else if (aktion.typ === 'skill') {
      skill = SKILLS[aktion.skillId];
      held.mp -= skill.mp;
    } else {
      skill = SKILLS.angriff;
      held.mp = Math.min(held.mpMax, held.mp + 4);
    }

    // Unterstützung ohne Ziel-Gegner
    if (skill.target === 'party' || skill.target === 'self' || skill.target === 'ally') {
      if (skill.buff) {
        const ziele = skill.target === 'party' ? lebendeHelden() : [aktion.ziel || held];
        ziele.forEach(z => {
          z.buffs.push(Object.assign({ restZuege: skill.buff.dauer }, skill.buff));
          const m = unitMitte(z);
          floater(m.x, m.y - 24, skill.buff.atk ? 'ANG↑' : 'VER↑', '#6ae08a');
          burst(m.x, m.y, '#6ae08a', 10);
        });
      }
      if (skill.heal) {
        const z = aktion.ziel || held;
        const menge = Math.round(z.hpMax * skill.heal);
        z.hp = Math.min(z.hpMax, z.hp + menge);
        const m = unitMitte(z);
        floater(m.x, m.y - 20, '+' + menge, '#6ae08a');
        burst(m.x, m.y, '#6ae08a', 14);
      }
      logMsg(held.name + ': ' + skill.name);
      naechsterBefehl();
      return;
    }

    // Angriffs-Animation einreihen
    const ziele = skill.target === 'all-enemies'
      ? lebendeGegner()
      : [aktion.ziel];
    state.anim = {
      typ: 'held-angriff', held, skill, ziele,
      hits: skill.hits || 1, hitIdx: 0, t: 0, istLimit,
      healParty: skill.healParty || 0
    };
    logMsg(held.name + (istLimit ? ' — LIMIT: ' : ': ') + skill.name + '!');
  }

  function gegnerAktion(gegner) {
    let atk;
    if (gegner.charging) {
      atk = gegner.charging;
      gegner.charging = null;
    } else {
      atk = gegner.attacks[Math.floor(Math.random() * gegner.attacks.length)];
      if (atk.charge) {
        gegner.charging = atk;
        gegner.atb = 40; // lädt auf, schlägt beim nächsten Mal zu
        const m = unitMitte(gegner);
        floater(m.x, m.y - 40, '⚠ ' + atk.name, '#ffb03a', true);
        logMsg(atk.charge);
        return;
      }
    }
    const helden = lebendeHelden();
    if (!helden.length) return;
    const ziele = atk.target === 'all-heroes'
      ? helden
      : [helden[Math.floor(Math.random() * helden.length)]];
    state.anim = {
      typ: 'gegner-angriff', gegner, atk, ziele,
      hits: atk.hits || 1, hitIdx: 0, t: 0
    };
    logMsg(gegner.name + ': ' + atk.name + '!');
  }

  /* ---------------- Befehls-Warteschlange ---------------- */

  function naechsterBefehl() {
    state.queue = state.queue.filter(h => !h.dead);
    if (state.queue.length && !state.anim) {
      state.menuOffen = true;
      if (callbacks.onCommand) callbacks.onCommand(state.queue[0], state);
    } else {
      state.menuOffen = false;
      if (callbacks.onCommandDone) callbacks.onCommandDone();
    }
  }

  function befehlAusfuehren(aktion) {
    if (!state || !state.queue.length) return;
    const held = state.queue.shift();
    // Buffs des Helden einen Zug altern lassen
    held.buffs = held.buffs.filter(b => --b.restZuege > 0);
    heldAktion(held, aktion);
  }

  /* ---------------- Spiel-Schleife ---------------- */

  let lastT = 0;

  function loop(now) {
    if (!state) return;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    update(dt);
    render();
    if (!state.vorbei) requestAnimationFrame(loop);
  }

  function update(dt) {
    state.zeit += dt;

    // Effekte
    state.floaters.forEach(f => f.t += dt);
    state.floaters = state.floaters.filter(f => f.t < 1.1);
    state.partikel.forEach(p => {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
    });
    state.partikel = state.partikel.filter(p => p.t < p.dauer);
    state.heroes.concat(state.enemies).forEach(u => {
      if (u.flash > 0) u.flash -= dt;
    });

    // Laufende Aktions-Animation
    if (state.anim) {
      animSchritt(dt);
      return;
    }

    // Sieg / Niederlage prüfen
    if (!lebendeGegner().length) {
      if (state.waveIdx < state.chapter.waves.length - 1) {
        state.waveIdx++;
        spawnWave();
        state.queue = [];
        logMsg('Welle ' + (state.waveIdx + 1) + '!');
      } else {
        state.vorbei = true;
        if (callbacks.onEnd) callbacks.onEnd(true, state.belohnung, state);
        return;
      }
    }
    if (!lebendeHelden().length) {
      state.vorbei = true;
      if (callbacks.onEnd) callbacks.onEnd(false, state.belohnung, state);
      return;
    }

    // ATB pausiert, solange ein Menü offen ist (Warte-Modus)
    if (state.menuOffen) return;

    lebendeHelden().forEach(h => {
      if (state.queue.includes(h)) return;
      h.atb += h.spd * 2.6 * dt;
      if (h.atb >= ATB_MAX) {
        h.atb = ATB_MAX;
        state.queue.push(h);
      }
    });

    lebendeGegner().forEach(e => {
      if (e.staggered > 0) {
        e.staggered -= dt;
        if (e.staggered <= 0) { e.breakVal = 0; }
        return;
      }
      e.atb += e.spd * 2.2 * dt;
      if (e.atb >= ATB_MAX && !state.anim) {
        e.atb = 0;
        gegnerAktion(e);
      }
    });

    if (state.queue.length && !state.menuOffen && !state.anim) {
      naechsterBefehl();
    }
  }

  function animSchritt(dt) {
    const a = state.anim;
    a.t += dt;

    if (a.typ === 'held-angriff') {
      const held = a.held;
      const phase = a.t;
      // Vorstoß 0–0.22 s, Treffer, Rückkehr
      if (phase < 0.22) {
        held.lunge = phase / 0.22;
      } else if (a.hitIdx < a.hits) {
        // Treffer im Abstand von 0.16 s
        if (phase > 0.22 + a.hitIdx * 0.16) {
          a.ziele.forEach(z => {
            if (!z.dead) triffGegner(held, z, a.skill, a.ziele.length > 1);
          });
          a.hitIdx++;
          if (callbacks.onTick) callbacks.onTick(state);
        }
        held.lunge = 1;
      } else if (phase < 0.22 + a.hits * 0.16 + 0.25) {
        held.lunge = Math.max(0, 1 - (phase - 0.22 - a.hits * 0.16) / 0.25);
      } else {
        held.lunge = 0;
        if (a.istLimit && a.healParty) {
          lebendeHelden().forEach(h => {
            const menge = Math.round(h.hpMax * a.healParty);
            h.hp = Math.min(h.hpMax, h.hp + menge);
            const m = unitMitte(h);
            floater(m.x, m.y - 20, '+' + menge, '#6ae08a');
          });
        }
        state.anim = null;
        naechsterBefehl();
      }
    }

    if (a.typ === 'gegner-angriff') {
      const g = a.gegner;
      if (a.t < 0.22) {
        g.lunge = a.t / 0.22;
      } else if (a.hitIdx < a.hits) {
        if (a.t > 0.22 + a.hitIdx * 0.18) {
          a.ziele.forEach(z => { if (!z.dead) triffHeld(g, z, a.atk); });
          a.hitIdx++;
          if (callbacks.onTick) callbacks.onTick(state);
        }
        g.lunge = 1;
      } else if (a.t < 0.22 + a.hits * 0.18 + 0.25) {
        g.lunge = Math.max(0, 1 - (a.t - 0.22 - a.hits * 0.18) / 0.25);
      } else {
        g.lunge = 0;
        state.anim = null;
        naechsterBefehl();
      }
    }
  }

  /* ---------------- Rendern ---------------- */

  function render() {
    const W = canvas.width, H = canvas.height;
    const ch = state.chapter;

    // Himmel
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, ch.himmel[0]);
    grad.addColorStop(0.6, ch.himmel[1]);
    grad.addColorStop(1, ch.himmel[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Sterne / Funken im Himmel
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 197.3) % W;
      const sy = (i * 83.7) % (H * 0.5);
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(state.zeit * 1.3 + i));
      ctx.globalAlpha = tw * 0.5;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Boden
    ctx.fillStyle = ch.boden;
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, H * 0.78, W, 4);

    // Einheiten (Gegner zuerst)
    state.enemies.forEach(e => { if (!e.dead) zeichneEinheit(e, false); });
    state.heroes.forEach(h => { if (!h.dead) zeichneEinheit(h, true); });
    state.heroes.forEach(h => { if (h.dead) zeichneGefallen(h); });

    // Partikel
    state.partikel.forEach(p => {
      ctx.globalAlpha = 1 - p.t / p.dauer;
      ctx.fillStyle = p.farbe;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Schwebende Zahlen
    state.floaters.forEach(f => {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.1);
      ctx.font = (f.gross ? 'bold 26px' : 'bold 18px') + ' "Courier New", monospace';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x + 2, f.y - f.t * 40 + 2);
      ctx.fillStyle = f.farbe;
      ctx.fillText(f.text, f.x, f.y - f.t * 40);
    });
    ctx.globalAlpha = 1;

    // Gegner-Info (Name, LP, Bruch)
    lebendeGegner().forEach(e => zeichneGegnerInfo(e));

    if (callbacks.onRender) callbacks.onRender(state);
  }

  function zeichneEinheit(u, istHeld) {
    const spr = SpriteFactory.get(u.sprite, u.scale);
    const bob = Math.sin(state.zeit * 3 + u.homeX) * 2;
    const richtung = istHeld ? -1 : 1;
    const dx = u.lunge * richtung * 46;
    const x = u.homeX + dx;
    const y = u.homeY + bob;
    u.x = x; u.y = y;

    // Schatten
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + spr.w / 2, u.homeY + spr.h + 4, spr.w * 0.4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const img = istHeld ? spr.flipped : spr.base;
    // Erschütterte Gegner wackeln
    if (u.staggered > 0) {
      ctx.save();
      ctx.translate(Math.sin(state.zeit * 30) * 2, 0);
      ctx.drawImage(img, x, y);
      ctx.restore();
    } else {
      ctx.drawImage(img, x, y);
    }
    if (u.flash > 0) {
      ctx.globalAlpha = Math.min(1, u.flash * 6);
      ctx.drawImage(istHeld ? spr.whiteFlipped : spr.white, x, y);
      ctx.globalAlpha = 1;
    }
    if (u.guard) {
      ctx.strokeStyle = 'rgba(120,190,255,0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 4, y - 4, spr.w + 8, spr.h + 8);
    }
  }

  function zeichneGefallen(u) {
    const spr = SpriteFactory.get(u.sprite, u.scale);
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.translate(u.homeX + spr.w / 2, u.homeY + spr.h);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(spr.flipped, -spr.w / 2, -spr.h);
    ctx.restore();
  }

  function zeichneGegnerInfo(e) {
    const spr = SpriteFactory.get(e.sprite, e.scale);
    const x = e.homeX + spr.w / 2;
    const y = e.homeY - 26;
    const bw = Math.max(70, spr.w * 0.9);

    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#000';
    ctx.fillText(e.name, x + 1, y - 9);
    ctx.fillStyle = e.boss ? '#ffd44a' : '#f0f0f0';
    ctx.fillText(e.name, x, y - 10);

    // LP-Balken
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - bw / 2, y, bw, 6);
    ctx.fillStyle = e.hp / e.hpMax > 0.35 ? '#5ad06a' : '#e05a4a';
    ctx.fillRect(x - bw / 2, y, bw * (e.hp / e.hpMax), 6);

    // Bruch-Balken
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - bw / 2, y + 8, bw, 4);
    if (e.staggered > 0) {
      ctx.fillStyle = '#ff6a3a';
      ctx.fillRect(x - bw / 2, y + 8, bw * (e.staggered / STAGGER_ZEIT), 4);
    } else {
      ctx.fillStyle = '#ffb03a';
      ctx.fillRect(x - bw / 2, y + 8, bw * (e.breakVal / e.breakMax), 4);
    }

    if (e.charging) {
      ctx.fillStyle = '#ffb03a';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillText('⚠ lädt auf', x, y + 24);
    }
  }

  /* ---------------- API ---------------- */

  function stop() { state = null; }

  return {
    start, stop, befehlAusfuehren,
    get state() { return state; }
  };
})();
