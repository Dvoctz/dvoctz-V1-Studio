
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { useSupabase } from './SupabaseContext';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
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
    joinedAt: p.joined_at,
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
    fromClubId: pt.from_club_id,
    toClubId: pt.to_club_id,
    transferDate: pt.transfer_date, 
    notes: pt.notes, 
    isAutomated: pt.is_automated 
});
const mapTournamentRoster = (tr: DbTournamentRoster): TournamentRoster => ({ id: tr.id, tournamentId: tr.tournament_id, teamId: tr.team_id, playerId: tr.player_id });
const mapTournamentTeam = (tt: DbTournamentTeam): TournamentTeam => ({ tournamentId: tt.tournament_id, teamId: tt.team_id });
const mapTournamentAward = (ta: DbTournamentAward): TournamentAward => ({ id: ta.id, tournamentId: ta.tournament_id, awardName: ta.award_name, recipientName: ta.recipient_name, playerId: ta.player_id, imageUrl: ta.image_url });

const MAPPERS: { [key in EntityName]: (item: any) => any } = {
    tournaments: mapTournament,
    clubs: mapClub,
    teams: mapTeam,
    players: mapPlayer,
    fixtures: mapFixture,
    sponsors: mapSponsor,
    notices: mapNotice,
    playerTransfers: mapPlayerTransfer,
    tournamentRosters: mapTournamentRoster,
    tournamentTeams: mapTournamentTeam,
    tournamentAwards: mapTournamentAward,
    tournamentSponsors: (ts: any) => ts,
    rules: (r: any) => r.content,
};

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
        if (stateRef.current[entityName] !== null && !stateRef.current.loading.has(entityName)) {
            return stateRef.current[entityName] as SportsState[T];
        }

        setState(s => ({ ...s, loading: new Set(s.loading).add(entityName) }));

        try {
            let query = supabase.from(entityName === 'rules' ? 'game_rules' : entityName).select('*');
            if(entityName === 'rules') query = query.limit(1).maybeSingle();
            if(entityName === 'tournaments' || entityName === 'clubs' || entityName === 'teams' || entityName === 'players' || entityName === 'sponsors') query = query.order('name');
            
            const { data, error } = await query;

            if (error) throw error;
            
            const mapper = MAPPERS[entityName];
            const processedData = Array.isArray(data) ? data.map(mapper) : (data ? mapper(data) : (entityName === 'rules' ? '' : []));

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
        const allEntities: EntityName[] = ['tournaments', 'clubs', 'teams', 'players', 'fixtures', 'sponsors', 'tournamentSponsors', 'playerTransfers', 'notices', 'rules', 'tournamentRosters', 'tournamentTeams', 'tournamentAwards'];
        await Promise.all(allEntities.map(e => fetchData(e)));
    }, [fetchData]);

    useEffect(() => {
        if (!supabase) return;
        const channels: RealtimeChannel[] = [];

        const allEntities: EntityName[] = ['tournaments', 'clubs', 'teams', 'players', 'fixtures', 'sponsors', 'tournamentSponsors', 'playerTransfers', 'notices', 'rules', 'tournamentRosters', 'tournamentTeams', 'tournamentAwards'];

        allEntities.forEach(entityName => {
            const tableName = entityName === 'rules' ? 'game_rules' : entityName;
            const mapper = MAPPERS[entityName] || ((i: any) => i);

            const channel = supabase.channel(`public:${tableName}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: tableName }, (payload) => {
                    console.log(`Realtime INSERT on ${tableName}:`, payload);
                    const newItem = mapper(payload.new);
                    setState(s => {
                        const currentData = s[entityName];
                        if (!Array.isArray(currentData)) return s;
                        return {...s, [entityName]: [...currentData, newItem]};
                    });
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: tableName }, (payload) => {
                    console.log(`Realtime UPDATE on ${tableName}:`, payload);
                    const updatedItem = mapper(payload.new);
                    setState(s => {
                        const currentData = s[entityName];
                        if (entityName === 'rules') return {...s, rules: updatedItem };
                        if (!Array.isArray(currentData)) return s;
                        return {...s, [entityName]: currentData.map((item: any) => item.id === updatedItem.id ? updatedItem : item)};
                    });
                })
                .on('postgres_changes', { event: 'DELETE', schema: 'public', table: tableName }, (payload) => {
                    console.log(`Realtime DELETE on ${tableName}:`, payload);
                     setState(s => {
                        const currentData = s[entityName];
                        if (!Array.isArray(currentData)) return s;
                        return {...s, [entityName]: currentData.filter((item: any) => item.id !== payload.old.id)};
                    });
                })
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`Subscribed to ${tableName}`);
                    }
                    if (status === 'CHANNEL_ERROR') {
                        console.error(`Subscription error on ${tableName}:`, err);
                    }
                });
            channels.push(channel);
        });

        return () => {
            console.log("Removing all Supabase subscriptions");
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [supabase]);


    // CRUD Operations (simplified - they no longer need to manually refetch)
    const addTournament = async (tournament: Omit<Tournament, 'id'>) => {
        const { error } = await supabase.from('tournaments').insert([{ name: tournament.name, division: tournament.division, phase: 'round-robin', show_champion_banner: tournament.showChampionBanner }]);
        if (error) throw error;
    };

    const updateTournament = async (tournament: Tournament) => {
        const { error } = await supabase.from('tournaments').update({ name: tournament.name, division: tournament.division, phase: tournament.phase, show_champion_banner: tournament.showChampionBanner }).eq('id', tournament.id);
        if (error) throw error;
    };

    const deleteTournament = async (id: number) => {
        const { error } = await supabase.from('tournaments').delete().eq('id', id);
        if (error) throw error;
    };
    
    const addClub = async (club: Omit<Club, 'id'> & { logoFile?: File }) => {
        let logoUrl = club.logoUrl;
        if (club.logoFile) logoUrl = await uploadAsset(supabase, club.logoFile);
        const { error } = await supabase.from('clubs').insert([{ name: club.name, logo_url: logoUrl }]);
        if (error) throw error;
    };

    const updateClub = async (club: Club & { logoFile?: File }) => {
        let logoUrl = club.logoUrl;
        if (club.logoFile) logoUrl = await uploadAsset(supabase, club.logoFile);
        const { error } = await supabase.from('clubs').update({ name: club.name, logo_url: logoUrl }).eq('id', club.id);
        if (error) throw error;
    };

    const deleteClub = async (id: number) => {
        const { error } = await supabase.from('clubs').delete().eq('id', id);
        if (error) throw error;
    };
    
    const addTeam = async (team: Omit<Team, 'id'> & { logoFile?: File }) => {
        let logoUrl = team.logoUrl;
        if (team.logoFile) logoUrl = await uploadAsset(supabase, team.logoFile);
        const { error } = await supabase.from('teams').insert([{ name: team.name, short_name: team.shortName, division: team.division, club_id: team.clubId, logo_url: logoUrl }]);
        if (error) throw error;
    };

    const updateTeam = async (team: Team & { logoFile?: File }) => {
         let logoUrl = team.logoUrl;
        if (team.logoFile) logoUrl = await uploadAsset(supabase, team.logoFile);
        const { error } = await supabase.from('teams').update({ name: team.name, short_name: team.shortName, division: team.division, club_id: team.clubId, logo_url: logoUrl }).eq('id', team.id);
        if (error) throw error;
    };

    const deleteTeam = async (id: number) => {
        const { error } = await supabase.from('teams').delete().eq('id', id);
        if (error) throw error;
    };

    const addPlayer = async (player: Omit<Player, 'id'> & { photoFile?: File }) => {
         let photoUrl = player.photoUrl;
        if (player.photoFile) photoUrl = await uploadAsset(supabase, player.photoFile);
        const { error } = await supabase.from('players').insert([{ name: player.name, role: player.role, team_id: player.teamId, club_id: player.clubId, photo_url: photoUrl, stats: player.stats, joined_at: player.joinedAt || new Date().toISOString() }]);
        if (error) throw error;
    };

    const updatePlayer = async (player: Player & { photoFile?: File }) => {
         let photoUrl = player.photoUrl;
        if (player.photoFile) photoUrl = await uploadAsset(supabase, player.photoFile);
        const { error } = await supabase.from('players').update({ name: player.name, role: player.role, team_id: player.teamId, club_id: player.clubId, photo_url: photoUrl, stats: player.stats, joined_at: player.joinedAt }).eq('id', player.id);
        if (error) throw error;
    };

    const deletePlayer = async (id: number) => {
        const { error } = await supabase.from('players').delete().eq('id', id);
        if (error) throw error;
    };
    
    const deleteAllPlayers = async () => {
        const { error } = await supabase.from('players').delete().neq('id', 0);
        if (error) throw error;
    };
    
    const addFixture = async (fixture: Omit<Fixture, 'id' | 'score'>) => {
        const { error } = await supabase.from('fixtures').insert([{ tournament_id: fixture.tournamentId, team1_id: fixture.team1Id, team2_id: fixture.team2Id, ground: fixture.ground, date_time: fixture.dateTime, status: fixture.status, referee: fixture.referee, stage: fixture.stage, man_of_the_match_id: fixture.manOfTheMatchId }]);
        if (error) throw error;
    };

    const updateFixture = async (fixture: Fixture) => {
        const { error } = await supabase.from('fixtures').update({ tournament_id: fixture.tournamentId, team1_id: fixture.team1Id, team2_id: fixture.team2Id, ground: fixture.ground, date_time: fixture.dateTime, status: fixture.status, referee: fixture.referee, score: fixture.score, stage: fixture.stage, man_of_the_match_id: fixture.manOfTheMatchId }).eq('id', fixture.id);
        if (error) throw error;
    };

    const deleteFixture = async (id: number) => {
        const { error } = await supabase.from('fixtures').delete().eq('id', id);
        if (error) throw error;
    };
    
    const bulkAddFixtures = async (fixtures: Omit<Fixture, 'id' | 'score'>[]) => {
        const { error } = await supabase.from('fixtures').insert(fixtures.map(f => ({ tournament_id: f.tournamentId, team1_id: f.team1Id, team2_id: f.team2Id, ground: f.ground, date_time: f.dateTime, status: f.status, referee: f.referee, stage: f.stage })));
        if (error) throw error;
    };
    
    const addSponsor = async (sponsor: Omit<Sponsor, 'id'> & { logoFile?: File }) => {
        let logoUrl = sponsor.logoUrl;
        if (sponsor.logoFile) logoUrl = await uploadAsset(supabase, sponsor.logoFile);
        const { error } = await supabase.from('sponsors').insert([{ name: sponsor.name, website: sponsor.website, logo_url: logoUrl, show_in_footer: sponsor.showInFooter }]);
        if (error) throw error;
    };

    const updateSponsor = async (sponsor: Sponsor & { logoFile?: File }) => {
        let logoUrl = sponsor.logoUrl;
        if (sponsor.logoFile) logoUrl = await uploadAsset(supabase, sponsor.logoFile);
        const { error } = await supabase.from('sponsors').update({ name: sponsor.name, website: sponsor.website, logo_url: logoUrl, show_in_footer: sponsor.showInFooter }).eq('id', sponsor.id);
        if (error) throw error;
    };

    const deleteSponsor = async (id: number) => {
        const { error } = await supabase.from('sponsors').delete().eq('id', id);
        if (error) throw error;
    };
    
    const toggleSponsorShowInFooter = async (sponsor: Sponsor) => {
        const { error } = await supabase.from('sponsors').update({ show_in_footer: !sponsor.showInFooter }).eq('id', sponsor.id);
        if (error) throw error;
    }
    
    const addPlayerTransfer = async (transfer: Omit<PlayerTransfer, 'id' | 'isAutomated'>) => {
        // This logic is complex and might need to stay as-is if it involves multiple tables
         const { error } = await supabase.from('player_transfers').insert([{ player_id: transfer.playerId, from_team_id: transfer.fromTeamId, to_team_id: transfer.toTeamId, from_club_id: transfer.fromClubId, to_club_id: transfer.toClubId, transfer_date: transfer.transferDate, notes: transfer.notes, is_automated: false }]);
        if (error) throw error;
        const { error: pError } = await supabase.from('players').update({ team_id: transfer.toTeamId, club_id: transfer.toClubId }).eq('id', transfer.playerId);
        if (pError) throw pError;
        // The realtime listeners should catch the changes to both tables, so no manual refetch needed.
    };
    
    const updatePlayerTransfer = async (transfer: PlayerTransfer) => {
         const { error } = await supabase.from('player_transfers').update({ player_id: transfer.playerId, from_team_id: transfer.fromTeamId, to_team_id: transfer.toTeamId, from_club_id: transfer.fromClubId, to_club_id: transfer.toClubId, transfer_date: transfer.transferDate, notes: transfer.notes }).eq('id', transfer.id);
        if (error) throw error;
    };

    const deletePlayerTransfer = async (id: number) => {
        const { error } = await supabase.from('player_transfers').delete().eq('id', id);
        if (error) throw error;
    };
    
    const addNotice = async (notice: Omit<Notice, 'id' | 'createdAt'>) => {
        const { error } = await supabase.from('notices').insert([{ title: notice.title, message: notice.message, level: notice.level, expires_at: notice.expiresAt }]);
        if (error) throw error;
    };
    
    const deleteNotice = async (id: number) => {
         const { error } = await supabase.from('notices').delete().eq('id', id);
        if (error) throw error;
    };
    
    const updateRules = async (content: string) => {
        const { error } = await supabase.from('game_rules').upsert({ id: 1, content });
        if (error) throw error;
    };
    
    // The following bulk operations are complex and may require manual refetching
    // because they perform operations that realtime may not easily track in one go.
    // For now, we add the invalidation back for these specific functions.
    const bulkAddOrUpdateTeams = async (csvTeams: CsvTeam[]) => {
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
             
             const { error: teamError } = await supabase.from('teams').upsert({ name: t.name, short_name: t.shortName, division: t.division, club_id: clubId, logo_url: t.logoUrl }, { onConflict: 'name' });
             if (teamError) throw teamError;
         }
         
         await Promise.all([fetchData('clubs'), fetchData('teams')]);
    };

    const bulkAddOrUpdatePlayers = async (csvPlayers: CsvPlayer[]) => {
        const teamsMap = new Map<string, number>();
        if (state.teams) state.teams.forEach(t => teamsMap.set(t.name.toLowerCase(), t.id));
        
        const clubsMap = new Map<string, number>();
        if (state.clubs) state.clubs.forEach(c => clubsMap.set(c.name.toLowerCase(), c.id));

        for (const p of csvPlayers) {
            let teamId = p.teamName ? teamsMap.get(p.teamName.toLowerCase()) : null;
            let clubId = p.clubName ? clubsMap.get(p.clubName.toLowerCase()) : null;
            
            if (teamId && !clubId && state.teams) {
                const team = state.teams.find(t => t.id === teamId);
                if (team) clubId = team.clubId;
            }

            if (!clubId && !teamId) continue;

            await supabase.from('players').upsert({ name: p.name, team_id: teamId, club_id: clubId, role: 'Main Netty', stats: { matches: Number(p.matches) || 0, aces: Number(p.aces) || 0, kills: Number(p.kills) || 0, blocks: Number(p.blocks) || 0 } }, { onConflict: 'name' });
        }
        await fetchData('players');
    };
    
    const updateSponsorsForTournament = async (tournamentId: number, sponsorIds: number[]) => {
        await supabase.from('tournament_sponsors').delete().eq('tournament_id', tournamentId);
        if (sponsorIds.length > 0) {
            await supabase.from('tournament_sponsors').insert(sponsorIds.map(sid => ({ tournament_id: tournamentId, sponsor_id: sid })));
        }
    };
    
    const bulkUpdatePlayerTeam = async (playerIds: number[], teamId: number | null) => {
        const { error } = await supabase.from('players').update({ team_id: teamId }).in('id', playerIds);
        if (error) throw error;
    };

    const concludeLeaguePhase = async (tournamentId: number) => {
        const standings = getStandingsForTournament(tournamentId);
        if (standings.length < 4) {
             throw new Error("Not enough teams to generate knockout phase (need at least 4).");
        }
        
        const fixturesPayload = [];
        const now = new Date();
        const nextDay = new Date(now); nextDay.setDate(now.getDate() + 1);
        
        if (standings.length >= 8) {
            const matchups = [{ t1: 0, t2: 7, code: 'KO_QF:Winner QF1' }, { t1: 3, t2: 4, code: 'KO_QF:Winner QF2' }, { t1: 1, t2: 6, code: 'KO_QF:Winner QF3' }, { t1: 2, t2: 5, code: 'KO_QF:Winner QF4' }];
            matchups.forEach((m, idx) => {
                 fixturesPayload.push({ tournament_id: tournamentId, team1_id: standings[m.t1].teamId, team2_id: standings[m.t2].teamId, ground: 'Main Court', date_time: nextDay.toISOString(), status: 'upcoming', stage: 'quarter-final', referee: m.code });
            });
        } else {
              const matchups = [{ t1: 0, t2: 3 }, { t1: 1, t2: 2 }];
            matchups.forEach((m) => {
                 fixturesPayload.push({ tournament_id: tournamentId, team1_id: standings[m.t1].teamId, team2_id: standings[m.t2].teamId, ground: 'Main Court', date_time: nextDay.toISOString(), status: 'upcoming', stage: 'semi-final' });
            });
        }
        
        if (fixturesPayload.length > 0) {
            const { error } = await supabase.from('fixtures').insert(fixturesPayload);
            if (error) throw error;
        }

        const { error: tError } = await supabase.from('tournaments').update({ phase: 'knockout' }).eq('id', tournamentId);
        if (tError) throw tError;
    };
    
    const updateTournamentSquad = async (tournamentId: number, teamId: number, playerIds: number[]) => {
        await supabase.from('tournament_rosters').delete().match({ tournament_id: tournamentId, team_id: teamId });
        if (playerIds.length > 0) {
            await supabase.from('tournament_rosters').insert(playerIds.map(pid => ({ tournament_id: tournamentId, team_id: teamId, player_id: pid })));
        }
    };

    const updateTournamentTeams = async (tournamentId: number, teamIds: number[]) => {
        await supabase.from('tournament_teams').delete().eq('tournament_id', tournamentId);
        if (teamIds.length > 0) {
             await supabase.from('tournament_teams').insert(teamIds.map(tid => ({ tournament_id: tournamentId, team_id: tid })));
        }
    };
    
    const addTournamentAward = async (award: Omit<TournamentAward, 'id'> & { imageFile?: File }) => {
         let imageUrl = award.imageUrl;
        if (award.imageFile) imageUrl = await uploadAsset(supabase, award.imageFile);
        const { error } = await supabase.from('tournament_awards').insert([{ tournament_id: award.tournamentId, award_name: award.awardName, recipient_name: award.recipientName, player_id: award.playerId, image_url: imageUrl }]);
        if (error) throw error;
    };
    
    const deleteTournamentAward = async (id: number) => {
         const { error } = await supabase.from('tournament_awards').delete().eq('id', id);
        if (error) throw error;
    };

    // MEMOIZED SELECTORS
    const getActiveNotice = useCallback(() => {
        if (!state.notices) return null;
        const now = new Date();
        const activeNotices = state.notices.filter(n => new Date(n.expiresAt) > now).sort((a, b) => {
            const levels = { 'Urgent': 3, 'Warning': 2, 'Information': 1 };
            if (levels[a.level] !== levels[b.level]) return levels[b.level] - levels[a.level];
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        return activeNotices.length > 0 ? activeNotices[0] : null;
    }, [state.notices]);

    const getTournamentsByDivision = useCallback((division: 'Division 1' | 'Division 2') => (state.tournaments || []).filter(t => t.division === division), [state.tournaments]);
    const getFixturesByTournament = useCallback((tournamentId: number) => (state.fixtures || []).filter(f => f.tournamentId === tournamentId), [state.fixtures]);
    const getClubById = useCallback((id: number | null) => (state.clubs || []).find(c => c.id === id), [state.clubs]);
    const getTeamById = useCallback((id: number | null) => (state.teams || []).find(t => t.id === id), [state.teams]);
    const getTeamsByClub = useCallback((clubId: number) => (state.teams || []).filter(t => t.clubId === clubId), [state.teams]);
    const getPlayersByTeam = useCallback((teamId: number) => (state.players || []).filter(p => p.teamId === teamId), [state.players]);
    const getPlayersByClub = useCallback((clubId: number) => (state.players || []).filter(p => p.clubId === clubId), [state.players]);
    const getPlayerById = useCallback((id: number) => (state.players || []).find(p => p.id === id), [state.players]);
    const getTransfersByPlayerId = useCallback((id: number) => (state.playerTransfers || []).filter(t => t.playerId === id).sort((a,b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime()), [state.playerTransfers]);
    const getSponsorsForTournament = useCallback((tournamentId: number) => {
        const links = (state.tournamentSponsors || []).filter(ts => ts.tournament_id === tournamentId);
        const ids = new Set(links.map(l => l.sponsor_id));
        return (state.sponsors || []).filter(s => ids.has(s.id));
    }, [state.tournamentSponsors, state.sponsors]);
    const getAwardsByTournament = useCallback((tournamentId: number) => (state.tournamentAwards || []).filter(a => a.tournamentId === tournamentId), [state.tournamentAwards]);
    const getAwardsByPlayerId = useCallback((playerId: number) => (state.tournamentAwards || []).filter(a => a.playerId === playerId), [state.tournamentAwards]);
    
    const getStandingsForTournament = useCallback((tournamentId: number): TeamStanding[] => {
        const tournamentFixtures = getFixturesByTournament(tournamentId).filter(f => f.status === 'completed' && !f.stage);
        const standingsMap = new Map<number, TeamStanding>();
        
        const linkedTeams = (state.tournamentTeams || []).filter(tt => tt.tournamentId === tournamentId);
        linkedTeams.forEach(tt => {
            const team = getTeamById(tt.teamId);
            if (team) {
                standingsMap.set(team.id, { teamId: team.id, teamName: team.name, logoUrl: team.logoUrl, gamesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 });
            }
        });

        tournamentFixtures.forEach(f => {
             [f.team1Id, f.team2Id].forEach(tid => {
                 if (!standingsMap.has(tid)) {
                     const team = getTeamById(tid);
                     if (team) {
                        standingsMap.set(tid, { teamId: tid, teamName: team.name, logoUrl: team.logoUrl, gamesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 });
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
                t1.goalsFor += f.score.team1Score;
                t1.goalsAgainst += f.score.team2Score;
                t2.goalsFor += f.score.team2Score;
                t2.goalsAgainst += f.score.team1Score;
                t1.goalDifference = t1.goalsFor - t1.goalsAgainst;
                t2.goalDifference = t2.goalsFor - t2.goalsAgainst;

                if (f.score.team1Score > f.score.team2Score) {
                    t1.wins++;
                    t2.losses++;
                    t1.points += 3;
                } else if (f.score.team2Score > f.score.team1Score) {
                    t2.wins++;
                    t1.losses++;
                    t2.points += 3;
                } else {
                    t1.draws++;
                    t2.draws++;
                    t1.points += 1;
                    t2.points += 1;
                }
            }
        });

        return Array.from(standingsMap.values()).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
    }, [state.fixtures, state.teams, state.tournamentTeams, getFixturesByTournament, getTeamById]);
    
    const getTournamentSquad = useCallback((tournamentId: number, teamId: number) => {
        const rosterIds = (state.tournamentRosters || []).filter(tr => tr.tournamentId === tournamentId && tr.teamId === teamId).map(tr => tr.playerId);
        if (rosterIds.length === 0) return getPlayersByTeam(teamId);
        return (state.players || []).filter(p => rosterIds.includes(p.id));
    }, [state.tournamentRosters, state.players, getPlayersByTeam]);


    const value: SportsContextType = useMemo(() => ({
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
        tournamentAwards: state.tournamentAwards || [],
    }), [state, fetchData, prefetchAllData, getActiveNotice, getTournamentsByDivision, getFixturesByTournament, getClubById, getTeamById, getTeamsByClub, getPlayersByTeam, getPlayersByClub, getPlayerById, getTransfersByPlayerId, getStandingsForTournament, getSponsorsForTournament, getTournamentSquad, getAwardsByTournament, getAwardsByPlayerId]);

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
