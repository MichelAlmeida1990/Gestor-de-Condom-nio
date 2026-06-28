import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória')
});

// Expense validation schemas
export const expenseSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória').max(255, 'Descrição muito longa'),
  amount: z.number().positive('Valor deve ser positivo'),
  category: z.string().min(1, 'Categoria obrigatória').max(100, 'Categoria muito longa'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  attachment_url: z.string().url('URL inválida').optional().nullable()
});

export const expenseUpdateSchema = expenseSchema.partial();

// Income validation schemas
export const incomeSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória').max(255, 'Descrição muito longa'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)')
});

export const incomeUpdateSchema = incomeSchema.partial();

// Notification validation schemas
export const notificationSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(200, 'Título muito longo'),
  message: z.string().min(1, 'Mensagem obrigatória').max(1000, 'Mensagem muito longa'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de expiração inválida').optional().nullable()
});

export const notificationUpdateSchema = notificationSchema.partial();

// ID validation
export const idSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID inválido').transform(Number)
});

// Reservation validation schema
export const reservationSchema = z.object({
  area_name: z.enum(['Salão de Festas', 'Churrasqueira', 'Espaço Gourmet', 'Quadra Poliesportiva']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
  time_slot: z.enum([
    'Manhã (08:00 - 12:00)',
    'Tarde (13:00 - 17:00)',
    'Noite (18:00 - 22:00)',
    'Dia Inteiro (08:00 - 22:00)'
  ])
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type IncomeUpdateInput = z.infer<typeof incomeUpdateSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export type NotificationUpdateInput = z.infer<typeof notificationUpdateSchema>;
export type IdInput = z.infer<typeof idSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;
