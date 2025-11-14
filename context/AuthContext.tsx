import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabase } from './SupabaseContext';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

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
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            setSession(session);
            setCurrentUser(session?.user ?? null);
            if (session?.user) {
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
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        };

        getSessionAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setCurrentUser(session?.user ?? null);
            if (session?.user) {
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
            } else {
                setUserProfile(null);
            }
            if (_event === 'SIGNED_IN') setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [supabase]);

    const login = async (email: string, password_one: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: password_one });
        return { success: !error, error: error?.message || null };
    };

    const logout = async () => {
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
