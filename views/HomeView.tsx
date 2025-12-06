
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import { NoticeBanner } from '../components/NoticeBanner';
import type { Fixture, Team, Tournament, View, Notice, TeamStanding, Player } from '../types';
import { ShareFixtureCard } from '../components/ShareFixtureCard';
import { MVPSpotlightCard } from '../components/MVPSpotlightCard';
import { ChampionsCard } from '../components/ChampionsCard';
import * as htmlToImage from 'html-to-image';
import confetti from 'canvas-confetti';

interface HomeViewProps {
  onNavigate: (view: View) => void;
  onSelectTournament: (tournament: Tournament) => void;
}

const MiniStandingsTable: React.FC<{ title: string; standings: TeamStanding[]; onViewFull: () => void }> = ({ title, standings, onViewFull }) => (
    <div className="bg-secondary rounded-lg shadow-lg overflow-hidden flex flex-col h-full border border-accent">
        <div className="p-4 border-b border-accent flex justify-between items-center bg-secondary">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <span className="text-[10px] font-bold bg-highlight text-primary px-2 py-1 rounded uppercase tracking-wider">Top 5</span>
        </div>
        <div className="flex-grow overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-primary/50 text-text-secondary">
                    <tr>
                        <th className="px-3 py-2 text-center w-8">#</th>
                        <th className="px-3 py-2 text-left">Team</th>
                        <th className="px-3 py-2 text-center w-8">P</th>
                        <th className="px-3 py-2 text-center w-8 font-bold text-white">Pts</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-accent">
                    {standings.length > 0 ? standings.slice(0, 5).map((s, i) => (
                        <tr key={s.teamId} className="hover:bg-primary/50 transition-colors">
                            <td className="px-3 py-2 text-center text-text-secondary font-medium">{i + 1}</td>
                            <td className="px-3 py-2 flex items-center gap-2 text-white font-medium">
                                {s.logoUrl ? (
                                    <img src={s.logoUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-accent flex-shrink-0" />
                                )}
                                <span className="truncate max-w-[140px]">{s.teamName}</span>
                            </td>
                            <td className="px-3 py-2 text-center text-text-secondary">{s.gamesPlayed}</td>
                            <td className="px-3 py-2 text-center font-bold text-highlight">{s.points}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-text-secondary">No standings available yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="p-3 border-t border-accent bg-secondary text-center mt-auto">
            <button 
                onClick={onViewFull} 
                className="text-sm font-semibold text-highlight hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
            >
                View Full Table
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    </div>
);

// Daily Schedule & Share Modal
const DailyScheduleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { fixtures, getTeamById, tournaments } = useSports();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // We maintain an array of refs for multiple pages
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    const dayFixtures = useMemo(() => {
        return (fixtures || [])
            .filter(f => f.dateTime.startsWith(selectedDate))
            // Sort by time (ascending) BEFORE chunking so that Page 1 has the earliest games, Page 2 the next, etc.
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }, [fixtures, selectedDate]);
    
    const getTournament = (id: number) => tournaments.find(t => t.id === id);
    
    // Split fixtures into chunks to prevent super tall images
    const FIXTURES_PER_PAGE = 4;
    const fixtureChunks = useMemo(() => {
        if (!dayFixtures.length) return [];
        const chunks = [];
        for (let i = 0; i < dayFixtures.length; i += FIXTURES_PER_PAGE) {
            chunks.push(dayFixtures.slice(i, i + FIXTURES_PER_PAGE));
        }
        return chunks;
    }, [dayFixtures]);

    // Clean up refs if chunks decrease
    useEffect(() => {
        cardRefs.current = cardRefs.current.slice(0, fixtureChunks.length);
    }, [fixtureChunks]);

    const handleShare = async () => {
        if (fixtureChunks.length === 0) return;
        setIsGenerating(true);
        
        try {
            // Delay to ensure render is complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const files: File[] = [];

            // Generate an image for each chunk/page
            for (let i = 0; i < fixtureChunks.length; i++) {
                const cardElement = cardRefs.current[i];
                if (!cardElement) continue;

                const dataUrl = await htmlToImage.toPng(cardElement, {
                    quality: 0.95,
                    pixelRatio: 2,
                    backgroundColor: '#1a202c',
                    skipFonts: true, // Use system fonts for faster generation
                    width: 540,
                    // Ensure full content is captured, but enforce a reasonable minimum for consistency
                    height: Math.max(960, cardElement.scrollHeight)
                });

                const response = await fetch(dataUrl);
                const blob = await response.blob();
                const file = new File([blob], `dvoc-schedule-${selectedDate}-part${i+1}.png`, { type: 'image/png' });
                files.push(file);
            }

            if (files.length > 0) {
                if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
                    await navigator.share({
                        files: files,
                        title: 'DVOC Daily Schedule',
                        text: `Check out the matches for ${selectedDate}!`,
                    });
                } else {
                    // Fallback for desktop: download each file
                    files.forEach(file => {
                        const link = document.createElement('a');
                        link.download = file.name;
                        link.href = URL.createObjectURL(file);
                        link.click();
                    });
                }
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

                    {/* Preview Area - Stacked vertically if multiple pages */}
                    <div className="flex flex-col items-center gap-8 pb-10">
                        {fixtureChunks.length > 0 ? (
                            fixtureChunks.map((chunk, index) => (
                                <div key={index} className="origin-top transform scale-[0.5] sm:scale-[0.6] flex-shrink-0" style={{ width: '540px', height: '960px', marginBottom: '-300px' /* Comprensate for scale */ }}> 
                                    <ShareFixtureCard 
                                        ref={el => { cardRefs.current[index] = el; }}
                                        date={selectedDate}
                                        fixtures={chunk}
                                        getTeam={getTeamById}
                                        getTournament={getTournament}
                                        page={index + 1}
                                        totalPages={fixtureChunks.length}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-text-secondary">No fixtures found for this date.</div>
                        )}
                        {/* Spacer to push content up so the last card isn't cut off by negative margin logic visual glitch */}
                        <div style={{ height: '300px' }}></div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-accent bg-secondary rounded-b-xl z-20 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded text-text-secondary hover:text-white font-medium">Close</button>
                    <button 
                        onClick={handleShare} 
                        disabled={isGenerating || fixtureChunks.length === 0}
                        className="px-6 py-2 bg-highlight hover:bg-teal-400 text-white rounded font-bold shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>Generating...</>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Share {fixtureChunks.length > 1 ? `(${fixtureChunks.length} Pages)` : 'Image'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onSelectTournament }) => {
    const { getActiveNotice, getTournamentsByDivision, getStandingsForTournament, fixtures, players, teams } = useSports();
    // Ensure data is loaded
    useEntityData('fixtures');
    useEntityData('teams');
    useEntityData('players');
    const { loading: noticesLoading } = useEntityData('notices');
    const { loading: tournamentsLoading } = useEntityData('tournaments');
    
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [celebrationShown, setCelebrationShown] = useState(false);

    const activeNotice = getActiveNotice();

    // Get active tournaments (heuristic: highest ID usually means newest/current)
    const activeDiv1Tournament = useMemo(() => {
        const list = getTournamentsByDivision('Division 1');
        return list.length > 0 ? list.sort((a,b) => b.id - a.id)[0] : null;
    }, [getTournamentsByDivision]);

    const activeDiv2Tournament = useMemo(() => {
        const list = getTournamentsByDivision('Division 2');
        return list.length > 0 ? list.sort((a,b) => b.id - a.id)[0] : null;
    }, [getTournamentsByDivision]);

    // Calculate Standings
    const div1Standings = useMemo(() => 
        activeDiv1Tournament ? getStandingsForTournament(activeDiv1Tournament.id) : [], 
    [activeDiv1Tournament, getStandingsForTournament]);

    const div2Standings = useMemo(() => 
        activeDiv2Tournament ? getStandingsForTournament(activeDiv2Tournament.id) : [], 
    [activeDiv2Tournament, getStandingsForTournament]);

    // Helper: Determine Champion for a division
    const getChampion = (tournament: Tournament | null) => {
        if (!tournament || !fixtures || !teams) return null;
        
        const finalFixture = fixtures.find(f => f.tournamentId === tournament.id && f.stage === 'final' && f.status === 'completed');
        if (!finalFixture || !finalFixture.score) return null;
        
        const isTeam1Winner = finalFixture.score.team1Score > finalFixture.score.team2Score;
        const winningTeamId = isTeam1Winner ? finalFixture.team1Id : finalFixture.team2Id;
        const winningTeam = teams.find(t => t.id === winningTeamId);
        
        if (!winningTeam) return null;
        
        const resultText = `Won ${Math.max(finalFixture.score.team1Score, finalFixture.score.team2Score)}-${Math.min(finalFixture.score.team1Score, finalFixture.score.team2Score)} in Final`;
        
        return {
            team: winningTeam,
            tournamentName: tournament.name,
            division: tournament.division,
            resultText
        };
    };

    const div1Champion = useMemo(() => getChampion(activeDiv1Tournament), [activeDiv1Tournament, fixtures, teams]);
    const div2Champion = useMemo(() => getChampion(activeDiv2Tournament), [activeDiv2Tournament, fixtures, teams]);
    
    // Trigger Confetti if champions exist and haven't shown yet
    useEffect(() => {
        if ((div1Champion || div2Champion) && !celebrationShown) {
            // Trigger confetti
            const duration = 2000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#FFD700', '#FFA500'] 
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#C0C0C0', '#FFFFFF']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
            setCelebrationShown(true);
        }
    }, [div1Champion, div2Champion, celebrationShown]);


    // Calculate MVPs for each Division
    const getMVP = (division: string) => {
        if (!players || !teams || !fixtures) return null;

        // 1. Identify team IDs in this division
        const divisionTeamIds = new Set(teams.filter(t => t.division === division).map(t => t.id));
        
        // 2. Tally MOTM awards
        const counts = new Map<number, number>();
        fixtures.forEach(f => {
            if (f.manOfTheMatchId) {
                // Verify player is currently in a team of this division
                const player = players.find(p => p.id === f.manOfTheMatchId);
                if (player && player.teamId && divisionTeamIds.has(player.teamId)) {
                    counts.set(player.id, (counts.get(player.id) || 0) + 1);
                }
            }
        });

        // 3. Find Max
        let maxId = 0;
        let maxCount = 0;
        counts.forEach((count, id) => {
            if (count > maxCount) {
                maxCount = count;
                maxId = id;
            }
        });

        if (maxCount === 0) return null;
        
        const bestPlayer = players.find(p => p.id === maxId);
        return bestPlayer ? { player: bestPlayer, count: maxCount } : null;
    };

    const div1MVP = useMemo(() => getMVP('Division 1'), [players, teams, fixtures]);
    const div2MVP = useMemo(() => getMVP('Division 2'), [players, teams, fixtures]);

    const showSeasonFinale = !!div1Champion || !!div2Champion;

    return (
        <div className="space-y-12">
            {!noticesLoading && activeNotice && <NoticeBanner notice={activeNotice} />}

            {/* CONDITIONAL HEADER: SEASON FINALE OR WELCOME BANNER */}
            {showSeasonFinale ? (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="text-center">
                         <h1 className="text-4xl md:text-5xl font-black text-white mb-2 uppercase tracking-tight">Season Finale</h1>
                         <p className="text-highlight font-bold text-lg uppercase tracking-widest">Champions & Award Winners</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                         {/* Division 1 Section */}
                         {div1Champion && (
                             <div className="space-y-6">
                                 <ChampionsCard 
                                     team={div1Champion.team}
                                     division={div1Champion.division}
                                     tournamentName={div1Champion.tournamentName}
                                     resultText={div1Champion.resultText}
                                     onClick={() => onSelectTournament(activeDiv1Tournament!)}
                                 />
                                 {div1MVP && (
                                     <MVPSpotlightCard 
                                        player={div1MVP.player} 
                                        team={teams?.find(t => t.id === div1MVP.player.teamId)}
                                        awardCount={div1MVP.count}
                                        division="Division 1"
                                        onClick={() => onNavigate('players')} 
                                    />
                                 )}
                             </div>
                         )}

                         {/* Division 2 Section */}
                         {div2Champion && (
                             <div className="space-y-6">
                                 <ChampionsCard 
                                     team={div2Champion.team}
                                     division={div2Champion.division}
                                     tournamentName={div2Champion.tournamentName}
                                     resultText={div2Champion.resultText}
                                     onClick={() => onSelectTournament(activeDiv2Tournament!)}
                                 />
                                  {div2MVP && (
                                     <MVPSpotlightCard 
                                        player={div2MVP.player} 
                                        team={teams?.find(t => t.id === div2MVP.player.teamId)}
                                        awardCount={div2MVP.count}
                                        division="Division 2"
                                        onClick={() => onNavigate('players')} 
                                    />
                                 )}
                             </div>
                         )}
                    </div>
                </div>
            ) : (
                <div className="text-center p-8 bg-secondary rounded-xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Welcome to DVOC Tanzania</h1>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-6">Your one-stop destination for all Tanzania Traditional Volleyball tournaments, fixtures, teams, and player stats.</p>
                        
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
            )}

            {!showSeasonFinale && (
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
            )}

             <div className="space-y-6">
                <h2 className="text-3xl font-bold text-center mb-6">League Standings</h2>
                {tournamentsLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Division 1 Table */}
                        <MiniStandingsTable 
                            title={activeDiv1Tournament ? activeDiv1Tournament.name : "Division 1"} 
                            standings={div1Standings}
                            onViewFull={() => activeDiv1Tournament && onSelectTournament(activeDiv1Tournament)}
                        />
                        
                        {/* Division 2 Table */}
                        <MiniStandingsTable 
                            title={activeDiv2Tournament ? activeDiv2Tournament.name : "Division 2"} 
                            standings={div2Standings}
                            onViewFull={() => activeDiv2Tournament && onSelectTournament(activeDiv2Tournament)}
                        />
                    </div>
                )}
            </div>

            {/* MVP Section - Only show if NOT in Season Finale mode (since they appear at top then) */}
            {!showSeasonFinale && (div1MVP || div2MVP) && (
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-center mb-6">Season Leaders</h2>
                    <div className="grid md:grid-cols-2 gap-8 justify-center">
                        {div1MVP && (
                            <div className="w-full max-w-sm mx-auto">
                                <MVPSpotlightCard 
                                    player={div1MVP.player} 
                                    team={teams?.find(t => t.id === div1MVP.player.teamId)}
                                    awardCount={div1MVP.count}
                                    division="Division 1"
                                    onClick={() => onNavigate('players')} 
                                />
                            </div>
                        )}
                        {div2MVP && (
                            <div className="w-full max-w-sm mx-auto">
                                <MVPSpotlightCard 
                                    player={div2MVP.player} 
                                    team={teams?.find(t => t.id === div2MVP.player.teamId)}
                                    awardCount={div2MVP.count}
                                    division="Division 2"
                                    onClick={() => onNavigate('players')} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {isScheduleModalOpen && <DailyScheduleModal onClose={() => setIsScheduleModalOpen(false)} />}
        </div>
    );
}
