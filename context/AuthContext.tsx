import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './SupabaseContext';
// The User and Session types are often part of the Supabase client, but to avoid potential
// import issues with different SDK versions, we'll keep them flexible.
import type { UserProfile } from '../types';

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
                // Use the modern, async `getSession` for Supabase v2
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                
                setSession(session);
                setCurrentUser(session?.user ?? null);
                
                if (session?.user) {
                    const { data: profile, error: profileError } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    
                    if (profileError && profileError.code !== 'PGRST116') { // Ignore "user not found" errors
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
                setSession(null);
                setCurrentUser(null);
                setUserProfile(null);
            } finally {
                // This is critical to prevent a blank screen. It ensures the app always renders.
                setLoading(false);
            }
        };

        getSessionAndProfile();

        // Correctly destructure the subscription object for Supabase v2
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setCurrentUser(session?.user ?? null);
            if (session?.user) {
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
        // Use `signInWithPassword` for Supabase v2 email/password login
        const { error } = await supabase.auth.signInWithPassword({ email, password: password_one });
        return { success: !error, error: error?.message || null };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setUserProfile(null);
        setSession(null);
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
