
import React, { useState, useMemo } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { PlayerTransfer } from '../types';

const TransferItem: React.FC<{ transfer: PlayerTransfer }> = ({ transfer }) => {
  const { getTeamById, players } = useSports();
  const player = players.find(p => p.id === transfer.playerId);
  const fromTeam = getTeamById(transfer.fromTeamId);
  const toTeam = getTeamById(transfer.toTeamId);

  if (!player) return null;

  // Check if transfer was within the last 7 days
  const isNew = (new Date().getTime() - new Date(transfer.transferDate).getTime()) / (1000 * 3600 * 24) < 7;

  return (
    <div className="bg-secondary/60 p-6 rounded-2xl shadow-md hover:shadow-premium transition-all duration-300 border border-accent/30 relative group overflow-hidden">
        {/* Glow behind the arrow */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-32 bg-[#D4AF37]/5 blur-2xl rounded-full pointer-events-none group-hover:bg-[#D4AF37]/10 transition-colors"></div>

        {isNew && (
            <span className="absolute top-4 right-4 bg-red-600/20 text-red-400 border border-red-600/50 text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full animate-pulse shadow-glow shadow-red-500/20">NEW</span>
        )}
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            {/* Player Info */}
            <div className="flex items-center gap-4 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-accent/30 pb-4 md:pb-0">
                 <div className="relative flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                     <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-md group-hover:blur-lg transition-all scale-110"></div>
                     {player.photoUrl ? (
                         <img src={player.photoUrl} alt={player.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary relative z-10 grayscale-[30%] group-hover:grayscale-0 transition-all duration-300" />
                     ) : (
                         <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-text-secondary border-2 border-accent relative z-10">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                             </svg>
                         </div>
                     )}
                 </div>
                 <div className="overflow-hidden">
                     <h3 className="font-black text-white text-xl truncate group-hover:text-[#D4AF37] transition-colors">{player.name}</h3>
                     <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{new Date(transfer.transferDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                 </div>
            </div>
    
            {/* Transfer Flow */}
            <div className="flex items-center justify-between w-full md:w-2/3 px-4">
                 <div className={`flex-1 text-right text-sm md:text-lg tracking-wide ${fromTeam ? 'text-slate-300 font-bold' : 'text-text-secondary italic'}`}>
                     {fromTeam?.name || 'Free Agent'}
                 </div>
                 
                 <div className="px-6 flex-shrink-0">
                     <div className="bg-primary/80 border border-white/10 p-3 rounded-full text-[#D4AF37] shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                     </div>
                 </div>
    
                 <div className={`flex-1 text-left text-sm md:text-lg tracking-wide ${toTeam ? 'text-white font-black drop-shadow-md' : 'text-text-secondary italic'}`}>
                     {toTeam?.name || 'Free Agent'}
                 </div>
            </div>
        </div>
        {transfer.notes && (
            <div className="mt-4 pt-4 border-t border-accent/20 text-xs md:text-sm text-text-secondary italic flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {transfer.notes}
            </div>
        )}
    </div>
  );
};

export const TransfersView: React.FC = () => {
  const { playerTransfers, players, loading } = useSports();
  const transfersLoading = loading.has('playerTransfers');
  const playersLoading = loading.has('players');
  const teamsLoading = loading.has('teams');
  const [searchTerm, setSearchTerm] = useState('');

  const sortedTransfers = useMemo(() => {
      const list = playerTransfers || [];
      return list
        .filter(t => {
             if (!searchTerm) return true;
             const p = players.find(pl => pl.id === t.playerId);
             return p?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
        })
        .sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());
  }, [playerTransfers, players, searchTerm]);

  const isLoading = transfersLoading || playersLoading || teamsLoading;

  return (
    <div className="animate-fade-in-up max-w-5xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary uppercase tracking-tighter drop-shadow-md mb-4">Transfer Market</h1>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-secondary">Latest moves, signings, and free agency updates.</p>
        </div>
        
         <div className="mb-12 max-w-xl mx-auto">
            <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary group-focus-within:text-[#D4AF37] transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </span>
                <input
                    type="text"
                    placeholder="Search transfers by player name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-secondary/80 p-4 pl-12 rounded-full border border-accent/50 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all outline-none font-medium shadow-inner"
                />
            </div>
        </div>

        {isLoading ? (
             <div className="flex justify-center py-20">
                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
             </div>
        ) : sortedTransfers.length > 0 ? (
            <div className="space-y-6 pb-20">
                {sortedTransfers.map(t => <TransferItem key={t.id} transfer={t} />)}
            </div>
        ) : (
             <div className="text-center py-24 bg-secondary/30 rounded-3xl border border-accent/20">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-accent mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
                 <p className="text-text-secondary text-xl font-medium tracking-wide">No transfer records found.</p>
             </div>
        )}
    </div>
  );
};
