// Caches the app shell and the face model so scans work offline after the
// first one. Scans and your plan live in localStorage and are never touched here.
const CACHE = 'facet-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './analysis.js',
  './app.js'
];
// The MediaPipe library and model never change at a pinned version
const PINNED = ['https://cdn.jsdelivr.net/npm/@mediapipe/', 'https://storage.googleapis.com/mediapipe-models/'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(a => new Request(a, { cache: 'reload' })))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (PINNED.some(p => e.request.url.startsWith(p))) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }))
    );
    return;
  }
  if (url.origin !== location.origin) return;

  // Page and scripts: always ask the network (skipping the browser's HTTP
  // cache) so updates show up right away; fall back to the saved copy offline
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.js')) {
    const key = e.request.mode === 'navigate' ? './index.html' : e.request;
    e.respondWith(
      fetch(e.request.url, { cache: 'no-store' })
        .then(res => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then(c => c.put(key, copy));
          return res;
        })
        .catch(() => caches.match(key))
    );
    return;
  }

  // Everything else: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
