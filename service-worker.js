const CACHE_NAME = 'flappy-ears-dog-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core assets');
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => console.warn(`[SW] Failed to cache ${url}:`, err))
        )
      );
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or requests to Vite internal dev endpoints or chrome extensions
  if (
    event.request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('node_modules')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache valid responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If it's a navigation request, try /index.html or /
        if (event.request.mode === 'navigate') {
          const indexHtml = (await caches.match('/index.html')) || (await caches.match('/'));
          if (indexHtml) {
            return indexHtml;
          }
        }

        // Return standard response instead of undefined
        return new Response('Resource not found offline', {
          status: 404,
          statusText: 'Not Found',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});
