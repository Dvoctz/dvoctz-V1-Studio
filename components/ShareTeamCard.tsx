
import React, { forwardRef } from 'react';
import type { Fixture, Team, Tournament, Player } from '../types';

interface ShareTeamCardProps {
  team: Team;
  tournament: Tournament;
  roster: Player[];
  upcomingFixtures: Fixture[];
  officiatingFixtures: Fixture[];
  getTeam: (id: number) => Team | undefined;
}

export const ShareTeamCard = forwardRef<HTMLDivElement, ShareTeamCardProps>(({ team, tournament, roster, upcomingFixtures, officiatingFixtures, getTeam }, ref) => {
    
    // Helper to format date nicely
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

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
            <div className="absolute bottom-0 inset-x-0 h-[400px] bg-gradient-to-t from-[#D4AF37]/5 to-transparent z-0 pointer-events-none"></div>
            <div className="absolute -left-32 top-1/3 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-[100px] pointer-events-none z-0"></div>
            
            {/* Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay">
                 <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid-team" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-team)" />
                </svg>
            </div>

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8 pb-8 z-10 border-b border-white/10 relative">
                <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#806B2A] p-1 shadow-glow flex-shrink-0">
                    <div className="w-full h-full bg-primary rounded-full flex items-center justify-center overflow-hidden">
                        {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover grayscale opacity-80" />
                        ) : (
                            <span className="text-4xl font-black text-[#D4AF37]">{team.name.charAt(0)}</span>
                        )}
                    </div>
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight mb-3 drop-shadow-md bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">{team.name}</h1>
                <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-4 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                    <span className="text-[#D4AF37] font-bold uppercase tracking-[0.2em] text-[10px]">{tournament.name}</span>
                </div>
            </div>

            <div className="flex-grow z-10 space-y-8 flex flex-col">
                
                {/* Section 1: Roster */}
                <div className="bg-secondary/40 backdrop-blur-sm p-6 rounded-3xl border border-white/5 shadow-lg">
                    <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase mb-4 pl-1 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Match Day Squad
                    </h3>
                    {roster.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {roster.map(p => (
                                <div key={p.id} className="bg-primary/60 border border-white/5 py-2 px-3 rounded-xl flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                                         {p.photoUrl ? (
                                             <img src={p.photoUrl} alt="" className="w-full h-full object-cover grayscale opacity-70" />
                                         ) : (
                                            <span className="text-[9px] font-bold text-text-secondary">{p.name.charAt(0)}</span>
                                         )}
                                     </div>
                                    <div className="flex flex-col overflow-hidden leading-tight">
                                        <span className="font-bold text-white text-[12px] truncate">{p.name}</span>
                                        <span className="text-[9px] text-[#D4AF37] uppercase tracking-wider">{(p.role as string) === 'Player' ? 'PLYR' : p.role.split(' ')[0]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-secondary italic text-sm text-center py-4">Roster not set for this tournament.</p>
                    )}
                </div>

                {/* Section 2: Upcoming Fixtures */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase mb-4 pl-1 flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                        Upcoming Matches
                    </h3>
                    <div className="space-y-4">
                        {upcomingFixtures.slice(0, 3).map(f => {
                            const isTeam1 = f.team1Id === team.id;
                            const opponentId = isTeam1 ? f.team2Id : f.team1Id;
                            const opponent = getTeam(opponentId);
                            
                            return (
                                <div key={f.id} className="bg-secondary/40 backdrop-blur-sm p-5 rounded-2xl border-l-4 border-l-white border-y border-y-white/5 border-r border-r-white/5 flex items-center justify-between shadow-md">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] bg-primary border border-white/10 px-2 py-0.5 rounded-full text-text-secondary uppercase font-bold tracking-widest">
                                                {formatDate(f.dateTime)}
                                            </span>
                                            <span className="text-[10px] text-[#D4AF37] uppercase font-black tracking-widest">
                                                {formatTime(f.dateTime)}
                                            </span>
                                        </div>
                                        <span className="text-white font-black text-xl tracking-tight mt-1 truncate max-w-[250px]">
                                            <span className="text-text-secondary text-sm font-medium mr-2 italic">vs</span>{opponent?.name || 'TBD'}
                                        </span>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className="text-[9px] bg-black/30 px-2 py-1 rounded text-[#D4AF37] uppercase font-bold tracking-widest border border-white/5">
                                            {f.ground}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {upcomingFixtures.length === 0 && (
                            <div className="bg-secondary/20 border border-dashed border-white/10 rounded-2xl p-6 text-center">
                                <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">No upcoming matches</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 3: Officiating Duties */}
                {officiatingFixtures.length > 0 && (
                    <div className="mt-auto">
                        <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase mb-3 pl-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span>
                            Ref Duty
                        </h3>
                        <div className="space-y-2">
                            {officiatingFixtures.slice(0, 2).map((f, i) => {
                                const t1 = getTeam(f.team1Id);
                                const t2 = getTeam(f.team2Id);
                                
                                return (
                                    <div key={f.id} className="bg-primary/80 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest leading-none mb-1">
                                                {formatDate(f.dateTime)} — {formatTime(f.dateTime)}
                                            </span>
                                            <div className="text-white font-medium text-xs leading-none truncate max-w-[280px]">
                                                {t1?.name || 'TBD'} <span className="text-[#D4AF37] mx-1 text-[10px]">VS</span> {t2?.name || 'TBD'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 flex flex-col items-center z-10 w-full relative">
                 <div className="absolute top-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-highlight to-transparent opacity-50"></div>
                 <div className="inline-flex items-center gap-2 bg-gradient-to-br from-[#D4AF37] to-[#806B2A] text-primary font-black px-6 py-2.5 rounded-full text-sm shadow-glow mb-2">
                     DVOCTZ.APP
                 </div>
                 <p className="text-[8px] text-slate-400 uppercase tracking-[0.3em] font-bold">Dar Es Salaam Volleyball Oversee Committee</p>
            </div>
        </div>
    );
});
