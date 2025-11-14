export type View = 'home' | 'tournaments' | 'teams' | 'players' | 'tournament-detail' | 'team-detail' | 'admin' | 'login' | 'rules' | 'captain';

export type PlayerRole = 'Main Netty' | 'Left Front' | 'Right Front' | 'Net Center' | 'Back Center' | 'Left Back' | 'Right Back' | 'Right Netty' | 'Left Netty' | 'Service Man';

export interface Player {
  id: number;
  name: string;
  teamId: number;
  photoUrl: string | null;
  role: PlayerRole;
  stats?: {
    matches: number;
    aces: number;
    kills: number;
    blocks: number;
  };
}

export interface Club {
  id: number;
  name: string;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string | null;
  division: 'Division 1' | 'Division 2';
  clubId: number | null;
}

export interface Score {
  team1Score: number;
  team2Score: number;
  sets: { team1Points: number; team2Points: number; }[];
  resultMessage: string;
}

export interface Fixture {
  id: number;
  tournamentId: number;
  team1Id: number;
  team2Id: number;
  ground: string;
  dateTime: string;
  status: 'upcoming' | 'live' | 'completed';
  score?: Score;
  referee?: string;
}

export interface Tournament {
  id: number;
  name: string;
  division: 'Division 1' | 'Division 2';
}

export interface Sponsor {
  id: number;
  name: string;
  logoUrl: string | null;
  website: string;
}

export interface TeamStanding {
  teamId: number;
  teamName: string;
  logoUrl: string | null;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export type UserRole = 'user' | 'captain' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string | null;
  email?: string;
  role: UserRole;
}

export interface CaptainTeam {
  user_id: string;
  team_id: number;
}

export interface TournamentRoster {
  id: number;
  tournamentId: number;
  teamId: number;
  player_ids: number[];
}