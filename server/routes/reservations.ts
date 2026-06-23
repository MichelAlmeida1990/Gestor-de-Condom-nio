import { Router } from "express";
import { query, run, saveDB } from "../database.js";
import { AuthRequest, authenticate, isAdmin } from "../middleware.js";
import { reservationSchema } from "../validation.js";

const router = Router();

function getDB() {
  return (global as any).__db;
}

// Auxiliar para checar conflitos
function checkConflict(area: string, date: string, slot: string, excludeId?: number) {
  const db = getDB();
  let sql = "SELECT * FROM reservations WHERE area_name = ? AND date = ? AND status = 'approved'";
  const params: unknown[] = [area, date];

  if (excludeId) {
    sql += " AND id != ?";
    params.push(excludeId);
  }

  const approved = query(db, sql, params);

  return approved.some((r) => {
    if (r.time_slot === "Dia Inteiro (08:00 - 22:00)" || slot === "Dia Inteiro (08:00 - 22:00)") {
      return true;
    }
    return r.time_slot === slot;
  });
}

// Listar reservas
router.get("/", authenticate, (req: AuthRequest, res) => {
  const db = getDB();
  if (req.user?.role === "admin") {
    // Admin vê todas as reservas
    const data = query(db, `
      SELECT r.*, u.name as user_name, u.unit 
      FROM reservations r 
      JOIN users u ON r.user_id = u.id 
      ORDER BY r.date DESC, r.time_slot ASC
    `);
    res.json(data);
  } else {
    // Morador vê todas as aprovadas (para consultar agenda) + suas próprias (pendentes/rejeitadas/aprovadas)
    const data = query(db, `
      SELECT r.*, u.name as user_name, u.unit 
      FROM reservations r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.status = 'approved' OR r.user_id = ?
      ORDER BY r.date DESC, r.time_slot ASC
    `, [req.user?.id]);
    res.json(data);
  }
});

// Solicitar reserva
router.post("/", authenticate, (req: AuthRequest, res) => {
  try {
    const validation = reservationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { area_name, date, time_slot } = validation.data;

    // Bloquear reservas retroativas
    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
      return res.status(400).json({ error: "Não é possível reservar datas no passado." });
    }

    // Verificar se já existe um conflito com reserva aprovada
    if (checkConflict(area_name, date, time_slot)) {
      return res.status(409).json({ error: "Este horário já está reservado e aprovado para outro morador." });
    }

    // Admin cria como aprovada por padrão, morador como pendente
    const status = req.user?.role === "admin" ? "approved" : "pending";

    query(getDB(), `
      INSERT INTO reservations (user_id, area_name, date, time_slot, status) 
      VALUES (?, ?, ?, ?, ?)
    `, [req.user?.id, area_name, date, time_slot, status]);

    const id = query(getDB(), "SELECT last_insert_rowid() as id")[0].id;
    saveDB(getDB());

    res.json({ id, status });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    res.status(500).json({ error: "Erro interno ao criar reserva." });
  }
});

// Atualizar status (apenas admin)
router.put("/:id/status", authenticate, isAdmin, (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    const db = getDB();
    const rows = query(db, "SELECT * FROM reservations WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Reserva não encontrada." });
    }

    const reservation = rows[0];

    // Se estiver aprovando, verificar conflito novamente
    if (status === "approved") {
      if (checkConflict(reservation.area_name as string, reservation.date as string, reservation.time_slot as string, id)) {
        return res.status(409).json({ error: "Não é possível aprovar. Este horário já está reservado por outra reserva aprovada." });
      }
    }

    const { rowCount } = run(db, "UPDATE reservations SET status = ? WHERE id = ?", [status, id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Falha ao atualizar status." });
    }

    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar reserva:", error);
    res.status(500).json({ error: "Erro interno ao atualizar reserva." });
  }
});

// Cancelar / Excluir reserva
router.delete("/:id", authenticate, (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = getDB();

    const rows = query(db, "SELECT * FROM reservations WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Reserva não encontrada." });
    }

    const reservation = rows[0];

    // Moradores só podem cancelar suas próprias reservas
    if (req.user?.role !== "admin" && reservation.user_id !== req.user?.id) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const { rowCount } = run(db, "DELETE FROM reservations WHERE id = ?", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Falha ao excluir." });
    }

    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir reserva:", error);
    res.status(500).json({ error: "Erro interno ao excluir reserva." });
  }
});

export default router;
