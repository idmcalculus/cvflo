import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase, AuthUser } from '../lib/supabase';
import { useCVStore } from '../store/cvStore';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; data: {user: AuthUser | null} | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
  deleteAccount: () => Promise<{ error: AuthError | null }>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const clearAllData = useCVStore(state => state.clearAllData);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ? {
            id: session.user.id,
            email: session.user.email,
            emailConfirmed: session.user.user_metadata?.email_verified === true,
          } : null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Clear CV data when user signs out or session expires
        if (event === 'SIGNED_OUT' || !session) {
          clearAllData();
          queryClient.clear();
        }
        
        setSession(session);
        setUser(session?.user ? {
          id: session.user.id,
          email: session.user.email,
          emailConfirmed: session.user.user_metadata?.email_verified === true,
        } : null);
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      // Always sign out after signup to prevent auto-login before email confirmation
      if (!error && data.user) {
        await supabase.auth.signOut();
      }
      
      return { error, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as AuthError, data: null };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      // Clear CV data from store and localStorage on logout
      clearAllData();
      
      // Clear React Query cache to prevent data leakage between users
      queryClient.clear();
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as AuthError };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error as AuthError };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      return { error: error as AuthError };
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      
      // Delete the user account from Supabase
      const { error } = await supabase.rpc('delete_user_account');
      
      if (error) {
        console.error('Delete account error:', error);
        return { error };
      }
      
      // Sign out the user after successful deletion
      await supabase.auth.signOut();
      
      return { error: null };
    } catch (error) {
      console.error('Delete account error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        return null;
      }
      return session.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    resendConfirmation,
    deleteAccount,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};