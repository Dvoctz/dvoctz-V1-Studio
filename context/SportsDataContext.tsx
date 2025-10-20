import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { tournaments as initialTournaments, teams as initialTeams, players as initialPlayers, fixtures as initialFixtures, sponsors as initialSponsors } from '../data/mockData';
import type { Tournament, Team, Player, Fixture, Sponsor, TeamStanding } from '../types';

interface SportsState {
    tournaments: Tournament[];
    teams: Team[];
    players: Player[];
    fixtures: Fixture[];
    sponsors: Sponsor[];
}

type SportsAction =
  | { type: 'ADD_PLAYER'; payload: Omit<Player, 'id'> }
  | { type: 'UPDATE_PLAYER'; payload: Player }
  | { type: 'DELETE_PLAYER'; payload: number }
  | { type: 'ADD_TEAM'; payload: Omit<Team, 'id'> }
  | { type: 'UPDATE_TEAM'; payload: Team }
  | { type: 'DELETE_TEAM'; payload: number }
  | { type: 'ADD_TOURNAMENT'; payload: Omit<Tournament, 'id'> }
  | { type: 'UPDATE_TOURNAMENT'; payload: Tournament }
  | { type: 'DELETE_TOURNAMENT'; payload: number }
  | { type: 'ADD_FIXTURE'; payload: Omit<Fixture, 'id'> }
  | { type: 'UPDATE_FIXTURE'; payload: Fixture }
  | { type: 'DELETE_FIXTURE'; payload: number }
  | { type: 'ADD_SPONSOR'; payload: Omit<Sponsor, 'id'> }
  | { type: 'UPDATE_SPONSOR'; payload: Sponsor }
  | { type: 'DELETE_SPONSOR'; payload: number };

const initialState: SportsState = {
    tournaments: initialTournaments,
    teams: initialTeams,
    players: initialPlayers,
    fixtures: initialFixtures,
    sponsors: initialSponsors,
};

