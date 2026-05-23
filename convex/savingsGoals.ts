import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./auth";


export const list = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) return [];

    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return goals.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const create = mutation({
  args: {
    sessionId: v.id("sessions"),
    title: v.string(),
    targetAmount: v.float64(),
    deadline: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("savingsGoals", {
      userId,
      title: args.title,
      targetAmount: args.targetAmount,
      currentAmount: 0,
      deadline: args.deadline,
    });

    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    sessionId: v.id("sessions"),
    id: v.id("savingsGoals"),
    title: v.optional(v.string()),
    targetAmount: v.optional(v.float64()),
    currentAmount: v.optional(v.float64()),
    deadline: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const sanitized: Record<string, unknown> = {};
    if (updates.title !== undefined) sanitized.title = updates.title;
    if (updates.targetAmount !== undefined) sanitized.targetAmount = updates.targetAmount;
    if (updates.currentAmount !== undefined) sanitized.currentAmount = updates.currentAmount;
    if (updates.deadline !== undefined) sanitized.deadline = updates.deadline;

    await ctx.db.patch(id, sanitized);
    return await ctx.db.get(id);
  },
});

export const addProgress = mutation({
  args: {
    sessionId: v.id("sessions"),
    id: v.id("savingsGoals"),
    amount: v.float64(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.id);
    if (!goal) throw new Error("Goal not found");

    const newAmount = (goal.currentAmount ?? 0) + args.amount;
    await ctx.db.patch(args.id, { currentAmount: newAmount });
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { sessionId: v.id("sessions"), id: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
