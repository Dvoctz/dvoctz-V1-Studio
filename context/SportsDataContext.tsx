
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useSupabase } from './SupabaseContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbTournament, DbTeam, DbPlayer, DbFixture, DbSponsor, DbClub } from '../supabaseClient';
import type { Tournament, Team, Player, Fixture, Sponsor, TeamStanding, Score, TournamentSponsor, Club } from '../types';

interface SportsState {
    tournaments: Tournament[];
    clubs: Club[];
    teams: Team[];
    players: Player[];
    fixtures: Fixture[];
    sponsors: Sponsor[];
    tournamentSponsors: TournamentSponsor[];
    rules: string;
    loading: boolean;
}

export type CsvTeam = Omit<Team, 'id' | 'clubId'> & { clubName: string };
export type CsvPlayer = Omit<Player, 'id' | 'teamId' | 'stats'> & { teamName: string; matches?: string; aces?: string; kills?: string; blocks?: string; };


interface SportsContextType extends SportsState {
    addTournament: (tournament: Omit<Tournament, 'id'>) => Promise<void>;
    updateTournament: (tournament: Tournament) => Promise<void>;
    deleteTournament: (id: number) => Promise<void>;
    addClub: (club: Omit<Club, 'id'> & { logoFile?: File }) => Promise<void>;
    updateClub: (club: Club & { logoFile?: File }) => Promise<void>;
    deleteClub: (id: number) => Promise<void>;
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
    toggleSponsorShowInFooter: (sponsor: Sponsor) => Promise<void>;
    updateRules: (content: string) => Promise<void>;
    bulkAddOrUpdateTeams: (teams: CsvTeam[]) => Promise<void>;
    bulkAddOrUpdatePlayers: (players: CsvPlayer[]) => Promise<void>;
    updateSponsorsForTournament: (tournamentId: number, sponsorIds: number[]) => Promise<void>;
    getSponsorsForTournament: (tournamentId: number) => Sponsor[];
    getTournamentsByDivision: (division: 'Division 1' | 'Division 2') => Tournament[];
    getFixturesByTournament: (tournamentId: number) => Fixture[];
    getClubById: (clubId: number) => Club | undefined;
    getTeamById: (teamId: number) => Team | undefined;
    getTeamsByClub: (clubId: number) => Team[];
    getPlayersByTeam: (teamId: number) => Player[];
    getStandingsForTournament: (tournamentId: number) => TeamStanding[];
}

const SportsDataContext = createContext<SportsContextType | undefined>(undefined);

// MAPPING FUNCTIONS to convert snake_case from DB to camelCase for the app
const mapClub = (c: any): Club => ({
  id: c.id,
  name: c.name,
  logoUrl: c.logo_url,
});

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
  stats: p.stats || { matches: 0, aces: 0, kills: 0, blocks: 0 },
});

