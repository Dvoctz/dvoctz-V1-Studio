
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useSupabase } from './SupabaseContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbTournament, DbTeam, DbPlayer, DbFixture, DbSponsor, DbTournamentSponsor } from '../supabaseClient';
import type { Tournament, Team, Player, Fixture, Sponsor, TeamStanding, Score } from '../types';

interface TournamentSponsorLink {
    tournamentId: number;
    sponsorId: number;
}

interface SportsState {
    tournaments: Tournament[];
    teams: Team[];
    players: Player[];
    fixtures: Fixture[];
    sponsors: Sponsor[];
    tournamentSponsors: TournamentSponsorLink[];
    loading: boolean;
}

export type CsvTeam = Omit<Team, 'id'>;
export type CsvPlayer = Omit<Player, 'id' | 'teamId' | 'stats'> & { teamName: string; matches?: string; aces?: string; kills?: string; blocks?: string; };


interface SportsContextType extends SportsState {
    addTournament: (tournament: Omit<Tournament, 'id'>) => Promise<Tournament>;
    updateTournament: (tournament: Tournament) => Promise<Tournament>;
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
    updateSponsorsForTournament: (tournamentId: number, sponsorIds: number[]) => Promise<void>;
    bulkAddOrUpdateTeams: (teams: CsvTeam[]) => Promise<void>;
    bulkAddOrUpdatePlayers: (players: CsvPlayer[]) => Promise<void>;
    getTournamentsByDivision: (division: 'Division 1' | 'Division 2') => Tournament[];
    getFixturesByTournament: (tournamentId: number) => Fixture[];
    getTeamById: (teamId: number) => Team | undefined;
    getPlayersByTeam: (teamId: number) => Player[];
    getSponsorsForTournament: (tournamentId: number) => Sponsor[];
    getStandingsForTournament: (tournamentId: number) => TeamStanding[];
}

const SportsDataContext = createContext<SportsContextType | undefined>(undefined);

// MAPPING FUNCTIONS to convert snake_case from DB to camelCase for the app
const mapTeam = (t: any): Team => ({
  id: t.id,
  name: t.name,
  shortName: t.short_name,
  logoUrl: t.logo_url,
  division: t.division,
});

const mapPlayer = (p: any): Player => ({
  id: p.id,
  name: p.name,
  teamId: p.team_id,
  photoUrl: p.photo_url,
  role: p.role,
  stats: p.stats,
});

const mapSponsor = (s: any): Sponsor => ({
  id: s.id,
  name: s.name,
  website: s.website,
  logoUrl: s.logo_url,
});

const mapFixture = (f: any): Fixture => ({
  id: f.id,
  tournamentId: f.tournament_id,
  team1Id: f.team1_id,
  team2Id: f.team2_id,
  ground: f.ground,
  dateTime: f.date_time,
  status: f.status,
  referee: f.referee,
  score: f.score as Score | undefined,
});

const mapTournamentSponsorLink = (ts: DbTournamentSponsor): TournamentSponsorLink => ({
    tournamentId: ts.tournament_id,
    sponsorId: ts.sponsor_id,
});


