import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./auth";


export const list = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return notifications
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 50);
  },
});

export const markAsRead = mutation({
  args: { sessionId: v.id("sessions"), id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const n of notifications) {
      if (!n.isRead) {
        await ctx.db.patch(n._id, { isRead: true });
      }
    }
  },
});

export const remove = mutation({
  args: { sessionId: v.id("sessions"), id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});
