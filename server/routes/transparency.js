"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var database_js_1 = require("../database.js");
var middleware_js_1 = require("../middleware.js");
var router = (0, express_1.Router)();
function getDB() {
    return global.__db;
}
router.get("/summary", middleware_js_1.authenticate, function (req, res) {
    var expTotal = (0, database_js_1.query)(getDB(), "SELECT COALESCE(SUM(amount), 0) as total FROM expenses")[0].total;
    var incTotal = (0, database_js_1.query)(getDB(), "SELECT COALESCE(SUM(amount), 0) as total FROM income")[0].total;
    var byCategory = (0, database_js_1.query)(getDB(), "SELECT category, SUM(amount) as total FROM expenses GROUP BY category");
    res.json({
        totalExpenses: expTotal,
        totalIncome: incTotal,
        balance: incTotal - expTotal,
        expensesByCategory: byCategory.map(function (r) { return ({ category: r.category, total: r.total }); }),
    });
});
exports.default = router;
