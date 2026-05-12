export type UserRole = "admin" | "resident";
export type UserStatus = "pending" | "active" | "rejected";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  unit?: string;
  phone?: string;
}

export interface ResidentUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  unit?: string;
  phone?: string;
  created_at: string;
}

export interface Occurrence {
  id: number;
  user_id: number;
  user_name?: string;
  unit?: string;
  type: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  admin_response?: string;
  created_at: string;
  updated_at: string;
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
