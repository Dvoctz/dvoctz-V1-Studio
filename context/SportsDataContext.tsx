
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useSupabase } from './SupabaseContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbTournament, DbTeam, DbPlayer, DbFixture, DbSponsor } from '../supabaseClient';
// FIX: Added missing type imports for new functionality.
import type { Tournament, Team, Player, Fixture, Sponsor, TeamStanding, Score, Club, CaptainTeam, TournamentRoster, UserProfile } from '../types';

// FIX: Added state for clubs, captain teams, and rosters for new functionality.
interface SportsState {
    tournaments: Tournament[];
    teams: Team[];
    players: Player[];
    fixtures: Fixture[];
    sponsors: Sponsor[];
    rules: string;
    loading: boolean;
    clubs: Club[];
    allUserProfiles: UserProfile[];
    captainTeams: CaptainTeam[];
    tournamentRosters: TournamentRoster[];
}

export type CsvTeam = Omit<Team, 'id'>;
export type CsvPlayer = Omit<Player, 'id' | 'teamId' | 'stats'> & { teamName: string; matches?: string; aces?: string; kills?: string; blocks?: string; };


// FIX: Added missing function signatures to the context type.
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
    updateRules: (content: string) => Promise<void>;
    bulkAddOrUpdateTeams: (teams: CsvTeam[]) => Promise<void>;
    bulkAddOrUpdatePlayers: (players: CsvPlayer[]) => Promise<void>;
    getTournamentsByDivision: (division: 'Division 1' | 'Division 2') => Tournament[];
    getFixturesByTournament: (tournamentId: number) => Fixture[];
    getTeamById: (teamId: number) => Team | undefined;
    getPlayersByTeam: (teamId: number) => Player[];
    getStandingsForTournament: (tournamentId: number) => TeamStanding[];
    getCaptainTeams: (userId: string) => Team[];
    getClubById: (clubId: number) => Club | undefined;
    getPlayerD1History: (playerId: number) => boolean;
    getTournamentRoster: (tournamentId: number, teamId: number) => Promise<TournamentRoster | null>;
    saveTournamentRoster: (tournamentId: number, teamId: number, playerIds: number[]) => Promise<void>;
    addClub: (club: Omit<Club, 'id'>) => Promise<void>;
    updateClub: (club: Club) => Promise<void>;
    deleteClub: (id: number) => Promise<void>;
    updateUserProfile: (profile: UserProfile) => Promise<void>;
    assignTeamsToCaptain: (userId: string, teamIds: number[]) => Promise<void>;
}

const SportsDataContext = createContext<SportsContextType | undefined>(undefined);

