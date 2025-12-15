import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useMonthlyTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatPercent, getMonthName } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, PiggyBank } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Navigate } from 'react-router-dom';

export default function Budgets() {
  const { user, loading: authLoading } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{ id: string; amount: number; category_id: string } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const { budgets, isLoading, addBudget, updateBudget, deleteBudget, isAdding, isUpdating } = useBudgets(selectedMonth, selectedYear);
  const { expenseCategories } = useCategories();
  const { transactions } = useMonthlyTransactions(selectedMonth, selectedYear);

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

  const budgetsWithSpent = budgets.map(budget => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category_id === budget.category_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { ...budget, spent };
  });

  const totalBudget = budgetsWithSpent.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + (b.spent || 0), 0);
  const remainingBudget = totalBudget - totalSpent;
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const chartData = budgetsWithSpent.map(b => ({
    name: b.category?.name || 'Unknown',
    budget: Number(b.amount),
    spent: b.spent || 0,
    color: b.category?.color || '#6366f1',
  }));

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleSubmit = () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (editingBudget) {
      updateBudget({ id: editingBudget.id, amount });
    } else {
      if (!selectedCategoryId) {
        toast.error('Please select a category');
        return;
      }
      addBudget({
        category_id: selectedCategoryId,
        amount,
        month: selectedMonth,
        year: selectedYear,
      });
    }

    setIsDialogOpen(false);
    setEditingBudget(null);
    setSelectedCategoryId('');
    setBudgetAmount('');
  };

  const handleEdit = (budget: typeof budgetsWithSpent[0]) => {
    setEditingBudget({ id: budget.id, amount: Number(budget.amount), category_id: budget.category_id });
    setBudgetAmount(String(budget.amount));
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      deleteBudget(id);
    }
  };

  const usedCategoryIds = budgets.map(b => b.category_id);
  const availableCategories = expenseCategories.filter(c => !usedCategoryIds.includes(c.id));

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Budget Management</h1>
            <p className="text-muted-foreground">Track and manage your monthly budgets</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 rounded-lg bg-card border border-border min-w-[140px] text-center">
              <span className="font-medium">{getMonthName(selectedMonth)} {selectedYear}</span>
            </div>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingBudget(null);
                setSelectedCategoryId('');
                setBudgetAmount('');
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBudget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {!editingBudget && (
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Budget Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleSubmit} 
                    className="w-full gradient-primary text-primary-foreground"
                    disabled={isAdding || isUpdating}
                  >
                    {editingBudget ? 'Update Budget' : 'Create Budget'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <PiggyBank className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-expense flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-expense-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${remainingBudget >= 0 ? 'gradient-income' : 'gradient-expense'}`}>
                  <AlertTriangle className={`w-6 h-6 ${remainingBudget >= 0 ? 'text-income-foreground' : 'text-expense-foreground'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className={`text-2xl font-bold tabular-nums ${remainingBudget >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(Math.abs(remainingBudget))}
                  </p>
                </div>
              </div>
              <Progress value={Math.min(overallProgress, 100)} className="mt-4 h-2" />
              <p className="text-xs text-muted-foreground mt-2">{formatPercent(overallProgress / 100)} of budget used</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Budget vs Actual Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="spent" name="Spent" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.spent > entry.budget ? 'hsl(var(--expense))' : 'hsl(var(--income))'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Budget Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
              </div>
            ) : budgetsWithSpent.length === 0 ? (
              <div className="text-center py-12">
                <PiggyBank className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No budgets set for this month</p>
                <p className="text-sm text-muted-foreground">Click "Add Budget" to create one</p>
              </div>
            ) : (
              <div className="space-y-4">
                {budgetsWithSpent.map(budget => {
                  const progress = (budget.spent || 0) / Number(budget.amount) * 100;
                  const isOverBudget = progress > 100;
                  const isNearLimit = progress > 80 && progress <= 100;

                  return (
                    <div key={budget.id} className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: budget.category?.color + '20' }}
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: budget.category?.color }}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{budget.category?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(budget.spent || 0)} of {formatCurrency(Number(budget.amount))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverBudget && (
                            <span className="px-2 py-1 text-xs rounded-full bg-expense/20 text-expense">
                              Over budget
                            </span>
                          )}
                          {isNearLimit && (
                            <span className="px-2 py-1 text-xs rounded-full bg-warning/20 text-warning">
                              Near limit
                            </span>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className={`h-2 ${isOverBudget ? '[&>div]:bg-expense' : isNearLimit ? '[&>div]:bg-warning' : ''}`}
                      />
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        {formatPercent(Math.min(progress, 100) / 100)} used • {formatCurrency(Math.max(0, Number(budget.amount) - (budget.spent || 0)))} remaining
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
