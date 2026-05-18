import React, { useState, useMemo } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import type { Club } from '../types';

interface ClubsViewProps {
  onSelectClub: (club: Club) => void;
}

const ClubCardSkeleton: React.FC = () => (
    <div className="bg-secondary/40 p-6 rounded-2xl shadow-md text-center animate-pulse border border-accent/20">
        <div className="w-28 h-28 rounded-full mx-auto mb-4 border-[6px] border-accent/50 bg-primary"></div>
        <div className="h-6 w-3/4 mx-auto bg-accent/50 rounded-full"></div>
    </div>
);


const ClubCard: React.FC<{ club: Club, onSelect: () => void }> = ({ club, onSelect }) => (
  <div 
    onClick={onSelect}
    className="bg-gradient-to-b from-secondary to-primary p-6 rounded-2xl shadow-lg border border-accent/40 transform hover:-translate-y-2 hover:shadow-premium transition-all duration-300 cursor-pointer group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-highlight/0 group-hover:bg-highlight/5 transition-colors duration-500 pointer-events-none"></div>
    <div className="relative p-1 rounded-full w-28 h-28 mx-auto mb-5 shadow-inner transition-transform duration-500 group-hover:scale-110">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent to-slate-400 group-hover:from-[#D4AF37] group-hover:to-yellow-500 transition-colors animate-pulse"></div>
        <div className="relative bg-primary w-full h-full rounded-full overflow-hidden border-2 border-primary">
            {club.logoUrl ? (
              <img src={club.logoUrl} alt={`${club.name} logo`} className="w-full h-full object-cover bg-white" />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-3xl font-black text-white mix-blend-overlay">{club.name.substring(0, 1)}</span>
              </div>
            )}
        </div>
    </div>
    <h3 className="text-xl font-black text-white text-center group-hover:text-highlight transition-colors drop-shadow-md tracking-wide line-clamp-2">{club.name}</h3>
  </div>
);

export const ClubsView: React.FC<ClubsViewProps> = ({ onSelectClub }) => {
  const { data: clubs, loading } = useEntityData('clubs');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClubs = useMemo(() => (clubs || []).filter(club => {
      return club.name.toLowerCase().includes(searchTerm.toLowerCase());
  }), [clubs, searchTerm]);

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-4xl md:text-5xl font-black text-center mb-4 tracking-tight drop-shadow-md uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">Clubs Directory</h1>
      <p className="text-center text-text-secondary mb-10 max-w-xl mx-auto text-sm uppercase tracking-widest font-bold">Discover the prestigious organizations competing in our leagues.</p>

      <div className="mb-12 max-w-xl mx-auto">
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary group-focus-within:text-highlight transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search clubs by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/80 p-4 pl-12 rounded-full border border-accent/50 focus:ring-2 focus:ring-highlight focus:border-highlight transition-all outline-none font-medium shadow-inner"
            aria-label="Search clubs"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => <ClubCardSkeleton key={i} />)}
        </div>
      ) : filteredClubs.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredClubs.map(club => (
             <ClubCard key={club.id} club={club} onSelect={() => onSelectClub(club)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-secondary/30 rounded-2xl border border-accent/20 max-w-2xl mx-auto">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-accent mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
           </svg>
          <p className="text-text-secondary text-lg font-medium tracking-wide">No clubs found matching your search.</p>
        </div>
      )}
    </div>
  );
};