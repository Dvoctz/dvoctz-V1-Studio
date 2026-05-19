import React, { useState, useMemo } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import type { Tournament } from '../types';

interface TournamentsViewProps {
  onSelectTournament: (tournament: Tournament) => void;
}

const TournamentCard: React.FC<{ tournament: Tournament; onSelect: () => void; }> = ({ tournament, onSelect }) => {
    const isDiv1 = tournament.division === 'Division 1';
    
    return (
      <div 
        className="bg-secondary/60 p-8 rounded-2xl shadow-lg border border-accent/40 backdrop-blur-sm group cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-premium"
        onClick={onSelect}
      >
        <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${isDiv1 ? 'from-[#D4AF37]/10 to-transparent' : 'from-slate-300/10 to-transparent'}`}></div>
        
        <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
                <div className={`flex items-center gap-2 mb-3`}>
                    <span className={`w-2 h-2 rounded-full ${tournament.phase === 'completed' ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">{tournament.phase || 'Ongoing'}</span>
                </div>
                <h3 className="text-2xl font-black text-white group-hover:text-highlight transition-colors tracking-wide mb-1">{tournament.name}</h3>
                <p className={`text-sm font-semibold tracking-widest uppercase ${isDiv1 ? 'text-[#D4AF37]' : 'text-slate-400'}`}>{tournament.division}</p>
            </div>
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center transform group-hover:translate-x-2 transition-all duration-300 ${isDiv1 ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-slate-500/30 bg-slate-500/10 text-slate-300'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
      </div>
    );
};

export const TournamentsView: React.FC<TournamentsViewProps> = ({ onSelectTournament }) => {
  const [activeTab, setActiveTab] = useState<'d1' | 'd2'>('d1');
  const [searchTerm, setSearchTerm] = useState('');
  const { getTournamentsByDivision } = useSports();
  const { data: tournaments, loading } = useEntityData('tournaments');
  
  const division1Tournaments = useMemo(() => {
    return getTournamentsByDivision('Division 1').filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [getTournamentsByDivision, searchTerm, tournaments]); // Add tournaments dependency

  const division2Tournaments = useMemo(() => {
    return getTournamentsByDivision('Division 2').filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [getTournamentsByDivision, searchTerm, tournaments]); // Add tournaments dependency
  
  const displayedTournaments = activeTab === 'd1' ? division1Tournaments : division2Tournaments;

  const renderTabs = () => (
    <div className="flex border-b border-white/10 mb-8 max-w-2xl mx-auto">
      <button 
        onClick={() => setActiveTab('d1')}
        className={`flex-1 py-4 text-center text-sm uppercase tracking-widest font-black transition-all duration-300 ${activeTab === 'd1' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-highlight/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
      >
        Division 1
      </button>
      <button 
        onClick={() => setActiveTab('d2')}
        className={`flex-1 py-4 text-center text-sm uppercase tracking-widest font-black transition-all duration-300 ${activeTab === 'd2' ? 'text-slate-300 border-b-2 border-slate-300 bg-slate-500/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
      >
        Division 2
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-4xl md:text-5xl font-black text-center mb-4 tracking-tight drop-shadow-md uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">Tournaments</h1>
      <p className="text-center text-slate-400 mb-10 max-w-xl mx-auto text-sm uppercase tracking-widest font-bold">Select a tournament to view standings, fixtures, and teams.</p>
      
      <div className="mb-10 max-w-xl mx-auto">
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-5">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 group-focus-within:text-[#D4AF37] transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/60 backdrop-blur-md p-4 pl-14 rounded-full border border-white/5 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all outline-none font-bold text-white shadow-inner"
            aria-label="Search tournaments"
          />
        </div>
      </div>
      
      {renderTabs()}
      
      {loading ? (
        <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
        </div>
      ) : displayedTournaments.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTournaments.map(t => (
            <TournamentCard key={t.id} tournament={t} onSelect={() => onSelectTournament(t)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-primary/40 rounded-3xl border border-dashed border-white/10 max-w-2xl mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[#D4AF37]/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No tournaments found matching your search.</p>
        </div>
      )}
    </div>
  );
};