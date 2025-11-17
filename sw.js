const CACHE_NAME = 'dvoc-tanzania-cache-v2'; // Increment version
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/bundle.js',
  '/bundle.css',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  'https://rsms.me/inter/inter.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch(error => {
        console.error('Failed to cache app shell during install:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache API calls or non-GET requests
  if (request.method !== 'GET' || url.hostname.includes('supabase.co')) {
    // Just fetch from the network without trying to cache
    return;
  }

  // For app shell files (HTML, JS, CSS), use a Network Falling Back to Cache strategy.
  // This ensures users get the latest version if online.
  if (APP_SHELL_URLS.map(u => new URL(u, self.location.origin).pathname).includes(url.pathname) || request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If fetch is successful and returns a valid response, update the cache.
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If the network fails, serve the main page from the cache.
          return caches.match(request.mode === 'navigate' ? '/index.html' : request);
        })
    );
    return;
  }

  // For all other requests (e.g., images not in the initial cache), use a Cache First strategy.
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
