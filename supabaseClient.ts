
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Fixture, Player, Team, Tournament, Sponsor, Score } from './types';

// These variables are injected by the platform during the build process.
// For local development, you would need a .env file, but for deployment,
// you will set these in your hosting provider's dashboard.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Check if the variables are set, and if not, throw an error to fail fast.
// This prevents the app from running in a broken state.
if (!supabaseUrl || !supabaseAnonKey) {
    // This provides a clear error message in the console if the credentials are missing.
    const message = "Supabase URL and Anon Key are required. Make sure to set SUPABASE_URL and SUPABASE_ANON_KEY as environment variables in your deployment platform's settings.";
    
    // In a development environment, you might see this error if you haven't set up your variables.
    // For the user, this will be a reminder to configure their hosting service.
    // We will render this message to the screen to make it obvious.
    document.body.innerHTML = `<div style="font-family: sans-serif; padding: 2rem; color: white; background-color: #1a202c; height: 100vh;"><h1>Configuration Error</h1><p>${message}</p></div>`;
    
    throw new Error(message);
}

// Create and export the Supabase client as a singleton.
// Any module that imports `supabase` will get this same, pre-configured instance.
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);


// Helper types for Supabase data to match app types
// The Supabase client automatically maps snake_case (in DB) to camelCase (in JS)
export type DbTournament = Omit<Tournament, 'id'> & { id: number };
export type DbTeam = Omit<Team, 'id'> & { id: number };
export type DbPlayer = Omit<Player, 'id'> & { id: number };
export type DbFixture = Omit<Fixture, 'id' | 'score'> & { id: number; score: Score | null };
export type DbSponsor = Omit<Sponsor, 'id'> & { id: number };
