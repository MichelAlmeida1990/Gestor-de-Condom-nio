import { Router } from "express";
import { query, run } from "../database.js";
import { AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { incomeSchema } from "../validation.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const data = await query("SELECT * FROM income ORDER BY date DESC");
  res.json(data);
});

router.post("/", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const validation = incomeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { description, amount, date } = validation.data;
    const rows = await query<{ id: number }>(
      "INSERT INTO income (description, amount, date) VALUES ($1, $2, $3) RETURNING id",
      [description, amount, date]
    );
    res.json({ id: rows[0]?.id });
  } catch (error) {
    console.error("Income creation error:", error);
    res.status(500).json({ error: "Erro ao criar receita" });
  }
});

router.delete("/:id", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const { rowCount } = await run("DELETE FROM income WHERE id=$1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Receita não encontrada" });
    res.json({ success: true });
  } catch (error) {
    console.error("Income deletion error:", error);
    res.status(500).json({ error: "Erro ao deletar receita" });
  }
});

export default router;
