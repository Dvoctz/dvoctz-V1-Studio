import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './SupabaseContext';
// FIX: The User and Session types are not exported in some Supabase JS SDK versions,
// causing build errors. Removing the explicit import and using `any` as a fallback.
// import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

// FIX: Define User and Session as `any` as a fallback for compatibility.
type User = any;
type Session = any;

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    login: (email: string, password_one: string) => Promise<{ success: boolean; error: string | null }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const { supabase } = useSupabase();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSessionAndProfile = async () => {
            try {
                // FIX: Replaced async getSession with synchronous session() for older SDK compatibility.
                const session = supabase.auth.session();
                setSession(session);
                setCurrentUser(session?.user ?? null);
                if (session?.user) {
                    const { data: profile, error: profileError } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    
                    // A missing profile isn't a critical error (e.g., for a new user).
                    // We only throw if it's a real database error.
                    if (profileError && profileError.code !== 'PGRST116') {
                        throw profileError;
                    }

                    setUserProfile(profile ? {
                        id: profile.id,
                        fullName: profile.full_name,
                        role: profile.role,
                    } : null);
                } else {
                    setUserProfile(null);
                }
            } catch(error) {
                console.error("Error during initial session load:", error);
                // Ensure we clear state on error
                setSession(null);
                setCurrentUser(null);
                setUserProfile(null);
            } finally {
                // Crucially, always mark loading as false so the app can render.
                setLoading(false);
            }
        };

        getSessionAndProfile();

        // FIX: Adapted onAuthStateChange to match older SDK versions where the
        // subscription is returned in `data`, not `data.subscription`.
        const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setCurrentUser(session?.user ?? null);
            if (session?.user) {
                // Also be robust here, though it's less likely to cause a blank screen.
                try {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                     setUserProfile(profile ? {
                        id: profile.id,
                        fullName: profile.full_name,
                        role: profile.role,
                    } : null);
                } catch (error) {
                    console.error("Error fetching profile on auth state change:", error);
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [supabase]);

    const login = async (email: string, password_one: string) => {
        // FIX: Replaced `signInWithPassword` with `signIn` for compatibility with older SDKs.
        const { error } = await supabase.auth.signIn({ email, password: password_one });
        return { success: !error, error: error?.message || null };
    };

    const logout = async () => {
        // FIX: `signOut` is generally compatible, but this change aligns with other v1 API calls.
        await supabase.auth.signOut();
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, userProfile, session, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
