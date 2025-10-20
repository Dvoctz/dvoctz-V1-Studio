import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useSupabase } from './SupabaseContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbTournament, DbTeam, DbPlayer, DbFixture, DbSponsor } from '../supabaseClient';
import type { Tournament, Team, Player, Fixture, Sponsor, TeamStanding, Score } from '../types';

interface SportsState {
    tournaments: Tournament[];
    teams: Team[];
    players: Player[];
    fixtures: Fixture[];
    sponsors: Sponsor[];
    loading: boolean;
}

export type CsvTeam = Omit<Team, 'id'>;
export type CsvPlayer = Omit<Player, 'id' | 'teamId' | 'stats'> & { teamName: string; matches?: string; aces?: string; kills?: string; blocks?: string; };


interface SportsContextType extends SportsState {
    addTournament: (tournament: Omit<Tournament, 'id'>) => Promise<void>;
    updateTournament: (tournament: Tournament) => Promise<void>;
    deleteTournament: (id: number) => Promise<void>;
    addTeam: (team: Omit<Team, 'id'> & { logoFile?: File }) => Promise<void>;
    updateTeam: (team: Team & { logoFile?: File }) => Promise<void>;
    deleteTeam: (id: number) => Promise<void>;
    addPlayer: (player: Omit<Player, 'id'> & { photoFile?: File }) => Promise<void>;
    updatePlayer: (player: Player & { photoFile?: File }) => Promise<void>;
    deletePlayer: (id: number) => Promise<void>;
    addFixture: (fixture: Omit<Fixture, 'id' | 'score'>) => Promise<void>;
    updateFixture: (fixture: Fixture) => Promise<void>;
    deleteFixture: (id: number) => Promise<void>;
    addSponsor: (sponsor: Omit<Sponsor, 'id'> & { logoFile?: File }) => Promise<void>;
    updateSponsor: (sponsor: Sponsor & { logoFile?: File }) => Promise<void>;
    deleteSponsor: (id: number) => Promise<void>;
    bulkAddOrUpdateTeams: (teams: CsvTeam[]) => Promise<void>;
    bulkAddOrUpdatePlayers: (players: CsvPlayer[]) => Promise<void>;
    getTournamentsByDivision: (division: 'Division 1' | 'Division 2') => Tournament[];
    getFixturesByTournament: (tournamentId: number) => Fixture[];
    getTeamById: (teamId: number) => Team | undefined;
    getPlayersByTeam: (teamId: number) => Player[];
    getStandingsForTournament: (tournamentId: number) => TeamStanding[];
}

const SportsDataContext = createContext<SportsContextType | undefined>(undefined);

const mapFixture = (f: DbFixture): Fixture => ({ ...f, score: f.score as Score | undefined });

// Helper function to upload a file to Supabase Storage.
// NOTE: This requires a public bucket named 'assets' to be created in your Supabase project.
const uploadAsset = async (supabase: SupabaseClient, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('assets')
      .upload(fileName, file);

    if (error) {
        console.error('Error uploading file:', error);
        throw new Error(`Failed to upload asset: ${error.message}`);
    }

    const { data } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);
        
    return data.publicUrl;
};

