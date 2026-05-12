import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false });
const PORT = parseInt(process.env.PORT || "3000");
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:5173"];

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET não configurado no arquivo .env");
  process.exit(1);
}

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT CHECK(role IN ('admin', 'resident'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      description TEXT,
      amount NUMERIC,
      category TEXT,
      date TEXT,
      attachment_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS income (
      id SERIAL PRIMARY KEY,
      description TEXT,
      amount NUMERIC,
      date TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      title TEXT,
      message TEXT,
      date TEXT,
      expires_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@condo.com";
  const { rows: adminRows } = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
  if (adminRows.length === 0) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "ChangeMe123!", 12);
    await pool.query("INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)", [adminEmail, hash, "Síndico Admin", "admin"]);
  }

  // Seed resident
  const residentEmail = process.env.RESIDENT_EMAIL || "morador@condo.com";
  const { rows: residentRows } = await pool.query("SELECT id FROM users WHERE email = $1", [residentEmail]);
  if (residentRows.length === 0) {
    const hash = bcrypt.hashSync(process.env.RESIDENT_PASSWORD || "ChangeMe123!", 12);
    await pool.query("INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)", [residentEmail, hash, "Morador João", "resident"]);
  }

  // Seed expenses
  const { rows: expRows } = await pool.query("SELECT COUNT(*) as count FROM expenses");
  if (parseInt(expRows[0].count) === 0) {
    const expenses = [
      ["Manutenção Elevador", 1200.50, "Manutenção", "2024-01-10"],
      ["Conta de Luz - Áreas Comuns", 850.00, "Energia/Água", "2024-01-15"],
      ["Limpeza Quinzenal", 450.00, "Limpeza", "2024-01-20"],
      ["Reparo Portão Garagem", 320.00, "Manutenção", "2024-01-25"],
    ];
    for (const [desc, amt, cat, date] of expenses) {
      await pool.query("INSERT INTO expenses (description, amount, category, date) VALUES ($1, $2, $3, $4)", [desc, amt, cat, date]);
    }
  }

  // Seed income
  const { rows: incRows } = await pool.query("SELECT COUNT(*) as count FROM income");
  if (parseInt(incRows[0].count) === 0) {
    await pool.query("INSERT INTO income (description, amount, date) VALUES ($1, $2, $3)", ["Cotas Condominiais - JAN", 15000.00, "2024-01-05"]);
  }

  // Seed notifications
  const { rows: notifRows } = await pool.query("SELECT COUNT(*) as count FROM notifications");
  if (parseInt(notifRows[0].count) === 0) {
    await pool.query("INSERT INTO notifications (title, message, date) VALUES ($1, $2, $3)", [
      "Manutenção de Elevadores",
      "O elevador social do bloco A passará por manutenção preventiva na próxima segunda-feira (10/02) entre 09:00 e 12:00.",
      "2024-01-30",
    ]);
  }
}

