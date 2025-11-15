const CACHE_NAME = 'dvoc-tanzania-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/bundle.js',
  '/icon-192.svg',
  '/icon-512.svg',
  'https://rsms.me/inter/inter.css'
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache during install:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // We only want to handle GET requests.
  if (request.method !== 'GET') {
    return;
  }

  // Network First strategy for HTML and the main JS bundle.
  // This ensures users always get the latest app code when online.
  if (request.mode === 'navigate' || url.pathname.endsWith('/bundle.js')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If fetch is successful, clone it and cache it for offline use.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network fails, try to serve the response from the cache.
          return caches.match(request);
        })
    );
    return;
  }

  // Cache First strategy for all other static assets (fonts, icons, etc.) for performance.
  event.respondWith(
    caches.match(request)
      .then(response => {
        // If we have a cached response, return it.
        if (response) {
          return response;
        }

        // Otherwise, fetch from the network.
        return fetch(request).then(networkResponse => {
          // Check if we received a valid response and if it's a cacheable asset.
          if (networkResponse && networkResponse.status === 200 && isCacheable(request)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
  );
});


// Clean up old caches when a new service worker is activated
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

function isCacheable(request) {
    const url = new URL(request.url);
    // Don't cache API calls to Supabase
    if (url.hostname.includes('supabase.co')) {
        return false;
    }
    // Cache local assets and known CDN assets
    return url.origin === self.location.origin || url.hostname === 'rsms.me';
}
