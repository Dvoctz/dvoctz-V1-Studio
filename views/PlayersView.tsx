
import React, { useState, useMemo } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Player } from '../types';

const PlayerCardSkeleton: React.FC = () => (
    <div className="bg-secondary/40 backdrop-blur-md rounded-3xl shadow-lg overflow-hidden animate-pulse border border-white/5">
        <div className="h-56 bg-primary/80"></div>
        <div className="p-5">
            <div className="h-6 bg-white/10 rounded-full w-3/4 mb-3"></div>
            <div className="h-4 bg-white/5 rounded-full w-1/2"></div>
        </div>
        <div className="p-5 border-t border-white/5 bg-secondary/50">
            <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2"><div className="h-5 bg-white/10 rounded-lg"></div><div className="h-3 bg-white/5 rounded-full"></div></div>
                <div className="space-y-2"><div className="h-5 bg-white/10 rounded-lg"></div><div className="h-3 bg-white/5 rounded-full"></div></div>
                <div className="space-y-2"><div className="h-5 bg-white/10 rounded-lg"></div><div className="h-3 bg-white/5 rounded-full"></div></div>
                <div className="space-y-2"><div className="h-5 bg-white/10 rounded-lg"></div><div className="h-3 bg-white/5 rounded-full"></div></div>
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
        <div onClick={onSelect} className="bg-secondary/40 backdrop-blur-md rounded-3xl shadow-lg border border-white/5 overflow-hidden group cursor-pointer hover:-translate-y-2 hover:shadow-glow hover:border-[#D4AF37]/30 transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"></div>
            
            <div className="relative h-56 bg-primary overflow-hidden z-10">
                {/* Background glow pattern behind image */}
                <div className="absolute inset-0 bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/10 transition-colors pointer-events-none"></div>
                {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity bg-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent"></div>
                
                {/* Number or Badge overlay */}
                <div className="absolute top-4 right-4 bg-primary/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#D4AF37] shadow-lg">
                    {player.role || 'Player'}
                </div>

                <div className="absolute bottom-0 left-0 p-5 w-full">
                     <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md group-hover:text-[#D4AF37] transition-colors mb-1 uppercase tracking-wider">{player.name}</h3>
                     <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80">
                        <span className={`${team ? 'text-white' : club ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
                            {affiliationText}
                        </span>
                     </p>
                </div>
            </div>

             <div className="p-5 border-t border-white/5 bg-secondary/50 relative z-10 transition-colors group-hover:bg-secondary/70">
                 <div className="grid grid-cols-4 gap-2 relative text-center">
                    <div className="flex flex-col items-center p-2 rounded-xl bg-primary/40 border border-white/5 group-hover:border-[#D4AF37]/20 transition-colors">
                        <span className="font-black text-lg text-white block leading-none mb-1">{player.stats?.matches ?? 0}</span>
                        <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-slate-400">Games</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-xl bg-primary/40 border border-white/5 group-hover:border-[#D4AF37]/20 transition-colors">
                        <span className="font-black text-lg text-white block leading-none mb-1">{player.stats?.aces ?? 0}</span>
                        <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-slate-400">Aces</span>
                    </div>
                     <div className="flex flex-col items-center p-2 rounded-xl bg-primary/40 border border-white/5 group-hover:border-[#D4AF37]/20 transition-colors">
                        <span className="font-black text-lg text-white block leading-none mb-1">{player.stats?.kills ?? 0}</span>
                        <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-slate-400">Kills</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-xl bg-primary/40 border border-white/5 group-hover:border-[#D4AF37]/20 transition-colors">
                        <span className="font-black text-lg text-white block leading-none mb-1">{player.stats?.blocks ?? 0}</span>
                        <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-slate-400">Blocks</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PlayersView: React.FC<{onSelectPlayer: (player: Player) => void;}> = ({ onSelectPlayer }) => {
  const { players, loading } = useSports();
  const playersLoading = loading.has('players');
  const teamsLoading = loading.has('teams');
  const clubsLoading = loading.has('clubs');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'freeAgents'>('all');

  const filteredPlayers = useMemo(() => {
      let playerList = players || [];
      if (activeTab === 'freeAgents') {
          playerList = playerList.filter(p => p.clubId === null);
      }
      return playerList.filter(player => {
        return player.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [players, searchTerm, activeTab]);

  const TabButton: React.FC<{ tab: 'all' | 'freeAgents'; children: React.ReactNode }> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-4 text-center text-sm uppercase tracking-widest font-black transition-all duration-300 ${activeTab === tab ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-[#D4AF37]/5' : 'text-slate-400 hover:text-white hover:bg-white/5 border-b-2 border-transparent'}`}
    >
      {children}
    </button>
  );

  const isLoading = playersLoading || teamsLoading || clubsLoading;

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-4xl md:text-5xl font-black text-center mb-4 tracking-tight drop-shadow-md uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">Player Database</h1>
      <p className="text-center text-text-secondary mb-10 max-w-xl mx-auto text-sm uppercase tracking-widest font-bold">Comprehensive stats and profiles for all registered athletes.</p>

      <div className="mb-10 max-w-xl mx-auto">
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-5">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 group-focus-within:text-[#D4AF37] transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search players by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/60 backdrop-blur-md p-4 pl-14 rounded-full border border-white/5 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all outline-none font-bold text-white shadow-inner"
            aria-label="Search players"
          />
        </div>
      </div>

       <div className="flex border-b border-white/10 mb-8 max-w-2xl mx-auto">
            <TabButton tab="all">All Players</TabButton>
            <TabButton tab="freeAgents">Free Agents</TabButton>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => <PlayerCardSkeleton key={i} />)}
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredPlayers.map(player => (
            <PlayerCard key={player.id} player={player} onSelect={() => onSelectPlayer(player)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-secondary/30 rounded-2xl border border-accent/20 max-w-2xl mx-auto">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-accent mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
           </svg>
          <p className="text-text-secondary text-lg font-medium tracking-wide">
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
