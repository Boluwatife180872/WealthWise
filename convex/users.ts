import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DEFAULT_CATEGORIES } from "./constants";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    return profile;
  },
});

export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    monthlyIncome: v.optional(v.float64()),
    currency: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const updateData = {
      ...args,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
    } else {
      await ctx.db.insert("profiles", {
        userId,
        fullName: args.fullName,
        monthlyIncome: args.monthlyIncome ?? 0,
        currency: args.currency ?? "USD",
        avatarUrl: args.avatarUrl,
      });
    }
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const [profiles, categories, transactions, budgets, savingsGoals, recurringTransactions, notifications] =
      await Promise.all([
        ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("categories").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("transactions").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("budgets").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("savingsGoals").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("recurringTransactions").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("notifications").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ]);

    for (const doc of [...categories, ...transactions, ...budgets, ...savingsGoals, ...recurringTransactions, ...notifications, ...profiles]) {
      await ctx.db.delete(doc._id);
    }
  },
});

export const initializeNewUser = mutation({
  args: {
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) return;

    // Use provided fullName, or try to get from Clerk identity, or fallback to email prefix
    const fullName = args.fullName 
      ?? (identity.firstName && identity.lastName ? `${identity.firstName} ${identity.lastName}`.trim() : null)
      ?? (identity.name ? identity.name : null)
      ?? identity.email?.split("@")[0] ?? "User";

    await ctx.db.insert("profiles", {
      userId,
      fullName,
      monthlyIncome: 0,
      currency: "USD",
    });

    for (const cat of DEFAULT_CATEGORIES.expense) {
      await ctx.db.insert("categories", {
        userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
        type: "expense",
      });
    }

    for (const cat of DEFAULT_CATEGORIES.income) {
      await ctx.db.insert("categories", {
        userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
        type: "income",
      });
    }
  },
});
