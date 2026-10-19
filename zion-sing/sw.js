// Offline-Cache: App-Dateien sofort, Songs beim ersten Abspielen.
const CACHE = 'zion-sing-v2';
const SHELL = [
  './', 'index.html', 'style.css', 'icon.svg', 'manifest.webmanifest',
  'data/songs.js', 'data/offenbarung.js',
  'src/main.js', 'src/core/notes.js', 'src/core/scoring.js', 'src/core/store.js', 'src/core/catalog.js', 'src/core/lessons.js', 'src/core/stages.js',
  'src/audio/yin.js', 'src/audio/engine.js', 'src/audio/player.js', 'src/audio/synth.js', 'src/audio/recorder.js', 'src/audio/analyze.js',
  'src/ui/lane.js', 'src/ui/lyrics.js', 'src/ui/dom.js',
  'src/screens/home.js', 'src/screens/library.js', 'src/screens/song.js', 'src/screens/session.js', 'src/screens/results.js',
  'src/screens/range.js', 'src/screens/train.js', 'src/screens/tuner.js', 'src/screens/profile.js', 'src/screens/import.js', 'src/screens/studio.js',
];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return; // Audio-Streaming (Range) direkt vom Netz
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok && new URL(req.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => hit)));
});
