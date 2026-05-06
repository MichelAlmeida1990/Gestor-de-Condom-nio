import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { User, TransparencySummary, Expense, Notification } from "../types";
import { formatCurrency, formatDate } from "../lib/utils";
import { 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Bell,
  ArrowRight,
  TrendingUp as TrendingUpIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#3b82f6", "#f43f5e", "#f59e0b"];

export function Dashboard({ user }: { user: User }) {
  const [summary, setSummary] = useState<TransparencySummary | null>(null);
  const [latestExpenses, setLatestExpenses] = useState<Expense[]>([]);
  const [latestNotifications, setLatestNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sum, exp, notif] = await Promise.all([
          api.get("/transparency/summary"),
          api.get("/expenses"),
          api.get("/notifications")
        ]);
        setSummary(sum);
        setLatestExpenses(exp.slice(0, 5));
        setLatestNotifications(notif.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl backdrop-blur-md" />)}
    </div>
  </div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Painel de Controle</h1>
          <p className="text-slate-400">Bem-vindo, {user.name} • Condomínio Vista Real</p>
        </div>
        <div className="flex space-x-4">
          <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl border border-white/10 backdrop-blur-sm transition-all text-sm font-medium">
            Exportar Relatório
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-xl shadow-indigo-500/5">
          <p className="text-slate-400 text-sm font-medium flex items-center space-x-2">
            <DollarSign size={14} className="text-indigo-400" />
            <span>Saldo Atual</span>
          </p>
          <p className="text-2xl font-bold mt-2 text-emerald-400">{formatCurrency(summary?.balance || 0)}</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-xl">
          <p className="text-slate-400 text-sm font-medium flex items-center space-x-2">
            <TrendingDown size={14} className="text-rose-400" />
            <span>Despesas do Mês</span>
          </p>
          <p className="text-2xl font-bold mt-2 text-white">{formatCurrency(summary?.totalExpenses || 0)}</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-xl">
          <p className="text-slate-400 text-sm font-medium flex items-center space-x-2">
            <TrendingUp size={14} className="text-indigo-400" />
            <span>Receitas do Mês</span>
          </p>
          <p className="text-2xl font-bold mt-2 text-white">{formatCurrency(summary?.totalIncome || 0)}</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-xl">
          <p className="text-slate-400 text-sm font-medium flex items-center space-x-2">
            <Bell size={14} className="text-amber-400" />
            <span>Alertas</span>
          </p>
          <p className="text-2xl font-bold mt-2 text-white">{latestNotifications.length} Ativos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl overflow-hidden relative">
          <h2 className="text-xl font-bold text-white mb-8">Fluxo Financeiro por Categoria</h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.expensesByCategory || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#94a3b8'}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#94a3b8'}} 
                  tickFormatter={(val) => `R$ ${val}`} 
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.03)'}}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(12px)',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={40}>
                  {(summary?.expensesByCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Abstract glow */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-10 pointer-events-none" />
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Lançamentos</h2>
            <ArrowRight size={20} className="text-slate-500" />
          </div>
          <div className="space-y-5 flex-1">
            {latestExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center font-bold text-sm border border-indigo-500/20">
                    {expense.description.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{expense.description}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{expense.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-rose-400">-{formatCurrency(expense.amount)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(expense.date)}</p>
                </div>
              </div>
            ))}
            {latestExpenses.length === 0 && <p className="text-center text-slate-500 py-10 italic text-sm">Sem movimentos.</p>}
          </div>
          <button className="mt-8 w-full py-4 text-sm font-semibold text-indigo-400 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
            Ver Fluxo Completo
          </button>
        </div>
      </div>
    </div>
  );
}
