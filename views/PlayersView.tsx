
import React, { useState, useMemo } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import type { Player } from '../types';

const PlayerCardSkeleton: React.FC = () => (
    <div className="bg-secondary rounded-lg shadow-lg overflow-hidden animate-pulse">
        <div className="h-48 bg-accent"></div>
        <div className="p-4">
            <div className="h-5 bg-accent rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-accent rounded w-1/2"></div>
            <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="space-y-1"><div className="h-4 bg-accent rounded"></div><div className="h-3 bg-accent rounded"></div></div>
                <div className="space-y-1"><div className="h-4 bg-accent rounded"></div><div className="h-3 bg-accent rounded"></div></div>
                <div className="space-y-1"><div className="h-4 bg-accent rounded"></div><div className="h-3 bg-accent rounded"></div></div>
                <div className="space-y-1"><div className="h-4 bg-accent rounded"></div><div className="h-3 bg-accent rounded"></div></div>
            </div>
        </div>
    </div>
);

const PlayerCard: React.FC<{ player: Player; onSelect: () => void; }> = ({ player, onSelect }) => {
    const { getTeamById, getClubById } = useSports();
    const team = getTeamById(player.teamId);
    const club = getClubById(player.clubId);

    let affiliationText = 'Free Agent';
    if (team) {
        affiliationText = team.name;
    } else if (club) {
        affiliationText = `${club.name} (Unassigned)`;
    }

    return (
        <div onClick={onSelect} className="bg-secondary rounded-lg shadow-lg overflow-hidden text-center group cursor-pointer">
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
                <p className="text-sm text-text-secondary">Team: <span className={`font-semibold ${team ? 'text-text-primary' : club ? 'text-yellow-400' : 'text-text-secondary'}`}>{affiliationText}</span></p>
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

export const PlayersView: React.FC<{onSelectPlayer: (player: Player) => void;}> = ({ onSelectPlayer }) => {
  const { data: players, loading: playersLoading } = useEntityData('players');
  const { loading: teamsLoading } = useEntityData('teams');
  const { loading: clubsLoading } = useEntityData('clubs');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'freeAgents'>('all');

  const filteredPlayers = useMemo(() => {
      let playerList = players || [];
      if (activeTab === 'freeAgents') {
          // Only players WITHOUT a club are free agents.
          // Players with a club but no team are in the "Club Pool", not Free Agents.
          playerList = playerList.filter(p => p.clubId === null);
      }
      return playerList.filter(player => {
        return player.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [players, searchTerm, activeTab]);

  const TabButton: React.FC<{ tab: 'all' | 'freeAgents'; children: React.ReactNode }> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-3 text-lg font-semibold transition-colors duration-300 focus:outline-none ${activeTab === tab ? 'text-highlight border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
    >
      {children}
    </button>
  );

  const isLoading = playersLoading || teamsLoading || clubsLoading;

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

       <div className="flex border-b border-accent mb-6 justify-center">
            <TabButton tab="all">All Players</TabButton>
            <TabButton tab="freeAgents">Free Agents</TabButton>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <PlayerCardSkeleton key={i} />)}
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlayers.map(player => (
            <PlayerCard key={player.id} player={player} onSelect={() => onSelectPlayer(player)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-text-secondary text-lg">
            {activeTab === 'freeAgents' 
              ? 'There are currently no true free agents (players without a club).' 
              : 'No players found matching your search.'
            }
          </p>
        </div>
      )}
    </div>
  );
};
