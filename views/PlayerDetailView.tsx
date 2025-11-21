
import React, { useMemo } from 'react';
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
  const { getTeamById, getClubById, getTransfersByPlayerId, fixtures, tournaments } = useSports();
  const team = getTeamById(player.teamId);
  const club = getClubById(player.clubId);
  const transfers = getTransfersByPlayerId(player.id);

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
            <p className="text-text-secondary mt-2">Current Status: <span className={`font-semibold ${team ? 'text-text-primary' : club ? 'text-yellow-400' : 'text-text-secondary'}`}>{currentAffiliation}</span></p>
        </div>
        <div className="w-full md:w-auto md:ml-auto grid grid-cols-2 sm:grid-cols-5 gap-4 text-center bg-primary p-4 rounded-lg">
             <div><span className="font-bold text-xl text-white block">{player.stats?.matches ?? 0}</span><span className="text-xs text-text-secondary">Matches</span></div>
             <div><span className="font-bold text-xl text-white block">{player.stats?.aces ?? 0}</span><span className="text-xs text-text-secondary">Aces</span></div>
             <div><span className="font-bold text-xl text-white block">{player.stats?.kills ?? 0}</span><span className="text-xs text-text-secondary">Kills</span></div>
             <div><span className="font-bold text-xl text-white block">{player.stats?.blocks ?? 0}</span><span className="text-xs text-text-secondary">Blocks</span></div>
             <div><span className="font-bold text-xl text-highlight block">{motmFixtures.length}</span><span className="text-xs text-text-secondary">MOTM</span></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
            <h2 className="text-2xl font-bold mb-4">Match Awards</h2>
            {motmFixtures.length > 0 ? (
                <div className="bg-secondary rounded-lg shadow-lg overflow-hidden">
                     <div className="space-y-1">
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
                                 <div key={f.id} className="flex items-center p-4 bg-secondary hover:bg-accent transition-colors border-b border-accent last:border-0">
                                     <div className="flex-shrink-0 mr-4">
                                         <div className="w-10 h-10 rounded-full bg-highlight/20 flex items-center justify-center text-highlight">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                             </svg>
                                         </div>
                                     </div>
                                     <div>
                                         <p className="text-white font-bold text-sm sm:text-base">Man of the Match</p>
                                         <p className="text-text-secondary text-xs sm:text-sm">{opponent}</p>
                                         <p className="text-highlight text-xs mt-0.5 font-medium">
                                             {tournament?.name || 'Unknown Tournament'} • {new Date(f.dateTime).toLocaleDateString()}
                                         </p>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                </div>
            ) : (
                <div className="bg-secondary rounded-lg p-6 text-center">
                    <p className="text-text-secondary">No Man of the Match awards yet.</p>
                </div>
            )}
        </div>

        <div>
            <h2 className="text-2xl font-bold mb-4">Transfer History</h2>
            <TransferHistory transfers={transfers} />
        </div>
      </div>

    </div>
  );
};