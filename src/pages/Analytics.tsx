import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, formatPercent, getMonthName } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns';

export default function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const { transactions, isLoading } = useTransactions();
  const { categories, expenseCategories } = useCategories();
  const [timeRange, setTimeRange] = useState('6');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const months = parseInt(timeRange);
  const endDate = new Date();
  const startDate = subMonths(startOfMonth(endDate), months - 1);

  const monthsInRange = eachMonthOfInterval({ start: startDate, end: endDate });

  // Cash flow data by month
  const cashFlowData = useMemo(() => {
    return monthsInRange.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter(t => {
        const date = parseISO(t.date);
        return date >= monthStart && date <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month: format(month, 'MMM yyyy'),
        shortMonth: format(month, 'MMM'),
        income,
        expenses,
        net: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      };
    });
  }, [transactions, monthsInRange]);

  // Category breakdown for the period
  const categoryBreakdown = useMemo(() => {
    const categoryTotals = new Map<string, { name: string; amount: number; color: string }>();
    
    transactions
      .filter(t => {
        const date = parseISO(t.date);
        return t.type === 'expense' && date >= startDate && date <= endDate;
      })
      .forEach(t => {
        const categoryId = t.category_id || 'uncategorized';
        const category = categories.find(c => c.id === categoryId);
        const existing = categoryTotals.get(categoryId) || { 
          name: category?.name || 'Uncategorized', 
          amount: 0,
          color: category?.color || '#6366f1'
        };
        existing.amount += Number(t.amount);
        categoryTotals.set(categoryId, existing);
      });

    return Array.from(categoryTotals.values())
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, startDate, endDate]);

  const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = cashFlowData.reduce((sum, d) => sum + d.expenses, 0);
  const netSavings = totalIncome - totalExpenses;
  const avgSavingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const avgMonthlyIncome = totalIncome / months;
  const avgMonthlyExpenses = totalExpenses / months;

  // Trend calculation (simple linear regression)
  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return 0;
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  };

  const incomeTrend = calculateTrend(cashFlowData.map(d => d.income));
  const expenseTrend = calculateTrend(cashFlowData.map(d => d.expenses));

  // Project next month
  const projectedIncome = avgMonthlyIncome + incomeTrend;
  const projectedExpenses = avgMonthlyExpenses + expenseTrend;

  const chartColors = {
    income: 'hsl(var(--income))',
    expense: 'hsl(var(--expense))',
    net: 'hsl(var(--primary))',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Detailed insights into your finances</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-income flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-income-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-xl font-bold tabular-nums">{formatCurrency(totalIncome)}</p>
                  <p className="text-xs text-muted-foreground">Avg {formatCurrency(avgMonthlyIncome)}/mo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-expense flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-expense-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-bold tabular-nums">{formatCurrency(totalExpenses)}</p>
                  <p className="text-xs text-muted-foreground">Avg {formatCurrency(avgMonthlyExpenses)}/mo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${netSavings >= 0 ? 'gradient-income' : 'gradient-expense'}`}>
                  <DollarSign className={`w-6 h-6 ${netSavings >= 0 ? 'text-income-foreground' : 'text-expense-foreground'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Savings</p>
                  <p className={`text-xl font-bold tabular-nums ${netSavings >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(netSavings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <PiggyBank className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Savings Rate</p>
                  <p className="text-xl font-bold tabular-nums">{formatPercent(avgSavingsRate / 100)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="w-5 h-5" />
              Cash Flow Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.income} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={chartColors.income} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.expense} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={chartColors.expense} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="shortMonth" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      name="Income"
                      stroke={chartColors.income} 
                      fill="url(#incomeGradient)"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      name="Expenses"
                      stroke={chartColors.expense} 
                      fill="url(#expenseGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Comparison */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monthly Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="shortMonth" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill={chartColors.income} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill={chartColors.expense} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Savings Rate Trend */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Savings Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="shortMonth" />
                    <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="savingsRate" 
                      name="Savings Rate"
                      stroke={chartColors.net} 
                      strokeWidth={2}
                      dot={{ fill: chartColors.net }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No expense data for this period</p>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.map((cat, index) => {
                  const percentage = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium tabular-nums">{formatCurrency(cat.amount)}</p>
                          <p className="text-xs text-muted-foreground">{formatPercent(percentage / 100)}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: cat.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Predictions */}
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Predictive Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-1">Projected Next Month Income</p>
                <p className="text-xl font-bold tabular-nums text-income">{formatCurrency(Math.max(0, projectedIncome))}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {incomeTrend >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(incomeTrend))}/month trend
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-1">Projected Next Month Expenses</p>
                <p className="text-xl font-bold tabular-nums text-expense">{formatCurrency(Math.max(0, projectedExpenses))}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expenseTrend >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(expenseTrend))}/month trend
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-1">Projected Net Savings</p>
                <p className={`text-xl font-bold tabular-nums ${projectedIncome - projectedExpenses >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatCurrency(projectedIncome - projectedExpenses)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Based on linear trend projection</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