const sportsReducer = (state: SportsState, action: SportsAction): SportsState => {
    switch (action.type) {
        // Player Actions
        case 'ADD_PLAYER':
            return { ...state, players: [{ ...action.payload, id: Date.now() }, ...state.players] };
        case 'UPDATE_PLAYER':
            return { ...state, players: state.players.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_PLAYER':
            return { ...state, players: state.players.filter(p => p.id !== action.payload) };
        // Team Actions
        case 'ADD_TEAM':
            return { ...state, teams: [{ ...action.payload, id: Date.now() }, ...state.teams] };
        case 'UPDATE_TEAM':
            return { ...state, teams: state.teams.map(t => t.id === action.payload.id ? action.payload : t) };
        case 'DELETE_TEAM':
            return { ...state, teams: state.teams.filter(t => t.id !== action.payload) };
        // Tournament Actions
        case 'ADD_TOURNAMENT':
            return { ...state, tournaments: [{ ...action.payload, id: Date.now() }, ...state.tournaments] };
        case 'UPDATE_TOURNAMENT':
            return { ...state, tournaments: state.tournaments.map(t => t.id === action.payload.id ? action.payload : t) };
        case 'DELETE_TOURNAMENT':
            return { ...state, tournaments: state.tournaments.filter(t => t.id !== action.payload) };
        // Fixture Actions
        case 'ADD_FIXTURE':
             return { ...state, fixtures: [{ ...action.payload, id: Date.now() }, ...state.fixtures] };
        case 'UPDATE_FIXTURE':
            return { ...state, fixtures: state.fixtures.map(f => f.id === action.payload.id ? action.payload : f) };
        case 'DELETE_FIXTURE':
            return { ...state, fixtures: state.fixtures.filter(f => f.id !== action.payload) };
        // Sponsor Actions
        case 'ADD_SPONSOR':
            return { ...state, sponsors: [{ ...action.payload, id: Date.now() }, ...state.sponsors] };
        case 'UPDATE_SPONSOR':
            return { ...state, sponsors: state.sponsors.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_SPONSOR':
            return { ...state, sponsors: state.sponsors.filter(s => s.id !== action.payload) };
        default:
            return state;
    }
};

interface SportsContextType extends SportsState {
    dispatch: React.Dispatch<SportsAction>;
    getTournamentsByDivision: (division: 'Division 1' | 'Division 2') => Tournament[];
    getFixturesByTournament: (tournamentId: number) => Fixture[];
    getTeamById: (teamId: number) => Team | undefined;
    getPlayersByTeam: (teamId: number) => Player[];
    getStandingsForTournament: (tournamentId: number) => TeamStanding[];
}

const SportsDataContext = createContext<SportsContextType | undefined>(undefined);

export const SportsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(sportsReducer, initialState);

    const contextValue = useMemo(() => ({
        ...state,
        dispatch,
        getTournamentsByDivision: (division: 'Division 1' | 'Division 2') => {
            return state.tournaments.filter(t => t.division === division);
        },
        getFixturesByTournament: (tournamentId: number) => {
            return state.fixtures.filter(f => f.tournamentId === tournamentId)
                .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
        },
        getTeamById: (teamId: number) => {
            return state.teams.find(t => t.id === teamId);
        },
        getPlayersByTeam: (teamId: number) => {
            return state.players.filter(p => p.teamId === teamId);
        },
        getStandingsForTournament: (tournamentId: number): TeamStanding[] => {
            const tournamentFixtures = state.fixtures.filter(
                f => f.tournamentId === tournamentId && f.status === 'completed' && f.score && f.score.sets?.length > 0
            );

            const teamIdsInTournament = new Set<number>();
            state.teams.forEach(team => {
                const teamFixtures = state.fixtures.filter(f => f.tournamentId === tournamentId && (f.team1Id === team.id || f.team2Id === team.id));
                if (teamFixtures.length > 0) {
                    teamIdsInTournament.add(team.id);
                }
            });

            const standingsMap = new Map<number, TeamStanding>();

            teamIdsInTournament.forEach(id => {
                const team = state.teams.find(t => t.id === id);
                if (team) {
                    standingsMap.set(id, {
                        teamId: id,
                        teamName: team.name,
                        logoUrl: team.logoUrl,
                        gamesPlayed: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                        goalsFor: 0,
                        goalsAgainst: 0,
                        goalDifference: 0,
                        points: 0,
                    });
                }
            });

            tournamentFixtures.forEach(fixture => {
                const team1Standing = standingsMap.get(fixture.team1Id);
                const team2Standing = standingsMap.get(fixture.team2Id);
                const score = fixture.score!;

                if (team1Standing && team2Standing) {
                    team1Standing.gamesPlayed++;
                    team2Standing.gamesPlayed++;

                    // Calculate total points from set breakdown
                    const team1TotalPoints = score.sets.reduce((sum, set) => sum + set.team1Points, 0);
                    const team2TotalPoints = score.sets.reduce((sum, set) => sum + set.team2Points, 0);
                    
                    team1Standing.goalsFor += team1TotalPoints;
                    team1Standing.goalsAgainst += team2TotalPoints;
                    team2Standing.goalsFor += team2TotalPoints;
                    team2Standing.goalsAgainst += team1TotalPoints;

                    // Match result based on sets won (score.team1Score vs score.team2Score)
                    if (score.team1Score > score.team2Score) {
                        team1Standing.wins++;
                        team2Standing.losses++;
                        team1Standing.points += 3;
                    } else if (score.team2Score > score.team1Score) {
                        team2Standing.wins++;
                        team1Standing.losses++;
                        team2Standing.points += 3;
                    } else {
                        team1Standing.draws++;
                        team2Standing.draws++;
                        team1Standing.points += 1;
                        team2Standing.points += 1;
                    }
                }
            });

            const standings = Array.from(standingsMap.values());
            standings.forEach(s => {
                s.goalDifference = s.goalsFor - s.goalsAgainst;
            });
            
            standings.sort((a, b) => {
                // 1. Points
                if (b.points !== a.points) return b.points - a.points;

                // 2. Overall Goal Difference (based on total points)
                if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
                
                // 3. Head-to-head comparison
                const headToHeadFixtures = tournamentFixtures.filter(
                    f => (f.team1Id === a.teamId && f.team2Id === b.teamId) ||
                         (f.team1Id === b.teamId && f.team2Id === a.teamId)
                );

                if (headToHeadFixtures.length > 0) {
                    let aH2hPoints = 0;
                    let bH2hPoints = 0;
                    let aH2hGoalsFor = 0;
                    let bH2hGoalsFor = 0;
                    let aH2hGoalsAgainst = 0;
                    let bH2hGoalsAgainst = 0;

                    headToHeadFixtures.forEach(f => {
                        const score = f.score!;
                        // Calculate total points from set breakdown for this H2H fixture
                        const fTeam1TotalPoints = score.sets.reduce((sum, set) => sum + set.team1Points, 0);
                        const fTeam2TotalPoints = score.sets.reduce((sum, set) => sum + set.team2Points, 0);

                        if (f.team1Id === a.teamId) { // a is team1, b is team2
                            aH2hGoalsFor += fTeam1TotalPoints;
                            aH2hGoalsAgainst += fTeam2TotalPoints;
                            bH2hGoalsFor += fTeam2TotalPoints;
                            bH2hGoalsAgainst += fTeam1TotalPoints;

                            // Points based on sets won
                            if (score.team1Score > score.team2Score) aH2hPoints += 3;
                            else if (score.team2Score > score.team1Score) bH2hPoints += 3;
                            else { aH2hPoints += 1; bH2hPoints += 1; }
                        } else { // b is team1, a is team2
                            bH2hGoalsFor += fTeam1TotalPoints;
                            bH2hGoalsAgainst += fTeam2TotalPoints;
                            aH2hGoalsFor += fTeam2TotalPoints;
                            aH2hGoalsAgainst += fTeam1TotalPoints;
                            
                            // Points based on sets won
                            if (score.team2Score > score.team1Score) aH2hPoints += 3;
                            else if (score.team1Score > score.team2Score) bH2hPoints += 3;
                            else { aH2hPoints += 1; bH2hPoints += 1; }
                        }
                    });

                    // 3a. Head-to-head points
                    if (bH2hPoints !== aH2hPoints) {
                        return bH2hPoints - aH2hPoints;
                    }

                    // 3b. Head-to-head goal difference (based on total points)
                    const aH2hGD = aH2hGoalsFor - aH2hGoalsAgainst;
                    const bH2hGD = bH2hGoalsFor - bH2hGoalsAgainst;
                    if (bH2hGD !== aH2hGD) {
                        return bH2hGD - aH2hGD;
                    }
                }


                // 4. Overall Goals For (based on total points)
                if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
                
                // 5. Team Name
                return a.teamName.localeCompare(b.teamName);
            });

            return standings;
        },
    }), [state]);

    return (
        <SportsDataContext.Provider value={contextValue}>
            {children}
        </SportsDataContext.Provider>
    );
};

export const useSports = (): SportsContextType => {
    const context = useContext(SportsDataContext);
    if (context === undefined) {
        throw new Error('useSports must be used within a SportsDataProvider');
    }
    return context;
};