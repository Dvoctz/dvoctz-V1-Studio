
import React from 'react';

interface AddToHomeScreenPromptProps {
  onClose: () => void;
}

export const AddToHomeScreenPrompt: React.FC<AddToHomeScreenPromptProps> = ({ onClose }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-secondary p-4 pb-5 shadow-[0_-5px_15px_rgba(0,0,0,0.2)] z-50 animate-slide-up md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md md:rounded-lg">
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
        @media (min-width: 768px) {
            @keyframes slide-up-md {
              from { transform: translate(-50%, 120%); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
            .animate-slide-up { animation: slide-up-md 0.4s ease-out forwards; }
        }
      `}</style>
      <div className="flex items-start">
        <img src="/icon-192.svg" alt="App Icon" className="w-12 h-12 mr-4 rounded-lg bg-primary p-1 flex-shrink-0" />
        <div className="flex-grow">
          <h3 className="font-bold text-white">Add to Home Screen</h3>
          <p className="text-text-secondary text-sm mt-1 leading-tight">
            For a full-screen experience, tap the Share icon 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mx-1 text-highlight align-text-bottom">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            and then 'Add to Home Screen'.
          </p>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors ml-4 flex-shrink-0 p-1 -mt-1 -mr-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
