import React from 'react';
import { useSports } from '../context/SportsDataContext';

export const Footer: React.FC = () => {
  const { getGlobalSponsors } = useSports();
  const globalSponsors = getGlobalSponsors();

  return (
    <footer className="bg-secondary border-t border-accent py-8">
      <div className="container mx-auto px-4">
        <h3 className="text-center text-lg font-semibold text-text-secondary mb-6">Our Valued Sponsors</h3>
        <div className="flex flex-wrap items-center justify-center gap-16">
            {globalSponsors.length > 0 ? (
                globalSponsors.map((sponsor) => (
                  sponsor.logoUrl ? (
                    <a key={sponsor.id} href={sponsor.website} target="_blank" rel="noopener noreferrer">
                      <img src={sponsor.logoUrl} alt={sponsor.name} className="h-16 max-w-[180px] object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                    </a>
                  ) : null
                ))
            ) : (
                <p className="text-sm text-text-secondary">Your logo could be here! Contact us for sponsorship opportunities.</p>
            )}
        </div>
         <div className="text-center text-text-secondary mt-8 text-sm">
            &copy; 2025 DVOCTZ. Powered By ZAP. All rights reserved.
        </div>
      </div>
    </footer>
  );
};