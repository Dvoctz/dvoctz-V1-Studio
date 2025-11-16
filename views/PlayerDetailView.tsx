import React from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Player, PlayerTransfer } from '../types';

interface PlayerDetailViewProps {
  player: Player;
  onBack: () => void;
}

const TransferHistory: React.FC<{ transfers: PlayerTransfer[] }> = ({ transfers }) => {
    const { getTeamById } = useSports();

    if (transfers.length === 0) {
        return <p className="text-center text-text-secondary mt-4">No transfer history available for this player.</p>
    }

    return (
        <div className="bg-secondary rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-accent">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">From</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">To</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden sm:table-cell">Details</th>
                        </tr>
                    </thead>
                    <tbody className="bg-secondary divide-y divide-accent">
                        {transfers.map(t => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{new Date(t.transferDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{getTeamById(t.fromTeamId)?.name || 'Free Agent'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{getTeamById(t.toTeamId)?.name || 'Free Agent'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary hidden sm:table-cell">{t.notes || (t.isAutomated ? 'Automated Roster Change' : 'Manual Entry')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export const PlayerDetailView: React.FC<PlayerDetailViewProps> = ({ player, onBack }) => {
  const { getTeamById, getTransfersByPlayerId } = useSports();
  const team = getTeamById(player.teamId);
  const transfers = getTransfersByPlayerId(player.id);

  return (
    <div>
      <button onClick={onBack} className="flex items-center space-x-2 text-text-secondary hover:text-highlight mb-6 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Players List</span>
      </button>

      <div className="bg-secondary rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 mb-8">
        {player.photoUrl ? (
            <img src={player.photoUrl} alt={player.name} className="w-40 h-40 rounded-full object-cover border-4 border-accent flex-shrink-0" />
        ) : (
            <div className="w-40 h-40 rounded-full bg-accent flex items-center justify-center text-text-secondary flex-shrink-0 border-4 border-accent">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
        )}
        <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-white">{player.name}</h1>
            <p className="text-xl text-highlight font-semibold mt-1">{player.role}</p>
            <p className="text-text-secondary mt-2">Current Team: <span className="font-semibold text-text-primary">{team?.name || 'Free Agent'}</span></p>
        </div>
        <div className="w-full md:w-auto md:ml-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-4 text-center bg-primary p-4 rounded-lg">
             <div><span className="font-bold text-xl text-white block">{player.stats?.matches ?? 0}</span><span className="text-xs text-text-secondary">Matches</span></div>
             <div><span className="font-bold text-xl text-white block">{player.stats?.aces ?? 0}</span><span className="text-xs text-text-secondary">Aces</span></div>
             <div><span className="font-bold text-xl text-white block">{player.stats?.kills ?? 0}</span><span className="text-xs text-text-secondary">Kills</span></div>
             <div><span className="font-bold text-xl text-white block">{player.stats?.blocks ?? 0}</span><span className="text-xs text-text-secondary">Blocks</span></div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Transfer History</h2>
        <TransferHistory transfers={transfers} />
      </div>

    </div>
  );
};