// Zion Sing – Router & App-Rahmen.
import { store } from './core/store.js';
import { homeScreen, onboardingScreen } from './screens/home.js';
import { libraryScreen, chapterScreen } from './screens/library.js';
import { songScreen } from './screens/song.js';
import { sessionScreen } from './screens/session.js';
import { resultsScreen } from './screens/results.js';
import { rangeScreen } from './screens/range.js';
import { trainScreen, lessonIntroScreen } from './screens/train.js';
import { tunerScreen } from './screens/tuner.js';
import { profileScreen } from './screens/profile.js';
import { importScreen } from './screens/import.js';
import { studioScreen } from './screens/studio.js';
import { icon, wordmark } from './ui/icons.js';

const ROUTES = {
  '': { fn: homeScreen, tab: 'home' },
  welcome: { fn: onboardingScreen, full: true },
  songs: { fn: libraryScreen, tab: 'songs' },
  chapter: { fn: chapterScreen, tab: 'songs' },
  song: { fn: songScreen, tab: 'songs' },
  sing: { fn: (r, p) => sessionScreen(r, { ...p, kind: 'song' }), full: true },
  lesson: { fn: (r, p) => sessionScreen(r, { ...p, kind: 'lesson' }), full: true },
  'lesson-intro': { fn: lessonIntroScreen, tab: 'train' },
  results: { fn: resultsScreen, full: true },
  range: { fn: rangeScreen, full: true },
  train: { fn: trainScreen, tab: 'train' },
  tuner: { fn: tunerScreen, tab: 'train' },
  profile: { fn: profileScreen, tab: 'profile' },
  import: { fn: importScreen, tab: 'songs' },
  studio: { fn: studioScreen, tab: 'profile' },
};

const view = document.getElementById('view');
const nav = document.getElementById('nav');
nav.innerHTML = `<a class="nav-mark" href="#/" aria-label="Zion Sing – Start">${wordmark()}</a>` +
  [['#/', 'home', 'home', 'Start'], ['#/songs', 'songs', 'songs', 'Songs'], ['#/train', 'train', 'train', 'Training'], ['#/profile', 'profile', 'user', 'Profil']]
    .map(([href, tab, ic, label]) => `<a class="tab" href="${href}" data-tab="${tab}">${icon(ic, 20)}<span>${label}</span></a>`).join('');
let cleanup = null;
let navToken = 0;

function parse() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const [name, id] = path.split('/');
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  if (id) params.id = decodeURIComponent(id);
  return { name: name || '', params };
}

async function route() {
  const token = ++navToken;
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  let { name, params } = parse();
  if (!store.profile.onboarded && name === '') name = 'welcome';
  const r = ROUTES[name] || ROUTES[''];
  document.body.classList.toggle('fullscreen', !!r.full);
  nav.querySelectorAll('a.tab').forEach((a) => a.classList.toggle('on', a.dataset.tab === r.tab));
  view.innerHTML = '';
  view.scrollTop = 0;
  window.scrollTo(0, 0);
  const screen = document.createElement('div');
  screen.className = 'screen';
  view.appendChild(screen);
  try {
    const c = await r.fn(screen, params);
    if (token !== navToken) { if (typeof c === 'function') c(); return; } // schon weiter navigiert
    cleanup = typeof c === 'function' ? c : null;
  } catch (e) {
    console.error(e);
    screen.innerHTML = `<div class="empty"><p>Ups – da ist etwas schiefgelaufen.</p><pre class="small muted">${String(e && e.message || e)}</pre><a class="btn primary" href="#/">Zur Startseite</a></div>`;
  }
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
