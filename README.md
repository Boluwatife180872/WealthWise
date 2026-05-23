# WealthWise — Personal Finance & Wealth Management

> **Understand your money before it disappears.**  
> WealthWise is a full-stack personal finance application built for Nigerians (and beyond) that helps you track income, manage expenses, set budgets, plan savings goals, and gain deep financial intelligence — all from one clear dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Feature Breakdown & How Calculations Work](#feature-breakdown--how-calculations-work)
4. [Tool Integrations Explained](#tool-integrations-explained)
5. [Data Flow](#data-flow)
6. [Security Model](#security-model)
7. [Getting Started](#getting-started)
8. [SaaS Roadmap — The Next Step](#saas-roadmap--the-next-step)
9. [License](#license)

---

## Overview

### The Problem
Most finance trackers are either too simplistic (just show a balance) or built for US/European markets with assumptions that don't fit the Nigerian context. They lack multi-currency support, assume credit-card centric spending, and rarely provide actionable forecasts.

### The Solution
WealthWise gives you **transaction logging**, **category budgeting**, **savings goals with forecasts**, **recurring transaction automation**, and **predictive analytics** — designed from the ground up with NGN support, responsive design for mobile-first African users, and a premium dark-by-default UI.

### Who It's For
- Salaried professionals who want to track where their paycheck goes
- Freelancers managing variable income
- Anyone saving toward a goal (emergency fund, vacation, investment)
- Small business owners tracking cash flow

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser (React SPA)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │   Pages   │ │Components│ │  Hooks (Logic)   │ │
│  └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │
│       │            │                 │           │
│  ┌────▼────────────▼─────────────────▼─────────┐ │
│  │         TanStack Query (Cache Layer)        │ │
│  │  Automatic invalidation, refetching, cache  │ │
│  └────┬────────────┬─────────────────┬─────────┘ │
│       │            │                 │           │
│  ┌────▼────┐ ┌────▼────┐ ┌──────────▼─────────┐ │
│  │  Clerk  │ │ Convex  │ │  Recharts (Charts)  │ │
│  │ (Auth)  │ │ (Data)  │ └────────────────────┘ │
│  └─────────┘ └────┬────┘                        │
└───────────────────┼─────────────────────────────┘
                    │
          ┌─────────▼─────────┐
          │  Convex Backend    │
          │  ┌───────────────┐ │
          │  │  Schema (TS)  │ │
          │  │  Queries      │ │
          │  │  Mutations    │ │
          │  │  Auth Check   │ │
          │  └───────────────┘ │
          └───────────────────┘
```

### Frontend
- **React 18 + Vite**: Fast dev server, ESM-based builds, HMR.
- **TypeScript**: Full type safety across the codebase.
- **Tailwind CSS + shadcn/ui**: Utility-first styling with a design system of accessible, composable components. Dark mode as default with `.light` class toggle.
- **TanStack Query v5**: Server-state management with automatic cache invalidation, background refetching, and optimistic updates.
- **React Router v6**: Client-side routing with lazy-loaded pages.
- **Recharts**: Declarative charting for cash flow, expense breakdowns, and budget comparisons.
- **Zod + React Hook Form**: Schema validation on both client and server sides.

### Backend
- **Convex**: Full-stack reactive backend — schema definitions, serverless functions (queries/mutations), real-time subscriptions, and file storage all in one. No REST/GraphQL boilerplate.
- **Clerk**: Authentication-as-a-service handling email/password, OAuth (Google, GitHub), magic links, session management, and JWT issuance.

---

## Feature Breakdown & How Calculations Work

### 1. Dashboard

| Stat | Calculation |
|------|-------------|
| **Total Balance** | `SUM(income) - SUM(expenses)` across all transactions |
| **Monthly Income** | `SUM(amount)` where `type = 'income'` and `date` falls in current month |
| **Monthly Expenses** | `SUM(amount)` where `type = 'expense'` and `date` falls in current month |
| **Savings Rate** | `(Monthly Income - Monthly Expenses) / Monthly Income × 100` |
| **Expenses by Category** | Group expenses by `category_id`, sum each group, return name + amount + color |
| **Cash Flow** | Group transactions by month, calculate income/expense/net per month for the last 6 months |

The dashboard queries (`convex/dashboard.ts`) filter by `userId` to ensure data isolation. Results are cached by TanStack Query with query keys like `['dashboard-stats', userId]`.

### 2. Transactions

Transactions are the core data entity. Each transaction has:
- `type`: `'income'` | `'expense'`
- `amount`: numeric value
- `category_id`: references a user's category
- `date`: ISO date string
- `notes`: optional text
- `user_id`: owner (set server-side from auth)

**CRUD operations** (`convex/transactions.ts`) include server-side auth checks and automatic cache invalidation for `transactions`, `dashboard-stats`, `expenses-by-category`, and `cash-flow` query keys on every mutation.

### 3. Categories

Users create custom categories with a name, type (`'income'` | `'expense'`), and color hex code. Categories are used to classify transactions and create budgets.

### 4. Budgets (Monthly)

| Concept | How It's Calculated |
|---------|---------------------|
| **Budget Amount** | Set by user per category per month/year |
| **Spent** | `SUM(expense.amount)` where `category_id` matches and `date` is in the budget's month |
| **Progress** | `(Spent / Budget Amount) × 100` |
| **Over Budget** | Progress > 100% |
| **Near Limit** | Progress > 80% and ≤ 100% |
| **Remaining** | `Budget Amount - Spent` |

The progress bar uses Tailwind's `[&>div]:bg-*` to color the bar fill — green (income) when on track, amber (warning) when near limit, red (expense) when over.

### 5. Savings Goals

| Concept | How It's Calculated |
|---------|---------------------|
| **Progress** | `(Current Amount / Target Amount) × 100` |
| **Forecast** | Linear projection: `daily_average = current_amount / days_since_creation`, then `days_to_complete = (target - current) / daily_average` |
| **Deadline Pace** | If deadline set: `daily_required = (target - current) / days_remaining` |
| **Completed** | `current_amount >= target_amount` — triggers a visual achievement badge |

### 6. Recurring Transactions

Templates for periodic income/expenses:
- **Monthly projection**: `amount × multiplier` where multiplier depends on frequency (daily = 30, weekly = 4, monthly = 1, yearly = 1/12)
- **Next occurrences**: Generate future dates by adding intervals from `next_run_date` using `date-fns`
- **Active/Paused**: Toggle via `is_active` boolean — inactive transactions are dimmed at 60% opacity

### 7. Analytics & Predictive Insights

| Metric | Calculation |
|--------|-------------|
| **Income Trend** | Linear regression slope on monthly income data |
| **Expense Trend** | Linear regression slope on monthly expense data |
| **Projected Income** | `avg_monthly_income + income_trend` |
| **Projected Expenses** | `avg_monthly_expenses + expense_trend` |
| **Savings Rate Trend** | Per-month `(income - expenses) / income × 100` plotted as a line |
| **Category Breakdown** | Percentage of total expenses per category, rendered as horizontal bars |

**Linear regression formula used:**
```
slope = (n × Σ(xy) - Σx × Σy) / (n × Σ(x²) - (Σx)²)
```
Where x = month index (0, 1, 2, ...), y = monthly value

---

## Tool Integrations Explained

### Clerk (Authentication)
- **What it does**: Handles user sign-up, sign-in, session management, and JWT token generation.
- **How it integrates**: `ClerkProvider` wraps the app at the root level (`src/App.tsx`). `ConvexProviderWithClerk` bridges Clerk auth with Convex by passing the Clerk JWT as the auth token to Convex.
- **JWT Template**: A custom "convex" template in Clerk Dashboard issues JWTs with an `aud: "convex"` claim. Convex validates this token on every backend request.
- **Auth flows**: Email/password, Google OAuth, GitHub OAuth, magic link. After sign-in, `setActive()` is explicitly called (required by Clerk v5) to activate the session before redirecting.
- **User initialization**: On first sign-in, the app calls `api.users.initializeNewUser` to create a Convex user record (with full name from Clerk profile).

### Convex (Backend + Database)
- **Schema** (`convex/schema.ts`): Defines tables for `users`, `transactions`, `categories`, `budgets`, `savings_goals`, `goal_progress`, `recurring_transactions`.
- **Auth middleware**: Every query and mutation reads `ctx.auth.getUserIdentity()` to determine the current user. Data access is always scoped to `userId`.
- **Real-time**: Convex pushes data changes to the frontend automatically via subscriptions. TanStack Query treats Convex queries as async functions, so data updates are reflected as cache refetches.
- **File storage**: Used for avatar uploads — `api.files.generateUploadUrl` creates a signed upload URL, then `api.files.saveAvatar` stores the storage ID.

### TanStack Query v5
- **Cache strategy**: Each data hook (`useTransactions`, `useBudgets`, `useDashboardStats`, etc.) creates a query with a key like `['transactions', userId]`. Mutations invalidate related keys to trigger refetches.
- **Invalidation graph**: When a transaction is added/updated/deleted, the following query keys are invalidated: `transactions`, `dashboard-stats`, `expenses-by-category`, `cash-flow`. When a budget changes: `budgets`, `dashboard-stats`. This keeps the entire UI consistent without manual refresh.
- **No stale data**: Components always read from the cache while refetches happen in the background.

### Recharts
- Used for: Cash flow area charts, monthly comparison bar charts, expense pie charts, savings rate trend lines, budget vs actual bar charts.
- **Theming**: Chart colors reference CSS custom properties (`hsl(var(--income))`, `hsl(var(--expense))`, etc.) so they automatically adapt to dark/light mode. Tooltip components use `hsl(var(--card))` for backgrounds and `hsl(var(--card-foreground))` for text.

### Zod + React Hook Form
- **Profile form**: Validates `full_name` (required, max 100 chars).
- **Financial form**: Validates `monthly_income` (non-negative) and `currency` (required).
- Server-side validation mirrors client-side via Convex schema types.

---

## Data Flow (End-to-End Example)

### Creating a Transaction
1. User fills the "Add Transaction" form and clicks submit
2. `useTransactions.addTransaction()` calls `useMutation` with a Convex mutation function
3. The mutation fires `api.transactions.create` on the Convex backend
4. Convex validates the auth token (issued by Clerk), extracts the user ID
5. Convex inserts the transaction record scoped to `userId`
6. On success, the mutation's `onSuccess` callback invalidates: `['transactions']`, `['dashboard-stats']`, `['expenses-by-category']`, `['cash-flow']`
7. Components subscribed to these queries automatically re-render with fresh data
8. The dashboard budget numbers, chart, and recent transactions list all update in <100ms

---

## Security Model

| Layer | Mechanism |
|-------|-----------|
| **Authentication** | Clerk manages sessions. JWTs are short-lived and signed. |
| **Data isolation** | Every Convex query/mutation checks `ctx.auth.getUserIdentity()` and filters by `userId`. No user can access another's data. |
| **Input validation** | Zod schemas on forms. Convex schema enforces types at the DB level. |
| **File uploads** | Signed upload URLs with expiration. Storage IDs are validated on save. |
| **Account deletion** | Calls both Clerk's `user.delete()` (removes auth account) and Convex's `api.users.deleteAccount` (removes all user data). |

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm / pnpm / yarn
- A Clerk account (free tier)
- A Convex account (free tier)

### Installation

```bash
git clone https://github.com/Boluwatife180872/WealthWise.git
cd WealthWise
npm install
```

### Environment Variables

Create `.env.local` in the root:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CONVEX_URL=https://your-project.convex.cloud
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

### Clerk Setup
1. Create an application in [Clerk Dashboard](https://dashboard.clerk.com)
2. Enable email/password, Google, and GitHub sign-in under "User & Authentication"
3. Go to "JWT Templates" → "Convex" → Set claims to include `"aud": "convex"`
4. Copy the `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_JWT_ISSUER_DOMAIN`

### Convex Setup
1. Run `npx convex dev` — it will prompt you to log in and create a project
2. Deploy the schema and functions automatically
3. Copy the deployment URL for `VITE_CONVEX_URL`

### Run

```bash
npx convex dev     # Terminal 1 — Convex backend
npm run dev        # Terminal 2 — Vite frontend
```

Open `http://localhost:8080`

---

## SaaS Roadmap — The Next Step

WealthWise has a solid foundation, but to become a thriving SaaS product, here are the key advancements organized by priority:

### Phase 1: Core Monetization (0–3 months)

| Feature | Description |
|---------|-------------|
| **Usage Limits** | Free tier: 50 transactions/month, 3 budgets, 2 goals. Premium: unlimited. |
| **Subscription Tiers** | Free → Premium ($4.99/mo) → Pro ($12.99/mo) via Stripe/Lemon Squeezy |
| **Team/Shared Budgets** | Households and small teams share budgets. Pro feature. |
| **PDF Reports** | Monthly PDF statements with breakdowns, trends, and tax summaries. |

### Phase 2: Bank Integration (3–6 months)

This is the biggest leap and what you mentioned — connecting to users' bank accounts for automatic transaction sync.

| Component | How It Works |
|-----------|-------------|
| **Open Banking API** | Integrate with an Open Banking provider like **Plaid** (US/UK), **TrueLayer** (Europe), or **Okra** / **Mono** / **OnePipe** (Nigeria/Africa). These provide secure, read-only access to bank transactions. |
| **Account Linking** | User authenticates via their bank's OAuth flow (redirect to bank, grant consent, redirect back). No passwords stored. |
| **Automatic Sync** | A backend cron job polls the Open Banking API daily to fetch new transactions and reconcile them with the user's categories. |
| **Transaction Enrichment** | Use the bank's merchant/category data to auto-tag transactions. Users can override. |
| **Balance Verification** | Cross-check the app's calculated balance against the bank's reported balance to catch missing transactions. |
| **Reconciliation** | Mark bank-verified transactions with a "✓ Reconciled" badge. Flag mismatches. |

**Key integration: Okra / Mono (Nigeria)**  
Both Okra and Mono specialize in African bank APIs. They support GTBank, Access Bank, UBA, First Bank, and 30+ other Nigerian banks. Integration flow:
1. User clicks "Link Bank Account"
2. A popup/modal shows a list of supported banks
3. User selects their bank and logs in via the bank's secure portal
4. Okra/Mono returns an access token
5. Backend uses the token to fetch account details and transactions
6. Schedule a daily cron to pull new transactions

### Phase 3: Intelligence & Automation (6–9 months)

| Feature | Description |
|---------|-------------|
| **AI-Powered Categorization** | ML model (or LLM API) automatically categorizes new transactions based on merchant name and amount. |
| **Smart Alerts** | "You usually spend ₦5,000 on data by the 10th — it's the 12th and no data expense recorded yet." |
| **Anomaly Detection** | Flag unusual transactions (e.g., a ₦500,000 withdrawal when average is ₦20,000). |
| **Spending Insights** | Weekly/monthly natural language summaries via GPT API: "You spent 30% more on dining this month." |
| **Goal Auto-Adjustment** | If spending drops in one category, suggest reallocating the surplus to a savings goal. |

### Phase 4: Scale & Enterprise (9–12 months)

| Feature | Description |
|---------|-------------|
| **Multi-Currency Wallets** | Track balances across NGN, USD, GBP with auto-conversion rates via a forex API. |
| **API Access** | Public REST API for developers to build on top of WealthWise data (with user consent). |
| **White-Label** | Offer WealthWise as a branded finance tool for businesses to give to their employees. |
| **Investment Tracking** | Allow users to link investment accounts (Stocks, Crypto, Mutual Funds) and track portfolio performance alongside cash flow. |
| **Tax Preparation** | Generate expense reports categorized for tax filing (especially useful for freelancers). |
| **Audit Logs** | Full history of every change for compliance. |

### Technical Scalability Considerations

| Area | Current | Future |
|------|---------|--------|
| **Database** | Convex (serverless, auto-scaling) | Add read replicas, data warehouse (ClickHouse) for analytics queries |
| **Caching** | TanStack Query (in-memory) | Add Redis for cross-session cache, rate limiting |
| **Background Jobs** | None (everything is synchronous) | Queue system (BullMQ / Inngest) for bank sync, email reports, PDF generation |
| **Webhook System** | None | Webhook delivery for "transaction created", "budget exceeded" events |
| **CDN** | Vite-built static assets | Asset delivery via Cloudflare or AWS CloudFront |
| **Monitoring** | None | Sentry for error tracking, PostHog for product analytics, Grafana for infrastructure |
| **Backups** | Convex handles redundancy | Daily encrypted exports to user's cloud storage (Google Drive, Dropbox) |

### Recommended Tech for Next Phase

| Need | Recommended Tool |
|------|-----------------|
| **Payments** | Lemon Squeezy (global tax handling) or Stripe |
| **Bank integration (Nigeria)** | Mono API or Okra |
| **Bank integration (Global)** | Plaid |
| **Email** | Resend or Loops |
| **Background jobs** | Inngest (works well with Convex) |
| **AI/ML** | OpenAI GPT-4 API for insights, or a fine-tuned model for categorization |
| **Analytics** | PostHog (self-hostable, privacy-first) |
| **Error tracking** | Sentry |
| **PDF generation** | React-PDF or PDFKit on the backend |

---

## License

WealthWise is currently for educational and portfolio purposes.
