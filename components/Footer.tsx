import React from 'react';
import { useSports } from '../context/SportsDataContext';

export const Footer: React.FC = () => {
  const { sponsors } = useSports();
  const footerSponsors = sponsors.filter(s => s.showInFooter);

  // If no sponsors are marked for the footer, render a simpler footer
  // to avoid having the "Our Valued Sponsors" header with nothing under it.
  if (footerSponsors.length === 0) {
    return (
      <footer className="bg-secondary border-t border-accent py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-text-secondary text-sm">
            &copy; 2025 DVOCTZ. Powered By ZAP. All rights reserved.
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-secondary border-t border-accent py-8">
      <div className="container mx-auto px-4">
        <h3 className="text-center text-lg font-semibold text-text-secondary mb-6">Our Valued Sponsors</h3>
        <div className="flex flex-wrap items-center justify-center gap-16">
            {footerSponsors.map((sponsor) => (
              sponsor.logoUrl ? (
                <a key={sponsor.id} href={sponsor.website} target="_blank" rel="noopener noreferrer">
                  <img src={sponsor.logoUrl} alt={sponsor.name} className="h-16 max-w-[180px] object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                </a>
              ) : null
            ))}
        </div>
         <div className="text-center text-text-secondary mt-8 text-sm">
            &copy; 2025 DVOCTZ. Powered By ZAP. All rights reserved.
        </div>
      </div>
    </footer>
  );
};