import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { FREQUENCY_OPTIONS } from '@/lib/constants';
import { FrequencyType, TransactionType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, RefreshCw, ArrowUpCircle, ArrowDownCircle, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';

function Recurring() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const currency = profile?.currency || 'NGN';
  const { recurringTransactions, isLoading, addRecurring, updateRecurring, toggleActive, deleteRecurring, isAdding, isUpdating } = useRecurringTransactions();
  const { incomeCategories, expenseCategories } = useCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<typeof recurringTransactions[0] | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('monthly');
  const [nextRunDate, setNextRunDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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

  const activeRecurring = recurringTransactions.filter(r => r.is_active);
  const inactiveRecurring = recurringTransactions.filter(r => !r.is_active);

  const monthlyIncome = activeRecurring
    .filter(r => r.type === 'income')
    .reduce((sum, r) => {
      const multiplier = r.frequency === 'daily' ? 30 : r.frequency === 'weekly' ? 4 : r.frequency === 'yearly' ? 1/12 : 1;
      return sum + Number(r.amount) * multiplier;
    }, 0);

  const monthlyExpenses = activeRecurring
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => {
      const multiplier = r.frequency === 'daily' ? 30 : r.frequency === 'weekly' ? 4 : r.frequency === 'yearly' ? 1/12 : 1;
      return sum + Number(r.amount) * multiplier;
    }, 0);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (editingRecurring) {
      updateRecurring({ 
        id: editingRecurring.id,
        title: title.trim(),
        amount: amountNum,
        type,
        category_id: categoryId || undefined,
        frequency,
        next_run_date: nextRunDate
      });
    } else {
      addRecurring({
        title: title.trim(),
        amount: amountNum,
        type,
        category_id: categoryId || undefined,
        frequency,
        next_run_date: nextRunDate,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingRecurring(null);
    setType('expense');
    setTitle('');
    setAmount('');
    setCategoryId('');
    setFrequency('monthly');
    setNextRunDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleEdit = (recurring: typeof recurringTransactions[0]) => {
    setEditingRecurring(recurring);
    setType(recurring.type);
    setTitle(recurring.title);
    setAmount(String(recurring.amount));
    setCategoryId(recurring.category_id || '');
    setFrequency(recurring.frequency);
    setNextRunDate(format(new Date(recurring.next_run_date), 'yyyy-MM-dd'));
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this recurring transaction?')) {
      deleteRecurring(id);
    }
  };

  const getNextOccurrences = (recurring: typeof recurringTransactions[0], count: number = 3) => {
    const dates: Date[] = [];
    let currentDate = new Date(recurring.next_run_date);
    
    for (let i = 0; i < count; i++) {
      dates.push(currentDate);
      switch (recurring.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'yearly':
          currentDate = addYears(currentDate, 1);
          break;
      }
    }
    return dates;
  };

  const RecurringCard = ({ recurring }: { recurring: typeof recurringTransactions[0] }) => {
    const nextDates = getNextOccurrences(recurring);
    const isIncome = recurring.type === 'income';

    return (
      <Card className={`glass-card border-l-4 ${isIncome ? 'border-l-income' : 'border-l-expense'} cursor-pointer transition-colors duration-200 hover:bg-accent/5`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isIncome ? 'gradient-income' : 'gradient-expense'}`}>
                {isIncome ? (
                  <ArrowUpCircle className="w-5 h-5 text-income-foreground" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5 text-expense-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{recurring.title}</p>
                <p className="text-sm text-muted-foreground">{recurring.category?.name || 'Uncategorized'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={recurring.is_active}
                onCheckedChange={(checked) => toggleActive({ id: recurring.id, is_active: checked })}
              />
              <Button variant="ghost" size="icon" onClick={() => handleEdit(recurring)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(recurring.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className={`text-xl font-bold tabular-nums ${isIncome ? 'text-income' : 'text-expense'}`}>
                {isIncome ? '+' : '-'}{formatCurrency(Number(recurring.amount), currency)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground capitalize">{recurring.frequency}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Next run</p>
              <p className="text-sm font-medium">{formatDate(new Date(recurring.next_run_date))}</p>
            </div>
          </div>

          {recurring.is_active && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground mb-2">Upcoming</p>
              <div className="flex gap-2 flex-wrap">
                {nextDates.map((date, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-secondary">
                    {format(date, 'MMM d')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Recurring Transactions</h1>
            <p className="text-muted-foreground">Manage your automatic income and expenses</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Recurring
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRecurring ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Tabs value={type} onValueChange={(v) => {
                  setType(v as TransactionType);
                  setCategoryId('');
                }}>
                  <TabsList className="w-full">
                    <TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger>
                    <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., Netflix, Salary"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as FrequencyType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Next Run Date</Label>
                  <Input
                    type="date"
                    value={nextRunDate}
                    onChange={(e) => setNextRunDate(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleSubmit} 
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={isAdding || isUpdating}
                >
                  {editingRecurring ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Recurring</p>
                  <p className="text-2xl font-bold">{activeRecurring.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-income flex items-center justify-center">
                  <ArrowUpCircle className="w-6 h-6 text-income-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="text-2xl font-bold tabular-nums text-income">{formatCurrency(monthlyIncome, currency)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-expense flex items-center justify-center">
                  <ArrowDownCircle className="w-6 h-6 text-expense-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                  <p className="text-2xl font-bold tabular-nums text-expense">{formatCurrency(monthlyExpenses, currency)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recurring Transactions List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
          </div>
        ) : recurringTransactions.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recurring transactions</p>
                <p className="text-sm text-muted-foreground">Add recurring income or expenses to automate tracking</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {activeRecurring.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Active ({activeRecurring.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeRecurring.map(recurring => (
                    <RecurringCard key={recurring.id} recurring={recurring} />
                  ))}
                </div>
              </div>
            )}

            {inactiveRecurring.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Paused ({inactiveRecurring.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                  {inactiveRecurring.map(recurring => (
                    <RecurringCard key={recurring.id} recurring={recurring} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <Card className="glass-card border-primary/30">
          <CardContent className="py-4">
            <div className="flex gap-4">
              <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">How Recurring Transactions Work</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Recurring transactions are templates for regular income or expenses. 
                  They help you track expected cash flow. The "Next run date" shows when 
                  the next occurrence is scheduled. You can manually add the actual transaction 
                  when it happens, or set up automation through your financial institution.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Recurring;
