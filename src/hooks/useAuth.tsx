import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { useAuth as useClerkAuth, useSignIn, useSignUp, useUser } from '@clerk/clerk-react';
import { useConvex } from 'convex/react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../convex/_generated/api';

type AuthResult = {
  error: Error | null;
  requiresEmailConfirmation?: boolean;
};

interface AuthContextType {
  user: { id: string; email: string | undefined } | null;
  session: unknown;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithGithub: () => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  verifyEmail: (code: string) => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
  pendingEmail: string | null;
  initializationError: Error | null;
  retryInitialization: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toAuthError = (error: unknown) => {
  if (error instanceof Error) return error;
  return new Error('Authentication failed. Please try again.');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const convex = useConvex();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [verificationSource, setVerificationSource] = useState<'signup' | 'signin' | null>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (isLoaded && userLoaded) {
      if (!isSignedIn || !clerkUser) {
        setLoading(false);
        return;
      }
      if (initialized) {
        setLoading(false);
        return;
      }
    }
  }, [isLoaded, userLoaded, isSignedIn, clerkUser, initialized]);

  useEffect(() => {
    if (isSignedIn && !initialized && !initializingRef.current && clerkUser && isLoaded && userLoaded) {
      initializingRef.current = true;
      (async () => {
        const fullName = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();
        try {
          await convex.mutation(api.users.initializeNewUser, { fullName: fullName || undefined });
          const uid = clerkUser.id;
          queryClient.invalidateQueries({ queryKey: ['profile', uid] });
          queryClient.invalidateQueries({ queryKey: ['categories', uid] });
          setInitialized(true);
        } catch (err) {
          console.error('Failed to initialize new user:', err);
          setInitializationError(err as Error);
          initializingRef.current = false;
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isSignedIn, initialized, clerkUser, isLoaded, userLoaded, convex, queryClient]);

  const user = clerkUser
    ? { id: clerkUser.id, email: clerkUser.emailAddresses?.[0]?.emailAddress }
    : null;

  const signUpFn = async (email: string, password: string, fullName?: string) => {
    try {
      if (!signUpLoaded) throw new Error('Sign up not loaded');

      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      if (fullName) {
        try {
          await signUp.update({
            firstName: fullName.split(' ')[0],
            lastName: fullName.split(' ').slice(1).join(' ') || undefined,
          });
        } catch {
          // Name update is optional
        }
      }

      if (result.status === 'missing_requirements') {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingEmail(email);
        setVerificationSource('signup');
        return { error: null, requiresEmailConfirmation: true };
      }

      if (result.createdSessionId && setActive) {
        await setActive({ session: result.createdSessionId });
      }

      return { error: null };
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      return { error: toAuthError(err) };
    }
  };

  const verifyEmail = async (code: string) => {
    try {
      if (verificationSource === 'signin') {
        if (!signInLoaded) throw new Error('Sign in not loaded');
        const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
        if (result.status === 'complete') {
          setPendingEmail(null);
          setVerificationSource(null);
          if (result.createdSessionId && setActive) {
            await setActive({ session: result.createdSessionId });
          }
          return { error: null };
        }
        throw new Error('Verification failed. Please try again.');
      }

      if (!signUpLoaded) throw new Error('Sign up not loaded');
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        setPendingEmail(null);
        setVerificationSource(null);
        if (result.createdSessionId && setActive) {
          await setActive({ session: result.createdSessionId });
        }
        return { error: null };
      }

      throw new Error('Verification failed. Please try again.');
    } catch (err: unknown) {
      console.error('Verification error:', err);
      return { error: toAuthError(err) };
    }
  };

  const signInFn = async (email: string, password: string) => {
    try {
      if (!signInLoaded) throw new Error('Sign in not loaded');

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        if (result.createdSessionId && setActive) {
          await setActive({ session: result.createdSessionId });
        }
        return { error: null };
      }

      const supported = result.supportedFirstFactors ?? [];
      const needsMfa = (result.supportedSecondFactors ?? []).length > 0;
      const needsEmailVerify = supported.some((f: { strategy: string }) => f.strategy === 'email_code');

      if (needsEmailVerify) {
        const emailFactor = supported.find((f: { strategy: string }) => f.strategy === 'email_code');
        if (emailFactor?.emailAddressId) {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
          setPendingEmail(email);
          setVerificationSource('signin');
          return { error: null, requiresEmailConfirmation: true };
        }
      }

      if (needsMfa) {
        return { error: new Error('Two-factor authentication is required. Please contact support.') };
      }

      return { error: new Error(`Sign in incomplete (${result.status}). Please try again.`) };
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      return { error: toAuthError(err) };
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!signInLoaded) throw new Error('Sign in not loaded');

      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: window.location.origin + '/dashboard',
        redirectUrlComplete: window.location.origin + '/dashboard',
      });

      return { error: null };
    } catch (err: unknown) {
      return { error: toAuthError(err) };
    }
  };

  const signInWithGithub = async () => {
    try {
      if (!signInLoaded) throw new Error('Sign in not loaded');

      await signIn.authenticateWithRedirect({
        strategy: 'oauth_github',
        redirectUrl: window.location.origin + '/dashboard',
        redirectUrlComplete: window.location.origin + '/dashboard',
      });

      return { error: null };
    } catch (err: unknown) {
      return { error: toAuthError(err) };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      if (!signInLoaded) throw new Error('Sign in not loaded');

      await signIn.create({
        identifier: email,
        strategy: 'email_link',
        redirectUrl: window.location.origin + '/dashboard',
      });

      return { error: null };
    } catch (err: unknown) {
      return { error: toAuthError(err) };
    }
  };

  const signOutFn = async () => {
    await clerkSignOut();
  };

  const resetPassword = async (email: string) => {
    try {
      if (!signInLoaded) throw new Error('Sign in not loaded');

      await signIn.create({
        identifier: email,
        strategy: 'reset_password_email_code',
      });

      return { error: null };
    } catch (err: unknown) {
      return { error: toAuthError(err) };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      if (!clerkUser) throw new Error('Not authenticated');
      await clerkUser.updatePassword({ newPassword: password, currentPassword: undefined });
      return { error: null };
    } catch (err: unknown) {
      return { error: toAuthError(err) };
    }
  };

  const deleteAccount = async () => {
    try {
      if (clerkUser) {
        await clerkUser.delete();
      }
      await convex.mutation(api.users.deleteAccount);
      await clerkSignOut();
      return { error: null };
    } catch (err: unknown) {
      console.error('Delete account error:', err);
      return { error: toAuthError(err) };
    }
  };

  const retryInitialization = () => {
    if (clerkUser && isSignedIn && !initialized) {
      setInitializationError(null);
      initializingRef.current = false;
      setLoading(true);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session: null,
      loading,
      signUp: signUpFn,
      signIn: signInFn,
      signInWithGoogle,
      signInWithGithub,
      signInWithMagicLink,
      signOut: signOutFn,
      resetPassword,
      updatePassword,
      verifyEmail,
      deleteAccount,
      pendingEmail,
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
