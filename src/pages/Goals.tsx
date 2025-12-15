import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { formatCurrency, formatPercent, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, Target, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { differenceInDays, format, addDays } from 'date-fns';

export default function Goals() {
  const { user, loading: authLoading } = useAuth();
  const { goals: savingsGoals, isLoading, addGoal, updateGoal, addProgress, deleteGoal, isAdding, isUpdating } = useSavingsGoals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{ id: string; title: string; target_amount: number; deadline: string | null } | null>(null);
  const [progressGoalId, setProgressGoalId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [progressAmount, setProgressAmount] = useState('');

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

  const totalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalSaved = savingsGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completedGoals = savingsGoals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;

  const handleSubmit = () => {
    const amount = parseFloat(targetAmount);
    if (!title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    if (editingGoal) {
      updateGoal({ 
        id: editingGoal.id, 
        title: title.trim(),
        target_amount: amount,
        deadline: deadline || null
      });
    } else {
      addGoal({
        title: title.trim(),
        target_amount: amount,
        deadline: deadline || null,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleAddProgress = () => {
    const amount = parseFloat(progressAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (progressGoalId) {
      addProgress({ id: progressGoalId, amount });
    }
    setIsProgressDialogOpen(false);
    setProgressGoalId(null);
    setProgressAmount('');
  };

  const resetForm = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetAmount('');
    setDeadline('');
  };

  const handleEdit = (goal: typeof savingsGoals[0]) => {
    setEditingGoal({ 
      id: goal.id, 
      title: goal.title, 
      target_amount: Number(goal.target_amount),
      deadline: goal.deadline 
    });
    setTitle(goal.title);
    setTargetAmount(String(goal.target_amount));
    setDeadline(goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : '');
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(id);
    }
  };

  const calculateForecast = (goal: typeof savingsGoals[0]) => {
    if (!goal.deadline) return null;
    const daysRemaining = differenceInDays(new Date(goal.deadline), new Date());
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    if (daysRemaining <= 0 || remaining <= 0) return null;
    const dailyRequired = remaining / daysRemaining;
    return { daysRemaining, dailyRequired, remaining };
  };

  const getCompletionDate = (goal: typeof savingsGoals[0]) => {
    const current = Number(goal.current_amount);
    const target = Number(goal.target_amount);
    if (current >= target) return 'Completed!';
    if (current === 0) return 'Start saving to see forecast';
    
    // Simple linear projection based on average daily savings
    const daysSinceCreated = Math.max(1, differenceInDays(new Date(), new Date(goal.created_at)));
    const dailyAverage = current / daysSinceCreated;
    const daysToComplete = (target - current) / dailyAverage;
    const estimatedDate = addDays(new Date(), Math.ceil(daysToComplete));
    return `Est. ${format(estimatedDate, 'MMM d, yyyy')}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Savings Goals</h1>
            <p className="text-muted-foreground">Track your progress towards financial goals</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create Savings Goal'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Goal Title</Label>
                  <Input
                    placeholder="e.g., Emergency Fund, Vacation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deadline (optional)</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleSubmit} 
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={isAdding || isUpdating}
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Goals</p>
                  <p className="text-2xl font-bold">{savingsGoals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-income flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-income-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Saved</p>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalSaved)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                  <p className="text-2xl font-bold tabular-nums">{formatPercent(overallProgress / 100)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedGoals} / {savingsGoals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Dialog */}
        <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Progress</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Amount to Add</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={progressAmount}
                  onChange={(e) => setProgressAmount(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleAddProgress} 
                className="w-full gradient-primary text-primary-foreground"
                disabled={isUpdating}
              >
                Add Progress
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Goals List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
          </div>
        ) : savingsGoals.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12">
              <div className="text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No savings goals yet</p>
                <p className="text-sm text-muted-foreground">Create your first goal to start tracking</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsGoals.map(goal => {
              const progress = Number(goal.target_amount) > 0 
                ? (Number(goal.current_amount) / Number(goal.target_amount)) * 100 
                : 0;
              const isComplete = progress >= 100;
              const forecast = calculateForecast(goal);

              return (
                <Card key={goal.id} className={`glass-card ${isComplete ? 'border-income/50' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        {goal.deadline && (
                          <p className="text-sm text-muted-foreground">
                            Deadline: {formatDate(new Date(goal.deadline))}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setProgressGoalId(goal.id);
                            setIsProgressDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-muted-foreground">Saved</p>
                        <p className="text-2xl font-bold tabular-nums text-income">
                          {formatCurrency(Number(goal.current_amount))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Target</p>
                        <p className="text-xl font-semibold tabular-nums">
                          {formatCurrency(Number(goal.target_amount))}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className={isComplete ? 'text-income font-medium' : ''}>
                          {formatPercent(Math.min(progress, 100) / 100)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className={`h-3 ${isComplete ? '[&>div]:gradient-income' : ''}`}
                      />
                    </div>

                    <div className="pt-2 border-t border-border/40">
                      <p className="text-sm text-muted-foreground">
                        Forecast: <span className="text-foreground">{getCompletionDate(goal)}</span>
                      </p>
                      {forecast && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Save {formatCurrency(forecast.dailyRequired)}/day to meet deadline ({forecast.daysRemaining} days left)
                        </p>
                      )}
                    </div>

                    {isComplete && (
                      <div className="p-3 rounded-lg bg-income/10 border border-income/30 text-center">
                        <p className="text-sm font-medium text-income">🎉 Goal Achieved!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
