import React, { forwardRef, useMemo } from 'react';
import type { Fixture, Tournament, Team } from '../types';

interface ShareBracketCardProps {
    tournament: Tournament;
    fixtures: Fixture[];
    getTeam: (id: number) => Team | undefined;
}

const MatchBox = ({ fixture, getTeam }: { fixture?: Fixture, getTeam: (id: number) => Team | undefined }) => {
    const t1 = fixture ? getTeam(fixture.team1Id) : null;
    const t2 = fixture ? getTeam(fixture.team2Id) : null;
    const s1 = fixture?.score?.team1Score;
    const s2 = fixture?.score?.team2Score;
    const completed = fixture?.status === 'completed';
    const t1Win = completed && (s1 ?? 0) > (s2 ?? 0);
    const t2Win = completed && (s2 ?? 0) > (s1 ?? 0);

    return (
        <div className="bg-secondary/40 backdrop-blur-md border border-white/10 rounded-xl p-3 w-full text-sm shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-[#D4AF37]/50 to-primary/50"></div>
            
            <div className={`flex justify-between items-center px-3 py-2 rounded-lg transition-colors ${t1Win ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30' : ''}`}>
                <span className={`truncate font-bold tracking-wide ${t1Win ? 'text-white' : 'text-slate-300'}`}>{t1?.shortName || t1?.name || 'TBD'}</span>
                {completed && (
                    <span className={`ml-3 font-black text-lg ${t1Win ? 'text-[#D4AF37]' : 'text-slate-500'}`}>{s1}</span>
                )}
            </div>
            
            <div className="h-px w-full bg-white/5 my-1" />
            
            <div className={`flex justify-between items-center px-3 py-2 rounded-lg transition-colors ${t2Win ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30' : ''}`}>
                 <span className={`truncate font-bold tracking-wide ${t2Win ? 'text-white' : 'text-slate-300'}`}>{t2?.shortName || t2?.name || 'TBD'}</span>
                 {completed && (
                    <span className={`ml-3 font-black text-lg ${t2Win ? 'text-[#D4AF37]' : 'text-slate-500'}`}>{s2}</span>
                 )}
            </div>
        </div>
    )
}

