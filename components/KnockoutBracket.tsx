import React, { useMemo } from 'react';
import { useSports } from '../context/SportsDataContext';
import type { Fixture, Team, Tournament } from '../types';

const MatchupCard: React.FC<{ fixture?: Fixture; placeholderText: string }> = ({ fixture, placeholderText }) => {
    const { getTeamById } = useSports();
    
    const team1 = fixture ? getTeamById(fixture.team1Id) : null;
    const team2 = fixture ? getTeamById(fixture.team2Id) : null;

    const renderTeam = (team: Team | null, score?: number) => {
        const isWinner = fixture?.status === 'completed' && fixture.score && score === Math.max(fixture.score.team1Score, fixture.score.team2Score);
        const scoreExists = typeof score === 'number';

        return (
            <div className={`flex justify-between items-center w-full px-3 py-2 rounded-lg transition-colors ${isWinner ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent border-l-2 border-[#D4AF37]' : 'border-l-2 border-transparent'}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {team?.logoUrl ? (
                         <div className="relative">
                             {isWinner && <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-sm opacity-40"></div>}
                             <img src={team.logoUrl} alt={team.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0 relative z-10 bg-primary/50" />
                         </div>
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-secondary border border-white/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-slate-400">{team?.name?.charAt(0) || '?'}</span>
                        </div>
                    )}
                    <span className={`text-sm tracking-wide truncate ${isWinner ? 'font-black text-white' : 'font-semibold text-slate-300'}`}>{team?.name || 'TBD'}</span>
                </div>
                {scoreExists && <span className={`text-sm font-black ml-3 ${isWinner ? 'text-[#D4AF37]' : 'text-slate-500'}`}>{score}</span>}
            </div>
        );
    };
    
    return (
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-primary/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="bg-secondary/40 backdrop-blur-md p-1.5 rounded-2xl w-full flex flex-col justify-center shadow-xl border border-white/10 relative z-10 hover:border-white/20 transition-all">
                <div className="space-y-1">
                    {fixture ? (
                        <>
                            {renderTeam(team1, fixture.score?.team1Score)}
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-2"></div>
                            {renderTeam(team2, fixture.score?.team2Score)}
                        </>
                    ) : (
                        <div className="py-6 px-4 flex items-center justify-center">
                            <p className="text-center text-xs font-bold uppercase tracking-widest text-[#D4AF37]/50">{placeholderText}</p>
                        </div>
                    )}
                </div>
                 {fixture?.status === 'completed' && (
                     <div className="absolute -top-2.5 -right-2.5 bg-primary border border-white/10 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 shadow-md">
                         Final
                     </div>
                 )}
                 {fixture?.status === 'scheduled' && (
                     <div className="absolute -top-2.5 -right-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#D4AF37] shadow-md backdrop-blur-sm">
                         Upcoming
                     </div>
                 )}
            </div>
        </div>
    );
};

const BracketColumn: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="flex flex-col items-center gap-6 flex-1 w-full min-w-[280px]">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37] flex items-center gap-3">
             <span className="w-6 h-px bg-[#D4AF37]/40"></span>
             {title}
             <span className="w-6 h-px bg-[#D4AF37]/40"></span>
        </h3>
        <div className="flex flex-col gap-8 w-full max-w-[320px] justify-around flex-grow relative">
            {children}
        </div>
    </div>
);

export const KnockoutBracket: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
    const { fixtures } = useSports();
    
    const knockoutFixtures = useMemo(() => {
        const all = fixtures.filter(f => f.tournamentId === tournament.id && f.stage);
        const quarters = all.filter(f => f.stage === 'quarter-final');
        const semis = all.filter(f => f.stage === 'semi-final');
        const final = all.find(f => f.stage === 'final');
        return { quarters, semis, final };
    }, [fixtures, tournament.id]);

    const { quarters, semis, final } = knockoutFixtures;

    if (quarters.length === 0 && semis.length === 0 && !final) {
        return (
            <div className="text-center p-12 bg-primary/40 rounded-3xl border border-dashed border-white/10 mx-4 max-w-2xl w-full self-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#D4AF37]/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                 </svg>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Knockout fixtures not yet generated</p>
            </div>
        );
    }
    
    const div1QuarterTitles = ['1st vs 8th', '4th vs 5th', '2nd vs 7th', '3rd vs 6th'];
    const div2SemiTitles = ['1st vs 4th', '2nd vs 3rd'];

    if (tournament.division === 'Division 1') {
        return (
            <div className="flex flex-col lg:flex-row items-stretch justify-center gap-12 p-8 overflow-x-auto relative min-h-[600px] w-full">
                {/* Decorative background elements */}
                <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-primary/50 rounded-full blur-[100px] pointer-events-none transform -translate-y-1/2"></div>

                <BracketColumn title="Quarter Finals">
                    {div1QuarterTitles.map((_, i) => <MatchupCard key={i} fixture={quarters[i]} placeholderText={`Winner of QF ${i+1}`} />)}
                </BracketColumn>
                <BracketColumn title="Semi Finals">
                    <MatchupCard fixture={semis[0]} placeholderText="Winner QF1 / QF2" />
                    <MatchupCard fixture={semis[1]} placeholderText="Winner QF3 / QF4" />
                </BracketColumn>
                <div className="flex flex-col items-center gap-6 flex-1 w-full min-w-[320px]">
                     <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white drop-shadow-md flex items-center gap-4">
                         <span className="w-8 h-[2px] bg-white/20"></span>
                         Grand Final
                         <span className="w-8 h-[2px] bg-white/20"></span>
                     </h3>
                     <div className="flex flex-col items-center justify-center flex-grow w-full relative">
                         {/* Golden glow for final */}
                         <div className="absolute inset-0 bg-[#D4AF37]/10 blur-3xl rounded-full scale-110 pointer-events-none"></div>
                         <div className="w-full transform xl:scale-110 relative z-10">
                            <MatchupCard fixture={final} placeholderText="Winner SF1 / SF2" />
                         </div>
                     </div>
                </div>
            </div>
        );
    }

    if (tournament.division === 'Division 2') {
        return (
            <div className="flex flex-col lg:flex-row items-stretch justify-center gap-12 p-8 overflow-x-auto relative w-full">
                <BracketColumn title="Semi Finals">
                    {div2SemiTitles.map((_, i) => <MatchupCard key={i} fixture={semis[i]} placeholderText={`Winner of SF ${i+1}`} />)}
                </BracketColumn>
                <div className="flex flex-col items-center gap-6 flex-1 w-full min-w-[320px]">
                     <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white drop-shadow-md flex items-center gap-4">
                         <span className="w-8 h-[2px] bg-white/20"></span>
                         Grand Final
                         <span className="w-8 h-[2px] bg-white/20"></span>
                     </h3>
                     <div className="flex flex-col items-center justify-center flex-grow w-full relative">
                         <div className="absolute inset-0 bg-[#D4AF37]/10 blur-3xl rounded-full scale-110 pointer-events-none"></div>
                         <div className="w-full transform xl:scale-110 relative z-10">
                            <MatchupCard fixture={final} placeholderText="Winner SF1 / SF2" />
                         </div>
                     </div>
                </div>
            </div>
        );
    }
    
    return null;
};