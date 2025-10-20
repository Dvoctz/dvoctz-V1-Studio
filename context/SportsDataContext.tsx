import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase, DbTournament, DbTeam, DbPlayer, DbFixture, DbSponsor } from '../supabaseClient';
import type { Tournament, Team, Player, Fixture, Sponsor, TeamStanding, Score } from '../types';

interface SportsState {
    tournaments: Tournament[];
    teams: Team[];
    players: Player[];
    fixtures: Fixture[];
    sponsors: Sponsor[];
    loading: boolean;
}

interface SportsContextType extends SportsState {
    // We will no longer expose dispatch. Instead we provide specific functions.
    // This improves type safety and abstracts away the implementation details.
    addTournament: (tournament: Omit<Tournament, 'id'>) => Promise<void>;
    updateTournament: (tournament: Tournament) => Promise<void>;
    deleteTournament: (id: number) => Promise<void>;
    addTeam: (team: Omit<Team, 'id'>) => Promise<void>;
    updateTeam: (team: Team) => Promise<void>;
    deleteTeam: (id: number) => Promise<void>;
    addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
    updatePlayer: (player: Player) => Promise<void>;
    deletePlayer: (id: number) => Promise<void>;
    addFixture: (fixture: Omit<Fixture, 'id' | 'score'>) => Promise<void>;
    updateFixture: (fixture: Fixture) => Promise<void>;
    deleteFixture: (id: number) => Promise<void>;
    addSponsor: (sponsor: Omit<Sponsor, 'id'>) => Promise<void>;
    updateSponsor: (sponsor: Sponsor) => Promise<void>;
    deleteSponsor: (id: number) => Promise<void>;

    // Getter functions remain, but they will operate on the fetched state
    getTournamentsByDivision: (division: 'Division 1' | 'Division 2') => Tournament[];
    getFixturesByTournament: (tournamentId: number) => Fixture[];
    getTeamById: (teamId: number) => Team | undefined;
    getPlayersByTeam: (teamId: number) => Player[];
    getStandingsForTournament: (tournamentId: number) => TeamStanding[];
}

const SportsDataContext = createContext<SportsContextType | undefined>(undefined);

const mapFixture = (f: DbFixture): Fixture => ({ ...f, score: f.score as Score | undefined });

export const SportsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<SportsState>({
        tournaments: [],
        teams: [],
        players: [],
        fixtures: [],
        sponsors: [],
        loading: true,
    });

    const fetchData = useCallback(async () => {
        setState(s => ({...s, loading: true}));
        try {
            const [
                { data: tournamentsData, error: tournamentsError },
                { data: teamsData, error: teamsError },
                { data: playersData, error: playersError },
                { data: fixturesData, error: fixturesError },
                { data: sponsorsData, error: sponsorsError },
            ] = await Promise.all([
                supabase.from('tournaments').select('*').order('name'),
                supabase.from('teams').select('*').order('name'),
                supabase.from('players').select('*').order('name'),
                supabase.from('fixtures').select('*'),
                supabase.from('sponsors').select('*').order('name')
            ]);

            if (tournamentsError) throw tournamentsError;
            if (teamsError) throw teamsError;
            if (playersError) throw playersError;
            if (fixturesError) throw fixturesError;
            if (sponsorsError) throw sponsorsError;

            setState({
                tournaments: tournamentsData as DbTournament[],
                teams: teamsData as DbTeam[],
                players: playersData as DbPlayer[],
                fixtures: (fixturesData as DbFixture[]).map(mapFixture),
                sponsors: sponsorsData as DbSponsor[],
                loading: false,
            });
        } catch (error) {
            console.error(
                "Error fetching data from Supabase. This could be due to incorrect credentials, missing tables, or misconfigured Row Level Security policies. Please run the 'setup.sql' script in your Supabase SQL editor.",
                error
            );
            setState(s => ({...s, loading: false}));
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const contextValue = useMemo(() => {
        const createAction = <T, O>(table: string, transform?: (item: T) => any) => async (item: O) => {
            const itemToInsert = transform ? transform(item as unknown as T) : item;
            const { error } = await supabase.from(table).insert(itemToInsert as any);
            if (error) console.error(`Error adding to ${table}:`, error);
            else await fetchData();
        };

        const updateAction = <T extends {id: number}>(table: string, transform?: (item: T) => any) => async (item: T) => {
            const { id, ...rest } = item;
            const itemToUpdate = transform ? transform(item) : rest;
            const { error } = await supabase.from(table).update(itemToUpdate as any).eq('id', id);
            if (error) console.error(`Error updating ${table}:`, error);
            else await fetchData();
        };

        const deleteAction = (table: string) => async (id: number) => {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) console.error(`Error deleting from ${table}:`, error);
            else await fetchData();
        };

        return {
            ...state,
            addTournament: createAction<Tournament, Omit<Tournament, 'id'>>('tournaments'),
            updateTournament: updateAction<Tournament>('tournaments'),
            deleteTournament: deleteAction('tournaments'),
            addTeam: createAction<Team, Omit<Team, 'id'>>('teams'),
            updateTeam: updateAction<Team>('teams'),
            deleteTeam: deleteAction('teams'),
            addPlayer: createAction<Player, Omit<Player, 'id'>>('players'),
            updatePlayer: updateAction<Player>('players'),
            deletePlayer: deleteAction('players'),
            addFixture: createAction<Fixture, Omit<Fixture, 'id'>>('fixtures'),
            updateFixture: updateAction<Fixture>('fixtures'),
            deleteFixture: deleteAction('fixtures'),
            addSponsor: createAction<Sponsor, Omit<Sponsor, 'id'>>('sponsors'),
            updateSponsor: updateAction<Sponsor>('sponsors'),
            deleteSponsor: deleteAction('sponsors'),

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

                        const team1TotalPoints = score.sets.reduce((sum, set) => sum + set.team1Points, 0);
                        const team2TotalPoints = score.sets.reduce((sum, set) => sum + set.team2Points, 0);
                        
                        team1Standing.goalsFor += team1TotalPoints;
                        team1Standing.goalsAgainst += team2TotalPoints;
                        team2Standing.goalsFor += team2TotalPoints;
                        team2Standing.goalsAgainst += team1TotalPoints;

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
                    if (b.points !== a.points) return b.points - a.points;
                    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
                    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
                    return a.teamName.localeCompare(b.teamName);
                });

                return standings;
            },
        };
    }, [state, fetchData]);

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