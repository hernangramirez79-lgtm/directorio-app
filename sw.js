const CACHE_NAME = 'directorio-cache-v3';
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

  // Network-first for everything (own app files AND external Google Sheets / Apps Script),
  // falling back to cache only when there's no connection. This way, updates to the app
  // (index.html, etc.) are picked up automatically next time it's opened online, instead
  // of getting stuck on an old cached version.
  event.respondWith(
    fetch(req).then((res) => {
      // Cache a fresh copy of same-origin GET requests for offline fallback.
      if (req.method === 'GET' && req.url.startsWith(self.location.origin)) {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
      }
      return res;
    }).catch(() =>
      caches.match(req).then((cached) => cached || Response.error())
    )
  );
});
