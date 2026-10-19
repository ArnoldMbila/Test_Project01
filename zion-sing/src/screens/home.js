// Startseite (+ Willkommens-Screen beim ersten Start).
import { store, levelFor, currentStreak, today } from '../core/store.js';
import { allSongs, songFit, verseOfTheDay, songForVerse } from '../core/catalog.js';
import { COURSE, WARMUPS, DAILY, tipOfTheDay } from '../core/lessons.js';
import { classifyVoice, noteName } from '../core/notes.js';
import { currentStage } from '../core/stages.js';
import { cover, stars, go, escapeHtml } from '../ui/dom.js';
import { icon, wordmark } from '../ui/icons.js';

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
}

export function onboardingScreen(root) {
  root.innerHTML = `
  <div class="onboard">
    ${wordmark()}
    <h1>Singen lernen mit den Liedern der Offenbarung</h1>
    <p class="lead">Du singst zu echten Songs und siehst bei jeder Note, ob du sie triffst.</p>
    <ul class="ob-points">
      <li>${icon('mic', 18)} Live-Tonhöhe auf einer Notenbahn</li>
      <li>${icon('sliders', 18)} Songs passen sich deiner Stimmlage an</li>
      <li>${icon('book', 18)} Die Verse lernst du dabei auswendig</li>
    </ul>
    <label class="field">Wie heißt du?<input type="text" data-name placeholder="Dein Name" maxlength="24" value="${escapeHtml(store.profile.name)}"></label>
    <p class="muted small">Mit Kopfhörern erkennt die App deine Stimme am besten.</p>
    <button class="btn primary big" data-act="range">Stimmumfang testen (1 Min.)</button>
    <button class="btn big" data-act="skip">Später – direkt loslegen</button>
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
  const songs = await allSongs();
  const withFit = songs.map((x) => ({ song: x, fit: songFit(x) }))
    .sort((a, b) => (b.fit ? b.fit.fit : 0) - (a.fit ? a.fit.fit : 0));
  const last = s.history.find((h) => h.kind !== 'lesson');
  const lastSong = (last && songs.find((x) => x.id === last.songId)) || songs[0];
  const lastStage = lastSong && currentStage(lastSong.id);
  const nextLesson = COURSE.flatMap((u) => u.lessons).find((l) => !s.lessons[l.id]);
  const totalLessons = COURSE.reduce((a, u) => a + u.lessons.length, 0);
  const doneLessons = COURSE.flatMap((u) => u.lessons).filter((l) => s.lessons[l.id]).length;
  const vt = p.range ? classifyVoice(p.range[0], p.range[1]) : null;
  const vod = verseOfTheDay();
  const vodSong = vod && songForVerse(vod.ch, vod.v);
  const warmDone = !!s.warmups[today()];
  const min = Math.floor(todaySec / 60);

  root.innerHTML = `
  <div class="home">
    <header class="home-top">
      <div><h1>${greeting()}${p.name ? ', ' + escapeHtml(p.name) : ''}</h1>
        <p class="sub">${min >= p.dailyGoalMin ? 'Tagesziel erreicht.' : `Noch ${Math.max(1, Math.ceil((goal - todaySec) / 60))} Min. bis zum Tagesziel.`}</p></div>
    </header>

    <section class="kpis" aria-label="Dein Fortschritt">
      <div class="kpi"><small>Heute gesungen</small><b>${min}<span class="unit">/ ${p.dailyGoalMin} Min.</span></b><div class="bar thin"><i style="width:${Math.round(Math.min(1, todaySec / goal) * 100)}%"></i></div></div>
      <div class="kpi"><small>Tagesserie</small><b>${streak}<span class="unit">${streak === 1 ? 'Tag' : 'Tage'}</span></b></div>
      <div class="kpi"><small>Level ${lv.level}</small><b>${s.xp}<span class="unit">XP</span></b><div class="bar thin"><i style="width:${Math.round(lv.progress * 100)}%"></i></div></div>
      <a class="kpi" href="#/${p.range ? 'profile' : 'range'}"><small>Stimmlage</small><b>${vt ? vt.name : '—'}</b>
        <small>${vt ? `${noteName(p.range[0], p.notation)} – ${noteName(p.range[1], p.notation)}` : 'Jetzt testen'}</small></a>
    </section>

    <div class="grid">
      ${lastSong ? `<section class="card span-4 continue">
        ${cover(lastSong, 'md')}
        <div><small>${last ? 'Weiter singen' : 'Dein erster Song'}</small><h2>${escapeHtml(lastSong.title)}</h2>
          <span class="muted">${escapeHtml(lastSong.ref || '')} · Stufe ${lastStage.label}</span>
          <div class="row" style="margin-top:6px">${s.best[lastSong.id] ? stars(s.best[lastSong.id].stars) : ''}</div></div>
        <button class="play-round" data-go="#/sing/${lastSong.id}?stage=${lastStage.id}" aria-label="Stufe ${lastStage.label} singen">${icon('play', 20)}</button>
      </section>` : ''}
      <a class="card span-2 link-card" href="#/lesson-intro/${DAILY.id}">
        <div><h2>${DAILY.title}</h2><p class="muted small">${warmDone ? 'Heute erledigt. Nochmal geht immer.' : `${DAILY.min} Min. Atem, Tonhöhe und Sicherheit`}</p></div>
        ${warmDone ? `<span class="pill gold">${icon('check', 14)} Erledigt</span>` : `<span class="chev">${icon('chevron', 18)}</span>`}
      </a>
    </div>

    <div class="sec-head"><h2>Songs für deine Stimme</h2><a href="#/songs">Alle Songs</a></div>
    <div class="carousel">
      ${withFit.map(({ song, fit }) => `<a class="song-tile" href="#/song/${song.id}">
        ${cover(song)}<b>${escapeHtml(song.title)}</b><small>${escapeHtml(song.ref || song.subtitle || '')}</small>
        <div class="row">${s.best[song.id] ? stars(s.best[song.id].stars) : `<span class="tag">Stufe ${currentStage(song.id).label}</span>`}
        ${fit && fit.fit < 0.6 ? `<span class="fit hard">${fit.label}</span>` : ''}</div></a>`).join('')}
      <a class="song-tile" href="#/import"><div class="cover cover-gen">${icon('plus', 28)}</div><b>Eigener Song</b><small>MP3 und Text importieren</small></a>
    </div>

    <div class="sec-head"><h2>Weiterlernen</h2><a href="#/train">Training</a></div>
    <div class="grid">
      ${nextLesson ? `<a class="card span-2 link-card" href="#/lesson-intro/${nextLesson.id}"><div><small class="faint">Kurs · ${doneLessons} von ${totalLessons}</small><h2>${escapeHtml(nextLesson.title)}</h2></div><span class="chev">${icon('chevron', 18)}</span></a>`
      : `<a class="card span-2 link-card" href="#/train"><div><small class="faint">Kurs</small><h2>Alle ${totalLessons} Lektionen geschafft</h2></div><span class="chev">${icon('chevron', 18)}</span></a>`}
      <a class="card span-2 link-card" href="#/studio"><div><small class="faint">Studio</small><h2>Aufnehmen und anhören</h2></div><span class="chev">${icon('chevron', 18)}</span></a>
      <a class="card span-2 link-card" href="#/songs?tab=chapters"><div><small class="faint">Offenbarung</small><h2>22 Kapitel, 405 Verse</h2></div><span class="chev">${icon('chevron', 18)}</span></a>
    </div>

    <div class="grid" style="margin-top:var(--gap)">
      ${vod ? `<section class="card span-4">
        <small class="faint">Vers des Tages · Offb ${vod.ch},${vod.v}</small>
        <p class="verse">„${escapeHtml(vod.text)}“</p>
        ${vodSong ? `<a class="btn small primary" href="#/song/${vodSong.id}">${icon('play', 14)} Diesen Vers singen</a>` : `<a class="btn small" href="#/chapter/${vod.ch}?v=${vod.v}">Kapitel ${vod.ch} lesen</a>`}
      </section>` : ''}
      <section class="card span-2"><small class="faint">Tipp des Tages</small><p class="verse" style="font-size:15px;line-height:23px">${escapeHtml(tipOfTheDay())}</p></section>
    </div>
  </div>`;

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]');
    if (!t) return;
    e.preventDefault();
    go(t.dataset.go);
  });
}

export { WARMUPS };
