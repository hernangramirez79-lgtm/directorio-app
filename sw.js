const CACHE_NAME = 'directorio-cache-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './data.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isExternal = !req.url.startsWith(self.location.origin);

  // Network-first for external requests (Google Sheets / Apps Script), so data updates when online.
  if (isExternal) {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((cached) => cached || Response.error())
      )
    );
    return;
  }

  // Cache-first for the app shell so it works fully offline.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
