
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import type { Fixture, Tournament, Team, TeamStanding, Player } from '../types';
import { ScoreSheetModal } from '../components/ScoreSheetModal';
import { KnockoutBracket } from '../components/KnockoutBracket';
import { ShareTeamCard } from '../components/ShareTeamCard';
import { ShareStandingsCard } from '../components/ShareStandingsCard';
import * as htmlToImage from 'html-to-image';

interface TournamentDetailViewProps {
  tournament: Tournament;
  onBack: () => void;
}

const TeamLogo: React.FC<{ logoUrl: string | null; alt: string; className?: string; }> = ({ logoUrl, alt, className = "w-10 h-10" }) => {
    if (logoUrl) {
        return <img src={logoUrl} alt={alt} className={`${className} rounded-full object-cover`} />;
    }
    return (
        <div className={`${className} rounded-full bg-accent flex items-center justify-center text-text-secondary`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" />
            </svg>
        </div>
    );
};

// Enhanced Modal Component for Team Details (Squad + Fixtures + Officiating)
const TournamentTeamDetailsModal: React.FC<{ tournament: Tournament; team: Team; onClose: () => void }> = ({ tournament, team, onClose }) => {
    const { getTournamentSquad, getFixturesByTournament, getTeamById, fixtures, tournaments } = useSports();
    const [activeTab, setActiveTab] = useState<'squad' | 'fixtures' | 'officiating'>('squad');
    const [isGenerating, setIsGenerating] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Force load tournament rosters if not present
    const roster = useMemo(() => getTournamentSquad(tournament.id, team.id), [getTournamentSquad, tournament.id, team.id]);

    // Filter and sort fixtures for this team in this tournament (Standard Fixtures Tab - Scoped to Tournament)
    const teamFixtures = useMemo(() => {
        const allFixtures = getFixturesByTournament(tournament.id);
        return allFixtures
            .filter(f => f.team1Id === team.id || f.team2Id === team.id)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }, [getFixturesByTournament, tournament.id, team.id]);

    // Filter upcoming fixtures for the share card (Future dates only)
    const upcomingFixtures = useMemo(() => {
        const now = new Date().toISOString();
        return teamFixtures.filter(f => f.dateTime > now);
    }, [teamFixtures]);

    // Filter fixtures where this team is the referee (Officiating Tab - GLOBAL SCOPE)
    // We look at ALL fixtures in the app to catch if they are officiating in other divisions/tournaments
    const officiatingFixtures = useMemo(() => {
        return (fixtures || [])
            .filter(f => f.referee === team.name)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }, [fixtures, team.name]);
    
    // Filter upcoming officiating for share card
    const upcomingOfficiating = useMemo(() => {
        const now = new Date().toISOString();
        return officiatingFixtures.filter(f => f.dateTime > now);
    }, [officiatingFixtures]);


    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        
        try {
            // Small delay to ensure any rendering is settled
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                quality: 0.95,
                pixelRatio: 2,
                backgroundColor: '#1a202c',
                skipFonts: true, // Use system fonts for speed/compatibility
                width: 540,
                // DYNAMIC HEIGHT FIX:
                // We use scrollHeight to capture the full length of the content if it exceeds 960px.
                height: Math.max(960, cardRef.current.scrollHeight) 
            });

            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `${team.shortName}-summary.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `${team.name} - Team Summary`,
                    text: `Check out the upcoming schedule for ${team.name}!`,
                });
            } else {
                const link = document.createElement('a');
                link.download = `${team.shortName}-summary.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Failed to generate team card', err);
            alert('Could not generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };


    const getResultBadge = (fixture: Fixture) => {
        if (fixture.status !== 'completed' || !fixture.score) return null;
        
        const isTeam1 = fixture.team1Id === team.id;
        const myScore = isTeam1 ? fixture.score.team1Score : fixture.score.team2Score;
        const oppScore = isTeam1 ? fixture.score.team2Score : fixture.score.team1Score;

        if (myScore > oppScore) return <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Win</span>;
        if (myScore < oppScore) return <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Loss</span>;
        return <span className="bg-gray-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Draw</span>;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
             <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-md transform transition-all max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="p-6 border-b border-accent flex justify-between items-center flex-shrink-0 bg-secondary rounded-t-xl">
                    <div>
                         <h3 className="text-xl font-bold text-white">{team.name}</h3>
                         <p className="text-sm text-highlight">{tournament.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleShare}
                            disabled={isGenerating}
                            className="bg-highlight hover:bg-teal-400 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                            title="Share Team Card"
                        >
                             {isGenerating ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                             )}
                        </button>
                        <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Hidden Share Card Render */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                    <ShareTeamCard 
                        ref={cardRef}
                        team={team}
                        tournament={tournament}
                        roster={roster}
                        upcomingFixtures={upcomingFixtures}
                        officiatingFixtures={upcomingOfficiating}
                        getTeam={getTeamById}
                    />
                </div>

                {/* Tabs */}
                <div className="flex border-b border-accent flex-shrink-0">
                    <button 
                        className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'squad' ? 'text-highlight border-highlight' : 'text-text-secondary border-transparent hover:text-white'}`}
                        onClick={() => setActiveTab('squad')}
                    >
                        Squad
                    </button>
                    <button 
                        className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'fixtures' ? 'text-highlight border-highlight' : 'text-text-secondary border-transparent hover:text-white'}`}
                        onClick={() => setActiveTab('fixtures')}
                    >
                        Fixtures
                    </button>
                    <button 
                        className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'officiating' ? 'text-highlight border-highlight' : 'text-text-secondary border-transparent hover:text-white'}`}
                        onClick={() => setActiveTab('officiating')}
                    >
                        Officiating
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-4 overflow-y-auto flex-grow">
                    {activeTab === 'squad' && (
                        <div className="space-y-2">
                            {roster.length > 0 ? (
                                roster.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-2 bg-primary rounded hover:bg-accent transition-colors">
                                         {p.photoUrl ? (
                                            <img src={p.photoUrl} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-text-secondary">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-white">{p.name}</p>
                                            <p className="text-xs text-text-secondary">{p.role}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-text-secondary">
                                    <p>No specific roster recorded for this tournament.</p>
                                    <p className="text-xs mt-2">The team likely used their standard club roster.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'fixtures' && (
                        <div className="space-y-3">
                            {teamFixtures.length > 0 ? (
                                teamFixtures.map(f => {
                                    const isTeam1 = f.team1Id === team.id;
                                    const opponentId = isTeam1 ? f.team2Id : f.team1Id;
                                    const opponent = getTeamById(opponentId);
                                    const dateObj = new Date(f.dateTime);
                                    
                                    return (
                                        <div key={f.id} className="bg-primary p-3 rounded flex items-center justify-between border border-transparent hover:border-accent transition-colors">
                                            <div className="flex flex-col gap-1 overflow-hidden">
                                                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wide flex items-center gap-1">
                                                    {f.stage ? f.stage.replace('-', ' ') : 'Group Stage'} 
                                                    <span className="w-1 h-1 rounded-full bg-text-secondary"></span>
                                                    {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-text-secondary text-xs font-medium">vs</span>
                                                    {opponent?.logoUrl && <img src={opponent.logoUrl} className="w-5 h-5 rounded-full object-cover" alt="" />}
                                                    <span className="font-semibold text-white text-sm truncate">{opponent?.name || 'Unknown Team'}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end pl-2">
                                                 {f.status === 'completed' && f.score ? (
                                                     <div className="flex flex-col items-end gap-1">
                                                         <div className="flex items-center gap-2">
                                                             {getResultBadge(f)}
                                                             <span className="text-white font-bold text-lg leading-none">
                                                                 {f.score.team1Score}-{f.score.team2Score}
                                                             </span>
                                                         </div>
                                                     </div>
                                                 ) : (
                                                     <div className="flex flex-col items-end">
                                                         <span className="text-highlight text-sm font-bold">
                                                             {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                                                         </span>
                                                         {f.status === 'live' && (
                                                            <span className="text-[10px] bg-red-500 text-white px-1 rounded animate-pulse font-bold">LIVE</span>
                                                         )}
                                                     </div>
                                                 )}
                                                 <span className="text-[10px] text-text-secondary mt-0.5 truncate max-w-[100px]">{f.ground}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-text-secondary">
                                    <p>No fixtures scheduled for this team in this tournament yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'officiating' && (
                        <div className="space-y-3">
                            {officiatingFixtures.length > 0 ? (
                                officiatingFixtures.map(f => {
                                    const team1 = getTeamById(f.team1Id);
                                    const team2 = getTeamById(f.team2Id);
                                    const dateObj = new Date(f.dateTime);
                                    // Identify the tournament for this fixture
                                    const fTournament = tournaments.find(t => t.id === f.tournamentId);
                                    
                                    return (
                                        <div key={f.id} className="bg-primary p-3 rounded border-l-2 border-highlight">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wide">
                                                    {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                                <span className="text-[10px] text-text-secondary">{f.ground}</span>
                                            </div>
                                            
                                            {/* Tournament Label Context */}
                                            <div className="mb-2">
                                                 <span className="text-[10px] bg-accent text-highlight px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                                    {fTournament ? fTournament.name : 'Unknown Tournament'}
                                                 </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {team1?.logoUrl ? <img src={team1.logoUrl} className="w-5 h-5 rounded-full object-cover" alt="" /> : <div className="w-5 h-5 rounded-full bg-accent"></div>}
                                                    <span className="font-semibold text-white text-sm">{team1?.name || 'TBD'}</span>
                                                </div>
                                                <span className="text-text-secondary text-xs mx-1">vs</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white text-sm">{team2?.name || 'TBD'}</span>
                                                    {team2?.logoUrl ? <img src={team2.logoUrl} className="w-5 h-5 rounded-full object-cover" alt="" /> : <div className="w-5 h-5 rounded-full bg-accent"></div>}
                                                </div>
                                            </div>
                                            {f.stage && <p className="text-center text-[10px] text-text-secondary mt-2 uppercase tracking-wider">{f.stage.replace('-', ' ')}</p>}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-text-secondary">
                                    <p>No officiating duties assigned to this team yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
}


const FixtureItem: React.FC<{ fixture: Fixture, onScorecardClick: (fixture: Fixture) => void, onTeamClick: (team: Team) => void }> = ({ fixture, onScorecardClick, onTeamClick }) => {
    const { getTeamById } = useSports();
    const team1 = getTeamById(fixture.team1Id);
    const team2 = getTeamById(fixture.team2Id);

    if (!team1 || !team2) return null;

    const renderStatusBadge = () => {
        switch (fixture.status) {
            case 'live':
                return <span className="absolute top-2 right-2 text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">LIVE</span>
            case 'completed':
                return <span className="absolute top-2 right-2 text-xs font-bold bg-gray-500 text-white px-2 py-1 rounded-full">COMPLETED</span>
            default:
                return null;
        }
    };
    
    const renderTeam = (team: Team) => (
        <div className="flex items-center space-x-3 flex-1 cursor-pointer group" onClick={() => onTeamClick(team)}>
            <TeamLogo logoUrl={team.logoUrl} alt={team.name} />
            <span className="font-semibold text-base sm:text-lg text-text-primary group-hover:text-highlight transition-colors">{team.name}</span>
        </div>
    );

    return (
        <div className="bg-secondary rounded-lg shadow-lg overflow-hidden relative">
            {renderStatusBadge()}
            <div className="p-4 flex items-center justify-between">
                {renderTeam(team1)}
                <div className="text-center px-2 sm:px-4">
                    {fixture.score ? (
                        <span className="text-xl sm:text-2xl font-bold text-white">{fixture.score.team1Score} - {fixture.score.team2Score}</span>
                    ) : (
                        <span className="text-xl sm:text-2xl font-bold text-text-secondary">VS</span>
                    )}
                </div>
                {renderTeam(team2)}
            </div>
            <div className="bg-accent px-4 py-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
                <div className="text-text-secondary">
                    <p>{new Date(fixture.dateTime).toLocaleString()}</p>
                    <p>{fixture.ground}</p>
                    {fixture.referee && (
                        <p className="flex items-center mt-1">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Referee: {fixture.referee}
                        </p>
                    )}
                </div>
                {fixture.status === 'completed' && (
                    <button onClick={() => onScorecardClick(fixture)} className="bg-highlight text-white px-3 py-1 rounded-md font-semibold hover:bg-teal-400 transition-colors w-full sm:w-auto">View Scorecard</button>
                )}
            </div>
        </div>
    );
};

const StandingsTable: React.FC<{ standings: TeamStanding[], onTeamClick: (teamId: number) => void }> = ({ standings, onTeamClick }) => {
    if (standings.length === 0) {
        return <p className="text-center text-text-secondary">No completed matches yet to generate standings.</p>;
    }

    const tableHeaderClasses = "px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider";
    const tableCellClasses = "px-4 py-4 whitespace-nowrap text-sm";

    return (
        <div className="bg-secondary rounded-lg shadow-lg overflow-hidden">
             {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-accent">
                    <thead className="bg-accent">
                        <tr>
                            <th scope="col" className={`${tableHeaderClasses} text-center`}>Pos</th>
                            <th scope="col" className={tableHeaderClasses}>Team</th>
                            <th scope="col" className={`${tableHeaderClasses} text-center`}>GP</th>
                            <th scope="col" className={`${tableHeaderClasses} text-center`}>W</th>
                            <th scope="col" className={`${tableHeaderClasses} text-center`}>D</th>
                            <th scope="col" className={`${tableHeaderClasses} text-center`}>L</th>
                            <th scope="col" className={`${tableHeaderClasses} text-center`}>GF</th>
                            <th scope="col" className={`${tableHeaderClasses} text-center`}>GA</th>
                            <th scope="col" className={`${tableHeaderClasses} text-center`}>GD</th>
                            <th scope="col" className={`${tableHeaderClasses} text-center font-extrabold`}>Pts</th>
                        </tr>
                    </thead>
                    <tbody className="bg-secondary divide-y divide-accent">
                        {standings.map((s, index) => (
                            <tr key={s.teamId} className="hover:bg-accent transition-colors">
                                <td className={`${tableCellClasses} text-text-secondary font-semibold text-center`}>{index + 1}</td>
                                <td className={`${tableCellClasses} text-text-primary font-medium`}>
                                    <div className="flex items-center cursor-pointer group" onClick={() => onTeamClick(s.teamId)}>
                                        <TeamLogo logoUrl={s.logoUrl} alt={s.teamName} className="h-8 w-8 mr-3"/>
                                        <span className="group-hover:text-highlight transition-colors">{s.teamName}</span>
                                    </div>
                                </td>
                                <td className={`${tableCellClasses} text-text-secondary text-center`}>{s.gamesPlayed}</td>
                                <td className={`${tableCellClasses} text-text-secondary text-center`}>{s.wins}</td>
                                <td className={`${tableCellClasses} text-text-secondary text-center`}>{s.draws}</td>
                                <td className={`${tableCellClasses} text-text-secondary text-center`}>{s.losses}</td>
                                <td className={`${tableCellClasses} text-text-secondary text-center`}>{s.goalsFor}</td>
                                <td className={`${tableCellClasses} text-text-secondary text-center`}>{s.goalsAgainst}</td>
                                <td className={`${tableCellClasses} text-text-secondary text-center`}>{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
                                <td className={`${tableCellClasses} text-white font-bold text-center`}>{s.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-3">
                {standings.map((s, index) => (
                    <div key={s.teamId} className="bg-accent p-4 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center cursor-pointer" onClick={() => onTeamClick(s.teamId)}>
                                <span className="text-text-secondary font-semibold mr-3">{index + 1}</span>
                                <TeamLogo logoUrl={s.logoUrl} alt={s.teamName} className="h-8 w-8 mr-3"/>
                                <span className="text-text-primary font-bold hover:text-highlight">{s.teamName}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-white font-bold text-xl">{s.points}</span>
                                <span className="text-text-secondary text-xs block">Pts</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-sm">
                            <div><span className="font-bold text-text-primary block">{s.gamesPlayed}</span><span className="text-text-secondary text-xs">GP</span></div>
                            <div><span className="font-bold text-text-primary block">{s.wins}</span><span className="text-text-secondary text-xs">W</span></div>
                            <div><span className="font-bold text-text-primary block">{s.draws}</span><span className="text-text-secondary text-xs">D</span></div>
                            <div><span className="font-bold text-text-primary block">{s.losses}</span><span className="text-text-secondary text-xs">L</span></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm mt-3 pt-3 border-t border-primary">
                             <div><span className="font-bold text-text-primary block">{s.goalsFor}</span><span className="text-text-secondary text-xs">GF</span></div>
                             <div><span className="font-bold text-text-primary block">{s.goalsAgainst}</span><span className="text-text-secondary text-xs">GA</span></div>
                             <div><span className="font-bold text-text-primary block">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</span><span className="text-text-secondary text-xs">GD</span></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-2 bg-accent text-xs text-text-secondary text-center border-t border-primary hidden md:block">
                <span className="font-bold">GP:</span> Games Played, <span className="font-bold">W:</span> Wins, <span className="font-bold">D:</span> Draws, <span className="font-bold">L:</span> Losses, <span className="font-bold">GF:</span> Goals For, <span className="font-bold">GA:</span> Goals Against, <span className="font-bold">GD:</span> Goal Difference, <span className="font-bold">Pts:</span> Points
            </div>
        </div>
    );
};

const RefereeFixtureCard: React.FC<{ fixture: Fixture }> = ({ fixture }) => {
    const { getTeamById, tournaments } = useSports();
    const team1 = getTeamById(fixture.team1Id);
    const team2 = getTeamById(fixture.team2Id);
    const dateObj = new Date(fixture.dateTime);
    const fixtureTournament = tournaments.find(t => t.id === fixture.tournamentId);

    return (
        <div className="bg-secondary p-4 rounded-lg shadow flex flex-col sm:flex-row items-center justify-between gap-4 border-l-4 border-highlight hover:bg-accent transition-colors">
            <div className="text-center sm:text-left w-full">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <div className="text-xs text-text-secondary font-bold uppercase tracking-wide">
                        {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <span className="text-[10px] bg-primary text-highlight px-2 py-1 rounded font-semibold uppercase tracking-wider self-center sm:self-auto">
                       {fixtureTournament ? fixtureTournament.name : 'Unknown Tournament'}
                    </span>
                 </div>
                 <div className="font-bold text-white text-lg">
                    {team1 ? team1.name : 'TBD'} <span className="text-text-secondary mx-1">vs</span> {team2 ? team2.name : 'TBD'}
                 </div>
                 <div className="text-xs text-text-secondary mt-1">{fixture.ground} {fixture.stage ? `• ${fixture.stage.replace('-', ' ')}` : ''}</div>
            </div>
            <div className="flex flex-col items-center sm:items-end bg-primary/50 p-2 rounded min-w-[150px] flex-shrink-0">
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Officiating</span>
                <span className="font-bold text-highlight text-center truncate max-w-[180px]">{fixture.referee}</span>
            </div>
        </div>
    )
};


export const TournamentDetailView: React.FC<TournamentDetailViewProps> = ({ tournament: initialTournament, onBack }) => {
  const { getFixturesByTournament, getTeamById, getStandingsForTournament, getSponsorsForTournament, tournaments, fixtures: globalFixtures, teams } = useSports();
  
  // FIX: Get the absolute latest version of the tournament from context.
  const tournament = useMemo(() => tournaments.find(t => t.id === initialTournament.id) || initialTournament, [tournaments, initialTournament]);

  // Ensure dependencies for this view are loaded
  const { loading: fixturesLoading } = useEntityData('fixtures');
  const { loading: teamsLoading } = useEntityData('teams');
  const { loading: sponsorsLoading } = useEntityData('sponsors');
  const { loading: tsLoading } = useEntityData('tournamentSponsors');
  const { loading: trLoading } = useEntityData('tournamentRosters');
  // Ensure tournament teams are loaded so standings/teams list is complete
  useEntityData('tournamentTeams');
  
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [selectedTeamForDetails, setSelectedTeamForDetails] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings' | 'knockout' | 'teams' | 'referees'>('fixtures');
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [refereeFilter, setRefereeFilter] = useState('');
  const [isGeneratingStandings, setIsGeneratingStandings] = useState(false);
  const standingsCardRef = useRef<HTMLDivElement>(null);

  // Round Robin Fixtures
  const fixtures = useMemo(() => getFixturesByTournament(tournament.id).filter(f => !f.stage), [getFixturesByTournament, tournament.id]);
  
  // Teams participating in this tournament's division (by name, for filtering referee duties)
  const divisionTeamNames = useMemo(() => {
      return new Set(teams.filter(t => t.division === tournament.division).map(t => t.name));
  }, [teams, tournament.division]);

  // Duty Roster Logic:
  // 1. Matches in this tournament (whether assigned to a ref from this div or not)
  // 2. Matches ANYWHERE else officiated by teams from this tournament division
  const dutyRosterFixtures = useMemo(() => {
      return (globalFixtures || [])
        .filter(f => {
            // Condition 1: Game belongs to this tournament
            if (f.tournamentId === tournament.id) return true;
            
            // Condition 2: Referee is a team from this tournament's division (officiating elsewhere)
            if (f.referee && divisionTeamNames.has(f.referee)) return true;
            
            return false;
        })
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [globalFixtures, tournament.id, divisionTeamNames]);

  // Unique Referees list (for filter dropdown) derived from the duty roster
  const uniqueReferees = useMemo(() => {
      const refs = new Set<string>();
      dutyRosterFixtures.forEach(f => {
          if (f.referee) refs.add(f.referee);
      });
      return Array.from(refs).sort();
  }, [dutyRosterFixtures]);

  // Filtered Referee Fixtures
  const refereeFixtures = useMemo(() => {
      let list = dutyRosterFixtures.filter(f => f.referee); 
      if (refereeFilter) {
          list = list.filter(f => f.referee === refereeFilter);
      }
      return list;
  }, [dutyRosterFixtures, refereeFilter]);

  const standings = useMemo(() => getStandingsForTournament(tournament.id), [getStandingsForTournament, tournament.id]);
  const sponsors = useMemo(() => getSponsorsForTournament(tournament.id), [getSponsorsForTournament, tournament.id]);

  useEffect(() => {
    if (sponsors.length > 1) {
      const timer = setTimeout(() => {
        setCurrentSponsorIndex((prevIndex) => (prevIndex + 1) % sponsors.length);
      }, 5000); // Change banner every 5 seconds
      return () => clearTimeout(timer);
    }
  }, [currentSponsorIndex, sponsors.length]);
  
  useEffect(() => {
      if (tournament.phase === 'knockout' || tournament.phase === 'completed') {
          // If opening directly into knockout phase, prefer knockout tab unless coming back
          // Keeping logic simple: default to fixtures if phase matches
          if (activeTab === 'fixtures') {
              setActiveTab('knockout');
          }
      }
  }, [tournament.phase]);

  const handlePrevSponsor = () => {
    setCurrentSponsorIndex((prevIndex) => (prevIndex - 1 + sponsors.length) % sponsors.length);
  };

  const handleNextSponsor = () => {
    setCurrentSponsorIndex((prevIndex) => (prevIndex + 1) % sponsors.length);
  };
  
  const handleTeamClick = (team: Team | number) => {
      const t = typeof team === 'number' ? getTeamById(team) : team;
      if (t) setSelectedTeamForDetails(t);
  }

  const handleShareStandings = async () => {
        if (!standingsCardRef.current) return;
        setIsGeneratingStandings(true);
        
        try {
            // Small delay to ensure any rendering is settled
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const dataUrl = await htmlToImage.toPng(standingsCardRef.current, {
                quality: 0.95,
                pixelRatio: 2,
                backgroundColor: '#1a202c',
                skipFonts: true, // Use system fonts for speed/compatibility
                width: 540,
                // DYNAMIC HEIGHT FIX:
                // We use scrollHeight to capture the full length of the content if it exceeds 960px.
                height: Math.max(960, standingsCardRef.current.scrollHeight) 
            });

            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `${tournament.name}-standings.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `${tournament.name} Standings`,
                    text: `Current standings for ${tournament.name}`,
                });
            } else {
                const link = document.createElement('a');
                link.download = `${tournament.name}-standings.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Failed to generate standings card', err);
            alert('Could not generate image. Please try again.');
        } finally {
            setIsGeneratingStandings(false);
        }
    };

  const team1 = selectedFixture ? getTeamById(selectedFixture.team1Id) : null;
  const team2 = selectedFixture ? getTeamById(selectedFixture.team2Id) : null;
  
  const isDataLoading = fixturesLoading || teamsLoading || sponsorsLoading || tsLoading;

  const TabButton: React.FC<{ tab: 'fixtures' | 'standings' | 'knockout' | 'teams' | 'referees'; children: React.ReactNode }> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 sm:px-6 py-3 text-sm sm:text-lg font-semibold transition-colors duration-300 focus:outline-none whitespace-nowrap ${activeTab === tab ? 'text-highlight border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
    >
      {children}
    </button>
  );

  if (isDataLoading) {
      return (
          <div className="flex justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight"></div>
          </div>
      );
  }

  return (
    <div>
        {/* Hidden Share Card Render */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
            <ShareStandingsCard 
                ref={standingsCardRef}
                tournamentName={tournament.name}
                division={tournament.division}
                standings={standings}
            />
        </div>

        <button onClick={onBack} className="flex items-center space-x-2 text-text-secondary hover:text-highlight mb-6 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Tournaments</span>
        </button>
      <h1 className="text-4xl font-extrabold text-center mb-2">{tournament.name}</h1>
      <p className="text-center text-highlight font-semibold mb-8">{tournament.division}</p>

      {sponsors.length > 0 && (
          <div className="mb-8">
              <h3 className="text-center text-md font-semibold text-text-secondary mb-4">Sponsored By</h3>
              <div className="bg-secondary p-1 sm:p-2 rounded-lg shadow-lg relative aspect-[21/9] max-w-4xl mx-auto overflow-hidden">
                {sponsors.map((sponsor, index) => (
                    <a 
                        key={sponsor.id} 
                        href={sponsor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center justify-center p-4 ${index === currentSponsorIndex ? 'opacity-100' : 'opacity-0'}`}
                        aria-hidden={index !== currentSponsorIndex}
                    >
                        {sponsor.logoUrl ? (
                            <img 
                                src={sponsor.logoUrl} 
                                alt={`${sponsor.name} banner`} 
                                className="max-w-full max-h-full object-contain" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-text-primary">{sponsor.name}</span>
                            </div>
                        )}
                    </a>
                ))}
                
                {sponsors.length > 1 && (
                  <>
                    <button onClick={handlePrevSponsor} className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors z-10" aria-label="Previous sponsor">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={handleNextSponsor} className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors z-10" aria-label="Next sponsor">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                        {sponsors.map((_, index) => (
                            <button 
                                key={index} 
                                onClick={() => setCurrentSponsorIndex(index)}
                                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${index === currentSponsorIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                                aria-label={`Go to sponsor ${index + 1}`}
                            />
                        ))}
                    </div>
                  </>
                )}
              </div>
          </div>
      )}
      
      <div className="flex flex-wrap border-b border-accent mb-6 justify-center overflow-x-auto">
            <TabButton tab="fixtures">Fixtures</TabButton>
            <TabButton tab="referees">Referees</TabButton>
            <TabButton tab="teams">Teams</TabButton>
            <TabButton tab="standings">Standings</TabButton>
            {(tournament.phase === 'knockout' || tournament.phase === 'completed') && (
                <TabButton tab="knockout">Knockout</TabButton>
            )}
      </div>

      <div className="space-y-6">
            {activeTab === 'fixtures' && (
                fixtures.length > 0 ? (
                fixtures.map(f => <FixtureItem key={f.id} fixture={f} onScorecardClick={setSelectedFixture} onTeamClick={handleTeamClick} />)
                ) : (
                <p className="text-center text-text-secondary">No round-robin fixtures scheduled for this tournament yet.</p>
                )
            )}

            {activeTab === 'referees' && (
                <div className="space-y-4">
                    <div className="bg-secondary p-4 rounded-lg shadow-lg mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Officiating Schedule</h3>
                                <p className="text-sm text-text-secondary">View fixture assignments for referees and officiating teams.</p>
                            </div>
                            <select 
                                className="bg-primary text-white p-2 rounded border border-accent focus:border-highlight focus:outline-none w-full sm:w-auto"
                                value={refereeFilter}
                                onChange={(e) => setRefereeFilter(e.target.value)}
                            >
                                <option value="">All Officials</option>
                                {uniqueReferees.map(ref => (
                                    <option key={ref} value={ref}>{ref}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {refereeFixtures.length > 0 ? (
                        refereeFixtures.map(f => <RefereeFixtureCard key={f.id} fixture={f} />)
                    ) : (
                        <div className="text-center py-12 bg-secondary rounded-lg">
                            <div className="flex justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-text-secondary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <p className="text-text-secondary font-medium">No officiating assignments found.</p>
                            {refereeFilter && <p className="text-sm text-text-secondary mt-2">Try clearing the filter to see all fixtures.</p>}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'teams' && (
                standings.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {standings.map(s => (
                            <div 
                                key={s.teamId} 
                                onClick={() => handleTeamClick(s.teamId)}
                                className="bg-secondary p-4 rounded-lg shadow-md hover:bg-accent hover:scale-105 transition-all duration-300 cursor-pointer flex flex-col items-center text-center group"
                            >
                                <TeamLogo logoUrl={s.logoUrl} alt={s.teamName} className="w-20 h-20 mb-3 shadow-lg" />
                                <h3 className="font-bold text-white group-hover:text-highlight transition-colors">{s.teamName}</h3>
                                <span className="text-xs text-text-secondary mt-1 bg-primary px-2 py-1 rounded-full">More Details</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-text-secondary">Participating teams will appear here once fixtures are generated or teams are selected by admin.</p>
                )
            )}

            {activeTab === 'standings' && (
                <>
                    <div className="flex justify-end mb-4">
                        <button 
                            onClick={handleShareStandings}
                            disabled={isGeneratingStandings}
                            className="bg-highlight hover:bg-teal-400 text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg"
                        >
                            {isGeneratingStandings ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            )}
                            Share Table
                        </button>
                    </div>
                    <StandingsTable standings={standings} onTeamClick={handleTeamClick} />
                        {(tournament.phase === 'knockout' || tournament.phase === 'completed') && (
                        <p className="text-center text-yellow-400 p-4 bg-secondary rounded-lg mt-4">The league phase is complete. The top teams have advanced to the knockout stage.</p>
                    )}
                </>
            )}
            
            {activeTab === 'knockout' && (
                <KnockoutBracket tournament={tournament} />
            )}
      </div>

      {selectedFixture && team1 && team2 && (
          <ScoreSheetModal fixture={selectedFixture} team1={team1} team2={team2} onClose={() => setSelectedFixture(null)} />
      )}

      {selectedTeamForDetails && (
          <TournamentTeamDetailsModal 
            tournament={tournament} 
            team={selectedTeamForDetails} 
            onClose={() => setSelectedTeamForDetails(null)} 
          />
      )}
    </div>
  );
};
