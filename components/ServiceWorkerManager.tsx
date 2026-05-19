
import React, { useEffect } from 'react';

export const ServiceWorkerManager: React.FC = () => {
  useEffect(() => {
    // ONE-TIME CLEANUP SCRIPT TO UNREGISTER SERVICE WORKER AND CLEAR CACHE
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log('[SW Cleanup] Unregistered old service worker.');
              }
            }).catch((err) => {
                console.error('[SW Cleanup] Failed to unregister service worker:', err);
            });
          }
        });
      }

      if ('caches' in window) {
        caches.keys().then((keyList) => {
          return Promise.all(
            keyList.map((key) => {
              console.log('[SW Cleanup] Deleted old cache:', key);
              return caches.delete(key);
            })
          );
        }).catch((err) => {
            console.error('[SW Cleanup] Failed to clear caches:', err);
        });
      }
    }
  }, []);

  return null;
};
