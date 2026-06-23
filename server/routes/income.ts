import { Router } from "express";
import { query, run, saveDB } from "../database.js";
import { AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { incomeSchema } from "../validation.js";

const router = Router();

function getDB() {
  return (global as any).__db;
}

router.get("/", authenticate, (req: AuthRequest, res) => {
  const data = query(getDB(), "SELECT * FROM income ORDER BY date DESC");
  res.json(data);
});

router.post("/", authenticate, isAdmin, (req: AuthRequest, res) => {
  try {
    const validation = incomeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { description, amount, date } = validation.data;
    query(getDB(), "INSERT INTO income (description, amount, date) VALUES (?, ?, ?)", [description, amount, date]);
    const id = query(getDB(), "SELECT last_insert_rowid() as id")[0].id;
    saveDB(getDB());
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar receita" });
  }
});

router.delete("/:id", authenticate, isAdmin, (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const { rowCount } = run(getDB(), "DELETE FROM income WHERE id=?", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Receita não encontrada" });
    saveDB(getDB());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar receita" });
  }
});

export default router;
