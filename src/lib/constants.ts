export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
] as const;

export const CATEGORY_ICONS = [
  'utensils', 'car', 'zap', 'home', 'heart', 'gamepad-2', 'graduation-cap',
  'shopping-bag', 'more-horizontal', 'briefcase', 'laptop', 'trending-up',
  'plus-circle', 'plane', 'gift', 'music', 'film', 'book', 'coffee',
  'pizza', 'shirt', 'scissors', 'wrench', 'baby', 'dog', 'dumbbell'
] as const;

export const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#ec4899',
  '#06b6d4', '#eab308', '#22c55e', '#14b8a6', '#f59e0b', '#64748b',
  '#84cc16', '#a855f7', '#0ea5e9', '#f43f5e'
] as const;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const;
