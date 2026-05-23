import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';

type AuthResult = {
  error: Error | null;
  requiresEmailConfirmation?: boolean;
};

interface AuthContextType {
  user: { id: string; email: string } | null;
  sessionId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<AuthResult>;
  exchangeGoogleCredential: (credential: string) => Promise<AuthResult>;
  exchangeGitHubCode: (code: string) => Promise<AuthResult>;
  initializationError: Error | null;
  retryInitialization: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'wealthwise_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const convex = useConvex();
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setUser(null);
      setLoading(false);
      return;
    }

    convex.query(api.auth.getCurrentUser, { sessionId: sessionId as any })
      .then((result) => {
        if (result) {
          setUser({ id: result.id, email: result.email });
        } else {
          setSessionId(null);
          localStorage.removeItem(SESSION_KEY);
          setUser(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to verify session:', err);
        setSessionId(null);
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
        setLoading(false);
      });
  }, [sessionId, convex]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<AuthResult> => {
    try {
      const result = await convex.mutation(api.auth.signUp, {
        email,
        password,
        fullName,
      }) as { userId: string; sessionId: string };

      localStorage.setItem(SESSION_KEY, result.sessionId);
      setSessionId(result.sessionId);
      setUser({ id: result.userId, email });

      return { error: null };
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      return { error: err instanceof Error ? err : new Error('Sign up failed. Please try again.') };
    }
  }, [convex]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await convex.mutation(api.auth.signIn, {
        email,
        password,
      }) as { userId: string; sessionId: string };

      localStorage.setItem(SESSION_KEY, result.sessionId);
      setSessionId(result.sessionId);
      setUser({ id: result.userId, email });

      return { error: null };
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      return { error: err instanceof Error ? err : new Error('Invalid email or password.') };
    }
  }, [convex]);

  const signOut = useCallback(async () => {
    if (sessionId) {
      try {
        await convex.mutation(api.auth.signOut, { sessionId: sessionId as any });
      } catch {
        // Ignore errors during sign out
      }
    }
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setUser(null);
  }, [convex, sessionId]);

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    try {
      if (!sessionId) throw new Error('Not authenticated');
      await convex.mutation(api.users.deleteAccount, { sessionId: sessionId as any });
      localStorage.removeItem(SESSION_KEY);
      setSessionId(null);
      setUser(null);
      return { error: null };
    } catch (err: unknown) {
      console.error('Delete account error:', err);
      return { error: err instanceof Error ? err : new Error('Failed to delete account.') };
    }
  }, [convex, sessionId]);

  const exchangeGoogleCredential = useCallback(async (credential: string): Promise<AuthResult> => {
    try {
      const result = await convex.action(api.auth.exchangeGoogleCredential, { credential }) as { userId: string; sessionId: string };
      localStorage.setItem(SESSION_KEY, result.sessionId);
      setSessionId(result.sessionId);
      setUser({ id: result.userId, email: '' });
      return { error: null };
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      return { error: err instanceof Error ? err : new Error('Google sign-in failed.') };
    }
  }, [convex]);

  const exchangeGitHubCode = useCallback(async (code: string): Promise<AuthResult> => {
    try {
      const result = await convex.action(api.auth.exchangeGitHubCode, { code }) as { userId: string; sessionId: string };
      localStorage.setItem(SESSION_KEY, result.sessionId);
      setSessionId(result.sessionId);
      setUser({ id: result.userId, email: '' });
      return { error: null };
    } catch (err: unknown) {
      console.error('GitHub sign-in error:', err);
      return { error: err instanceof Error ? err : new Error('GitHub sign-in failed.') };
    }
  }, [convex]);

  const retryInitialization = useCallback(() => {
    if (sessionId) {
      setLoading(true);
      setInitializationError(null);
    }
  }, [sessionId]);

  return (
    <AuthContext.Provider value={{
      user,
      sessionId,
      loading,
      signIn,
      signUp,
      signOut,
      deleteAccount,
      exchangeGoogleCredential,
      exchangeGitHubCode,
      initializationError,
      retryInitialization,
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
