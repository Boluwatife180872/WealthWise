import { useCashFlowData } from '@/hooks/useDashboardStats';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function CashFlowChart() {
  const { data: cashFlow = [], isLoading } = useCashFlowData();
  const { profile } = useProfile();
  const currency = profile?.currency || 'NGN';

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader><CardTitle>Cash Flow</CardTitle></CardHeader>
        <CardContent className="h-[300px]">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader><CardTitle>Cash Flow</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cashFlow}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis tickFormatter={(v) => formatCurrency(v, currency)} stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value, currency)}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--card-foreground))' }}
              labelStyle={{ color: 'hsl(var(--card-foreground))' }}
              itemStyle={{ color: 'hsl(var(--card-foreground))' }}
            />
            <Legend wrapperStyle={{ color: 'hsl(var(--foreground))', fontSize: '13px' }} />
            <Bar dataKey="income" name="Income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
