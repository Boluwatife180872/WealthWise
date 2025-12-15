import { Transaction } from '@/types';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency, formatShortDate } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

function TransactionListComponent({ transactions, isLoading }: TransactionListProps) {
  const { profile } = useProfile();
  const currency = profile?.currency || 'USD';

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="p-4 h-16" />
          </Card>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center text-muted-foreground">
          No transactions yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx, index) => (
        <Card key={tx.id} className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              tx.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
            )}>
              {tx.type === 'income' ? (
                <TrendingUp className="w-5 h-5 text-income" />
              ) : (
                <TrendingDown className="w-5 h-5 text-expense" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{tx.category?.name || 'Uncategorized'}</p>
              {tx.notes && <p className="text-sm text-muted-foreground truncate">{tx.notes}</p>}
            </div>
            
            <div className="text-right">
              <p className={cn('font-semibold tabular-nums', tx.type === 'income' ? 'text-income' : 'text-expense')}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
              </p>
              <p className="text-xs text-muted-foreground">{formatShortDate(tx.date)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const TransactionList = TransactionListComponent;
