/* =========================================================================
   Claude 101 – Deutsche Lernversion · App-Logik
   Gamification, Vorlese-Funktion (Web Speech API), Fortschritt (localStorage)
   ========================================================================= */
(function () {
  "use strict";

  const LESSONS = window.LESSONS || [];
  const STORE_KEY = "claude101_de_v1";
  const XP_PER_CHUNK = 10;
  const XP_PER_QUIZ = 25;
  const XP_LESSON_BONUS = 50;
  const XP_PER_LEVEL = 200;

  /* ---------------------------- Zustand ---------------------------- */
  const defaultState = {
    xp: 0,
    completed: {},          // lessonId -> true
    lessonProgress: {},     // lessonId -> höchster erreichter Schritt-Index
    badges: {},             // badgeId -> true
    streakDays: 0,
    lastDay: null,
    calm: false,
    rate: 1
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return Object.assign({}, defaultState, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return Object.assign({}, defaultState);
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  let state = load();

  /* ---------------------------- Streak ---------------------------- */
  (function updateStreak() {
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastDay === today) return;
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    if (state.lastDay === yesterday) state.streakDays += 1;
    else state.streakDays = 1;
    state.lastDay = today;
    save();
  })();

  /* ---------------------------- Badges ---------------------------- */
  const BADGES = [
    { id: "start",   ic: "🌱", name: "Erste Schritte",   test: () => Object.keys(state.completed).length >= 1 },
    { id: "three",   ic: "⭐", name: "Auf Kurs",          test: () => Object.keys(state.completed).length >= 3 },
    { id: "half",    ic: "🔥", name: "Halbzeit",          test: () => Object.keys(state.completed).length >= 7 },
    { id: "ten",     ic: "💎", name: "Fast am Ziel",      test: () => Object.keys(state.completed).length >= 10 },
    { id: "all",     ic: "🏆", name: "Claude-Profi",      test: () => Object.keys(state.completed).length >= 14 },
    { id: "level5",  ic: "🚀", name: "Level 5",           test: () => level() >= 5 },
    { id: "streak3", ic: "📅", name: "3-Tage-Streak",     test: () => state.streakDays >= 3 },
    { id: "listen",  ic: "🎧", name: "Zuhörer:in",        test: () => state._listened },
  ];

  function level() { return Math.floor(state.xp / XP_PER_LEVEL) + 1; }
  function xpInLevel() { return state.xp % XP_PER_LEVEL; }

  function checkBadges() {
    let newOnes = [];
    BADGES.forEach(b => {
      if (!state.badges[b.id] && b.test()) {
        state.badges[b.id] = true;
        newOnes.push(b);
      }
    });
    if (newOnes.length) { save(); newOnes.forEach(b => toast(`${b.ic} Abzeichen: ${b.name}!`)); }
  }

  function addXP(amount) {
    const before = level();
    state.xp += amount;
    save();
    renderHUD();
    if (level() > before) {
      confetti();
      toast(`🎉 Level ${level()} erreicht!`);
    }
    checkBadges();
  }

  /* ---------------------------- DOM-Helfer ---------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const app = $("#app");

  /* ============================ VORLESEN (TTS) ============================ */
  const TTS = {
    supported: "speechSynthesis" in window,
    voice: null,
    current: null,
    pickVoice() {
      if (!this.supported) return;
      const voices = speechSynthesis.getVoices();
      // Bevorzuge eine deutsche Stimme
      this.voice = voices.find(v => /de[-_]/i.test(v.lang)) ||
                   voices.find(v => /german|deutsch/i.test(v.name)) || null;
    },
    speak(text, btn) {
      if (!this.supported) { toast("Vorlesen wird von diesem Browser nicht unterstützt."); return; }
      this.stop();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE";
      u.rate = state.rate || 1;
      if (this.voice) u.voice = this.voice;
      this.current = { u, btn };
      if (btn) btn.classList.add("speaking");
      u.onend = u.onerror = () => { if (btn) btn.classList.remove("speaking"); this.current = null; };
      speechSynthesis.speak(u);
      if (!state._listened) { state._listened = true; save(); checkBadges(); }
    },
    stop() {
      if (!this.supported) return;
      speechSynthesis.cancel();
      document.querySelectorAll(".speaking").forEach(b => b.classList.remove("speaking"));
      this.current = null;
    }
  };
  if (TTS.supported) {
    TTS.pickVoice();
    speechSynthesis.onvoiceschanged = () => TTS.pickVoice();
  }

  /* ============================ HUD / TOPBAR ============================ */
  function renderHUD() {
    $("#hud-level").textContent = level();
    $("#hud-xp").textContent = state.xp;
    $("#hud-streak").textContent = state.streakDays;
    const pct = (xpInLevel() / XP_PER_LEVEL) * 100;
    $("#hud-xpbar").style.width = pct + "%";
    const doneCount = Object.keys(state.completed).length;
    $("#hud-done").textContent = doneCount + "/14";
  }

  /* ============================ HOME / LERNPFAD ============================ */
  function renderHome() {
    TTS.stop();
    document.title = "Claude 101 · Deutsche Lernversion";
    app.innerHTML = "";

    const hero = el("div", "hero");
    hero.innerHTML = `
      <h1>Claude 101 – auf Deutsch lernen</h1>
      <p>Verstehe Claude in 14 kurzen, gehirnfreundlichen Lektionen – mit Vorlese-Funktion, XP, Abzeichen und Mini-Quiz. 🧠✨</p>
      <div class="badges-row">
        <span class="chip">🎧 Vorlesen</span>
        <span class="chip">🎮 Gamifiziert</span>
        <span class="chip">🧩 Kleine Häppchen</span>
        <span class="chip">📈 Fortschritt gespeichert</span>
      </div>`;
    app.appendChild(hero);

    const st = el("div", "section-title", "Dein Lernpfad");
    app.appendChild(st);

    const grid = el("div", "grid");
    LESSONS.forEach((lsn, i) => {
      const prevDone = i === 0 || state.completed[LESSONS[i - 1].id];
      const done = !!state.completed[lsn.id];
      const totalSteps = lsn.chunks.length + lsn.quiz.length;
      const prog = Math.min(state.lessonProgress[lsn.id] || 0, totalSteps);
      const pct = done ? 100 : Math.round((prog / totalSteps) * 100);

      const card = el("button", "lesson-card" + (done ? " done" : "") + (prevDone ? "" : " locked"));
      card.style.setProperty("--lc", lsn.farbe);
      card.innerHTML = `
        <span class="done-badge">✓ Fertig</span>
        ${prevDone ? "" : '<span class="lock-ic">🔒</span>'}
        <div class="lc-top">
          <div class="lc-emoji">${lsn.emoji}</div>
          <div>
            <div class="lc-num">Lektion ${lsn.id} · ${lsn.dauer} Min</div>
            <h3>${lsn.titel}</h3>
          </div>
        </div>
        <div class="lc-intro">${lsn.intro}</div>
        <div class="lc-foot">
          <span>${lsn.chunks.length} Häppchen · ${lsn.quiz.length} Quiz</span>
          <span>${pct}%</span>
        </div>
        <div class="lc-progress"><span style="width:${pct}%"></span></div>`;
      if (prevDone) card.addEventListener("click", () => openLesson(lsn.id));
      else card.addEventListener("click", () => toast("🔒 Schließe zuerst die vorherige Lektion ab."));
      grid.appendChild(card);
    });
    app.appendChild(grid);

    const foot = el("div", "foot", `
      Inoffizielle, deutschsprachige Lernversion zu Anthropics Claude-101-Themen · gebaut zum eigenständigen Üben.<br>
      Fortschritt wird lokal in deinem Browser gespeichert.`);
    app.appendChild(foot);

    renderHUD();
    checkBadges();
  }

  /* ============================ LEKTION-ANSICHT ============================ */
  const view = {}; // laufender Zustand der offenen Lektion

  function openLesson(id) {
    TTS.stop();
    const lsn = LESSONS.find(l => l.id === id);
    if (!lsn) return;
    view.lsn = lsn;
    view.step = 0;                                   // 0..chunks-1 = Inhalt, dann Quiz
    view.total = lsn.chunks.length + lsn.quiz.length;
    view.gained = {};                                // welche Schritte in dieser Sitzung schon XP gaben
    view.quizAnswered = {};                          // quizIndex -> bool korrekt
    document.title = `L${lsn.id}: ${lsn.titel} · Claude 101`;
    document.documentElement.style.setProperty("--lesson", lsn.farbe);
    window.scrollTo(0, 0);
    renderStep();
  }

  function stepDots(activeIdx) {
    const wrap = el("div", "steps");
    for (let i = 0; i < view.total; i++) {
      const d = el("div", "dot" + (i < activeIdx ? " on" : i === activeIdx ? " current" : ""));
      wrap.appendChild(d);
    }
    return wrap;
  }

  function lessonHead() {
    const l = view.lsn;
    const head = el("div", "lv-head");
    head.innerHTML = `
      <div class="lv-emoji">${l.emoji}</div>
      <div>
        <h2>${l.titel}</h2>
        <div class="lv-sub">Lektion ${l.id} von 14 · ${l.dauer} Min · Schritt ${view.step + 1}/${view.total}</div>
      </div>`;
    return head;
  }

  function renderStep() {
    TTS.stop();
    const l = view.lsn;
    window.scrollTo({ top: 0, behavior: "smooth" });
    app.innerHTML = "";

    const back = el("button", "mini-btn", "← Übersicht");
    back.style.marginBottom = "12px";
    back.addEventListener("click", renderHome);
    app.appendChild(back);

    app.appendChild(lessonHead());
    app.appendChild(stepDots(view.step));

    if (view.step < l.chunks.length) renderChunk();
    else renderQuiz(view.step - l.chunks.length);

    renderHUD();
  }

  function renderChunk() {
    const l = view.lsn;
    const idx = view.step;
    const c = l.chunks[idx];

    const card = el("div", "chunk");
    card.innerHTML = `
      <div class="kicker">Häppchen ${idx + 1} / ${l.chunks.length}</div>
      <h3>${c.titel}</h3>
      <p class="body">${c.text}</p>
      ${c.merke ? `<div class="merke"><span>💡</span><div><b>Merke:</b> ${c.merke}</div></div>` : ""}
    `;

    // Vorlese-Steuerung
    const speakRow = el("div", "speak-row");
    const readText = `${c.titel}. ${c.text} ${c.merke ? "Merke: " + c.merke : ""}`;
    const speakBtn = el("button", "speak-btn", "🔊 Vorlesen");
    speakBtn.addEventListener("click", () => {
      if (speakBtn.classList.contains("speaking")) { TTS.stop(); }
      else { TTS.speak(readText, speakBtn); }
    });
    const stopBtn = el("button", "mini-btn", "⏹ Stopp");
    stopBtn.addEventListener("click", () => TTS.stop());

    const rate = el("label", "rate-ctrl");
    rate.innerHTML = `🐢<input type="range" min="0.6" max="1.4" step="0.1" value="${state.rate}">🐇`;
    rate.querySelector("input").addEventListener("input", e => {
      state.rate = parseFloat(e.target.value); save();
    });

    speakRow.appendChild(speakBtn);
    speakRow.appendChild(stopBtn);
    speakRow.appendChild(rate);
    card.appendChild(speakRow);
    app.appendChild(card);

    // XP fürs Lesen dieses Häppchens (einmal)
    grantStepXP(idx, XP_PER_CHUNK);

    // Navigation
    const nav = el("div", "nav-row");
    if (idx > 0) {
      const prev = el("button", "btn ghost", "← Zurück");
      prev.addEventListener("click", () => { view.step--; renderStep(); });
      nav.appendChild(prev);
    }
    const next = el("button", "btn primary", idx < l.chunks.length - 1 ? "Weiter →" : "Zum Quiz →");
    next.addEventListener("click", () => { view.step++; renderStep(); });
    nav.appendChild(next);
    app.appendChild(nav);
  }

  function grantStepXP(stepIdx, amount) {
    const key = view.lsn.id + ":" + stepIdx;
    const reached = state.lessonProgress[view.lsn.id] || 0;
    if (stepIdx >= reached && !view.gained[key]) {
      view.gained[key] = true;
      state.lessonProgress[view.lsn.id] = Math.max(reached, stepIdx + 1);
      save();
      addXP(amount);
      floatXP(amount);
    }
  }

  /* ---------------------------- QUIZ ---------------------------- */
  function renderQuiz(qIdx) {
    const l = view.lsn;
    const q = l.quiz[qIdx];

    const card = el("div", "chunk quiz");
    card.innerHTML = `
      <div class="q-count">🧩 Quiz ${qIdx + 1} / ${l.quiz.length}</div>
      <h3>${q.frage}</h3>`;

    const opts = el("div", "options");
    // Vorlese-Knopf für die Frage
    const speakRow = el("div", "speak-row");
    const speakBtn = el("button", "speak-btn", "🔊 Frage vorlesen");
    speakBtn.addEventListener("click", () => {
      if (speakBtn.classList.contains("speaking")) TTS.stop();
      else TTS.speak(q.frage + ". " + q.optionen.map((o, i) => `Option ${i + 1}: ${o}.`).join(" "), speakBtn);
    });
    speakRow.appendChild(speakBtn);

    const feedback = el("div", "feedback");

    q.optionen.forEach((optText, i) => {
      const b = el("button", "option", optText);
      b.addEventListener("click", () => {
        if (view.quizAnswered[qIdx] !== undefined) return; // schon beantwortet
        const correct = i === q.richtig;
        Array.from(opts.children).forEach((cb, ci) => {
          cb.disabled = true;
          if (ci === q.richtig) cb.classList.add("correct");
        });
        if (!correct) b.classList.add("wrong");
        view.quizAnswered[qIdx] = correct;

        feedback.className = "feedback show " + (correct ? "ok" : "no");
        feedback.innerHTML = (correct ? "✅ <b>Richtig!</b> " : "❌ <b>Nicht ganz.</b> ") + q.erklaerung;

        if (correct) {
          grantStepXP(l.chunks.length + qIdx, XP_PER_QUIZ);
          confettiSmall();
        } else {
          toast("Kein Problem – lies die Erklärung. 💪");
        }
        // Weiter-Button aktivieren
        nextBtn.disabled = false;
      });
      opts.appendChild(b);
    });

    card.appendChild(speakRow);
    card.appendChild(opts);
    card.appendChild(feedback);
    app.appendChild(card);

    const nav = el("div", "nav-row");
    const prev = el("button", "btn ghost", "← Zurück");
    prev.addEventListener("click", () => { view.step--; renderStep(); });
    nav.appendChild(prev);

    const isLast = qIdx === l.quiz.length - 1;
    const nextBtn = el("button", "btn primary", isLast ? "Lektion abschließen 🎉" : "Nächste Frage →");
    nextBtn.disabled = true;
    nextBtn.addEventListener("click", () => {
      if (isLast) finishLesson();
      else { view.step++; renderStep(); }
    });
    nav.appendChild(nextBtn);
    app.appendChild(nav);
  }

  /* ---------------------------- ABSCHLUSS ---------------------------- */
  function finishLesson() {
    TTS.stop();
    const l = view.lsn;
    const firstTime = !state.completed[l.id];
    state.completed[l.id] = true;
    state.lessonProgress[l.id] = view.total;
    save();

    if (firstTime) { addXP(XP_LESSON_BONUS); confetti(); }
    checkBadges();

    const correctCount = Object.values(view.quizAnswered).filter(Boolean).length;
    const nextLesson = LESSONS.find(x => x.id === l.id + 1);

    app.innerHTML = "";
    window.scrollTo({ top: 0, behavior: "smooth" });

    const done = el("div", "complete");
    done.innerHTML = `
      <div class="big">${l.id === 14 ? "🏆" : "🎉"}</div>
      <h2>Lektion ${l.id} geschafft!</h2>
      <p>„${l.titel}“ ist erledigt.</p>
      <div class="reward">⭐ +${firstTime ? XP_LESSON_BONUS : 0} XP Bonus · ${correctCount}/${l.quiz.length} Quiz richtig</div>
      <p style="margin-top:6px">${l.id === 14
        ? "Du hast <b>alle 14 Lektionen</b> abgeschlossen. Du bist jetzt Claude-101-Profi! 🚀"
        : "Weiter so – der Schwung ist auf deiner Seite. 💜"}</p>`;
    app.appendChild(done);

    const nav = el("div", "nav-row");
    nav.style.justifyContent = "center";
    nav.style.marginTop = "20px";
    const home = el("button", "btn ghost", "← Zur Übersicht");
    home.addEventListener("click", renderHome);
    nav.appendChild(home);
    if (nextLesson) {
      const next = el("button", "btn primary", `Weiter: ${nextLesson.emoji} ${nextLesson.titel} →`);
      next.style.marginLeft = "0";
      next.addEventListener("click", () => openLesson(nextLesson.id));
      nav.appendChild(next);
    } else {
      const badges = el("button", "btn primary", "🏅 Meine Abzeichen");
      badges.style.marginLeft = "0";
      badges.addEventListener("click", openBadges);
      nav.appendChild(badges);
    }
    app.appendChild(nav);
    renderHUD();
  }

  /* ============================ BADGE-MODAL ============================ */
  function openBadges() {
    const back = $("#modal-back");
    const grid = $("#badge-grid");
    grid.innerHTML = "";
    BADGES.forEach(b => {
      const earned = !!state.badges[b.id];
      const node = el("div", "badge" + (earned ? " earned" : ""));
      node.innerHTML = `<span class="b-ic">${b.ic}</span>${b.name}`;
      grid.appendChild(node);
    });
    const earnedCount = BADGES.filter(b => state.badges[b.id]).length;
    $("#badge-sub").textContent = `${earnedCount} / ${BADGES.length} freigeschaltet · Level ${level()} · ${state.xp} XP`;
    back.classList.add("show");
  }

  /* ============================ TOAST / KONFETTI ============================ */
  let toastWrap;
  function toast(msg) {
    if (!toastWrap) { toastWrap = el("div", "toast-wrap"); document.body.appendChild(toastWrap); }
    const t = el("div", "toast", msg);
    toastWrap.appendChild(t);
    setTimeout(() => t.remove(), 2900);
  }

  function floatXP(amount) {
    const t = el("div", "toast", `+${amount} XP`);
    if (!toastWrap) { toastWrap = el("div", "toast-wrap"); document.body.appendChild(toastWrap); }
    toastWrap.appendChild(t);
    setTimeout(() => t.remove(), 2900);
  }

  const cvs = $("#confetti");
  const ctx = cvs.getContext("2d");
  function sizeCanvas() { cvs.width = innerWidth; cvs.height = innerHeight; }
  addEventListener("resize", sizeCanvas); sizeCanvas();

  function confettiBurst(count) {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#c58af9", "#ff9a62", "#4ade80", "#ffd35c", "#45aaf2", "#f368e0"];
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({
        x: innerWidth / 2, y: innerHeight / 3,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -12 - 4,
        g: 0.3 + Math.random() * 0.2,
        s: 5 + Math.random() * 7,
        c: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        life: 90 + Math.random() * 40
      });
    }
    let frame = 0;
    function tick() {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      let alive = false;
      parts.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      frame++;
      if (alive && frame < 160) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, cvs.width, cvs.height);
    }
    tick();
  }
  function confetti() { confettiBurst(140); }
  function confettiSmall() { confettiBurst(50); }

  /* ============================ TOPBAR-KNÖPFE ============================ */
  $("#brand").addEventListener("click", renderHome);
  $("#btn-badges").addEventListener("click", openBadges);
  $("#modal-close").addEventListener("click", () => $("#modal-back").classList.remove("show"));
  $("#modal-back").addEventListener("click", e => { if (e.target.id === "modal-back") e.currentTarget.classList.remove("show"); });

  const calmBtn = $("#btn-calm");
  function applyCalm() { document.body.classList.toggle("calm", state.calm); calmBtn.classList.toggle("active", state.calm); }
  calmBtn.addEventListener("click", () => { state.calm = !state.calm; save(); applyCalm(); toast(state.calm ? "🌙 Ruhe-Modus an" : "✨ Effekte an"); });
  applyCalm();

  $("#btn-reset").addEventListener("click", () => {
    if (confirm("Gesamten Fortschritt wirklich zurücksetzen?")) {
      localStorage.removeItem(STORE_KEY);
      state = load();
      state.lastDay = new Date().toISOString().slice(0, 10);
      state.streakDays = 1;
      save();
      applyCalm();
      renderHome();
      toast("Fortschritt zurückgesetzt.");
    }
  });

  // Vorlesen stoppen, wenn Tab in den Hintergrund geht
  document.addEventListener("visibilitychange", () => { if (document.hidden) TTS.stop(); });

  /* ---------------------------- Start ---------------------------- */
  if (!LESSONS.length) {
    app.innerHTML = "<p style='padding:40px;text-align:center'>Lektionsdaten konnten nicht geladen werden.</p>";
  } else {
    renderHome();
  }
})();
