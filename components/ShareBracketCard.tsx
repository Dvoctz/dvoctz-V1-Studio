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
        <div className="bg-secondary/90 border border-accent rounded p-2 w-full text-xs shadow-sm">
            <div className={`flex justify-between items-center p-1 rounded ${t1Win ? 'bg-highlight/20 font-bold' : ''}`}>
                <span className={`truncate ${t1Win ? 'text-highlight' : 'text-white'}`}>{t1?.shortName || t1?.name || 'TBD'}</span>
                {completed && <span className="text-white ml-2">{s1}</span>}
            </div>
            <div className={`flex justify-between items-center p-1 rounded mt-1 ${t2Win ? 'bg-highlight/20 font-bold' : ''}`}>
                 <span className={`truncate ${t2Win ? 'text-highlight' : 'text-white'}`}>{t2?.shortName || t2?.name || 'TBD'}</span>
                 {completed && <span className="text-white ml-2">{s2}</span>}
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
            className="bg-primary text-white relative flex flex-col items-center" 
            style={{ 
                width: '1080px', 
                height: '1080px', // Square for social media
                padding: '40px',
                fontFamily: 'Inter, system-ui, sans-serif'
            }}
        >
             {/* Background */}
             <div className="absolute inset-0 opacity-5 pointer-events-none">
                 <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs><pattern id="grid-bracket" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
                    <rect width="100%" height="100%" fill="url(#grid-bracket)" />
                </svg>
            </div>

            <div className="text-center mb-8 z-10 w-full border-b-4 border-highlight pb-6">
                 <div className="flex items-center justify-center gap-2 mb-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
                     </svg>
                     <span className="text-highlight font-bold tracking-widest uppercase text-lg">DVOC Tanzania</span>
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tight">{tournament.name}</h1>
                <div className="inline-block bg-highlight text-primary px-6 py-2 rounded font-bold uppercase tracking-widest text-lg mt-2">
                    {tournament.division} • Knockout Stage
                </div>
            </div>

            <div className="flex-grow w-full flex justify-between items-center gap-8 px-8 z-10">
                {/* Quarter Finals */}
                {quarters.length > 0 && (
                     <div className="flex flex-col justify-around h-full w-64">
                         <h3 className="text-center text-highlight font-bold uppercase mb-4 tracking-widest">Quarter Finals</h3>
                         {quarters.map((q, i) => (
                             <div key={i} className="my-2"><MatchBox fixture={q} getTeam={getTeam} /></div>
                         ))}
                     </div>
                )}

                {/* Connectors (Simplified) */}
                {quarters.length > 0 && (
                     <div className="flex flex-col justify-around h-full py-16 opacity-30 w-8">
                         {/* Visual spacing for bracket lines */}
                         <div className="border-r-2 border-white h-1/4"></div>
                         <div className="border-r-2 border-white h-1/4"></div>
                     </div>
                )}

                {/* Semi Finals */}
                <div className="flex flex-col justify-around h-full w-64 py-16">
                    <h3 className="text-center text-highlight font-bold uppercase mb-4 tracking-widest">Semi Finals</h3>
                    {semis.length > 0 ? semis.map((s, i) => (
                        <div key={i} className="my-4"><MatchBox fixture={s} getTeam={getTeam} /></div>
                    )) : (
                        <>
                             <div className="my-4"><MatchBox fixture={undefined} getTeam={getTeam} /></div>
                             <div className="my-4"><MatchBox fixture={undefined} getTeam={getTeam} /></div>
                        </>
                    )}
                </div>

                {/* Final */}
                <div className="flex flex-col justify-center h-full w-72">
                     <h3 className="text-center text-highlight font-bold uppercase mb-4 tracking-widest">Grand Final</h3>
                     <div className="transform scale-125">
                        <MatchBox fixture={final} getTeam={getTeam} />
                     </div>
                     {final?.status === 'completed' && (
                         <div className="mt-8 text-center bg-black/40 p-4 rounded-xl border border-yellow-500/50">
                             <span className="text-2xl font-black text-yellow-400 block mb-1">🏆 CHAMPIONS</span>
                             <span className="text-xl font-bold text-white">
                                 {(final.score?.team1Score || 0) > (final.score?.team2Score || 0) 
                                     ? getTeam(final.team1Id)?.name 
                                     : getTeam(final.team2Id)?.name}
                             </span>
                         </div>
                     )}
                </div>
            </div>

            <div className="mt-auto pt-4 text-center z-10 w-full">
                <p className="text-highlight font-bold text-xl tracking-widest">dvoctz.app</p>
            </div>
        </div>
    );
});
