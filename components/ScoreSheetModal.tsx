
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
    <div className="flex items-center justify-between bg-primary/60 border border-white/5 p-4 rounded-2xl backdrop-blur-sm shadow-md transition-all">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 bg-secondary flex-shrink-0">
                {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover grayscale opacity-90" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-white text-lg bg-secondary">{team.name.charAt(0)}</div>
                )}
            </div>
            <h4 className="text-xl font-black text-white uppercase tracking-wider">{team.name}</h4>
        </div>
        <div className="flex flex-col items-end pr-2">
            <span className="text-sm font-bold text-[#D4AF37] uppercase tracking-[0.2em] mb-1 leading-none">Sets</span>
            <span className="text-[40px] font-black text-white leading-none drop-shadow-md">{teamScore}</span>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-primary/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
      <div className="bg-secondary/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-[480px] transform transition-all overflow-y-auto max-h-[90vh] relative scrollbar-hide" onClick={(e) => e.stopPropagation()}>
        
        {/* Glows */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-glow pointer-events-none"></div>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#D4AF37]/5 to-transparent pointer-events-none"></div>

        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center relative z-10">
          <h3 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
              <span className="w-1 h-6 bg-[#D4AF37] rounded-full"></span>
              Scorecard
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-4 relative z-10 pt-4">
            {renderTeamHeader(team1, score.team1Score)}
            {renderTeamHeader(team2, score.team2Score)}
        </div>
        
        <div className="px-6 md:px-8 pb-8 space-y-3 relative z-10">
            <h4 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase flex items-center justify-center gap-3 mb-4">
                <span className="w-12 h-px bg-slate-600"></span> Set Breakdown <span className="w-12 h-px bg-slate-600"></span>
            </h4>
            
            <div className="bg-primary/40 rounded-2xl border border-white/5 overflow-hidden">
                {score.sets.map((set, index) => {
                    const t1Won = set.winner === 'team1' || (!set.winner && set.team1Points > set.team2Points);
                    const t2Won = set.winner === 'team2' || (!set.winner && set.team2Points > set.team1Points);

                    return (
                        <div key={index} className={`flex justify-between items-center p-4 border-b border-white/5 last:border-b-0 ${index % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                            <span className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase w-16">Set {index + 1}</span>
                            <div className="flex items-center justify-center flex-grow space-x-6 text-xl">
                                <span className={`font-black w-8 text-right transition-transform ${t1Won ? 'text-white scale-125 drop-shadow-md' : 'text-slate-500'}`}>{set.team1Points}</span>
                                <span className="text-slate-600 font-bold text-sm">-</span>
                                <span className={`font-black w-8 text-left transition-transform ${t2Won ? 'text-white scale-125 drop-shadow-md' : 'text-slate-500'}`}>{set.team2Points}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* MAN OF THE MATCH SECTION */}
        {motmPlayer && (
            <div className="px-6 md:px-8 pb-8 relative z-10">
                <div className="bg-gradient-to-br from-[#D4AF37]/20 to-primary p-6 rounded-3xl border border-[#D4AF37]/30 text-center relative overflow-hidden shadow-xl group">
                     {/* Decorative Background Star */}
                    <div className="absolute -top-10 -right-10 opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-1000">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48 text-[#D4AF37]" viewBox="0 0 20 20" fill="currentColor">
                             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                         </svg>
                    </div>
                    
                    <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#D4AF37]"></span>
                        Man of the Match
                        <span className="w-1 h-1 rounded-full bg-[#D4AF37]"></span>
                    </h4>
                    
                    <div className="flex flex-col items-center relative z-10">
                         <div className="relative mb-4">
                             <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[#D4AF37] shadow-glow bg-primary p-1">
                                <div className="w-full h-full rounded-full overflow-hidden bg-secondary">
                                    {motmPlayer.photoUrl ? (
                                        <img src={motmPlayer.photoUrl} alt={motmPlayer.name} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                             </div>
                             {motmTeam && (
                                 <img 
                                     src={motmTeam.logoUrl} 
                                     alt={motmTeam.name} 
                                     className="w-8 h-8 rounded-full absolute -bottom-1 -right-1 border-2 border-primary bg-secondary shadow-md grayscale"
                                     title={motmTeam.name}
                                 />
                             )}
                         </div>
                         
                         <h3 className="text-2xl font-black text-white tracking-tight uppercase">{motmPlayer.name}</h3>
                         <p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase font-bold mt-1">{motmPlayer.role}</p>
                    </div>
                </div>
            </div>
        )}

        <div className="p-6 bg-primary/80 text-center border-t border-white/10 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] px-4 py-2 border border-[#D4AF37]/30 inline-block rounded-full bg-[#D4AF37]/10 mb-3">{score.resultMessage}</p>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                <p>{new Date(fixture.dateTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})} <br/> <span className="text-white mt-1 block">{fixture.ground}</span></p>
                {fixture.referee && (
                    <p className="mt-2 text-slate-500">Ref: <span className="text-slate-300">{fixture.referee}</span></p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
