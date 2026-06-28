import { Router } from "express";
import { query, run } from "../database.js";
import { type AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { expenseSchema } from "../validation.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const data = await query("SELECT * FROM expenses ORDER BY date DESC");
  res.json(data);
});

router.post("/", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const validation = expenseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { description, amount, category, date, attachment_url } = validation.data;
    const rows = await query<{ id: number }>(
      "INSERT INTO expenses (description, amount, category, date, attachment_url) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [description, amount, category, date, attachment_url || null]
    );
    res.json({ id: rows[0]?.id });
  } catch (error) {
    console.error("Expense creation error:", error);
    res.status(500).json({ error: "Erro ao criar despesa" });
  }
});

router.put("/:id", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const validation = expenseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { description, amount, category, date, attachment_url } = validation.data;
    const { rowCount } = await run(
      "UPDATE expenses SET description=$1, amount=$2, category=$3, date=$4, attachment_url=$5 WHERE id=$6",
      [description, amount, category, date, attachment_url || null, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Despesa não encontrada" });
    res.json({ success: true });
  } catch (error) {
    console.error("Expense update error:", error);
    res.status(500).json({ error: "Erro ao atualizar despesa" });
  }
});

router.delete("/:id", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const { rowCount } = await run("DELETE FROM expenses WHERE id=$1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Despesa não encontrada" });
    res.json({ success: true });
  } catch (error) {
    console.error("Expense deletion error:", error);
    res.status(500).json({ error: "Erro ao deletar despesa" });
  }
});

export default router;
