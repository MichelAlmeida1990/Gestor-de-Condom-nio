import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../database.js";
import { checkLoginRateLimit, resetLoginRateLimit } from "../middleware.js";
import { registerSchema, loginSchema } from "../validation.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { email, password, name, unit, phone } = validation.data;
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.length > 0) return res.status(409).json({ error: "Email já cadastrado" });
    const hash = bcrypt.hashSync(password, 12);
    await query(
      "INSERT INTO users (email, password, name, role, status, unit, phone) VALUES ($1, $2, $3, 'resident', 'pending', $4, $5)",
      [email, hash, name, unit || null, phone || null]
    );
    res.status(201).json({ message: "Cadastro realizado! Aguarde a aprovação do síndico." });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Erro ao realizar cadastro" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    console.log('[AUTH] /login body:', JSON.stringify(req.body));
    const ip = (req.ip ?? req.socket.remoteAddress) || "unknown";
    if (!checkLoginRateLimit(ip)) return res.status(429).json({ error: "Muitas tentativas. Tente novamente em 15 minutos." });
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { email, password } = validation.data;
    const rows = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password as string)) return res.status(401).json({ error: "Credenciais inválidas" });
    if (user.status === "pending") return res.status(403).json({ error: "Cadastro aguardando aprovação do síndico." });
    if (user.status === "rejected") return res.status(403).json({ error: "Cadastro não aprovado. Entre em contato com o síndico." });
    resetLoginRateLimit(ip);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    console.error("Login error:", error && (error.stack || error));
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
