/* =========================================================
 * EWIGE KRISE — 3D-Kampf-Engine (Three.js)
 * Gleiche Spiellogik und API wie battle.js, aber die
 * Pixel-Maps werden zu Voxel-Figuren extrudiert und in
 * einer 3D-Diorama-Szene gerendert. Schadenszahlen,
 * Gegner-Balken und Partikel laufen über ein 2D-Overlay.
 * ========================================================= */

const Battle = (() => {

  const ATB_MAX = 100;
  const STAGGER_ZEIT = 6.5;
  const VOXEL_TIEFE = 3;

  let overlay, octx;                 // 2D-Overlay (Zahlen, Balken, Partikel)
  let renderer, glCanvas;            // WebGL (einmal erzeugt, wiederverwendet)
  let scene, camera, sonne;
  let state = null;
  let callbacks = {};
  let shake = 0;

  // Kameraposition + Blickpunkt (leicht erhöhte Frontal-Diagonale)
  const KAM = { x: 1.2, y: 4.3, z: 13.8, lx: 0, ly: 1.3, lz: 0 };

  /* ---------------- Voxel-Figuren ---------------- */

  function baueVoxelMesh(spriteId, scale) {
    const def = SpriteFactory.getDef(spriteId);
    const rows = def.rows;
    const h = rows.length, w = rows[0].length;
    const s = 0.085 * (scale / 4);   // Voxel-Kantenlänge

    let pixel = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        if (ch !== '.' && ch !== ' ' && def.pal[ch]) pixel++;
      }
    }

    const geo = new THREE.BoxGeometry(s, s, s);
    const mat = new THREE.MeshLambertMaterial();
    const mesh = new THREE.InstancedMesh(geo, mat, pixel * VOXEL_TIEFE);
    const dummy = new THREE.Object3D();
    const farbe = new THREE.Color();
    let i = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        if (ch === '.' || ch === ' ' || !def.pal[ch]) continue;
        farbe.set(def.pal[ch]);
        for (let z = 0; z < VOXEL_TIEFE; z++) {
          dummy.position.set(
            (x - w / 2) * s,
            (h - y) * s,
            (z - (VOXEL_TIEFE - 1) / 2) * s
          );
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          mesh.setColorAt(i, farbe);
          i++;
        }
      }
    }
    mesh.castShadow = true;
    const group = new THREE.Group();
    group.add(mesh);
    return { group, mesh, mat, hoehe: h * s, breite: w * s };
  }

  /* ---------------- Einheiten (Logik wie 2D) ---------------- */

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
      flash: 0, lunge: 0, dead: false, liegend: false,
      sprite: heroId, scale: 4,
      screenX: 0, screenY: 0
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
      attacks: base.attacks, charging: null, buffs: [],
      exp: Math.round(base.exp * f), gold: Math.round(base.gold * f),
      atb: Math.random() * 30,
      flash: 0, lunge: 0, dead: false,
      sprite: base.sprite, scale: base.scale,
      screenX: 0, screenY: 0
    };
  }

  /* ---------------- Szene ---------------- */

  function baueSzene() {
    const ch = state.chapter;
    scene = new THREE.Scene();

    // Himmel als Verlaufstextur + Nebel
    const sky = document.createElement('canvas');
    sky.width = 4; sky.height = 128;
    const sctx = sky.getContext('2d');
    const g = sctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, ch.himmel[0]);
    g.addColorStop(0.6, ch.himmel[1]);
    g.addColorStop(1, ch.himmel[2]);
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 4, 128);
    scene.background = new THREE.CanvasTexture(sky);
    scene.fog = new THREE.Fog(new THREE.Color(ch.himmel[1]), 18, 60);

    // Boden
    const boden = new THREE.Mesh(
      new THREE.CircleGeometry(45, 48),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(ch.boden) })
    );
    boden.rotation.x = -Math.PI / 2;
    boden.receiveShadow = true;
    scene.add(boden);

    // Kulisse: verstreute dunkle Felsen/Säulen (deterministisch pro Kapitel)
    let seed = state.chapterIdx * 97 + 13;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 14; i++) {
      const gr = 0.6 + rnd() * 2.4;
      const fels = new THREE.Mesh(
        new THREE.BoxGeometry(gr, gr * (1 + rnd() * 2), gr),
        new THREE.MeshLambertMaterial({
          color: new THREE.Color(ch.boden).multiplyScalar(0.55 + rnd() * 0.3)
        })
      );
      // Nur im Hintergrund und an den Seiten — nie vor der Kamera
      const winkel = rnd() * Math.PI;
      const dist = 14 + rnd() * 20;
      fels.position.set(Math.cos(winkel) * dist, gr * 0.8, -Math.sin(winkel) * dist * 0.8 - 3);
      fels.rotation.y = rnd() * Math.PI;
      fels.castShadow = true;
      scene.add(fels);
    }

    // Licht
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    sonne = new THREE.DirectionalLight(new THREE.Color(ch.himmel[2]), 0.9);
    sonne.position.set(6, 14, 8);
    sonne.castShadow = true;
    sonne.shadow.mapSize.set(1024, 1024);
    sonne.shadow.camera.left = -30; sonne.shadow.camera.right = 30;
    sonne.shadow.camera.top = 30; sonne.shadow.camera.bottom = -30;
    scene.add(sonne);

    // Kamera: leicht erhöht, schräg hinter der Heldenseite
    camera = new THREE.PerspectiveCamera(45, overlay.width / overlay.height, 0.1, 120);
    camera.position.set(KAM.x, KAM.y, KAM.z);
    camera.lookAt(KAM.lx, KAM.ly, KAM.lz);
  }

  function baueEinheitMesh(u, istHeld, idx, anzahl) {
    const v = baueVoxelMesh(u.sprite, u.scale);
    u.voxel = v;
    if (istHeld) {
      // Diagonale Formation: hinten-links nach vorne-rechts
      v.group.position.set(4.9 + idx * 0.9, 0, (idx - 1) * 2.4);
      v.group.rotation.y = -0.38;           // Blick Richtung Gegner/Kamera
    } else {
      v.group.position.set(-4.9 - idx * 0.9, 0, (idx - (anzahl - 1) / 2) * 2.6);
      v.group.rotation.y = 0.38;
    }
    u.home = v.group.position.clone();
    scene.add(v.group);
  }

  function entferneEinheitMesh(u) {
    if (u.voxel) {
      scene.remove(u.voxel.group);
      u.voxel.mesh.geometry.dispose();
      u.voxel.mat.dispose();
      u.voxel = null;
    }
  }

  /* ---------------- Start / Wellen ---------------- */

  function start(opts) {
    overlay = opts.canvas;
    octx = overlay.getContext('2d');

    if (!renderer) {
      glCanvas = document.createElement('canvas');
      glCanvas.width = overlay.width;
      glCanvas.height = overlay.height;
      glCanvas.id = 'spielfeld3d';
      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true });
      renderer.shadowMap.enabled = true;
      renderer.setSize(overlay.width, overlay.height, false);
    }
    if (!glCanvas.parentNode) {
      overlay.parentNode.insertBefore(glCanvas, overlay);
    }

    callbacks = opts.callbacks || {};
    const chapter = CHAPTERS[opts.chapterIdx];
    state = {
      chapterIdx: opts.chapterIdx,
      chapter,
      waveIdx: 0,
      heroes: opts.party.map(id => heroUnit(id, opts.levels[id] || 1)),
      enemies: [],
      items: Object.assign({}, opts.items),
      queue: [], menuOffen: false, anim: null,
      floaters: [], partikel: [], log: [],
      zeit: 0, vorbei: false,
      belohnung: { exp: 0, gold: 0 }
    };

    baueSzene();
    state.heroes.forEach((h, i) => baueEinheitMesh(h, true, i, state.heroes.length));
    spawnWave();

    lastT = performance.now();
    requestAnimationFrame(loop);
    logMsg(chapter.name + ' — Welle 1');
  }

  function spawnWave() {
    state.enemies.forEach(entferneEinheitMesh);
    const wave = state.chapter.waves[state.waveIdx];
    state.enemies = wave.map(id => enemyUnit(id, state.chapterIdx));
    state.enemies.forEach((e, i) => baueEinheitMesh(e, false, i, state.enemies.length));
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

  /* Weltposition (Brustkorb) einer Einheit */
  function weltMitte(u) {
    const p = u.voxel.group.position.clone();
    p.y += u.voxel.hoehe * 0.55;
    return p;
  }

  /* Projektion Welt → Overlay-Pixel */
  const _proj = new THREE.Vector3();
  function projiziere(welt) {
    _proj.copy(welt).project(camera);
    return {
      x: (_proj.x * 0.5 + 0.5) * overlay.width,
      y: (-_proj.y * 0.5 + 0.5) * overlay.height
    };
  }

  function floaterAn(u, text, farbe, gross, dy) {
    const s = projiziere(weltMitte(u));
    state.floaters.push({ x: s.x, y: s.y + (dy || 0), text, farbe, gross: !!gross, t: 0 });
  }

  function burstAn(u, farbe, n) {
    const w = weltMitte(u);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.random() * Math.PI;
      const v = 2 + Math.random() * 5;
      state.partikel.push({
        pos: w.clone(),
        vel: new THREE.Vector3(
          Math.cos(a) * Math.sin(b) * v,
          Math.cos(b) * v + 2,
          Math.sin(a) * Math.sin(b) * v
        ),
        farbe, t: 0, dauer: 0.5 + Math.random() * 0.4
      });
    }
  }

  /* ---------------- Treffer (Logik wie 2D) ---------------- */

  function triffGegner(quelle, ziel, skill, multi) {
    const { wert, krit } = schaden(quelle, ziel, skill);
    ziel.hp = Math.max(0, ziel.hp - wert);
    ziel.flash = 0.18;
    shake = Math.max(shake, krit ? 0.3 : 0.15);
    const ef = elementFaktor(ziel, skill.element);
    floaterAn(ziel, String(wert) + (krit ? '!' : ''), krit ? '#ffd44a' : '#ffffff', krit, -20);
    if (ef > 1) floaterAn(ziel, 'SCHWÄCHE', '#ffb03a', false, 4);
    if (ef < 1) floaterAn(ziel, 'Resistenz', '#8aa0b0', false, 4);
    burstAn(ziel, ELEMENT_COLORS[skill.element] || '#fff', krit ? 22 : 12);

    if (ziel.staggered <= 0) {
      let bp = (skill.breakPow || 6) * (multi ? 0.6 : 1);
      if (ef > 1) bp *= 1.8;
      ziel.breakVal = Math.min(ziel.breakMax, ziel.breakVal + bp);
      if (ziel.breakVal >= ziel.breakMax) {
        ziel.staggered = STAGGER_ZEIT;
        ziel.charging = null;
        ziel.atb = 0;
        floaterAn(ziel, 'ERSCHÜTTERT!', '#ff6a3a', true, -44);
        logMsg(ziel.name + ' ist erschüttert!');
      }
    }

    quelle.limit = Math.min(100, quelle.limit + wert * 0.045);

    if (ziel.hp <= 0) {
      ziel.dead = true;
      state.belohnung.exp += ziel.exp;
      state.belohnung.gold += ziel.gold;
      burstAn(ziel, '#ffffff', 30);
      entferneEinheitMesh(ziel);
      logMsg(ziel.name + ' wurde besiegt.');
    }
  }

  function triffHeld(quelle, ziel, atk) {
    const skill = { stat: 'atk', pow: atk.pow, element: atk.element };
    const { wert, krit } = schaden(quelle, ziel, skill);
    ziel.hp = Math.max(0, ziel.hp - wert);
    ziel.flash = 0.18;
    shake = Math.max(shake, 0.2);
    ziel.limit = Math.min(100, ziel.limit + wert * 0.09);
    floaterAn(ziel, String(wert) + (krit ? '!' : ''), '#ff7a6a', krit, -20);
    burstAn(ziel, ELEMENT_COLORS[atk.element] || '#fff', 10);
    if (ziel.hp <= 0) {
      ziel.dead = true;
      logMsg(ziel.name + ' ist gefallen!');
    }
  }

  /* ---------------- Aktionen (Logik wie 2D) ---------------- */

  function heldAktion(held, aktion) {
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
      if (item.heal) {
        z.hp = Math.min(z.hpMax, z.hp + item.heal);
        floaterAn(z, '+' + item.heal, '#6ae08a', false, -20);
      }
      if (item.mp) {
        z.mp = Math.min(z.mpMax, z.mp + item.mp);
        floaterAn(z, '+' + item.mp + ' MP', '#6ab0e0', false, -20);
      }
      if (item.revive && z.dead) {
        z.dead = false;
        z.liegend = false;
        z.hp = Math.round(z.hpMax * item.revive);
        z.atb = 0;
        if (z.voxel) {
          z.voxel.group.rotation.z = 0;
          z.voxel.mat.opacity = 1;
          z.voxel.mat.transparent = false;
        }
        floaterAn(z, 'WIEDERBELEBT', '#ffe98a', true, -20);
      }
      burstAn(z, '#6ae08a', 14);
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

    if (skill.target === 'party' || skill.target === 'self' || skill.target === 'ally') {
      if (skill.buff) {
        const ziele = skill.target === 'party' ? lebendeHelden() : [aktion.ziel || held];
        ziele.forEach(z => {
          z.buffs.push(Object.assign({ restZuege: skill.buff.dauer }, skill.buff));
          floaterAn(z, skill.buff.atk ? 'ANG↑' : 'VER↑', '#6ae08a', false, -24);
          burstAn(z, '#6ae08a', 10);
        });
      }
      if (skill.heal) {
        const z = aktion.ziel || held;
        const menge = Math.round(z.hpMax * skill.heal);
        z.hp = Math.min(z.hpMax, z.hp + menge);
        floaterAn(z, '+' + menge, '#6ae08a', false, -20);
        burstAn(z, '#6ae08a', 14);
      }
      logMsg(held.name + ': ' + skill.name);
      naechsterBefehl();
      return;
    }

    const ziele = skill.target === 'all-enemies' ? lebendeGegner() : [aktion.ziel];
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
        gegner.atb = 40;
        floaterAn(gegner, '⚠ ' + atk.name, '#ffb03a', true, -40);
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
    render(dt);
    if (!state.vorbei) requestAnimationFrame(loop);
  }

  function update(dt) {
    state.zeit += dt;

    state.floaters.forEach(f => f.t += dt);
    state.floaters = state.floaters.filter(f => f.t < 1.1);
    state.partikel.forEach(p => {
      p.t += dt;
      p.pos.addScaledVector(p.vel, dt);
      p.vel.y -= 9 * dt;
    });
    state.partikel = state.partikel.filter(p => p.t < p.dauer);
    state.heroes.concat(state.enemies).forEach(u => {
      if (u.flash > 0) u.flash -= dt;
    });

    if (state.anim) {
      animSchritt(dt);
      return;
    }

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
      if (a.t < 0.22) {
        held.lunge = a.t / 0.22;
      } else if (a.hitIdx < a.hits) {
        if (a.t > 0.22 + a.hitIdx * 0.16) {
          a.ziele.forEach(z => {
            if (!z.dead) triffGegner(held, z, a.skill, a.ziele.length > 1);
          });
          a.hitIdx++;
          if (callbacks.onTick) callbacks.onTick(state);
        }
        held.lunge = 1;
      } else if (a.t < 0.22 + a.hits * 0.16 + 0.25) {
        held.lunge = Math.max(0, 1 - (a.t - 0.22 - a.hits * 0.16) / 0.25);
      } else {
        held.lunge = 0;
        if (a.istLimit && a.healParty) {
          lebendeHelden().forEach(h => {
            const menge = Math.round(h.hpMax * a.healParty);
            h.hp = Math.min(h.hpMax, h.hp + menge);
            floaterAn(h, '+' + menge, '#6ae08a', false, -20);
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

  function render(dt) {
    // Einheiten positionieren (Schweben, Vorstoß, Wackeln, Gefallene)
    const ziel = state.anim && state.anim.ziele && state.anim.ziele[0];
    state.heroes.concat(state.enemies).forEach(u => {
      if (!u.voxel) return;
      const g = u.voxel.group;

      if (u.kind === 'hero' && u.dead) {
        if (!u.liegend) {
          u.liegend = true;
          g.rotation.z = Math.PI / 2;
          g.position.y = 0.15;
          u.voxel.mat.transparent = true;
          u.voxel.mat.opacity = 0.45;
        }
        return;
      }

      g.position.copy(u.home);
      g.position.y = Math.sin(state.zeit * 3 + u.home.x * 2) * 0.06;

      // Vorstoß Richtung Ziel
      if (u.lunge > 0 && state.anim) {
        const a = state.anim;
        const istAkteur = (a.held === u || a.gegner === u);
        if (istAkteur && ziel && ziel.voxel) {
          const richtung = ziel.voxel.group.position.clone().sub(u.home);
          richtung.y = 0;
          g.position.addScaledVector(richtung, u.lunge * 0.5);
        }
      }

      // Erschütterte Gegner wackeln
      if (u.staggered > 0) {
        g.position.x += Math.sin(state.zeit * 30) * 0.06;
      }

      // Treffer-Blitz
      u.voxel.mat.emissive = u.voxel.mat.emissive || new THREE.Color(0, 0, 0);
      const e = u.flash > 0 ? Math.min(1, u.flash * 6) : 0;
      u.voxel.mat.emissive.setScalar(e * 0.9);
    });

    // Kamera: leichtes Schweben + Erschütterung
    camera.position.set(
      KAM.x + Math.sin(state.zeit * 0.4) * 0.35,
      KAM.y + Math.sin(state.zeit * 0.27) * 0.15,
      KAM.z
    );
    if (shake > 0) {
      shake = Math.max(0, shake - dt * 1.4);
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
    }
    camera.lookAt(KAM.lx, KAM.ly, KAM.lz);

    renderer.render(scene, camera);

    /* ----- 2D-Overlay ----- */
    octx.clearRect(0, 0, overlay.width, overlay.height);

    // Bildschirm-Mittelpunkte für die Zielwahl
    state.heroes.concat(state.enemies).forEach(u => {
      if (!u.voxel) return;
      const s = projiziere(weltMitte(u));
      u.screenX = s.x;
      u.screenY = s.y;
    });

    // Partikel
    state.partikel.forEach(p => {
      const s = projiziere(p.pos);
      octx.globalAlpha = 1 - p.t / p.dauer;
      octx.fillStyle = p.farbe;
      octx.fillRect(s.x - 2, s.y - 2, 4, 4);
    });
    octx.globalAlpha = 1;

    // Verteidigungs-Markierung
    state.heroes.forEach(h => {
      if (!h.guard || h.dead || !h.voxel) return;
      const s = projiziere(h.voxel.group.position);
      octx.strokeStyle = 'rgba(120,190,255,0.7)';
      octx.lineWidth = 2;
      octx.beginPath();
      octx.ellipse(s.x, s.y, 34, 10, 0, 0, Math.PI * 2);
      octx.stroke();
    });

    // Gegner-Info
    lebendeGegner().forEach(e => zeichneGegnerInfo(e));

    // Schwebende Zahlen
    state.floaters.forEach(f => {
      octx.globalAlpha = Math.max(0, 1 - f.t / 1.1);
      octx.font = (f.gross ? 'bold 26px' : 'bold 18px') + ' "Courier New", monospace';
      octx.textAlign = 'center';
      octx.fillStyle = '#000';
      octx.fillText(f.text, f.x + 2, f.y - f.t * 40 + 2);
      octx.fillStyle = f.farbe;
      octx.fillText(f.text, f.x, f.y - f.t * 40);
    });
    octx.globalAlpha = 1;

    if (callbacks.onRender) callbacks.onRender(state);
  }

  function zeichneGegnerInfo(e) {
    if (!e.voxel) return;
    const kopf = e.voxel.group.position.clone();
    kopf.y += e.voxel.hoehe + 0.5;
    const s = projiziere(kopf);
    const bw = e.boss ? 130 : 90;

    octx.textAlign = 'center';
    octx.font = 'bold 12px "Courier New", monospace';
    octx.fillStyle = '#000';
    octx.fillText(e.name, s.x + 1, s.y - 9);
    octx.fillStyle = e.boss ? '#ffd44a' : '#f0f0f0';
    octx.fillText(e.name, s.x, s.y - 10);

    octx.fillStyle = 'rgba(0,0,0,0.6)';
    octx.fillRect(s.x - bw / 2, s.y, bw, 6);
    octx.fillStyle = e.hp / e.hpMax > 0.35 ? '#5ad06a' : '#e05a4a';
    octx.fillRect(s.x - bw / 2, s.y, bw * (e.hp / e.hpMax), 6);

    octx.fillStyle = 'rgba(0,0,0,0.6)';
    octx.fillRect(s.x - bw / 2, s.y + 8, bw, 4);
    if (e.staggered > 0) {
      octx.fillStyle = '#ff6a3a';
      octx.fillRect(s.x - bw / 2, s.y + 8, bw * (e.staggered / STAGGER_ZEIT), 4);
    } else {
      octx.fillStyle = '#ffb03a';
      octx.fillRect(s.x - bw / 2, s.y + 8, bw * (e.breakVal / e.breakMax), 4);
    }

    if (e.charging) {
      octx.fillStyle = '#ffb03a';
      octx.font = 'bold 11px "Courier New", monospace';
      octx.fillText('⚠ lädt auf', s.x, s.y + 24);
    }
  }

  /* ---------------- API ---------------- */

  function stop() {
    if (state) {
      state.heroes.concat(state.enemies).forEach(entferneEinheitMesh);
    }
    state = null;
    if (octx) octx.clearRect(0, 0, overlay.width, overlay.height);
  }

  return {
    start, stop, befehlAusfuehren,
    get state() { return state; }
  };
})();
