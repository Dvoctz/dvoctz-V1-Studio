
import React, { useMemo, useState } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import type { TournamentAward, Tournament } from '../types';

interface AwardsViewProps {
    onNavigate: (view: any) => void;
}

const AwardCard: React.FC<{ award: TournamentAward, tournamentName: string, onPlayerClick: (id: number) => void }> = ({ award, tournamentName, onPlayerClick }) => (
    <div className="bg-secondary p-4 rounded-lg shadow-lg flex flex-col items-center text-center hover:bg-accent transition-colors border border-transparent hover:border-yellow-500/50 group h-full">
        <div className="w-20 h-20 mb-3 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 p-1 shadow-md flex items-center justify-center overflow-hidden flex-shrink-0">
            {award.imageUrl ? (
                <img src={award.imageUrl} alt={award.awardName} className="w-full h-full object-cover rounded-full" />
            ) : (
                <div className="text-4xl">🏆</div>
            )}
        </div>
        <div className="flex flex-col flex-grow justify-between w-full">
            <div>
                <h4 className="font-bold text-yellow-400 uppercase tracking-widest text-xs mb-1">{award.awardName}</h4>
                {award.playerId ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPlayerClick(award.playerId!); }} 
                        className="text-lg font-black text-white hover:text-highlight transition-colors underline decoration-dotted decoration-text-secondary/50 hover:decoration-highlight"
                    >
                        {award.recipientName}
                    </button>
                ) : (
                    <span className="text-lg font-black text-white">{award.recipientName}</span>
                )}
            </div>
            <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">{tournamentName}</span>
            </div>
        </div>
    </div>
);

const AwardSection: React.FC<{ 
    title: string, 
    subtitle?: string, 
    awards: TournamentAward[], 
    tournaments: Tournament[], 
    onNavigate: any,
    defaultOpen?: boolean 
}> = ({ title, subtitle, awards, tournaments, onNavigate, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (awards.length === 0) return null;

    return (
        <div className="mb-6">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-5 rounded-lg shadow-md border border-accent transition-all duration-300 group text-left ${isOpen ? 'bg-secondary border-highlight/50' : 'bg-secondary/50 hover:bg-secondary hover:border-highlight/30'}`}
            >
                <div className="flex flex-col">
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight group-hover:text-highlight transition-colors flex items-center gap-3">
                        {title}
                        <span className="text-xs bg-primary px-2 py-1 rounded text-text-secondary font-medium tracking-normal border border-accent">
                            {awards.length} Awards
                        </span>
                    </h2>
                    {subtitle && <p className="text-highlight font-bold uppercase tracking-widest text-[10px] sm:text-xs mt-1">{subtitle}</p>}
                </div>
                <div className={`transform transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="mt-4 p-2 animate-fade-in-up">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {awards.map(award => {
                            const tournament = tournaments.find(t => t.id === award.tournamentId);
                            return (
                                <AwardCard 
                                    key={award.id} 
                                    award={award} 
                                    tournamentName={tournament?.name || 'Unknown Tournament'}
                                    onPlayerClick={(id) => {
                                        // Basic navigation simulation since full nav logic isn't passed deeply here usually
                                        console.log("Navigate to player", id);
                                    }} 
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export const AwardsView: React.FC<AwardsViewProps> = ({ onNavigate }) => {
    const { tournamentAwards, tournaments } = useSports();
    // Ensure data is loaded
    const { loading: awardsLoading } = useEntityData('tournamentAwards');
    const { loading: tourneyLoading } = useEntityData('tournaments');

    // Grouping Logic
    const { div1Awards, div2Awards, appreciationAwards } = useMemo(() => {
        const d1: TournamentAward[] = [];
        const d2: TournamentAward[] = [];
        const app: TournamentAward[] = [];

        (tournamentAwards || []).forEach(award => {
            // Logic: If no playerId, it's an Appreciation/Special award (Sponsors, Refs, etc)
            if (!award.playerId) {
                app.push(award);
                return;
            }

            // Otherwise, categorize by tournament division
            const tournament = tournaments.find(t => t.id === award.tournamentId);
            if (tournament?.division === 'Division 1') {
                d1.push(award);
            } else if (tournament?.division === 'Division 2') {
                d2.push(award);
            } else {
                // Fallback for awards linked to deleted tournaments or unknown
                app.push(award); 
            }
        });

        // Sort roughly by ID (newer first)
        d1.sort((a,b) => b.id - a.id);
        d2.sort((a,b) => b.id - a.id);
        app.sort((a,b) => b.id - a.id);

        return { div1Awards: d1, div2Awards: d2, appreciationAwards: app };
    }, [tournamentAwards, tournaments]);

    if (awardsLoading || tourneyLoading) {
        return (
            <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight"></div>
            </div>
        );
    }

    if (!tournamentAwards || tournamentAwards.length === 0) {
        return (
            <div className="text-center py-20">
                <h1 className="text-4xl font-extrabold text-white mb-4">Hall of Fame</h1>
                <p className="text-text-secondary text-lg">No awards have been recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12 border-b border-accent pb-8">
                <h1 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">Hall of Fame</h1>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                    Celebrating the champions, the stars, and the supporters of DVOC Tanzania.
                </p>
            </div>

            <div className="space-y-2">
                <AwardSection 
                    title="Division 1 Honors" 
                    subtitle="Elite Competition Winners" 
                    awards={div1Awards} 
                    tournaments={tournaments} 
                    onNavigate={onNavigate}
                    defaultOpen={true}
                />

                <AwardSection 
                    title="Division 2 Honors" 
                    subtitle="Rising Stars Winners" 
                    awards={div2Awards} 
                    tournaments={tournaments} 
                    onNavigate={onNavigate}
                    defaultOpen={false}
                />

                <AwardSection 
                    title="Special Mentions & Appreciation" 
                    subtitle="Sponsors, Officials & Guests" 
                    awards={appreciationAwards} 
                    tournaments={tournaments} 
                    onNavigate={onNavigate}
                    defaultOpen={false}
                />
            </div>
        </div>
    );
};
