import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useProfile } from '@/hooks/useProfile';
import { formatCompactCurrency, formatPercent } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatsCards() {
  const { stats, isLoading } = useDashboardStats();
  const { profile } = useProfile();
  const currency = profile?.currency || 'NGN';

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
      value: stats?.totalBalance || 0,
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Monthly Income',
      value: stats?.totalIncome || 0,
      icon: TrendingUp,
      color: 'text-income',
      bgColor: 'bg-income/10',
    },
    {
      title: 'Monthly Expenses',
      value: stats?.totalExpenses || 0,
      icon: TrendingDown,
      color: 'text-expense',
      bgColor: 'bg-expense/10',
    },
    {
      title: 'Savings Rate',
      value: stats?.savingsRate || 0,
      icon: PiggyBank,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      isPercent: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={card.title} className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bgColor)}>
                <card.icon className={cn('w-5 h-5', card.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2 tabular-nums">
              {card.isPercent ? formatPercent(card.value / 100) : formatCompactCurrency(card.value, currency)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
