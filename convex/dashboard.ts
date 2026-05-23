import { v } from "convex/values";
import { query } from "./_generated/server";


export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        remainingBudget: 0,
        savingsRate: 0,
      };
    }
    const userId = identity.subject;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const monthlyTransactions = allTransactions.filter(
      (t) => t.date >= monthStart && t.date <= monthEnd
    );

    const totalIncome = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const allTimeIncome = allTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const allTimeExpenses = allTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = allTimeIncome - allTimeExpenses;

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_userId_month_year", (q) =>
        q
          .eq("userId", userId)
          .eq("month", now.getMonth() + 1)
          .eq("year", now.getFullYear())
      )
      .collect();

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const remainingBudget = totalBudget - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      remainingBudget,
      savingsRate,
    };
  },
});

export const getExpensesByCategory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const expenseTransactions = transactions.filter(
      (t) => t.type === "expense" && t.date >= monthStart && t.date <= monthEnd
    );

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const categoryMap = new Map(categories.map((c) => [c._id, c]));

    const grouped: Record<string, { value: number; color: string }> = {};

    for (const t of expenseTransactions) {
      const cat = t.categoryId ? categoryMap.get(t.categoryId) : null;
      const name = cat?.name ?? "Uncategorized";
      const color = cat?.color ?? "#64748b";

      if (!grouped[name]) {
        grouped[name] = { value: 0, color };
      }
      grouped[name].value += t.amount;
    }

    return Object.entries(grouped).map(([name, { value, color }]) => ({
      name,
      value,
      color,
    }));
  },
});

export const getCashFlow = query({
  args: {
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    const count = args.months ?? 6;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - count + 1, 1).getTime();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const filtered = transactions.filter((t) => t.date >= startDate && t.date <= endDate);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthly: Record<string, { income: number; expenses: number }> = {};

    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - count + 1 + i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthly[key] = { income: 0, expenses: 0 };
    }

    for (const t of filtered) {
      const d = new Date(t.date);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthly[key]) {
        if (t.type === "income") {
          monthly[key].income += t.amount;
        } else {
          monthly[key].expenses += t.amount;
        }
      }
    }

    return Object.entries(monthly).map(([date, values]) => ({
      date,
      ...values,
    }));
  },
});
