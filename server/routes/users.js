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
router.get("/admin/users", middleware_js_1.authenticate, middleware_js_1.isAdmin, function (req, res) {
    var data = (0, database_js_1.query)(getDB(), "SELECT id, email, name, role, status, unit, phone, cpf, birthdate, emergency_contact, emergency_phone, blood_type, health_notes, vehicles, created_at FROM users WHERE role = 'resident' ORDER BY created_at DESC");
    res.json(data);
});
router.put("/admin/users/:id/status", middleware_js_1.authenticate, middleware_js_1.isAdmin, function (req, res) {
    try {
        var id = parseInt(req.params.id);
        var validation = validation_js_1.userStatusSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues[0].message });
        }
        var status_1 = validation.data.status;
        var rowCount = (0, database_js_1.run)(getDB(), "UPDATE users SET status = ? WHERE id = ? AND role = 'resident'", [status_1, id]).rowCount;
        if (rowCount === 0)
            return res.status(404).json({ error: "Usuário não encontrado" });
        (0, database_js_1.saveDB)(getDB());
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao atualizar status" });
    }
});
router.get("/profile", middleware_js_1.authenticate, function (req, res) {
    var _a;
    var rows = (0, database_js_1.query)(getDB(), "SELECT id, email, name, role, unit, phone, cpf, birthdate, emergency_contact, emergency_phone, blood_type, health_notes, vehicles FROM users WHERE id=?", [(_a = req.user) === null || _a === void 0 ? void 0 : _a.id]);
    res.json(rows[0]);
});
router.put("/profile", middleware_js_1.authenticate, function (req, res) {
    var _a, _b;
    try {
        var validation = validation_js_1.profileUpdateSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues[0].message });
        }
        var _c = validation.data, name_1 = _c.name, phone = _c.phone, unit = _c.unit, cpf = _c.cpf, birthdate = _c.birthdate, emergency_contact = _c.emergency_contact, emergency_phone = _c.emergency_phone, blood_type = _c.blood_type, health_notes = _c.health_notes, vehicles = _c.vehicles;
        (0, database_js_1.run)(getDB(), "UPDATE users SET name=?, phone=?, unit=?, cpf=?, birthdate=?, emergency_contact=?, emergency_phone=?, blood_type=?, health_notes=?, vehicles=? WHERE id=?", [name_1, phone || null, unit || null, cpf || null, birthdate || null, emergency_contact || null, emergency_phone || null, blood_type || null, health_notes || null, vehicles || null, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id]);
        (0, database_js_1.saveDB)(getDB());
        var rows = (0, database_js_1.query)(getDB(), "SELECT id, email, name, role, unit, phone FROM users WHERE id=?", [(_b = req.user) === null || _b === void 0 ? void 0 : _b.id]);
        res.json({ user: rows[0] });
    }
    catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
});
exports.default = router;
