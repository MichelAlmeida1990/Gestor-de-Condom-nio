import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { User, TransparencySummary, Expense, Income } from "../types";
import { formatCurrency, formatDate } from "../lib/utils";
import { Download, FileText, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function TransparencyReport({ user }: { user: User }) {
  const [summary, setSummary] = useState<TransparencySummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sum, exp, inc] = await Promise.all([
          api.get("/transparency/summary"),
          api.get("/expenses"),
          api.get("/income")
        ]);
        setSummary(sum);
        setExpenses(exp);
        setIncome(inc);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Sincronizando portal de transparência...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Relatórios e Transparência</h1>
          <p className="text-slate-400 mt-1">Acompanhamento em tempo real da saúde financeira do condomínio.</p>
        </div>
        <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold border border-white/10 backdrop-blur-md transition-all shadow-xl">
          <Download size={20} />
          <span>Exportar Balancete</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Total Arrecadado</p>
          <p className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">{formatCurrency(summary?.totalIncome || 0)}</p>
          <div className="mt-4 flex items-center space-x-2 text-emerald-400/60 font-bold text-[10px] uppercase">
            <ArrowUpRight size={14} />
            <span>Fluxo de Entrada</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12 transition-all group-hover:bg-emerald-500/10" />
        </div>

        <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Total Despesas</p>
          <p className="text-4xl font-black text-rose-400 font-mono tracking-tighter">{formatCurrency(summary?.totalExpenses || 0)}</p>
          <div className="mt-4 flex items-center space-x-2 text-rose-400/60 font-bold text-[10px] uppercase">
            <ArrowDownRight size={14} />
            <span>Fluxo de Saída</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-12 -mt-12 transition-all group-hover:bg-rose-500/10" />
        </div>

        <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Saldo Consolidado</p>
          <p className={`text-4xl font-black font-mono tracking-tighter ${(summary?.balance || 0) >= 0 ? 'text-indigo-400' : 'text-rose-600'}`}>
            {formatCurrency(summary?.balance || 0)}
          </p>
          <div className="mt-4 flex items-center space-x-2 text-indigo-400/60 font-bold text-[10px] uppercase">
            <PieChart size={14} />
            <span>Patrimônio Atual</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 transition-all group-hover:bg-indigo-500/10" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* All Income */}
        <div className="bg-white/5 rounded-[40px] border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="font-black text-white text-lg tracking-tight uppercase">Entradas Detalhadas</h3>
            <ArrowUpRight size={18} className="text-emerald-500" />
          </div>
          <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto px-2">
            {income.map(item => (
              <div key={item.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all rounded-3xl group m-2 border border-transparent hover:border-white/5">
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors uppercase tracking-tight">{item.description}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{formatDate(item.date)}</p>
                </div>
                <p className="text-sm font-black text-emerald-400 font-mono">+{formatCurrency(item.amount)}</p>
              </div>
            ))}
            {income.length === 0 && <p className="p-20 text-center text-slate-500 font-medium italic">Sem registros de entrada.</p>}
          </div>
        </div>

        {/* All Expenses */}
        <div className="bg-white/5 rounded-[40px] border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="font-black text-white text-lg tracking-tight uppercase">Saídas Detalhadas</h3>
            <ArrowDownRight size={18} className="text-rose-500" />
          </div>
          <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto px-2">
            {expenses.map(item => (
              <div key={item.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all rounded-3xl group m-2 border border-transparent hover:border-white/5">
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors uppercase tracking-tight">{item.description}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{item.category} • {formatDate(item.date)}</p>
                </div>
                <p className="text-sm font-black text-rose-400 font-mono">-{formatCurrency(item.amount)}</p>
              </div>
            ))}
            {expenses.length === 0 && <p className="p-20 text-center text-slate-500 font-medium italic">Sem registros de saída.</p>}
          </div>
        </div>
      </div>
      
      <div className="bg-indigo-600/10 p-8 rounded-[32px] border border-indigo-500/20 backdrop-blur-md flex items-start space-x-6">
        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl shrink-0">
          <FileText size={24} />
        </div>
        <div>
          <h4 className="font-black text-indigo-300 tracking-tight text-xl uppercase">Compromisso com a Transparência</h4>
          <p className="text-slate-400 mt-2 leading-relaxed font-medium">
            Toda a documentação fiscal e relatórios de auditoria estão disponíveis digitalmente para consulta dos moradores. 
            A administração preza pela clareza em todos os gastos e decisões financeiras do condomínio.
          </p>
        </div>
      </div>
    </div>
  );
}
