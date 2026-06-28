import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { User, Income } from "../types";
import { formatCurrency, formatDate } from "../lib/utils";
import { Plus, Search, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";
import { incomeSchema } from "../lib/validation";

export function IncomeManager({ user }: { user: User }) {
  const { toast } = useToast();
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [confirm, setConfirm] = useState<{ id: number } | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchIncome();
  }, []);

  // Fechar modais com Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowModal(false); setSelectedIncome(null); setConfirm(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const fetchIncome = async () => {
    try {
      const data = await api.get("/income");
      setIncome(data);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao carregar receitas", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const validation = incomeSchema.safeParse({
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date
      });
      if (!validation.success) {
        toast(validation.error.issues[0].message, "error");
        return;
      }
      await api.post("/income", validation.data);
      setShowModal(false);
      setFormData({ description: "", amount: "", date: new Date().toISOString().split('T')[0] });
      fetchIncome();
      toast("Receita lançada com sucesso!", "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao lançar receita.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    try {
      await api.delete(`/income/${confirm.id}`);
      setIncome(income.filter(i => i.id !== confirm.id));
      toast("Receita excluída.", "info");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao excluir.", "error");
    } finally {
      setConfirm(null);
    }
  };

  const filteredIncome = income.filter(i =>
    i.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestão de Receitas</h1>
          <p className="text-slate-400 mt-1">Registre entradas, cotas condominiais e outras receitas.</p>
        </div>
        {user.role === "admin" && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20">
            <Plus size={20} /><span>Lançar Receita</span>
          </button>
        )}
      </div>

      <div className="relative group">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-emerald-400 transition-colors">
          <Search size={18} />
        </span>
        <input type="text" placeholder="Buscar receitas por descrição..." className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white transition-all placeholder-slate-600"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 border-b border-white/5 text-[10px] font-bold uppercase tracking-[0.2em]">
              <th className="px-8 py-6">Identificação da Receita</th>
              <th className="px-8 py-6">Data de Recebimento</th>
              <th className="px-8 py-6">Valor Creditado</th>
              {user.role === "admin" && <th className="px-8 py-6 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-500">Sincronizando registros...</td></tr>
            ) : filteredIncome.length === 0 ? (
              <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-500 italic">Nenhuma receita registrada.</td></tr>
            ) : (
              filteredIncome.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 group transition-all cursor-pointer" onClick={() => setSelectedIncome(item)}>
                  <td className="px-8 py-5 text-sm font-bold text-white group-hover:text-emerald-300 transition-colors uppercase tracking-tight">{item.description}</td>
                  <td className="px-8 py-5 text-sm text-slate-400 font-medium">{formatDate(item.date)}</td>
                  <td className="px-8 py-5 text-sm font-black text-emerald-400 font-mono tracking-tighter">{formatCurrency(item.amount)}</td>
                  {user.role === "admin" && (
                    <td className="px-8 py-5 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setConfirm({ id: item.id })} className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detalhes */}
      {selectedIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[32px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Detalhe da Receita</h2>
              <button onClick={() => setSelectedIncome(null)} className="text-slate-500 hover:text-white p-2 bg-white/5 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Descrição</p>
                <p className="text-white font-semibold">{selectedIncome.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Valor</p>
                  <p className="text-emerald-400 font-black font-mono text-lg">+{formatCurrency(selectedIncome.amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Data</p>
                  <p className="text-white text-sm">{formatDate(selectedIncome.date)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Registrado em</p>
                  <p className="text-slate-400 text-sm">{formatDate(selectedIncome.created_at)}</p>
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button onClick={() => setSelectedIncome(null)} className="w-full py-3 text-sm font-bold text-slate-400 border border-white/10 rounded-xl hover:bg-white/5 transition-all">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Lançamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-[32px] shadow-2xl border border-white/10 p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white tracking-tighter">Lançar Receita</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white p-2 bg-white/5 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Descrição</label>
                <input type="text" required className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white transition-all"
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Cota Condominial Jan/2024" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Valor (R$)</label>
                  <input type="number" step="0.01" required className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono"
                    value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Data</label>
                  <input type="date" required className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white transition-all"
                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-bold text-slate-400 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20">CONFIRMAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog message="Tem certeza que deseja excluir esta receita?" onConfirm={confirmDelete} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}
