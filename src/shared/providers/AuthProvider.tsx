import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { ENV } from '@/config/env';
import { AppError, getErrorMessage, handleError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabaseClient';
import type { ProfileRow } from '@/shared/types/database';

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  clearError: () => void;
  errorMessage: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: ProfileRow | null;
  refreshProfile: () => Promise<void>;
  session: Session | null;
  signIn: (credentials: SignInCredentials) => Promise<boolean>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (activeSession: Session | null): Promise<void> => {
    if (!activeSession?.user.id) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeSession.user.id)
        .maybeSingle();

      if (error) {
        throw new AppError(error.message, 'AuthProvider.fetchProfile', error);
      }

      setProfile(data);
    } catch (error) {
      handleError(error, 'AuthProvider.fetchProfile');
      setProfile(null);
      setErrorMessage(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession(): Promise<void> {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw new AppError(error.message, 'AuthProvider.bootstrapSession', error);
        }

        if (isMounted) {
          setSession(data.session);
          await fetchProfile(data.session);
        }
      } catch (error) {
        handleError(error, 'AuthProvider.bootstrapSession');
        if (isMounted) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void bootstrapSession();

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void fetchProfile(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const clearError = useCallback((): void => {
    setErrorMessage(null);
  }, []);

  const signIn = useCallback(async (credentials: SignInCredentials): Promise<boolean> => {
    setErrorMessage(null);

    if (!ENV.hasSupabaseConfig) {
      const error = new AppError(
        'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY',
        'AuthProvider.signIn'
      );

      handleError(error, 'AuthProvider.signIn');
      setErrorMessage(error.message);
      return false;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (error) {
        throw new AppError(error.message, 'AuthProvider.signIn', error);
      }

      return true;
    } catch (error) {
      handleError(error, 'AuthProvider.signIn');
      setErrorMessage(getErrorMessage(error));
      return false;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new AppError(error.message, 'AuthProvider.signOut', error);
      }

      setProfile(null);
    } catch (error) {
      handleError(error, 'AuthProvider.signOut');
      setErrorMessage(getErrorMessage(error));
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    await fetchProfile(session);
  }, [fetchProfile, session]);

  const value = useMemo(() => {
    return {
      clearError,
      errorMessage,
      isAuthenticated: Boolean(session),
      isLoading,
      profile,
      refreshProfile,
      session,
      signIn,
      signOut,
    };
  }, [clearError, errorMessage, isLoading, profile, refreshProfile, session, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
