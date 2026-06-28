import { Router } from "express";
import { query, run } from "../database.js";
import { type AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { z } from "zod";

const router = Router();

const maintenanceSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigned_to: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  cost: z.number().optional(),
});

router.get("/", authenticate, async (req: AuthRequest, res) => {
  if (req.user?.role === "admin") {
    const data = await query(
      "SELECT m.*, u.name as user_name, u.unit FROM maintenance_requests m JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC"
    );
    return res.json(data);
  }

  const data = await query("SELECT * FROM maintenance_requests WHERE user_id = $1 ORDER BY created_at DESC", [req.user?.id]);
  res.json(data);
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const validation = maintenanceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { title, description, category, priority, assigned_to } = validation.data;
    const rows = await query<{ id: number; created_at: string }>(
      "INSERT INTO maintenance_requests (user_id, title, description, category, priority, requested_by, assigned_to, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at",
      [req.user?.id, title, description, category, priority, req.user?.name, assigned_to || null, "pending"]
    );
    res.json({ id: rows[0]?.id, created_at: rows[0]?.created_at });
  } catch (error) {
    console.error("Maintenance creation error:", error);
    res.status(500).json({ error: "Erro ao criar solicitação de manutenção" });
  }
});

router.put("/:id", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, description, category, priority, assigned_to, status, cost } = req.body;
    
    const { rowCount } = await run(
      "UPDATE maintenance_requests SET title=$1, description=$2, category=$3, priority=$4, assigned_to=$5, status=$6, cost=$7, updated_at=CURRENT_TIMESTAMP, completed_at=CASE WHEN $6='completed' THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE id=$8",
      [title, description, category, priority, assigned_to || null, status, cost || null, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Solicitação não encontrada" });
    res.json({ success: true });
  } catch (error) {
    console.error("Maintenance update error:", error);
    res.status(500).json({ error: "Erro ao atualizar solicitação de manutenção" });
  }
});

router.delete("/:id", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await run("DELETE FROM maintenance_requests WHERE id=$1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Solicitação não encontrada" });
    res.json({ success: true });
  } catch (error) {
    console.error("Maintenance delete error:", error);
    res.status(500).json({ error: "Erro ao excluir solicitação de manutenção" });
  }
});

export default router;
