
import React, { useMemo } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Player, PlayerTransfer, TournamentAward } from '../types';

interface PlayerDetailViewProps {
  player: Player;
  onBack: () => void;
}

const TransferHistory: React.FC<{ transfers: PlayerTransfer[] }> = ({ transfers }) => {
    const { getTeamById } = useSports();

    if (transfers.length === 0) {
        return <div className="text-center py-16 bg-primary/40 rounded-3xl border border-dashed border-white/10">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No transfer history available.</p>
        </div>
    }

    return (
        <div className="bg-secondary/40 backdrop-blur-md rounded-3xl shadow-lg border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">From</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">To</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-[#D4AF37] uppercase tracking-widest hidden sm:table-cell">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {transfers.map(t => (
                            <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium group-hover:text-white transition-colors">{new Date(t.transferDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-bold group-hover:text-[#D4AF37] transition-colors">{getTeamById(t.fromTeamId)?.name || 'Free Agent'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-bold group-hover:text-[#D4AF37] transition-colors">{getTeamById(t.toTeamId)?.name || 'Free Agent'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 uppercase tracking-wider font-bold hidden sm:table-cell">{t.notes || (t.isAutomated ? 'Automated Roster Change' : 'Manual Entry')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TrophyCabinet: React.FC<{ awards: TournamentAward[] }> = ({ awards }) => {
    const { tournaments } = useSports();

    if (awards.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-b from-secondary/80 to-secondary/40 backdrop-blur-md rounded-3xl shadow-xl p-8 mb-12 border border-[#D4AF37]/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] blur-[100px] opacity-10 pointer-events-none rounded-full"></div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-8 flex items-center gap-4 relative z-10">
                <span className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">🏆</span> 
                Trophy Cabinet
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {awards.map(award => {
                    const tournament = tournaments.find(t => t.id === award.tournamentId);
                    return (
                        <div key={award.id} className="bg-primary/80 backdrop-blur-sm p-4 rounded-2xl border border-white/5 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all duration-300 flex items-center gap-4 group">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F9F295] via-[#E0AA3E] to-[#B8860B] p-1 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg group-hover:rotate-[10deg] transition-transform duration-500">
                                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                                     {award.imageUrl ? <img src={award.imageUrl} className="w-full h-full object-cover" alt="" /> : '🥇'}
                                </div>
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-black text-[#D4AF37] text-xs uppercase tracking-widest truncate">{award.awardName}</p>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider truncate mt-1">{tournament ? tournament.name : 'Unknown Tournament'}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export const PlayerDetailView: React.FC<PlayerDetailViewProps> = ({ player, onBack }) => {
  const { getTeamById, getClubById, getTransfersByPlayerId, getAwardsByPlayerId, fixtures, tournaments } = useSports();
  const team = getTeamById(player.teamId);
  const club = getClubById(player.clubId);
  const transfers = getTransfersByPlayerId(player.id);
  const awards = getAwardsByPlayerId(player.id);

  // Calculate Man of the Match Awards
  const motmFixtures = useMemo(() => {
      return (fixtures || [])
        .filter(f => f.manOfTheMatchId === player.id)
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [fixtures, player.id]);

  let currentAffiliation = 'Free Agent';
  if (team) {
      currentAffiliation = team.name;
  } else if (club) {
      currentAffiliation = `Unassigned - ${club.name}`;
  }

  return (
    <div className="animate-fade-in-up">
      <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-[#D4AF37] mb-8 transition-colors text-sm font-bold uppercase tracking-wider group">
        <div className="w-8 h-8 rounded-full bg-secondary border border-white/10 flex items-center justify-center group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/30 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <span>Back to Players List</span>
      </button>

      <div className="bg-secondary/40 backdrop-blur-md rounded-3xl shadow-xl p-8 flex flex-col lg:flex-row items-center gap-8 mb-12 border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent pointer-events-none"></div>
        <div className="relative">
            <div className="absolute inset-0 bg-[#D4AF37] blur-2xl opacity-20 rounded-full animate-pulse-slow"></div>
            {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-48 h-48 rounded-full object-cover border-4 border-secondary shadow-2xl relative z-10" />
            ) : (
                <div className="w-48 h-48 rounded-full bg-primary flex items-center justify-center text-slate-500 border-4 border-secondary shadow-2xl relative z-10">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
            )}
        </div>
        <div className="text-center lg:text-left flex-1 relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider drop-shadow-md">{player.name}</h1>
            <p className="inline-block px-4 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-black tracking-[0.2em] uppercase text-xs mt-4 mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">{player.role}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-2">Current Status: <span className={`font-black ${team ? 'text-[#D4AF37]' : club ? 'text-yellow-400' : 'text-slate-300'}`}>{currentAffiliation}</span></p>
        </div>
        <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-2 gap-4 text-center bg-primary/80 backdrop-blur-sm p-6 rounded-2xl border border-white/5 relative z-10">
             <div className="bg-secondary/50 p-3 rounded-xl border border-white/5 hover:border-[#D4AF37]/30 transition-colors"><span className="font-black text-2xl text-white block mb-1">{player.stats?.matches ?? 0}</span><span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Matches</span></div>
             <div className="bg-secondary/50 p-3 rounded-xl border border-white/5 hover:border-[#D4AF37]/30 transition-colors"><span className="font-black text-2xl text-white block mb-1">{player.stats?.aces ?? 0}</span><span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Aces</span></div>
             <div className="bg-secondary/50 p-3 rounded-xl border border-white/5 hover:border-[#D4AF37]/30 transition-colors"><span className="font-black text-2xl text-white block mb-1">{player.stats?.kills ?? 0}</span><span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Kills</span></div>
             <div className="bg-secondary/50 p-3 rounded-xl border border-white/5 hover:border-[#D4AF37]/30 transition-colors"><span className="font-black text-2xl text-white block mb-1">{player.stats?.blocks ?? 0}</span><span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Blocks</span></div>
             <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 p-3 rounded-xl border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-colors sm:col-span-2 lg:col-span-1 xl:col-span-2"><span className="font-black text-3xl text-[#D4AF37] block mb-1">{motmFixtures.length}</span><span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#D4AF37]/80">MOTM</span></div>
        </div>
      </div>
      
      <TrophyCabinet awards={awards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
        <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider pl-4 border-l-4 border-[#D4AF37]">Match Awards</h2>
            {motmFixtures.length > 0 ? (
                <div className="bg-secondary/40 backdrop-blur-md rounded-3xl shadow-lg border border-white/5 overflow-hidden">
                     <div className="divide-y divide-white/5">
                         {motmFixtures.map(f => {
                             const tournament = tournaments.find(t => t.id === f.tournamentId);
                             const isTeam1 = f.team1Id === player.teamId;
                             const isTeam2 = f.team2Id === player.teamId;
                             // Try to determine opponent. If player is not in either team (e.g. historical), show both teams.
                             let opponent: string;
                             if (isTeam1) opponent = `vs ${getTeamById(f.team2Id)?.name}`;
                             else if (isTeam2) opponent = `vs ${getTeamById(f.team1Id)?.name}`;
                             else opponent = `${getTeamById(f.team1Id)?.name} vs ${getTeamById(f.team2Id)?.name}`;

                             return (
                                 <div key={f.id} className="flex items-center p-6 bg-transparent hover:bg-white/5 transition-all group">
                                     <div className="flex-shrink-0 mr-6">
                                         <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 group-hover:scale-110 transition-transform">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" viewBox="0 0 20 20" fill="currentColor">
                                                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                             </svg>
                                         </div>
                                     </div>
                                     <div>
                                         <p className="text-white font-black uppercase tracking-wider text-sm group-hover:text-[#D4AF37] transition-colors mb-1">Man of the Match</p>
                                         <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">{opponent}</p>
                                         <p className="text-[#D4AF37] text-[9px] font-black uppercase tracking-[0.2em] bg-[#D4AF37]/10 px-2 py-0.5 rounded inline-block">
                                             {tournament?.name || 'Unknown Tournament'} &bull; {new Date(f.dateTime).toLocaleDateString()}
                                         </p>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-primary/40 rounded-3xl border border-dashed border-white/10">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No Man of the Match awards yet.</p>
                </div>
            )}
        </div>

        <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider pl-4 border-l-4 border-[#D4AF37]">Transfer History</h2>
            <TransferHistory transfers={transfers} />
        </div>
      </div>

    </div>
  );
};