export const ShareBracketCard = forwardRef<HTMLDivElement, ShareBracketCardProps>(({ tournament, fixtures, getTeam }, ref) => {
    
    // Sort logic
    const knockoutFixtures = useMemo(() => {
        const quarters = fixtures.filter(f => f.stage === 'quarter-final').sort((a,b) => a.id - b.id);
        const semis = fixtures.filter(f => f.stage === 'semi-final').sort((a,b) => a.id - b.id);
        const final = fixtures.find(f => f.stage === 'final');
        return { quarters, semis, final };
    }, [fixtures]);

    const { quarters, semis, final } = knockoutFixtures;

    return (
        <div 
            ref={ref} 
            className="bg-primary text-white relative flex flex-col items-center overflow-hidden" 
            style={{ 
                width: '1080px', 
                height: '1080px', // Square for social media
                padding: '60px',
                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}
        >
            {/* Premium Background */}
            <div className="absolute inset-0 bg-primary z-0"></div>
            <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-[#D4AF37]/15 to-transparent z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 inset-x-0 h-[400px] bg-gradient-to-t from-[#D4AF37]/10 to-transparent z-0 pointer-events-none"></div>
            
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

             {/* Texture */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay">
                 <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs><pattern id="grid-bracket" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
                    <rect width="100%" height="100%" fill="url(#grid-bracket)" />
                </svg>
            </div>

            <div className="text-center mb-16 z-10 w-full relative">
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-glow"></div>
                 
                 <div className="flex items-center justify-center gap-4 mb-4">
                     <div className="p-3 bg-gradient-to-br from-[#D4AF37] to-[#806B2A] rounded-2xl shadow-glow">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2 12h20" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
                         </svg>
                     </div>
                     <span className="font-black tracking-[0.2em] uppercase text-2xl drop-shadow-sm text-white">DVOC <span className="text-[#D4AF37]">TZ</span></span>
                </div>
                
                <h1 className="text-[64px] font-black uppercase tracking-tighter drop-shadow-lg mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">{tournament.name}</h1>
                
                <div className="inline-flex items-center gap-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-8 py-2.5 rounded-full shadow-inner mb-6">
                    <span className="text-[#D4AF37] font-black uppercase tracking-[0.3em] text-lg">{tournament.division}</span>
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                    <span className="text-white opacity-90 font-bold uppercase tracking-[0.2em] text-lg">Knockout Stage</span>
                </div>
            </div>

            <div className="flex-grow w-full flex justify-between items-center gap-12 px-8 z-10">
                {/* Quarter Finals */}
                {quarters.length > 0 && (
                     <div className="flex flex-col justify-around h-full w-[280px]">
                         <h3 className="text-center text-slate-400 font-black uppercase tracking-[0.3em] mb-4 text-sm flex items-center justify-center gap-2">
                             <span className="w-12 h-px bg-slate-600"></span> Quarter Finals <span className="w-12 h-px bg-slate-600"></span>
                         </h3>
                         <div className="flex flex-col justify-around flex-grow py-8">
                             {quarters.map((q, i) => (
                                 <div key={i} className="my-2 relative z-10"><MatchBox fixture={q} getTeam={getTeam} /></div>
                             ))}
                         </div>
                     </div>
                )}

                {/* Semi Finals */}
                <div className="flex flex-col justify-around h-full w-[280px]">
                    <h3 className="text-center text-[#D4AF37] font-black uppercase tracking-[0.3em] mb-4 text-sm flex items-center justify-center gap-2">
                         <span className="w-12 h-px bg-[#D4AF37]/40"></span> Semi Finals <span className="w-12 h-px bg-[#D4AF37]/40"></span>
                    </h3>
                    <div className="flex flex-col justify-around flex-grow py-24">
                        {semis.length > 0 ? semis.map((s, i) => (
                            <div key={i} className="my-4 relative z-10"><MatchBox fixture={s} getTeam={getTeam} /></div>
                        )) : (
                            <>
                                 <div className="my-4"><MatchBox fixture={undefined} getTeam={getTeam} /></div>
                                 <div className="my-4"><MatchBox fixture={undefined} getTeam={getTeam} /></div>
                            </>
                        )}
                    </div>
                </div>

                {/* Final */}
                <div className="flex flex-col justify-center h-full w-[340px] relative">
                     <h3 className="absolute top-1/4 w-full text-center text-white drop-shadow-md font-black uppercase tracking-[0.4em] mb-4 text-xl flex items-center justify-center gap-4">
                         <span className="w-16 h-[2px] bg-white/20"></span> GRAND FINAL <span className="w-16 h-[2px] bg-white/20"></span>
                     </h3>
                     
                     <div className="relative z-20">
                        {/* Glow behind final */}
                        <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-full scale-150 pointer-events-none"></div>
                        
                        <div className="transform scale-110 shadow-2xl">
                            <MatchBox fixture={final} getTeam={getTeam} />
                        </div>
                     </div>
                     
                     {final?.status === 'completed' && (
                         <div className="absolute mt-16 top-[65%] w-full text-center bg-gradient-to-b from-[#D4AF37]/10 to-primary/90 p-6 rounded-3xl border border-[#D4AF37]/40 shadow-glow backdrop-blur-md">
                             <div className="flex items-center justify-center gap-3 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D4AF37]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                 <span className="text-xl font-black text-[#D4AF37] tracking-[0.2em] uppercase">Champions</span>
                             </div>
                             <span className="text-3xl font-black text-white px-4 block">
                                 {(final.score?.team1Score || 0) > (final.score?.team2Score || 0) 
                                     ? getTeam(final.team1Id)?.name 
                                     : getTeam(final.team2Id)?.name}
                             </span>
                         </div>
                     )}
                </div>
            </div>

            <div className="mt-8 pt-8 flex flex-col items-center z-10 w-full relative">
                <div className="absolute top-0 w-64 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                 <div className="inline-flex items-center gap-2 bg-gradient-to-br from-[#D4AF37] to-[#806B2A] text-primary font-black px-10 py-3.5 rounded-full text-xl shadow-glow mb-2">
                     DVOCTZ.APP
                 </div>
                 <p className="text-[11px] text-[#D4AF37] opacity-80 uppercase tracking-[0.4em] font-bold mt-2">Dar Es Salaam Volleyball Oversee Committee</p>
            </div>
        </div>
    );
});
