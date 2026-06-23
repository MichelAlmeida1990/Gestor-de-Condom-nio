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
router.get("/", middleware_js_1.authenticate, function (req, res) {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin") {
        var data = (0, database_js_1.query)(getDB(), "SELECT o.*, u.name as user_name, u.unit FROM occurrences o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC");
        res.json(data);
    }
    else {
        var data = (0, database_js_1.query)(getDB(), "SELECT * FROM occurrences WHERE user_id = ? ORDER BY created_at DESC", [(_b = req.user) === null || _b === void 0 ? void 0 : _b.id]);
        res.json(data);
    }
});
router.post("/", middleware_js_1.authenticate, function (req, res) {
    var _a;
    try {
        var validation = validation_js_1.occurrenceSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues[0].message });
        }
        var _b = validation.data, type = _b.type, description = _b.description;
        (0, database_js_1.query)(getDB(), "INSERT INTO occurrences (user_id, type, description) VALUES (?, ?, ?)", [(_a = req.user) === null || _a === void 0 ? void 0 : _a.id, type, description]);
        var id = (0, database_js_1.query)(getDB(), "SELECT last_insert_rowid() as id")[0].id;
        (0, database_js_1.saveDB)(getDB());
        res.json({ id: id });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao criar ocorrência" });
    }
});
router.put("/:id", middleware_js_1.authenticate, middleware_js_1.isAdmin, function (req, res) {
    try {
        var id = parseInt(req.params.id);
        var _a = req.body, status_1 = _a.status, admin_response = _a.admin_response;
        if (!status_1)
            return res.status(400).json({ error: "Status é obrigatório" });
        var rowCount = (0, database_js_1.run)(getDB(), "UPDATE occurrences SET status=?, admin_response=?, updated_at=datetime('now') WHERE id=?", [status_1, admin_response || null, id]).rowCount;
        if (rowCount === 0)
            return res.status(404).json({ error: "Ocorrência não encontrada" });
        (0, database_js_1.saveDB)(getDB());
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao atualizar ocorrência" });
    }
});
exports.default = router;
