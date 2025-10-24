
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSupabase } from './SupabaseContext';
import type { Tournament, Team, Player, Fixture, Sponsor, PlayerRole, TeamStanding, Score } from '../types';
import type { DbFixture, DbTournamentSponsor } from '../supabaseClient';

// Types for CSV import
export interface CsvTeam {
    name: string;
    shortName: string;
    division: 'Division 1' | 'Division 2';
    logoUrl?: string;
}

export interface CsvPlayer {
    name: string;
    teamName: string;
    role: PlayerRole;
    photoUrl?: string;
    matches?: string;
    aces?: string;
    kills?: string;
    blocks?: string;
}

interface SportsDataContextType {
    tournaments: Tournament[];
    teams: Team[];
    players: Player[];
    fixtures: Fixture[];
    sponsors: Sponsor[];
    loading: boolean;
    error: Error | null;
    
    // Data getters
    getTeamById: (id: number) => Team | undefined;
    getTournamentById: (id: number) => Tournament | undefined;
    getPlayersByTeam: (teamId: number) => Player[];
    getFixturesByTournament: (tournamentId: number) => Fixture[];
    getTournamentsByDivision: (division: 'Division 1' | 'Division 2') => Tournament[];
    getGlobalSponsors: () => Sponsor[];
    getSponsorsForTournament: (tournamentId: number) => Sponsor[];
    getStandingsForTournament: (tournamentId: number) => TeamStanding[];

    // Data mutation functions (for admin)
    addTournament: (tournament: Omit<Tournament, 'id'>) => Promise<Tournament>;
    updateTournament: (tournament: Tournament) => Promise<Tournament>;
    deleteTournament: (id: number) => Promise<void>;
    
    addTeam: (team: Omit<Team, 'id'> & { logoFile?: File }) => Promise<Team>;
    updateTeam: (team: Team & { logoFile?: File }) => Promise<Team>;
    deleteTeam: (id: number) => Promise<void>;

    addPlayer: (player: Omit<Player, 'id'> & { photoFile?: File }) => Promise<Player>;
    updatePlayer: (player: Player & { photoFile?: File }) => Promise<Player>;
    deletePlayer: (id: number) => Promise<void>;
    
    addFixture: (fixture: Omit<Fixture, 'id' | 'score'>) => Promise<Fixture>;
    updateFixture: (fixture: Fixture) => Promise<Fixture>;
    deleteFixture: (id: number) => Promise<void>;

    addSponsor: (sponsor: Omit<Sponsor, 'id'> & { logoFile?: File }) => Promise<Sponsor>;
    updateSponsor: (sponsor: Sponsor & { logoFile?: File }) => Promise<Sponsor>;
    deleteSponsor: (id: number) => Promise<void>;

    updateSponsorsForTournament: (tournamentId: number, sponsorIds: number[]) => Promise<void>;
    
    bulkAddOrUpdateTeams: (teamsData: CsvTeam[]) => Promise<void>;
    bulkAddOrUpdatePlayers: (playersData: CsvPlayer[]) => Promise<void>;
}

const SportsDataContext = createContext<SportsDataContextType | undefined>(undefined);

