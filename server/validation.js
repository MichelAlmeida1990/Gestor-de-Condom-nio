"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationSchema = exports.userStatusSchema = exports.profileUpdateSchema = exports.occurrenceSchema = exports.notificationSchema = exports.incomeSchema = exports.expenseSchema = exports.loginSchema = exports.registerSchema = void 0;
var zod_1 = require("zod");
// Auth validation schemas
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Email inválido"),
    password: zod_1.z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    name: zod_1.z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    unit: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Email inválido"),
    password: zod_1.z.string().min(1, "Senha é obrigatória"),
});
// Expense validation schema
exports.expenseSchema = zod_1.z.object({
    description: zod_1.z.string().min(2, "Descrição deve ter no mínimo 2 caracteres"),
    amount: zod_1.z.number().positive("Valor deve ser positivo"),
    category: zod_1.z.string().min(1, "Categoria é obrigatória"),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
    attachment_url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
});
// Income validation schema
exports.incomeSchema = zod_1.z.object({
    description: zod_1.z.string().min(2, "Descrição deve ter no mínimo 2 caracteres"),
    amount: zod_1.z.number().positive("Valor deve ser positivo"),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
});
// Notification validation schema
exports.notificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, "Título deve ter no mínimo 2 caracteres"),
    message: zod_1.z.string().min(2, "Mensagem deve ter no mínimo 2 caracteres"),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
    expires_at: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de expiração deve estar no formato YYYY-MM-DD").optional().or(zod_1.z.literal("")),
});
// Occurrence validation schema
exports.occurrenceSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, "Tipo é obrigatório"),
    description: zod_1.z.string().min(2, "Descrição deve ter no mínimo 2 caracteres"),
});
// Profile update validation schema
exports.profileUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    phone: zod_1.z.string().optional(),
    unit: zod_1.z.string().optional(),
    cpf: zod_1.z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos").optional().or(zod_1.z.literal("")),
    birthdate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento deve estar no formato YYYY-MM-DD").optional().or(zod_1.z.literal("")),
    emergency_contact: zod_1.z.string().optional(),
    emergency_phone: zod_1.z.string().optional(),
    blood_type: zod_1.z.string().optional(),
    health_notes: zod_1.z.string().optional(),
    vehicles: zod_1.z.string().optional(),
});
// User status update validation schema
exports.userStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["active", "rejected", "pending"], "Status inválido"),
});
// Reservation validation schema
exports.reservationSchema = zod_1.z.object({
    area_name: zod_1.z.enum(['Salão de Festas', 'Churrasqueira', 'Espaço Gourmet', 'Quadra Poliesportiva']),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
    time_slot: zod_1.z.enum([
        'Manhã (08:00 - 12:00)',
        'Tarde (13:00 - 17:00)',
        'Noite (18:00 - 22:00)',
        'Dia Inteiro (08:00 - 22:00)'
    ]),
});
