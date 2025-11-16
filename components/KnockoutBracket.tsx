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
            <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {team?.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-accent flex-shrink-0"></div>
                    )}
                    <span className={`text-sm truncate ${isWinner ? 'font-bold text-white' : 'text-text-primary'}`}>{team?.name || 'TBD'}</span>
                </div>
                {scoreExists && <span className={`text-sm font-bold ml-2 ${isWinner ? 'text-white' : 'text-text-secondary'}`}>{score}</span>}
            </div>
        );
    };
    
    return (
        <div className="bg-secondary p-3 rounded-md w-full min-h-[90px] flex flex-col justify-center shadow-md">
            <div className="space-y-2">
                {fixture ? (
                    <>
                        {renderTeam(team1, fixture.score?.team1Score)}
                        <div className="border-t border-accent my-1"></div>
                        {renderTeam(team2, fixture.score?.team2Score)}
                    </>
                ) : (
                    <p className="text-center text-sm text-text-secondary">{placeholderText}</p>
                )}
            </div>
             {fixture?.status === 'completed' && <p className="text-xs text-highlight mt-2 text-right">Final</p>}
        </div>
    );
};

const BracketColumn: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="flex flex-col items-center gap-4 flex-1">
        <h3 className="text-xl font-bold uppercase tracking-wider text-text-secondary">{title}</h3>
        <div className="flex flex-col gap-4 w-full max-w-xs">
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
        return <p className="text-center text-text-secondary p-8">Knockout fixtures have not been generated yet.</p>;
    }
    
    const div1QuarterTitles = ['1st vs 8th', '4th vs 5th', '2nd vs 7th', '3rd vs 6th'];
    const div2SemiTitles = ['1st vs 4th', '2nd vs 3rd'];

    if (tournament.division === 'Division 1') {
        return (
            <div className="flex flex-col lg:flex-row items-start justify-center gap-8 p-4 overflow-x-auto">
                <BracketColumn title="Quarterfinals">
                    {div1QuarterTitles.map((_, i) => <MatchupCard key={i} fixture={quarters[i]} placeholderText={`Winner of QF ${i+1}`} />)}
                </BracketColumn>
                <BracketColumn title="Semifinals">
                    <MatchupCard fixture={semis[0]} placeholderText="Winner QF1/QF2" />
                    <MatchupCard fixture={semis[1]} placeholderText="Winner QF3/QF4" />
                </BracketColumn>
                <BracketColumn title="Final">
                    <MatchupCard fixture={final} placeholderText="Winner SF1/SF2" />
                </BracketColumn>
            </div>
        );
    }

    if (tournament.division === 'Division 2') {
        return (
            <div className="flex flex-col lg:flex-row items-start justify-center gap-8 p-4 overflow-x-auto">
                <BracketColumn title="Semifinals">
                    {div2SemiTitles.map((_, i) => <MatchupCard key={i} fixture={semis[i]} placeholderText={`Winner of SF ${i+1}`} />)}
                </BracketColumn>
                <BracketColumn title="Final">
                    <MatchupCard fixture={final} placeholderText="Winner SF1/SF2" />
                </BracketColumn>
            </div>
        );
    }
    
    return null;
};