// Startseite (+ Willkommens-Screen beim ersten Start).
import { store, levelFor, currentStreak, today } from '../core/store.js';
import { allSongs, songFit, verseOfTheDay, songForVerse } from '../core/catalog.js';
import { COURSE, WARMUPS } from '../core/lessons.js';
import { classifyVoice, noteName } from '../core/notes.js';
import { cover, stars, go, escapeHtml } from '../ui/dom.js';

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
}

export function onboardingScreen(root) {
  root.innerHTML = `
  <div class="onboard">
    <div class="ob-logo">🎤</div>
    <h1>Zion Sing</h1>
    <p class="lead">Lerne singen mit den Liedern der Offenbarung – mit Echtzeit-Feedback zu jeder Note.</p>
    <ul class="ob-points">
      <li><span>🎯</span> Sieh live, ob du den Ton triffst</li>
      <li><span>🎚️</span> Songs passen sich deiner Stimme an</li>
      <li><span>🧠</span> Verse ganz nebenbei auswendig lernen</li>
    </ul>
    <label class="field">Wie heißt du?<input type="text" data-name placeholder="Dein Name" maxlength="24" value="${escapeHtml(store.profile.name)}"></label>
    <p class="muted small">🎧 Tipp: Mit Kopfhörern erkennt die App deine Stimme am besten.</p>
    <button class="btn primary big" data-act="range">Stimmumfang testen (1 Min.)</button>
    <button class="btn ghost" data-act="skip">Später – direkt loslegen</button>
  </div>`;
  const done = (to) => {
    store.setProfile({ name: root.querySelector('[data-name]').value.trim(), onboarded: true });
    go(to);
  };
  root.querySelector('[data-act="range"]').onclick = () => done('#/range');
  root.querySelector('[data-act="skip"]').onclick = () => done('#/');
}

