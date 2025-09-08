import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signInWithGoogle: () => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if we're in development mode with auth bypass
  const isDevelopment = import.meta.env.DEV;
  const bypassAuth = isDevelopment; // Can be configured

  useEffect(() => {
    let mounted = true;

    // If in development with auth bypass, skip all auth logic
    if (bypassAuth) {
      console.log('Auth bypass enabled for development');
      if (mounted) {
        setLoading(false);
        setUser(null);
        setSession(null);
      }
      return () => {
        mounted = false;
      };
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          console.warn('Supabase not initialized. Running without authentication.');
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Reduce timeout to prevent navigation loops and add mounted check
    const fallbackTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization taking too long, proceeding without auth');
        setLoading(false);
      }
    }, 2000); // Reduced from 5000 to 2000ms

    initializeAuth();

    // Listen for auth changes (only if auth is not bypassed)
    const subscription = !bypassAuth && supabase ? supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setLoading(false);
          return;
        }

        setLoading(false);

        // Create or update user profile when user signs up or signs in
        if (event === 'SIGNED_IN' && session?.user && supabase) {
          try {
            const { error } = await supabase
              .from('user_profiles')
              .upsert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || null,
                updated_at: new Date().toISOString(),
              })
              .select();

            if (error) {
              console.error('Error updating user profile:', error);
            }
          } catch (error) {
            console.error('Error creating user profile:', error);
          }
        }
      }
    ) : null;

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      if (subscription) {
        subscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase || bypassAuth) {
      return { error: { message: 'Authentication not available in demo mode' } };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase || bypassAuth) {
      return { error: { message: 'Authentication not available in demo mode' } };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    if (!supabase || bypassAuth) {
      return { error: { message: 'Authentication not available in demo mode' } };
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    
    return { data, error };
  };

  const signOut = async () => {
    try {
      if (supabase && !bypassAuth) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase sign out error:', error);
        }
      }
      // Clear state manually in case auth state change doesn't trigger
      setUser(null);
      setSession(null);
      setLoading(false);
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear state even on error
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};