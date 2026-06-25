import { Router } from "express";
import { query } from "../database.js";
import { AuthRequest, authenticate } from "../middleware.js";

const router = Router();

router.get("/summary", authenticate, async (req: AuthRequest, res) => {
  const expTotalRow = await query<{ total: string | number }>("SELECT COALESCE(SUM(amount), 0) as total FROM expenses");
  const incTotalRow = await query<{ total: string | number }>("SELECT COALESCE(SUM(amount), 0) as total FROM income");
  const byCategory = await query<{ category: string; total: string | number }>(
    "SELECT category, SUM(amount) as total FROM expenses GROUP BY category"
  );
  const expTotal = Number(expTotalRow[0]?.total ?? 0);
  const incTotal = Number(incTotalRow[0]?.total ?? 0);

  res.json({
    totalExpenses: expTotal,
    totalIncome: incTotal,
    balance: incTotal - expTotal,
    expensesByCategory: byCategory.map((r) => ({ category: r.category, total: Number(r.total ?? 0) })),
  });
});

export default router;