export async function homeScreen(root) {
  const p = store.profile, s = store.stats;
  const lv = levelFor(s.xp);
  const streak = currentStreak();
  const todaySec = s.daily[today()] || 0;
  const goal = p.dailyGoalMin * 60;
  const pct = Math.min(1, todaySec / goal);
  const songs = await allSongs();
  const withFit = songs.map((x) => ({ song: x, fit: songFit(x) }))
    .sort((a, b) => (b.fit ? b.fit.fit : 0) - (a.fit ? a.fit.fit : 0));
  const last = s.history.find((h) => h.kind !== 'lesson');
  const lastSong = last && songs.find((x) => x.id === last.songId);
  const nextLesson = COURSE.flatMap((u) => u.lessons).find((l) => !s.lessons[l.id]);
  const warm = WARMUPS[new Date().getDate() % WARMUPS.length];
  const totalLessons = COURSE.reduce((a, u) => a + u.lessons.length, 0);
  const doneLessons = Object.keys(s.lessons).filter((k) => k.startsWith('l')).length;
  const vt = p.range ? classifyVoice(p.range[0], p.range[1]) : null;
  const vod = verseOfTheDay();
  const vodSong = vod && songForVerse(vod.ch, vod.v);

  root.innerHTML = `
  <div class="home">
    <header class="home-top">
      <div><small class="muted">${greeting()}${p.name ? ',' : ''}</small><h1>${p.name ? escapeHtml(p.name) : 'Zion Sing'}</h1></div>
      <div class="pills">
        <span class="pill" title="Tagesserie">🔥 ${streak}</span>
        <span class="pill" title="Level">⭐ ${lv.level}</span>
      </div>
    </header>

    <section class="card goal">
      <div class="ring" style="--p:${pct}"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="bg"/><circle cx="22" cy="22" r="19" class="fg"/></svg>
        <span>${Math.floor(todaySec / 60)}<small>/${p.dailyGoalMin}</small></span></div>
      <div><b>Tagesziel</b><p class="muted small">${pct >= 1 ? 'Geschafft! 🎉 Sing weiter, wenn du Lust hast.' : `Noch ${Math.max(1, Math.ceil((goal - todaySec) / 60))} Min. singen`}</p>
        <div class="bar thin"><i style="width:${Math.round(lv.progress * 100)}%"></i></div><small class="muted">Level ${lv.level} · ${s.xp} XP</small></div>
    </section>

    ${!p.range ? `<section class="card cta" data-go="#/range">
      <div class="cta-ic">🎚️</div><div><b>Finde deine Stimmlage</b><p class="muted small">Sing deinen tiefsten und höchsten Ton – danach passen sich die Songs an dich an.</p></div><span class="chev">›</span>
    </section>` : `<section class="card voice" data-go="#/profile">
      <div class="cta-ic">🎙️</div><div><b>${vt.name}</b><p class="muted small">${noteName(p.range[0], p.notation)} – ${noteName(p.range[1], p.notation)} · ${p.range[1] - p.range[0]} Halbtöne</p></div><span class="chev">›</span>
    </section>`}

    ${lastSong ? `<section class="continue" data-go="#/song/${lastSong.id}">
      ${cover(lastSong, 'sm')}<div><small class="muted">Weiter singen</small><b>${escapeHtml(lastSong.title)}</b><small>${escapeHtml(lastSong.ref || '')}</small></div>
      <button class="btn round primary" data-go="#/sing/${lastSong.id}" aria-label="Singen">▶</button>
    </section>` : ''}

    <div class="sec-head"><h2>Songs für dich</h2><a href="#/songs">Alle</a></div>
    <div class="carousel">
      ${withFit.map(({ song, fit }) => `<a class="song-tile" href="#/song/${song.id}" style="--c:${song.color || '#7a5cff'}">
        ${cover(song)}<b>${escapeHtml(song.title)}</b><small>${escapeHtml(song.ref || song.subtitle || '')}</small>
        <div class="row">${s.best[song.id] ? stars(s.best[song.id].stars) : '<span class="muted small">Neu</span>'}
        ${fit ? `<span class="fit ${fit.fit >= 0.85 ? 'good' : fit.fit >= 0.6 ? 'ok' : 'hard'}">${fit.label}</span>` : ''}</div></a>`).join('')}
      <a class="song-tile add" href="#/import"><div class="cover cover-gen"><span>＋</span></div><b>Eigener Song</b><small>MP3 + Text importieren</small></a>
    </div>

    <div class="sec-head"><h2>Training</h2><a href="#/train">Kurs</a></div>
    <div class="two">
      <a class="card mini" href="#/lesson/${warm.id}"><span class="big-ic">${warm.icon}</span><b>Warm-up des Tages</b><small class="muted">${warm.title} · ${warm.min} Min.</small></a>
      ${nextLesson ? `<a class="card mini" href="#/lesson/${nextLesson.id}"><span class="big-ic">🎓</span><b>Nächste Lektion</b><small class="muted">${escapeHtml(nextLesson.title)} · ${doneLessons}/${totalLessons}</small></a>`
      : '<a class="card mini" href="#/train"><span class="big-ic">🏆</span><b>Kurs abgeschlossen</b><small class="muted">Wiederhole Lektionen für 3 Sterne</small></a>'}
      <a class="card mini" href="#/tuner"><span class="big-ic">🎯</span><b>Stimmgerät</b><small class="muted">Live-Tonhöhe sehen</small></a>
      <a class="card mini" href="#/songs?tab=chapters"><span class="big-ic">📜</span><b>Alle 22 Kapitel</b><small class="muted">405 Verse lesen & lernen</small></a>
    </div>

    ${vod ? `<section class="card vod">
      <small class="muted">Vers des Tages · Offb ${vod.ch},${vod.v}</small>
      <p>„${escapeHtml(vod.text)}“</p>
      ${vodSong ? `<a class="btn small primary" href="#/song/${vodSong.id}">🎵 Diesen Vers singen</a>` : `<a class="btn small ghost" href="#/chapter/${vod.ch}">Kapitel ${vod.ch} lesen</a>`}
    </section>` : ''}
  </div>`;

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    go(t.dataset.go);
  });
}
