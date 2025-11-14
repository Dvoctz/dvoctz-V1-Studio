// THIS FILE IS NO LONGER IN USE.
// ALL DATA IS NOW FETCHED FROM THE SUPABASE DATABASE.
// You can use this file for reference or safely delete it.

import type { Tournament, Team, Player, Fixture, Sponsor } from '../types';

export const sponsors: Sponsor[] = [
  { id: 1, name: "Pro-Spike Gear", logoUrl: "https://picsum.photos/seed/sponsor1/200/100", website: "#" },
  { id: 2, name: "Apex Performance", logoUrl: "https://picsum.photos/seed/sponsor2/200/100", website: "#" },
  { id: 3, name: "Quantum Energy", logoUrl: "https://picsum.photos/seed/sponsor3/200/100", website: "#" },
  { id: 4, name: "Strive Athletic Wear", logoUrl: "https://picsum.photos/seed/sponsor4/200/100", website: "#" },
  { id: 5, name: "City Bank", logoUrl: "https://picsum.photos/seed/sponsor5/200/100", website: "#" },
  { id: 6, name: "Horizon Motors", logoUrl: "https://picsum.photos/seed/sponsor6/200/100", website: "#" },
];

export const tournaments: Tournament[] = [
  { id: 1, name: 'Champions Cup 2024', division: 'Division 1' },
  { id: 2, name: 'National League Season 5', division: 'Division 1' },
  { id: 3, name: 'Challenger Series 2024', division: 'Division 2' },
  { id: 4, name: 'Rising Stars Invitational', division: 'Division 2' },
];

// FIX: Added `clubId: null` to all team objects to satisfy the 'Team' type.
export const teams: Team[] = [
  // Division 1
  { id: 1, name: 'Stallions', shortName: 'STL', logoUrl: 'https://picsum.photos/seed/team1/100/100', division: 'Division 1', clubId: null },
  { id: 2, name: 'Panthers', shortName: 'PAN', logoUrl: 'https://picsum.photos/seed/team2/100/100', division: 'Division 1', clubId: null },
  { id: 3, name: 'Titans', shortName: 'TTN', logoUrl: 'https://picsum.photos/seed/team3/100/100', division: 'Division 1', clubId: null },
  { id: 4, name: 'Wolverines', shortName: 'WLV', logoUrl: 'https://picsum.photos/seed/team4/100/100', division: 'Division 1', clubId: null },
  // Division 2
  { id: 5, name: 'Cobras', shortName: 'COB', logoUrl: 'https://picsum.photos/seed/team5/100/100', division: 'Division 2', clubId: null },
  { id: 6, name: 'Eagles', shortName: 'EAG', logoUrl: 'https://picsum.photos/seed/team6/100/100', division: 'Division 2', clubId: null },
  { id: 7, name: 'Sharks', shortName: 'SHK', logoUrl: 'https://picsum.photos/seed/team7/100/100', division: 'Division 2', clubId: null },
  { id: 8, name: 'Rhinos', shortName: 'RHI', logoUrl: 'https://picsum.photos/seed/team8/100/100', division: 'Division 2', clubId: null },
];

export const players: Player[] = [
  // Team 1
  { id: 1, name: 'Alex Johnson', teamId: 1, photoUrl: 'https://picsum.photos/seed/player1/200/200', role: 'Main Netty', stats: { matches: 50, aces: 30, kills: 40, blocks: 15 } },
  { id: 2, name: 'Ben Carter', teamId: 1, photoUrl: 'https://picsum.photos/seed/player2/200/200', role: 'Left Front', stats: { matches: 45, aces: 20, kills: 250, blocks: 30 } },
  // Team 2
  { id: 3, name: 'Chris Davis', teamId: 2, photoUrl: 'https://picsum.photos/seed/player3/200/200', role: 'Right Front', stats: { matches: 60, aces: 10, kills: 180, blocks: 120 } },
  { id: 4, name: 'David Evans', teamId: 2, photoUrl: 'https://picsum.photos/seed/player4/200/200', role: 'Back Center', stats: { matches: 55, aces: 5, kills: 10, blocks: 5 } },
  // Team 3
  { id: 5, name: 'Ethan Foster', teamId: 3, photoUrl: 'https://picsum.photos/seed/player5/200/200', role: 'Net Center', stats: { matches: 40, aces: 45, kills: 220, blocks: 25 } },
  // Team 4
  { id: 6, name: 'Frank Green', teamId: 4, photoUrl: 'https://picsum.photos/seed/player6/200/200', role: 'Left Front', stats: { matches: 52, aces: 28, kills: 280, blocks: 40 } },
  // Team 5
  { id: 7, name: 'George Harris', teamId: 5, photoUrl: 'https://picsum.photos/seed/player7/200/200', role: 'Main Netty', stats: { matches: 30, aces: 22, kills: 30, blocks: 10 } },
  // Team 6
  { id: 8, name: 'Henry Irving', teamId: 6, photoUrl: 'https://picsum.photos/seed/player8/200/200', role: 'Right Front', stats: { matches: 35, aces: 15, kills: 150, blocks: 90 } },
  // Team 7
  { id: 9, name: 'Ian Jackson', teamId: 7, photoUrl: 'https://picsum.photos/seed/player9/200/200', role: 'Left Front', stats: { matches: 28, aces: 18, kills: 190, blocks: 20 } },
  // Team 8
  { id: 10, name: 'Jack King', teamId: 8, photoUrl: 'https://picsum.photos/seed/player10/200/200', role: 'Back Center', stats: { matches: 32, aces: 8, kills: 5, blocks: 3 } },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date();
lastWeek.setDate(lastWeek.getDate() - 7);
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);


