const express = require("express");
const { createServer: createViteServer } = require("vite");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
// const { z } = require("zod");
// import { loginSchema, expenseSchema, incomeSchema, notificationSchema, idSchema } from "./src/lib/validation";

dotenv.config();

const __dirname = path.resolve();
// For ES Modules, __dirname and __filename are not globally available.
// We need to derive them from import.meta.url.
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(process.env.DB_PATH || "condo.db");
const PORT = parseInt(process.env.PORT || "3000");
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:5173"];

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET não configurado no arquivo .env");
  process.exit(1);
}

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT CHECK(role IN ('admin', 'resident'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    amount REAL,
    category TEXT,
    date TEXT,
    attachment_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    amount REAL,
    date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    message TEXT,
    date TEXT,
    expires_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default users
const seedData = () => {
  const adminExists = db.prepare("SELECT * FROM users WHERE email = ?").get(process.env.ADMIN_EMAIL || "admin@condo.com");
  if (!adminExists) {
    const adminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "ChangeMe123!", 12);
    db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
      process.env.ADMIN_EMAIL || "admin@condo.com",
      adminPassword,
      "Síndico Admin",
      "admin"
    );
  }

  const residentExists = db.prepare("SELECT * FROM users WHERE email = ?").get(process.env.RESIDENT_EMAIL || "morador@condo.com");
  if (!residentExists) {
    const residentPassword = bcrypt.hashSync(process.env.RESIDENT_PASSWORD || "ChangeMe123!", 12);
    db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
      process.env.RESIDENT_EMAIL || "morador@condo.com",
      residentPassword,
      "Morador João",
      "resident"
    );
  }

  // Sample Expenses
  const expCount = (db.prepare("SELECT COUNT(*) as count FROM expenses").get() as any).count;
  if (expCount === 0) {
    const expenses = [
      ["Manutenção Elevador", 1200.50, "Manutenção", "2024-01-10"],
      ["Conta de Luz - Áreas Comuns", 850.00, "Energia/Água", "2024-01-15"],
      ["Limpeza Quinzenal", 450.00, "Limpeza", "2024-01-20"],
      ["Reparo Portão Garagem", 320.00, "Manutenção", "2024-01-25"],
    ];
    for (const [desc, amt, cat, date] of expenses) {
      db.prepare("INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)").run(desc, amt, cat, date);
    }
  }

  // Sample Income
  const incCount = (db.prepare("SELECT COUNT(*) as count FROM income").get() as any).count;
  if (incCount === 0) {
    db.prepare("INSERT INTO income (description, amount, date) VALUES (?, ?, ?)").run("Cotas Condominiais - JAN", 15000.00, "2024-01-05");
  }

  // Sample Notifications
  const notifCount = (db.prepare("SELECT COUNT(*) as count FROM notifications").get() as any).count;
  if (notifCount === 0) {
    db.prepare("INSERT INTO notifications (title, message, date) VALUES (?, ?, ?)").run(
      "Manutenção de Elevadores",
      "O elevador social do bloco A passará por manutenção preventiva na próxima segunda-feira (10/02) entre 09:00 e 12:00.",
      "2024-01-30"
    );
  }
};
seedData();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  };

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }
      
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Expense Routes
  app.get("/api/expenses", authenticate, (req, res) => {
    const expenses = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
    res.json(expenses);
  });

  app.post("/api/expenses", authenticate, isAdmin, (req, res) => {
    try {
      const { description, amount, category, date, attachment_url } = req.body;
      
      if (!description || !amount || !category || !date) {
        return res.status(400).json({ error: "Campos obrigatórios: description, amount, category, date" });
      }
      
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Valor deve ser um número positivo" });
      }
      
      const result = db.prepare(
        "INSERT INTO expenses (description, amount, category, date, attachment_url) VALUES (?, ?, ?, ?, ?)"
      ).run(description, amount, category, date, attachment_url);
      
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      console.error('Expense creation error:', error);
      res.status(500).json({ error: "Erro ao criar despesa" });
    }
  });

  app.put("/api/expenses/:id", authenticate, isAdmin, (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const { description, amount, category, date, attachment_url } = req.body;
      
      if (!description || !amount || !category || !date) {
        return res.status(400).json({ error: "Campos obrigatórios: description, amount, category, date" });
      }
      
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Valor deve ser um número positivo" });
      }
      
      const result = db.prepare(
        "UPDATE expenses SET description = ?, amount = ?, category = ?, date = ?, attachment_url = ? WHERE id = ?"
      ).run(description, amount, category, date, attachment_url, id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: "Despesa não encontrada" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Expense update error:', error);
      res.status(500).json({ error: "Erro ao atualizar despesa" });
    }
  });

  app.delete("/api/expenses/:id", authenticate, isAdmin, (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const result = db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: "Despesa não encontrada" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Expense deletion error:', error);
      res.status(500).json({ error: "Erro ao deletar despesa" });
    }
  });

  // Income Routes
  app.get("/api/income", authenticate, (req, res) => {
    const income = db.prepare("SELECT * FROM income ORDER BY date DESC").all();
    res.json(income);
  });

  app.post("/api/income", authenticate, isAdmin, (req, res) => {
    try {
      const { description, amount, date } = req.body;
      
      if (!description || !amount || !date) {
        return res.status(400).json({ error: "Campos obrigatórios: description, amount, date" });
      }
      
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Valor deve ser um número positivo" });
      }
      
      const result = db.prepare(
        "INSERT INTO income (description, amount, date) VALUES (?, ?, ?)"
      ).run(description, amount, date);
      
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      console.error('Income creation error:', error);
      res.status(500).json({ error: "Erro ao criar receita" });
    }
  });

  // Notification Routes
  app.get("/api/notifications", authenticate, (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY date DESC").all();
    res.json(notifications);
  });

  app.post("/api/notifications", authenticate, isAdmin, (req, res) => {
    try {
      const { title, message, date, expires_at } = req.body;
      
      if (!title || !message || !date) {
        return res.status(400).json({ error: "Campos obrigatórios: title, message, date" });
      }
      
      const result = db.prepare(
        "INSERT INTO notifications (title, message, date, expires_at) VALUES (?, ?, ?, ?)"
      ).run(title, message, date, expires_at);
      
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      console.error('Notification creation error:', error);
      res.status(500).json({ error: "Erro ao criar notificação" });
    }
  });

  app.delete("/api/notifications/:id", authenticate, isAdmin, (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      const result = db.prepare("DELETE FROM notifications WHERE id = ?").run(id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: "Notificação não encontrada" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Notification deletion error:', error);
      res.status(500).json({ error: "Erro ao deletar notificação" });
    }
  });

  // Transparency Summary
  app.get("/api/transparency/summary", authenticate, (req, res) => {
    const totalExpenses = db.prepare("SELECT SUM(amount) as total FROM expenses").get() as any;
    const totalIncome = db.prepare("SELECT SUM(amount) as total FROM income").get() as any;
    const expensesByCategory = db.prepare("SELECT category, SUM(amount) as total FROM expenses GROUP BY category").all();
    
    res.json({
      totalExpenses: totalExpenses?.total || 0,
      totalIncome: totalIncome?.total || 0,
      balance: (totalIncome?.total || 0) - (totalExpenses?.total || 0),
      expensesByCategory
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
