import React from 'react';
// FIX: Replaced useSportsData with useSports and updated the import path.
import { useSports } from '../context/SportsDataContext';
import type { Fixture, Team, Tournament, View } from '../types';

interface HomeViewProps {
  onNavigate: (view: View) => void;
  onSelectTournament: (tournament: Tournament) => void;
}

const FixtureCard: React.FC<{ fixture: Fixture; team1?: Team; team2?: Team; }> = ({ fixture, team1, team2 }) => {
    if (!team1 || !team2) return null;
    
    return (
        <div className="bg-secondary rounded-lg p-4 text-center hover:bg-accent transition-colors duration-300">
            <p className="text-sm text-text-secondary mb-2">{new Date(fixture.dateTime).toLocaleString()}</p>
            <div className="flex items-center justify-center space-x-4">
                <div className="flex flex-col items-center">
                    <img src={team1.logoUrl} alt={team1.name} className="w-12 h-12 rounded-full mb-1" />
                    <span className="font-semibold text-sm">{team1.shortName}</span>
                </div>
                <span className="text-2xl font-bold text-text-secondary">VS</span>
                 <div className="flex flex-col items-center">
                    <img src={team2.logoUrl} alt={team2.name} className="w-12 h-12 rounded-full mb-1" />
                    <span className="font-semibold text-sm">{team2.shortName}</span>
                </div>
            </div>
            <p className="text-xs text-text-secondary mt-2">{fixture.ground}</p>
        </div>
    );
};


export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onSelectTournament }) => {
    const { getTeamById, fixtures } = useSports();
    const upcomingFixtures = fixtures.filter(f => f.status === 'upcoming').slice(0, 3);

    return (
        <div className="space-y-12">
            <div className="text-center p-8 bg-secondary rounded-xl shadow-lg">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Welcome to DVOC Tanzania</h1>
                <p className="text-lg text-text-secondary max-w-2xl mx-auto">Your one-stop destination for all tournaments, fixtures, teams, and player stats.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-secondary p-6 rounded-lg cursor-pointer hover:bg-highlight transition-all duration-300 group" onClick={() => onNavigate('tournaments')}>
                     <h2 className="text-2xl font-bold mb-2 group-hover:text-white">Division 1</h2>
                     <p className="text-text-secondary group-hover:text-white">Elite competition featuring the top teams.</p>
                </div>
                 <div className="bg-secondary p-6 rounded-lg cursor-pointer hover:bg-highlight transition-all duration-300 group" onClick={() => onNavigate('tournaments')}>
                     <h2 className="text-2xl font-bold mb-2 group-hover:text-white">Division 2</h2>
                     <p className="text-text-secondary group-hover:text-white">Showcasing the rising stars of the league.</p>
                </div>
            </div>

             <div>
                <h2 className="text-3xl font-bold text-center mb-6">Upcoming Matches</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {upcomingFixtures.map(fixture => (
                        <FixtureCard key={fixture.id} fixture={fixture} team1={getTeamById(fixture.team1Id)} team2={getTeamById(fixture.team2Id)} />
                    ))}
                </div>
            </div>
        </div>
    );
}