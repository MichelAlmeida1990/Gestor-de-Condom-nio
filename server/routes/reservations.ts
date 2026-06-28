import { Router } from "express";
import { query, run } from "../database.js";
import { type AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { reservationSchema } from "../validation.js";

const router = Router();

// Auxiliar para checar conflitos
async function checkConflict(area: string, date: string, slot: string, excludeId?: number) {
  const params: unknown[] = [area, date];
  let sql = "SELECT * FROM reservations WHERE area_name = $1 AND date = $2 AND status = 'approved'";

  if (excludeId) {
    sql += " AND id != $3";
    params.push(excludeId);
  }

  const approved = await query(sql, params);

  return approved.some((r: any) => {
    if (r.time_slot === "Dia Inteiro (08:00 - 22:00)" || slot === "Dia Inteiro (08:00 - 22:00)") {
      return true;
    }
    return r.time_slot === slot;
  });
}

// Listar reservas
router.get("/", authenticate, async (req: AuthRequest, res) => {
  if (req.user?.role === "admin") {
    const data = await query(
      `SELECT r.*, u.name as user_name, u.unit FROM reservations r JOIN users u ON r.user_id = u.id ORDER BY r.date DESC, r.time_slot ASC`
    );
    return res.json(data);
  }

  const data = await query(
    `SELECT r.*, u.name as user_name, u.unit FROM reservations r JOIN users u ON r.user_id = u.id WHERE r.status = 'approved' OR r.user_id = $1 ORDER BY r.date DESC, r.time_slot ASC`,
    [req.user?.id]
  );
  res.json(data);
});

// Solicitar reserva
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const validation = reservationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { area_name, date, time_slot } = validation.data;

    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
      return res.status(400).json({ error: "Não é possível reservar datas no passado." });
    }

    if (await checkConflict(area_name, date, time_slot)) {
      return res.status(409).json({ error: "Este horário já está reservado e aprovado para outro morador." });
    }

    const status = req.user?.role === "admin" ? "approved" : "pending";
    const rows = await query<{ id: number }>(
      "INSERT INTO reservations (user_id, area_name, date, time_slot, status) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [req.user?.id, area_name, date, time_slot, status]
    );

    res.json({ id: rows[0]?.id, status });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    res.status(500).json({ error: "Erro interno ao criar reserva." });
  }
});

// Atualizar status (apenas admin)
router.put("/:id/status", authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    const rows = await query("SELECT * FROM reservations WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Reserva não encontrada." });
    }

    const reservation = rows[0] as any;

    if (status === "approved") {
      if (await checkConflict(reservation.area_name as string, reservation.date as string, reservation.time_slot as string, id)) {
        return res.status(409).json({ error: "Não é possível aprovar. Este horário já está reservado por outra reserva aprovada." });
      }
    }

    const { rowCount } = await run("UPDATE reservations SET status = $1 WHERE id = $2", [status, id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Falha ao atualizar status." });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar reserva:", error);
    res.status(500).json({ error: "Erro interno ao atualizar reserva." });
  }
});

// Cancelar / Excluir reserva
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await query("SELECT * FROM reservations WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Reserva não encontrada." });
    }

    const reservation = rows[0] as any;

    if (req.user?.role !== "admin" && reservation.user_id !== req.user?.id) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const { rowCount } = await run("DELETE FROM reservations WHERE id = $1", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Falha ao excluir." });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir reserva:", error);
    res.status(500).json({ error: "Erro interno ao excluir reserva." });
  }
});

export default router;