// Helper function to upload a file to Supabase Storage.
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
        tournamentSponsors: [],
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
                { data: tsData, error: tsError },
            ] = await Promise.all([
                supabase.from('tournaments').select('*').order('name'),
                supabase.from('teams').select('*').order('name'),
                supabase.from('players').select('*').order('name'),
                supabase.from('fixtures').select('*'),
                supabase.from('sponsors').select('*').order('name'),
                supabase.from('tournament_sponsors').select('*')
            ]);

            if (tournamentsError) throw tournamentsError;
            if (teamsError) throw teamsError;
            if (playersError) throw playersError;
            if (fixturesError) throw fixturesError;
            if (sponsorsError) throw sponsorsError;
            if (tsError) throw tsError;

            setState({
                tournaments: (tournamentsData || []) as DbTournament[],
                teams: (teamsData || []).map(mapTeam),
                players: (playersData || []).map(mapPlayer),
                fixtures: (fixturesData || []).map(mapFixture),
                sponsors: (sponsorsData || []).map(mapSponsor),
                tournamentSponsors: (tsData || []).map(mapTournamentSponsorLink),
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
        return {
            ...state,
            addTournament: async (tournament) => {
                const { data, error } = await supabase.from('tournaments').insert(tournament).select().single();
                if (error) throw error;
                setState(s => ({...s, tournaments: [...s.tournaments, data as Tournament].sort((a,b) => a.name.localeCompare(b.name))}));
                return data as Tournament;
            },
            updateTournament: async (tournament) => {
                const { id, ...rest } = tournament;
                const { data, error } = await supabase.from('tournaments').update(rest).eq('id', id).select().single();
                if (error) throw error;
                setState(s => ({...s, tournaments: s.tournaments.map(t => t.id === id ? data as Tournament : t)}));
                return data as Tournament;
            },
            deleteTournament: async (id) => {
                const { error } = await supabase.from('tournaments').delete().eq('id', id);
                if (error) throw error;
                setState(s => ({...s, tournaments: s.tournaments.filter(i => i.id !== id)}));
            },
            
            addTeam: async (teamData) => {
                let finalLogoUrl = teamData.logoUrl;
                if (teamData.logoFile) finalLogoUrl = await uploadAsset(supabase, teamData.logoFile);
                const { name, shortName, division } = teamData;
                const { data, error } = await supabase.from('teams').insert({ name, short_name: shortName, division, logo_url: finalLogoUrl }).select().single();
                if (error) throw error;
                setState(s => ({...s, teams: [...s.teams, mapTeam(data)].sort((a,b) => a.name.localeCompare(b.name))}));
            },
            updateTeam: async (teamData) => {
                let finalLogoUrl = teamData.logoUrl;
                if (teamData.logoFile) finalLogoUrl = await uploadAsset(supabase, teamData.logoFile);
                const { id, name, shortName, division } = teamData;
                const { data, error } = await supabase.from('teams').update({ name, short_name: shortName, division, logo_url: finalLogoUrl }).eq('id', id).select().single();
                if (error) throw error;
                setState(s => ({...s, teams: s.teams.map(i => i.id === id ? mapTeam(data) : i)}));
            },
            deleteTeam: async (id: number) => {
                const { error } = await supabase.from('teams').delete().eq('id', id);
                if (error) throw error;
                setState(s => ({...s, teams: s.teams.filter(i => i.id !== id)}));
            },

            addPlayer: async (playerData) => {
                let finalPhotoUrl = playerData.photoUrl;
                if (playerData.photoFile) finalPhotoUrl = await uploadAsset(supabase, playerData.photoFile);
                const { name, teamId, role, stats } = playerData;
                const { data, error } = await supabase.from('players').insert({ name, team_id: teamId, role, stats, photo_url: finalPhotoUrl }).select().single();
                if (error) throw error;
                setState(s => ({...s, players: [...s.players, mapPlayer(data)].sort((a,b) => a.name.localeCompare(b.name))}));
            },
            updatePlayer: async (playerData) => {
                let finalPhotoUrl = playerData.photoUrl;
                if (playerData.photoFile) finalPhotoUrl = await uploadAsset(supabase, playerData.photoFile);
                const { id, name, teamId, role, stats } = playerData;
                const { data, error } = await supabase.from('players').update({ name, team_id: teamId, role, stats, photo_url: finalPhotoUrl }).eq('id', id).select().single();
                if (error) throw error;
                setState(s => ({...s, players: s.players.map(i => i.id === id ? mapPlayer(data) : i)}));
            },
            deletePlayer: async (id: number) => {
                const { error } = await supabase.from('players').delete().eq('id', id);
                if (error) throw error;
                setState(s => ({...s, players: s.players.filter(i => i.id !== id)}));
            },
            
            addFixture: async (fixture) => {
                const { data, error } = await supabase.from('fixtures').insert({ tournament_id: fixture.tournamentId, team1_id: fixture.team1Id, team2_id: fixture.team2Id, ground: fixture.ground, date_time: fixture.dateTime, status: fixture.status, referee: fixture.referee }).select().single();
                if (error) throw error;
                setState(s => ({...s, fixtures: [...s.fixtures, mapFixture(data)]}));
            },
            updateFixture: async (fixture) => {
                const { data, error } = await supabase.from('fixtures').update({ tournament_id: fixture.tournamentId, team1_id: fixture.team1Id, team2_id: fixture.team2Id, ground: fixture.ground, date_time: fixture.dateTime, status: fixture.status, score: fixture.score, referee: fixture.referee }).eq('id', fixture.id).select().single();
                if (error) throw error;
                setState(s => ({...s, fixtures: s.fixtures.map(i => i.id === fixture.id ? mapFixture(data) : i)}));
            },
            deleteFixture: async (id: number) => {
                const { error } = await supabase.from('fixtures').delete().eq('id', id);
                if (error) throw error;
                setState(s => ({...s, fixtures: s.fixtures.filter(i => i.id !== id)}));
            },

            addSponsor: async (sponsorData) => {
                let finalLogoUrl = sponsorData.logoUrl;
                if (sponsorData.logoFile) finalLogoUrl = await uploadAsset(supabase, sponsorData.logoFile);
                const { name, website } = sponsorData;
                const { data, error } = await supabase.from('sponsors').insert({ name, website, logo_url: finalLogoUrl }).select().single();
                if (error) throw error;
                setState(s => ({...s, sponsors: [...s.sponsors, mapSponsor(data)].sort((a,b) => a.name.localeCompare(b.name))}));
            },
            updateSponsor: async (sponsorData) => {
                let finalLogoUrl = sponsorData.logoUrl;
                if (sponsorData.logoFile) finalLogoUrl = await uploadAsset(supabase, sponsorData.logoFile);
                const { id, name, website } = sponsorData;
                const { data, error } = await supabase.from('sponsors').update({ name, website, logo_url: finalLogoUrl }).eq('id', id).select().single();
                if (error) throw error;
                setState(s => ({...s, sponsors: s.sponsors.map(i => i.id === id ? mapSponsor(data) : i)}));
            },
            deleteSponsor: async (id: number) => {
                const { error } = await supabase.from('sponsors').delete().eq('id', id);
                if (error) throw error;
                setState(s => ({...s, sponsors: s.sponsors.filter(i => i.id !== id)}));
            },
            
            updateSponsorsForTournament: async (tournamentId, sponsorIds) => {
                const { error: deleteError } = await supabase.from('tournament_sponsors').delete().eq('tournament_id', tournamentId);
                if (deleteError) throw deleteError;

                if (sponsorIds.length > 0) {
                    const links = sponsorIds.map(sponsorId => ({ tournament_id: tournamentId, sponsor_id: sponsorId }));
                    const { error: insertError } = await supabase.from('tournament_sponsors').insert(links);
                    if (insertError) throw insertError;
                }
                // Manually update local state instead of full refetch
                const otherLinks = state.tournamentSponsors.filter(ts => ts.tournamentId !== tournamentId);
                const newLinks = sponsorIds.map(sponsorId => ({ tournamentId, sponsorId }));
                setState(s => ({...s, tournamentSponsors: [...otherLinks, ...newLinks]}));
            },
            
            bulkAddOrUpdateTeams: async (teamsData: CsvTeam[]) => {
                const teamsToUpsert = teamsData.map(t => ({ name: t.name, short_name: t.shortName, division: t.division, logo_url: t.logoUrl, }));
                const { error } = await supabase.from('teams').upsert(teamsToUpsert, { onConflict: 'name' });
                if (error) throw error;
                await fetchData(); // Refetch is safest for bulk operations
            },

            bulkAddOrUpdatePlayers: async (playersData: CsvPlayer[]) => {
                // Refetch teams to get correct IDs after a possible team import
                const { data: currentTeams, error: teamError } = await supabase.from('teams').select('id, name');
                if (teamError) throw teamError;

                const teamNameMap = new Map<string, number>();
                (currentTeams || []).forEach(team => {
                    teamNameMap.set(team.name.toLowerCase(), team.id);
                });

                const playersToUpsert = playersData.map(p => {
                    const teamId = teamNameMap.get(p.teamName.toLowerCase());
                    if (!teamId) {
                        throw new Error(`Team "${p.teamName}" not found for player "${p.name}". Please ensure all teams exist before importing players.`);
                    }
                    const { name, role, photoUrl, matches, aces, kills, blocks } = p;
                    return { name, role, photo_url: photoUrl, team_id: teamId, stats: { matches: parseInt(matches || '0', 10), aces: parseInt(aces || '0', 10), kills: parseInt(kills || '0', 10), blocks: parseInt(blocks || '0', 10) }};
                });
                
                const { error } = await supabase.from('players').upsert(playersToUpsert, { onConflict: 'name,team_id' });
                if (error) throw error;
                await fetchData(); // Refetch is safest for bulk operations
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
             getSponsorsForTournament: (tournamentId: number): Sponsor[] => {
                const sponsorIds = state.tournamentSponsors
                    .filter(ts => ts.tournamentId === tournamentId)
                    .map(ts => ts.sponsorId);
                return state.sponsors.filter(s => sponsorIds.includes(s.id));
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
