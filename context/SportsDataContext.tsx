
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { useSupabase } from './SupabaseContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbTournament, DbTeam, DbPlayer, DbFixture, DbSponsor, DbClub, DbPlayerTransfer, DbTournamentRoster, DbTournamentTeam, DbTournamentAward } from '../supabaseClient';
import type { Tournament, Team, Player, Fixture, Sponsor, TeamStanding, Score, TournamentSponsor, Club, PlayerTransfer, Notice, TournamentRoster, TournamentTeam, TournamentAward } from '../types';

type EntityName = 'tournaments' | 'clubs' | 'teams' | 'players' | 'fixtures' | 'sponsors' | 'tournamentSponsors' | 'playerTransfers' | 'notices' | 'rules' | 'tournamentRosters' | 'tournamentTeams' | 'tournamentAwards';

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
    tournamentAwards: TournamentAward[] | null;
    lastUpdated: Date | null;
    loading: Set<EntityName>;
    error: Error | null;
}

export type CsvTeam = Omit<Team, 'id' | 'clubId'> & { clubName: string };
export type CsvPlayer = Omit<Player, 'id' | 'teamId' | 'clubId' | 'stats'> & { teamName?: string; clubName?: string; matches?: string; aces?: string; kills?: string; blocks?: string; };


interface SportsContextType extends Omit<SportsState, 'tournaments' | 'clubs' | 'teams' | 'players' | 'fixtures' | 'sponsors' | 'tournamentSponsors' | 'playerTransfers' | 'notices' | 'rules' | 'tournamentRosters' | 'tournamentTeams' | 'tournamentAwards'> {
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
    tournamentAwards: TournamentAward[];
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
    addTournamentAward: (award: Omit<TournamentAward, 'id'> & { imageFile?: File }) => Promise<void>;
    deleteTournamentAward: (id: number) => Promise<void>;
    getActiveNotice: () => Notice | null;
    getSponsorsForTournament: (tournamentId: number) => Sponsor[];
    getTournamentsByDivision: (division: 'Division 1' | 'Division 2') => Tournament[];
    getFixturesByTournament: (tournamentId: number) => Fixture[];
    getClubById: (clubId: number | null) => Club | undefined;
    getTeamById: (teamId: number | null) => Team | undefined;
    getTeamsByClub: (clubId: number) => Team[];
    getPlayersByTeam: (teamId: number) => Player[];
    getPlayersByClub: (clubId: number) => Player[];
    getPlayerById: (playerId: number) => Player | undefined;
    getTransfersByPlayerId: (playerId: number) => PlayerTransfer[];
    getStandingsForTournament: (tournamentId: number) => TeamStanding[];
    getTournamentSquad: (tournamentId: number, teamId: number) => Player[];
    getAwardsByTournament: (tournamentId: number) => TournamentAward[];
    getAwardsByPlayerId: (playerId: number) => TournamentAward[];
}

const SportsDataContext = createContext<SportsContextType | undefined>(undefined);

