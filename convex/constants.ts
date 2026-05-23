export const DEFAULT_CATEGORIES = {
  expense: [
    { name: "Food & Dining", icon: "utensils", color: "#f97316" },
    { name: "Transport", icon: "car", color: "#3b82f6" },
    { name: "Bills & Utilities", icon: "zap", color: "#eab308" },
    { name: "Housing", icon: "home", color: "#8b5cf6" },
    { name: "Healthcare", icon: "heart", color: "#ef4444" },
    { name: "Entertainment", icon: "gamepad-2", color: "#ec4899" },
    { name: "Education", icon: "graduation-cap", color: "#06b6d4" },
    { name: "Shopping", icon: "shopping-bag", color: "#f59e0b" },
    { name: "Other Expenses", icon: "more-horizontal", color: "#64748b" },
  ],
  income: [
    { name: "Salary", icon: "briefcase", color: "#10b981" },
    { name: "Freelance", icon: "laptop", color: "#14b8a6" },
    { name: "Investments", icon: "trending-up", color: "#22c55e" },
    { name: "Other Income", icon: "plus-circle", color: "#84cc16" },
  ],
} as const;
