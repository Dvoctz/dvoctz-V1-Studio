
// Temporary service worker to disable PWA and clear all caches
self.addEventListener('install', (event) => {
  // Immediately take over to process activate event
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Clear ALL existing caches
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW Disabler] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Unregister the service worker itself
      return self.registration.unregister();
    }).then(() => {
      console.log('[SW Disabler] Service Worker successfully unregistered.');
      // Claim clients to take effect immediately
      return self.clients.claim();
    }).catch(error => {
      console.error('[SW Disabler] Error during activation cleanup:', error);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Empty fetch handler to prevent any interception/caching
  // The browser will handle requests natively via network
});
