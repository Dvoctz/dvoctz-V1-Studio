

import React, { useState, useMemo } from 'react';
// FIX: Replaced useSportsData with useSports and updated the import path.
import { useSports } from '../context/SportsDataContext';
import type { Tournament } from '../types';

interface TournamentsViewProps {
  onSelectTournament: (tournament: Tournament) => void;
}

const TournamentCard: React.FC<{ tournament: Tournament; onSelect: () => void; }> = ({ tournament, onSelect }) => (
  <div 
    className="bg-secondary p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transform transition-all duration-300 cursor-pointer flex items-center justify-between"
    onClick={onSelect}
  >
    <div>
        <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
        <p className="text-sm text-highlight">{tournament.division}</p>
    </div>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </div>
);

export const TournamentsView: React.FC<TournamentsViewProps> = ({ onSelectTournament }) => {
  const [activeTab, setActiveTab] = useState<'d1' | 'd2'>('d1');
  const [searchTerm, setSearchTerm] = useState('');
  const { getTournamentsByDivision } = useSports();
  
  const division1Tournaments = useMemo(() => {
    return getTournamentsByDivision('Division 1').filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [getTournamentsByDivision, searchTerm]);

  const division2Tournaments = useMemo(() => {
    return getTournamentsByDivision('Division 2').filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [getTournamentsByDivision, searchTerm]);
  
  const displayedTournaments = activeTab === 'd1' ? division1Tournaments : division2Tournaments;

  const renderTabs = () => (
    <div className="flex border-b border-accent mb-6">
      <button 
        onClick={() => setActiveTab('d1')}
        className={`px-6 py-3 text-lg font-semibold transition-colors duration-300 ${activeTab === 'd1' ? 'text-highlight border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
      >
        Division 1
      </button>
      <button 
        onClick={() => setActiveTab('d2')}
        className={`px-6 py-3 text-lg font-semibold transition-colors duration-300 ${activeTab === 'd2' ? 'text-highlight border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
      >
        Division 2
      </button>
    </div>
  );

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-center mb-8">Tournaments</h1>
      <div className="mb-8 max-w-lg mx-auto">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary p-3 pl-10 rounded-lg border border-accent focus:ring-highlight focus:border-highlight transition-colors"
            aria-label="Search tournaments"
          />
        </div>
      </div>
      {renderTabs()}
      {displayedTournaments.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTournaments.map(t => (
            <TournamentCard key={t.id} tournament={t} onSelect={() => onSelectTournament(t)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-text-secondary text-lg">No tournaments found matching your search.</p>
        </div>
      )}
    </div>
  );
};