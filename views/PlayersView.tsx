
import React from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Player } from '../types';

const PlayerCard: React.FC<{ player: Player }> = ({ player }) => {
    const { getTeamById } = useSports();
    const team = getTeamById(player.teamId);

    return (
        <div className="bg-secondary rounded-lg shadow-lg overflow-hidden text-center group">
            <div className="relative">
                <img src={player.photoUrl} alt={player.name} className="w-full h-48 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4">
                     <h3 className="text-xl font-bold text-white">{player.name}</h3>
                     <p className="text-sm text-highlight font-semibold">{player.role}</p>
                </div>
            </div>
             <div className="p-4">
                <p className="text-sm text-text-secondary">Team: <span className="font-semibold text-text-primary">{team?.name || 'N/A'}</span></p>
                 <div className="grid grid-cols-4 gap-2 mt-3 text-xs text-text-secondary">
                    <div>
                        <span className="font-bold text-white block">{player.stats.matches}</span>
                        <span>Matches</span>
                    </div>
                    <div>
                        <span className="font-bold text-white block">{player.stats.aces}</span>
                        <span>Aces</span>
                    </div>
                     <div>
                        <span className="font-bold text-white block">{player.stats.kills}</span>
                        <span>Kills</span>
                    </div>
                    <div>
                        <span className="font-bold text-white block">{player.stats.blocks}</span>
                        <span>Blocks</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PlayersView: React.FC = () => {
  const { players } = useSports();

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-center mb-8">Players</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
};
