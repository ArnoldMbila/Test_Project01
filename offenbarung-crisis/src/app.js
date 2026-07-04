/* ============================================================
   APOKALYPSIS CRISIS – Spiellogik
   Lernspiel zur Offenbarung (Kap. 1–22), Elberfelder 1905.
   FF7-Ever-Crisis-INSPIRIERT (Original-Code, keine fremden Assets):
   Missionen, ATB-Bonus, Limit-Leiste, EXP/Level, Boss-Kämpfe.
   ============================================================ */
(function () {
  "use strict";

  var DB = window.QUEST_DB;
  var app = document.getElementById("app");
  var BIBLE = null;          // { kapitel: [verstexte] } – Elberfelder 1905
  var BIBLE_STATUS = "lädt"; // lädt | ok | fehlt

  /* ---------------- Speicherstand ---------------- */
  var SAVE_KEY = "apokalypsis_crisis_save_v1";
  var BIBLE_KEY = "apokalypsis_crisis_bibel_v1";

  var save = loadSave();

  function defaultSave() {
    return {
      xp: 0, manna: 0,
      ch: {},            // n -> { stars: 0..3, boss: false }
      wrong: [],         // ["kap:qIndex"] – Fragen für das Wiederholungs-Training
      lastDay: "", streak: 0,
    };
  }
  function loadSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(defaultSave(), JSON.parse(raw));
    } catch (e) { /* zerstörter Speicherstand -> neu */ }
    return defaultSave();
  }
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* voll/privat */ }
  }
  function chState(n) {
    if (!save.ch[n]) save.ch[n] = { stars: 0, boss: false };
    return save.ch[n];
  }
  function isUnlocked(n) {
    if (n === 1) return true;
    return chState(n - 1).boss;
  }

  /* ---------------- Level / EXP ---------------- */
  function xpNeed(level) { return Math.round(80 * Math.pow(level, 1.45)); }
  function levelInfo() {
    var lvl = 1, rest = save.xp;
    while (rest >= xpNeed(lvl) && lvl < 99) { rest -= xpNeed(lvl); lvl++; }
    return { lvl: lvl, into: rest, need: xpNeed(lvl) };
  }

  /* ---------------- Tagesserie ---------------- */
  function touchStreak() {
    var today = new Date().toISOString().slice(0, 10);
    if (save.lastDay === today) return;
    var y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    save.streak = (save.lastDay === y) ? save.streak + 1 : 1;
    save.lastDay = today;
    persist();
    toast("Tagesserie: " + save.streak + " ✦ (+" + (10 * save.streak) + " Manna)");
    save.manna += 10 * save.streak;
  }

  /* ---------------- Bibeltext (Elberfelder 1905, gemeinfrei) ---------------- */
  function normalizeBible(json) {
    var out = {};
    var chapters = json && json.chapters;
    if (!chapters) return null;
    var list = Array.isArray(chapters) ? chapters : Object.keys(chapters).map(function (k) { return chapters[k]; });
    list.forEach(function (ch) {
      var num = ch.chapter || ch.chapter_nr;
      var verses = ch.verses;
      if (!num || !verses) return;
      var vlist = Array.isArray(verses) ? verses : Object.keys(verses).map(function (k) { return verses[k]; });
      out[num] = vlist.map(function (v) { return String(v.text || v.verse_text || "").trim(); });
    });
    return Object.keys(out).length === 22 ? out : (Object.keys(out).length ? out : null);
  }

  function loadBible(done) {
    if (window.BIBEL_OFFB) { BIBLE = window.BIBEL_OFFB; BIBLE_STATUS = "ok"; done(); return; }
    try {
      var cached = localStorage.getItem(BIBLE_KEY);
      if (cached) { BIBLE = JSON.parse(cached); BIBLE_STATUS = "ok"; done(); return; }
    } catch (e) { /* weiter zum Netz */ }
    var urls = [
      "https://api.getbible.net/v2/elberfelder1905/66.json",
      "https://api.getbible.net/v2/elberfelder/66.json",
    ];
    var i = 0;
    (function next() {
      if (i >= urls.length) { BIBLE_STATUS = "fehlt"; done(); return; }
      fetch(urls[i++])
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) {
          var norm = normalizeBible(j);
          if (!norm) throw new Error("Format");
          BIBLE = norm; BIBLE_STATUS = "ok";
          try { localStorage.setItem(BIBLE_KEY, JSON.stringify(norm)); } catch (e) { /* Cache optional */ }
          done();
        })
        .catch(next);
    })();
  }

  function chapterText(n) { return (BIBLE && BIBLE[n]) ? BIBLE[n] : null; }

  /* ---------------- Hilfsfunktionen ---------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.add("hidden"); }, 2600);
  }
  function hudHtml() {
    var li = levelInfo();
    return '<div class="win hud">' +
      '<span class="lv">LV ' + li.lvl + "</span>" +
      '<div class="xpwrap"><div class="barlabel"><span>EXP</span><span>' + li.into + " / " + li.need + '</span></div>' +
      '<div class="bar"><i style="width:' + Math.min(100, (100 * li.into / li.need)).toFixed(1) + '%"></i></div></div>' +
      '<span class="manna">✦ ' + save.manna + " Manna</span>" +
      (save.streak > 1 ? '<span class="tag">🔥' + save.streak + "</span>" : "") +
      "</div>";
  }

  /* ---------------- Cloze- & Puzzle-Generator (aus dem Bibeltext) ---------------- */
  var STOP = ["und","der","die","das","des","dem","den","ein","eine","einem","einen","einer","ich","du","er","sie","es","wir","ihr","ist","war","sind","waren","wird","werden","hat","hatte","haben","auf","aus","bei","mit","nach","von","vor","zu","zum","zur","in","im","an","am","als","also","aber","auch","denn","doch","wie","was","wer","wen","dass","daß","nicht","noch","nur","so","da","dann","dir","dich","mir","mich","sich","sein","seine","seinem","seinen","seiner","ihr","ihre","ihrem","ihren","ihrer","uns","euch","welche","welcher","welches","siehe","spricht","sprach","sagt","sagte","über","unter","wurde","wurden","durch","für","o"];

  function words(text) {
    return text.split(/\s+/).filter(function (w) { return w.length > 0; });
  }
  function coreOf(w) { return w.replace(/^[^A-Za-zÄÖÜäöüß]+|[^A-Za-zÄÖÜäöüß]+$/g, ""); }
  function isGood(w) {
    var c = coreOf(w);
    return c.length >= 5 && STOP.indexOf(c.toLowerCase()) === -1;
  }

  function makeClozeItem(n, verseIdx) {
    var vt = chapterText(n);
    if (!vt || !vt[verseIdx]) return null;
    var text = vt[verseIdx];
    var ws = words(text);
    var candidates = [];
    ws.forEach(function (w, i) { if (isGood(w)) candidates.push(i); });
    if (!candidates.length) return null;
    var idx = pick(candidates);
    var answer = coreOf(ws[idx]);
    // Distraktoren: andere markante Wörter aus dem ganzen Kapitel
    var pool = {};
    vt.forEach(function (v) {
      words(v).forEach(function (w) {
        var c = coreOf(w);
        if (isGood(w) && c.toLowerCase() !== answer.toLowerCase()) pool[c] = true;
      });
    });
    var distract = shuffle(Object.keys(pool)).slice(0, 3);
    if (distract.length < 3) return null;
    var gap = ws.slice();
    gap[idx] = ws[idx].replace(coreOf(ws[idx]), "▁▁▁▁▁");
    return {
      kind: "cloze",
      t: "Offb " + n + "," + (verseIdx + 1) + " – welches Wort fehlt?\n„" + gap.join(" ") + "“",
      o: [answer].concat(distract), a: 0,
      e: "Offb " + n + "," + (verseIdx + 1) + ": „" + text + "“",
    };
  }

  function makeOrderItem(n, verseIdx) {
    var vt = chapterText(n);
    if (!vt || !vt[verseIdx]) return null;
    var ws = words(vt[verseIdx]);
    if (ws.length < 8) return null;
    var parts = 4;
    var per = Math.ceil(ws.length / parts), chunks = [];
    for (var i = 0; i < ws.length; i += per) chunks.push(ws.slice(i, i + per).join(" "));
    if (chunks.length < 3) return null;
    return { kind: "order", ref: "Offb " + n + "," + (verseIdx + 1), chunks: chunks, full: vt[verseIdx] };
  }

  function verseIndicesFor(n, count) {
    var meta = DB[n - 1];
    var vt = chapterText(n) || [];
    var idxs = [];
    (meta.key || []).forEach(function (v) { if (vt[v - 1]) idxs.push(v - 1); });
    var i = 0;
    while (idxs.length < count && i < vt.length) {
      if (idxs.indexOf(i) === -1 && words(vt[i]).length >= 6) idxs.push(i);
      i++;
    }
    return shuffle(idxs).slice(0, count);
  }

  /* ---------------- Screens ---------------- */
  function show(html) { app.innerHTML = html; app.scrollTop = 0; }

  /* --- Titel --- */
  function screenTitle() {
    show(
      '<div class="title-screen">' +
      '<div class="win" style="padding:26px 16px">' +
      '<div class="tag">EIN LERNSPIEL · OFFENBARUNG 1–22</div>' +
      '<h1 class="title-logo">APOKALYPSIS<br>CRISIS</h1>' +
      '<div class="title-sub">— Elberfelder Übersetzung (1905) —</div>' +
      "</div>" +
      '<button class="btn center" id="bStart">▶ ' + (save.xp > 0 ? "Weiterspielen" : "Neues Spiel") + "</button>" +
      (save.xp > 0 ? '<button class="btn center small" id="bReset">Speicherstand löschen</button>' : "") +
      '<div class="title-note">Inspiriert vom Missions-Stil japanischer Rollenspiele.<br>' +
      "Eigenständiges Fan-Lernprojekt ohne fremde Spiel-Assets.<br>" +
      "Bibeltext: unrevidierte Elberfelder 1905 (gemeinfrei)" +
      (BIBLE_STATUS === "fehlt" ? "<br>⚠ Bibeltext offline nicht verfügbar – Lese-/Vers-Modi brauchen einmalig Internet." : "") +
      "</div></div>"
    );
    document.getElementById("bStart").onclick = function () { touchStreak(); screenMap(); };
    var r = document.getElementById("bReset");
    if (r) r.onclick = function () {
      if (confirm("Wirklich den gesamten Fortschritt löschen?")) {
        save = defaultSave(); persist(); screenTitle();
      }
    };
  }

  /* --- Missionskarte --- */
  function screenMap() {
    var rows = DB.map(function (c) {
      var st = chState(c.n), open = isUnlocked(c.n);
      var stars = "★★★".slice(0, st.stars) + "☆☆☆".slice(0, 3 - st.stars);
      return '<div class="win mission ' + (open ? (st.boss ? "done" : "") : "locked") + '" data-n="' + c.n + '">' +
        '<div class="num">' + (open ? c.n : "🔒") + "</div>" +
        '<div class="m-info"><div class="m-title">' + esc(c.title) + "</div>" +
        '<div class="m-sub">Offenbarung ' + c.n + " · " + c.q.length + " Fragen" + (st.boss ? " · Boss besiegt" : "") + "</div></div>" +
        '<div class="stars">' + stars + "</div></div>";
    }).join("");
    var wrongCount = save.wrong.length;
    show(
      hudHtml() +
      '<div class="win"><h2>📜 Missionen: Die 22 Kapitel</h2>' +
      '<div class="muted">Besiege den Boss eines Kapitels, um das nächste freizuschalten.</div></div>' +
      '<button class="btn gold center" id="bDaily">🗡️ Tägliches Training' +
      (wrongCount ? " (" + wrongCount + " offene Fragen)" : "") + "</button>" +
      '<div class="map-list">' + rows + "</div>" +
      '<div class="backrow"><button class="btn small center" id="bTitle">◀ Titel</button></div>'
    );
    Array.prototype.forEach.call(app.querySelectorAll(".mission"), function (el) {
      var n = +el.getAttribute("data-n");
      if (isUnlocked(n)) el.onclick = function () { screenChapter(n); };
    });
    document.getElementById("bDaily").onclick = startDaily;
    document.getElementById("bTitle").onclick = screenTitle;
  }

  /* --- Kapitelmenü --- */
  function screenChapter(n) {
    var c = DB[n - 1], st = chState(n);
    var hasText = !!chapterText(n);
    show(
      hudHtml() +
      '<div class="win"><div class="tag">MISSION ' + n + "</div>" +
      "<h2>" + esc(c.title) + "</h2>" +
      '<div class="muted">Offenbarung Kapitel ' + n + " · Sterne: " +
      "★★★".slice(0, st.stars) + "☆☆☆".slice(0, 3 - st.stars) +
      (st.boss ? " · ✅ Boss besiegt" : "") + "</div></div>" +
      '<button class="btn" id="bRead">📖 Kapitel lesen (Elberfelder 1905)' + (hasText ? "" : " – Text lädt/fehlt") + "</button>" +
      '<button class="btn" id="bQuiz">⚔️ Quiz-Kampf (' + c.q.length + " Fragen)</button>" +
      '<button class="btn" id="bCloze">🧩 Vers-Training (Lückentext)' + (hasText ? "" : " – braucht Bibeltext") + "</button>" +
      '<button class="btn" id="bOrder">🔀 Vers-Puzzle (Reihenfolge)' + (hasText ? "" : " – braucht Bibeltext") + "</button>" +
      '<button class="btn gold" id="bBoss">👑 BOSS: ' + esc(c.boss) + "</button>" +
      '<div class="backrow"><button class="btn small center" id="bBack">◀ Missionen</button></div>'
    );
    document.getElementById("bBack").onclick = screenMap;
    document.getElementById("bRead").onclick = function () { screenRead(n); };
    document.getElementById("bQuiz").onclick = function () { startQuiz(n, false); };
    document.getElementById("bCloze").onclick = function () { startCloze(n); };
    document.getElementById("bOrder").onclick = function () { startOrder(n); };
    document.getElementById("bBoss").onclick = function () { startQuiz(n, true); };
  }

  /* --- Lesemodus --- */
  function screenRead(n) {
    var c = DB[n - 1], vt = chapterText(n);
    var body;
    if (!vt) {
      body = '<div class="muted">Der Bibeltext ist noch nicht geladen.<br>' +
        (BIBLE_STATUS === "lädt" ? "Er wird gerade geladen – gleich noch einmal öffnen." :
          "Bitte einmal mit Internetverbindung öffnen (der Text wird dann dauerhaft gespeichert) " +
          "oder mit <code>tools/fetch_bibeltext.mjs</code> fest einbetten.") + "</div>";
    } else {
      body = vt.map(function (t, i) {
        var key = (c.key || []).indexOf(i + 1) !== -1;
        return '<p class="' + (key ? "key" : "") + '"><sup>' + (i + 1) + "</sup>" + esc(t) + "</p>";
      }).join("");
    }
    show(
      hudHtml() +
      '<div class="win"><div class="tag">OFFENBARUNG ' + n + "</div><h2>" + esc(c.title) + "</h2>" +
      '<div class="muted">Goldene Verse = Schlüsselverse zum Auswendiglernen.</div></div>' +
      '<div class="win read-body">' + body + "</div>" +
      '<div class="backrow"><button class="btn small center" id="bBack">◀ Zurück</button></div>'
    );
    document.getElementById("bBack").onclick = function () { screenChapter(n); };
  }

  /* ---------------- Kampf-Engine ---------------- */
  var battle = null;

  function startBattle(cfg) {
    var li = levelInfo();
    battle = {
      cfg: cfg,
      items: cfg.items,
      i: 0,
      pHp: 100 + li.lvl * 5, pMax: 100 + li.lvl * 5,
      eHp: cfg.items.length * (cfg.boss ? 95 : 85),
      eMax: cfg.items.length * (cfg.boss ? 95 : 85),
      limit: 0, combo: 0,
      correct: 0, wrongIds: [],
      xpGain: 0, t0: 0, timer: null,
    };
    renderBattle();
  }

  function renderBattle() {
    var b = battle, item = b.items[b.i];
    var pctE = Math.max(0, 100 * b.eHp / b.eMax);
    var pctP = Math.max(0, 100 * b.pHp / b.pMax);
    var hpClass = pctP < 30 ? "low" : (pctP < 60 ? "mid" : "");
    var head =
      '<div class="enemy-zone" id="ezone">' +
      '<div class="enemy-name">' + esc(b.cfg.enemyName) + "</div>" +
      '<span class="enemy-sprite" id="esprite">' + b.cfg.emoji + "</span>" +
      '<div class="barlabel"><span>GEGNER</span><span>' + Math.max(0, Math.round(b.eHp)) + " HP</span></div>" +
      '<div class="bar hp"><i style="width:' + pctE + '%"></i></div>' +
      "</div>";
    var party =
      '<div class="win party"><div class="p-name">🛡️ Du · LV ' + levelInfo().lvl + "</div>" +
      '<div class="p-bars">' +
      '<div><div class="barlabel"><span>HP</span><span>' + Math.max(0, Math.round(b.pHp)) + "/" + b.pMax + '</span></div>' +
      '<div class="bar hp ' + hpClass + '"><i style="width:' + pctP + '%"></i></div></div>' +
      '<div><div class="barlabel"><span>LIMIT</span><span>' + Math.min(100, b.limit) + '%</span></div>' +
      '<div class="bar limit"><i style="width:' + Math.min(100, b.limit) + '%"></i></div></div>' +
      "</div></div>";
    var atb = '<div class="barlabel"><span>ATB-BONUS</span><span id="atbLbl"></span></div>' +
      '<div class="bar atb"><i id="atbBar" style="width:100%"></i></div>';

    var qhtml;
    if (item.kind === "order") {
      qhtml = orderHtml(item);
    } else {
      var meta = '<div class="q-meta"><span>' + (b.i + 1) + " / " + b.items.length + "</span><span>" +
        (b.combo > 1 ? "COMBO ×" + b.combo : "") + "</span></div>";
      var opts = item._shuffled.map(function (o, k) {
        return '<button class="btn opt" data-k="' + k + '">' + esc(o) + "</button>";
      }).join("");
      qhtml = '<div class="win">' + meta +
        '<div class="q-text">' + esc(item.t).replace(/\n/g, "<br>") + "</div>" + atb + "</div>" +
        '<div id="opts">' + opts + "</div>" +
        '<div id="explain"></div>';
    }

    show('<div class="battle">' + head + party + qhtml + "</div>");

    if (item.kind === "order") bindOrder(item);
    else bindQuiz(item);
    startAtb();
  }

  function startAtb() {
    var b = battle;
    b.t0 = Date.now();
    clearInterval(b.timer);
    var bar = document.getElementById("atbBar");
    b.timer = setInterval(function () {
      var left = Math.max(0, 1 - (Date.now() - b.t0) / 15000);
      if (bar) bar.style.width = (left * 100).toFixed(1) + "%";
      if (left <= 0) clearInterval(b.timer);
    }, 120);
  }
  function atbFactor() {
    var left = Math.max(0, 1 - (Date.now() - battle.t0) / 15000);
    return left > 0.5 ? 1.5 : (left > 0.15 ? 1.15 : 1);
  }

  function popDmg(txt, cls) {
    var z = document.getElementById("ezone");
    if (!z) return;
    var d = document.createElement("div");
    d.className = "dmg-pop " + (cls || "");
    d.textContent = txt;
    z.appendChild(d);
    setTimeout(function () { d.remove(); }, 900);
  }

  function bindQuiz(item) {
    var b = battle;
    Array.prototype.forEach.call(app.querySelectorAll(".opt"), function (btn) {
      btn.onclick = function () {
        clearInterval(b.timer);
        var k = +btn.getAttribute("data-k");
        var right = k === item._answer;
        Array.prototype.forEach.call(app.querySelectorAll(".opt"), function (o, idx) {
          o.disabled = true;
          if (idx === item._answer) o.classList.add("correct");
        });
        if (right) {
          resolveHit(btn);
        } else {
          btn.classList.add("wrong");
          resolveMiss(item);
        }
      };
    });
  }

  function resolveHit(btn) {
    var b = battle;
    b.combo++; b.correct++;
    var limitReady = b.limit >= 100;
    var dmg = Math.round((70 + Math.random() * 20 + b.combo * 6) * atbFactor() * (limitReady ? 2 : 1));
    if (limitReady) b.limit = 0; else b.limit = Math.min(100, b.limit + 25);
    b.eHp -= dmg;
    b.xpGain += Math.round(10 * atbFactor()) + Math.min(10, b.combo);
    var sp = document.getElementById("esprite");
    if (sp) sp.classList.add("hit");
    popDmg((limitReady ? "LIMIT! " : "") + dmg, limitReady ? "" : "");
    setTimeout(nextItem, 850);
  }

  function resolveMiss(item) {
    var b = battle;
    b.combo = 0;
    var hit = Math.round((b.cfg.boss ? 26 : 16) + Math.random() * 8);
    b.pHp -= hit;
    if (item._id && save.wrong.indexOf(item._id) === -1) save.wrong.push(item._id);
    b.wrongIds.push(item._id || "");
    popDmg("-" + hit + " HP", "hurt");
    var ex = document.getElementById("explain");
    if (ex) {
      ex.innerHTML = '<div class="explain"><b>Merke:</b> ' + esc(item.e || "") + "</div>" +
        '<button class="btn center gold" id="bNext">Weiter ▶</button>';
      document.getElementById("bNext").onclick = nextItem;
      ex.scrollIntoView({ behavior: "smooth", block: "end" });
    } else {
      setTimeout(nextItem, 1200);
    }
    persist();
  }

  function nextItem() {
    var b = battle;
    if (b.pHp <= 0) return endBattle(false);
    b.i++;
    if (b.i >= b.items.length) return endBattle(b.eHp <= 0);
    renderBattle();
  }

  /* --- Vers-Puzzle innerhalb der Engine --- */
  function orderHtml(item) {
    return '<div class="win"><div class="q-meta"><span>' + (battle.i + 1) + " / " + battle.items.length +
      "</span><span>" + esc(item.ref) + "</span></div>" +
      '<div class="q-text">Setze den Vers in die richtige Reihenfolge:</div>' +
      '<div class="assembly" id="asm"></div>' +
      '<div class="chips" id="chips">' +
      shuffle(item.chunks.map(function (c, i) { return { c: c, i: i }; })).map(function (o) {
        return '<button class="chip" data-i="' + o.i + '">' + esc(o.c) + "</button>";
      }).join("") +
      "</div>" +
      '<div class="barlabel"><span>ATB-BONUS</span></div><div class="bar atb"><i id="atbBar" style="width:100%"></i></div>' +
      '<div id="explain"></div></div>';
  }

  function bindOrder(item) {
    var need = 0, mistakes = 0;
    Array.prototype.forEach.call(app.querySelectorAll(".chip"), function (chip) {
      chip.onclick = function () {
        var i = +chip.getAttribute("data-i");
        if (i === need) {
          chip.disabled = true; chip.classList.add("picked-ok");
          document.getElementById("asm").textContent += (need ? " " : "") + item.chunks[i];
          need++;
          if (need === item.chunks.length) {
            clearInterval(battle.timer);
            if (mistakes === 0) {
              resolveHit(chip);
            } else {
              // Vers gelöst, aber mit Fehlversuchen: halber Schaden, kein Combo-Bruch-Schaden
              var b = battle;
              b.correct++;
              var dmg = Math.round(40 * atbFactor());
              b.eHp -= dmg; b.xpGain += 5;
              popDmg(dmg + "", "");
              setTimeout(nextItem, 850);
            }
          }
        } else {
          mistakes++;
          chip.classList.add("wrong");
          setTimeout(function () { chip.classList.remove("wrong"); }, 350);
          if (mistakes === 1) {
            var b = battle, hit = 8;
            b.pHp -= hit; popDmg("-" + hit + " HP", "hurt");
            var pb = app.querySelector(".party .bar.hp i");
            if (pb) pb.style.width = Math.max(0, 100 * b.pHp / b.pMax) + "%";
          }
        }
      };
    });
  }

  /* ---------------- Kampf-Ende ---------------- */
  function endBattle(won) {
    clearInterval(battle.timer);
    var b = battle, cfg = b.cfg;
    var acc = b.items.length ? b.correct / b.items.length : 0;
    var mannaGain = 0, msg = "";

    if (won) {
      b.xpGain += cfg.boss ? 60 : 25;
      mannaGain = (cfg.boss ? 40 : 15) + Math.round(acc * 20);
      var before = levelInfo().lvl;
      save.xp += b.xpGain; save.manna += mannaGain;
      if (cfg.chapter) {
        var st = chState(cfg.chapter);
        if (cfg.boss) {
          if (!st.boss) msg = cfg.chapter < 22 ? "🔓 Kapitel " + (cfg.chapter + 1) + " freigeschaltet!" :
            "🏆 DU HAST ALLE 22 KAPITEL GEMEISTERT!";
          st.boss = true;
        } else if (cfg.mode === "quiz") {
          var stars = acc >= 0.999 ? 3 : (acc >= 0.75 ? 2 : 1);
          if (stars > st.stars) st.stars = stars;
        }
      }
      // richtig beantwortete Wiederholungsfragen aus dem Pool nehmen
      b.items.forEach(function (it) {
        if (it._id && b.wrongIds.indexOf(it._id) === -1) {
          var ix = save.wrong.indexOf(it._id);
          if (ix !== -1) save.wrong.splice(ix, 1);
        }
      });
      var after = levelInfo().lvl;
      persist();
      show(
        hudHtml() +
        '<div class="result-center">' +
        '<div class="result-big">' + (cfg.boss ? "BOSS BESIEGT!" : "SIEG!") + "</div>" +
        (after > before ? '<div class="result-big levelup">LEVEL UP! → LV ' + after + "</div>" : "") +
        '<div class="win result-stats">' +
        "Richtig: <span class='val'>" + b.correct + " / " + b.items.length + "</span><br>" +
        "EXP: <span class='val'>+" + b.xpGain + "</span> · Manna: <span class='val'>+" + mannaGain + "</span>" +
        (msg ? "<br>" + msg : "") +
        "</div>" +
        '<button class="btn center gold" id="bOk">Weiter ▶</button>' +
        "</div>"
      );
    } else {
      persist();
      show(
        hudHtml() +
        '<div class="result-center">' +
        '<div class="result-big lose">NIEDERLAGE…</div>' +
        '<div class="win result-stats">Richtig: <span class="val">' + b.correct + " / " + b.items.length + "</span><br>" +
        '<span class="muted">Falsche Fragen landen im Täglichen Training – lies das Kapitel und versuche es erneut!</span></div>' +
        '<button class="btn center" id="bOk">Zurück</button>' +
        "</div>"
      );
    }
    document.getElementById("bOk").onclick = function () {
      if (cfg.chapter) screenChapter(cfg.chapter); else screenMap();
    };
    battle = null;
  }

  /* ---------------- Modus-Starter ---------------- */
  function prepQuizItem(n, qi) {
    var q = DB[n - 1].q[qi];
    var order = shuffle([0, 1, 2, 3]);
    return {
      kind: "quiz", t: q.t, e: q.e,
      _shuffled: order.map(function (k) { return q.o[k]; }),
      _answer: order.indexOf(q.a),
      _id: n + ":" + qi,
    };
  }

  function startQuiz(n, boss) {
    var c = DB[n - 1];
    var items = shuffle(c.q.map(function (_, i) { return i; })).map(function (qi) { return prepQuizItem(n, qi); });
    if (boss && chapterText(n)) {
      // Boss mischt Lückentexte dazu
      verseIndicesFor(n, 3).forEach(function (vi) {
        var it = makeClozeItem(n, vi);
        if (it) { it._shuffled = null; items.push(prepGenerated(it)); }
      });
      items = shuffle(items);
    }
    startBattle({
      chapter: n, boss: !!boss, mode: boss ? "boss" : "quiz",
      enemyName: boss ? c.boss : "Prüfung: " + c.title,
      emoji: c.emoji, items: items,
    });
  }

  function prepGenerated(it) {
    var order = shuffle([0, 1, 2, 3]);
    return {
      kind: it.kind, t: it.t, e: it.e,
      _shuffled: order.map(function (k) { return it.o[k]; }),
      _answer: order.indexOf(it.a),
      _id: null,
    };
  }

  function startCloze(n) {
    if (!chapterText(n)) { toast("Bibeltext noch nicht geladen – bitte Internet oder tools/fetch_bibeltext.mjs"); return; }
    var items = [];
    verseIndicesFor(n, 6).forEach(function (vi) {
      var it = makeClozeItem(n, vi);
      if (it) items.push(prepGenerated(it));
    });
    if (items.length < 3) { toast("Zu wenig geeignete Verse in diesem Kapitel."); return; }
    startBattle({
      chapter: n, boss: false, mode: "cloze",
      enemyName: "Vers-Training: Offenbarung " + n,
      emoji: "🧩", items: items,
    });
  }

  function startOrder(n) {
    if (!chapterText(n)) { toast("Bibeltext noch nicht geladen – bitte Internet oder tools/fetch_bibeltext.mjs"); return; }
    var items = [];
    verseIndicesFor(n, 5).forEach(function (vi) {
      var it = makeOrderItem(n, vi);
      if (it) items.push(it);
    });
    if (items.length < 2) { toast("Zu wenig geeignete Verse in diesem Kapitel."); return; }
    startBattle({
      chapter: n, boss: false, mode: "order",
      enemyName: "Vers-Puzzle: Offenbarung " + n,
      emoji: "🔀", items: items,
    });
  }

  function startDaily() {
    var items = [];
    // 1) offene falsche Fragen (Spaced Repetition light)
    shuffle(save.wrong).slice(0, 6).forEach(function (id) {
      var p = id.split(":"), n = +p[0], qi = +p[1];
      if (DB[n - 1] && DB[n - 1].q[qi]) items.push(prepQuizItem(n, qi));
    });
    // 2) auffüllen mit Zufallsfragen aus freigeschalteten Kapiteln
    var open = DB.filter(function (c) { return isUnlocked(c.n); });
    var guard = 0;
    while (items.length < 8 && guard++ < 60) {
      var c = pick(open), qi = Math.floor(Math.random() * c.q.length);
      var id = c.n + ":" + qi;
      if (!items.some(function (it) { return it._id === id; })) items.push(prepQuizItem(c.n, qi));
    }
    startBattle({
      chapter: 0, boss: false, mode: "daily",
      enemyName: "Schatten des Vergessens",
      emoji: "👻", items: shuffle(items),
    });
  }

  /* ---------------- Start ---------------- */
  screenTitle();
  loadBible(function () {
    if (BIBLE_STATUS === "ok") toast("Bibeltext geladen: Elberfelder 1905 ✔");
    else toast("Hinweis: Bibeltext konnte nicht geladen werden (offline?). Quiz funktioniert trotzdem.");
    // Titel neu zeichnen, falls noch sichtbar
    if (document.getElementById("bStart")) screenTitle();
  });
})();
