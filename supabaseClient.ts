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

const SUPABASE_URL_KEY = 'dvoc_supabase_url';
const SUPABASE_ANON_KEY = 'dvoc_supabase_anon_key';


/**
 * Initializes the Supabase client.
 * It first checks for Vite environment variables, then falls back to localStorage.
 * This supports both build-time configuration and user-provided credentials in the browser.
 * @returns A SupabaseClient instance or null if credentials are not found.
 */
export const initializeSupabase = (): SupabaseClient | null => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem(SUPABASE_URL_KEY);
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem(SUPABASE_ANON_KEY);

    if (supabaseUrl && supabaseAnonKey) {
        return createClient(supabaseUrl, supabaseAnonKey);
    }
    
    return null;
}

/**
 * Creates a new Supabase client and saves the credentials to localStorage.
 * This is used by the setup view to configure the app on the fly.
 * @param url - The Supabase project URL.
 * @param key - The Supabase anon key.
 * @returns A new SupabaseClient instance.
 */
export const createAndSaveSupabaseClient = (url: string, key: string): SupabaseClient => {
    localStorage.setItem(SUPABASE_URL_KEY, url);
    localStorage.setItem(SUPABASE_ANON_KEY, key);
    return createClient(url, key);
};


// Helper types for Supabase data to match app types
// The Supabase client automatically maps snake_case (in DB) to camelCase (in JS)
export type DbTournament = Omit<Tournament, 'id'> & { id: number };
export type DbTeam = Omit<Team, 'id'> & { id: number };
export type DbPlayer = Omit<Player, 'id'> & { id: number };
export type DbFixture = Omit<Fixture, 'id' | 'score'> & { id: number; score: Score | null };
export type DbSponsor = Omit<Sponsor, 'id'> & { id: number };
export type DbTournamentSponsor = { tournament_id: number; sponsor_id: number; };