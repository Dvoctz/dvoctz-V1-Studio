
import React, { useMemo } from 'react';
import type { Fixture, Team } from '../types';
import { useSports } from '../context/SportsDataContext';

interface ScoreSheetModalProps {
  fixture: Fixture;
  team1: Team;
  team2: Team;
  onClose: () => void;
}

export const ScoreSheetModal: React.FC<ScoreSheetModalProps> = ({ fixture, team1, team2, onClose }) => {
  const { players, getTeamById } = useSports();

  if (!fixture.score) return null;
  const score = fixture.score;

  const motmPlayer = useMemo(() => {
      if (!fixture.manOfTheMatchId) return null;
      return players.find(p => p.id === fixture.manOfTheMatchId);
  }, [fixture.manOfTheMatchId, players]);

  const motmTeam = useMemo(() => {
      if (!motmPlayer) return null;
      return getTeamById(motmPlayer.teamId);
  }, [motmPlayer, getTeamById]);

  const renderTeamHeader = (team: Team, teamScore: number) => (
    <div className="flex items-center justify-between bg-accent p-4 rounded-lg">
        <div className="flex items-center">
            <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full mr-4" />
            <h4 className="text-xl font-bold text-text-primary">{team.name}</h4>
        </div>
        <div>
            <span className="text-2xl font-extrabold text-white">{teamScore}</span>
            <span className="text-sm text-text-secondary ml-2">Final Score</span>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-md transform transition-all overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-accent flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">Match Scorecard</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
            {renderTeamHeader(team1, score.team1Score)}
            {renderTeamHeader(team2, score.team2Score)}
        </div>
         <div className="px-6 pb-6 space-y-2">
            <h4 className="text-lg font-semibold text-center text-text-secondary">Set Breakdown</h4>
            {score.sets.map((set, index) => {
                // Determine winner logic: Explicit winner flag first, then fallback to points
                const t1Won = set.winner === 'team1' || (!set.winner && set.team1Points > set.team2Points);
                const t2Won = set.winner === 'team2' || (!set.winner && set.team2Points > set.team1Points);

                return (
                    <div key={index} className="flex justify-between items-center bg-accent p-3 rounded-md">
                        <span className="text-sm font-bold text-text-secondary">Set {index + 1}</span>
                        <div className="flex items-center space-x-4 text-lg">
                            <span className={`font-bold ${t1Won ? 'text-white' : 'text-text-secondary'}`}>{set.team1Points}</span>
                            <span className="text-text-secondary">-</span>
                            <span className={`font-bold ${t2Won ? 'text-white' : 'text-text-secondary'}`}>{set.team2Points}</span>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* MAN OF THE MATCH SECTION */}
        {motmPlayer && (
            <div className="px-6 pb-6">
                <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-xl border border-highlight/30 text-center relative overflow-hidden">
                     {/* Decorative Background Star */}
                    <div className="absolute -top-4 -left-4 opacity-10">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-highlight" viewBox="0 0 20 20" fill="currentColor">
                             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                         </svg>
                    </div>
                    
                    <h4 className="text-sm font-bold text-highlight uppercase tracking-widest mb-3">Man of the Match</h4>
                    
                    <div className="flex flex-col items-center">
                         <div className="relative">
                             {motmPlayer.photoUrl ? (
                                 <img src={motmPlayer.photoUrl} alt={motmPlayer.name} className="w-20 h-20 rounded-full object-cover border-4 border-highlight shadow-lg" />
                             ) : (
                                 <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-4 border-highlight shadow-lg">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                     </svg>
                                 </div>
                             )}
                             {motmTeam && (
                                 <img 
                                     src={motmTeam.logoUrl} 
                                     alt={motmTeam.name} 
                                     className="w-8 h-8 rounded-full absolute -bottom-1 -right-1 border-2 border-white bg-secondary"
                                     title={motmTeam.name}
                                 />
                             )}
                         </div>
                         
                         <h3 className="text-xl font-extrabold text-white mt-3">{motmPlayer.name}</h3>
                         <p className="text-sm text-text-secondary">{motmPlayer.role}</p>
                    </div>
                </div>
            </div>
        )}

        <div className="p-6 bg-primary rounded-b-xl text-center border-t border-accent">
            <p className="text-lg font-semibold text-highlight">{score.resultMessage}</p>
            <p className="text-sm text-text-secondary mt-1">{new Date(fixture.dateTime).toLocaleDateString()} at {fixture.ground}</p>
            {fixture.referee && (
                <p className="text-sm text-text-secondary mt-1">Referee: {fixture.referee}</p>
            )}
        </div>
      </div>
    </div>
  );
};