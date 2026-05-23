import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./auth";

export const getProfile = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    return profile;
  },
});

export const updateProfile = mutation({
  args: {
    sessionId: v.id("sessions"),
    fullName: v.optional(v.string()),
    monthlyIncome: v.optional(v.float64()),
    currency: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    const updateData: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.fullName !== undefined) updateData.fullName = args.fullName;
    if (args.monthlyIncome !== undefined) updateData.monthlyIncome = args.monthlyIncome;
    if (args.currency !== undefined) updateData.currency = args.currency;
    if (args.avatarUrl !== undefined) updateData.avatarUrl = args.avatarUrl;

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
    } else {
      await ctx.db.insert("profiles", { userId, ...updateData, monthlyIncome: args.monthlyIncome ?? 0, currency: args.currency ?? "USD" });
    }
  },
});

export const deleteAccount = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    const [profiles, categories, transactions, budgets, savingsGoals, recurringTransactions, notifications, sessions] = await Promise.all([
      ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("categories").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("transactions").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("budgets").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("savingsGoals").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("recurringTransactions").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("notifications").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("sessions").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
    ]);

    for (const doc of [...categories, ...transactions, ...budgets, ...savingsGoals, ...recurringTransactions, ...notifications, ...profiles, ...sessions]) {
      await ctx.db.delete(doc._id);
    }
    await ctx.db.delete(userId);
  },
});
