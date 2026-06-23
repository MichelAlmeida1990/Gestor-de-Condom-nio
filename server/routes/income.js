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
    var data = (0, database_js_1.query)(getDB(), "SELECT * FROM income ORDER BY date DESC");
    res.json(data);
});
router.post("/", middleware_js_1.authenticate, middleware_js_1.isAdmin, function (req, res) {
    try {
        var validation = validation_js_1.incomeSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.issues[0].message });
        }
        var _a = validation.data, description = _a.description, amount = _a.amount, date = _a.date;
        (0, database_js_1.query)(getDB(), "INSERT INTO income (description, amount, date) VALUES (?, ?, ?)", [description, amount, date]);
        var id = (0, database_js_1.query)(getDB(), "SELECT last_insert_rowid() as id")[0].id;
        (0, database_js_1.saveDB)(getDB());
        res.json({ id: id });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao criar receita" });
    }
});
router.delete("/:id", middleware_js_1.authenticate, middleware_js_1.isAdmin, function (req, res) {
    try {
        var id = parseInt(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ error: "ID inválido" });
        var rowCount = (0, database_js_1.run)(getDB(), "DELETE FROM income WHERE id=?", [id]).rowCount;
        if (rowCount === 0)
            return res.status(404).json({ error: "Receita não encontrada" });
        (0, database_js_1.saveDB)(getDB());
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao deletar receita" });
    }
});
exports.default = router;
