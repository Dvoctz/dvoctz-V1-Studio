
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Fixture, Player, Team, Tournament, Sponsor, Score, Club, TournamentAward } from './types';

// --- IMPORTANT ACTION REQUIRED ---
// Replace these placeholder values with your actual Supabase credentials.
// You can find these in your Supabase project dashboard under Settings > API.
// FIX: Explicitly typing as `string` prevents TypeScript from inferring a narrow literal type,
// which would cause a compile-time error in the comparison check below. This preserves the
// developer guardrail that checks for placeholder credentials.
const supabaseUrl: string = "https://qqtohsammqrebntgnowr.supabase.co";
const supabaseAnonKey: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxdG9oc2FtbXFyZWJudGdub3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTQ0MDksImV4cCI6MjA3NjUzMDQwOX0.zJyNgQRiLyF_vR7-JGHBauOGuG8vvLfXP90pUv0kPOM";


/**
 * Initializes the Supabase client.
 * It uses the hardcoded credentials defined above.
 * Throws an error during development if credentials are still placeholders.
 * @returns A SupabaseClient instance.
 */
export const initializeSupabase = (): SupabaseClient => {
    if (supabaseUrl === "YOUR_SUPABASE_URL" || supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY") {
        throw new Error("Supabase credentials are not configured. Please edit supabaseClient.ts and replace the placeholder values.");
    }
    return createClient(supabaseUrl, supabaseAnonKey);
}


// Helper types for Supabase data to match app types
// The Supabase client automatically maps snake_case (in DB) to camelCase (in JS)
export type DbTournament = Omit<Tournament, 'id'> & { id: number };
export type DbClub = Omit<Club, 'id'> & { id: number };
export type DbTeam = Omit<Team, 'id'> & { id: number };
export type DbPlayer = Omit<Player, 'id'> & { id: number };
export type DbFixture = Omit<Fixture, 'id' | 'score'> & { id: number; score: Score | null; man_of_the_match_id?: number | null };
export type DbSponsor = Omit<Sponsor, 'id'> & { id: number };
export type DbPlayerTransfer = {
    id: number;
    player_id: number;
    from_team_id: number | null;
    to_team_id: number | null;
    transfer_date: string;
    notes: string | null;
    is_automated: boolean;
};
export type DbTournamentRoster = {
    id: number;
    tournament_id: number;
    team_id: number;
    player_id: number;
};
export type DbTournamentTeam = {
    tournament_id: number;
    team_id: number;
};
export type DbTournamentAward = {
    id: number;
    tournament_id: number;
    award_name: string;
    recipient_name: string;
    player_id: number | null;
    image_url: string | null;
};