import { Router } from "express";
import { query, run, saveDB } from "../database.js";
import { AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { profileUpdateSchema, userStatusSchema } from "../validation.js";

const router = Router();

function getDB() {
  return (global as any).__db;
}

router.get("/admin/users", authenticate, isAdmin, (req: AuthRequest, res) => {
  const data = query(getDB(), "SELECT id, email, name, role, status, unit, phone, cpf, birthdate, emergency_contact, emergency_phone, blood_type, health_notes, vehicles, created_at FROM users WHERE role = 'resident' ORDER BY created_at DESC");
  res.json(data);
});

router.put("/admin/users/:id/status", authenticate, isAdmin, (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const validation = userStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { status } = validation.data;
    const { rowCount } = run(getDB(), "UPDATE users SET status = ? WHERE id = ? AND role = 'resident'", [status, id]);
    if (rowCount === 0) return res.status(404).json({ error: "Usuário não encontrado" });
    saveDB(getDB());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

router.get("/profile", authenticate, (req: AuthRequest, res) => {
  const rows = query(getDB(), "SELECT id, email, name, role, unit, phone, cpf, birthdate, emergency_contact, emergency_phone, blood_type, health_notes, vehicles FROM users WHERE id=?", [req.user?.id]);
  res.json(rows[0]);
});

router.put("/profile", authenticate, (req: AuthRequest, res) => {
  try {
    const validation = profileUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { name, phone, unit, cpf, birthdate, emergency_contact, emergency_phone, blood_type, health_notes, vehicles } = validation.data;
    run(getDB(), `UPDATE users SET name=?, phone=?, unit=?, cpf=?, birthdate=?, emergency_contact=?, emergency_phone=?, blood_type=?, health_notes=?, vehicles=? WHERE id=?`,
      [name, phone || null, unit || null, cpf || null, birthdate || null, emergency_contact || null, emergency_phone || null, blood_type || null, health_notes || null, vehicles || null, req.user?.id]);
    saveDB(getDB());
    const rows = query(getDB(), "SELECT id, email, name, role, unit, phone FROM users WHERE id=?", [req.user?.id]);
    res.json({ user: rows[0] });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

export default router;
