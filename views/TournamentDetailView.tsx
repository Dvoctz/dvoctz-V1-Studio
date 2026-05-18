
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import type { Fixture, Tournament, Team, TeamStanding, Player, TournamentAward } from '../types';
import { ScoreSheetModal } from '../components/ScoreSheetModal';
import { KnockoutBracket } from '../components/KnockoutBracket';
import { ShareTeamCard } from '../components/ShareTeamCard';
import { ShareStandingsCard } from '../components/ShareStandingsCard';
import { ShareBracketCard } from '../components/ShareBracketCard';
import * as htmlToImage from 'html-to-image';

interface TournamentDetailViewProps {
  tournament: Tournament;
  onBack: () => void;
}

const TeamLogo: React.FC<{ logoUrl: string | null; alt: string; className?: string; }> = ({ logoUrl, alt, className = "w-10 h-10" }) => {
    if (logoUrl) {
        return <img src={logoUrl} alt={alt} className={`${className} rounded-full object-cover border-2 border-white/10`} />;
    }
    return (
        <div className={`${className} rounded-full bg-secondary border border-white/10 flex items-center justify-center text-slate-500`}>
            <span className="text-[10px] font-bold uppercase">{alt.charAt(0)}</span>
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
        setIsGenerating(true);
        
        try {
            // Delay to ensure render is complete and ref is populated
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (!cardRef.current) {
                console.error("Card ref not found");
                return;
            }

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

                {/* Conditional Share Card Render - Only when needed */}
                {isGenerating && (
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
                )}

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
                return <span className="absolute top-0 right-0 m-4 text-[9px] font-black uppercase tracking-[0.2em] bg-red-600 shadow-glow shadow-red-600/30 text-white px-3 py-1 rounded-full animate-pulse border border-red-500/50">Live</span>
            case 'completed':
                return <span className="absolute top-0 right-0 m-4 text-[9px] font-black uppercase tracking-[0.2em] bg-white/10 text-white px-3 py-1 rounded-full border border-white/20">Final</span>
            default:
                return <span className="absolute top-0 right-0 m-4 text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 text-slate-400 px-3 py-1 rounded-full border border-white/10">Upcoming</span>;
        }
    };
    
    const renderTeam = (team: Team, isLeft: boolean) => (
        <div className={`flex items-center gap-3 flex-1 cursor-pointer group ${isLeft ? 'justify-end md:justify-end flex-row-reverse md:flex-row-reverse' : 'justify-start md:justify-start'}`} onClick={() => onTeamClick(team)}>
            <TeamLogo logoUrl={team.logoUrl} alt={team.name} className="w-10 h-10 md:w-14 md:h-14 grayscale-[20%] group-hover:grayscale-0 transition-all"/>
            <span className={`font-black text-sm md:text-xl text-white group-hover:text-[#D4AF37] transition-colors uppercase tracking-wider ${isLeft ? 'text-right' : 'text-left'}`}>{team.name}</span>
        </div>
    );

    return (
        <div className="bg-secondary/40 backdrop-blur-md rounded-3xl shadow-lg border border-white/5 overflow-hidden relative group hover:border-[#D4AF37]/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>
            {renderStatusBadge()}
            
            <div className="p-6 md:p-8 flex items-center justify-between relative z-10">
                {renderTeam(team1, true)}
                <div className="text-center px-4 md:px-8 flex-shrink-0 min-w-[100px] md:min-w-[140px]">
                    {fixture.score ? (
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl md:text-5xl font-black text-white leading-none drop-shadow-md">{fixture.score.team1Score}</span>
                            <span className="text-xl text-slate-600 font-bold">-</span>
                            <span className="text-3xl md:text-5xl font-black text-white leading-none drop-shadow-md">{fixture.score.team2Score}</span>
                        </div>
                    ) : (
                        <span className="text-xs uppercase font-black tracking-[0.3em] text-slate-500">VS</span>
                    )}
                </div>
                {renderTeam(team2, false)}
            </div>
            
            <div className="bg-primary/50 border-t border-white/5 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm relative z-10 transition-colors group-hover:bg-primary/70">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(fixture.dateTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{fixture.ground}</span>
                    </div>
                    {fixture.referee && (
                        <div className="flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Ref: <span className="text-slate-300">{fixture.referee}</span></span>
                        </div>
                    )}
                </div>
                {fixture.status === 'completed' && (
                    <button onClick={() => onScorecardClick(fixture)} className="bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/50 text-white hover:text-[#D4AF37] px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-black transition-all w-full md:w-auto">View Scorecard</button>
                )}
            </div>
        </div>
    );
};

const StandingsTable: React.FC<{ standings: TeamStanding[], onTeamClick: (teamId: number) => void }> = ({ standings, onTeamClick }) => {
    if (standings.length === 0) {
        return <p className="text-center text-text-secondary">No completed matches yet to generate standings.</p>;
    }

    const tableHeaderClasses = "px-4 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest";
    const tableCellClasses = "px-4 py-4 whitespace-nowrap text-sm font-bold text-slate-300";

    return (
        <div className="bg-secondary/40 backdrop-blur-md rounded-3xl shadow-lg border border-white/5 overflow-hidden">
             {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-white/5 border-b border-white/10">
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
                            <th scope="col" className={`${tableHeaderClasses} text-center text-[#D4AF37]`}>Pts</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {standings.map((s, index) => (
                            <tr key={s.teamId} className="hover:bg-white/5 transition-colors group">
                                <td className={`${tableCellClasses} text-center ${index < 4 ? 'text-[#D4AF37]' : ''}`}>{index + 1}</td>
                                <td className={`${tableCellClasses} text-white`}>
                                    <div className="flex items-center cursor-pointer" onClick={() => onTeamClick(s.teamId)}>
                                        <div className="relative mr-4 shadow-sm rounded-full overflow-hidden">
                                            <TeamLogo logoUrl={s.logoUrl} alt={s.teamName} className="h-8 w-8 object-cover grayscale-[30%] group-hover:grayscale-0 transition-all"/>
                                        </div>
                                        <span className="group-hover:text-[#D4AF37] transition-colors uppercase tracking-wider">{s.teamName}</span>
                                    </div>
                                </td>
                                <td className={`${tableCellClasses} text-center opacity-80`}>{s.gamesPlayed}</td>
                                <td className={`${tableCellClasses} text-center opacity-80`}>{s.wins}</td>
                                <td className={`${tableCellClasses} text-center opacity-80`}>{s.draws}</td>
                                <td className={`${tableCellClasses} text-center opacity-80`}>{s.losses}</td>
                                <td className={`${tableCellClasses} text-center opacity-80`}>{s.goalsFor}</td>
                                <td className={`${tableCellClasses} text-center opacity-80`}>{s.goalsAgainst}</td>
                                <td className={`${tableCellClasses} text-center font-black ${s.goalDifference > 0 ? 'text-green-400' : s.goalDifference < 0 ? 'text-red-400' : ''}`}>{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
                                <td className={`${tableCellClasses} text-center text-[#D4AF37] font-black text-lg`}>{s.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4 text-xs">
                {standings.map((s, index) => (
                    <div key={s.teamId} className="bg-primary/50 border border-white/5 p-5 rounded-2xl shadow-md">
                        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                            <div className="flex items-center cursor-pointer group" onClick={() => onTeamClick(s.teamId)}>
                                <span className={`font-black text-lg mr-4 ${index < 4 ? 'text-[#D4AF37]' : 'text-slate-500'}`}>{index + 1}</span>
                                <TeamLogo logoUrl={s.logoUrl} alt={s.teamName} className="h-10 w-10 mr-3 grayscale-[30%] group-hover:grayscale-0 transition-all"/>
                                <span className="text-white font-black uppercase tracking-wider group-hover:text-[#D4AF37] transition-colors text-sm">{s.teamName}</span>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-[#D4AF37] font-black text-2xl leading-none">{s.points}</span>
                                <span className="text-[9px] uppercase tracking-widest text-[#D4AF37]/50 mt-1 font-bold">Pts</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-white/5 rounded-lg py-2"><span className="font-black text-white block">{s.gamesPlayed}</span><span className="text-slate-500 text-[9px] tracking-widest uppercase font-bold">GP</span></div>
                            <div className="bg-white/5 rounded-lg py-2"><span className="font-black text-white block">{s.wins}</span><span className="text-slate-500 text-[9px] tracking-widest uppercase font-bold">W</span></div>
                            <div className="bg-white/5 rounded-lg py-2"><span className="font-black text-white block">{s.draws}</span><span className="text-slate-500 text-[9px] tracking-widest uppercase font-bold">D</span></div>
                            <div className="bg-white/5 rounded-lg py-2"><span className="font-black text-white block">{s.losses}</span><span className="text-slate-500 text-[9px] tracking-widest uppercase font-bold">L</span></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center mt-2">
                             <div className="bg-white/5 rounded-lg py-2"><span className="font-black text-white block">{s.goalsFor}</span><span className="text-slate-500 text-[9px] tracking-widest uppercase font-bold">GF</span></div>
                             <div className="bg-white/5 rounded-lg py-2"><span className="font-black text-white block">{s.goalsAgainst}</span><span className="text-slate-500 text-[9px] tracking-widest uppercase font-bold">GA</span></div>
                             <div className="bg-white/5 rounded-lg py-2"><span className={`font-black uppercase block ${s.goalDifference > 0 ? 'text-green-400' : s.goalDifference < 0 ? 'text-red-400' : 'text-white'}`}>{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</span><span className="text-slate-500 text-[9px] tracking-widest uppercase font-bold">GD</span></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 bg-white/5 text-[9px] uppercase tracking-widest text-slate-500 font-bold text-center border-t border-white/5 hidden md:block">
                <span>GP:</span> Games Played &nbsp;&bull;&nbsp; <span>W:</span> Wins &nbsp;&bull;&nbsp; <span>D:</span> Draws &nbsp;&bull;&nbsp; <span>L:</span> Losses &nbsp;&bull;&nbsp; <span>GF:</span> Goals For &nbsp;&bull;&nbsp; <span>GA:</span> Goals Against &nbsp;&bull;&nbsp; <span>GD:</span> Goal Difference &nbsp;&bull;&nbsp; <span>Pts:</span> Points
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
        <div className="bg-secondary/40 backdrop-blur-md p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="text-center sm:text-left w-full z-10">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 border-b border-white/10 pb-4">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} &bull; {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <span className="text-[9px] bg-primary/80 border border-white/10 text-slate-300 px-3 py-1.5 rounded-full font-black uppercase tracking-widest self-center sm:self-auto shadow-inner">
                       {fixtureTournament ? fixtureTournament.name : 'Unknown Tournament'}
                    </span>
                 </div>
                 <div className="font-black text-white text-xl uppercase tracking-wider flex items-center justify-center sm:justify-start flex-wrap gap-2">
                    <span>{team1 ? team1.name : 'TBD'}</span>
                    <span className="text-slate-600 text-sm">vs</span>
                    <span>{team2 ? team2.name : 'TBD'}</span>
                 </div>
                 <div className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] mt-3 flex items-center justify-center sm:justify-start gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {fixture.ground} {fixture.stage ? `• ${fixture.stage.replace('-', ' ')}` : ''}
                </div>
            </div>
            <div className="flex flex-col items-center sm:items-end bg-primary/60 border border-white/10 p-4 rounded-2xl min-w-[180px] flex-shrink-0 z-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-[#D4AF37]/20 blur-xl rounded-full"></div>
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Officiating Duty</span>
                <span className="font-black text-[#D4AF37] text-lg text-center truncate max-w-[200px] uppercase tracking-wider">{fixture.referee}</span>
            </div>
        </div>
    )
};

const AwardCard: React.FC<{ award: TournamentAward, onPlayerClick: (id: number) => void }> = ({ award, onPlayerClick }) => (
    <div className="bg-gradient-to-b from-secondary/80 to-secondary/40 backdrop-blur-md p-6 rounded-3xl shadow-xl flex flex-col items-center text-center hover:scale-[1.02] transition-all duration-500 border border-white/5 hover:border-[#D4AF37]/50 group relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#D4AF37]/20 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

        <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#D4AF37] blur-md opacity-20 rounded-full animate-pulse-slow"></div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F9F295] via-[#E0AA3E] to-[#B8860B] p-1.5 shadow-xl flex items-center justify-center relative z-10 transform group-hover:rotate-[5deg] transition-transform duration-500">
                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-secondary overflow-hidden">
                    {award.imageUrl ? (
                        <img src={award.imageUrl} alt={award.awardName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <span className="text-4xl drop-shadow-md">🏆</span>
                    )}
                </div>
            </div>
            {/* Sparkles */}
            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">✨</div>
            <div className="absolute -bottom-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 text-sm">✨</div>
        </div>
        <h4 className="font-black text-[#D4AF37] uppercase tracking-[0.3em] text-[10px] mb-2 z-10">{award.awardName}</h4>
        {award.playerId ? (
            <button 
                onClick={() => onPlayerClick(award.playerId!)} 
                className="text-lg font-black text-white hover:text-[#D4AF37] transition-colors relative z-10 uppercase tracking-widest"
            >
                {award.recipientName}
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-center mt-1"></div>
            </button>
        ) : (
            <span className="text-lg font-black text-white uppercase tracking-widest relative z-10">{award.recipientName}</span>
        )}
    </div>
);


export const TournamentDetailView: React.FC<TournamentDetailViewProps> = ({ tournament: initialTournament, onBack }) => {
  const { getFixturesByTournament, getTeamById, getStandingsForTournament, getSponsorsForTournament, getAwardsByTournament, tournaments, fixtures: globalFixtures, teams, getPlayerById } = useSports();
  // We need players loaded to link awards
  useEntityData('players');
  const { loading: awardsLoading } = useEntityData('tournamentAwards');
  
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
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings' | 'knockout' | 'teams' | 'referees' | 'awards'>('fixtures');
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [refereeFilter, setRefereeFilter] = useState('');
  const [isGeneratingStandings, setIsGeneratingStandings] = useState(false);
  const [isGeneratingBracket, setIsGeneratingBracket] = useState(false);
  
  const standingsCardRef = useRef<HTMLDivElement>(null);
  const bracketCardRef = useRef<HTMLDivElement>(null);

  // Round Robin Fixtures
  const fixtures = useMemo(() => getFixturesByTournament(tournament.id).filter(f => !f.stage), [getFixturesByTournament, tournament.id]);
  const knockoutFixtures = useMemo(() => getFixturesByTournament(tournament.id).filter(f => f.stage), [getFixturesByTournament, tournament.id]);
  
  // Awards
  const awards = useMemo(() => getAwardsByTournament(tournament.id), [getAwardsByTournament, tournament.id]);
  
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
  
  const handlePlayerClick = (playerId: number) => {
      // In a real implementation this would navigate to PlayerDetailView
      // Since we don't have direct navigation prop here, we'll just log or alert for now
      // ideally `onNavigate` would be passed down to handle this.
      console.log('Navigate to player:', playerId);
  };

  const handleShareStandings = async () => {
        setIsGeneratingStandings(true);
        
        try {
            // Small delay to ensure any rendering is settled
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (!standingsCardRef.current) {
                console.error("Standings card ref not found");
                return;
            }

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
    
    const handleShareBracket = async () => {
        setIsGeneratingBracket(true);
        
        try {
            // Small delay to ensure any rendering is settled
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (!bracketCardRef.current) {
                console.error("Bracket card ref not found");
                return;
            }

            const dataUrl = await htmlToImage.toPng(bracketCardRef.current, {
                quality: 0.95,
                pixelRatio: 1, // 1080px is large enough
                backgroundColor: '#1a202c',
                skipFonts: true, 
                width: 1080,
                height: 1080
            });

            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `${tournament.name}-bracket.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `${tournament.name} Knockout Bracket`,
                    text: `Check out the bracket for ${tournament.name}`,
                });
            } else {
                const link = document.createElement('a');
                link.download = `${tournament.name}-bracket.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Failed to generate bracket card', err);
            alert('Could not generate image. Please try again.');
        } finally {
            setIsGeneratingBracket(false);
        }
    };

  const team1 = selectedFixture ? getTeamById(selectedFixture.team1Id) : null;
  const team2 = selectedFixture ? getTeamById(selectedFixture.team2Id) : null;
  
  const isDataLoading = fixturesLoading || teamsLoading || sponsorsLoading || tsLoading;

  const TabButton: React.FC<{ tab: 'fixtures' | 'standings' | 'knockout' | 'teams' | 'referees' | 'awards'; children: React.ReactNode }> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 sm:px-6 py-4 text-sm uppercase tracking-widest font-black transition-all duration-300 focus:outline-none whitespace-nowrap ${activeTab === tab ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-highlight/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
    >
      {children}
    </button>
  );

  if (isDataLoading) {
      return (
          <div className="flex justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
          </div>
      );
  }

  return (
    <div className="animate-fade-in-up">
        {/* Conditional Share Card Render - Standings */}
        {isGeneratingStandings && (
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <ShareStandingsCard 
                    ref={standingsCardRef}
                    tournamentName={tournament.name}
                    division={tournament.division}
                    standings={standings}
                />
            </div>
        )}

        {/* Conditional Share Card Render - Bracket */}
        {isGeneratingBracket && (
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <ShareBracketCard 
                    ref={bracketCardRef}
                    tournament={tournament}
                    fixtures={knockoutFixtures}
                    getTeam={getTeamById}
                />
            </div>
        )}

        <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-[#D4AF37] mb-8 transition-colors text-sm font-bold uppercase tracking-wider group">
             <div className="w-8 h-8 rounded-full bg-secondary border border-white/10 flex items-center justify-center group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/30 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
             </div>
            <span>Tournaments</span>
        </button>
      <h1 className="text-4xl md:text-6xl font-black text-center mb-2 tracking-tight drop-shadow-md uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary">{tournament.name}</h1>
      <p className="text-center text-[#D4AF37] text-sm uppercase tracking-[0.3em] font-black mb-12 flex items-center justify-center gap-3">
          <span className="w-8 h-px bg-[#D4AF37]/40"></span>
          {tournament.division}
          <span className="w-8 h-px bg-[#D4AF37]/40"></span>
      </p>

      {sponsors.length > 0 && (
          <div className="mb-12">
              <h3 className="text-center text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Official Sponsors</h3>
              <div className="bg-secondary/40 backdrop-blur-md p-1 sm:p-2 rounded-3xl shadow-lg relative aspect-[21/9] max-w-4xl mx-auto overflow-hidden border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-10"></div>
                {sponsors.map((sponsor, index) => (
                    <a 
                        key={sponsor.id} 
                        href={sponsor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center justify-center p-4 sm:p-8 ${index === currentSponsorIndex ? 'opacity-100 relative z-20' : 'opacity-0 pointer-events-none'}`}
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
            <TabButton tab="awards">Awards</TabButton>
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
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-secondary/40 backdrop-blur-md p-6 rounded-3xl shadow-lg mb-8 border border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-1">Officiating Schedule</h3>
                                <p className="text-xs text-[#D4AF37] uppercase tracking-[0.2em] font-bold">Assignments & Duties</p>
                            </div>
                            <div className="relative group min-w-[200px]">
                                <select 
                                    className="appearance-none bg-primary/80 border border-white/10 text-white p-4 pl-6 pr-12 rounded-full focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none w-full sm:w-auto font-bold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-inner z-10 relative"
                                    value={refereeFilter}
                                    onChange={(e) => setRefereeFilter(e.target.value)}
                                >
                                    <option value="">All Officials</option>
                                    {uniqueReferees.map(ref => (
                                        <option key={ref} value={ref}>{ref}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-[#D4AF37] z-20">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {refereeFixtures.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {refereeFixtures.map(f => <RefereeFixtureCard key={f.id} fixture={f} />)}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-primary/40 rounded-3xl border border-dashed border-white/10 max-w-2xl mx-auto">
                            <div className="flex justify-center mb-6">
                                <span className="text-5xl opacity-40 grayscale blur-[1px]">📋</span>
                            </div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No officiating assignments found.</p>
                            {refereeFilter && <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">Try clearing the filter to see all.</p>}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'teams' && (
                standings.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {standings.map(s => (
                            <div 
                                key={s.teamId} 
                                onClick={() => handleTeamClick(s.teamId)}
                                className="bg-secondary/40 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-2xl hover:bg-white/5 hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col items-center text-center group border border-white/5 hover:border-[#D4AF37]/30 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <TeamLogo logoUrl={s.logoUrl} alt={s.teamName} className="w-24 h-24 mb-4 shadow-xl z-10 grayscale-[20%] group-hover:grayscale-0 transition-all border-2 border-white/10 group-hover:border-[#D4AF37]/50" />
                                <h3 className="font-black text-white group-hover:text-[#D4AF37] transition-colors uppercase tracking-wider text-sm z-10">{s.teamName}</h3>
                                <span className="text-[10px] text-slate-400 mt-4 bg-primary/50 border border-white/10 px-3 py-1.5 rounded-full uppercase tracking-widest font-bold group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 transition-all z-10">More Details</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-primary/40 rounded-3xl border border-dashed border-white/10 max-w-2xl mx-auto">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Participating teams will appear here.</p>
                    </div>
                )
            )}

            {activeTab === 'standings' && (
                <div className="animate-fade-in-up">
                    <div className="flex justify-end mb-6">
                        <button 
                            onClick={handleShareStandings}
                            disabled={isGeneratingStandings}
                            className="bg-secondary/40 backdrop-blur-sm border border-white/10 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 text-white hover:text-[#D4AF37] font-black py-3 px-6 rounded-full flex items-center gap-3 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
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
                        <p className="text-center text-[#D4AF37] p-6 bg-secondary/40 backdrop-blur-md border border-[#D4AF37]/30 rounded-3xl mt-8 shadow-lg text-sm font-bold tracking-widest uppercase shadow-[#D4AF37]/5">The league phase is complete. The top teams have advanced to the knockout stage.</p>
                    )}
                </div>
            )}
            
            {activeTab === 'knockout' && (
                <div className="animate-fade-in-up">
                    <div className="flex justify-end mb-6">
                         <button 
                            onClick={handleShareBracket}
                            disabled={isGeneratingBracket}
                            className="bg-secondary/40 backdrop-blur-sm border border-white/10 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 text-white hover:text-[#D4AF37] font-black py-3 px-6 rounded-full flex items-center gap-3 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest shadow-lg"
                        >
                            {isGeneratingBracket ? (
                                <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            )}
                            Share Bracket
                        </button>
                    </div>
                    <KnockoutBracket tournament={tournament} />
                </div>
            )}

            {activeTab === 'awards' && (
                awardsLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
                    </div>
                ) : (
                    awards.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {awards.map(award => (
                                <AwardCard key={award.id} award={award} onPlayerClick={handlePlayerClick} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-primary/40 rounded-3xl border border-dashed border-white/10 max-w-2xl mx-auto">
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No awards announced yet.</p>
                        </div>
                    )
                )
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