
export type View = 'home' | 'tournaments' | 'clubs' | 'players' | 'transfers' | 'tournament-detail' | 'team-detail' | 'admin' | 'login' | 'rules' | 'club-detail' | 'player-detail';

export type PlayerRole = 'Main Netty' | 'Left Front' | 'Right Front' | 'Net Center' | 'Back Center' | 'Left Back' | 'Right Back' | 'Right Netty' | 'Left Netty' | 'Service Man';

export interface Player {
  id: number;
  name: string;
  teamId: number | null;
  clubId: number | null; // Added to support Club Pools
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
  logoUrl: string | null;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string | null;
  division: 'Division 1' | 'Division 2';
  clubId: number;
}

export interface Score {
  team1Score: number;
  team2Score: number;
  sets: { 
    team1Points: number; 
    team2Points: number; 
    winner?: 'team1' | 'team2'; // Explicit winner for tied sets (service rule)
  }[];
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
  stage?: 'quarter-final' | 'semi-final' | 'final';
  manOfTheMatchId?: number | null;
}

export interface Tournament {
  id: number;
  name: string;
  division: 'Division 1' | 'Division 2';
  phase?: 'round-robin' | 'knockout' | 'completed';
}

export interface Sponsor {
  id: number;
  name: string;
  logoUrl: string | null;
  website: string;
  showInFooter: boolean;
}

export interface TournamentSponsor {
  tournament_id: number;
  sponsor_id: number;
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

export type UserRole = 'user' | 'admin' | 'fixture_manager' | 'team_manager' | 'content_editor';

export interface UserProfile {
  id: string;
  fullName: string | null;
  email?: string;
  role: UserRole;
}

export interface PlayerTransfer {
  id: number;
  playerId: number;
  fromTeamId: number | null;
  toTeamId: number | null;
  transferDate: string;
  notes: string | null;
  isAutomated: boolean;
}

export type NoticeLevel = 'Information' | 'Warning' | 'Urgent';

export interface Notice {
  id: number;
  title: string;
  message: string;
  level: NoticeLevel;
  expiresAt: string;
  createdAt: string;
}

export interface TournamentRoster {
  id: number;
  tournamentId: number;
  teamId: number;
  playerId: number;
}

export interface TournamentTeam {
  tournamentId: number;
  teamId: number;
}

export interface TournamentAward {
  id: number;
  tournamentId: number;
  awardName: string;
  recipientName: string;
  playerId: number | null; // Null if recipient is not a registered player (e.g. Referee, Sponsor)
  imageUrl: string | null;
}