const mapSponsor = (s: any): Sponsor => ({
  id: s.id,
  name: s.name,
  website: s.website,
  logoUrl: s.logo_url,
  showInFooter: s.show_in_footer || false,
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
        clubs: [],
        teams: [],
        players: [],
        fixtures: [],
        sponsors: [],
        tournamentSponsors: [],
        rules: '',
        loading: true,
    });

    const fetchData = useCallback(async () => {
        setState(s => ({...s, loading: true}));
        try {
            const [
                { data: tournamentsData, error: tournamentsError },
                { data: clubsData, error: clubsError },
                { data: teamsData, error: teamsError },
                { data: playersData, error: playersError },
                { data: fixturesData, error: fixturesError },
                { data: sponsorsData, error: sponsorsError },
                { data: tournamentSponsorsData, error: tournamentSponsorsError },
                { data: rulesData, error: rulesError },
            ] = await Promise.all([
                supabase.from('tournaments').select('*').order('name'),
                supabase.from('clubs').select('*').order('name'),
                supabase.from('teams').select('*').order('name'),
                supabase.from('players').select('*').order('name'),
                supabase.from('fixtures').select('*'),
                supabase.from('sponsors').select('*').order('name'),
                supabase.from('tournament_sponsors').select('*'),
                supabase.from('game_rules').select('content').limit(1).maybeSingle(),
            ]);

            if (tournamentsError) throw tournamentsError;
            if (clubsError) throw clubsError;
            if (teamsError) throw teamsError;
            if (playersError) throw playersError;
            if (fixturesError) throw fixturesError;
            if (sponsorsError) throw sponsorsError;
            if (tournamentSponsorsError) throw tournamentSponsorsError;
            if (rulesError) {
                 console.warn('Could not fetch game rules. This is non-critical.', rulesError);
            }

            setState({
                tournaments: (tournamentsData || []) as DbTournament[],
                clubs: (clubsData || []).map(mapClub),
                teams: (teamsData || []).map(mapTeam),
                players: (playersData || []).map(mapPlayer),
                fixtures: (fixturesData || []).map(mapFixture),
                sponsors: (sponsorsData || []).map(mapSponsor),
                tournamentSponsors: (tournamentSponsorsData || []) as TournamentSponsor[],
                rules: rulesData?.content || 'The official game rules have not been set yet. An admin can add them from the Rules page.',
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

    const addTournament = useCallback(async (tournament: Omit<Tournament, 'id'>) => {
        const { data, error } = await supabase.from('tournaments').insert(tournament).select().single();
        if (error) throw error;
        setState(s => ({...s, tournaments: [...s.tournaments, data as Tournament].sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase]);

    const updateTournament = useCallback(async (tournament: Tournament) => {
        const { id, ...rest } = tournament;
        const { data, error } = await supabase.from('tournaments').update(rest).eq('id', id).select().single();
        if (error) throw error;
        setState(s => ({...s, tournaments: s.tournaments.map(t => t.id === id ? data as Tournament : t) }));
    }, [supabase]);

    const deleteTournament = useCallback(async (id: number) => {
        const { error } = await supabase.from('tournaments').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, tournaments: s.tournaments.filter(t => t.id !== id) }));
    }, [supabase]);

    const addClub = useCallback(async (clubData: Omit<Club, 'id'> & { logoFile?: File }) => {
        let finalLogoUrl = clubData.logoUrl;
        if (clubData.logoFile) {
            finalLogoUrl = await uploadAsset(supabase, clubData.logoFile);
        }
        const { name } = clubData;
        const { data, error } = await supabase.from('clubs').insert({ name, logo_url: finalLogoUrl }).select().single();
        if (error) throw error;
        setState(s => ({...s, clubs: [...s.clubs, mapClub(data)].sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase]);

    const updateClub = useCallback(async (clubData: Club & { logoFile?: File }) => {
        let finalLogoUrl = clubData.logoUrl;
        if (clubData.logoFile) {
            finalLogoUrl = await uploadAsset(supabase, clubData.logoFile);
        }
        const { id, name } = clubData;
        const { data, error } = await supabase.from('clubs').update({ name, logo_url: finalLogoUrl }).eq('id', id).select().single();
        if (error) throw error;
        setState(s => ({...s, clubs: s.clubs.map(c => c.id === id ? mapClub(data) : c) }));
    }, [supabase]);

    const deleteClub = useCallback(async (id: number) => {
         const { error } = await supabase.from('clubs').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, clubs: s.clubs.filter(c => c.id !== id) }));
    }, [supabase]);
    
    const addTeam = useCallback(async (teamData: Omit<Team, 'id'> & { logoFile?: File }) => {
        let finalLogoUrl = teamData.logoUrl;
        if (teamData.logoFile) {
            finalLogoUrl = await uploadAsset(supabase, teamData.logoFile);
        }
        const { name, shortName, division, clubId } = teamData;
        const { data, error } = await supabase.from('teams').insert({
            name, short_name: shortName, division, logo_url: finalLogoUrl, club_id: clubId,
        }).select().single();
        if (error) throw error;
        setState(s => ({...s, teams: [...s.teams, mapTeam(data)].sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase]);

    const updateTeam = useCallback(async (teamData: Team & { logoFile?: File }) => {
        let finalLogoUrl = teamData.logoUrl;
        if (teamData.logoFile) {
            finalLogoUrl = await uploadAsset(supabase, teamData.logoFile);
        }
        const { id, name, shortName, division, clubId } = teamData;
        const { data, error } = await supabase.from('teams').update({
            name, short_name: shortName, division, logo_url: finalLogoUrl, club_id: clubId,
        }).eq('id', id).select().single();
        if (error) throw error;
        setState(s => ({...s, teams: s.teams.map(t => t.id === id ? mapTeam(data) : t) }));
    }, [supabase]);

    const deleteTeam = useCallback(async (id: number) => {
        const { error } = await supabase.from('teams').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, teams: s.teams.filter(t => t.id !== id) }));
    }, [supabase]);

    const addPlayer = useCallback(async (playerData: Omit<Player, 'id'> & { photoFile?: File }) => {
        let finalPhotoUrl = playerData.photoUrl;
        if (playerData.photoFile) {
            finalPhotoUrl = await uploadAsset(supabase, playerData.photoFile);
        }
        const { name, teamId, role, stats } = playerData;
        const { data, error } = await supabase.from('players').insert({
            name, team_id: teamId, role, stats, photo_url: finalPhotoUrl,
        }).select().single();
        if (error) throw error;
        setState(s => ({...s, players: [...s.players, mapPlayer(data)].sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase]);

    const updatePlayer = useCallback(async (playerData: Player & { photoFile?: File }) => {
        let finalPhotoUrl = playerData.photoUrl;
        if (playerData.photoFile) {
            finalPhotoUrl = await uploadAsset(supabase, playerData.photoFile);
        }
        const { id, name, teamId, role, stats } = playerData;
        const { data, error } = await supabase.from('players').update({
            name, team_id: teamId, role, stats, photo_url: finalPhotoUrl,
        }).eq('id', id).select().single();
        if (error) throw error;
        setState(s => ({...s, players: s.players.map(p => p.id === id ? mapPlayer(data) : p) }));
    }, [supabase]);

    const deletePlayer = useCallback(async (id: number) => {
        const { error } = await supabase.from('players').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, players: s.players.filter(p => p.id !== id) }));
    }, [supabase]);
    
    const addFixture = useCallback(async (fixture: Omit<Fixture, 'id' | 'score'>) => {
        const { data, error } = await supabase.from('fixtures').insert({
            tournament_id: fixture.tournamentId, team1_id: fixture.team1Id, team2_id: fixture.team2Id,
            ground: fixture.ground, date_time: fixture.dateTime, status: fixture.status, referee: fixture.referee,
        }).select().single();
        if (error) throw error;
        setState(s => ({...s, fixtures: [...s.fixtures, mapFixture(data)] }));
    }, [supabase]);

    const updateFixture = useCallback(async (fixture: Fixture) => {
        const { data, error } = await supabase.from('fixtures').update({
            tournament_id: fixture.tournamentId, team1_id: fixture.team1Id, team2_id: fixture.team2Id,
            ground: fixture.ground, date_time: fixture.dateTime, status: fixture.status,
            score: fixture.score, referee: fixture.referee,
        }).eq('id', fixture.id).select().single();
        if (error) throw error;
        setState(s => ({...s, fixtures: s.fixtures.map(f => f.id === fixture.id ? mapFixture(data) : f) }));
    }, [supabase]);

    const deleteFixture = useCallback(async (id: number) => {
        const { error } = await supabase.from('fixtures').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, fixtures: s.fixtures.filter(f => f.id !== id) }));
    }, [supabase]);

    const addSponsor = useCallback(async (sponsorData: Omit<Sponsor, 'id'> & { logoFile?: File }) => {
        let finalLogoUrl = sponsorData.logoUrl;
        if (sponsorData.logoFile) {
            finalLogoUrl = await uploadAsset(supabase, sponsorData.logoFile);
        }
        const { name, website, showInFooter } = sponsorData;
        const { data, error } = await supabase.from('sponsors').insert({
            name, website, logo_url: finalLogoUrl, show_in_footer: showInFooter || false,
        }).select().single();
        if (error) throw error;
        setState(s => ({...s, sponsors: [...s.sponsors, mapSponsor(data)].sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase]);

    const updateSponsor = useCallback(async (sponsorData: Sponsor & { logoFile?: File }) => {
        let finalLogoUrl = sponsorData.logoUrl;
        if (sponsorData.logoFile) {
            finalLogoUrl = await uploadAsset(supabase, sponsorData.logoFile);
        }
        const { id, name, website, showInFooter } = sponsorData;
        const { data, error } = await supabase.from('sponsors').update({
            name, website, logo_url: finalLogoUrl, show_in_footer: showInFooter,
        }).eq('id', id).select().single();
        if (error) throw error;
        setState(s => ({...s, sponsors: s.sponsors.map(sp => sp.id === id ? mapSponsor(data) : sp) }));
    }, [supabase]);

    const deleteSponsor = useCallback(async (id: number) => {
        const { error } = await supabase.from('sponsors').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, sponsors: s.sponsors.filter(sp => sp.id !== id) }));
    }, [supabase]);

    const toggleSponsorShowInFooter = useCallback(async (sponsor: Sponsor) => {
        const { data, error } = await supabase
            .from('sponsors')
            .update({ show_in_footer: !sponsor.showInFooter })
            .eq('id', sponsor.id)
            .select()
            .single();
        if (error) throw error;
        setState(s => ({...s, sponsors: s.sponsors.map(sp => sp.id === sponsor.id ? mapSponsor(data) : sp) }));
    }, [supabase]);

    const updateRules = useCallback(async (content: string) => {
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
    }, [supabase]);
    
    const bulkAddOrUpdateTeams = useCallback(async (teamsData: CsvTeam[]) => {
        const clubNameMap = new Map<string, number>();
        state.clubs.forEach(club => {
            clubNameMap.set(club.name.toLowerCase(), club.id);
        });

        const teamsToUpsert = teamsData.map(t => {
            const clubId = clubNameMap.get(t.clubName.toLowerCase());
            if (!clubId) {
                 throw new Error(`Club "${t.clubName}" not found for team "${t.name}". Please ensure all clubs exist before importing teams.`);
            }
            return {
                name: t.name,
                short_name: t.shortName,
                division: t.division,
                logo_url: t.logoUrl,
                club_id: clubId,
            }
        });
        const { error } = await supabase.from('teams').upsert(teamsToUpsert, { onConflict: 'name' });
        if (error) throw error;
        await fetchData();
    }, [supabase, state.clubs, fetchData]);

    const bulkAddOrUpdatePlayers = useCallback(async (playersData: CsvPlayer[]) => {
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
    }, [supabase, state.teams, fetchData]);
    
    const updateSponsorsForTournament = useCallback(async (tournamentId: number, sponsorIds: number[]) => {
        const { error: deleteError } = await supabase
            .from('tournament_sponsors')
            .delete()
            .eq('tournament_id', tournamentId);
        
        if (deleteError) throw deleteError;

        if (sponsorIds.length > 0) {
            const newLinks = sponsorIds.map(sponsor_id => ({
                tournament_id: tournamentId,
                sponsor_id,
            }));
            const { error: insertError } = await supabase
                .from('tournament_sponsors')
                .insert(newLinks);
            
            if (insertError) throw insertError;
        }

        const { data, error } = await supabase.from('tournament_sponsors').select('*');
        if (error) throw error;
        setState(s => ({
            ...s,
            tournamentSponsors: (data || []) as TournamentSponsor[]
        }));
    }, [supabase]);

    const getSponsorsForTournament = useCallback((tournamentId: number): Sponsor[] => {
        const sponsorIds = state.tournamentSponsors
            .filter(ts => ts.tournament_id === tournamentId)
            .map(ts => ts.sponsor_id);
        
        return state.sponsors.filter(s => sponsorIds.includes(s.id));
    }, [state.tournamentSponsors, state.sponsors]);

    const getTournamentsByDivision = useCallback((division: 'Division 1' | 'Division 2') => {
        return state.tournaments.filter(t => t.division === division);
    }, [state.tournaments]);

    const getFixturesByTournament = useCallback((tournamentId: number) => {
        return state.fixtures.filter(f => f.tournamentId === tournamentId)
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }, [state.fixtures]);

    const getClubById = useCallback((clubId: number) => {
        return state.clubs.find(c => c.id === clubId);
    }, [state.clubs]);

    const getTeamById = useCallback((teamId: number) => {
        return state.teams.find(t => t.id === teamId);
    }, [state.teams]);

    const getTeamsByClub = useCallback((clubId: number) => {
        return state.teams.filter(t => t.clubId === clubId);
    }, [state.teams]);

    const getPlayersByTeam = useCallback((teamId: number) => {
        return state.players.filter(p => p.teamId === teamId);
    }, [state.players]);

    const getStandingsForTournament = useCallback((tournamentId: number): TeamStanding[] => {
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
    }, [state.fixtures, state.teams]);

    const contextValue = useMemo(() => ({
        ...state,
        addTournament,
        updateTournament,
        deleteTournament,
        addClub,
        updateClub,
        deleteClub,
        addTeam,
        updateTeam,
        deleteTeam,
        addPlayer,
        updatePlayer,
        deletePlayer,
        addFixture,
        updateFixture,
        deleteFixture,
        addSponsor,
        updateSponsor,
        deleteSponsor,
        toggleSponsorShowInFooter,
        updateRules,
        bulkAddOrUpdateTeams,
        bulkAddOrUpdatePlayers,
        updateSponsorsForTournament,
        getSponsorsForTournament,
        getTournamentsByDivision,
        getFixturesByTournament,
        getClubById,
        getTeamById,
        getTeamsByClub,
        getPlayersByTeam,
        getStandingsForTournament,
    }), [
        state, addTournament, updateTournament, deleteTournament, addClub,
        updateClub, deleteClub, addTeam, updateTeam, deleteTeam, addPlayer,
        updatePlayer, deletePlayer, addFixture, updateFixture, deleteFixture,
        addSponsor, updateSponsor, deleteSponsor, toggleSponsorShowInFooter,
        updateRules, bulkAddOrUpdateTeams, bulkAddOrUpdatePlayers,
        updateSponsorsForTournament, getSponsorsForTournament, getTournamentsByDivision,
        getFixturesByTournament, getClubById, getTeamById, getTeamsByClub,
        getPlayersByTeam, getStandingsForTournament
    ]);

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
