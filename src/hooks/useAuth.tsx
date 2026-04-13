import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthResult = {
  error: Error | null;
  requiresEmailConfirmation?: boolean;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithGithub: () => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getAuthRedirectUrl = (path = '/dashboard') => {
  const configuredBaseUrl = import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL?.trim();

  if (!configuredBaseUrl) {
    return undefined;
  }

  return new URL(path, configuredBaseUrl).toString();
};

const toAuthError = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message === 'Failed to fetch') {
      return new Error('Network error: Could not connect to Supabase. Check your internet connection, ad-blocker, or Supabase project URL.');
    }

    if (error.message.toLowerCase().includes('redirect')) {
      return new Error('Supabase rejected the authentication redirect URL. Add your app URL to the Supabase Auth URL allow list or set VITE_SUPABASE_AUTH_REDIRECT_URL.');
    }

    return error;
  }

  return new Error('Authentication failed. Please try again.');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const emailRedirectTo = getAuthRedirectUrl();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
          data: { full_name: fullName },
        },
      });
      
      if (error) {
        return { error: toAuthError(error) };
      }
      
      return {
        error: null,
        requiresEmailConfirmation: !data.session,
      };
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      return { error: toAuthError(err) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error: toAuthError(error) };
      }
      
      return { error: null };
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      return { error: toAuthError(err) };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectTo = getAuthRedirectUrl();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: redirectTo ? { redirectTo } : undefined,
      });

      return { error: error ? toAuthError(error) : null };
    } catch (err: unknown) {
      return { error: toAuthError(err) };
    }
  };

  const signInWithGithub = async () => {
    try {
      const redirectTo = getAuthRedirectUrl();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: redirectTo ? { redirectTo } : undefined,
      });

      return { error: error ? toAuthError(error) : null };
    } catch (err: unknown) {
      return { error: toAuthError(err) };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      const emailRedirectTo = getAuthRedirectUrl();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: emailRedirectTo ? { emailRedirectTo } : undefined,
      });

      return { error: error ? toAuthError(error) : null };
    } catch (err: unknown) {
      return { error: toAuthError(err) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectTo = getAuthRedirectUrl('/auth/reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? {
        redirectTo,
      } : undefined);

      return { error: error ? toAuthError(error) : null };
    } catch (err: unknown) {
      return { error: toAuthError(err) };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error ? toAuthError(error) : null };
    } catch (err: unknown) {
      return { error: toAuthError(err) };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithGithub,
      signInWithMagicLink,
      signOut,
      resetPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
