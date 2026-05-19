import React, { useMemo } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Team, Player } from '../types';

interface TeamDetailViewProps {
  team: Team;
  onSelectPlayer: (player: Player) => void;
  onBack: () => void;
}

const PlayerRow: React.FC<{ player: Player; onSelect: () => void; }> = ({ player, onSelect }) => (
    <div onClick={onSelect} className="flex items-center p-4 bg-secondary/40 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl hover:bg-white/5 hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-white/5 hover:border-[#D4AF37]/30 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        {player.photoUrl ? (
            <img src={player.photoUrl} alt={player.name} className="w-14 h-14 rounded-full object-cover mr-4 z-10 border-2 border-white/10 group-hover:border-[#D4AF37]/50 transition-colors" />
        ) : (
            <div className="w-14 h-14 rounded-full bg-primary/80 flex items-center justify-center mr-4 text-slate-500 z-10 border border-white/10">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
        )}
        <div className="z-10">
            <p className="font-black text-white text-lg uppercase tracking-wider group-hover:text-[#D4AF37] transition-colors">{player.name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 bg-primary/50 px-2 py-0.5 rounded inline-block">{player.role}</p>
        </div>
    </div>
);

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({ team, onSelectPlayer, onBack }) => {
  const { getPlayersByTeam, loading } = useSports();
  
  const playersLoading = loading.has('players');
  
  const teamPlayers = useMemo(() => getPlayersByTeam(team.id), [getPlayersByTeam, team.id]);

  return (
    <div className="animate-fade-in-up">
      <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-[#D4AF37] mb-8 transition-colors text-sm font-bold uppercase tracking-wider group">
        <div className="w-8 h-8 rounded-full bg-secondary border border-white/10 flex items-center justify-center group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/30 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <span>Back to Clubs</span>
      </button>

      <div className="flex flex-col items-center text-center mb-12">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#D4AF37] blur-2xl opacity-20 rounded-full animate-pulse-slow"></div>
            {team.logoUrl ? (
                <img src={team.logoUrl} alt={`${team.name} logo`} className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-white/20 object-cover shadow-2xl relative z-10 bg-secondary" />
            ) : (
                 <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-white/20 bg-secondary flex items-center justify-center shadow-2xl relative z-10 text-[#D4AF37]/40">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" />
                    </svg>
                 </div>
            )}
        </div>
        <h1 className="text-4xl md:text-5xl font-black drop-shadow-md uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary tracking-tight mb-2">{team.name}</h1>
        <p className="text-[#D4AF37] text-xs uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3">
            <span className="w-4 h-px bg-[#D4AF37]/40"></span>
            {team.division}
            <span className="w-4 h-px bg-[#D4AF37]/40"></span>
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl md:text-3xl font-black mb-8 text-white uppercase tracking-wider pl-4 border-l-4 border-[#D4AF37]">Player Roster</h2>
        {playersLoading ? (
             <div className="flex justify-center py-16">
                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamPlayers.length > 0 ? (
                teamPlayers.map(player => <PlayerRow key={player.id} player={player} onSelect={() => onSelectPlayer(player)} />)
              ) : (
                <div className="text-center py-20 bg-primary/40 rounded-3xl border border-dashed border-white/10 md:col-span-2 lg:col-span-3">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No players registered for this team yet.</p>
                </div>
              )}
            </div>
        )}
      </div>
    </div>
  );
};