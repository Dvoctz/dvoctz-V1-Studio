
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useSupabase } from './SupabaseContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbTournament, DbTeam, DbPlayer, DbFixture, DbSponsor, DbClub, DbPlayerTransfer, DbTournamentRoster, DbTournamentTeam } from '../supabaseClient';
import type { Tournament, Team, Player, Fixture, Sponsor, TeamStanding, Score, TournamentSponsor, Club, PlayerTransfer, Notice, TournamentRoster, TournamentTeam } from '../types';

type EntityName = 'tournaments' | 'clubs' | 'teams' | 'players' | 'fixtures' | 'sponsors' | 'tournamentSponsors' | 'playerTransfers' | 'notices' | 'rules' | 'tournamentRosters' | 'tournamentTeams';

interface SportsState {
    tournaments: Tournament[] | null;
    clubs: Club[] | null;
    teams: Team[] | null;
    players: Player[] | null;
    fixtures: Fixture[] | null;
    sponsors: Sponsor[] | null;
    tournamentSponsors: TournamentSponsor[] | null;
    playerTransfers: PlayerTransfer[] | null;
    notices: Notice[] | null;
    rules: string | null;
    tournamentRosters: TournamentRoster[] | null;
    tournamentTeams: TournamentTeam[] | null;
    loading: Set<EntityName>;
    error: Error | null;
}

export type CsvTeam = Omit<Team, 'id' | 'clubId'> & { clubName: string };
export type CsvPlayer = Omit<Player, 'id' | 'teamId' | 'clubId' | 'stats'> & { teamName?: string; clubName?: string; matches?: string; aces?: string; kills?: string; blocks?: string; };


interface SportsContextType extends Omit<SportsState, 'tournaments' | 'clubs' | 'teams' | 'players' | 'fixtures' | 'sponsors' | 'tournamentSponsors' | 'playerTransfers' | 'notices' | 'rules' | 'tournamentRosters' | 'tournamentTeams'> {
    tournaments: Tournament[];
    clubs: Club[];
    teams: Team[];
    players: Player[];
    fixtures: Fixture[];
    sponsors: Sponsor[];
    tournamentSponsors: TournamentSponsor[];
    playerTransfers: PlayerTransfer[];
    notices: Notice[];
    rules: string;
    tournamentRosters: TournamentRoster[];
    tournamentTeams: TournamentTeam[];
    _internal_state: SportsState;
    fetchData: <T extends EntityName>(entityName: T) => Promise<SportsState[T]>;
    prefetchAllData: () => Promise<void>;
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
    deleteAllPlayers: () => Promise<void>;
    addFixture: (fixture: Omit<Fixture, 'id' | 'score'>) => Promise<void>;
    updateFixture: (fixture: Fixture) => Promise<void>;
    deleteFixture: (id: number) => Promise<void>;
    bulkAddFixtures: (fixtures: Omit<Fixture, 'id' | 'score'>[]) => Promise<void>;
    addSponsor: (sponsor: Omit<Sponsor, 'id'> & { logoFile?: File }) => Promise<void>;
    updateSponsor: (sponsor: Sponsor & { logoFile?: File }) => Promise<void>;
    deleteSponsor: (id: number) => Promise<void>;
    toggleSponsorShowInFooter: (sponsor: Sponsor) => Promise<void>;
    addPlayerTransfer: (transfer: Omit<PlayerTransfer, 'id' | 'isAutomated'>) => Promise<void>;
    updatePlayerTransfer: (transfer: PlayerTransfer) => Promise<void>;
    deletePlayerTransfer: (id: number) => Promise<void>;
    addNotice: (notice: Omit<Notice, 'id' | 'createdAt'>) => Promise<void>;
    deleteNotice: (id: number) => Promise<void>;
    updateRules: (content: string) => Promise<void>;
    bulkAddOrUpdateTeams: (teams: CsvTeam[]) => Promise<void>;
    bulkAddOrUpdatePlayers: (players: CsvPlayer[]) => Promise<void>;
    updateSponsorsForTournament: (tournamentId: number, sponsorIds: number[]) => Promise<void>;
    bulkUpdatePlayerTeam: (playerIds: number[], teamId: number | null) => Promise<void>;
    concludeLeaguePhase: (tournamentId: number) => Promise<void>;
    updateTournamentSquad: (tournamentId: number, teamId: number, playerIds: number[]) => Promise<void>;
    updateTournamentTeams: (tournamentId: number, teamIds: number[]) => Promise<void>;
    getActiveNotice: () => Notice | null;
    getSponsorsForTournament: (tournamentId: number) => Sponsor[];
    getTournamentsByDivision: (division: 'Division 1' | 'Division 2') => Tournament[];
    getFixturesByTournament: (tournamentId: number) => Fixture[];
    getClubById: (clubId: number | null) => Club | undefined;
    getTeamById: (teamId: number | null) => Team | undefined;
    getTeamsByClub: (clubId: number) => Team[];
    getPlayersByTeam: (teamId: number) => Player[];
    getPlayersByClub: (clubId: number) => Player[];
    getTransfersByPlayerId: (playerId: number) => PlayerTransfer[];
    getStandingsForTournament: (tournamentId: number) => TeamStanding[];
    getTournamentSquad: (tournamentId: number, teamId: number) => Player[];
}

const SportsDataContext = createContext<SportsContextType | undefined>(undefined);

