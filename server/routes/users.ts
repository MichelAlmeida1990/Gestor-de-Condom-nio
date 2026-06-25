import { Router } from "express";
import { query, run } from "../database.js";
import { AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { profileUpdateSchema, userStatusSchema } from "../validation.js";

const router = Router();

router.get("/admin/users", authenticate, isAdmin, async (req: AuthRequest, res) => {
  const data = await query(
    "SELECT id, email, name, role, status, unit, phone, cpf, birthdate, emergency_contact, emergency_phone, blood_type, health_notes, vehicles, created_at FROM users WHERE role = 'resident' ORDER BY created_at DESC"
  );
  res.json(data);
});

router.put("/admin/users/:id/status", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const validation = userStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { status } = validation.data;
    const { rowCount } = await run(
      "UPDATE users SET status = $1 WHERE id = $2 AND role = 'resident'",
      [status, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ success: true });
  } catch (error) {
    console.error("User status update error:", error);
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

router.get("/profile", authenticate, async (req: AuthRequest, res) => {
  const rows = await query(
    "SELECT id, email, name, role, unit, phone, cpf, birthdate, emergency_contact, emergency_phone, blood_type, health_notes, vehicles FROM users WHERE id=$1",
    [req.user?.id]
  );
  res.json(rows[0]);
});

router.put("/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const validation = profileUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { name, phone, unit, cpf, birthdate, emergency_contact, emergency_phone, blood_type, health_notes, vehicles } = validation.data;
    await run(
      `UPDATE users SET name=$1, phone=$2, unit=$3, cpf=$4, birthdate=$5, emergency_contact=$6, emergency_phone=$7, blood_type=$8, health_notes=$9, vehicles=$10 WHERE id=$11`,
      [name, phone || null, unit || null, cpf || null, birthdate || null, emergency_contact || null, emergency_phone || null, blood_type || null, health_notes || null, vehicles || null, req.user?.id]
    );
    const rows = await query(
      "SELECT id, email, name, role, unit, phone FROM users WHERE id=$1",
      [req.user?.id]
    );
    res.json({ user: rows[0] });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

export default router;
