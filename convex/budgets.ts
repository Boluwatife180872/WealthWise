import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const list = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_userId_month_year", (q) =>
        q.eq("userId", userId).eq("month", args.month).eq("year", args.year)
      )
      .collect();

    const categories = await ctx.db.query("categories").collect();
    const categoryMap = new Map(categories.map((c) => [c._id, c]));

    return budgets.map((b) => ({
      ...b,
      category: b.categoryId ? categoryMap.get(b.categoryId) ?? null : null,
    }));
  },
});

export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    amount: v.float64(),
    month: v.float64(),
    year: v.float64(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;

    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_userId_month_year", (q) =>
        q
          .eq("userId", userId)
          .eq("month", args.month)
          .eq("year", args.year)
      )
      .collect();

    const duplicate = existing.find((b) => b.categoryId === args.categoryId);
    if (duplicate) {
      throw new Error("Budget already exists for this category");
    }

    const id = await ctx.db.insert("budgets", {
      userId,
      categoryId: args.categoryId,
      amount: args.amount,
      month: args.month,
      year: args.year,
    });

    const doc = await ctx.db.get(id);
    const category = await ctx.db.get(args.categoryId);
    return { ...doc, category };
  },
});

export const update = mutation({
  args: {
    id: v.id("budgets"),
    amount: v.float64(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { amount: args.amount });
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Budget not found");
    const category = doc.categoryId ? await ctx.db.get(doc.categoryId) : null;
    return { ...doc, category };
  },
});

export const remove = mutation({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