// MAPPING FUNCTIONS to convert snake_case from DB to camelCase for the app
const mapClub = (c: any): Club => ({ id: c.id, name: c.name, logoUrl: c.logo_url });
const mapTeam = (t: any): Team => ({ id: t.id, name: t.name, shortName: t.short_name, logoUrl: t.logo_url, division: t.division, clubId: t.club_id });
const mapPlayer = (p: any): Player => ({ id: p.id, name: p.name, teamId: p.team_id, clubId: p.club_id, photoUrl: p.photo_url, role: p.role, stats: p.stats || { matches: 0, aces: 0, kills: 0, blocks: 0 } });
const mapSponsor = (s: any): Sponsor => ({ id: s.id, name: s.name, website: s.website, logoUrl: s.logo_url, showInFooter: s.show_in_footer || false });
const mapTournament = (t: any): Omit<Tournament, 'phase'> => ({ id: t.id, name: t.name, division: t.division });
const mapNotice = (n: any): Notice => ({ id: n.id, title: n.title, message: n.message, level: n.level, expiresAt: n.expires_at, createdAt: n.created_at });
const mapFixture = (f: any): Fixture => {
    let stage: Fixture['stage'] | undefined = undefined;
    let actualReferee = f.referee;
    if (f.referee && typeof f.referee === 'string' && f.referee.startsWith('KO_')) {
        const parts = f.referee.split(':');
        const stagePart = parts[0];
        actualReferee = parts.slice(1).join(':').trim() || undefined;
        if (stagePart === 'KO_QF') stage = 'quarter-final';
        else if (stagePart === 'KO_SF') stage = 'semi-final';
        else if (stagePart === 'KO_FINAL') stage = 'final';
    }
    return { 
        id: f.id, 
        tournamentId: f.tournament_id, 
        team1Id: f.team1_id, 
        team2Id: f.team2_id, 
        ground: f.ground, 
        dateTime: f.date_time, 
        status: f.status, 
        referee: actualReferee, 
        score: f.score as Score | undefined, 
        stage: stage,
        manOfTheMatchId: f.man_of_the_match_id 
    };
};
const mapPlayerTransfer = (pt: DbPlayerTransfer): PlayerTransfer => ({ id: pt.id, playerId: pt.player_id, fromTeamId: pt.from_team_id, toTeamId: pt.to_team_id, transferDate: pt.transfer_date, notes: pt.notes, isAutomated: pt.is_automated });
const mapTournamentRoster = (tr: DbTournamentRoster): TournamentRoster => ({ id: tr.id, tournamentId: tr.tournament_id, teamId: tr.team_id, playerId: tr.player_id });
const mapTournamentTeam = (tt: DbTournamentTeam): TournamentTeam => ({ tournamentId: tt.tournament_id, teamId: tt.team_id });

const uploadAsset = async (supabase: SupabaseClient, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('assets').upload(fileName, file);
    if (error) throw new Error(`Failed to upload asset: ${error.message}`);
    const { data } = supabase.storage.from('assets').getPublicUrl(fileName);
    return data.publicUrl;
};