// MAPPING FUNCTIONS to convert snake_case from DB to camelCase for the app
// FIX: Added 'clubId' to the team mapping function.
const mapTeam = (t: any): Team => ({
  id: t.id,
  name: t.name,
  shortName: t.short_name,
  logoUrl: t.logo_url,
  division: t.division,
  clubId: t.club_id,
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

// FIX: Added mapping functions for new data types.
const mapClub = (c: any): Club => ({
  id: c.id,
  name: c.name,
});

const mapUserProfile = (p: any): UserProfile => ({
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    role: p.role,
});

const mapTournamentRoster = (r: any): TournamentRoster => ({
  id: r.id,
  tournamentId: r.tournament_id,
  teamId: r.team_id,
  player_ids: r.player_ids,
});


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
    // FIX: Initialized new state properties.
    const [state, setState] = useState<SportsState>({
        tournaments: [],
        teams: [],
        players: [],
        fixtures: [],
        sponsors: [],
        rules: '',
        loading: true,
        clubs: [],
        allUserProfiles: [],
        captainTeams: [],
        tournamentRosters: [],
    });

    const fetchData = useCallback(async () => {
        setState(s => ({...s, loading: true}));
        try {
            // FIX: Added fetches for clubs, captain_teams, and tournament_rosters.
            const [
                { data: tournamentsData, error: tournamentsError },
                { data: teamsData, error: teamsError },
                { data: playersData, error: playersError },
                { data: fixturesData, error: fixturesError },
                { data: sponsorsData, error: sponsorsError },
                { data: rulesData, error: rulesError },
                { data: clubsData, error: clubsError },
                { data: userProfilesData, error: userProfilesError },
                { data: captainTeamsData, error: captainTeamsError },
                { data: tournamentRostersData, error: tournamentRostersError },
            ] = await Promise.all([
                supabase.from('tournaments').select('*').order('name'),
                supabase.from('teams').select('*').order('name'),
                supabase.from('players').select('*').order('name'),
                supabase.from('fixtures').select('*'),
                supabase.from('sponsors').select('*').order('name'),
                supabase.from('game_rules').select('content').limit(1).maybeSingle(),
                supabase.from('clubs').select('*').order('name'),
                supabase.from('user_profiles').select('*').order('full_name'),
                supabase.from('captain_teams').select('*'),
                supabase.from('tournament_rosters').select('*'),
            ]);

            if (tournamentsError) throw tournamentsError;
            if (teamsError) throw teamsError;
            if (playersError) throw playersError;
            if (fixturesError) throw fixturesError;
            if (sponsorsError) throw sponsorsError;
            if (clubsError) throw clubsError;
            if (userProfilesError) throw userProfilesError;
            if (captainTeamsError) throw captainTeamsError;
            if (tournamentRostersError) throw tournamentRostersError;
            if (rulesError) {
                 console.warn('Could not fetch game rules. This is non-critical.', rulesError);
            }

            // FIX: Set new state properties after fetching.
            setState({
                tournaments: (tournamentsData || []) as DbTournament[],
                teams: (teamsData || []).map(mapTeam),
                players: (playersData || []).map(mapPlayer),
                fixtures: (fixturesData || []).map(mapFixture),
                sponsors: (sponsorsData || []).map(mapSponsor),
                rules: rulesData?.content || 'The official game rules have not been set yet. An admin can add them from the Rules page.',
                clubs: (clubsData || []).map(mapClub),
                allUserProfiles: (userProfilesData || []).map(mapUserProfile),
                captainTeams: (captainTeamsData || []) as CaptainTeam[],
                tournamentRosters: (tournamentRostersData || []).map(mapTournamentRoster),
                loading: false,
            });
        } catch (error) {
            console.error(
                "Error fetching data from Supabase. This could be due to incorrect credentials, missing tables (including `game_rules`), or misconfigured Row Level Security policies. Please check your Supabase setup.",
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
                const { name, shortName, division, clubId } = teamData;
                const { error } = await supabase.from('teams').insert({
                    name,
                    short_name: shortName,
                    division,
                    logo_url: finalLogoUrl,
                    club_id: clubId,
                });
                if (error) throw error;
                await fetchData();
            },
            updateTeam: async (teamData) => {
                let finalLogoUrl = teamData.logoUrl;
                if (teamData.logoFile) {
                    finalLogoUrl = await uploadAsset(supabase, teamData.logoFile);
                }
                const { id, name, shortName, division, clubId } = teamData;
                const { error } = await supabase.from('teams').update({
                    name,
                    short_name: shortName,
                    division,
                    logo_url: finalLogoUrl,
                    club_id: clubId
                }).eq('id', id);
                if (error) throw error;
                await fetchData();
            },
            deleteTeam: deleteAction('teams'),

            addPlayer: async (playerData) => {
                let finalPhotoUrl = playerData.photoUrl;
                if (playerData.photoFile) {
                    finalPhotoUrl = await uploadAsset(supabase, playerData.photoFile);
                }
                const { name, teamId, role, stats } = playerData;
                const { error } = await supabase.from('players').insert({
                    name,
                    team_id: teamId,
                    role,
                    stats,
                    photo_url: finalPhotoUrl,
                });
                if (error) throw error;
                await fetchData();
            },
            updatePlayer: async (playerData) => {
                let finalPhotoUrl = playerData.photoUrl;
                if (playerData.photoFile) {
                    finalPhotoUrl = await uploadAsset(supabase, playerData.photoFile);
                }
                const { id, name, teamId, role, stats } = playerData;
                const { error } = await supabase.from('players').update({
                    name,
                    team_id: teamId,
                    role,
                    stats,
                    photo_url: finalPhotoUrl,
                }).eq('id', id);
                if (error) throw error;
                await fetchData();
            },
            deletePlayer: deleteAction('players'),
            
            addFixture: async (fixture) => {
                const { error } = await supabase.from('fixtures').insert({
                    tournament_id: fixture.tournamentId,
                    team1_id: fixture.team1Id,
                    team2_id: fixture.team2Id,
                    ground: fixture.ground,
                    date_time: fixture.dateTime,
                    status: fixture.status,
                    referee: fixture.referee,
                });
                if (error) throw error;
                await fetchData();
            },
            updateFixture: async (fixture) => {
                const { error } = await supabase.from('fixtures').update({
                    tournament_id: fixture.tournamentId,
                    team1_id: fixture.team1Id,
                    team2_id: fixture.team2Id,
                    ground: fixture.ground,
                    date_time: fixture.dateTime,
                    status: fixture.status,
                    score: fixture.score,
                    referee: fixture.referee,
                }).eq('id', fixture.id);
                if (error) throw error;
                await fetchData();
            },
            deleteFixture: deleteAction('fixtures'),

            addSponsor: async (sponsorData) => {
                let finalLogoUrl = sponsorData.logoUrl;
                if (sponsorData.logoFile) {
                    finalLogoUrl = await uploadAsset(supabase, sponsorData.logoFile);
                }
                const { name, website } = sponsorData;
                const { error } = await supabase.from('sponsors').insert({
                    name,
                    website,
                    logo_url: finalLogoUrl,
                });
                if (error) throw error;
                await fetchData();
            },
            updateSponsor: async (sponsorData) => {
                let finalLogoUrl = sponsorData.logoUrl;
                if (sponsorData.logoFile) {
                    finalLogoUrl = await uploadAsset(supabase, sponsorData.logoFile);
                }
                const { id, name, website } = sponsorData;
                const { error } = await supabase.from('sponsors').update({
                    name,
                    website,
                    logo_url: finalLogoUrl,
                }).eq('id', id);
                if (error) throw error;
                await fetchData();
            },
            deleteSponsor: deleteAction('sponsors'),

            updateRules: async (content: string) => {
                const { error } = await supabase
                    .from('game_rules')
                    .update({ content, updated_at: new Date().toISOString() })
                    .eq('id', 1);

                if (error) {
                    if (error.code === 'PGRST204') { 
                       const { error: insertError } = await supabase.from('game_rules').insert({ id: 1, content });
                       if (insertError) throw insertError;
                    } else {
                        throw error;
                    }
                }
                setState(s => ({ ...s, rules: content }));
            },
            
            bulkAddOrUpdateTeams: async (teamsData: CsvTeam[]) => {
                const teamsToUpsert = teamsData.map(t => ({
                    name: t.name,
                    short_name: t.shortName,
                    division: t.division,
                    logo_url: t.logoUrl,
                }));
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
                    const { name, role, photoUrl, matches, aces, kills, blocks } = p;
                    return { 
                        name,
                        role,
                        photo_url: photoUrl,
                        team_id: teamId,
                        stats: {
                            matches: parseInt(matches || '0', 10),
                            aces: parseInt(aces || '0', 10),
                            kills: parseInt(kills || '0', 10),
                            blocks: parseInt(blocks || '0', 10),
                        }
                    };
                });

                const { error } = await supabase.from('players').upsert(playersToUpsert, { onConflict: 'name,team_id' });
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
            // FIX: Implemented all missing functions for captain and roster management.
            getCaptainTeams: (userId: string) => {
                const teamIds = state.captainTeams.filter(ct => ct.user_id === userId).map(ct => ct.team_id);
                return state.teams.filter(team => teamIds.includes(team.id));
            },
            getClubById: (clubId: number) => {
                return state.clubs.find(c => c.id === clubId);
            },
            getPlayerD1History: (playerId: number) => {
                const d1Tournaments = new Set(state.tournaments.filter(t => t.division === 'Division 1').map(t => t.id));
                return state.tournamentRosters.some(roster => 
                    d1Tournaments.has(roster.tournamentId) && roster.player_ids.includes(playerId)
                );
            },
            getTournamentRoster: async (tournamentId: number, teamId: number) => {
                const { data, error } = await supabase
                    .from('tournament_rosters')
                    .select('*')
                    .eq('tournament_id', tournamentId)
                    .eq('team_id', teamId)
                    .maybeSingle();
                
                if (error) {
                    console.error("Error fetching tournament roster", error);
                    throw error;
                }
                if (!data) return null;
                return mapTournamentRoster(data);
            },
            saveTournamentRoster: async (tournamentId: number, teamId: number, playerIds: number[]) => {
                const { error } = await supabase
                    .from('tournament_rosters')
                    .upsert(
                        { tournament_id: tournamentId, team_id: teamId, player_ids: playerIds },
                        { onConflict: 'tournament_id,team_id' }
                    );

                if (error) {
                    console.error("Error saving tournament roster", error);
                    throw error;
                }
                await fetchData(); 
            },
            addClub: async (club) => {
                const { error } = await supabase.from('clubs').insert(club);
                if (error) throw error;
                await fetchData();
            },
            updateClub: async (club) => {
                const { error } = await supabase.from('clubs').update({ name: club.name }).eq('id', club.id);
                if (error) throw error;
                await fetchData();
            },
            deleteClub: deleteAction('clubs'),
            updateUserProfile: async (profile) => {
                 const { id, fullName, role } = profile;
                 const { error } = await supabase.from('user_profiles').update({ full_name: fullName, role }).eq('id', id);
                 if (error) throw error;
                 await fetchData();
            },
            assignTeamsToCaptain: async (userId: string, teamIds: number[]) => {
                // First, remove all existing assignments for this user
                const { error: deleteError } = await supabase.from('captain_teams').delete().eq('user_id', userId);
                if (deleteError) throw deleteError;

                // Then, insert the new assignments
                if (teamIds.length > 0) {
                    const assignments = teamIds.map(team_id => ({ user_id: userId, team_id }));
                    const { error: insertError } = await supabase.from('captain_teams').insert(assignments);
                    if (insertError) throw insertError;
                }
                await fetchData();
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