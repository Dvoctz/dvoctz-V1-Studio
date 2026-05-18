
import React, { forwardRef } from 'react';
import type { Fixture, Team, Tournament } from '../types';

interface ShareFixtureCardProps {
  date: string;
  fixtures: Fixture[];
  getTeam: (id: number) => Team | undefined;
  getTournament: (id: number) => Tournament | undefined;
  page?: number;
  totalPages?: number;
}

// Fixed dimensions for optimal sharing (like WhatsApp Status)
// We scale this down in the preview using CSS transforms
export const ShareFixtureCard = forwardRef<HTMLDivElement, ShareFixtureCardProps>(({ date, fixtures, getTeam, getTournament, page, totalPages }, ref) => {
    
    // Sort fixtures by time
    const sortedFixtures = [...fixtures].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    return (
        <div 
            ref={ref} 
            className="bg-primary text-white relative overflow-hidden flex flex-col" 
            style={{ 
                width: '540px', 
                minHeight: '960px', 
                padding: '40px',
                // Explicit font family fallback to ensure it renders even if we skip webfont fetching
                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}
        >
            {/* Premium Background */}
            <div className="absolute inset-0 bg-primary z-0"></div>
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#D4AF37]/15 to-transparent z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 inset-x-0 h-[300px] bg-gradient-to-t from-[#D4AF37]/5 to-transparent z-0 pointer-events-none"></div>
            <div className="absolute -left-32 top-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
            <div className="absolute -right-32 bottom-1/4 w-96 h-96 bg-[#806B2A]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay">
                 <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Header */}
            <div className="flex flex-col items-center justify-center mb-8 pb-8 z-10 relative">
                 <div className="absolute bottom-0 w-32 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
                 <div className="flex items-center gap-4 mb-3">
                    <div className="p-2.5 bg-gradient-to-br from-[#D4AF37] to-[#806B2A] rounded-2xl shadow-glow">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2 12h20" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-4xl font-black text-white tracking-[0.1em] leading-none drop-shadow-sm uppercase">DVOC <span className="text-[#D4AF37]">TZ</span></span>
                        <span className="text-[#D4AF37] text-[10px] font-bold tracking-[0.4em] uppercase mt-1">Daily Schedule</span>
                    </div>
                 </div>
            </div>
            
            <div className="text-center mb-10 z-10">
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 uppercase drop-shadow-md mb-2 tracking-tighter">
                    {new Date(date).toLocaleDateString(undefined, { weekday: 'long' })}
                </h2>
                <div className="inline-block bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-4 py-1.5 rounded-full">
                    <p className="text-lg text-[#D4AF37] font-bold tracking-[0.2em] uppercase">
                        {new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Fixtures List */}
            <div className="flex-grow space-y-6 z-10 w-full max-w-[460px] mx-auto">
                {sortedFixtures.map((f, i) => {
                    const t1 = getTeam(f.team1Id);
                    const t2 = getTeam(f.team2Id);
                    const tourney = getTournament(f.tournamentId);
                    const time = new Date(f.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true});
                    
                    return (
                        <div key={i} className="bg-secondary/80 backdrop-blur-md rounded-2xl p-6 flex flex-col gap-5 border border-white/10 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] to-[#806B2A]"></div>
                            
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                <span className="font-black text-3xl text-white tracking-tight">{time}</span>
                                <span className="uppercase tracking-[0.2em] text-[10px] font-bold bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3 py-1.5 rounded-full text-[#D4AF37]">
                                    {tourney?.division || 'Friendly'}
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between gap-4 mt-2">
                                {/* Team 1 */}
                                <div className="flex-1 text-right">
                                    <span className="text-[22px] font-black text-white leading-none uppercase drop-shadow-sm">
                                        {t1?.name || 'TBD'}
                                    </span>
                                </div>

                                <div className="flex-shrink-0 px-3 flex flex-col items-center">
                                    <span className="text-lg font-black text-[#D4AF37] italic opacity-80 mb-2">VS</span>
                                </div>

                                {/* Team 2 */}
                                <div className="flex-1 text-left">
                                    <span className="text-[22px] font-black text-white leading-none uppercase drop-shadow-sm">
                                        {t2?.name || 'TBD'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 mt-3 p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center justify-center text-sm text-slate-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-bold truncate max-w-[300px] uppercase tracking-widest text-[11px]">{f.ground}</span>
                                </div>
                                
                                {f.referee && (
                                    <div className="flex items-center justify-center text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.2em] opacity-90">
                                        REF: {f.referee}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {sortedFixtures.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-text-secondary border border-dashed border-accent/50 rounded-2xl bg-secondary/30">
                        <p className="text-2xl font-black uppercase tracking-widest text-slate-400">No Matches</p>
                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500 mt-2">Scheduled for this day</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 flex flex-col items-center z-10 w-full relative">
                <div className="absolute top-0 w-48 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                {totalPages && totalPages > 1 && (
                    <div className="mb-4 inline-block bg-primary border border-accent/50 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] shadow-lg">
                        Page {page} of {totalPages}
                    </div>
                )}
                <div className="inline-flex items-center gap-2 bg-gradient-to-br from-[#D4AF37] to-[#806B2A] text-primary font-black px-8 py-3.5 rounded-full text-lg shadow-glow mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    DVOCTZ.APP
                </div>
                <p className="text-[9px] text-[#D4AF37] opacity-80 uppercase tracking-[0.3em] font-bold">Dar Es Salaam Volleyball Oversee Committee</p>
            </div>
        </div>
    );
});
