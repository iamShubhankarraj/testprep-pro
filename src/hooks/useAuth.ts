'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setAuthState({
          user: session?.user ?? null,
          loading: false,
          error: null,
        });
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error: 'Failed to get session',
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          loading: false,
          error: null,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data } = await supabase.auth.signUp({
        email,
        password,
      });

      setAuthState(prev => ({
        ...prev,
        loading: false,
        user: data.user,
      }));

      return { user: data.user };
    } catch {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Sign up failed',
      }));
      return { error: 'Sign up failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setAuthState(prev => ({
        ...prev,
        loading: false,
        user: data.user,
      }));

      return { user: data.user };
    } catch {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Sign in failed',
      }));
      return { error: 'Sign in failed' };
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      await supabase.auth.signOut();
      
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });

      return { success: true };
    } catch {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Sign out failed',
      }));
      return { error: 'Sign out failed' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: true };
    } catch {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Password reset failed',
      }));
      return { error: 'Password reset failed' };
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
};
