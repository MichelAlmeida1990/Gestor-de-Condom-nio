import { Router } from "express";
import { query, run, saveDB } from "../database.js";
import { AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { occurrenceSchema } from "../validation.js";

const router = Router();

function getDB() {
  return (global as any).__db;
}

router.get("/", authenticate, (req: AuthRequest, res) => {
  if (req.user?.role === "admin") {
    const data = query(getDB(), "SELECT o.*, u.name as user_name, u.unit FROM occurrences o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC");
    res.json(data);
  } else {
    const data = query(getDB(), "SELECT * FROM occurrences WHERE user_id = ? ORDER BY created_at DESC", [req.user?.id]);
    res.json(data);
  }
});

router.post("/", authenticate, (req: AuthRequest, res) => {
  try {
    const validation = occurrenceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { type, description, occurrence_date, occurrence_time, evidence_url } = validation.data;
    query(getDB(), "INSERT INTO occurrences (user_id, type, description, occurrence_date, occurrence_time, evidence_url) VALUES (?, ?, ?, ?, ?, ?)", 
      [req.user?.id, type, description, occurrence_date || null, occurrence_time || null, evidence_url || null]);
    const id = query(getDB(), "SELECT last_insert_rowid() as id")[0].id;
    saveDB(getDB());
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar ocorrência" });
  }
});

router.put("/:id", authenticate, isAdmin, (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, admin_response } = req.body;
    if (!status) return res.status(400).json({ error: "Status é obrigatório" });
    const { rowCount } = run(getDB(), "UPDATE occurrences SET status=?, admin_response=?, updated_at=datetime('now') WHERE id=?",
      [status, admin_response || null, id]);
    if (rowCount === 0) return res.status(404).json({ error: "Ocorrência não encontrada" });
    saveDB(getDB());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar ocorrência" });
  }
});

export default router;
