
import React, { useEffect, useState } from 'react';

export const ServiceWorkerManager: React.FC = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        setRegistration(reg);
        
        // If there's a waiting worker (e.g. from previous load), an update is ready
        if (reg.waiting) {
            setIsUpdateAvailable(true);
        }

        // Listen for new updates found during this session
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker == null) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                setIsUpdateAvailable(true);
              }
            }
          };
        };
      }).catch(err => console.error('SW Registration failed:', err));

      // Reload when the new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
      });
    }
  }, []);

  const updateApp = () => {
    if (registration && registration.waiting) {
        // Send message to SW to skip waiting and activate immediately
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-secondary border border-highlight p-4 rounded-lg shadow-2xl z-[100] flex flex-col gap-2 animate-fade-in-up">
         <style>{`
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        `}</style>
        <div className="flex items-start">
             <div className="bg-highlight/20 p-2 rounded-full mr-3 text-highlight flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
             </div>
             <div>
                <h4 className="font-bold text-white">Update Available</h4>
                <p className="text-sm text-text-secondary mt-1">A new version of the app is available. Update now to see the latest changes.</p>
             </div>
        </div>
        <div className="flex justify-end gap-3 mt-2">
            <button onClick={() => setIsUpdateAvailable(false)} className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-white transition-colors">Dismiss</button>
            <button onClick={updateApp} className="px-4 py-1.5 text-sm font-bold bg-highlight text-white rounded hover:bg-teal-400 transition-colors shadow-lg">Update Now</button>
        </div>
    </div>
  );
};
