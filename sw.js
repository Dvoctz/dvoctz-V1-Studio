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
  );
});

self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || !isCacheable(event.request)) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
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
    // Cache local assets and the CDN font file
    return url.origin === self.location.origin || url.hostname === 'rsms.me';
}
