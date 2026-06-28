import { Router } from "express";
import { query, run } from "../database.js";
import { type AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { notificationSchema } from "../validation.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const data = await query("SELECT * FROM notifications ORDER BY date DESC");
  res.json(data);
});

router.post("/", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const validation = notificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { title, message, date, expires_at } = validation.data;
    const rows = await query<{ id: number }>(
      "INSERT INTO notifications (title, message, date, expires_at) VALUES ($1, $2, $3, $4) RETURNING id",
      [title, message, date, expires_at || null]
    );
    res.json({ id: rows[0]?.id });
  } catch (error) {
    console.error("Notification creation error:", error);
    res.status(500).json({ error: "Erro ao criar notificação" });
  }
});

router.delete("/:id", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    const { rowCount } = await run("DELETE FROM notifications WHERE id=$1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Notificação não encontrada" });
    res.json({ success: true });
  } catch (error) {
    console.error("Notification deletion error:", error);
    res.status(500).json({ error: "Erro ao deletar notificação" });
  }
});

export default router;
