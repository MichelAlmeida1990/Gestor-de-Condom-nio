import { Router } from "express";
import { query, run, saveDB } from "../database.js";
import { AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { expenseSchema } from "../validation.js";

const router = Router();

function getDB() {
  return (global as any).__db;
}

router.get("/", authenticate, (req: AuthRequest, res) => {
  const data = query(getDB(), "SELECT * FROM expenses ORDER BY date DESC");
  res.json(data);
});

router.post("/", authenticate, isAdmin, (req: AuthRequest, res) => {
  try {
    const validation = expenseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { description, amount, category, date, attachment_url } = validation.data;
    query(getDB(), "INSERT INTO expenses (description, amount, category, date, attachment_url) VALUES (?, ?, ?, ?, ?)",
      [description, amount, category, date, attachment_url || null]);
    const id = (query(getDB(), "SELECT last_insert_rowid() as id")[0].id);
    saveDB(getDB());
    res.json({ id });
  } catch (error) {
    console.error("Expense creation error:", error);
    res.status(500).json({ error: "Erro ao criar despesa" });
  }
});

router.put("/:id", authenticate, isAdmin, (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const validation = expenseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { description, amount, category, date, attachment_url } = validation.data;
    const { rowCount } = run(getDB(), "UPDATE expenses SET description=?, amount=?, category=?, date=?, attachment_url=? WHERE id=?",
      [description, amount, category, date, attachment_url || null, id]);
    if (rowCount === 0) return res.status(404).json({ error: "Despesa não encontrada" });
    saveDB(getDB());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar despesa" });
  }
});

router.delete("/:id", authenticate, isAdmin, (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const { rowCount } = run(getDB(), "DELETE FROM expenses WHERE id=?", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Despesa não encontrada" });
    saveDB(getDB());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar despesa" });
  }
});

export default router;
