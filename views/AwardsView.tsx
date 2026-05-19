
import React, { useMemo, useState } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import type { TournamentAward, Tournament } from '../types';

interface AwardsViewProps {
    onNavigate: (view: any) => void;
}

const AwardCard: React.FC<{ award: TournamentAward, tournamentName: string, onPlayerClick: (id: number) => void }> = ({ award, tournamentName, onPlayerClick }) => (
    <div className="bg-secondary/60 p-6 rounded-2xl shadow-lg flex flex-col items-center text-center backdrop-blur-md border border-accent/40 group h-full relative overflow-hidden transition-all duration-300 hover:shadow-premium hover:-translate-y-1 hover:border-[#D4AF37]/50">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#806B2A] p-1 shadow-glow flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
            <div className="bg-primary w-full h-full rounded-full flex items-center justify-center overflow-hidden border-2 border-primary">
                {award.imageUrl ? (
                    <img src={award.imageUrl} alt={award.awardName} className="w-full h-full object-cover" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M12,2.5c0,0-4-1-4,3v2c0,3,4,4,4,4s4-1,4-4V5.5C16,1.5,12,2.5,12,2.5z M20,6h-2v3.5c0,3.5-3.5,6-6,6.5v4h3v2H9v-2h3v-4c-2.5-0.5-6-3-6-6.5V6H4v2c0,4,3.5,6,6.5,6.5C10,18,12,19,12,19s2-1,1.5-4.5C16.5,14,20,12,20,8V6z"/>
                    </svg>
                )}
            </div>
        </div>
        <div className="flex flex-col flex-grow justify-between w-full relative z-10">
            <div>
                <h4 className="font-bold text-[#D4AF37] uppercase tracking-[0.2em] text-[10px] mb-2">{award.awardName}</h4>
                {award.playerId ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPlayerClick(award.playerId!); }} 
                        className="text-xl font-black text-white hover:text-[#D4AF37] transition-colors tracking-wide"
                    >
                        {award.recipientName}
                    </button>
                ) : (
                    <span className="text-xl font-black text-white tracking-wide">{award.recipientName}</span>
                )}
            </div>
            <div className="mt-4 pt-3 border-t border-accent/50 w-full">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.3em]">{tournamentName}</span>
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
        <div className="mb-8">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-6 rounded-2xl shadow-md border transition-all duration-300 group text-left ${isOpen ? 'bg-secondary border-[#D4AF37]/50 shadow-glow' : 'bg-secondary/40 border-accent/40 hover:bg-secondary/80 hover:border-slate-400/50'}`}
            >
                <div className="flex flex-col">
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors flex items-center gap-4">
                        {title}
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${isOpen ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-primary border-accent text-text-secondary'}`}>
                            {awards.length} Awards
                        </span>
                    </h2>
                    {subtitle && <p className="text-[#D4AF37] font-extrabold uppercase tracking-widest text-[9px] sm:text-[10px] mt-2 opacity-80">{subtitle}</p>}
                </div>
                <div className={`transform transition-transform duration-500 bg-primary/50 p-2 rounded-full border ${isOpen ? 'rotate-180 border-[#D4AF37]/50 text-[#D4AF37]' : 'border-accent text-text-secondary group-hover:text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="mt-6 p-2 animate-fade-in-up">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {awards.map(award => {
                            const tournament = tournaments.find(t => t.id === award.tournamentId);
                            return (
                                <AwardCard 
                                    key={award.id} 
                                    award={award} 
                                    tournamentName={tournament?.name || 'Unknown Tournament'}
                                    onPlayerClick={(id) => {
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
            if (!award.playerId) {
                app.push(award);
                return;
            }

            const tournament = tournaments.find(t => t.id === award.tournamentId);
            if (tournament?.division === 'Division 1') {
                d1.push(award);
            } else if (tournament?.division === 'Division 2') {
                d2.push(award);
            } else {
                app.push(award); 
            }
        });

        d1.sort((a,b) => b.id - a.id);
        d2.sort((a,b) => b.id - a.id);
        app.sort((a,b) => b.id - a.id);

        return { div1Awards: d1, div2Awards: d2, appreciationAwards: app };
    }, [tournamentAwards, tournaments]);

    if (awardsLoading || tourneyLoading) {
        return (
            <div className="flex justify-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-highlight"></div>
            </div>
        );
    }

    if (!tournamentAwards || tournamentAwards.length === 0) {
        return (
            <div className="text-center py-32 bg-secondary/30 rounded-3xl border border-accent/20 mx-4 mt-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-[#D4AF37]/50 mb-6" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12,2.5c0,0-4-1-4,3v2c0,3,4,4,4,4s4-1,4-4V5.5C16,1.5,12,2.5,12,2.5z M20,6h-2v3.5c0,3.5-3.5,6-6,6.5v4h3v2H9v-2h3v-4c-2.5-0.5-6-3-6-6.5V6H4v2c0,4,3.5,6,6.5,6.5C10,18,12,19,12,19s2-1,1.5-4.5C16.5,14,20,12,20,8V6z"/>
                </svg>
                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-widest uppercase">Hall of Fame</h1>
                <p className="text-text-secondary text-lg">No awards have been recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            <div className="text-center mb-16 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-[100px] pointer-events-none"></div>
                <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-text-secondary drop-shadow-md mb-4 uppercase tracking-tighter">Hall of Fame</h1>
                <p className="text-sm md:text-base font-bold uppercase tracking-[0.2em] text-[#D4AF37] max-w-2xl mx-auto">
                    Celebrating the champions, the stars, and the supporters of DVOC Tanzania.
                </p>
            </div>

            <div className="space-y-4 max-w-5xl mx-auto">
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
                    defaultOpen={true}
                />

                <AwardSection 
                    title="Special Mentions" 
                    subtitle="Sponsors, Officials & Guests" 
                    awards={appreciationAwards} 
                    tournaments={tournaments} 
                    onNavigate={onNavigate}
                    defaultOpen={true}
                />
            </div>
        </div>
    );
};
