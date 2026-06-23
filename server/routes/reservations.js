"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var database_js_1 = require("../database.js");
var middleware_js_1 = require("../middleware.js");
var validation_js_1 = require("../validation.js");
var router = (0, express_1.Router)();
function getDB() {
    return global.__db;
}
// Auxiliar para checar conflitos
function checkConflict(area, date, slot, excludeId) {
    var db = getDB();
    var sql = "SELECT * FROM reservations WHERE area_name = ? AND date = ? AND status = 'approved'";
    var params = [area, date];
    if (excludeId) {
        sql += " AND id != ?";
        params.push(excludeId);
    }
    var approved = (0, database_js_1.query)(db, sql, params);
    return approved.some(function (r) {
        if (r.time_slot === "Dia Inteiro (08:00 - 22:00)" || slot === "Dia Inteiro (08:00 - 22:00)") {
            return true;
        }
        return r.time_slot === slot;
    });
}
// Listar reservas
router.get("/", middleware_js_1.authenticate, function (req, res) {
    var _a, _b;
    var db = getDB();
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin") {
        // Admin vê todas as reservas
        var data = (0, database_js_1.query)(db, "\n      SELECT r.*, u.name as user_name, u.unit \n      FROM reservations r \n      JOIN users u ON r.user_id = u.id \n      ORDER BY r.date DESC, r.time_slot ASC\n    ");
        res.json(data);
    }
    else {
        // Morador vê todas as aprovadas (para consultar agenda) + suas próprias (pendentes/rejeitadas/aprovadas)
        var data = (0, database_js_1.query)(db, "\n      SELECT r.*, u.name as user_name, u.unit \n      FROM reservations r \n      JOIN users u ON r.user_id = u.id \n      WHERE r.status = 'approved' OR r.user_id = ?\n      ORDER BY r.date DESC, r.time_slot ASC\n    ", [(_b = req.user) === null || _b === void 0 ? void 0 : _b.id]);
        res.json(data);
    }
});
// Solicitar reserva
router.post("/", middleware_js_1.authenticate, function (req, res) {
    var _a, _b;
    try {
        var validation = validation_js_1.reservationSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues[0].message });
        }
        var _c = validation.data, area_name = _c.area_name, date = _c.date, time_slot = _c.time_slot;
        // Bloquear reservas retroativas
        var today = new Date().toISOString().split("T")[0];
        if (date < today) {
            return res.status(400).json({ error: "Não é possível reservar datas no passado." });
        }
        // Verificar se já existe um conflito com reserva aprovada
        if (checkConflict(area_name, date, time_slot)) {
            return res.status(409).json({ error: "Este horário já está reservado e aprovado para outro morador." });
        }
        // Admin cria como aprovada por padrão, morador como pendente
        var status_1 = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin" ? "approved" : "pending";
        (0, database_js_1.query)(getDB(), "\n      INSERT INTO reservations (user_id, area_name, date, time_slot, status) \n      VALUES (?, ?, ?, ?, ?)\n    ", [(_b = req.user) === null || _b === void 0 ? void 0 : _b.id, area_name, date, time_slot, status_1]);
        var id = (0, database_js_1.query)(getDB(), "SELECT last_insert_rowid() as id")[0].id;
        (0, database_js_1.saveDB)(getDB());
        res.json({ id: id, status: status_1 });
    }
    catch (error) {
        console.error("Erro ao criar reserva:", error);
        res.status(500).json({ error: "Erro interno ao criar reserva." });
    }
});
// Atualizar status (apenas admin)
router.put("/:id/status", middleware_js_1.authenticate, middleware_js_1.isAdmin, function (req, res) {
    try {
        var id = parseInt(req.params.id);
        var status_2 = req.body.status;
        if (!status_2 || !["approved", "rejected", "pending"].includes(status_2)) {
            return res.status(400).json({ error: "Status inválido." });
        }
        var db = getDB();
        var rows = (0, database_js_1.query)(db, "SELECT * FROM reservations WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Reserva não encontrada." });
        }
        var reservation = rows[0];
        // Se estiver aprovando, verificar conflito novamente
        if (status_2 === "approved") {
            if (checkConflict(reservation.area_name, reservation.date, reservation.time_slot, id)) {
                return res.status(409).json({ error: "Não é possível aprovar. Este horário já está reservado por outra reserva aprovada." });
            }
        }
        var rowCount = (0, database_js_1.run)(db, "UPDATE reservations SET status = ? WHERE id = ?", [status_2, id]).rowCount;
        if (rowCount === 0) {
            return res.status(404).json({ error: "Falha ao atualizar status." });
        }
        (0, database_js_1.saveDB)(db);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Erro ao atualizar reserva:", error);
        res.status(500).json({ error: "Erro interno ao atualizar reserva." });
    }
});
// Cancelar / Excluir reserva
router.delete("/:id", middleware_js_1.authenticate, function (req, res) {
    var _a, _b;
    try {
        var id = parseInt(req.params.id);
        var db = getDB();
        var rows = (0, database_js_1.query)(db, "SELECT * FROM reservations WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Reserva não encontrada." });
        }
        var reservation = rows[0];
        // Moradores só podem cancelar suas próprias reservas
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin" && reservation.user_id !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            return res.status(403).json({ error: "Acesso negado." });
        }
        var rowCount = (0, database_js_1.run)(db, "DELETE FROM reservations WHERE id = ?", [id]).rowCount;
        if (rowCount === 0) {
            return res.status(404).json({ error: "Falha ao excluir." });
        }
        (0, database_js_1.saveDB)(db);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Erro ao excluir reserva:", error);
        res.status(500).json({ error: "Erro interno ao excluir reserva." });
    }
});
exports.default = router;
