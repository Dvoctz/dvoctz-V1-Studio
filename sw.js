
const CACHE_NAME = 'dvoc-tanzania-cache-v6'; // Increment version to force update & clear old caches
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
        // Only cache local assets during install for robustness. External assets are cached on fetch.
        const localAppShellUrls = APP_SHELL_URLS.filter(url => !url.startsWith('http'));
        return cache.addAll(localAppShellUrls);
      })
      .catch(error => {
        console.error('Failed to cache app shell during install:', error);
      })
  );
});

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
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore Supabase API calls and non-GET requests. Let the browser handle them.
  if (request.method !== 'GET' || url.hostname.includes('supabase.co')) {
    return;
  }

  // Strategy 1: Network-First for navigation requests (the app's HTML page).
  // This is crucial for authentication state consistency.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // If the fetch is successful, cache the response for offline use.
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              // For navigation, we cache the request for the specific path,
              // but we'll fall back to '/index.html'.
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If the network fails, serve the main index.html from the cache.
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  // Strategy 2: Cache-First for all other static assets (CSS, JS, images, fonts).
  // This is good for performance as they are served instantly from the cache.
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Return the cached response if it exists.
      if (cachedResponse) {
        return cachedResponse;
      }
      // Otherwise, fetch from the network.
      return fetch(request).then(networkResponse => {
        // Cache the new response for future use if it's a valid response.
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

// Listener for SKIP_WAITING message to allow the app to update immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
