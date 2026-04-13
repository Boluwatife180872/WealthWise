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
  "Light and dark theme support",
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
                Personal finance without the clutter
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
                Budget smarter. Spend with confidence.
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  Understand your money before it disappears.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  WealthWise helps you track transactions, manage budgets, plan
                  savings goals, and read your financial health from one clear
                  dashboard.
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
                        <h2 className="mt-1 text-2xl font-bold">$12,480.50</h2>
                      </div>
                      <div className="rounded-2xl bg-primary/15 p-3 text-primary">
                        <CreditCard className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl bg-secondary/70 p-3">
                        <p className="text-muted-foreground">Income</p>
                        <p className="mt-1 font-semibold text-primary">
                          +$6,200
                        </p>
                      </div>
                      <div className="rounded-2xl bg-secondary/70 p-3">
                        <p className="text-muted-foreground">Spent</p>
                        <p className="mt-1 font-semibold text-destructive">
                          -$2,140
                        </p>
                      </div>
                      <div className="rounded-2xl bg-secondary/70 p-3">
                        <p className="text-muted-foreground">Saved</p>
                        <p className="mt-1 font-semibold">$1,860</p>
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
