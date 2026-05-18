import React, { useState, useMemo } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import type { Club } from '../types';

interface ClubsViewProps {
  onSelectClub: (club: Club) => void;
}

const ClubCardSkeleton: React.FC = () => (
    <div className="bg-secondary/40 backdrop-blur-md p-6 rounded-3xl shadow-lg text-center animate-pulse border border-white/5">
        <div className="w-28 h-28 rounded-full mx-auto mb-6 bg-primary/80"></div>
        <div className="h-4 w-3/4 mx-auto bg-white/10 rounded-full mb-3"></div>
        <div className="h-3 w-1/2 mx-auto bg-white/5 rounded-full"></div>
    </div>
);


const ClubCard: React.FC<{ club: Club, onSelect: () => void }> = ({ club, onSelect }) => (
  <div 
    onClick={onSelect}
    className="bg-secondary/40 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/5 text-center transform hover:-translate-y-2 hover:shadow-2xl hover:bg-white/5 hover:border-[#D4AF37]/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    
    <div className="relative z-10">
        <div className="w-28 h-28 mx-auto mb-6 relative group-hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 bg-[#D4AF37] opacity-20 group-hover:opacity-40 blur-xl rounded-full transition-opacity duration-300"></div>
            {club.logoUrl ? (
                <img src={club.logoUrl} alt={`${club.name} logo`} className="w-full h-full rounded-full border-[3px] border-white/10 group-hover:border-[#D4AF37]/50 object-cover relative z-10 bg-primary shadow-xl grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
            ) : (
                <div className="w-full h-full rounded-full border-[3px] border-white/10 group-hover:border-[#D4AF37]/50 bg-primary flex items-center justify-center relative z-10 shadow-xl transition-colors duration-300">
                    <span className="text-4xl font-black text-slate-500 group-hover:text-[#D4AF37] transition-colors">{club.name.substring(0, 1)}</span>
                </div>
            )}
        </div>
        <h3 className="text-xl font-black text-white text-center group-hover:text-[#D4AF37] transition-colors drop-shadow-md uppercase tracking-wider mb-2">{club.name}</h3>
        <p className="text-[10px] text-slate-400 font-bold tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">View Details</p>
    </div>
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
      <h1 className="text-4xl md:text-5xl font-black text-center mb-4 tracking-tight drop-shadow-md uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">Club Database</h1>
      <p className="text-center text-slate-400 mb-10 max-w-xl mx-auto text-sm uppercase tracking-widest font-bold">Discover the prestigious organizations competing in our leagues.</p>

      <div className="mb-12 max-w-xl mx-auto">
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-5">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 group-focus-within:text-[#D4AF37] transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search clubs by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/60 backdrop-blur-md p-4 pl-14 rounded-full border border-white/5 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all outline-none font-bold text-white shadow-inner"
            aria-label="Search clubs"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {Array.from({ length: 8 }).map((_, i) => <ClubCardSkeleton key={i} />)}
        </div>
      ) : filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {filteredClubs.map(club => (
             <ClubCard key={club.id} club={club} onSelect={() => onSelectClub(club)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-primary/40 rounded-3xl border border-dashed border-white/10 max-w-2xl mx-auto">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[#D4AF37]/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
           </svg>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No clubs found matching your search.</p>
        </div>
      )}
    </div>
  );
};