
import React from 'react';

interface AddToHomeScreenPromptProps {
  onClose: () => void;
}

export const AddToHomeScreenPrompt: React.FC<AddToHomeScreenPromptProps> = ({ onClose }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary/95 backdrop-blur-xl p-4 pb-6 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 animate-slide-up sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md sm:rounded-3xl sm:border sm:pb-4 group">
       <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-glow opacity-50 sm:rounded-t-3xl sm:opacity-100"></div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media (min-width: 640px) {
            @keyframes slide-up-md {
              from { transform: translate(-50%, 150%); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
            .animate-slide-up { animation: slide-up-md 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        }
      `}</style>
      
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#806B2A] rounded-2xl p-0.5 flex-shrink-0 shadow-glow relative overflow-hidden">
            <div className="w-full h-full bg-primary rounded-[14px] flex items-center justify-center relative">
                 <img src="/icon-192.svg" alt="App Icon" className="w-10 h-10 object-contain z-10" />
                 <div className="absolute inset-0 bg-[#D4AF37]/20 blur-md rounded-full"></div>
            </div>
        </div>
        
        <div className="flex-grow pt-1">
          <h3 className="font-black text-white text-sm uppercase tracking-widest leading-none mb-1.5 flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-full bg-[#D4AF37]"></span>
              Add to Home Screen
          </h3>
          <p className="text-slate-300 text-xs font-medium leading-relaxed pr-2">
            Get the full premium app experience. Tap 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block mx-1.5 text-[#D4AF37] align-sub">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            and select <span className="text-white font-bold">'Add to Home Screen'</span>.
          </p>
        </div>
        
        <button onClick={onClose} className="text-white/40 hover:text-white transition-all ml-2 flex-shrink-0 p-2 hover:bg-white/10 rounded-full relative z-10 -mr-2">
          <span className="sr-only">Close</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
