
import React, { useState, useMemo } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
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
    <div className="bg-secondary p-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-highlight relative">
        {isNew && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">NEW</span>
        )}
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Player Info */}
            <div className="flex items-center gap-3 w-full sm:w-1/3">
                 <div className="relative flex-shrink-0">
                     {player.photoUrl ? (
                         <img src={player.photoUrl} alt={player.name} className="w-14 h-14 rounded-full object-cover border-2 border-accent" />
                     ) : (
                         <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-text-secondary border-2 border-accent">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                             </svg>
                         </div>
                     )}
                 </div>
                 <div className="overflow-hidden">
                     <h3 className="font-bold text-white text-lg truncate">{player.name}</h3>
                     <p className="text-xs text-text-secondary">{new Date(transfer.transferDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                 </div>
            </div>
    
            {/* Transfer Flow */}
            <div className="flex items-center justify-center w-full sm:w-2/3 gap-2">
                 <div className={`flex-1 text-right text-sm md:text-base ${fromTeam ? 'text-text-primary font-medium' : 'text-text-secondary italic'}`}>
                     {fromTeam?.name || 'Free Agent'}
                 </div>
                 
                 <div className="px-2 flex-shrink-0">
                     <div className="bg-highlight/10 p-2 rounded-full text-highlight">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                     </div>
                 </div>
    
                 <div className={`flex-1 text-left text-sm md:text-base ${toTeam ? 'text-white font-bold' : 'text-text-secondary italic'}`}>
                     {toTeam?.name || 'Free Agent'}
                 </div>
            </div>
        </div>
        {transfer.notes && (
            <div className="mt-3 pt-3 border-t border-accent text-xs md:text-sm text-text-secondary italic">
                "{transfer.notes}"
            </div>
        )}
    </div>
  );
};

export const TransfersView: React.FC = () => {
  const { playerTransfers, players } = useSports();
  const { loading: transfersLoading } = useEntityData('playerTransfers');
  const { loading: playersLoading } = useEntityData('players');
  const { loading: teamsLoading } = useEntityData('teams');
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
    <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-8">Transfer Market</h1>
        
         <div className="mb-8">
            <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </span>
            <input
                type="text"
                placeholder="Search transfers by player name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary p-3 pl-10 rounded-lg border border-accent focus:ring-highlight focus:border-highlight transition-colors"
            />
            </div>
        </div>

        {isLoading ? (
             <div className="flex justify-center py-10">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-highlight"></div>
             </div>
        ) : sortedTransfers.length > 0 ? (
            <div className="space-y-4 pb-8">
                {sortedTransfers.map(t => <TransferItem key={t.id} transfer={t} />)}
            </div>
        ) : (
             <div className="text-center py-10 bg-secondary rounded-lg">
                 <p className="text-text-secondary text-lg">No transfer records found.</p>
             </div>
        )}
    </div>
  );
};
