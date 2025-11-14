


import React, { useState } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Player } from '../types';

const PlayerCard: React.FC<{ player: Player }> = ({ player }) => {
    const { getTeamById } = useSports();
    const team = getTeamById(player.teamId);

    return (
        <div className="bg-secondary rounded-lg shadow-lg overflow-hidden text-center group">
            <div className="relative h-48 bg-accent flex items-center justify-center">
                {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
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
                        <span className="font-bold text-white block">{player.stats?.matches ?? 0}</span>
                        <span>Matches</span>
                    </div>
                    <div>
                        <span className="font-bold text-white block">{player.stats?.aces ?? 0}</span>
                        <span>Aces</span>
                    </div>
                     <div>
                        <span className="font-bold text-white block">{player.stats?.kills ?? 0}</span>
                        <span>Kills</span>
                    </div>
                    <div>
                        <span className="font-bold text-white block">{player.stats?.blocks ?? 0}</span>
                        <span>Blocks</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PlayersView: React.FC = () => {
  const { players } = useSports();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-center mb-8">Players</h1>
      <div className="mb-8 max-w-lg mx-auto">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search players by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary p-3 pl-10 rounded-lg border border-accent focus:ring-highlight focus:border-highlight transition-colors"
            aria-label="Search players"
          />
        </div>
      </div>
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlayers.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-text-secondary text-lg">No players found matching your search.</p>
        </div>
      )}
    </div>
  );
};