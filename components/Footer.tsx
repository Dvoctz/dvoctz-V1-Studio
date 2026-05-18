import React from 'react';
import { useSports } from '../context/SportsDataContext';

const FooterContent = () => (
    <div className="flex flex-col items-center justify-center">
        <div className="flex items-center space-x-2 mb-4 group cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
            </svg>
            <span className="text-xl font-black text-white tracking-widest leading-none drop-shadow-sm uppercase">DVOC <span className="text-highlight">TZ</span></span>
        </div>
        <div className="text-center text-text-secondary text-xs uppercase tracking-widest font-bold">
            &copy; 2026 DVOC TANZANIA.
        </div>
        <div className="mt-2 text-center text-text-secondary/50 text-[10px] uppercase tracking-widest">
            Powered By ZAP.
        </div>
    </div>
);

export const Footer: React.FC = () => {
  const { sponsors } = useSports();
  const footerSponsors = sponsors.filter(s => s.showInFooter);

  if (footerSponsors.length === 0) {
    return (
      <footer className="bg-primary/50 border-t border-white/5 py-12 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <FooterContent />
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-primary/80 border-t border-white/5 py-16 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-32 bg-[#D4AF37]/5 blur-3xl pointer-events-none rounded-t-full"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-full inline-block bg-[#D4AF37]/10">Official Partners</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 mb-16">
            {footerSponsors.map((sponsor) => (
              sponsor.logoUrl ? (
                <a key={sponsor.id} href={sponsor.website} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 group-hover:border-[#D4AF37]/30 group-hover:bg-white/10 transition-all duration-300">
                    <img src={sponsor.logoUrl} alt={sponsor.name} className="h-12 md:h-16 w-auto max-w-[150px] md:max-w-[180px] object-contain grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105" />
                  </div>
                </a>
              ) : null
            ))}
        </div>
        
        <div className="border-t border-white/5 pt-8">
            <FooterContent />
        </div>
      </div>
    </footer>
  );
};