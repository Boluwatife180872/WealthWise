Personal Finance Tracker

A full-stack personal finance and budgeting application that helps users track income and expenses, set budgets, manage savings goals, and gain insights into their financial habits through analytics and visualizations.

📌 Project Overview

The Personal Finance Tracker is a modern money management web application designed to give users full visibility and control over their finances. It allows users to log transactions, categorize spending, set monthly budgets, define savings goals, automate recurring transactions, and analyze financial trends over time.

The application is built with a focus on clarity, usability, responsiveness, and data security, making it suitable for everyday personal finance management without relying on spreadsheets.

🎯 What the App Does

Tracks where your money comes from and where it goes

Helps prevent overspending with category-based budgets

Encourages saving through measurable savings goals

Automates recurring financial activities

Visualizes financial data using charts and analytics

🧩 Core Features
Dashboard

Displays total balance, monthly income, and monthly expenses

Visual charts for expenses by category

Quick overview of recent transactions

Instant snapshot of financial health

Transaction Tracking

Log income and expenses with:

Amount

Category

Date

Notes

Edit and delete transactions

Filter by category, date range, and transaction type

Budgets

Set monthly spending limits per category

Track budget usage in real time

Visual indicators for remaining and exceeded budgets

Savings Goals

Create savings goals (e.g., vacation, emergency fund)

Track progress toward a target amount

View completion percentage and progress indicators

Recurring Transactions

Automate repeating transactions such as rent, subscriptions, or salary

Supports daily, weekly, monthly, and yearly intervals

Prevents missed or forgotten transactions

Categories

Default categories (Food, Transport, Salary, Bills, etc.)

Custom category creation

Organized spending analysis by category

Analytics & Insights

Expense distribution by category

Cash flow trends over time

Monthly income vs expense comparison

Helps identify spending patterns and habits

CSV Import & Export

Import transactions from CSV files (e.g., bank statements)

Export transaction history for backup or external analysis

User Settings

Update profile information

Theme support (light & dark mode)

Secure authentication and session handling

Responsive Design

Fully responsive across desktop, tablet, and mobile

Collapsible sidebar with mobile toggle

Accessible and clean UI

👥 Who This App Is For

Individuals who want to stop living paycheck-to-paycheck

Anyone saving for goals like a house, car, vacation, or emergency fund

Users who want insight into their spending habits

People who want spreadsheet-level control with a better UX

🛠️ Tech Stack
Frontend

React – UI library for building interactive interfaces

TypeScript – Static typing for better reliability and maintainability

Vite – Fast development and build tooling

Styling & UI

Tailwind CSS – Utility-first styling

shadcn/ui – Reusable, accessible UI components

State & Forms

Zustand / Context API – Global state management

React Hook Form – Form handling

Zod – Schema-based form validation

Charts & Visualization

Chart.js / Recharts – Financial data visualization

Backend & Data

Supabase

Authentication (email/password, OAuth)

PostgreSQL database

Row Level Security (RLS)

File storage

🚀 Getting Started (Local Development)
Prerequisites

Make sure you have:

Node.js (v18 or higher recommended)

npm (comes with Node.js)

Installation

# Clone the repository

git clone <YOUR_GIT_URL>

# Navigate into the project folder

cd <YOUR_PROJECT_NAME>

# Install dependencies

npm install

Environment Variables

Create a .env file in the root directory and add:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

Run the App

# Start the development server

npm run dev

The app will be available at:

http://localhost:5173

🧪 Build for Production
npm run build
npm run preview

🔐 Security Notes

Authentication handled securely via Supabase

Database protected using Row Level Security (RLS)

Users can only access their own data

No sensitive secrets exposed on the client

📁 Project Structure (Simplified)
src/
components/ # Reusable UI components
pages/ # App pages (Dashboard, Budgets, Analytics, etc.)
hooks/ # Custom React hooks
store/ # Global state management
services/ # Supabase and API logic
utils/ # Helper functions
types/ # TypeScript types

📈 Future Improvements (Optional)

Automated financial insights using AI

Bank API integrations

Notifications and alerts

Multi-currency support

Offline support

📄 License

This project is for educational and portfolio purposes.
You are free to extend and customize it for personal use.
