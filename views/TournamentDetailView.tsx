
import React, { useState, useEffect, useMemo } from 'react';
import { useSports, useEntityData } from '../context/SportsDataContext';
import type { Fixture, Tournament, Team, TeamStanding, Player } from '../types';
import { ScoreSheetModal } from '../components/ScoreSheetModal';
import { KnockoutBracket } from '../components/KnockoutBracket';

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

// New Modal Component for Tournament Roster
const TournamentTeamRosterModal: React.FC<{ tournament: Tournament; team: Team; onClose: () => void }> = ({ tournament, team, onClose }) => {
    const { getTournamentSquad } = useSports();
    // Force load tournament rosters if not present, though generally handled by parent view or aggressive preload
    const roster = useMemo(() => getTournamentSquad(tournament.id, team.id), [getTournamentSquad, tournament.id, team.id]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
             <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-md transform transition-all max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-accent flex justify-between items-center sticky top-0 bg-secondary z-10">
                    <div>
                         <h3 className="text-xl font-bold text-white">{team.name}</h3>
                         <p className="text-sm text-highlight">Squad for {tournament.name}</p>
                    </div>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-4">
                    {roster.length > 0 ? (
                        <div className="space-y-2">
                            {roster.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-2 bg-primary rounded">
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
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-text-secondary">
                            <p>No specific roster recorded for this tournament.</p>
                            <p className="text-xs mt-2">The team likely used their standard club roster.</p>
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


export const TournamentDetailView: React.FC<TournamentDetailViewProps> = ({ tournament: initialTournament, onBack }) => {
  const { getFixturesByTournament, getTeamById, getStandingsForTournament, getSponsorsForTournament, tournaments } = useSports();
  
  // FIX: Get the absolute latest version of the tournament from context.
  // The 'initialTournament' prop passed from the parent might be stale (e.g., it doesn't know the phase changed).
  // This ensures that when data is loaded in the background, the view updates to reflect the new phase (e.g., knockout).
  const tournament = useMemo(() => tournaments.find(t => t.id === initialTournament.id) || initialTournament, [tournaments, initialTournament]);

  // Ensure dependencies for this view are loaded
  const { loading: fixturesLoading } = useEntityData('fixtures');
  const { loading: teamsLoading } = useEntityData('teams');
  const { loading: sponsorsLoading } = useEntityData('sponsors');
  const { loading: tsLoading } = useEntityData('tournamentSponsors');
  const { loading: trLoading } = useEntityData('tournamentRosters');
  
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [selectedTeamForRoster, setSelectedTeamForRoster] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings' | 'knockout'>('fixtures');
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);

  const fixtures = useMemo(() => getFixturesByTournament(tournament.id).filter(f => !f.stage), [getFixturesByTournament, tournament.id]);
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
          setActiveTab('knockout');
      } else {
          setActiveTab('fixtures');
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
      if (t) setSelectedTeamForRoster(t);
  }

  const team1 = selectedFixture ? getTeamById(selectedFixture.team1Id) : null;
  const team2 = selectedFixture ? getTeamById(selectedFixture.team2Id) : null;
  
  const isDataLoading = fixturesLoading || teamsLoading || sponsorsLoading || tsLoading;

  const TabButton: React.FC<{ tab: 'fixtures' | 'standings' | 'knockout'; children: React.ReactNode }> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-3 text-lg font-semibold transition-colors duration-300 focus:outline-none ${activeTab === tab ? 'text-highlight border-b-2 border-highlight' : 'text-text-secondary hover:text-white'}`}
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
      
      <div className="flex border-b border-accent mb-6 justify-center">
            <TabButton tab="fixtures">Fixtures</TabButton>
            <TabButton tab="standings">Standings</TabButton>
            {(tournament.phase === 'knockout' || tournament.phase === 'completed') && (
                <TabButton tab="knockout">Knockout</TabButton>
            )}
      </div>

      <div className="space-y-6">
            {activeTab === 'fixtures' ? (
                fixtures.length > 0 ? (
                fixtures.map(f => <FixtureItem key={f.id} fixture={f} onScorecardClick={setSelectedFixture} onTeamClick={handleTeamClick} />)
                ) : (
                <p className="text-center text-text-secondary">No round-robin fixtures scheduled for this tournament yet.</p>
                )
            ) : activeTab === 'standings' ? (
                <>
                    <StandingsTable standings={standings} onTeamClick={handleTeamClick} />
                        {(tournament.phase === 'knockout' || tournament.phase === 'completed') && (
                        <p className="text-center text-yellow-400 p-4 bg-secondary rounded-lg mt-4">The league phase is complete. The top teams have advanced to the knockout stage.</p>
                    )}
                </>
            ) : (
                <KnockoutBracket tournament={tournament} />
            )}
      </div>

      {selectedFixture && team1 && team2 && (
          <ScoreSheetModal fixture={selectedFixture} team1={team1} team2={team2} onClose={() => setSelectedFixture(null)} />
      )}

      {selectedTeamForRoster && (
          <TournamentTeamRosterModal 
            tournament={tournament} 
            team={selectedTeamForRoster} 
            onClose={() => setSelectedTeamForRoster(null)} 
          />
      )}
    </div>
  );
};
