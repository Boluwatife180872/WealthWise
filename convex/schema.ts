import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    fullName: v.optional(v.string()),
    monthlyIncome: v.optional(v.float64()),
    currency: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    updatedAt: v.optional(v.float64()),
  }).index("by_userId", ["userId"]),

  categories: defineTable({
    userId: v.string(),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  }).index("by_userId", ["userId"]),

  transactions: defineTable({
    userId: v.string(),
    amount: v.float64(),
    type: v.union(v.literal("income"), v.literal("expense")),
    categoryId: v.optional(v.id("categories")),
    notes: v.optional(v.string()),
    date: v.float64(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_userId_type", ["userId", "type"]),

  budgets: defineTable({
    userId: v.string(),
    categoryId: v.id("categories"),
    amount: v.float64(),
    month: v.float64(),
    year: v.float64(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_month_year", ["userId", "month", "year"]),

  savingsGoals: defineTable({
    userId: v.string(),
    title: v.string(),
    targetAmount: v.float64(),
    currentAmount: v.optional(v.float64()),
    deadline: v.optional(v.float64()),
  }).index("by_userId", ["userId"]),

  recurringTransactions: defineTable({
    userId: v.string(),
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
    isActive: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_nextRun", ["userId", "nextRunDate"]),

  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),
});
