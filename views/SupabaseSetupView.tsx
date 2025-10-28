import React, { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
// FIX: The 'createAndSaveSupabaseClient' function does not exist in '../supabaseClient'.
// Replaced with the standard 'createClient' from the supabase library.
import { createClient } from '@supabase/supabase-js';

interface SupabaseSetupViewProps {
  onSetupComplete: (client: SupabaseClient) => void;
}

export const SupabaseSetupView: React.FC<SupabaseSetupViewProps> = ({ onSetupComplete }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!url || !anonKey) {
      setError('Both URL and Anon Key are required.');
      return;
    }
    setLoading(true);
    try {
        // FIX: Using 'createClient' directly to create a supabase client instance.
        const client = createClient(url, anonKey);
        onSetupComplete(client);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-text-primary font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-secondary rounded-xl shadow-lg">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-white">
            Supabase Configuration
            </h1>
            <p className="mt-2 text-text-secondary">
                Please provide your Supabase credentials to connect the app to your database.
            </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-text-secondary">
              Project URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              autoComplete="off"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project-ref.supabase.co"
              className="w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight"
            />
          </div>
          <div>
            <label htmlFor="anonKey" className="block text-sm font-medium text-text-secondary">
              Anon (Public) Key
            </label>
            <input
              id="anonKey"
              name="anonKey"
              type="text"
              autoComplete="off"
              required
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-primary mt-1 p-2 rounded-md text-text-primary border border-accent focus:ring-highlight focus:border-highlight"
            />
          </div>
          <div className="text-xs text-text-secondary text-center">
            You can find these values in your Supabase project dashboard under <br/> <code className="bg-primary p-1 rounded">Settings &gt; API</code>.
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-highlight hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-highlight transition-colors disabled:bg-gray-500 disabled:cursor-wait"
            >
              {loading ? 'Connecting...' : 'Save and Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
