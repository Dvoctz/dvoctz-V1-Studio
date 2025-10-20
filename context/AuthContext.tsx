import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// NOTE: In a real application, NEVER store passwords in plain text.
// This is for demonstration purposes only.
interface AdminUser {
    id: number;
    username: string;
    passwordHash: string; // Storing a "hash" for conceptual correctness
}

interface AuthContextType {
    currentUser: AdminUser | null;
    admins: AdminUser[];
    login: (username: string, password_one: string) => boolean;
    logout: () => void;
    registerAdmin: (username: string, password_one: string) => boolean;
    deleteAdmin: (id: number) => boolean;
    updateAdminPassword: (id: number, newPassword_one: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'dvoc_admins';
const SESSION_STORAGE_KEY = 'dvoc_admin_session';

// A simple mock hash function
const mockHash = (s: string) => `hashed_${s}`;

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        try {
            // Load admins from localStorage
            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            if (storedUsers) {
                setAdmins(JSON.parse(storedUsers));
            } else {
                // Initialize with a default admin if none exist
                const defaultAdmin: AdminUser = { id: 1, username: 'admin', passwordHash: mockHash('admin123') };
                setAdmins([defaultAdmin]);
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([defaultAdmin]));
            }

            // Check for an active session
            const sessionUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (sessionUser) {
                setCurrentUser(JSON.parse(sessionUser));
            }
        } catch (error) {
            console.error("Failed to initialize auth state:", error);
            // Clear potentially corrupted storage
            localStorage.removeItem(USERS_STORAGE_KEY);
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    }, []);

    const login = (username: string, password_one: string): boolean => {
        const user = admins.find(u => u.username === username);
        if (user && user.passwordHash === mockHash(password_one)) {
            setCurrentUser(user);
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    };

    const registerAdmin = (username: string, password_one: string): boolean => {
        if (admins.some(u => u.username === username)) {
            return false; // Username already exists
        }
        const newUser: AdminUser = {
            id: Date.now(),
            username,
            passwordHash: mockHash(password_one)
        };
        const updatedAdmins = [...admins, newUser];
        setAdmins(updatedAdmins);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedAdmins));
        return true;
    };

    const deleteAdmin = (id: number): boolean => {
        if (currentUser?.id === id) {
            console.error("Attempted to delete current user.");
            return false;
        }
        const updatedAdmins = admins.filter(admin => admin.id !== id);
        setAdmins(updatedAdmins);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedAdmins));
        return true;
    };
    
    const updateAdminPassword = (id: number, newPassword_one: string): boolean => {
        let userExists = false;
        const updatedAdmins = admins.map(admin => {
            if (admin.id === id) {
                userExists = true;
                return { ...admin, passwordHash: mockHash(newPassword_one) };
            }
            return admin;
        });

        if (!userExists) return false;

        setAdmins(updatedAdmins);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedAdmins));

        if (currentUser?.id === id) {
            const updatedCurrentUser = updatedAdmins.find(admin => admin.id === id);
            if (updatedCurrentUser) {
                setCurrentUser(updatedCurrentUser);
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedCurrentUser));
            }
        }
        
        return true;
    };


    return (
        <AuthContext.Provider value={{ currentUser, admins, login, logout, registerAdmin, deleteAdmin, updateAdminPassword }}>
            {children}
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