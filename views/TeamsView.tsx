
import React from 'react';
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
    <img src={team.logoUrl} alt={`${team.name} logo`} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-accent" />
    <h3 className="text-lg font-bold text-white">{team.name}</h3>
    <p className="text-sm text-highlight">{team.division}</p>
  </div>
);

export const TeamsView: React.FC<TeamsViewProps> = ({ onSelectTeam }) => {
  const { teams } = useSports();

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-center mb-8">Teams</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {teams.map(team => (
          <TeamCard key={team.id} team={team} onSelect={() => onSelectTeam(team)} />
        ))}
      </div>
    </div>
  );
};
