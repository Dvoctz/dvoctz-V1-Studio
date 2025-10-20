import React, { useState } from 'react';
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
  const { getTournamentsByDivision } = useSports();

  const division1Tournaments = getTournamentsByDivision('Division 1');
  const division2Tournaments = getTournamentsByDivision('Division 2');

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
      {renderTabs()}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(activeTab === 'd1' ? division1Tournaments : division2Tournaments).map(t => (
          <TournamentCard key={t.id} tournament={t} onSelect={() => onSelectTournament(t)} />
        ))}
      </div>
    </div>
  );
};