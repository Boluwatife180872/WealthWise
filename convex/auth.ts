import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { DEFAULT_CATEGORIES } from "./constants";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function createSession(ctx: MutationCtx, userId: Id<"users">) {
  return await ctx.db.insert("sessions", {
    userId,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

export async function getUserId(ctx: QueryCtx | MutationCtx, sessionId?: Id<"sessions">): Promise<Id<"users"> | null> {
  if (!sessionId) return null;
  const session = await ctx.db.get(sessionId);
  if (!session || session.expiresAt < Date.now()) return null;
  return session.userId;
}

export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
    if (existing) throw new Error("Email already in use");
    
    const passwordHash = await hashPassword(args.password);
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
    });
    
    // Create profile
    await ctx.db.insert("profiles", {
      userId,
      fullName: args.fullName || args.email.split("@")[0],
      monthlyIncome: 0,
      currency: "NGN",
    });

    for (const cat of DEFAULT_CATEGORIES.expense) {
      await ctx.db.insert("categories", { userId, name: cat.name, icon: cat.icon, color: cat.color, isDefault: true, type: "expense" });
    }
    for (const cat of DEFAULT_CATEGORIES.income) {
      await ctx.db.insert("categories", { userId, name: cat.name, icon: cat.icon, color: cat.color, isDefault: true, type: "income" });
    }
    
    const sessionId = await createSession(ctx, userId);
    return { userId, sessionId };
  },
});

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
    if (!user) throw new Error("Invalid email or password");
    
    const passwordHash = await hashPassword(args.password);
    if (user.passwordHash !== passwordHash) throw new Error("Invalid email or password");
    
    const sessionId = await createSession(ctx, user._id);
    return { userId: user._id, sessionId };
  },
});

async function createOAuthUser(ctx: MutationCtx, email: string, fullName: string) {
  const userId = await ctx.db.insert("users", { email, passwordHash: "" });
  await ctx.db.insert("profiles", { userId, fullName, monthlyIncome: 0, currency: "NGN" });
  for (const cat of DEFAULT_CATEGORIES.expense) {
    await ctx.db.insert("categories", { userId, name: cat.name, icon: cat.icon, color: cat.color, isDefault: true, type: "expense" });
  }
  for (const cat of DEFAULT_CATEGORIES.income) {
    await ctx.db.insert("categories", { userId, name: cat.name, icon: cat.icon, color: cat.color, isDefault: true, type: "income" });
  }
  return userId;
}

export const exchangeGoogleCredential = mutation({
  args: { credential: v.string() },
  handler: async (ctx, args) => {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${args.credential}`);
    if (!response.ok) throw new Error("Invalid Google credential");

    const payload = await response.json();
    const email: string = payload.email;
    if (!email) throw new Error("No email returned from Google");

    const fullName: string = payload.name || email.split("@")[0];
    let user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", email)).first();

    if (!user) {
      const userId = await createOAuthUser(ctx, email, fullName);
      user = await ctx.db.get(userId);
    }

    const sessionId = await createSession(ctx, user!._id);
    return { userId: user!._id, sessionId };
  },
});

export const exchangeGitHubCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: args.code,
      }),
    });
    if (!tokenResp.ok) throw new Error("Failed to exchange GitHub code");

    const tokenData = await tokenResp.json();
    if (tokenData.error) throw new Error(tokenData.error_description || "GitHub OAuth error");

    const userResp = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userResp.ok) throw new Error("Failed to get GitHub user info");

    const githubUser = await userResp.json();
    const email: string = githubUser.email;
    if (!email) throw new Error("No email from GitHub. Make sure your GitHub email is public.");

    const fullName: string = githubUser.name || githubUser.login || email.split("@")[0];
    let user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", email)).first();

    if (!user) {
      const userId = await createOAuthUser(ctx, email, fullName);
      user = await ctx.db.get(userId);
    }

    const sessionId = await createSession(ctx, user!._id);
    return { userId: user!._id, sessionId };
  },
});

export const signOut = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
  },
});

export const getCurrentUser = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx, args.sessionId);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", userId)).first();
    return {
      id: userId,
      email: user.email,
      fullName: profile?.fullName || null,
      currency: profile?.currency || null,
    };
  },
});
