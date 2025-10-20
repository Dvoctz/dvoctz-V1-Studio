import React from 'react';
// FIX: Replaced useSportsData with useSports and updated the import path.
import { useSports } from '../context/SportsDataContext';

export const Footer: React.FC = () => {
  const { sponsors } = useSports();

  return (
    <footer className="bg-secondary border-t border-accent py-8">
      <div className="container mx-auto px-4">
        <h3 className="text-center text-lg font-semibold text-text-secondary mb-6">Our Valued Sponsors</h3>
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {sponsors.concat(sponsors).map((sponsor, index) => (
              <a key={`${sponsor.id}-${index}`} href={sponsor.website} target="_blank" rel="noopener noreferrer" className="mx-8 flex-shrink-0">
                <img src={sponsor.logoUrl} alt={sponsor.name} className="h-12 max-w-[150px] object-contain grayscale hover:grayscale-0 transition-all duration-300" />
              </a>
            ))}
          </div>
        </div>
        {/* FIX: Removed the 'jsx' prop from the <style> tag. This is `styled-jsx` syntax which is not standard in this React project and was causing a TypeScript error. */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
        `}</style>
         <div className="text-center text-text-secondary mt-8 text-sm">
            &copy; 2025 DVOCTZ. Powered By ZAP. All rights reserved.
        </div>
      </div>
    </footer>
  );
};