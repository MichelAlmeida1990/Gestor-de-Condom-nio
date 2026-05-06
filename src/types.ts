export type UserRole = "admin" | "resident";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  attachment_url?: string;
  created_at: string;
}

export interface Income {
  id: number;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  expires_at?: string;
  created_at: string;
}

export interface TransparencySummary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  expensesByCategory: { category: string; total: number }[];
}
