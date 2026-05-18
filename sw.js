
// Service Worker Uninstallation Script
// This script clears all caches and unregisters itself to ensure clients load fresh assets.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Uninstallation: Deleting cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Uninstallation: All caches cleared. Unregistering...');
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    })
  );
});

// Pass through all requests to the network
self.addEventListener('fetch', (event) => {
  return; // Do nothing, let the browser handle it
});
