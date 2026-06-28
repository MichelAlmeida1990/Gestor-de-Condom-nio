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
  cpf?: string;
  birthdate?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  blood_type?: string;
  health_notes?: string;
  vehicles?: string;
  created_at: string;
}

export interface Occurrence {
  id: number;
  user_id: number;
  user_name?: string;
  unit?: string;
  type: string;
  description: string;
  occurrence_date?: string;
  occurrence_time?: string;
  evidence_url?: string;
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

export interface MaintenanceRequest {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  requested_by: string;
  assigned_to?: string;
  cost?: number;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export interface TransparencySummary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  expensesByCategory: { category: string; total: number }[];
}

export interface Reservation {
  id: number;
  user_id: number;
  user_name?: string;
  unit?: string;
  area_name: "Salão de Festas" | "Churrasqueira" | "Espaço Gourmet" | "Quadra Poliesportiva";
  date: string;
  time_slot: "Manhã (08:00 - 12:00)" | "Tarde (13:00 - 17:00)" | "Noite (18:00 - 22:00)" | "Dia Inteiro (08:00 - 22:00)";
  status: "pending" | "approved" | "rejected";
  created_at: string;
}
