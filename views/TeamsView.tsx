
import React, { useState } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Team } from '../types';

interface TeamsViewProps {
  onSelectTeam: (team: Team) => void;
}

const TeamCard: React.FC<{ team: Team, onSelect: () => void }> = ({ team, onSelect }) => (
  <div 
    onClick={onSelect}
    className="bg-secondary p-4 rounded-lg shadow-md text-center transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
  >
    {team.logoUrl ? (
      <img src={team.logoUrl} alt={`${team.name} logo`} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-accent object-cover" />
    ) : (
      <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-accent bg-accent flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" />
        </svg>
      </div>
    )}
    <h3 className="text-lg font-bold text-white">{team.name}</h3>
    <p className="text-sm text-highlight">{team.division}</p>
  </div>
);

export const TeamsView: React.FC<TeamsViewProps> = ({ onSelectTeam }) => {
  const { teams } = useSports();
  const [activeDivision, setActiveDivision] = useState<'all' | 'Division 1' | 'Division 2'>('all');

  const filteredTeams = teams.filter(team => {
      if (activeDivision === 'all') return true;
      return team.division === activeDivision;
  });

  const renderTabs = () => (
    <div className="flex justify-center border-b border-accent mb-8">
        <button
            onClick={() => setActiveDivision('all')}
            className={`px-6 py-3 text-lg font-semibold transition-colors duration-300 ${activeDivision === 'all' ? 'text-highlight border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
        >
            All Teams
        </button>
        <button
            onClick={() => setActiveDivision('Division 1')}
            className={`px-6 py-3 text-lg font-semibold transition-colors duration-300 ${activeDivision === 'Division 1' ? 'text-highlight border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
        >
            Division 1
        </button>
        <button
            onClick={() => setActiveDivision('Division 2')}
            className={`px-6 py-3 text-lg font-semibold transition-colors duration-300 ${activeDivision === 'Division 2' ? 'text-highlight border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
        >
            Division 2
        </button>
    </div>
  );

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-center mb-8">Teams</h1>
      {renderTabs()}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredTeams.map(team => (
          <TeamCard key={team.id} team={team} onSelect={() => onSelectTeam(team)} />
        ))}
      </div>
    </div>
  );
};
