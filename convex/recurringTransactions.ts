import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./auth";


export const list = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) return [];

    const items = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_userId_nextRun", (q) => q.eq("userId", userId))
      .collect();

    items.sort((a, b) => a.nextRunDate - b.nextRunDate);

    const categories = await ctx.db.query("categories").collect();
    const categoryMap = new Map(categories.map((c) => [c._id, c]));

    return items.map((r) => ({
      ...r,
      category: r.categoryId ? categoryMap.get(r.categoryId) ?? null : null,
    }));
  },
});

export const create = mutation({
  args: {
    sessionId: v.id("sessions"),
    title: v.string(),
    amount: v.float64(),
    type: v.union(v.literal("income"), v.literal("expense")),
    categoryId: v.optional(v.id("categories")),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    nextRunDate: v.float64(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("recurringTransactions", {
      userId,
      title: args.title,
      amount: args.amount,
      type: args.type,
      categoryId: args.categoryId,
      frequency: args.frequency,
      nextRunDate: args.nextRunDate,
      isActive: true,
    });

    const doc = await ctx.db.get(id);
    const category = args.categoryId ? await ctx.db.get(args.categoryId) : null;
    return { ...doc, category };
  },
});

export const update = mutation({
  args: {
    sessionId: v.id("sessions"),
    id: v.id("recurringTransactions"),
    title: v.optional(v.string()),
    amount: v.optional(v.float64()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    categoryId: v.optional(v.id("categories")),
    frequency: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly")
      )
    ),
    nextRunDate: v.optional(v.float64()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const sanitized: Record<string, unknown> = {};
    if (updates.title !== undefined) sanitized.title = updates.title;
    if (updates.amount !== undefined) sanitized.amount = updates.amount;
    if (updates.type !== undefined) sanitized.type = updates.type;
    if (updates.categoryId !== undefined) sanitized.categoryId = updates.categoryId;
    if (updates.frequency !== undefined) sanitized.frequency = updates.frequency;
    if (updates.nextRunDate !== undefined) sanitized.nextRunDate = updates.nextRunDate;
    if (updates.isActive !== undefined) sanitized.isActive = updates.isActive;

    await ctx.db.patch(id, sanitized);

    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Not found");
    const category = doc.categoryId ? await ctx.db.get(doc.categoryId) : null;
    return { ...doc, category };
  },
});

export const toggleActive = mutation({
  args: {
    sessionId: v.id("sessions"),
    id: v.id("recurringTransactions"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { isActive: args.isActive });
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { sessionId: v.id("sessions"), id: v.id("recurringTransactions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