async function startServer() {
  await initDB();

  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET!);
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    next();
  };

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email e senha são obrigatórios" });
      const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const user = rows[0];
      if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Credenciais inválidas" });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET!, { expiresIn: "24h" });
      res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Expenses
  app.get("/api/expenses", authenticate, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM expenses ORDER BY date DESC");
    res.json(rows);
  });

  app.post("/api/expenses", authenticate, isAdmin, async (req, res) => {
    try {
      const { description, amount, category, date, attachment_url } = req.body;
      if (!description || !amount || !category || !date) return res.status(400).json({ error: "Campos obrigatórios: description, amount, category, date" });
      if (typeof amount !== "number" || amount <= 0) return res.status(400).json({ error: "Valor deve ser um número positivo" });
      const { rows } = await pool.query(
        "INSERT INTO expenses (description, amount, category, date, attachment_url) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [description, amount, category, date, attachment_url]
      );
      res.json({ id: rows[0].id });
    } catch (error) {
      console.error("Expense creation error:", error);
      res.status(500).json({ error: "Erro ao criar despesa" });
    }
  });

  app.put("/api/expenses/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
      const { description, amount, category, date, attachment_url } = req.body;
      if (!description || !amount || !category || !date) return res.status(400).json({ error: "Campos obrigatórios: description, amount, category, date" });
      if (typeof amount !== "number" || amount <= 0) return res.status(400).json({ error: "Valor deve ser um número positivo" });
      const { rowCount } = await pool.query(
        "UPDATE expenses SET description=$1, amount=$2, category=$3, date=$4, attachment_url=$5 WHERE id=$6",
        [description, amount, category, date, attachment_url, id]
      );
      if (rowCount === 0) return res.status(404).json({ error: "Despesa não encontrada" });
      res.json({ success: true });
    } catch (error) {
      console.error("Expense update error:", error);
      res.status(500).json({ error: "Erro ao atualizar despesa" });
    }
  });

  app.delete("/api/expenses/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
      const { rowCount } = await pool.query("DELETE FROM expenses WHERE id=$1", [id]);
      if (rowCount === 0) return res.status(404).json({ error: "Despesa não encontrada" });
      res.json({ success: true });
    } catch (error) {
      console.error("Expense deletion error:", error);
      res.status(500).json({ error: "Erro ao deletar despesa" });
    }
  });

  // Income
  app.get("/api/income", authenticate, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM income ORDER BY date DESC");
    res.json(rows);
  });

  app.post("/api/income", authenticate, isAdmin, async (req, res) => {
    try {
      const { description, amount, date } = req.body;
      if (!description || !amount || !date) return res.status(400).json({ error: "Campos obrigatórios: description, amount, date" });
      if (typeof amount !== "number" || amount <= 0) return res.status(400).json({ error: "Valor deve ser um número positivo" });
      const { rows } = await pool.query("INSERT INTO income (description, amount, date) VALUES ($1, $2, $3) RETURNING id", [description, amount, date]);
      res.json({ id: rows[0].id });
    } catch (error) {
      console.error("Income creation error:", error);
      res.status(500).json({ error: "Erro ao criar receita" });
    }
  });

  // Notifications
  app.get("/api/notifications", authenticate, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM notifications ORDER BY date DESC");
    res.json(rows);
  });

  app.post("/api/notifications", authenticate, isAdmin, async (req, res) => {
    try {
      const { title, message, date, expires_at } = req.body;
      if (!title || !message || !date) return res.status(400).json({ error: "Campos obrigatórios: title, message, date" });
      const { rows } = await pool.query(
        "INSERT INTO notifications (title, message, date, expires_at) VALUES ($1, $2, $3, $4) RETURNING id",
        [title, message, date, expires_at]
      );
      res.json({ id: rows[0].id });
    } catch (error) {
      console.error("Notification creation error:", error);
      res.status(500).json({ error: "Erro ao criar notificação" });
    }
  });

  app.delete("/api/notifications/:id", authenticate, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
      const { rowCount } = await pool.query("DELETE FROM notifications WHERE id=$1", [id]);
      if (rowCount === 0) return res.status(404).json({ error: "Notificação não encontrada" });
      res.json({ success: true });
    } catch (error) {
      console.error("Notification deletion error:", error);
      res.status(500).json({ error: "Erro ao deletar notificação" });
    }
  });

  // Transparency
  app.get("/api/transparency/summary", authenticate, async (req, res) => {
    const { rows: expTotal } = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM expenses");
    const { rows: incTotal } = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM income");
    const { rows: byCategory } = await pool.query("SELECT category, SUM(amount) as total FROM expenses GROUP BY category");
    res.json({
      totalExpenses: parseFloat(expTotal[0].total),
      totalIncome: parseFloat(incTotal[0].total),
      balance: parseFloat(incTotal[0].total) - parseFloat(expTotal[0].total),
      expensesByCategory: byCategory.map((r) => ({ category: r.category, total: parseFloat(r.total) })),
    });
  });

  // Vite middleware (dev) or static (prod)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ root: __dirname, server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