// MAPPING FUNCTIONS to convert snake_case from DB to camelCase for the app
const mapClub = (c: any): Club => ({ id: c.id, name: c.name, logoUrl: c.logo_url });
const mapTeam = (t: any): Team => ({ id: t.id, name: t.name, shortName: t.short_name, logoUrl: t.logo_url, division: t.division, clubId: t.club_id });
const mapPlayer = (p: any): Player => ({ 
    id: p.id, 
    name: p.name, 
    teamId: p.team_id, 
    clubId: p.club_id, 
    photoUrl: p.photo_url, 
    role: p.role, 
    joinedAt: p.joined_at, // Map new field
    stats: p.stats || { matches: 0, aces: 0, kills: 0, blocks: 0 } 
});
const mapSponsor = (s: any): Sponsor => ({ id: s.id, name: s.name, website: s.website, logoUrl: s.logo_url, showInFooter: s.show_in_footer || false });
const mapTournament = (t: any): Tournament => ({ 
    id: t.id, 
    name: t.name, 
    division: t.division,
    phase: t.phase,
    showChampionBanner: t.show_champion_banner 
});
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
const mapPlayerTransfer = (pt: any): PlayerTransfer => ({ 
    id: pt.id, 
    playerId: pt.player_id, 
    fromTeamId: pt.from_team_id, 
    toTeamId: pt.to_team_id, 
    fromClubId: pt.from_club_id, // Map new field
    toClubId: pt.to_club_id,     // Map new field
    transferDate: pt.transfer_date, 
    notes: pt.notes, 
    isAutomated: pt.is_automated 
});
const mapTournamentRoster = (tr: DbTournamentRoster): TournamentRoster => ({ id: tr.id, tournamentId: tr.tournament_id, teamId: tr.team_id, playerId: tr.player_id });
const mapTournamentTeam = (tt: DbTournamentTeam): TournamentTeam => ({ tournamentId: tt.tournament_id, teamId: tt.team_id });
const mapTournamentAward = (ta: DbTournamentAward): TournamentAward => ({ id: ta.id, tournamentId: ta.tournament_id, awardName: ta.award_name, recipientName: ta.recipient_name, playerId: ta.player_id, imageUrl: ta.image_url });

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
        tournaments: null, clubs: null, teams: null, players: null, fixtures: null, sponsors: null, tournamentSponsors: null, playerTransfers: null, notices: null, rules: null, tournamentRosters: null, tournamentTeams: null, tournamentAwards: null,
        lastUpdated: null,
        loading: new Set(),
        error: null,
    });

    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const fetchData = useCallback(async <T extends EntityName>(entityName: T): Promise<SportsState[T]> => {
        const currentState = stateRef.current;

        if (currentState[entityName] !== null) {
            return currentState[entityName] as SportsState[T];
        }

        if (currentState.loading.has(entityName)) {
            return currentState[entityName] as SportsState[T];
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
                case 'tournamentAwards': ({ data, error } = await supabase.from('tournament_awards').select('*')); break;
            }

            if (error) throw error;
            
            let processedData: any;
            if (entityName === 'fixtures') {
                 processedData = (data || []).map(mapFixture);
            } else if (entityName === 'tournaments') {
                const fixturesData = stateRef.current.fixtures; 
                processedData = (data || []).map(mapTournament);
            } else if (entityName === 'clubs') processedData = (data || []).map(mapClub);
            else if (entityName === 'teams') processedData = (data || []).map(mapTeam);
            else if (entityName === 'players') processedData = (data || []).map(mapPlayer);
            else if (entityName === 'sponsors') processedData = (data || []).map(mapSponsor);
            else if (entityName === 'notices') processedData = (data || []).map(mapNotice);
            else if (entityName === 'playerTransfers') processedData = (data || []).map(mapPlayerTransfer);
            else if (entityName === 'tournamentRosters') processedData = (data || []).map(mapTournamentRoster);
            else if (entityName === 'tournamentTeams') processedData = (data || []).map(mapTournamentTeam);
            else if (entityName === 'tournamentAwards') processedData = (data || []).map(mapTournamentAward);
            else if (entityName === 'rules') processedData = data?.content || '';
            else processedData = data;

            setState(s => {
                const newLoading = new Set(s.loading);
                newLoading.delete(entityName);
                return { ...s, [entityName]: processedData, loading: newLoading, lastUpdated: new Date() };
            });
            return processedData;
        } catch (err: any) {
             setState(s => {
                const newLoading = new Set(s.loading);
                newLoading.delete(entityName);
                return { ...s, error: err, loading: newLoading };
            });
            console.error(`Error fetching ${entityName}:`, err);
            return null as any;
        }
    }, [supabase]);

    const prefetchAllData = useCallback(async () => {
        // Load independent data first
        await Promise.all(['tournaments', 'clubs', 'sponsors', 'notices', 'rules'].map(e => fetchData(e as EntityName)));
        // Load dependent data
        await Promise.all(['teams', 'fixtures', 'tournamentSponsors', 'tournamentTeams', 'tournamentAwards'].map(e => fetchData(e as EntityName)));
        // Load final data
        await Promise.all(['players', 'tournamentRosters', 'playerTransfers'].map(e => fetchData(e as EntityName)));
    }, [fetchData]);

    // CRUD Operations
    const addTournament = async (tournament: Omit<Tournament, 'id'>) => {
        const { error } = await supabase.from('tournaments').insert([{ 
            name: tournament.name, 
            division: tournament.division,
            phase: 'round-robin',
            show_champion_banner: tournament.showChampionBanner
        }]);
        if (error) throw error;
        // Invalidate cache
        setState(s => ({...s, tournaments: null}));
        await fetchData('tournaments');
    };

    const updateTournament = async (tournament: Tournament) => {
        const { error } = await supabase.from('tournaments').update({ 
            name: tournament.name, 
            division: tournament.division,
            phase: tournament.phase,
            show_champion_banner: tournament.showChampionBanner
        }).eq('id', tournament.id);
        if (error) throw error;
        setState(s => ({...s, tournaments: null}));
        await fetchData('tournaments');
    };

    const deleteTournament = async (id: number) => {
        const { error } = await supabase.from('tournaments').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, tournaments: null}));
        await fetchData('tournaments');
    };

    const addClub = async (club: Omit<Club, 'id'> & { logoFile?: File }) => {
        let logoUrl = club.logoUrl;
        if (club.logoFile) {
            logoUrl = await uploadAsset(supabase, club.logoFile);
        }
        const { error } = await supabase.from('clubs').insert([{ name: club.name, logo_url: logoUrl }]);
        if (error) throw error;
        setState(s => ({...s, clubs: null}));
        await fetchData('clubs');
    };

    const updateClub = async (club: Club & { logoFile?: File }) => {
        let logoUrl = club.logoUrl;
        if (club.logoFile) {
            logoUrl = await uploadAsset(supabase, club.logoFile);
        }
        const { error } = await supabase.from('clubs').update({ name: club.name, logo_url: logoUrl }).eq('id', club.id);
        if (error) throw error;
        setState(s => ({...s, clubs: null}));
        await fetchData('clubs');
    };

    const deleteClub = async (id: number) => {
        const { error } = await supabase.from('clubs').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, clubs: null}));
        await fetchData('clubs');
    };

    const addTeam = async (team: Omit<Team, 'id'> & { logoFile?: File }) => {
        let logoUrl = team.logoUrl;
        if (team.logoFile) {
            logoUrl = await uploadAsset(supabase, team.logoFile);
        }
        const { error } = await supabase.from('teams').insert([{ name: team.name, short_name: team.shortName, division: team.division, club_id: team.clubId, logo_url: logoUrl }]);
        if (error) throw error;
        setState(s => ({...s, teams: null}));
        await fetchData('teams');
    };

    const updateTeam = async (team: Team & { logoFile?: File }) => {
         let logoUrl = team.logoUrl;
        if (team.logoFile) {
            logoUrl = await uploadAsset(supabase, team.logoFile);
        }
        const { error } = await supabase.from('teams').update({ name: team.name, short_name: team.shortName, division: team.division, club_id: team.clubId, logo_url: logoUrl }).eq('id', team.id);
        if (error) throw error;
        setState(s => ({...s, teams: null}));
        await fetchData('teams');
    };

    const deleteTeam = async (id: number) => {
        const { error } = await supabase.from('teams').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, teams: null}));
        await fetchData('teams');
    };

    const addPlayer = async (player: Omit<Player, 'id'> & { photoFile?: File }) => {
         let photoUrl = player.photoUrl;
        if (player.photoFile) {
            photoUrl = await uploadAsset(supabase, player.photoFile);
        }
        // Include joined_at defaulting to now for new players
        const { error } = await supabase.from('players').insert([{ 
            name: player.name, 
            role: player.role, 
            team_id: player.teamId, 
            club_id: player.clubId, 
            photo_url: photoUrl, 
            stats: player.stats,
            joined_at: new Date().toISOString()
        }]);
        if (error) throw error;
        setState(s => ({...s, players: null}));
        await fetchData('players');
    };

    const updatePlayer = async (player: Player & { photoFile?: File }) => {
         let photoUrl = player.photoUrl;
        if (player.photoFile) {
            photoUrl = await uploadAsset(supabase, player.photoFile);
        }
        const { error } = await supabase.from('players').update({ name: player.name, role: player.role, team_id: player.teamId, club_id: player.clubId, photo_url: photoUrl, stats: player.stats }).eq('id', player.id);
        if (error) throw error;
        setState(s => ({...s, players: null}));
        await fetchData('players');
    };

    const deletePlayer = async (id: number) => {
        const { error } = await supabase.from('players').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, players: null}));
        await fetchData('players');
    };
    
    const deleteAllPlayers = async () => {
        const { error } = await supabase.from('players').delete().neq('id', 0); // Delete all
        if (error) throw error;
        setState(s => ({...s, players: null}));
        await fetchData('players');
    };

    const addFixture = async (fixture: Omit<Fixture, 'id' | 'score'>) => {
        const { error } = await supabase.from('fixtures').insert([{ 
            tournament_id: fixture.tournamentId, 
            team1_id: fixture.team1Id, 
            team2_id: fixture.team2Id, 
            ground: fixture.ground, 
            date_time: fixture.dateTime, 
            status: fixture.status,
            referee: fixture.referee,
            stage: fixture.stage,
            man_of_the_match_id: fixture.manOfTheMatchId
        }]);
        if (error) throw error;
        setState(s => ({...s, fixtures: null}));
        await fetchData('fixtures');
    };

    const updateFixture = async (fixture: Fixture) => {
        const { error } = await supabase.from('fixtures').update({ 
            tournament_id: fixture.tournamentId, 
            team1_id: fixture.team1Id, 
            team2_id: fixture.team2Id, 
            ground: fixture.ground, 
            date_time: fixture.dateTime, 
            status: fixture.status, 
            referee: fixture.referee, 
            score: fixture.score,
            stage: fixture.stage,
            man_of_the_match_id: fixture.manOfTheMatchId
        }).eq('id', fixture.id);
        if (error) throw error;
        setState(s => ({...s, fixtures: null}));
        await fetchData('fixtures');
    };

    const deleteFixture = async (id: number) => {
        const { error } = await supabase.from('fixtures').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, fixtures: null}));
        await fetchData('fixtures');
    };

    const bulkAddFixtures = async (fixtures: Omit<Fixture, 'id' | 'score'>[]) => {
        const { error } = await supabase.from('fixtures').insert(fixtures.map(f => ({
             tournament_id: f.tournamentId, 
            team1_id: f.team1Id, 
            team2_id: f.team2Id, 
            ground: f.ground, 
            date_time: f.dateTime, 
            status: f.status,
            referee: f.referee,
            stage: f.stage
        })));
        if (error) throw error;
        setState(s => ({...s, fixtures: null}));
        await fetchData('fixtures');
    };

    const addSponsor = async (sponsor: Omit<Sponsor, 'id'> & { logoFile?: File }) => {
        let logoUrl = sponsor.logoUrl;
        if (sponsor.logoFile) {
            logoUrl = await uploadAsset(supabase, sponsor.logoFile);
        }
        const { error } = await supabase.from('sponsors').insert([{ name: sponsor.name, website: sponsor.website, logo_url: logoUrl, show_in_footer: sponsor.showInFooter }]);
        if (error) throw error;
        setState(s => ({...s, sponsors: null}));
        await fetchData('sponsors');
    };

    const updateSponsor = async (sponsor: Sponsor & { logoFile?: File }) => {
        let logoUrl = sponsor.logoUrl;
        if (sponsor.logoFile) {
            logoUrl = await uploadAsset(supabase, sponsor.logoFile);
        }
        const { error } = await supabase.from('sponsors').update({ name: sponsor.name, website: sponsor.website, logo_url: logoUrl, show_in_footer: sponsor.showInFooter }).eq('id', sponsor.id);
        if (error) throw error;
        setState(s => ({...s, sponsors: null}));
        await fetchData('sponsors');
    };

    const deleteSponsor = async (id: number) => {
        const { error } = await supabase.from('sponsors').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, sponsors: null}));
        await fetchData('sponsors');
    };
    
    const toggleSponsorShowInFooter = async (sponsor: Sponsor) => {
        const { error } = await supabase.from('sponsors').update({ show_in_footer: !sponsor.showInFooter }).eq('id', sponsor.id);
        if (error) throw error;
        setState(s => ({...s, sponsors: null}));
        await fetchData('sponsors');
    }

    const addPlayerTransfer = async (transfer: Omit<PlayerTransfer, 'id' | 'isAutomated'>) => {
        // 1. Record Transfer with Club info
        const { error } = await supabase.from('player_transfers').insert([{ 
            player_id: transfer.playerId, 
            from_team_id: transfer.fromTeamId, 
            to_team_id: transfer.toTeamId, 
            from_club_id: transfer.fromClubId,
            to_club_id: transfer.toClubId,
            transfer_date: transfer.transferDate, 
            notes: transfer.notes, 
            is_automated: false 
        }]);
        if (error) throw error;
        // 2. Update Player's Current Team and Club
        // Note: transfer.toClubId must be provided if available, otherwise fallback to team's club via DB triggers or just update team_id
        // We will update both to be safe
        const { error: pError } = await supabase.from('players').update({ 
            team_id: transfer.toTeamId,
            club_id: transfer.toClubId // Keep club affiliation in sync
        }).eq('id', transfer.playerId);
        if (pError) throw pError;
        
        setState(s => ({...s, playerTransfers: null, players: null}));
        await Promise.all([fetchData('playerTransfers'), fetchData('players')]);
    };
    
    const updatePlayerTransfer = async (transfer: PlayerTransfer) => {
         const { error } = await supabase.from('player_transfers').update({ 
             player_id: transfer.playerId, 
             from_team_id: transfer.fromTeamId, 
             to_team_id: transfer.toTeamId, 
             from_club_id: transfer.fromClubId,
             to_club_id: transfer.toClubId,
             transfer_date: transfer.transferDate, 
             notes: transfer.notes 
        }).eq('id', transfer.id);
        if (error) throw error;
        setState(s => ({...s, playerTransfers: null}));
        await fetchData('playerTransfers');
    };

    const deletePlayerTransfer = async (id: number) => {
        const { error } = await supabase.from('player_transfers').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, playerTransfers: null}));
        await fetchData('playerTransfers');
    };

    const addNotice = async (notice: Omit<Notice, 'id' | 'createdAt'>) => {
        const { error } = await supabase.from('notices').insert([{ title: notice.title, message: notice.message, level: notice.level, expires_at: notice.expiresAt }]);
        if (error) throw error;
        setState(s => ({...s, notices: null}));
        await fetchData('notices');
    };
    
    const deleteNotice = async (id: number) => {
         const { error } = await supabase.from('notices').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, notices: null}));
        await fetchData('notices');
    };
    
    const updateRules = async (content: string) => {
        // Upsert logic for single row table
        const { error } = await supabase.from('game_rules').upsert({ id: 1, content });
        if (error) throw error;
        setState(s => ({...s, rules: null}));
        await fetchData('rules');
    };

    const getActiveNotice = () => {
        if (!state.notices) return null;
        const now = new Date();
        // Sort by priority (Urgent > Warning > Info) then by creation date (newest first)
        const activeNotices = state.notices.filter(n => new Date(n.expiresAt) > now).sort((a, b) => {
            const levels = { 'Urgent': 3, 'Warning': 2, 'Information': 1 };
            if (levels[a.level] !== levels[b.level]) return levels[b.level] - levels[a.level];
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        return activeNotices.length > 0 ? activeNotices[0] : null;
    };
    
    // Bulk Imports
    const bulkAddOrUpdateTeams = async (csvTeams: CsvTeam[]) => {
         // This is complex because we need club IDs. Assume Clubs exist or auto-create?
         // For simplicity, we'll try to match existing clubs by name, or create if missing.
         // In a real app, this logic needs to be robust.
         
         const clubsMap = new Map<string, number>();
         if (state.clubs) state.clubs.forEach(c => clubsMap.set(c.name.toLowerCase(), c.id));
         
         for (const t of csvTeams) {
             let clubId = clubsMap.get(t.clubName.toLowerCase());
             if (!clubId) {
                 const { data, error } = await supabase.from('clubs').insert({ name: t.clubName }).select().single();
                 if (error) throw error;
                 clubId = data.id;
                 clubsMap.set(t.clubName.toLowerCase(), clubId);
             }
             
             // Upsert team (match by name?)
             // For simplicity, just insert if not exists logic is hard in pure client-side iteration without unique constraint
             // We will assume "name" is unique enough or just insert.
             const { error: teamError } = await supabase.from('teams').upsert({
                 name: t.name,
                 short_name: t.shortName,
                 division: t.division,
                 club_id: clubId,
                 logo_url: t.logoUrl
             }, { onConflict: 'name' }); // Assuming 'name' has a unique constraint in DB, or this might duplicate.
             if (teamError) throw teamError;
         }
         
         setState(s => ({...s, clubs: null, teams: null}));
         await Promise.all([fetchData('clubs'), fetchData('teams')]);
    };

    const bulkAddOrUpdatePlayers = async (csvPlayers: CsvPlayer[]) => {
        // Need maps for teams and clubs
        const teamsMap = new Map<string, number>();
        if (state.teams) state.teams.forEach(t => teamsMap.set(t.name.toLowerCase(), t.id));
        
        const clubsMap = new Map<string, number>();
        if (state.clubs) state.clubs.forEach(c => clubsMap.set(c.name.toLowerCase(), c.id));

        for (const p of csvPlayers) {
            let teamId = p.teamName ? teamsMap.get(p.teamName.toLowerCase()) : null;
            let clubId = p.clubName ? clubsMap.get(p.clubName.toLowerCase()) : null;
            
            // Heuristic: If team is known but club is not, get club from team
            if (teamId && !clubId && state.teams) {
                const team = state.teams.find(t => t.id === teamId);
                if (team) clubId = team.clubId;
            }

            if (!clubId && !teamId) continue; // Skip if we can't link to anything

            await supabase.from('players').upsert({
                name: p.name,
                team_id: teamId,
                club_id: clubId,
                role: 'Main Netty', // Default
                stats: {
                    matches: Number(p.matches) || 0,
                    aces: Number(p.aces) || 0,
                    kills: Number(p.kills) || 0,
                    blocks: Number(p.blocks) || 0
                }
            }, { onConflict: 'name' });
        }
        setState(s => ({...s, players: null}));
        await fetchData('players');
    };
    
    const updateSponsorsForTournament = async (tournamentId: number, sponsorIds: number[]) => {
        // Delete existing
        await supabase.from('tournament_sponsors').delete().eq('tournament_id', tournamentId);
        // Insert new
        if (sponsorIds.length > 0) {
            await supabase.from('tournament_sponsors').insert(sponsorIds.map(sid => ({
                tournament_id: tournamentId,
                sponsor_id: sid
            })));
        }
        setState(s => ({...s, tournamentSponsors: null}));
        await fetchData('tournamentSponsors');
    };
    
    const bulkUpdatePlayerTeam = async (playerIds: number[], teamId: number | null) => {
        const { error } = await supabase.from('players').update({ team_id: teamId }).in('id', playerIds);
        if (error) throw error;
        setState(s => ({...s, players: null}));
        await fetchData('players');
    };
    
    // TOURNAMENT LOGIC Helpers
    const getTournamentsByDivision = (division: 'Division 1' | 'Division 2') => {
        return (state.tournaments || []).filter(t => t.division === division);
    };

    const getFixturesByTournament = (tournamentId: number) => {
        return (state.fixtures || []).filter(f => f.tournamentId === tournamentId);
    };
    
    const getClubById = (id: number | null) => (state.clubs || []).find(c => c.id === id);
    const getTeamById = (id: number | null) => (state.teams || []).find(t => t.id === id);
    const getTeamsByClub = (clubId: number) => (state.teams || []).filter(t => t.clubId === clubId);
    const getPlayersByTeam = (teamId: number) => (state.players || []).filter(p => p.teamId === teamId);
    const getPlayersByClub = (clubId: number) => (state.players || []).filter(p => p.clubId === clubId);
    const getPlayerById = (id: number) => (state.players || []).find(p => p.id === id);
    const getTransfersByPlayerId = (id: number) => (state.playerTransfers || []).filter(t => t.playerId === id).sort((a,b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());
    const getSponsorsForTournament = (tournamentId: number) => {
        const links = (state.tournamentSponsors || []).filter(ts => ts.tournament_id === tournamentId);
        const ids = new Set(links.map(l => l.sponsor_id));
        return (state.sponsors || []).filter(s => ids.has(s.id));
    };
    const getAwardsByTournament = (tournamentId: number) => (state.tournamentAwards || []).filter(a => a.tournamentId === tournamentId);
    const getAwardsByPlayerId = (playerId: number) => (state.tournamentAwards || []).filter(a => a.playerId === playerId);

    const getStandingsForTournament = (tournamentId: number): TeamStanding[] => {
        const tournamentFixtures = getFixturesByTournament(tournamentId).filter(f => f.status === 'completed' && !f.stage); // Only Round Robin
        const standingsMap = new Map<number, TeamStanding>();

        // We need to know which teams are in the tournament.
        // Option 1: Infer from fixtures (might miss teams with no games yet)
        // Option 2: Use tournament_teams link table if implemented.
        // Let's use tournament_teams if available, else infer.
        
        // Populate initial map from TournamentTeams
        const linkedTeams = (state.tournamentTeams || []).filter(tt => tt.tournamentId === tournamentId);
        linkedTeams.forEach(tt => {
            const team = getTeamById(tt.teamId);
            if (team) {
                standingsMap.set(team.id, {
                    teamId: team.id, teamName: team.name, logoUrl: team.logoUrl,
                    gamesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
                });
            }
        });

        // Also add teams found in fixtures just in case they weren't linked manually
        tournamentFixtures.forEach(f => {
             [f.team1Id, f.team2Id].forEach(tid => {
                 if (!standingsMap.has(tid)) {
                     const team = getTeamById(tid);
                     if (team) {
                        standingsMap.set(tid, {
                            teamId: tid, teamName: team.name, logoUrl: team.logoUrl,
                            gamesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
                        });
                     }
                 }
             });
        });

        tournamentFixtures.forEach(f => {
            if (!f.score) return;
            
            const t1 = standingsMap.get(f.team1Id);
            const t2 = standingsMap.get(f.team2Id);
            
            if (t1 && t2) {
                t1.gamesPlayed++;
                t2.gamesPlayed++;
                
                // Volleyball scoring logic (Sets won)
                t1.goalsFor += f.score.team1Score;
                t1.goalsAgainst += f.score.team2Score;
                t2.goalsFor += f.score.team2Score;
                t2.goalsAgainst += f.score.team1Score;
                
                t1.goalDifference = t1.goalsFor - t1.goalsAgainst;
                t2.goalDifference = t2.goalsFor - t2.goalsAgainst;

                if (f.score.team1Score > f.score.team2Score) {
                    t1.wins++;
                    t2.losses++;
                    // Points: 3 for win, 0 for loss? Or 2 for win? Standard is often 3.
                    // Assuming 3 points for win.
                    t1.points += 3;
                } else if (f.score.team2Score > f.score.team1Score) {
                    t2.wins++;
                    t1.losses++;
                    t2.points += 3;
                } else {
                    // Draw (rare in volleyball but possible in some formats or timed games)
                    t1.draws++;
                    t2.draws++;
                    t1.points += 1;
                    t2.points += 1;
                }
            }
        });

        return Array.from(standingsMap.values()).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference; // Set difference
            return b.goalsFor - a.goalsFor; // Sets won
        });
    };
    
    const concludeLeaguePhase = async (tournamentId: number) => {
        // 1. Get Standings
        const standings = getStandingsForTournament(tournamentId);
        if (standings.length < 4) {
             throw new Error("Not enough teams to generate knockout phase (need at least 4).");
        }
        
        // 2. Generate Knockout Fixtures (Standard 1v8, 2v7 etc logic or just top 4)
        // Let's assume Top 4 for Semis if small, or Top 8 for QF if large.
        // Logic: If >= 8 teams, Quarter Finals. Else Semi Finals.
        
        const fixturesPayload = [];
        const now = new Date();
        const nextDay = new Date(now); nextDay.setDate(now.getDate() + 1); // Mock schedule for tomorrow
        
        if (standings.length >= 8) {
            // Quarter Finals (Top 8)
            // 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6
            const matchups = [
                { t1: 0, t2: 7, code: 'KO_QF:Winner QF1' },
                { t1: 3, t2: 4, code: 'KO_QF:Winner QF2' },
                { t1: 1, t2: 6, code: 'KO_QF:Winner QF3' },
                { t1: 2, t2: 5, code: 'KO_QF:Winner QF4' }
            ];
            
            matchups.forEach((m, idx) => {
                 fixturesPayload.push({
                     tournament_id: tournamentId,
                     team1_id: standings[m.t1].teamId,
                     team2_id: standings[m.t2].teamId,
                     ground: 'Main Court',
                     date_time: nextDay.toISOString(),
                     status: 'upcoming',
                     stage: 'quarter-final',
                     referee: m.code // Hacking referee field to store linkage for now or empty
                 });
            });
            
            // Add Semis and Final placeholders (without teams yet)
             // ... In a real app, you'd create these when QFs complete. 
             // For now, let's just create QFs.
             
        } else {
             // Semi Finals (Top 4)
             // 1 vs 4, 2 vs 3
              const matchups = [
                { t1: 0, t2: 3 },
                { t1: 1, t2: 2 }
            ];
            matchups.forEach((m) => {
                 fixturesPayload.push({
                     tournament_id: tournamentId,
                     team1_id: standings[m.t1].teamId,
                     team2_id: standings[m.t2].teamId,
                     ground: 'Main Court',
                     date_time: nextDay.toISOString(),
                     status: 'upcoming',
                     stage: 'semi-final'
                 });
            });
        }
        
        if (fixturesPayload.length > 0) {
            const { error } = await supabase.from('fixtures').insert(fixturesPayload);
            if (error) throw error;
        }

        // 3. Update Tournament Phase
        const { error: tError } = await supabase.from('tournaments').update({ phase: 'knockout' }).eq('id', tournamentId);
        if (tError) throw tError;
        
        setState(s => ({...s, fixtures: null, tournaments: null}));
        await Promise.all([fetchData('fixtures'), fetchData('tournaments')]);
    };
    
    const updateTournamentSquad = async (tournamentId: number, teamId: number, playerIds: number[]) => {
        // Delete existing
        await supabase.from('tournament_rosters').delete().match({ tournament_id: tournamentId, team_id: teamId });
        // Insert new
        if (playerIds.length > 0) {
            await supabase.from('tournament_rosters').insert(playerIds.map(pid => ({
                tournament_id: tournamentId,
                team_id: teamId,
                player_id: pid
            })));
        }
        setState(s => ({...s, tournamentRosters: null}));
        await fetchData('tournamentRosters');
    };
    
    const getTournamentSquad = (tournamentId: number, teamId: number) => {
        const rosterIds = (state.tournamentRosters || [])
            .filter(tr => tr.tournamentId === tournamentId && tr.teamId === teamId)
            .map(tr => tr.playerId);
            
        if (rosterIds.length === 0) {
            // Fallback to full team list if no specific roster
            return getPlayersByTeam(teamId);
        }
        
        return (state.players || []).filter(p => rosterIds.includes(p.id));
    };

    const updateTournamentTeams = async (tournamentId: number, teamIds: number[]) => {
        // Delete existing
        await supabase.from('tournament_teams').delete().eq('tournament_id', tournamentId);
        // Insert new
        if (teamIds.length > 0) {
             await supabase.from('tournament_teams').insert(teamIds.map(tid => ({
                tournament_id: tournamentId,
                team_id: tid
            })));
        }
        setState(s => ({...s, tournamentTeams: null}));
        await fetchData('tournamentTeams');
    };
    
    const addTournamentAward = async (award: Omit<TournamentAward, 'id'> & { imageFile?: File }) => {
         let imageUrl = award.imageUrl;
        if (award.imageFile) {
            imageUrl = await uploadAsset(supabase, award.imageFile);
        }
        const { error } = await supabase.from('tournament_awards').insert([{
            tournament_id: award.tournamentId,
            award_name: award.awardName,
            recipient_name: award.recipientName,
            player_id: award.playerId,
            image_url: imageUrl
        }]);
        if (error) throw error;
        setState(s => ({...s, tournamentAwards: null}));
        await fetchData('tournamentAwards');
    };
    
    const deleteTournamentAward = async (id: number) => {
         const { error } = await supabase.from('tournament_awards').delete().eq('id', id);
        if (error) throw error;
        setState(s => ({...s, tournamentAwards: null}));
        await fetchData('tournamentAwards');
    };

    const value = {
        ...state,
        _internal_state: state,
        fetchData,
        prefetchAllData,
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
        deleteAllPlayers,
        addFixture,
        updateFixture,
        deleteFixture,
        bulkAddFixtures,
        addSponsor,
        updateSponsor,
        deleteSponsor,
        toggleSponsorShowInFooter,
        addPlayerTransfer,
        updatePlayerTransfer,
        deletePlayerTransfer,
        addNotice,
        deleteNotice,
        updateRules,
        getActiveNotice,
        bulkAddOrUpdateTeams,
        bulkAddOrUpdatePlayers,
        getTournamentsByDivision,
        getFixturesByTournament,
        getClubById,
        getTeamById,
        getTeamsByClub,
        getPlayersByTeam,
        getPlayersByClub,
        getPlayerById,
        getTransfersByPlayerId,
        getStandingsForTournament,
        getSponsorsForTournament,
        updateSponsorsForTournament,
        bulkUpdatePlayerTeam,
        concludeLeaguePhase,
        updateTournamentSquad,
        getTournamentSquad,
        updateTournamentTeams,
        getAwardsByTournament,
        addTournamentAward,
        deleteTournamentAward,
        getAwardsByPlayerId,
        tournamentAwards: state.tournamentAwards || []
    };

    return (
        <SportsDataContext.Provider value={value}>
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

// Hook for accessing raw data for a specific entity with loading state
export const useEntityData = <K extends EntityName>(entityName: K) => {
    const context = useSports();
    useEffect(() => {
        // Trigger fetch if data is missing
        if (context._internal_state[entityName] === null) {
            context.fetchData(entityName);
        }
    }, [entityName, context]);

    return {
        data: context._internal_state[entityName] as SportsState[K],
        loading: context._internal_state.loading.has(entityName),
        error: context._internal_state.error
    };
};