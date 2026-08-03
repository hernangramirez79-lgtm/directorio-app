const CACHE_NAME = 'directorio-cache-v1';
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

  // Network-first for the external Google Sheets CSV sync, so data updates when online.
  if (req.url.includes('output=csv') || req.url.includes('/gviz/')) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for the app shell so it works fully offline.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
