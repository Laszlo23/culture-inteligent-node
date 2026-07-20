/* Culture Node PWA service worker — network-first for app shell/API, cache-first for icons/static */
/* Bump to invalidate stale shells that left Mini Apps / phones blank */
const CACHE = 'culture-node-static-v4';
const PRECACHE = [
  '/site.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API — always network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  const isStatic =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/atmosphere/') ||
    url.pathname.startsWith('/nft/') ||
    url.pathname.startsWith('/store/') ||
    /\.(png|jpg|jpeg|webp|svg|ico|woff2?|webmanifest)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        return fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  // HTML / SPA — network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.mode === 'navigate') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('/', copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('/')))
  );
});
