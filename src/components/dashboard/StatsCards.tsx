import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency, formatCompactCurrency, formatPercent } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function abbreviated(value: number, currency: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return formatCompactCurrency(value, currency);
  return formatCurrency(value, currency);
}

export function StatsCards() {
  const { stats, isLoading } = useDashboardStats();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const currency = profile?.currency || 'NGN';

  const balance = stats?.totalBalance ?? 0;
  const income = stats?.totalIncome ?? 0;
  const expenses = stats?.totalExpenses ?? 0;
  const isNegative = balance < 0;

  const balanceFormatted = useMemo(() => abbreviated(balance, currency), [balance, currency]);
  const incomeFormatted = useMemo(() => abbreviated(income, currency), [income, currency]);
  const expensesFormatted = useMemo(() => abbreviated(expenses, currency), [expenses, currency]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Balance',
      value: balance,
      formatted: balanceFormatted,
      icon: isNegative ? AlertTriangle : Wallet,
      color: isNegative ? 'text-red-500' : 'text-primary',
      bgColor: isNegative ? 'bg-red-500/10' : 'bg-primary/10',
      alert: isNegative,
    },
    {
      title: 'Monthly Income',
      value: income,
      formatted: incomeFormatted,
      icon: TrendingUp,
      color: 'text-income',
      bgColor: 'bg-income/10',
    },
    {
      title: 'Monthly Expenses',
      value: expenses,
      formatted: expensesFormatted,
      icon: TrendingDown,
      color: 'text-expense',
      bgColor: 'bg-expense/10',
    },
    {
      title: 'Savings Rate',
      value: stats?.savingsRate ?? 0,
      formatted: formatPercent((stats?.savingsRate ?? 0) / 100),
      icon: PiggyBank,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      isPercent: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={card.title} className={cn(
            'glass-card animate-slide-up',
            card.alert && 'ring-2 ring-red-500/40 animate-pulse'
          )} style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', card.bgColor)}>
                  <card.icon className={cn('w-5 h-5', card.color)} />
                </div>
              </div>
              <p
                className={cn(
                  'text-2xl font-bold mt-2 tabular-nums break-words',
                  card.color
                )}
                title={card.formatted}
              >
                {card.formatted}
              </p>
              {card.alert && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Expenses exceed income</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="link" size="sm" onClick={() => navigate('/balances')} className="gap-1 text-muted-foreground hover:text-foreground">
          View full breakdown <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
