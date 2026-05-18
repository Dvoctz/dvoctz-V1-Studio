
import React, { useEffect, useState, useCallback } from 'react';

export const ServiceWorkerManager: React.FC = () => {
  useEffect(() => {
    const cleanupPWA = async () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          // 1. Unregister all service workers
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            console.log('Unregistering Service Worker:', registration);
            await registration.unregister();
          }

          // 2. Clear all caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              console.log('Deleting Cache:', cacheName);
              await caches.delete(cacheName);
            }
          }

          console.log('PWA system disabled and cleaned up successfully.');
          
          // Optionally, force a reload if we found and removed something to ensure fresh load
          if (registrations.length > 0) {
              window.location.reload();
          }
        } catch (error) {
          console.error('Error during PWA cleanup:', error);
        }
      }
    };

    cleanupPWA();
  }, []);

  return null;
};
