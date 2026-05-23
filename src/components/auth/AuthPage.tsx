import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Wallet, ArrowLeft, ShieldCheck, Chrome, Github } from 'lucide-react';

export function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithGithub, verifyEmail, pendingEmail, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    if (authSuccess && user) {
      navigate('/dashboard');
    }
  }, [authSuccess, user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error, requiresEmailConfirmation } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else if (requiresEmailConfirmation) {
      setShowVerification(true);
      toast.success('Verification code sent to your email');
    } else {
      toast.success('Welcome back!');
      setAuthSuccess(true);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    const { error, requiresEmailConfirmation } = await signUp(email, password, fullName);

    if (error) {
      toast.error(error.message);
    } else if (requiresEmailConfirmation) {
      setShowVerification(true);
      toast.success('Verification code sent to your email');
    } else {
      toast.success('Account created!');
      setAuthSuccess(true);
    }
    setIsLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (verificationCode.length < 6) {
      toast.error('Please enter the full verification code');
      return;
    }

    setIsLoading(true);
    const { error } = await verifyEmail(verificationCode);

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else {
      toast.success('Email verified! Welcome!');
      setAuthSuccess(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGithub();
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  const handleBackToSignUp = () => {
    setShowVerification(false);
    setVerificationCode('');
  };

  if (showVerification && pendingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <div className="absolute inset-0 gradient-glow opacity-50" />
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Button>
        </div>

        <Card className="w-full max-w-md glass-card animate-scale-in relative z-10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
            <CardDescription>
              We sent a verification code to <strong>{pendingEmail}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full gradient-primary" disabled={isLoading || verificationCode.length < 6}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToSignUp}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3 h-3 inline mr-1" />
                  Back to sign up
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authSuccess && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 gradient-glow opacity-50" />
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Home
        </Button>
      </div>

      <Card className="w-full max-w-md glass-card animate-scale-in relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">WealthWise</CardTitle>
          <CardDescription>Your personal finance companion</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ mode: value })} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="signin-email" name="email" type="email" placeholder="you@example.com" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="signin-password" name="password" type="password" placeholder="••••••••" className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="signup-name" name="fullName" type="text" placeholder="John Doe" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="signup-email" name="email" type="email" placeholder="you@example.com" className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="signup-password" name="password" type="password" placeholder="••••••••" className="pl-10" minLength={6} required />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full">
              <Chrome className="w-4 h-4 mr-2" />
              Google
            </Button>
            <Button variant="outline" onClick={handleGithubSignIn} disabled={isLoading} className="w-full">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
