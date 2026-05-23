import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./auth";


export const list = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) return [];
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const create = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    type: v.union(v.literal("income"), v.literal("expense"), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("categories", {
      userId,
      name: args.name,
      icon: args.icon,
      color: args.color,
      isDefault: false,
      type: args.type ?? undefined,
    });

    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    sessionId: v.id("sessions"),
    id: v.id("categories"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const sanitized: Record<string, unknown> = {};
    if (updates.name !== undefined) sanitized.name = updates.name;
    if (updates.icon !== undefined) sanitized.icon = updates.icon;
    if (updates.color !== undefined) sanitized.color = updates.color;
    if (updates.type !== undefined) sanitized.type = updates.type ?? undefined;

    await ctx.db.patch(id, sanitized);
    return await ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { sessionId: v.id("sessions"), id: v.id("categories") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
