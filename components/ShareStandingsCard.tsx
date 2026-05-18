
import React, { forwardRef } from 'react';
import type { TeamStanding } from '../types';

interface ShareStandingsCardProps {
  tournamentName: string;
  division: string;
  standings: TeamStanding[];
}

export const ShareStandingsCard = forwardRef<HTMLDivElement, ShareStandingsCardProps>(({ tournamentName, division, standings }, ref) => {
  return (
    <div 
        ref={ref}
        className="bg-primary text-white relative overflow-hidden flex flex-col"
        style={{
            width: '540px',
            minHeight: '960px',
            padding: '40px',
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
    >
       {/* Premium Background */}
       <div className="absolute inset-0 bg-primary z-0"></div>
       <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#D4AF37]/20 to-transparent z-0 pointer-events-none"></div>
       <div className="absolute bottom-0 inset-x-0 h-[300px] bg-gradient-to-t from-[#D4AF37]/5 to-transparent z-0 pointer-events-none"></div>
       
       <div className="absolute -left-32 top-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
       <div className="absolute -right-32 bottom-0 w-96 h-96 bg-[#806B2A]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

       {/* Texture */}
       <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-0 mix-blend-overlay">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid-standings" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-standings)" />
        </svg>
       </div>

       {/* Header */}
       <div className="flex flex-col items-center justify-center mb-8 pb-8 z-10 border-b border-white/10 relative">
            <div className="absolute bottom-0 w-48 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-glow"></div>
            
            <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#806B2A] rounded-xl shadow-glow">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2 12h20" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
                     </svg>
                 </div>
                 <span className="text-xl font-black tracking-[0.2em] uppercase text-white drop-shadow-sm">DVOC <span className="text-[#D4AF37]">TZ</span></span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-tight text-center drop-shadow-md bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-300 mb-4">{tournamentName}</h1>
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-5 py-1.5 rounded-full shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                <span className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-[10px]">{division} Standings</span>
            </div>
       </div>

       {/* Table */}
       <div className="flex-grow z-10 flex flex-col w-full max-w-[480px] mx-auto">
            <div className="w-full bg-secondary/30 backdrop-blur-md rounded-3xl border border-white/5 p-2 shadow-2xl relative overflow-hidden">
                {/* Table Header */}
                <div className="flex bg-black/40 text-slate-400 text-[10px] font-black uppercase tracking-widest py-3 px-3 rounded-2xl mb-2 items-center">
                    <div className="w-6 text-center">#</div>
                    <div className="flex-grow pl-3">Team</div>
                    <div className="w-8 text-center" title="Played">P</div>
                    <div className="w-8 text-center" title="Wins">W</div>
                    <div className="w-8 text-center" title="Losses">L</div>
                    <div className="w-10 text-center" title="Goal Difference">GD</div>
                    <div className="w-12 text-center text-[#D4AF37]">Pts</div>
                </div>
                
                {/* Rows */}
                <div className="space-y-1.5 pb-2">
                    {standings.map((s, index) => {
                        let rankStyle = "bg-primary/80 border-white/5";
                        let markRender = null;
                        
                        if (index === 0) {
                            rankStyle = "bg-gradient-to-r from-[#D4AF37]/20 to-primary/80 border-[#D4AF37]/30 shadow-glow shadow-[#D4AF37]/10";
                            markRender = <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#D4AF37] to-[#F3E5AB] shadow-glow" />;
                        } else if (index === 1) {
                            rankStyle = "bg-gradient-to-r from-slate-300/20 to-primary/80 border-slate-300/30";
                            markRender = <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-300 to-slate-400" />;
                        } else if (index === 2) {
                            rankStyle = "bg-gradient-to-r from-amber-600/20 to-primary/80 border-amber-600/30";
                            markRender = <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-600 to-amber-700" />;
                        }
                        
                        return (
                            <div key={s.teamId} className={`flex items-center p-3 rounded-xl border relative overflow-hidden transition-colors ${rankStyle}`}>
                                 {markRender}
                                 <div className={`w-6 text-center font-black ${index < 3 ? 'text-white' : 'text-slate-500'} text-xs`}>{index + 1}</div>
                                 <div className="flex-grow flex items-center gap-3 pl-3 overflow-hidden">
                                    {s.logoUrl ? (
                                        <div className="relative">
                                            {index === 0 && <div className="absolute -inset-1 bg-[#D4AF37] rounded-full blur-sm opacity-50"></div>}
                                            <img src={s.logoUrl} className="w-7 h-7 rounded-full object-cover border border-white/20 relative z-10 bg-primary" alt="" />
                                        </div>
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-secondary border border-white/20 flex items-center justify-center">
                                            <span className="text-[8px] font-bold">{s.teamName.charAt(0)}</span>
                                        </div>
                                    )}
                                    <span className="font-bold text-white text-sm truncate uppercase tracking-wide">{s.teamName}</span>
                                 </div>
                                 <div className="w-8 text-center text-xs font-bold text-slate-400">{s.gamesPlayed}</div>
                                 <div className="w-8 text-center text-xs font-bold text-white">{s.wins}</div>
                                 <div className="w-8 text-center text-xs font-bold text-slate-500">{s.losses}</div>
                                 <div className="w-10 text-center text-xs font-bold text-slate-400">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</div>
                                 <div className="w-12 text-center flex justify-center">
                                     <div className={`flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-[#D4AF37] text-primary' : 'bg-secondary border border-white/10 text-[#D4AF37]'} font-black text-xs shadow-inner`}>
                                         {s.points}
                                     </div>
                                 </div>
                            </div>
                        );
                    })}
                    
                    {standings.length === 0 && (
                        <div className="text-center py-16 bg-primary/50 rounded-xl border border-dashed border-white/10 m-2">
                             <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">No standings available yet</p>
                        </div>
                    )}
                </div>
            </div>
       </div>

       {/* Footer */}
        <div className="mt-8 pt-6 flex flex-col items-center z-10 w-full relative">
            <div className="absolute top-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-br from-[#D4AF37] to-[#806B2A] text-primary font-black px-6 py-2.5 rounded-full text-sm shadow-glow mb-2">
                DVOCTZ.APP
            </div>
            <p className="text-[8px] text-[#D4AF37] opacity-80 uppercase tracking-[0.3em] font-bold">Dar Es Salaam Volleyball Oversee Committee</p>
        </div>
    </div>
  );
});
