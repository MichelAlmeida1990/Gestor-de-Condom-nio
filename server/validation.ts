import { z } from "zod";

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  unit: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Expense validation schema
export const expenseSchema = z.object({
  description: z.string().min(2, "Descrição deve ter no mínimo 2 caracteres"),
  amount: z.number().positive("Valor deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  attachment_url: z.string().url().optional().or(z.literal("")),
});

// Income validation schema
export const incomeSchema = z.object({
  description: z.string().min(2, "Descrição deve ter no mínimo 2 caracteres"),
  amount: z.number().positive("Valor deve ser positivo"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
});

// Notification validation schema
export const notificationSchema = z.object({
  title: z.string().min(2, "Título deve ter no mínimo 2 caracteres"),
  message: z.string().min(2, "Mensagem deve ter no mínimo 2 caracteres"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de expiração deve estar no formato YYYY-MM-DD").optional().or(z.literal("")),
});

// Occurrence validation schema
export const occurrenceSchema = z.object({
  type: z.string().min(1, "Tipo é obrigatório"),
  description: z.string().min(2, "Descrição deve ter no mínimo 2 caracteres"),
  occurrence_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional().or(z.literal("")),
  occurrence_time: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM").optional().or(z.literal("")),
  evidence_url: z.string().url().optional().or(z.literal("")),
});

export const maintenanceSchema = z.object({
  title: z.string().min(2, "Título deve ter no mínimo 2 caracteres"),
  description: z.string().min(2, "Descrição deve ter no mínimo 2 caracteres"),
  category: z.string().min(1, "Categoria é obrigatória"),
  priority: z.enum(["low", "medium", "high", "urgent"], "Prioridade inválida"),
  assigned_to: z.string().optional().or(z.literal("")),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  cost: z.number().positive("Custo deve ser positivo").optional(),
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  phone: z.string().optional(),
  unit: z.string().optional(),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos").optional().or(z.literal("")),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento deve estar no formato YYYY-MM-DD").optional().or(z.literal("")),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  blood_type: z.string().optional(),
  health_notes: z.string().optional(),
  vehicles: z.string().optional(),
});

// User status update validation schema
export const userStatusSchema = z.object({
  status: z.enum(["active", "rejected", "pending"], "Status inválido"),
});

// Reservation validation schema
export const reservationSchema = z.object({
  area_name: z.enum(['Salão de Festas', 'Churrasqueira', 'Espaço Gourmet', 'Quadra Poliesportiva']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  time_slot: z.enum([
    'Manhã (08:00 - 12:00)',
    'Tarde (13:00 - 17:00)',
    'Noite (18:00 - 22:00)',
    'Dia Inteiro (08:00 - 22:00)'
  ]),
});
