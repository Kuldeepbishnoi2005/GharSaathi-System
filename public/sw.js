const CACHE_NAME = 'gharsaathi-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-First strategy for dynamic live data (Supabase API queries, attendance, workers, payments)
  const isDynamicData =
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/');

  if (isDynamicData) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          // If offline and network fails, attempt cache fallback
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-First strategy for static assets (js, css, images, fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache valid static responses
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.startsWith('/_next/static/') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.js'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }
      );
    })
  );
});