export const SportsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
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
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const contextValue = useMemo(() => {
        const deleteAction = (table: string) => async (id: number) => {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            await fetchData();
        };

        return {
            ...state,
            addTournament: async (tournament) => {
                const { error } = await supabase.from('tournaments').insert(tournament);
                if (error) throw error;
                await fetchData();
            },
            updateTournament: async (tournament) => {
                const { id, ...rest } = tournament;
                const { error } = await supabase.from('tournaments').update(rest).eq('id', id);
                if (error) throw error;
                await fetchData();
            },
            deleteTournament: deleteAction('tournaments'),
            
            addTeam: async (teamData) => {
                let finalLogoUrl = teamData.logoUrl;
                if (teamData.logoFile) {
                    finalLogoUrl = await uploadAsset(supabase, teamData.logoFile);
                }
                const { logoFile, ...teamToInsert } = teamData;
                const { error } = await supabase.from('teams').insert({ ...teamToInsert, logoUrl: finalLogoUrl });
                if (error) throw error;
                await fetchData();
            },
            updateTeam: async (teamData) => {
                let finalLogoUrl = teamData.logoUrl;
                if (teamData.logoFile) {
                    finalLogoUrl = await uploadAsset(supabase, teamData.logoFile);
                }
                const { id, logoFile, ...teamToUpdate } = teamData;
                const { error } = await supabase.from('teams').update({ ...teamToUpdate, logoUrl: finalLogoUrl }).eq('id', id);
                if (error) throw error;
                await fetchData();
            },
            deleteTeam: deleteAction('teams'),

            addPlayer: async (playerData) => {
                let finalPhotoUrl = playerData.photoUrl;
                if (playerData.photoFile) {
                    finalPhotoUrl = await uploadAsset(supabase, playerData.photoFile);
                }
                const { photoFile, ...playerToInsert } = playerData;
                const { error } = await supabase.from('players').insert({ ...playerToInsert, photoUrl: finalPhotoUrl });
                if (error) throw error;
                await fetchData();
            },
            updatePlayer: async (playerData) => {
                let finalPhotoUrl = playerData.photoUrl;
                if (playerData.photoFile) {
                    finalPhotoUrl = await uploadAsset(supabase, playerData.photoFile);
                }
                const { id, photoFile, ...playerToUpdate } = playerData;
                const { error } = await supabase.from('players').update({ ...playerToUpdate, photoUrl: finalPhotoUrl }).eq('id', id);
                if (error) throw error;
                await fetchData();
            },
            deletePlayer: deleteAction('players'),
            
            addFixture: async (fixture) => {
                const { error } = await supabase.from('fixtures').insert(fixture);
                if (error) throw error;
                await fetchData();
            },
            updateFixture: async (fixture) => {
                const { id, ...rest } = fixture;
                const { error } = await supabase.from('fixtures').update(rest).eq('id', id);
                if (error) throw error;
                await fetchData();
            },
            deleteFixture: deleteAction('fixtures'),

            addSponsor: async (sponsorData) => {
                let finalLogoUrl = sponsorData.logoUrl;
                if (sponsorData.logoFile) {
                    finalLogoUrl = await uploadAsset(supabase, sponsorData.logoFile);
                }
                const { logoFile, ...sponsorToInsert } = sponsorData;
                const { error } = await supabase.from('sponsors').insert({ ...sponsorToInsert, logoUrl: finalLogoUrl });
                if (error) throw error;
                await fetchData();
            },
            updateSponsor: async (sponsorData) => {
                let finalLogoUrl = sponsorData.logoUrl;
                if (sponsorData.logoFile) {
                    finalLogoUrl = await uploadAsset(supabase, sponsorData.logoFile);
                }
                const { id, logoFile, ...sponsorToUpdate } = sponsorData;
                const { error } = await supabase.from('sponsors').update({ ...sponsorToUpdate, logoUrl: finalLogoUrl }).eq('id', id);
                if (error) throw error;
                await fetchData();
            },
            deleteSponsor: deleteAction('sponsors'),
            
            bulkAddOrUpdateTeams: async (teamsData: CsvTeam[]) => {
                const teamsToUpsert = teamsData.map(t => ({...t}));
                const { error } = await supabase.from('teams').upsert(teamsToUpsert, { onConflict: 'name' });
                if (error) throw error;
                await fetchData();
            },

            bulkAddOrUpdatePlayers: async (playersData: CsvPlayer[]) => {
                const teamNameMap = new Map<string, number>();
                state.teams.forEach(team => {
                    teamNameMap.set(team.name.toLowerCase(), team.id);
                });

                const playersToUpsert = playersData.map(p => {
                    const teamId = teamNameMap.get(p.teamName.toLowerCase());
                    if (!teamId) {
                        throw new Error(`Team "${p.teamName}" not found for player "${p.name}". Please ensure all teams exist before importing players.`);
                    }
                    const { teamName, matches, aces, kills, blocks, ...player } = p;
                    return { 
                        ...player, 
                        teamId,
                        stats: {
                            matches: parseInt(matches || '0', 10),
                            aces: parseInt(aces || '0', 10),
                            kills: parseInt(kills || '0', 10),
                            blocks: parseInt(blocks || '0', 10),
                        }
                    };
                }).filter(Boolean) as Omit<Player, 'id'>[];

                const { error } = await supabase.from('players').upsert(playersToUpsert, { onConflict: 'name,teamId' });
                if (error) throw error;
                await fetchData();
            },

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
    }, [state, fetchData, supabase]);

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