export const SportsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
    const [state, setState] = useState<SportsState>({
        tournaments: null, clubs: null, teams: null, players: null, fixtures: null, sponsors: null, tournamentSponsors: null, playerTransfers: null, notices: null, rules: null, tournamentRosters: null, tournamentTeams: null,
        loading: new Set(),
        error: null,
    });

    const fetchData = useCallback(async <T extends EntityName>(entityName: T): Promise<SportsState[T]> => {
        if (state[entityName] !== null) {
            return state[entityName] as SportsState[T];
        }

        // Prevent duplicate requests for the same entity if already loading
        if (state.loading.has(entityName)) {
            return state[entityName] as SportsState[T];
        }

        setState(s => ({ ...s, loading: new Set(s.loading).add(entityName) }));

        try {
            let data: any;
            let error: any;

            switch (entityName) {
                case 'tournaments': ({ data, error } = await supabase.from('tournaments').select('*').order('name')); break;
                case 'clubs': ({ data, error } = await supabase.from('clubs').select('*').order('name')); break;
                case 'teams': ({ data, error } = await supabase.from('teams').select('*').order('name')); break;
                case 'players': ({ data, error } = await supabase.from('players').select('*').order('name')); break;
                case 'fixtures': ({ data, error } = await supabase.from('fixtures').select('*')); break;
                case 'sponsors': ({ data, error } = await supabase.from('sponsors').select('*').order('name')); break;
                case 'tournamentSponsors': ({ data, error } = await supabase.from('tournament_sponsors').select('*')); break;
                case 'playerTransfers': ({ data, error } = await supabase.from('player_transfers').select('*')); break;
                case 'notices': ({ data, error } = await supabase.from('notices').select('*')); break;
                case 'rules': ({ data, error } = await supabase.from('game_rules').select('content').limit(1).maybeSingle()); break;
                case 'tournamentRosters': ({ data, error } = await supabase.from('tournament_rosters').select('*')); break;
                case 'tournamentTeams': ({ data, error } = await supabase.from('tournament_teams').select('*')); break;
            }

            if (error) throw error;
            
            let processedData: any;
            if (entityName === 'fixtures') {
                 processedData = (data || []).map(mapFixture);
            } else if (entityName === 'tournaments') {
                const fixturesData = state.fixtures; 
                processedData = (data || []).map(mapTournament).map(t => {
                    if (!fixturesData) return { ...t, phase: 'round-robin' as const };
                    const knockoutFixtures = (fixturesData as Fixture[]).some(f => f.tournamentId === t.id && f.stage);
                    const finalFixture = (fixturesData as Fixture[]).find(f => f.tournamentId === t.id && f.stage === 'final');
                    let phase: Tournament['phase'] = 'round-robin';
                    if (finalFixture && finalFixture.status === 'completed') phase = 'completed';
                    else if (knockoutFixtures) phase = 'knockout';
                    return { ...t, phase };
                });
            } else if (entityName === 'rules') {
                processedData = data?.content || 'The official game rules have not been set yet. An admin can add them from the Rules page.';
            } else {
                const mapFn = { 
                    clubs: mapClub, 
                    teams: mapTeam, 
                    players: mapPlayer, 
                    sponsors: mapSponsor, 
                    notices: mapNotice, 
                    playerTransfers: mapPlayerTransfer, 
                    tournamentSponsors: (d: any) => d,
                    tournamentRosters: mapTournamentRoster,
                    tournamentTeams: mapTournamentTeam
                }[entityName as 'clubs' | 'teams' | 'players' | 'sponsors' | 'notices' | 'playerTransfers' | 'tournamentSponsors' | 'tournamentRosters' | 'tournamentTeams'];
                processedData = (data || []).map(mapFn);
            }
            
            setState(s => {
                const newLoading = new Set(s.loading);
                newLoading.delete(entityName);
                return { ...s, [entityName]: processedData, loading: newLoading, error: null };
            });
            return processedData;

        } catch (error: any) {
            console.error(`Error fetching ${entityName}:`, error);
            setState(s => {
                const newLoading = new Set(s.loading);
                newLoading.delete(entityName);
                return { ...s, loading: newLoading, error };
            });
            throw error;
        }
    }, [supabase, state]);

    const prefetchAllData = useCallback(async () => {
        try {
            // Batch 1: Core Data (Split to avoid connection limits)
            const [
                { data: tournaments, error: errTournaments },
                { data: fixtures, error: errFixtures },
                { data: teams, error: errTeams },
                { data: players, error: errPlayers },
            ] = await Promise.all([
                supabase.from('tournaments').select('*').order('name'),
                supabase.from('fixtures').select('*'),
                supabase.from('teams').select('*').order('name'),
                supabase.from('players').select('*').order('name'),
            ]);

            if (errTournaments) throw errTournaments;
            if (errFixtures) throw errFixtures;
            if (errTeams) throw errTeams;
            if (errPlayers) throw errPlayers;

            // Batch 2: Secondary Data
            const [
                { data: clubs, error: errClubs },
                { data: sponsors, error: errSponsors },
                { data: tournamentSponsors, error: errTS },
                { data: playerTransfers, error: errPT },
                { data: notices, error: errNotices },
                { data: rules, error: errRules },
                { data: tournamentRosters, error: errTR },
                { data: tournamentTeams, error: errTT }
            ] = await Promise.all([
                supabase.from('clubs').select('*').order('name'),
                supabase.from('sponsors').select('*').order('name'),
                supabase.from('tournament_sponsors').select('*'),
                supabase.from('player_transfers').select('*'),
                supabase.from('notices').select('*'),
                supabase.from('game_rules').select('content').limit(1).maybeSingle(),
                supabase.from('tournament_rosters').select('*'),
                supabase.from('tournament_teams').select('*')
            ]);
            
            // Note: We don't throw on secondary data errors to allow app to partially load
            if (errClubs) console.error("Error fetching clubs:", errClubs);

            // Process Fixtures First
            const processedFixtures = (fixtures || []).map(mapFixture);
            
            // Process Tournaments with phase logic
            const processedTournaments = (tournaments || []).map(mapTournament).map(t => {
                const knockoutFixtures = processedFixtures.some(f => f.tournamentId === t.id && f.stage);
                const finalFixture = processedFixtures.find(f => f.tournamentId === t.id && f.stage === 'final');
                let phase: Tournament['phase'] = 'round-robin';
                if (finalFixture && finalFixture.status === 'completed') phase = 'completed';
                else if (knockoutFixtures) phase = 'knockout';
                return { ...t, phase };
            });

            const processedRules = rules?.content || 'The official game rules have not been set yet. An admin can add them from the Rules page.';

            setState(s => ({
                ...s,
                tournaments: processedTournaments,
                fixtures: processedFixtures,
                teams: (teams || []).map(mapTeam),
                players: (players || []).map(mapPlayer),
                clubs: (clubs || []).map(mapClub),
                sponsors: (sponsors || []).map(mapSponsor),
                tournamentSponsors: tournamentSponsors || [],
                playerTransfers: (playerTransfers || []).map(mapPlayerTransfer),
                notices: (notices || []).map(mapNotice),
                rules: processedRules,
                tournamentRosters: (tournamentRosters || []).map(mapTournamentRoster),
                tournamentTeams: (tournamentTeams || []).map(mapTournamentTeam),
                loading: new Set(),
                error: null
            }));

        } catch (error: any) {
            console.error("Error during prefetch:", error);
            setState(s => ({ ...s, error }));
        }
    }, [supabase]);


    const addTournament = useCallback(async (tournament: Omit<Tournament, 'id'>) => {
        const { phase, ...dbTournament } = tournament;
        const { data, error } = await supabase.from('tournaments').insert(dbTournament).select().single();
        if (error) throw error;
        const newTournament = { ...mapTournament(data), phase: 'round-robin' as const };
        setState(s => ({...s, tournaments: [...(s.tournaments || []), newTournament].sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase]);
    
    const updateTournament = useCallback(async (tournament: Tournament) => {
        const { id, phase, ...rest } = tournament;
        const dbTournament = { name: rest.name, division: rest.division };
        const { data, error } = await supabase.from('tournaments').update(dbTournament).eq('id', id).select().single();
        if (error) throw error;
        const updatedTournament = { ...mapTournament(data), phase: tournament.phase };
        setState(s => ({...s, tournaments: (s.tournaments || []).map(t => t.id === id ? updatedTournament : t) }));
    }, [supabase]);

    const deleteTournament = useCallback(async (id: number) => {
        const { error } = await supabase.from('tournaments').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, tournaments: (s.tournaments || []).filter(t => t.id !== id) }));
    }, [supabase]);

    const addClub = useCallback(async (clubData: Omit<Club, 'id'> & { logoFile?: File }) => {
        let finalLogoUrl = clubData.logoUrl;
        if (clubData.logoFile) finalLogoUrl = await uploadAsset(supabase, clubData.logoFile);
        const { data, error } = await supabase.from('clubs').insert({ name: clubData.name, logo_url: finalLogoUrl }).select().single();
        if (error) throw error;
        setState(s => ({...s, clubs: [...(s.clubs || []), mapClub(data)].sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase]);

    const updateClub = useCallback(async (clubData: Club & { logoFile?: File }) => {
        let finalLogoUrl = clubData.logoUrl;
        if (clubData.logoFile) finalLogoUrl = await uploadAsset(supabase, clubData.logoFile);
        const { id, name, logoUrl } = clubData;
        const { data, error } = await supabase.from('clubs').update({ name: clubData.name, logo_url: finalLogoUrl }).eq('id', clubData.id).select().single();
        if (error) throw error;
        setState(s => ({...s, clubs: (s.clubs || []).map(c => c.id === clubData.id ? mapClub(data) : c) }));
    }, [supabase]);

    const deleteClub = useCallback(async (id: number) => {
         const { error } = await supabase.from('clubs').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, clubs: (s.clubs || []).filter(c => c.id !== id) }));
    }, [supabase]);
    
    const addTeam = useCallback(async (teamData: Omit<Team, 'id'> & { logoFile?: File }) => {
        let finalLogoUrl = teamData.logoUrl;
        if (teamData.logoFile) finalLogoUrl = await uploadAsset(supabase, teamData.logoFile);
        const { name, shortName, division, clubId } = teamData;
        const { data, error } = await supabase.from('teams').insert({ name, short_name: shortName, division, logo_url: finalLogoUrl, club_id: clubId }).select().single();
        if (error) throw error;
        setState(s => ({...s, teams: [...(s.teams || []), mapTeam(data)].sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase]);

    const updateTeam = useCallback(async (teamData: Team & { logoFile?: File }) => {
        let finalLogoUrl = teamData.logoUrl;
        if (teamData.logoFile) finalLogoUrl = await uploadAsset(supabase, teamData.logoFile);
        const { id, name, shortName, division, clubId } = teamData;
        const { data, error } = await supabase.from('teams').update({ name, short_name: shortName, division, logo_url: finalLogoUrl, club_id: clubId }).eq('id', id).select().single();
        if (error) throw error;
        setState(s => ({...s, teams: (s.teams || []).map(t => t.id === id ? mapTeam(data) : t) }));
    }, [supabase]);

    const deleteTeam = useCallback(async (id: number) => {
        const { error } = await supabase.from('teams').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, teams: (s.teams || []).filter(t => t.id !== id) }));
    }, [supabase]);

    const addPlayer = useCallback(async (playerData: Omit<Player, 'id'> & { photoFile?: File }) => {
        let finalPhotoUrl = playerData.photoUrl;
        if (playerData.photoFile) finalPhotoUrl = await uploadAsset(supabase, playerData.photoFile);
        const { name, teamId, clubId, role, stats } = playerData;
        const { data, error } = await supabase.from('players').insert({ name, team_id: teamId, club_id: clubId, role, stats, photo_url: finalPhotoUrl }).select().single();
        if (error) throw error;
        setState(s => ({...s, players: [...(s.players || []), mapPlayer(data)].sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase]);

    const updatePlayer = useCallback(async (playerData: Player & { photoFile?: File }) => {
        const originalPlayer = (state.players || []).find(p => p.id === playerData.id);
        let finalPhotoUrl = playerData.photoUrl;
        if (playerData.photoFile) finalPhotoUrl = await uploadAsset(supabase, playerData.photoFile);
        
        // Transfer Logic
        if (originalPlayer && originalPlayer.teamId !== playerData.teamId) {
            const newTransfer = { player_id: playerData.id, from_team_id: originalPlayer.teamId, to_team_id: playerData.teamId, transfer_date: new Date().toISOString().split('T')[0], is_automated: true, notes: 'Player details updated via admin panel.' };
            const { data: insertedTransfer, error: transferError } = await supabase.from('player_transfers').insert(newTransfer).select().single();
            if (transferError) throw transferError;
            if (insertedTransfer) setState(s => ({ ...s, playerTransfers: [...(s.playerTransfers || []), mapPlayerTransfer(insertedTransfer)] }));
        }

        const { id, name, teamId, clubId, role, stats } = playerData;
        const { data, error } = await supabase.from('players').update({ name, team_id: teamId, club_id: clubId, role, stats, photo_url: finalPhotoUrl }).eq('id', id).select().single();
        if (error) throw error;
        setState(s => ({...s, players: (s.players || []).map(p => p.id === id ? mapPlayer(data) : p).sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase, state.players]);

    const deletePlayer = useCallback(async (id: number) => {
        const { error } = await supabase.from('players').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, players: (s.players || []).filter(p => p.id !== id) }));
    }, [supabase]);
    
    const deleteAllPlayers = useCallback(async () => {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 15000));
        const deleteOperation = async () => {
            const { error: transferError } = await supabase.from('player_transfers').delete().neq('id', -1);
            if (transferError) throw new Error(`Failed to delete transfers: ${transferError.message}`);
            const { error: playerError } = await supabase.from('players').delete().neq('id', -1);
            if (playerError) throw new Error(`Failed to delete players: ${playerError.message}`);
            return true;
        };
        await Promise.race([deleteOperation(), timeout]);
        setState(s => ({ ...s, players: [], playerTransfers: [] }));
    }, [supabase]);

    const addFixture = useCallback(async (fixture: Omit<Fixture, 'id' | 'score'>) => {
        const { stage, referee, manOfTheMatchId, ...rest } = fixture;
        let dbReferee = referee;
        if (stage) {
            const prefix = stage === 'quarter-final' ? 'KO_QF' : stage === 'semi-final' ? 'KO_SF' : 'KO_FINAL';
            dbReferee = referee ? `${prefix}: ${referee}` : prefix;
        }
        const { data, error } = await supabase.from('fixtures').insert({ 
            tournament_id: rest.tournamentId, 
            team1_id: rest.team1Id, 
            team2_id: rest.team2Id, 
            ground: rest.ground, 
            date_time: rest.dateTime, 
            status: rest.status, 
            referee: dbReferee,
            man_of_the_match_id: manOfTheMatchId
        }).select().single();
        if (error) throw error;
        setState(s => ({...s, fixtures: [...(s.fixtures || []), mapFixture(data)] }));
    }, [supabase]);

    const updateFixture = useCallback(async (fixture: Fixture) => {
        const { stage, referee, manOfTheMatchId, ...rest } = fixture;
        let dbReferee = referee;
        if (stage) {
            const prefix = stage === 'quarter-final' ? 'KO_QF' : stage === 'semi-final' ? 'KO_SF' : 'KO_FINAL';
            dbReferee = referee ? `${prefix}: ${referee}` : prefix;
        }
        const { data, error } = await supabase.from('fixtures').update({ 
            tournament_id: rest.tournamentId, 
            team1_id: rest.team1Id, 
            team2_id: rest.team2Id, 
            ground: rest.ground, 
            date_time: rest.dateTime, 
            status: rest.status, 
            score: rest.score, 
            referee: dbReferee,
            man_of_the_match_id: manOfTheMatchId
        }).eq('id', fixture.id).select().single();
        if (error) throw error;
        setState(s => ({...s, fixtures: (s.fixtures || []).map(f => f.id === fixture.id ? mapFixture(data) : f) }));
    }, [supabase]);

    const deleteFixture = useCallback(async (id: number) => {
        const { error } = await supabase.from('fixtures').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, fixtures: (s.fixtures || []).filter(f => f.id !== id) }));
    }, [supabase]);

    const bulkAddFixtures = useCallback(async (fixturesData: Omit<Fixture, 'id' | 'score'>[]) => {
        const fixturesToInsert = fixturesData.map(f => {
            const { stage, referee, manOfTheMatchId, ...rest } = f;
            let dbReferee = referee;
            if (stage) {
                const prefix = stage === 'quarter-final' ? 'KO_QF' : stage === 'semi-final' ? 'KO_SF' : 'KO_FINAL';
                dbReferee = referee ? `${prefix}: ${referee}` : prefix;
            }
            return {
                tournament_id: rest.tournamentId,
                team1_id: rest.team1Id,
                team2_id: rest.team2Id,
                ground: rest.ground,
                date_time: rest.dateTime,
                status: rest.status,
                referee: dbReferee,
                man_of_the_match_id: manOfTheMatchId
            };
        });

        const { data, error } = await supabase.from('fixtures').insert(fixturesToInsert).select();
        if (error) throw error;
        
        const newFixtures = (data || []).map(mapFixture);
        
        setState(s => ({
            ...s, 
            fixtures: [...(s.fixtures || []), ...newFixtures].sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
        }));
    }, [supabase]);

    const addSponsor = useCallback(async (sponsorData: Omit<Sponsor, 'id'> & { logoFile?: File }) => {
        let finalLogoUrl = sponsorData.logoUrl;
        if (sponsorData.logoFile) finalLogoUrl = await uploadAsset(supabase, sponsorData.logoFile);
        const { name, website, showInFooter } = sponsorData;
        const { data, error } = await supabase.from('sponsors').insert({ name, website, logo_url: finalLogoUrl, show_in_footer: showInFooter || false }).select().single();
        if (error) throw error;
        setState(s => ({...s, sponsors: [...(s.sponsors || []), mapSponsor(data)].sort((a,b) => a.name.localeCompare(b.name)) }));
    }, [supabase]);

    const updateSponsor = useCallback(async (sponsorData: Sponsor & { logoFile?: File }) => {
        let finalLogoUrl = sponsorData.logoUrl;
        if (sponsorData.logoFile) finalLogoUrl = await uploadAsset(supabase, sponsorData.logoFile);
        const { id, name, website, showInFooter } = sponsorData;
        const { data, error } = await supabase.from('sponsors').update({ name, website, logo_url: finalLogoUrl, show_in_footer: showInFooter }).eq('id', id).select().single();
        if (error) throw error;
        setState(s => ({...s, sponsors: (s.sponsors || []).map(sp => sp.id === id ? mapSponsor(data) : sp) }));
    }, [supabase]);

    const deleteSponsor = useCallback(async (id: number) => {
        const { error } = await supabase.from('sponsors').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, sponsors: (s.sponsors || []).filter(sp => sp.id !== id) }));
    }, [supabase]);

    const toggleSponsorShowInFooter = useCallback(async (sponsor: Sponsor) => {
        const { data, error } = await supabase.from('sponsors').update({ show_in_footer: !sponsor.showInFooter }).eq('id', sponsor.id).select().single();
        if (error) throw error;
        setState(s => ({...s, sponsors: (s.sponsors || []).map(sp => sp.id === sponsor.id ? mapSponsor(data) : sp) }));
    }, [supabase]);
    
    const addPlayerTransfer = useCallback(async (transfer: Omit<PlayerTransfer, 'id' | 'isAutomated'>) => {
        const { data: transferData, error: transferError } = await supabase
            .from('player_transfers')
            .insert({ 
                player_id: transfer.playerId, 
                from_team_id: transfer.fromTeamId, 
                to_team_id: transfer.toTeamId, 
                transfer_date: transfer.transferDate, 
                notes: transfer.notes, 
                is_automated: false 
            })
            .select()
            .single();
        
        if (transferError) throw transferError;

        let newClubId: number | null = null;
        if (transfer.toTeamId) {
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('club_id')
                .eq('id', transfer.toTeamId)
                .single();
            
            if (teamError) throw teamError;
            newClubId = teamData.club_id;
        }
        
        const { data: playerData, error: playerError } = await supabase
            .from('players')
            .update({ 
                team_id: transfer.toTeamId,
                club_id: newClubId 
            })
            .eq('id', transfer.playerId)
            .select()
            .single();
            
        if (playerError) throw playerError;

        setState(s => ({
            ...s, 
            playerTransfers: [...(s.playerTransfers || []), mapPlayerTransfer(transferData)],
            players: (s.players || []).map(p => 
                p.id === transfer.playerId ? mapPlayer(playerData) : p
            ).sort((a,b) => a.name.localeCompare(b.name))
        }));
    }, [supabase]);

    const updatePlayerTransfer = useCallback(async (transfer: PlayerTransfer) => {
        const { data, error } = await supabase.from('player_transfers').update({ player_id: transfer.playerId, from_team_id: transfer.fromTeamId, to_team_id: transfer.toTeamId, transfer_date: transfer.transferDate, notes: transfer.notes }).eq('id', transfer.id).select().single();
        if (error) throw error;
        setState(s => ({...s, playerTransfers: (s.playerTransfers || []).map(t => t.id === transfer.id ? mapPlayerTransfer(data) : t)}));
    }, [supabase]);

    const deletePlayerTransfer = useCallback(async (id: number) => {
        const { error } = await supabase.from('player_transfers').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, playerTransfers: (s.playerTransfers || []).filter(t => t.id !== id)}));
    }, [supabase]);
    
    const addNotice = useCallback(async (notice: Omit<Notice, 'id' | 'createdAt'>) => {
        const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('The request timed out. This may be due to a missing or misconfigured Row Level Security (RLS) policy on the "notices" table.')), 10000));
        const dbOperation = supabase.from('notices').insert({ title: notice.title, message: notice.message, level: notice.level, expires_at: notice.expiresAt }).select().single();
        const { data, error } = await Promise.race([dbOperation, timeoutPromise]);
        if (error) throw error;
        setState(s => ({...s, notices: [...(s.notices || []), mapNotice(data)]}));
    }, [supabase]);

    const deleteNotice = useCallback(async (id: number) => {
        const { error } = await supabase.from('notices').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, notices: (s.notices || []).filter(n => n.id !== id)}));
    }, [supabase]);

    const updateRules = useCallback(async (content: string) => {
        const { error } = await supabase.from('game_rules').update({ content, updated_at: new Date().toISOString() }).eq('id', 1);
        if (error) {
            if (error.code === 'PGRST204') { 
               const { error: insertError } = await supabase.from('game_rules').insert({ id: 1, content });
               if (insertError) throw insertError;
            } else throw error;
        }
        setState(s => ({ ...s, rules: content }));
    }, [supabase]);
    
    const bulkAddOrUpdateTeams = useCallback(async (teamsData: CsvTeam[]) => {
        const currentClubs = await fetchData('clubs');
        
        const clubNameMap = new Map<string, number>();
        (currentClubs || []).forEach(club => {
             clubNameMap.set(club.name.trim().toLowerCase(), club.id);
        });
        
        const teamsToUpsert = teamsData.map(t => {
            const cleanClubName = t.clubName.trim().toLowerCase();
            const clubId = clubNameMap.get(cleanClubName);
            
            if (!clubId) throw new Error(`Club "${t.clubName}" not found for team "${t.name}".`);
            return { name: t.name, short_name: t.shortName, division: t.division, logo_url: t.logoUrl, club_id: clubId };
        });
        
        const { error } = await supabase.from('teams').upsert(teamsToUpsert, { onConflict: 'name' });
        if (error) throw error;
        await fetchData('teams');
    }, [supabase, fetchData]);

    const bulkAddOrUpdatePlayers = useCallback(async (playersData: CsvPlayer[]) => {
        const normalize = (s: string) => s ? s.trim().toLowerCase() : '';

        const uniqueCsvClubs = new Set<string>();
        const uniqueCsvTeams = new Map<string, string>(); 

        playersData.forEach(p => {
            if (p.clubName) uniqueCsvClubs.add(p.clubName.trim());
            if (p.teamName && p.clubName) uniqueCsvTeams.set(p.teamName.trim(), p.clubName.trim());
        });

        let { data: existingClubs, error: clubsError } = await supabase.from('clubs').select('*');
        if (clubsError) throw new Error(`Failed to fetch clubs: ${clubsError.message}`);
        
        let clubMap = new Map<string, Club>();
        (existingClubs || []).forEach((c: any) => clubMap.set(normalize(c.name), mapClub(c)));

        const newClubsToInsert: any[] = [];
        uniqueCsvClubs.forEach(csvClubName => {
            if (!clubMap.has(normalize(csvClubName))) {
                newClubsToInsert.push({ name: csvClubName, logo_url: '' });
            }
        });

        if (newClubsToInsert.length > 0) {
            const { error } = await supabase.from('clubs').insert(newClubsToInsert);
            if (error) throw new Error(`Failed to create missing clubs: ${error.message}`);
            
            const { data: refreshedClubs, error: refreshError } = await supabase.from('clubs').select('*');
            if (refreshError) throw refreshError;
            
            clubMap = new Map();
            (refreshedClubs || []).forEach((c: any) => clubMap.set(normalize(c.name), mapClub(c)));
        }

        let { data: existingTeams, error: teamsError } = await supabase.from('teams').select('*');
        if (teamsError) throw new Error(`Failed to fetch teams: ${teamsError.message}`);

        let teamMap = new Map<string, Team>();
        (existingTeams || []).forEach((t: any) => teamMap.set(normalize(t.name), mapTeam(t)));

        const newTeamsToInsert: any[] = [];
        uniqueCsvTeams.forEach((csvClubName, csvTeamName) => {
             if (!teamMap.has(normalize(csvTeamName))) {
                 const club = clubMap.get(normalize(csvClubName));
                 if (club) {
                     newTeamsToInsert.push({
                         name: csvTeamName,
                         short_name: csvTeamName.substring(0, 3).toUpperCase(),
                         division: 'Division 1',
                         club_id: club.id,
                         logo_url: ''
                     });
                 }
             }
        });

        if (newTeamsToInsert.length > 0) {
            const { error } = await supabase.from('teams').insert(newTeamsToInsert);
             if (error) throw new Error(`Failed to create missing teams: ${error.message}`);
             
             const { data: refreshedTeams, error: refreshTeamsError } = await supabase.from('teams').select('*');
             if (refreshTeamsError) throw refreshTeamsError;
             
             teamMap = new Map();
             (refreshedTeams || []).forEach((t: any) => teamMap.set(normalize(t.name), mapTeam(t)));
        }

        const playersToUpsert = playersData.map(p => {
            const pTeamName = normalize(p.teamName || '');
            const pClubName = normalize(p.clubName || '');

            let teamId: number | null = null;
            let clubId: number | null = null;

            if (pTeamName && teamMap.has(pTeamName)) {
                const team = teamMap.get(pTeamName)!;
                teamId = team.id;
                clubId = team.clubId;
            } else if (pClubName && clubMap.has(pClubName)) {
                const club = clubMap.get(pClubName)!;
                clubId = club.id;
            }

            if (!teamId && !clubId) {
                 throw new Error(`Could not resolve Club "${p.clubName}" or Team "${p.teamName}" for player "${p.name}" even after attempting creation.`);
            }

            return { 
                name: p.name, 
                role: p.role, 
                photo_url: p.photoUrl, 
                team_id: teamId, 
                club_id: clubId,
                stats: { 
                    matches: parseInt(p.matches || '0', 10), 
                    aces: parseInt(p.aces || '0', 10), 
                    kills: parseInt(p.kills || '0', 10), 
                    blocks: parseInt(p.blocks || '0', 10) 
                } 
            };
        });
        
        const { error } = await supabase.from('players').upsert(playersToUpsert, { onConflict: 'name,team_id' });
        if (error) throw error;
        
        setState(s => ({ ...s, clubs: null, teams: null, players: null }));
        await Promise.all([fetchData('clubs'), fetchData('teams'), fetchData('players')]);

    }, [supabase, fetchData]);
    
    const updateSponsorsForTournament = useCallback(async (tournamentId: number, sponsorIds: number[]) => {
        const { error: deleteError } = await supabase.from('tournament_sponsors').delete().eq('tournament_id', tournamentId);
        if (deleteError) throw deleteError;
        if (sponsorIds.length > 0) {
            const newLinks = sponsorIds.map(sponsor_id => ({ tournament_id: tournamentId, sponsor_id }));
            const { error: insertError } = await supabase.from('tournament_sponsors').insert(newLinks);
            if (insertError) throw insertError;
        }
        const { data, error } = await supabase.from('tournament_sponsors').select('*');
        if (error) throw error;
        setState(s => ({ ...s, tournamentSponsors: (data || []) as TournamentSponsor[] }));
    }, [supabase]);

    const bulkUpdatePlayerTeam = useCallback(async (playerIds: number[], teamId: number | null) => {
        const playersToUpdate = (state.players || []).filter(p => playerIds.includes(p.id));
        const newTransfers = playersToUpdate.filter(p => p.teamId !== teamId).map(p => ({ player_id: p.id, from_team_id: p.teamId, to_team_id: teamId, transfer_date: new Date().toISOString(), is_automated: true, notes: 'Automated roster change via admin panel.' }));
        if (newTransfers.length > 0) {
            const { data: insertedTransfers, error: transferError } = await supabase.from('player_transfers').insert(newTransfers).select();
            if (transferError) throw transferError;
            if (insertedTransfers) {
                 const typedTransfers = insertedTransfers as unknown as DbPlayerTransfer[];
                 setState(s => ({ ...s, playerTransfers: [...(s.playerTransfers || []), ...typedTransfers.map(mapPlayerTransfer)] }));
            }
        }
        const { data: updatedPlayers, error } = await supabase.from('players').update({ team_id: teamId }).in('id', playerIds).select();
        if (error) throw error;
        if (updatedPlayers) {
            const typedUpdatedPlayers = updatedPlayers as any[];
            const updatedPlayerMap = new Map<number, Player>(typedUpdatedPlayers.map(p => [p.id, mapPlayer(p)]));
            setState(s => {
                const newPlayers: Player[] = (s.players || []).map(p => updatedPlayerMap.get(p.id) || p);
                return { ...s, players: newPlayers.sort((a,b) => a.name.localeCompare(b.name)) };
            });
        }
    }, [supabase, state.players]);
    
    const updateTournamentTeams = useCallback(async (tournamentId: number, teamIds: number[]) => {
        const { error: deleteError } = await supabase.from('tournament_teams').delete().eq('tournament_id', tournamentId);
        if (deleteError) throw deleteError;
        if (teamIds.length > 0) {
            const toInsert = teamIds.map(tid => ({ tournament_id: tournamentId, team_id: tid }));
            const { error: insertError } = await supabase.from('tournament_teams').insert(toInsert);
            if (insertError) throw insertError;
        }
        const { data, error } = await supabase.from('tournament_teams').select('*');
        if (error) throw error;
        setState(s => ({ ...s, tournamentTeams: (data || []).map(mapTournamentTeam) }));
    }, [supabase]);


    const getStandingsForTournament = useCallback((tournamentId: number): TeamStanding[] => {
        const tournamentFixtures = (state.fixtures || []).filter(f => f.tournamentId === tournamentId && f.status === 'completed' && f.score && f.score.sets?.length > 0 && !f.stage);
        const teamIdsInTournament = new Set<number>();

        if (state.tournamentTeams) {
             state.tournamentTeams
                .filter(tt => tt.tournamentId === tournamentId)
                .forEach(tt => teamIdsInTournament.add(tt.teamId));
        }
        
        (state.teams || []).forEach(team => {
            if (teamIdsInTournament.has(team.id)) return;
            const teamFixtures = (state.fixtures || []).filter(f => f.tournamentId === tournamentId && (f.team1Id === team.id || f.team2Id === team.id) && !f.stage);
            if (teamFixtures.length > 0) teamIdsInTournament.add(team.id);
        });

        const standingsMap = new Map<number, TeamStanding>();
        teamIdsInTournament.forEach(id => {
            const team = (state.teams || []).find(t => t.id === id);
            if (team) standingsMap.set(id, { teamId: id, teamName: team.name, logoUrl: team.logoUrl, gamesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 });
        });

        tournamentFixtures.forEach(fixture => {
            const team1Standing = standingsMap.get(fixture.team1Id);
            const team2Standing = standingsMap.get(fixture.team2Id);
            if (team1Standing && team2Standing) {
                team1Standing.gamesPlayed++; team2Standing.gamesPlayed++;
                const team1TotalPoints = fixture.score!.sets.reduce((sum, set) => sum + set.team1Points, 0);
                const team2TotalPoints = fixture.score!.sets.reduce((sum, set) => sum + set.team2Points, 0);
                team1Standing.goalsFor += team1TotalPoints; team1Standing.goalsAgainst += team2TotalPoints;
                team2Standing.goalsFor += team2TotalPoints; team2Standing.goalsAgainst += team1TotalPoints;
                if (fixture.score!.team1Score > fixture.score!.team2Score) { team1Standing.wins++; team2Standing.losses++; team1Standing.points += 3; }
                else if (fixture.score!.team2Score > fixture.score!.team1Score) { team2Standing.wins++; team1Standing.losses++; team2Standing.points += 3; }
                else { team1Standing.draws++; team2Standing.draws++; team1Standing.points += 1; team2Standing.points += 1; }
            }
        });
        const standings = Array.from(standingsMap.values());
        standings.forEach(s => s.goalDifference = s.goalsFor - s.goalsAgainst);
        standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            return a.teamName.localeCompare(b.teamName);
        });
        return standings;
    }, [state.fixtures, state.teams, state.tournamentTeams]);

     const concludeLeaguePhase = useCallback(async (tournamentId: number) => {
        const tournament = (state.tournaments || []).find(t => t.id === tournamentId);
        if (!tournament || tournament.phase !== 'round-robin') throw new Error('Tournament is not in the correct phase.');
        const standings = getStandingsForTournament(tournamentId);
        const newFixtures: Omit<Fixture, 'id' | 'score'>[] = [];
        const now = new Date().toISOString();
        if (tournament.division === 'Division 1') {
            if (standings.length < 8) throw new Error('Not enough teams with completed matches (requires 8).');
            const top8 = standings.slice(0, 8);
            [{ t1: 0, t2: 7 }, { t1: 3, t2: 4 }, { t1: 1, t2: 6 }, { t1: 2, t2: 5 }].forEach(m => newFixtures.push({ tournamentId, team1Id: top8[m.t1].teamId, team2Id: top8[m.t2].teamId, ground: 'TBD', dateTime: now, status: 'upcoming', stage: 'quarter-final' }));
        } else if (tournament.division === 'Division 2') {
            if (standings.length < 4) throw new Error('Not enough teams with completed matches (requires 4).');
            const top4 = standings.slice(0, 4);
            [{ t1: 0, t2: 3 }, { t1: 1, t2: 2 }].forEach(m => newFixtures.push({ tournamentId, team1Id: top4[m.t1].teamId, team2Id: top4[m.t2].teamId, ground: 'TBD', dateTime: now, status: 'upcoming', stage: 'semi-final' }));
        }
        if (newFixtures.length > 0) {
            const fixturesToInsert = newFixtures.map(f => ({ 
                tournament_id: f.tournamentId, 
                team1_id: f.team1Id, 
                team2_id: f.team2Id, 
                ground: f.ground, 
                date_time: f.dateTime, 
                status: f.status, 
                referee: f.stage === 'quarter-final' ? 'KO_QF' : 'KO_SF' 
            }));
            const { error: insertError } = await supabase.from('fixtures').insert(fixturesToInsert);
            if (insertError) throw insertError;
        }
        await fetchData('fixtures');
        await fetchData('tournaments');
    }, [supabase, state.tournaments, getStandingsForTournament, fetchData]);

    const updateTournamentSquad = useCallback(async (tournamentId: number, teamId: number, playerIds: number[]) => {
        const { error: deleteError } = await supabase
            .from('tournament_rosters')
            .delete()
            .match({ tournament_id: tournamentId, team_id: teamId });
        if (deleteError) throw deleteError;

        if (playerIds.length > 0) {
            const toInsert = playerIds.map(pid => ({
                tournament_id: tournamentId,
                team_id: teamId,
                player_id: pid
            }));
            const { error: insertError } = await supabase.from('tournament_rosters').insert(toInsert);
            if (insertError) throw insertError;
        }

        const { data, error } = await supabase.from('tournament_rosters').select('*');
        if (error) throw error;
        setState(s => ({ ...s, tournamentRosters: (data || []).map(mapTournamentRoster) }));

    }, [supabase]);

    const getTournamentSquad = useCallback((tournamentId: number, teamId: number): Player[] => {
        if (!state.tournamentRosters) return [];
        const rosterPlayerIds = state.tournamentRosters
            .filter(tr => tr.tournamentId === tournamentId && tr.teamId === teamId)
            .map(tr => tr.playerId);
        return (state.players || []).filter(p => rosterPlayerIds.includes(p.id));
    }, [state.tournamentRosters, state.players]);


    const getActiveNotice = useCallback((): Notice | null => {
        if (!state.notices) return null;
        const now = new Date();
        const activeNotices = state.notices.filter(n => new Date(n.expiresAt) > now).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return activeNotices[0] || null;
    }, [state.notices]);

    const getSponsorsForTournament = useCallback((tournamentId: number): Sponsor[] => {
        const sponsorIds = (state.tournamentSponsors || []).filter(ts => ts.tournament_id === tournamentId).map(ts => ts.sponsor_id);
        return (state.sponsors || []).filter(s => sponsorIds.includes(s.id));
    }, [state.tournamentSponsors, state.sponsors]);

    const getTournamentsByDivision = useCallback((division: 'Division 1' | 'Division 2') => (state.tournaments || []).filter(t => t.division === division), [state.tournaments]);
    const getFixturesByTournament = useCallback((tournamentId: number) => (state.fixtures || []).filter(f => f.tournamentId === tournamentId).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()), [state.fixtures]);
    const getClubById = useCallback((clubId: number | null) => (state.clubs || []).find(c => c.id === clubId), [state.clubs]);
    const getTeamById = useCallback((teamId: number | null) => (state.teams || []).find(t => t.id === teamId), [state.teams]);
    const getTeamsByClub = useCallback((clubId: number) => (state.teams || []).filter(t => t.clubId === clubId), [state.teams]);
    const getPlayersByTeam = useCallback((teamId: number) => (state.players || []).filter(p => p.teamId === teamId), [state.players]);
    
    const getPlayersByClub = useCallback((clubId: number): Player[] => {
        return (state.players || []).filter(p => p.clubId === clubId).sort((a, b) => a.name.localeCompare(b.name));
    }, [state.players]);
    
    const getTransfersByPlayerId = useCallback((playerId: number) => (state.playerTransfers || []).filter(t => t.playerId === playerId).sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime()), [state.playerTransfers]);

    const contextValue = {
        ...state,
        _internal_state: state,
        tournaments: state.tournaments || [],
        clubs: state.clubs || [],
        teams: state.teams || [],
        players: state.players || [],
        fixtures: state.fixtures || [],
        sponsors: state.sponsors || [],
        tournamentSponsors: state.tournamentSponsors || [],
        playerTransfers: state.playerTransfers || [],
        notices: state.notices || [],
        rules: state.rules || '',
        tournamentRosters: state.tournamentRosters || [],
        tournamentTeams: state.tournamentTeams || [],
        fetchData,
        prefetchAllData,
        addTournament, updateTournament, deleteTournament,
        addClub, updateClub, deleteClub,
        addTeam, updateTeam, deleteTeam,
        addPlayer, updatePlayer, deletePlayer, deleteAllPlayers,
        addFixture, updateFixture, deleteFixture, bulkAddFixtures,
        addSponsor, updateSponsor, deleteSponsor, toggleSponsorShowInFooter,
        addPlayerTransfer, updatePlayerTransfer, deletePlayerTransfer,
        addNotice, deleteNotice,
        updateRules,
        bulkAddOrUpdateTeams, bulkAddOrUpdatePlayers,
        updateSponsorsForTournament, bulkUpdatePlayerTeam, concludeLeaguePhase,
        updateTournamentSquad, updateTournamentTeams,
        getActiveNotice, getSponsorsForTournament, getTournamentsByDivision,
        getFixturesByTournament, getClubById, getTeamById, getTeamsByClub,
        getPlayersByTeam, getPlayersByClub, getTransfersByPlayerId, getStandingsForTournament,
        getTournamentSquad
    };

    return (
        <SportsDataContext.Provider value={contextValue as SportsContextType}>
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

export const useEntityData = <T extends EntityName>(entityName: T) => {
    const { [entityName]: data, loading, fetchData } = useSports();
    
    useEffect(() => {
        fetchData(entityName).catch((err) => console.error(`Failed to fetch ${entityName}`, err));
    }, [entityName, fetchData]);

    return { 
        data: data as SportsState[T], 
        loading: loading.has(entityName) 
    };
};
