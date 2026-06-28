import { Router } from "express";
import { query, run } from "../database.js";
import { AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { occurrenceSchema } from "../validation.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === "admin") {
      const data = await query(
        "SELECT o.*, u.name as user_name, u.unit FROM occurrences o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC"
      );
      return res.json(data);
    }

    const data = await query("SELECT * FROM occurrences WHERE user_id = $1 ORDER BY created_at DESC", [req.user?.id]);
    res.json(data);
  } catch (error) {
    console.error("Occurrence fetch error:", error);
    res.status(500).json({ error: "Erro ao buscar ocorrências" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const validation = occurrenceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { type, description, occurrence_date, occurrence_time, evidence_url } = validation.data;
    const rows = await query<{ id: number }>(
      "INSERT INTO occurrences (user_id, type, description, occurrence_date, occurrence_time, evidence_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [req.user?.id, type, description, occurrence_date || null, occurrence_time || null, evidence_url || null]
    );
    res.json({ id: rows[0]?.id });
  } catch (error) {
    console.error("Occurrence creation error:", error);
    res.status(500).json({ error: "Erro ao criar ocorrência" });
  }
});

router.put("/:id", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, admin_response } = req.body;
    if (!status) return res.status(400).json({ error: "Status é obrigatório" });
    const { rowCount } = await run(
      "UPDATE occurrences SET status=$1, admin_response=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3",
      [status, admin_response || null, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Ocorrência não encontrada" });
    res.json({ success: true });
  } catch (error) {
    console.error("Occurrence update error:", error);
    res.status(500).json({ error: "Erro ao atualizar ocorrência" });
  }
});

export default router;
