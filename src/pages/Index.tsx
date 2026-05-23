import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Wallet,
  Eye,
  TrendingUp,
  PiggyBank,
  Smartphone,
  Globe,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const featureCards = [
  {
    icon: Wallet,
    title: "Track money with context",
    description:
      "Log income and expenses in seconds, then see where your money actually goes.",
  },
  {
    icon: Target,
    title: "Set budgets and savings goals",
    description:
      "Create clear spending boundaries and keep your goals visible every day.",
  },
  {
    icon: BarChart3,
    title: "Read your financial patterns",
    description:
      "Use analytics and cash-flow views to spot trends before they become problems.",
  },
];

const trustPoints = [
  "Secure authentication",
  "Proper Financial Management",
  "Budgets, goals, recurring transactions, and analytics",
];

const useLandingTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const prefersLight = window.matchMedia(
      "(prefers-color-scheme: light)",
    ).matches;
    const useLightMode = savedTheme ? savedTheme === "light" : prefersLight;

    document.documentElement.classList.toggle("light", useLightMode);
    setIsDarkMode(!useLightMode);
  }, []);

  const toggleTheme = () => {
    const nextIsDarkMode = !isDarkMode;
    setIsDarkMode(nextIsDarkMode);

    if (nextIsDarkMode) {
      document.documentElement.classList.remove("light");
      window.localStorage.setItem("theme", "dark");
      return;
    }

    document.documentElement.classList.add("light");
    window.localStorage.setItem("theme", "light");
  };

  return { isDarkMode, toggleTheme };
};

function LandingPage() {
  const { isDarkMode, toggleTheme } = useLandingTheme();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 gradient-hero" />
      <div className="pointer-events-none absolute inset-0 gradient-glow opacity-70" />
      <div className="pointer-events-none absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] top-12 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary shadow-glow">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold">WealthWise</p>
              <p className="text-sm text-muted-foreground">
                Financial freedom for Nigerians
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth?mode=signin">Sign in</Link>
            </Button>
            <Button
              asChild
              className="gradient-primary text-primary-foreground shadow-glow"
            >
              <Link to="/auth?mode=signup">Create account</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1">
          <section className="grid items-center gap-12 pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:pb-24">
            <div className="animate-fade-in space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur-xl">
                <Sparkles className="h-4 w-4 text-primary" />
                Budget smarter. Spend with confidence in Naira.
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  Understand your money before it disappears.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  WealthWise helps you track transactions in Naira, manage budgets, plan
                  savings goals, and read your financial health from one clear
                  dashboard designed for Nigerians.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="gradient-primary text-primary-foreground shadow-glow"
                >
                  <Link to="/auth?mode=signup">
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-border/70 bg-card/60 backdrop-blur-xl"
                >
                  <Link to="/auth?mode=signin">Sign in</Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-muted-foreground backdrop-blur-xl"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-slide-up">
              <Card className="glass-card overflow-hidden rounded-[2rem] border-border/50">
                <CardContent className="p-0">
                  <div className="border-b border-border/50 px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Financial overview
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">₦1,248,050.00</h2>
                      </div>
                      <div className="rounded-2xl bg-primary/15 p-3 text-primary">
                        <CreditCard className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl bg-secondary/70 p-3">
                        <p className="text-muted-foreground">Income</p>
                        <p className="mt-1 font-semibold text-primary">
                          +₦620,000
                        </p>
                      </div>
                      <div className="rounded-2xl bg-secondary/70 p-3">
                        <p className="text-muted-foreground">Spent</p>
                        <p className="mt-1 font-semibold text-destructive">
                          -₦214,000
                        </p>
                      </div>
                      <div className="rounded-2xl bg-secondary/70 p-3">
                        <p className="text-muted-foreground">Saved</p>
                        <p className="mt-1 font-semibold">₦186,000</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 px-6 py-6">
                    <div className="rounded-3xl gradient-card p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Budget health
                          </p>
                          <p className="mt-1 text-xl font-semibold">
                            72% on track
                          </p>
                        </div>
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-background/50">
                        <div className="h-full w-[72%] rounded-full gradient-primary" />
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {featureCards.map(
                        ({ icon: Icon, title, description }) => (
                          <div
                            key={title}
                            className="flex gap-4 rounded-3xl border border-border/50 bg-background/40 p-4"
                          >
                            <div className="mt-1 rounded-2xl bg-primary/15 p-2 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{title}</h3>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {description}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-16 lg:py-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur-xl mb-4">
                <Eye className="h-4 w-4 text-primary" />
                How it works
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Get started in three steps
              </h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
                From sign-up to financial clarity, you are minutes away.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  icon: Wallet,
                  title: "Connect your accounts",
                  desc: "Sign up securely and set your monthly income. WealthWise works with NGN and any currency you choose.",
                },
                {
                  step: "02",
                  icon: BarChart3,
                  title: "Track every transaction",
                  desc: "Log income and expenses, set budgets for each category, and create savings goals that keep you motivated.",
                },
                {
                  step: "03",
                  icon: TrendingUp,
                  title: "Watch your money grow",
                  desc: "Use real-time analytics and cash-flow projections to make smarter financial decisions every month.",
                },
              ].map(({ step, icon: Icon, title, desc }) => (
                <Card key={step} className="glass-card text-center p-6 relative overflow-hidden">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-bold text-primary tracking-widest">STEP {step}</span>
                  <h3 className="text-xl font-bold mt-2">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{desc}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Benefits */}
          <section className="py-16 lg:py-24 border-t border-border/40">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur-xl mb-4">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Why WealthWise
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Built for Nigerians who mean business
              </h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
                No clutter. No crypto. Just practical tools that work with how you actually spend.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-4xl mx-auto">
              {[
                {
                  icon: Globe,
                  title: "Multi-currency support",
                  desc: "Use NGN, USD, GBP, or any currency. WealthWise adapts to your preferred currency without conversion gymnastics.",
                },
                {
                  icon: PiggyBank,
                  title: "Budget management",
                  desc: "Set monthly spending limits per category. Get alerts when you are nearing your limit to stay in control.",
                },
                {
                  icon: Target,
                  title: "Savings goals with forecasts",
                  desc: "Define a target, track progress in real time, and see exactly when you will hit your goal based on your saving habits.",
                },
                {
                  icon: Smartphone,
                  title: "Works on any device",
                  desc: "Responsive design that looks great on desktop, tablet, and phone. Your finances wherever you go.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="glass-card p-5">
                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 lg:py-24">
            <Card className="gradient-primary max-w-3xl mx-auto text-center p-8 lg:p-12 rounded-[2rem] border-0 shadow-glow">
              <CardContent className="p-0 space-y-6">
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-primary-foreground">
                  Ready to take control of your money?
                </h2>
                <p className="text-lg text-primary-foreground/80 max-w-lg mx-auto">
                  Join WealthWise today and start making informed financial decisions in minutes.
                </p>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg text-base px-8">
                  <Link to="/auth?mode=signup">
                    Create your free account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Footer */}
          <footer className="pt-8 pb-4 border-t border-border/40">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary shadow-glow">
                  <Wallet className="h-4 w-4 text-primary-foreground" />
                </div>
                <p className="text-sm font-bold">WealthWise</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Built for financial freedom. Not financial advice.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <LandingPage />;
}
