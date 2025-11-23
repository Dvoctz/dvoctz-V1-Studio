
import React, { useMemo, useState, useRef } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import { NoticeBanner } from '../components/NoticeBanner';
import type { Fixture, Team, Tournament, View, Notice } from '../types';
import { ShareFixtureCard } from '../components/ShareFixtureCard';
import * as htmlToImage from 'html-to-image';

interface HomeViewProps {
  onNavigate: (view: View) => void;
  onSelectTournament: (tournament: Tournament) => void;
}

const FixtureCardSkeleton: React.FC = () => (
    <div className="bg-secondary rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-accent rounded w-3/4 mx-auto mb-4"></div>
        <div className="flex items-start justify-between space-x-2">
            <div className="flex flex-col items-center w-2/5">
                <div className="w-16 h-16 rounded-full bg-accent mb-2"></div>
                <div className="h-5 bg-accent rounded w-full"></div>
            </div>
            <div className="pt-8 w-1/5 flex justify-center"><div className="h-6 w-8 bg-accent rounded"></div></div>
            <div className="flex flex-col items-center w-2/5">
                <div className="w-16 h-16 rounded-full bg-accent mb-2"></div>
                <div className="h-5 bg-accent rounded w-full"></div>
            </div>
        </div>
        <div className="h-3 bg-accent rounded w-1/2 mx-auto mt-5"></div>
    </div>
);


const FixtureCard: React.FC<{ fixture: Fixture; team1?: Team; team2?: Team; }> = ({ fixture, team1, team2 }) => {
    if (!team1 || !team2) return null;
    
    return (
        <div className="bg-secondary rounded-lg p-4 text-center hover:bg-accent transition-colors duration-300 flex flex-col justify-between">
            <div>
                <p className="text-sm text-text-secondary mb-2">{new Date(fixture.dateTime).toLocaleString()}</p>
                <div className="flex items-start justify-between space-x-2">
                    <div className="flex flex-col items-center w-2/5 text-center">
                        <img src={team1.logoUrl} alt={team1.name} className="w-16 h-16 rounded-full mb-2 object-cover" />
                        <span className="font-semibold text-base text-text-primary break-words min-h-[48px]">{team1.name}</span>
                    </div>
                    <span className="text-2xl font-bold text-text-secondary pt-8">VS</span>
                     <div className="flex flex-col items-center w-2/5 text-center">
                        <img src={team2.logoUrl} alt={team2.name} className="w-16 h-16 rounded-full mb-2 object-cover" />
                        <span className="font-semibold text-base text-text-primary break-words min-h-[48px]">{team2.name}</span>
                    </div>
                </div>
            </div>
            <p className="text-xs text-text-secondary mt-4">{fixture.ground}</p>
        </div>
    );
};

// Daily Schedule & Share Modal
const DailyScheduleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { fixtures, getTeamById, tournaments } = useSports();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isGenerating, setIsGenerating] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const dayFixtures = useMemo(() => {
        return (fixtures || []).filter(f => f.dateTime.startsWith(selectedDate));
    }, [fixtures, selectedDate]);
    
    const getTournament = (id: number) => tournaments.find(t => t.id === id);

    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        
        try {
            // Slight delay to ensure render is complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2, // High resolution
                backgroundColor: '#1a202c'
            });

            // Convert to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `dvoc-schedule-${selectedDate}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'DVOC Daily Schedule',
                    text: `Check out the matches for ${selectedDate}!`,
                });
            } else {
                // Fallback for desktop: download
                const link = document.createElement('a');
                link.download = `dvoc-schedule-${selectedDate}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Failed to generate image', err);
            alert('Could not generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-2xl transform transition-all flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-accent flex justify-between items-center bg-secondary rounded-t-xl z-20">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Daily Schedule
                    </h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-primary relative">
                     {/* Controls */}
                    <div className="flex justify-center mb-6 sticky top-0 z-10 bg-primary py-2 border-b border-accent/50">
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            className="bg-secondary text-white p-3 rounded-lg border border-accent focus:border-highlight outline-none shadow-lg cursor-pointer"
                        />
                    </div>

                    {/* Preview Area */}
                    <div className="flex justify-center">
                         {/* We scale the card down visually to fit, but render full size for capture */}
                        <div className="origin-top transform scale-[0.45] sm:scale-[0.6]" style={{ height: dayFixtures.length > 3 ? '600px' : '600px', width: '540px', marginBottom: '-300px' }}> {/* Negative margin to compensate for scale */}
                             <ShareFixtureCard 
                                ref={cardRef}
                                date={selectedDate}
                                fixtures={dayFixtures}
                                getTeam={getTeamById}
                                getTournament={getTournament}
                             />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-accent bg-secondary rounded-b-xl z-20 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded text-text-secondary hover:text-white font-medium">Close</button>
                    <button 
                        onClick={handleShare} 
                        disabled={isGenerating}
                        className="px-6 py-2 bg-highlight hover:bg-teal-400 text-white rounded font-bold shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>Generating...</>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Share Image
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onSelectTournament }) => {
    const { getTeamById, getActiveNotice } = useSports();
    const { data: fixtures, loading: fixturesLoading } = useEntityData('fixtures');
    // Ensure teams are loaded so cards render correctly
    const { loading: teamsLoading } = useEntityData('teams');
    const { loading: noticesLoading } = useEntityData('notices');
    
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const upcomingFixtures = useMemo(() => (fixtures || []).filter(f => f.status === 'upcoming').slice(0, 3), [fixtures]);
    const activeNotice = getActiveNotice();

    const isDataLoading = fixturesLoading || teamsLoading;

    return (
        <div className="space-y-12">
            {!noticesLoading && activeNotice && <NoticeBanner notice={activeNotice} />}

            <div className="text-center p-8 bg-secondary rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Welcome to DVOC Tanzania</h1>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-6">Your one-stop destination for all Tanzania Traditional Volleyball tournaments, fixtures, teams, and player stats.</p>
                    
                    {/* New Share Button */}
                    <button 
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="inline-flex items-center px-6 py-3 bg-highlight hover:bg-teal-400 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Get Daily Schedule Card
                    </button>
                </div>
                 {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-highlight/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
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
                    {isDataLoading ? (
                        <>
                            <FixtureCardSkeleton />
                            <FixtureCardSkeleton />
                            <FixtureCardSkeleton />
                        </>
                    ) : (
                        upcomingFixtures.map(fixture => (
                            <FixtureCard key={fixture.id} fixture={fixture} team1={getTeamById(fixture.team1Id)} team2={getTeamById(fixture.team2Id)} />
                        ))
                    )}
                </div>
            </div>
            
            {isScheduleModalOpen && <DailyScheduleModal onClose={() => setIsScheduleModalOpen(false)} />}
        </div>
    );
}
