import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Balances() {
  const { stats, isLoading } = useDashboardStats();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const currency = profile?.currency || 'NGN';

  const { transactions } = useTransactions();

  const balance = stats?.totalBalance ?? 0;
  const income = stats?.totalIncome ?? 0;
  const expenses = stats?.totalExpenses ?? 0;
  const isNegative = balance < 0;

  const allTimeIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allTimeExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const allTimeNet = allTimeIncome - allTimeExpenses;

  const items = [
    { label: 'Total Balance', value: balance, icon: Wallet, color: isNegative ? 'text-red-500' : 'text-primary', negative: isNegative },
    { label: 'Monthly Income', value: income, icon: TrendingUp, color: 'text-income' },
    { label: 'Monthly Expenses', value: expenses, icon: TrendingDown, color: 'text-expense' },
    { label: 'Net Monthly Savings', value: income - expenses, icon: TrendingUp, color: income - expenses >= 0 ? 'text-income' : 'text-red-500' },
    { label: 'Savings Rate', value: stats?.savingsRate ?? 0, icon: PiggyBank, color: 'text-primary', isPercent: true },
    { label: 'All-Time Income', value: allTimeIncome, icon: TrendingUp, color: 'text-income' },
    { label: 'All-Time Expenses', value: allTimeExpenses, icon: TrendingDown, color: 'text-expense' },
    { label: 'All-Time Net', value: allTimeNet, icon: Wallet, color: allTimeNet >= 0 ? 'text-income' : 'text-red-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Full Balances</h1>
            <p className="text-muted-foreground">All your financial figures — unabbreviated</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <Card key={item.label} className={cn('glass-card', item.negative && 'ring-2 ring-red-500/40 animate-pulse')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className={cn('w-5 h-5', item.color)} />
                    </div>
                  </div>
                  <p className={cn('text-2xl font-bold mt-2 tabular-nums break-words', item.color)}>
                    {item.isPercent ? formatPercent(item.value / 100) : formatCurrency(item.value, currency)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
