const CACHE_NAME = 'dvoc-tanzania-cache-v3'; // Increment version to force update
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

  // Ignore Supabase API calls and non-GET requests entirely.
  if (request.method !== 'GET' || url.hostname.includes('supabase.co')) {
    return;
  }

  // Use Stale-While-Revalidate for app shell resources
  if (APP_SHELL_URLS.map(u => new URL(u, self.location.origin).pathname).includes(url.pathname) || request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request.mode === 'navigate' ? '/index.html' : request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // This catch is for when the network request itself fails.
            // If we have a cached response, we've already returned it.
            // If not, the user will see the browser's offline page.
          });
          // Return cached response immediately if available, while the network fetch happens in the background.
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Use Cache First for other static assets (e.g., images)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
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