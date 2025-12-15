import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { TransactionList } from '@/components/transactions/TransactionList';
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog';
import { useMonthlyTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { transactions, isLoading } = useMonthlyTransactions();
  const recentTransactions = transactions.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Your financial overview</p>
          </div>
          <AddTransactionDialog />
        </div>

        <StatsCards />

        <div className="grid gap-6 lg:grid-cols-2">
          <ExpenseChart />
          <CashFlowChart />
        </div>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList transactions={recentTransactions} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