export const fixtures: Fixture[] = [
  // Tournament 1 (Division 1)
  { id: 1, tournamentId: 1, team1Id: 1, team2Id: 2, ground: 'Central Arena', dateTime: yesterday.toISOString(), status: 'completed', referee: 'John Smith', score: { team1Score: 2, team2Score: 1, sets: [{ team1Points: 25, team2Points: 23 }, { team1Points: 22, team2Points: 25 }, { team1Points: 15, team2Points: 10 }], resultMessage: 'Stallions won 2-1' } },
  { id: 2, tournamentId: 1, team1Id: 3, team2Id: 4, ground: 'North Court', dateTime: new Date().toISOString(), status: 'live', referee: 'Jane Doe', score: { team1Score: 1, team2Score: 0, sets: [{ team1Points: 25, team2Points: 20 }, { team1Points: 10, team2Points: 12 }], resultMessage: 'Titans lead 1-0' } },
  { id: 3, tournamentId: 1, team1Id: 1, team2Id: 3, ground: 'Central Arena', dateTime: tomorrow.toISOString(), status: 'upcoming', referee: 'Mike Brown' },
  { id: 4, tournamentId: 1, team1Id: 2, team2Id: 4, ground: 'West Court', dateTime: twoDaysAgo.toISOString(), status: 'completed', referee: 'Lisa Ray', score: { team1Score: 1, team2Score: 1, sets: [{ team1Points: 25, team2Points: 23 }, { team1Points: 23, team2Points: 25 }], resultMessage: 'Match drawn 1-1' } },
  // Tournament 2 (Division 1)
  { id: 5, tournamentId: 2, team1Id: 1, team2Id: 4, ground: 'South Court', dateTime: lastWeek.toISOString(), status: 'completed', referee: 'Emily White', score: { team1Score: 0, team2Score: 2, sets: [{ team1Points: 18, team2Points: 25 }, { team1Points: 20, team2Points: 25 }], resultMessage: 'Wolverines won 2-0' } },
  { id: 6, tournamentId: 2, team1Id: 2, team2Id: 3, ground: 'West Court', dateTime: nextWeek.toISOString(), status: 'upcoming' },
  // Tournament 3 (Division 2)
  { id: 7, tournamentId: 3, team1Id: 5, team2Id: 6, ground: 'Regional Sports Hall', dateTime: yesterday.toISOString(), status: 'completed', referee: 'Chris Green', score: { team1Score: 2, team2Score: 0, sets: [{ team1Points: 25, team2Points: 15 }, { team1Points: 25, team2Points: 19 }], resultMessage: 'Cobras won 2-0' } },
  { id: 8, tournamentId: 3, team1Id: 7, team2Id: 8, ground: 'City Gymnasium', dateTime: tomorrow.toISOString(), status: 'upcoming' },
  // Tournament 4 (Division 2)
  { id: 10, tournamentId: 4, team1Id: 6, team2Id: 7, ground: 'Community Hall', dateTime: lastWeek.toISOString(), status: 'completed', referee: 'Sarah Wilson', score: { team1Score: 1, team2Score: 2, sets: [{ team1Points: 25, team2Points: 21 }, { team1Points: 23, team2Points: 25 }, { team1Points: 12, team2Points: 15 }], resultMessage: 'Sharks won 2-1' } },
];
