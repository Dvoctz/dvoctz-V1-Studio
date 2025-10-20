
import React from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Team, Player } from '../types';

interface TeamDetailViewProps {
  team: Team;
  onBack: () => void;
}

const PlayerRow: React.FC<{ player: Player }> = ({ player }) => (
    <div className="flex items-center p-4 bg-secondary rounded-lg hover:bg-accent transition-colors duration-200">
        <img src={player.photoUrl} alt={player.name} className="w-12 h-12 rounded-full object-cover mr-4" />
        <div>
            <p className="font-bold text-white text-lg">{player.name}</p>
            <p className="text-sm text-highlight">{player.role}</p>
        </div>
    </div>
);

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({ team, onBack }) => {
  const { getPlayersByTeam } = useSports();
  const teamPlayers = getPlayersByTeam(team.id);

  return (
    <div>
      <button onClick={onBack} className="flex items-center space-x-2 text-text-secondary hover:text-highlight mb-6 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Teams</span>
      </button>

      <div className="flex flex-col items-center text-center mb-8">
        <img src={team.logoUrl} alt={`${team.name} logo`} className="w-32 h-32 rounded-full mb-4 border-4 border-accent" />
        <h1 className="text-4xl font-extrabold">{team.name}</h1>
        <p className="text-highlight font-semibold">{team.division}</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Player Roster</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamPlayers.length > 0 ? (
            teamPlayers.map(player => <PlayerRow key={player.id} player={player} />)
          ) : (
            <p className="text-center text-text-secondary md:col-span-2 lg:col-span-3">No players registered for this team yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
