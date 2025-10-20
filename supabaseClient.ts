// FIX: Manually define `import.meta.env` to resolve TypeScript errors.
// This is a workaround for environments where Vite's client types are not automatically available,
// which was causing "Cannot find type definition file for 'vite/client'" and subsequent errors.
declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Fixture, Player, Team, Tournament, Sponsor, Score } from './types';

// Vite requires environment variables to be prefixed with VITE_ to be exposed to the client.
// We use import.meta.env to access them, which is the standard way in Vite.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the variables are set, and if not, throw an error to fail fast.
// This prevents the app from running in a broken state.
if (!supabaseUrl || !supabaseAnonKey) {
    // This provides a clear error message in the console if the credentials are missing.
    const message = "Supabase URL and Anon Key are required. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment variables in your deployment platform's settings.";
    
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
