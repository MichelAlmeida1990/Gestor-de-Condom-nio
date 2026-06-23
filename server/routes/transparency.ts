import { Router } from "express";
import { query } from "../database.js";
import { AuthRequest, authenticate } from "../middleware.js";

const router = Router();

function getDB() {
  return (global as any).__db;
}

router.get("/summary", authenticate, (req: AuthRequest, res) => {
  const expTotal = query(getDB(), "SELECT COALESCE(SUM(amount), 0) as total FROM expenses")[0].total as number;
  const incTotal = query(getDB(), "SELECT COALESCE(SUM(amount), 0) as total FROM income")[0].total as number;
  const byCategory = query(getDB(), "SELECT category, SUM(amount) as total FROM expenses GROUP BY category");
  res.json({
    totalExpenses: expTotal,
    totalIncome: incTotal,
    balance: incTotal - expTotal,
    expensesByCategory: byCategory.map((r) => ({ category: r.category, total: r.total as number })),
  });
});

export default router;
