import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("AuthContext: initializing...");

        // Safety timeout to force loading=false if Supabase hangs
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn("AuthContext: Safety timeout triggered. Forcing loading=false.");
                setLoading(false);
            }
        }, 5000);

        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("AuthContext: getSession error", error);
                    throw error;
                }
                console.log("AuthContext: getSession success", session?.user?.id);
                setUser(session?.user ?? null);
            } catch (err) {
                console.error("AuthContext: Session check failed", err);
                setUser(null);
            } finally {
                setLoading(false);
                clearTimeout(safetyTimeout);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("AuthContext: onAuthStateChange", _event, session?.user?.id);
            setUser(session?.user ?? null);
            setLoading(false);
            if (_event === 'SIGNED_OUT') {
                setUser(null);
                // Optional: Clear data if needed
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) console.error("Error logging in:", error.message);
    };

    const signOut = async () => {
        // "Nuclear" Logout: Force Local Cleanup first
        try {
            localStorage.clear();
            sessionStorage.clear();
            await supabase.auth.signOut();
        } catch (e) {
            console.warn("SignOut error (ignored):", e);
        } finally {
            // Force reload to root to clear memory state
            window.location.href = '/';
        }
    };

    return (
        <AuthContext.Provider value={{ user, signInWithGoogle, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
