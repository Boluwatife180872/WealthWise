# Convex Backend

This directory contains all Convex backend functions.

## Structure
- `schema.ts` - Database schema definitions
- `auth.config.ts` - Auth provider configuration
- `constants.ts` - Shared constants (default categories)
- `users.ts` - Profile CRUD + new user initialization
- `categories.ts` - Category CRUD
- `transactions.ts` - Transaction CRUD + filtered queries
- `budgets.ts` - Budget CRUD
- `savingsGoals.ts` - Savings goal CRUD + progress tracking
- `recurringTransactions.ts` - Recurring transaction CRUD
- `notifications.ts` - Notification CRUD
- `dashboard.ts` - Dashboard stats, expenses by category, cash flow
- `files.ts` - File upload/avatar management

## Deployment
```bash
npx convex deploy
```
