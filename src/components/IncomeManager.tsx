import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { User, Income } from "../types";
import { formatCurrency, formatDate } from "../lib/utils";
import { Plus, Search, Trash2, Edit2, X, CheckCircle, AlertCircle } from "lucide-react";

export function IncomeManager({ user }: { user: User }) {
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    try {
      const data = await api.get("/income");
      setIncome(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/income", {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setShowModal(false);
      setFormData({
        description: "",
        amount: "",
        date: new Date().toISOString().split('T')[0]
      });
      fetchIncome();
      setStatus({ message: "Receita lançada com sucesso!", type: 'success' });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus({ message: "Erro ao lançar receita.", type: 'error' });
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
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} />
          <span>Lançar Receita</span>
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl flex items-center space-x-3 backdrop-blur-md border ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-bold">{status.message}</span>
        </div>
      )}

      <div className="relative group">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-emerald-400 transition-colors">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Buscar receitas por descrição..."
          className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white transition-all placeholder-slate-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 border-b border-white/5 text-[10px] font-bold uppercase tracking-[0.2em]">
              <th className="px-8 py-6">Identificação da Receita</th>
              <th className="px-8 py-6">Data de Recebimento</th>
              <th className="px-8 py-6">Valor Creditado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-500">Sincronizando registros...</td></tr>
            ) : filteredIncome.length === 0 ? (
              <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-500 italic">Nenhuma receita registrada.</td></tr>
            ) : (
              filteredIncome.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 group transition-all">
                  <td className="px-8 py-5 text-sm font-bold text-white group-hover:text-emerald-300 transition-colors uppercase tracking-tight">{item.description}</td>
                  <td className="px-8 py-5 text-sm text-slate-400 font-medium">{formatDate(item.date)}</td>
                  <td className="px-8 py-5 text-sm font-black text-emerald-400 font-mono tracking-tighter">{formatCurrency(item.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-[32px] shadow-2xl border border-white/10 p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-white tracking-tighter mb-8">Lançar Receita</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Descrição</label>
                <input
                  type="text"
                  required
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white transition-all"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Cota Condominial Jan/2024"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Valor Creditado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Data</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white transition-all"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
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
    </div>
  );
}
