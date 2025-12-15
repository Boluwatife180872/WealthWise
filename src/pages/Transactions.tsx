import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TransactionList } from '@/components/transactions/TransactionList';
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog';
import { CSVImportExport } from '@/components/transactions/CSVImportExport';
import { useTransactions } from '@/hooks/useTransactions';

export default function Transactions() {
  const { transactions, isLoading } = useTransactions();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Manage your income and expenses</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CSVImportExport />
            <AddTransactionDialog />
          </div>
        </div>
        <TransactionList transactions={transactions} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
}
