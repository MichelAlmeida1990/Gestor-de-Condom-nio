import { Router } from "express";
import { query, run, saveDB } from "../database.js";
import { AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { notificationSchema } from "../validation.js";

const router = Router();

function getDB() {
  return (global as any).__db;
}

router.get("/", authenticate, (req: AuthRequest, res) => {
  const data = query(getDB(), "SELECT * FROM notifications ORDER BY date DESC");
  res.json(data);
});

router.post("/", authenticate, isAdmin, (req: AuthRequest, res) => {
  try {
    const validation = notificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { title, message, date, expires_at } = validation.data;
    query(getDB(), "INSERT INTO notifications (title, message, date, expires_at) VALUES (?, ?, ?, ?)",
      [title, message, date, expires_at || null]);
    const id = query(getDB(), "SELECT last_insert_rowid() as id")[0].id;
    saveDB(getDB());
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar notificação" });
  }
});

router.delete("/:id", authenticate, isAdmin, (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const { rowCount } = run(getDB(), "DELETE FROM notifications WHERE id=?", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Notificação não encontrada" });
    saveDB(getDB());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar notificação" });
  }
});

export default router;