export const SportsDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
    
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [tournamentSponsors, setTournamentSponsors] = useState<DbTournamentSponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                { data: tournamentsData, error: tournamentsError },
                { data: teamsData, error: teamsError },
                { data: playersData, error: playersError },
                { data: fixturesData, error: fixturesError },
                { data: sponsorsData, error: sponsorsError },
                { data: tournamentSponsorsData, error: tournamentSponsorsError }
            ] = await Promise.all([
                supabase.from('tournaments').select('*').order('id'),
                supabase.from('teams').select('*').order('name'),
                supabase.from('players').select('*').order('name'),
                supabase.from('fixtures').select('*').order('dateTime'),
                supabase.from('sponsors').select('*').order('name'),
                supabase.from('tournament_sponsors').select('*')
            ]);

            if (tournamentsError) throw tournamentsError;
            if (teamsError) throw teamsError;
            if (playersError) throw playersError;
            if (fixturesError) throw fixturesError;
            if (sponsorsError) throw sponsorsError;
            if (tournamentSponsorsError) throw tournamentSponsorsError;

            setTournaments(tournamentsData as Tournament[]);
            setTeams(teamsData as Team[]);
            setPlayers(playersData as Player[]);
            const fixturesWithScores = (fixturesData as DbFixture[]).map(f => ({ ...f, score: f.score || undefined }));
            setFixtures(fixturesWithScores as Fixture[]);
            setSponsors(sponsorsData as Sponsor[]);
            setTournamentSponsors(tournamentSponsorsData as DbTournamentSponsor[]);
            
        } catch (err: any) {
            setError(err);
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getTeamById = useCallback((id: number) => teams.find(t => t.id === id), [teams]);
    const getTournamentById = useCallback((id: number) => tournaments.find(t => t.id === id), [tournaments]);
    const getPlayersByTeam = useCallback((teamId: number) => players.filter(p => p.teamId === teamId), [players]);
    const getFixturesByTournament = useCallback((tournamentId: number) => fixtures.filter(f => f.tournamentId === tournamentId).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()), [fixtures]);
    const getTournamentsByDivision = useCallback((division: 'Division 1' | 'Division 2') => tournaments.filter(t => t.division === division), [tournaments]);
    const getGlobalSponsors = useCallback(() => sponsors.filter(s => s.isGlobal), [sponsors]);
    
    const getSponsorsForTournament = useCallback((tournamentId: number) => {
        const sponsorIds = tournamentSponsors.filter(ts => ts.tournament_id === tournamentId).map(ts => ts.sponsor_id);
        return sponsors.filter(s => sponsorIds.includes(s.id));
    }, [sponsors, tournamentSponsors]);

    const getStandingsForTournament = useCallback((tournamentId: number): TeamStanding[] => {
        const tournamentFixtures = fixtures.filter(f => f.tournamentId === tournamentId && f.status === 'completed');
        const tournamentTeamIds = new Set<number>();
        tournamentFixtures.forEach(f => {
            tournamentTeamIds.add(f.team1Id);
            tournamentTeamIds.add(f.team2Id);
        });
        const tournamentTeams = teams.filter(t => tournamentTeamIds.has(t.id));
        const standingsMap: { [teamId: number]: TeamStanding } = {};

        tournamentTeams.forEach(team => {
            standingsMap[team.id] = {
                teamId: team.id, teamName: team.name, logoUrl: team.logoUrl,
                gamesPlayed: 0, wins: 0, draws: 0, losses: 0,
                goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
            };
        });

        tournamentFixtures.forEach(fixture => {
            if (!fixture.score) return;
            const { team1Id, team2Id, score } = fixture;
            const standing1 = standingsMap[team1Id];
            const standing2 = standingsMap[team2Id];
            if (!standing1 || !standing2) return;

            standing1.gamesPlayed++; standing2.gamesPlayed++;
            standing1.goalsFor += score.team1Score; standing1.goalsAgainst += score.team2Score;
            standing2.goalsFor += score.team2Score; standing2.goalsAgainst += score.team1Score;

            if (score.team1Score > score.team2Score) {
                standing1.wins++; standing2.losses++; standing1.points += 2;
            } else if (score.team2Score > score.team1Score) {
                standing2.wins++; standing1.losses++; standing2.points += 2;
            } else {
                standing1.draws++; standing2.draws++; standing1.points += 1; standing2.points += 1;
            }
        });
        
        return Object.values(standingsMap)
            .map(s => ({ ...s, goalDifference: s.goalsFor - s.goalsAgainst }))
            .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.teamName.localeCompare(b.teamName));
    }, [fixtures, teams]);

    const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
        const { data, error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return publicUrl;
    };
    
    // CRUD functions
    const addTournament = async (tournament: Omit<Tournament, 'id'>): Promise<Tournament> => {
        const payload = {
            name: tournament.name,
            division: tournament.division
        };
        const { data, error } = await supabase.from('tournaments').insert(payload).select();
        if (error) throw error;
        const newTournament = data[0] as Tournament;
        setTournaments(prev => [...prev, newTournament]);
        return newTournament;
    };

    const updateTournament = async (tournament: Tournament): Promise<Tournament> => {
        const payload = {
            name: tournament.name,
            division: tournament.division
        };
        const { data, error } = await supabase.from('tournaments').update(payload).eq('id', tournament.id).select();
        if (error) throw error;
        const updatedTournament = data[0] as Tournament;
        setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
        return updatedTournament;
    };

    const deleteTournament = async (id: number): Promise<void> => {
        const { error: fixtureError } = await supabase.from('fixtures').delete().eq('tournamentId', id);
        if (fixtureError) throw fixtureError;
        const { error: sponsorLinkError } = await supabase.from('tournament_sponsors').delete().eq('tournament_id', id);
        if (sponsorLinkError) throw sponsorLinkError;
        const { error } = await supabase.from('tournaments').delete().eq('id', id);
        if (error) throw error;
        setTournaments(prev => prev.filter(t => t.id !== id));
        setFixtures(prev => prev.filter(f => f.tournamentId !== id));
        setTournamentSponsors(prev => prev.filter(ts => ts.tournament_id !== id));
    };

    const addTeam = async (team: Omit<Team, 'id'> & { logoFile?: File }): Promise<Team> => {
        const { logoFile, ...teamData } = team;
        let logoUrl = null;
        if (logoFile) {
            const filePath = `public/${teamData.shortName}_${Date.now()}`;
            logoUrl = await uploadFile(logoFile, 'team-logos', filePath);
        }
        const payload = {
            name: teamData.name,
            short_name: teamData.shortName,
            division: teamData.division,
            logo_url: logoUrl,
        };
        const { data, error } = await supabase.from('teams').insert(payload).select();
        if (error) throw error;
        const newTeam = data[0] as Team;
        setTeams(prev => [...prev, newTeam].sort((a,b) => a.name.localeCompare(b.name)));
        return newTeam;
    };

    const updateTeam = async (team: Team & { logoFile?: File }): Promise<Team> => {
        const { logoFile, id, ...teamData } = team;
        let newLogoUrl = teamData.logoUrl;
        if (logoFile) {
            const filePath = `public/${teamData.shortName}_${Date.now()}`;
            newLogoUrl = await uploadFile(logoFile, 'team-logos', filePath);
        } else if (teamData.logoUrl === null) {
            newLogoUrl = null;
        }
        const payload = {
            name: teamData.name,
            short_name: teamData.shortName,
            division: teamData.division,
            logo_url: newLogoUrl,
        };
        const { data, error } = await supabase.from('teams').update(payload).eq('id', team.id).select();
        if (error) throw error;
        const updatedTeam = data[0] as Team;
        setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
        return updatedTeam;
    };
    
    const deleteTeam = async (id: number): Promise<void> => {
        const { error: playerError } = await supabase.from('players').delete().eq('teamId', id);
        if (playerError) throw playerError;
        const { error: fixtureError } = await supabase.from('fixtures').delete().or(`team1Id.eq.${id},team2Id.eq.${id}`);
        if (fixtureError) throw fixtureError;
        const { error } = await supabase.from('teams').delete().eq('id', id);
        if (error) throw error;
        setTeams(prev => prev.filter(t => t.id !== id));
        setPlayers(prev => prev.filter(p => p.teamId !== id));
        setFixtures(prev => prev.filter(f => f.team1Id !== id && f.team2Id !== id));
    };
    
    const addPlayer = async (player: Omit<Player, 'id'> & { photoFile?: File }): Promise<Player> => {
        const { photoFile, ...playerData } = player;
        let photoUrl = null;
        if (photoFile) {
            const filePath = `public/${playerData.name.replace(/\s+/g, '_')}_${Date.now()}`;
            photoUrl = await uploadFile(photoFile, 'player-photos', filePath);
        }
        const payload = {
            name: playerData.name,
            team_id: playerData.teamId,
            photo_url: photoUrl,
            role: playerData.role,
            stats: playerData.stats,
        };
        const { data, error } = await supabase.from('players').insert(payload).select();
        if (error) throw error;
        const newPlayer = data[0] as Player;
        setPlayers(prev => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name)));
        return newPlayer;
    };

    const updatePlayer = async (player: Player & { photoFile?: File }): Promise<Player> => {
        const { photoFile, id, ...playerData } = player;
        let newPhotoUrl = playerData.photoUrl;
        if (photoFile) {
            const filePath = `public/${playerData.name.replace(/\s+/g, '_')}_${Date.now()}`;
            newPhotoUrl = await uploadFile(photoFile, 'player-photos', filePath);
        } else if (playerData.photoUrl === null) {
            newPhotoUrl = null;
        }
        const payload = {
            name: playerData.name,
            team_id: playerData.teamId,
            photo_url: newPhotoUrl,
            role: playerData.role,
            stats: playerData.stats,
        };
        const { data, error } = await supabase.from('players').update(payload).eq('id', player.id).select();
        if (error) throw error;
        const updatedPlayer = data[0] as Player;
        setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
        return updatedPlayer;
    };

    const deletePlayer = async (id: number): Promise<void> => {
        const { error } = await supabase.from('players').delete().eq('id', id);
        if (error) throw error;
        setPlayers(prev => prev.filter(p => p.id !== id));
    };

    const addFixture = async (fixture: Omit<Fixture, 'id' | 'score'>): Promise<Fixture> => {
        const payload = {
            tournament_id: fixture.tournamentId,
            team1_id: fixture.team1Id,
            team2_id: fixture.team2Id,
            ground: fixture.ground,
            date_time: fixture.dateTime,
            status: fixture.status,
            referee: fixture.referee,
        };
        const { data, error } = await supabase.from('fixtures').insert(payload).select();
        if (error) throw error;
        const newFixture = data[0] as Fixture;
        setFixtures(prev => [...prev, newFixture]);
        return newFixture;
    };
    
    const updateFixture = async (fixture: Fixture): Promise<Fixture> => {
        const { id, ...fixtureData } = fixture;
        const payload = {
            tournament_id: fixtureData.tournamentId,
            team1_id: fixtureData.team1Id,
            team2_id: fixtureData.team2Id,
            ground: fixtureData.ground,
            date_time: fixtureData.dateTime,
            status: fixtureData.status,
            referee: fixtureData.referee,
            score: fixtureData.score,
        };
        const { data, error } = await supabase.from('fixtures').update(payload).eq('id', fixture.id).select();
        if (error) throw error;
        const updatedFixture = data[0] as Fixture;
        setFixtures(prev => prev.map(f => f.id === updatedFixture.id ? { ...updatedFixture, score: updatedFixture.score || undefined } : f));
        return updatedFixture;
    };

    const deleteFixture = async (id: number): Promise<void> => {
        const { error } = await supabase.from('fixtures').delete().eq('id', id);
        if (error) throw error;
        setFixtures(prev => prev.filter(f => f.id !== id));
    };
    
    const addSponsor = async (sponsor: Omit<Sponsor, 'id'> & { logoFile?: File }): Promise<Sponsor> => {
        const { logoFile, ...sponsorData } = sponsor;
        let logoUrl = null;
        if (logoFile) {
            const filePath = `public/${sponsorData.name.replace(/\s+/g, '_')}_${Date.now()}`;
            logoUrl = await uploadFile(logoFile, 'sponsor-logos', filePath);
        }
        const payload = {
            name: sponsorData.name,
            website: sponsorData.website,
            is_global: !!sponsorData.isGlobal,
            logo_url: logoUrl
        };
        const { data, error } = await supabase.from('sponsors').insert(payload).select();
        if (error) throw error;
        const newSponsor = data[0] as Sponsor;
        setSponsors(prev => [...prev, newSponsor].sort((a,b) => a.name.localeCompare(b.name)));
        return newSponsor;
    };

    const updateSponsor = async (sponsor: Sponsor & { logoFile?: File }): Promise<Sponsor> => {
        const { logoFile, id, ...sponsorData } = sponsor;
        let newLogoUrl = sponsorData.logoUrl;
        if (logoFile) {
            const filePath = `public/${sponsorData.name.replace(/\s+/g, '_')}_${Date.now()}`;
            newLogoUrl = await uploadFile(logoFile, 'sponsor-logos', filePath);
        } else if (sponsorData.logoUrl === null) {
            newLogoUrl = null;
        }
        const payload = {
            name: sponsorData.name,
            website: sponsorData.website,
            is_global: !!sponsorData.isGlobal,
            logo_url: newLogoUrl
        };
        const { data, error } = await supabase.from('sponsors').update(payload).eq('id', sponsor.id).select();
        if (error) throw error;
        const updatedSponsor = data[0] as Sponsor;
        setSponsors(prev => prev.map(s => s.id === updatedSponsor.id ? updatedSponsor : s));
        return updatedSponsor;
    };
    
    const deleteSponsor = async (id: number): Promise<void> => {
        const { error: sponsorLinkError } = await supabase.from('tournament_sponsors').delete().eq('sponsor_id', id);
        if (sponsorLinkError) throw sponsorLinkError;
        const { error } = await supabase.from('sponsors').delete().eq('id', id);
        if (error) throw error;
        setSponsors(prev => prev.filter(s => s.id !== id));
        setTournamentSponsors(prev => prev.filter(ts => ts.sponsor_id !== id));
    };

    const updateSponsorsForTournament = async (tournamentId: number, sponsorIds: number[]): Promise<void> => {
        const { error: deleteError } = await supabase.from('tournament_sponsors').delete().eq('tournament_id', tournamentId);
        if (deleteError) throw deleteError;
        if (sponsorIds.length > 0) {
            const links = sponsorIds.map(sponsor_id => ({ tournament_id: tournamentId, sponsor_id }));
            const { error: insertError } = await supabase.from('tournament_sponsors').insert(links);
            if (insertError) throw insertError;
        }
        const { data, error } = await supabase.from('tournament_sponsors').select('*');
        if (error) throw error;
        setTournamentSponsors(data as DbTournamentSponsor[]);
    };

    const bulkAddOrUpdateTeams = async (teamsData: CsvTeam[]): Promise<void> => {
        const upsertData = teamsData.map(({ name, shortName, division, logoUrl }) => ({
             name, 
             short_name: shortName, 
             division,
             logo_url: logoUrl || null
        }));
        const { error } = await supabase.from('teams').upsert(upsertData, { onConflict: 'name' });
        if (error) throw error;
        await fetchData();
    };

    const bulkAddOrUpdatePlayers = async (playersData: CsvPlayer[]): Promise<void> => {
        const teamMap = new Map(teams.map(t => [t.name, t.id]));
        const upsertData = playersData.map(p => {
            const teamId = teamMap.get(p.teamName);
            if (!teamId) throw new Error(`Team '${p.teamName}' not found for player '${p.name}'. Please create the team first or check for typos.`);
            return {
                name: p.name,
                team_id: teamId,
                role: p.role,
                photo_url: p.photoUrl || null,
                stats: {
                    matches: Number(p.matches) || 0,
                    aces: Number(p.aces) || 0,
                    kills: Number(p.kills) || 0,
                    blocks: Number(p.blocks) || 0,
                },
            };
        });
        const { error } = await supabase.from('players').upsert(upsertData, { onConflict: 'name' });
        if (error) throw error;
        await fetchData();
    };

    const value: SportsDataContextType = {
        tournaments, teams, players, fixtures, sponsors, loading, error,
        getTeamById, getTournamentById, getPlayersByTeam, getFixturesByTournament,
        getTournamentsByDivision, getGlobalSponsors, getSponsorsForTournament, getStandingsForTournament,
        addTournament, updateTournament, deleteTournament,
        addTeam, updateTeam, deleteTeam,
        addPlayer, updatePlayer, deletePlayer,
        addFixture, updateFixture, deleteFixture,
        addSponsor, updateSponsor, deleteSponsor,
        updateSponsorsForTournament,
        bulkAddOrUpdateTeams, bulkAddOrUpdatePlayers
    };

    return <SportsDataContext.Provider value={value}>{!loading && children}</SportsDataContext.Provider>;
};

export const useSports = (): SportsDataContextType => {
    const context = useContext(SportsDataContext);
    if (context === undefined) {
        throw new Error('useSports must be used within a SportsDataProvider');
    }
    return context;
};
