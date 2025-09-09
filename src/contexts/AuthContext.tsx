import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { storeTokens, getTokens, clearTokens, isTokenExpired, debugTokens } from '../utils/tokenStorage';

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
  const bypassAuth = false; // Can be configured - set to false to enable auth in development

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

    // Get initial session with cookie restoration
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          console.warn('Supabase not initialized. Running without authentication.');
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        console.log('🚀 Initializing authentication...');
        
        // First try to restore session from cookies
        const cookieTokens = getTokens();
        if (cookieTokens && !isTokenExpired()) {
          console.log('✅ Found valid tokens in cookies, restoring session');
          debugTokens();
          
          // Set the session from cookies without waiting for Supabase
          if (mounted) {
            setUser({ id: cookieTokens.userId } as User); // Minimal user object
            setLoading(false);
          }
          return;
        } else if (cookieTokens && isTokenExpired()) {
          console.log('⏰ Tokens in cookies are expired, clearing them');
          clearTokens();
        } else {
          console.log('ℹ️ No valid tokens found in cookies');
        }
        
        // Fallback to Supabase session check
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        if (session) {
          console.log('✅ Found valid Supabase session, storing in cookies');
          storeSessionInCookies(session);
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

    // Set reasonable timeout for auth initialization
    const fallbackTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization taking too long, proceeding without auth');
        setLoading(false);
      }
    }, 10000); // Increased to 10 seconds for more reliable auth

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

        // Store session in cookies when signed in
        if (event === 'SIGNED_IN' && session) {
          storeSessionInCookies(session);
        }

        // Create or update user profile when user signs up or signs in
        if (event === 'SIGNED_IN' && session?.user && supabase) {
          try {
            const { error } = await supabase
              .from('profiles')
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
        .from('profiles')
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

    // Store session in cookies if available after sign up  
    if (data.session) {
      storeSessionInCookies(data.session);
      setSession(data.session);
      setUser(data.session.user);
    }

    return { error };
  };

  // Helper function to store session in cookies
  const storeSessionInCookies = (session: Session) => {
    try {
      if (session.access_token && session.refresh_token && session.user?.id) {
        const tokenData = {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          userId: session.user.id,
          expiresAt: session.expires_at || Math.floor(Date.now() / 1000) + 3600, // Default 1 hour if not provided
        };
        
        storeTokens(tokenData);
        console.log('✅ Session stored in cookies successfully');
      }
    } catch (error) {
      console.error('❌ Failed to store session in cookies:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase || bypassAuth) {
      return { error: { message: 'Authentication not available in demo mode' } };
    }
    
    console.log('Attempting sign in with email:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      console.log('Sign in successful:', data);
      
      // Store session in cookies immediately after successful sign in
      if (data.session) {
        storeSessionInCookies(data.session);
        // Also update the context state
        setSession(data.session);
        setUser(data.session.user);
      }
      
      return { error: null };
    } catch (err) {
      console.error('Sign in exception:', err);
      return { error: { message: 'Unexpected error during sign in' } };
    }
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
      console.log('🚪 Signing out user...');
      
      if (supabase && !bypassAuth) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase sign out error:', error);
        }
      }
      
      // Clear tokens from cookies
      clearTokens();
      
      // Clear state manually in case auth state change doesn't trigger
      setUser(null);
      setSession(null);
      
      console.log('✅ User signed out successfully');
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