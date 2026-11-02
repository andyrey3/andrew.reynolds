// Caches the app shell so it opens offline. Workout data lives in
// localStorage on the device and is never touched by the service worker.
const CACHE = 'ul-tracker-v4';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

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

  // Pages: always ask the network (skipping the browser's HTTP cache) so
  // updates show up right away; fall back to the saved copy when offline
  const url = new URL(e.request.url);
  const isApp = url.origin === self.location.origin && url.pathname.endsWith('/app.js');
  if (e.request.mode === 'navigate' || isApp) {
    const key = isApp ? './app.js' : './index.html';
    e.respondWith(
      fetch(e.request.url, { cache: 'no-store' })
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(key, copy));
          }
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
