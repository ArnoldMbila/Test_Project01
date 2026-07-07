/* =========================================================
 * EWIGE KRISE — Spielsteuerung & UI
 * Bildschirme: Titel → Gruppe → Kapitel → Kampf → Ergebnis
 * ========================================================= */

(() => {
  const $ = sel => document.querySelector(sel);
  const canvas = $('#spielfeld');

  /* ---------------- Speicherstand ---------------- */

  const SAVE_KEY = 'ewige-krise-save-v1';

  function neuerSpielstand() {
    const levels = {}, exp = {};
    HERO_ORDER.forEach(id => { levels[id] = 1; exp[id] = 0; });
    return {
      levels, exp, gold: 0,
      freigeschaltet: 1,             // Anzahl spielbarer Kapitel
      items: { trank: 4, aether: 2, elixier: 1 }
    };
  }

  function ladeSpielstand() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(neuerSpielstand(), JSON.parse(raw));
    } catch (e) { /* defekter Spielstand -> neu */ }
    return neuerSpielstand();
  }

  function speichere() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(spielstand));
  }

  let spielstand = ladeSpielstand();
  let gewaehlteGruppe = ['aurel', 'seraph', 'malik'];
  let gewaehltesKapitel = 0;

  /* ---------------- Bildschirm-Wechsel ---------------- */

  function zeige(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('aktiv'));
    $(id).classList.add('aktiv');
  }

  /* ---------------- Titel ---------------- */

  $('#btn-start').addEventListener('click', () => baueGruppenwahl());
  $('#btn-reset').addEventListener('click', () => {
    if (confirm('Spielstand wirklich löschen?')) {
      spielstand = neuerSpielstand();
      speichere();
      alert('Spielstand zurückgesetzt.');
    }
  });

  // Held-Parade auf dem Titel
  function titelParade() {
    const wrap = $('#titel-parade');
    wrap.innerHTML = '';
    HERO_ORDER.forEach(id => {
      const spr = SpriteFactory.get(id, 4);
      const c = document.createElement('canvas');
      c.width = spr.w; c.height = spr.h;
      c.getContext('2d').drawImage(spr.base, 0, 0);
      c.className = 'parade-sprite';
      wrap.appendChild(c);
    });
  }

  /* ---------------- Gruppenwahl ---------------- */

  function baueGruppenwahl() {
    zeige('#screen-gruppe');
    const wrap = $('#helden-liste');
    wrap.innerHTML = '';
    HERO_ORDER.forEach(id => {
      const h = HEROES[id];
      const lvl = spielstand.levels[id];
      const s = heroStatsAt(id, lvl);
      const karte = document.createElement('div');
      karte.className = 'held-karte' + (gewaehlteGruppe.includes(id) ? ' gewaehlt' : '');
      const spr = SpriteFactory.get(id, 4);
      const c = document.createElement('canvas');
      c.width = spr.w; c.height = spr.h;
      c.getContext('2d').drawImage(spr.base, 0, 0);
      karte.appendChild(c);
      const info = document.createElement('div');
      info.className = 'held-info';
      info.innerHTML =
        '<b>' + h.name + '</b> <span class="rolle">' + h.rolle + '</span>' +
        '<div class="lvl">Lv. ' + lvl + '</div>' +
        '<div class="stats">LP ' + s.hp + ' · MP ' + s.mp + ' · ANG ' + s.atk +
        ' · MAG ' + s.mag + ' · VER ' + s.def + ' · TEM ' + s.spd + '</div>' +
        '<div class="besch">' + h.beschreibung + '</div>';
      karte.appendChild(info);
      karte.addEventListener('click', () => {
        if (gewaehlteGruppe.includes(id)) {
          if (gewaehlteGruppe.length > 1) {
            gewaehlteGruppe = gewaehlteGruppe.filter(x => x !== id);
          }
        } else if (gewaehlteGruppe.length < 3) {
          gewaehlteGruppe.push(id);
        }
        baueGruppenwahl();
      });
      wrap.appendChild(karte);
    });
    $('#gruppe-anzahl').textContent = gewaehlteGruppe.length + ' / 3 gewählt';
    $('#btn-weiter-kapitel').disabled = gewaehlteGruppe.length !== 3;
  }

  $('#btn-weiter-kapitel').addEventListener('click', () => baueKapitelwahl());
  $('#btn-zurueck-titel').addEventListener('click', () => zeige('#screen-titel'));

  /* ---------------- Kapitelwahl ---------------- */

  function baueKapitelwahl() {
    zeige('#screen-kapitel');
    $('#gold-anzeige').textContent = spielstand.gold + ' Gold';
    const wrap = $('#kapitel-liste');
    wrap.innerHTML = '';
    CHAPTERS.forEach((ch, i) => {
      const frei = i < spielstand.freigeschaltet;
      const el = document.createElement('button');
      el.className = 'kapitel-karte' + (frei ? '' : ' gesperrt');
      el.disabled = !frei;
      const bossId = ch.waves[ch.waves.length - 1][0];
      el.innerHTML =
        '<b>' + ch.name + '</b><br><span>' + ch.ort + '</span><br>' +
        '<span class="boss-hinweis">Boss: ' + (frei ? ENEMIES[bossId].name : '???') + '</span>';
      el.addEventListener('click', () => {
        gewaehltesKapitel = i;
        starteKampf();
      });
      wrap.appendChild(el);
    });
  }

  $('#btn-zurueck-gruppe').addEventListener('click', () => baueGruppenwahl());

  /* ---------------- Kampf ---------------- */

  let aktuellerHeld = null;

  function starteKampf() {
    zeige('#screen-kampf');
    $('#befehle').classList.add('versteckt');
    $('#submenu').classList.add('versteckt');
    Battle.start({
      canvas,
      chapterIdx: gewaehltesKapitel,
      party: gewaehlteGruppe.slice(),
      levels: spielstand.levels,
      items: spielstand.items,
      callbacks: {
        onCommand: zeigeBefehle,
        onCommandDone: () => {
          $('#befehle').classList.add('versteckt');
          $('#submenu').classList.add('versteckt');
        },
        onLog: zeigeLog,
        onRender: zeichneHeldenHud,
        onEnd: kampfEnde
      }
    });
  }

  function zeigeLog(zeilen) {
    $('#kampf-log').innerHTML = zeilen.map(z => '<div>' + z + '</div>').join('');
  }

  function zeichneHeldenHud(state) {
    const wrap = $('#helden-hud');
    // HUD nur neu bauen, wenn nötig — sonst Werte aktualisieren
    if (wrap.children.length !== state.heroes.length) {
      wrap.innerHTML = '';
      state.heroes.forEach(() => {
        const box = document.createElement('div');
        box.className = 'hud-held';
        box.innerHTML =
          '<div class="hud-name"></div>' +
          '<div class="hud-balken lp"><div></div></div>' +
          '<div class="hud-balken mp"><div></div></div>' +
          '<div class="hud-balken atb"><div></div></div>' +
          '<div class="hud-balken limit"><div></div></div>' +
          '<div class="hud-zahlen"></div>';
        wrap.appendChild(box);
      });
    }
    state.heroes.forEach((h, i) => {
      const box = wrap.children[i];
      box.classList.toggle('tot', h.dead);
      box.classList.toggle('dran', state.queue[0] === h && state.menuOffen);
      box.querySelector('.hud-name').textContent = h.name;
      box.querySelector('.lp > div').style.width = (100 * h.hp / h.hpMax) + '%';
      box.querySelector('.mp > div').style.width = (100 * h.mp / h.mpMax) + '%';
      box.querySelector('.atb > div').style.width = h.atb + '%';
      const lim = box.querySelector('.limit > div');
      lim.style.width = h.limit + '%';
      lim.classList.toggle('voll', h.limit >= 100);
      box.querySelector('.hud-zahlen').textContent =
        'LP ' + h.hp + '/' + h.hpMax + '  MP ' + h.mp;
    });
  }

  function zeigeBefehle(held) {
    aktuellerHeld = held;
    $('#submenu').classList.add('versteckt');
    const wrap = $('#befehle');
    wrap.classList.remove('versteckt');
    $('#befehl-name').textContent = held.name;
    const liste = $('#befehl-liste');
    liste.innerHTML = '';

    knopf(liste, '⚔ Angriff', '', () => waehleZiel('enemy',
      ziel => Battle.befehlAusfuehren({ typ: 'angriff', ziel })));

    knopf(liste, '✦ Fähigkeiten', '', () => zeigeSkills(held));

    const limitKnopf = knopf(liste, '✸ LIMIT — ' + LIMITS[held.id].name, '', () => {
      const lim = LIMITS[held.id];
      if (lim.target === 'enemy') {
        waehleZiel('enemy', ziel => Battle.befehlAusfuehren({ typ: 'limit', ziel }));
      } else {
        Battle.befehlAusfuehren({ typ: 'limit' });
      }
    });
    limitKnopf.classList.add('limit-knopf');
    limitKnopf.disabled = held.limit < 100;

    knopf(liste, '🎒 Items', '', () => zeigeItems());
    knopf(liste, '🛡 Verteidigen', '', () =>
      Battle.befehlAusfuehren({ typ: 'verteidigen' }));
  }

  function knopf(parent, text, klasse, onClick) {
    const b = document.createElement('button');
    b.className = 'befehl-knopf ' + klasse;
    b.textContent = text;
    b.addEventListener('click', onClick);
    parent.appendChild(b);
    return b;
  }

  function zeigeSkills(held) {
    const sub = $('#submenu');
    sub.classList.remove('versteckt');
    sub.innerHTML = '';
    held.skills.forEach(sid => {
      const sk = SKILLS[sid];
      const b = document.createElement('button');
      b.className = 'befehl-knopf';
      b.innerHTML = sk.name + ' <span class="mp-kosten">' + sk.mp + ' MP</span>' +
        '<div class="skill-desc">' + sk.desc + '</div>';
      b.disabled = held.mp < sk.mp;
      b.addEventListener('click', () => {
        if (sk.target === 'enemy') {
          waehleZiel('enemy', ziel =>
            Battle.befehlAusfuehren({ typ: 'skill', skillId: sid, ziel }));
        } else if (sk.target === 'ally') {
          waehleZiel('ally', ziel =>
            Battle.befehlAusfuehren({ typ: 'skill', skillId: sid, ziel }));
        } else {
          Battle.befehlAusfuehren({ typ: 'skill', skillId: sid });
        }
      });
      sub.appendChild(b);
    });
    zurueckKnopf(sub);
  }

  function zeigeItems() {
    const sub = $('#submenu');
    sub.classList.remove('versteckt');
    sub.innerHTML = '';
    const items = Battle.state.items;
    Object.keys(ITEMS).forEach(iid => {
      const item = ITEMS[iid];
      const anzahl = items[iid] || 0;
      const b = document.createElement('button');
      b.className = 'befehl-knopf';
      b.innerHTML = item.name + ' <span class="mp-kosten">×' + anzahl + '</span>' +
        '<div class="skill-desc">' + item.desc + '</div>';
      b.disabled = anzahl <= 0;
      b.addEventListener('click', () => {
        waehleZiel(item.revive ? 'gefallen' : 'ally', ziel =>
          Battle.befehlAusfuehren({ typ: 'item', itemId: iid, ziel }));
      });
      sub.appendChild(b);
    });
    zurueckKnopf(sub);
  }

  function zurueckKnopf(sub) {
    const b = document.createElement('button');
    b.className = 'befehl-knopf zurueck';
    b.textContent = '← Zurück';
    b.addEventListener('click', () => sub.classList.add('versteckt'));
    sub.appendChild(b);
  }

  /* Zielwahl per Klick auf die Zeichenfläche */

  let zielModus = null;

  function waehleZiel(art, cb) {
    const state = Battle.state;
    let kandidaten;
    if (art === 'enemy') kandidaten = state.enemies.filter(e => !e.dead);
    else if (art === 'gefallen') kandidaten = state.heroes.filter(h => h.dead);
    else kandidaten = state.heroes.filter(h => !h.dead);

    if (!kandidaten.length) return;
    if (kandidaten.length === 1) { cb(kandidaten[0]); return; }

    zielModus = { kandidaten, cb };
    $('#ziel-hinweis').classList.remove('versteckt');
  }

  canvas.addEventListener('click', ev => {
    if (!zielModus) return;
    const r = canvas.getBoundingClientRect();
    const mx = (ev.clientX - r.left) * (canvas.width / r.width);
    const my = (ev.clientY - r.top) * (canvas.height / r.height);
    let bester = null, bDist = 1e9;
    zielModus.kandidaten.forEach(u => {
      const spr = SpriteFactory.get(u.sprite, u.scale);
      const cx = u.homeX + spr.w / 2, cy = u.homeY + spr.h / 2;
      const d = Math.hypot(mx - cx, my - cy);
      if (d < bDist) { bDist = d; bester = u; }
    });
    const cb = zielModus.cb;
    zielModus = null;
    $('#ziel-hinweis').classList.add('versteckt');
    if (bester) cb(bester);
  });

  $('#btn-flucht').addEventListener('click', () => {
    if (confirm('Kampf abbrechen und zur Kapitelwahl zurückkehren?')) {
      Battle.stop();
      baueKapitelwahl();
    }
  });

  /* ---------------- Kampf-Ende ---------------- */

  function kampfEnde(sieg, belohnung, state) {
    // Verbrauchte Items zurückschreiben
    spielstand.items = state.items;

    zeige('#screen-ergebnis');
    const kopf = $('#ergebnis-kopf');
    const inhalt = $('#ergebnis-inhalt');

    if (sieg) {
      kopf.textContent = '✦ SIEG ✦';
      kopf.className = 'sieg';
      spielstand.gold += belohnung.gold;
      if (gewaehltesKapitel + 1 === spielstand.freigeschaltet &&
          spielstand.freigeschaltet < CHAPTERS.length) {
        spielstand.freigeschaltet++;
      }
      // Belohnungs-Items
      spielstand.items.trank = (spielstand.items.trank || 0) + 2;
      if (gewaehltesKapitel >= 1) {
        spielstand.items.aether = (spielstand.items.aether || 0) + 1;
      }

      let html = '<p>' + belohnung.exp + ' EP · ' + belohnung.gold +
        ' Gold · 2× Trank' + (gewaehltesKapitel >= 1 ? ' · 1× Äther' : '') + '</p><ul>';
      gewaehlteGruppe.forEach(id => {
        spielstand.exp[id] += belohnung.exp;
        let aufstieg = 0;
        while (spielstand.exp[id] >= expForLevel(spielstand.levels[id])) {
          spielstand.exp[id] -= expForLevel(spielstand.levels[id]);
          spielstand.levels[id]++;
          aufstieg++;
        }
        html += '<li>' + HEROES[id].name + ' — Lv. ' + spielstand.levels[id] +
          (aufstieg ? ' <b class="aufstieg">▲ +' + aufstieg + '</b>' : '') + '</li>';
      });
      html += '</ul>';
      if (gewaehltesKapitel + 1 < CHAPTERS.length &&
          spielstand.freigeschaltet > gewaehltesKapitel + 1) {
        html += '<p class="frei">Neues Kapitel freigeschaltet!</p>';
      }
      if (gewaehltesKapitel === CHAPTERS.length - 1) {
        html += '<p class="frei">Der Drache ist gefallen. Die Krise ist — vorerst — vorbei. Danke fürs Spielen!</p>';
      }
      inhalt.innerHTML = html;
    } else {
      kopf.textContent = 'NIEDERLAGE';
      kopf.className = 'niederlage';
      inhalt.innerHTML = '<p>Die Gruppe ist gefallen. Steig im Level auf oder wähle eine andere Aufstellung.</p>';
    }
    speichere();
  }

  $('#btn-nochmal').addEventListener('click', () => starteKampf());
  $('#btn-zur-kapitelwahl').addEventListener('click', () => baueKapitelwahl());

  /* ---------------- Start ---------------- */

  titelParade();
  zeige('#screen-titel');
})();
