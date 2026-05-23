import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const list = query({
  args: {
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    categoryId: v.optional(v.string()),
    minAmount: v.optional(v.float64()),
    maxAmount: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    let results = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    if (args.startDate) {
      results = results.filter((t) => t.date >= args.startDate!);
    }
    if (args.endDate) {
      results = results.filter((t) => t.date <= args.endDate!);
    }
    if (args.type) {
      results = results.filter((t) => t.type === args.type);
    }
    if (args.categoryId) {
      results = results.filter((t) => t.categoryId === args.categoryId);
    }
    if (args.minAmount !== undefined) {
      results = results.filter((t) => t.amount >= args.minAmount!);
    }
    if (args.maxAmount !== undefined) {
      results = results.filter((t) => t.amount <= args.maxAmount!);
    }

    results.sort((a, b) => b.date - a.date);

    const categories = await ctx.db.query("categories").collect();
    const categoryMap = new Map(categories.map((c) => [c._id, c]));

    return results.map((t) => ({
      ...t,
      category: t.categoryId ? categoryMap.get(t.categoryId) ?? null : null,
    }));
  },
});

export const create = mutation({
  args: {
    amount: v.float64(),
    type: v.union(v.literal("income"), v.literal("expense")),
    categoryId: v.optional(v.id("categories")),
    notes: v.optional(v.string()),
    date: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const id = await ctx.db.insert("transactions", {
      userId,
      amount: args.amount,
      type: args.type,
      categoryId: args.categoryId,
      notes: args.notes,
      date: args.date ?? Date.now(),
    });

    const doc = await ctx.db.get(id);
    const category = args.categoryId ? await ctx.db.get(args.categoryId) : null;
    return { ...doc, category };
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    amount: v.optional(v.float64()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    categoryId: v.optional(v.id("categories")),
    notes: v.optional(v.string()),
    date: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const sanitized: Record<string, unknown> = {};
    if (updates.amount !== undefined) sanitized.amount = updates.amount;
    if (updates.type !== undefined) sanitized.type = updates.type;
    if (updates.categoryId !== undefined) sanitized.categoryId = updates.categoryId;
    if (updates.notes !== undefined) sanitized.notes = updates.notes;
    if (updates.date !== undefined) sanitized.date = updates.date;

    await ctx.db.patch(id, sanitized);
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Transaction not found");
    const category = doc.categoryId ? await ctx.db.get(doc.categoryId) : null;
    return { ...doc, category };
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
