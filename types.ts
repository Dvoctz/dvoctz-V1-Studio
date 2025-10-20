export type View = 'home' | 'tournaments' | 'teams' | 'players' | 'tournament-detail' | 'team-detail' | 'admin' | 'login';

export interface Player {
  id: number;
  name: string;
  teamId: number;
  photoUrl: string;
  role: 'Setter' | 'Outside Hitter' | 'Middle Blocker' | 'Opposite Hitter' | 'Libero';
  stats?: {
    matches: number;
    aces: number;
    kills: number;
    blocks: number;
  };
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  division: 'Division 1' | 'Division 2';
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
  logoUrl: string;
  website: string;
}

export interface TeamStanding {
  teamId: number;
  teamName: string;
  logoUrl: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
