import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { User, Expense } from "../types";
import { formatCurrency, formatDate } from "../lib/utils";
import { Plus, Search, Filter, Trash2, Edit2, X, Paperclip, ExternalLink } from "lucide-react";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";
import { expenseSchema } from "../lib/validation";

export function ExpenseManager({ user }: { user: User }) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [confirm, setConfirm] = useState<{ id: number } | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Manutenção",
    date: new Date().toISOString().split('T')[0],
    attachment_url: ""
  });

  const categories = ["Manutenção", "Limpeza", "Energia/Água", "Salários", "Segurança", "Diversos"];

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await api.get("/expenses");
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar despesas ao montar
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Fechar modais com Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowModal(false); setSelectedExpense(null); setConfirm(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount as string),
        category: formData.category,
        date: formData.date,
        attachment_url: formData.attachment_url || undefined
      };
      const validation = expenseSchema.safeParse(payload);
      if (!validation.success) {
        toast(validation.error.issues[0].message, "error");
        return;
      }
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, validation.data);
        toast("Despesa atualizada com sucesso!", "success");
      } else {
        await api.post("/expenses", validation.data);
        toast("Despesa lançada com sucesso!", "success");
      }
      setShowModal(false);
      setEditingExpense(null);
      setFormData({ description: "", amount: "", category: "Manutenção", date: new Date().toISOString().split('T')[0], attachment_url: "" });
      fetchExpenses();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao salvar despesa.", "error");
    }
  };

  const handleDelete = (id: number) => {
    setConfirm({ id });
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    try {
      await api.delete(`/expenses/${confirm.id}`);
      setExpenses(expenses.filter(e => e.id !== confirm.id));
      toast("Despesa excluída.", "info");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao excluir.", "error");
    } finally {
      setConfirm(null);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      attachment_url: expense.attachment_url || ""
    });
    setShowModal(true);
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestão Financeira</h1>
          <p className="text-slate-400 mt-1">Administração e controle de despesas do condomínio.</p>
        </div>
        {user.role === "admin" && (
          <button
            onClick={() => { setEditingExpense(null); setFormData({ description: "", amount: "", category: "Manutenção", date: new Date().toISOString().split('T')[0], attachment_url: "" }); setShowModal(true); }}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} />
            <span>Lançar Nova Despesa</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
        <div className="relative flex-1 group">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por descrição ou categoria..."
            className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-all placeholder-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center space-x-2 px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold text-slate-300 hover:bg-white/10 transition-all">
          <Filter size={18} />
          <span>Filtrar</span>
        </button>
      </div>

      {/* Expenses List */}
      <div className="bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 border-b border-white/5 text-[10px] font-bold uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Descrição do Gasto</th>
                <th className="px-8 py-6">Categoria</th>
                <th className="px-8 py-6">Vencimento/Data</th>
                <th className="px-8 py-6">Valor Nominal</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-medium">Carregando dados da nuvem...</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-500 italic">Nenhum registro encontrado para esta busca.</td></tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-white/5 transition-all group cursor-pointer" onClick={() => setSelectedExpense(expense)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{expense.description}</div>
                        {expense.attachment_url && <Paperclip size={14} className="text-indigo-400 opacity-60" />}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-indigo-500/10 rounded-lg text-[10px] font-black text-indigo-300 uppercase tracking-wider border border-indigo-500/10">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-400 font-medium">{formatDate(expense.date)}</td>
                    <td className="px-8 py-5 text-sm font-black text-rose-400 font-mono tracking-tighter">{formatCurrency(expense.amount)}</td>
                    <td className="px-8 py-5 text-right space-x-2" onClick={e => e.stopPropagation()}>
                      {user.role === "admin" && (
                        <>
                          <button onClick={() => handleEdit(expense)} className="p-2.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(expense.id)} className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Styled for Glass theme */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-xl rounded-[32px] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <h2 className="text-2xl font-black text-white tracking-tighter">{editingExpense ? "Editar Registro" : "Novo Lançamento"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Descrição do Item</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Manutenção Elétrica Bloco C"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all font-mono"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Categoria</label>
                    <select
                      className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(c => <option key={c} value={c} className="bg-[#1e293b] text-white">{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Data da Transação</label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Link do Documento / PDF</label>
                  <div className="relative">
                    <Paperclip className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      className="w-full pl-12 pr-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all placeholder-slate-600"
                      value={formData.attachment_url}
                      onChange={e => setFormData({ ...formData, attachment_url: e.target.value })}
                      placeholder="https://gdrive.com/seu-comprovante"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 text-sm font-bold text-slate-400 border border-white/10 rounded-2xl hover:bg-white/5 transition-all"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 text-sm font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                >
                  CONFIRMAR LANÇAMENTO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Detalhes */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[32px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Detalhe da Despesa</h2>
              <button onClick={() => setSelectedExpense(null)} className="text-slate-500 hover:text-white p-2 bg-white/5 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Descrição</p>
                <p className="text-white font-semibold">{selectedExpense.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Valor</p>
                  <p className="text-rose-400 font-black font-mono text-lg">{formatCurrency(selectedExpense.amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Categoria</p>
                  <span className="px-3 py-1 bg-indigo-500/10 rounded-lg text-xs font-black text-indigo-300 uppercase border border-indigo-500/10">{selectedExpense.category}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Data</p>
                  <p className="text-white text-sm">{formatDate(selectedExpense.date)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lançado em</p>
                  <p className="text-slate-400 text-sm">{formatDate(selectedExpense.created_at)}</p>
                </div>
              </div>
              {selectedExpense.attachment_url && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Comprovante</p>
                  <a href={selectedExpense.attachment_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors">
                    <Paperclip size={14} /> Ver documento <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              {user.role === "admin" && (
                <button onClick={() => { setSelectedExpense(null); handleEdit(selectedExpense); }} className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all">
                  Editar
                </button>
              )}
              <button onClick={() => setSelectedExpense(null)} className="flex-1 py-3 text-sm font-bold text-slate-400 border border-white/10 rounded-xl hover:bg-white/5 transition-all">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir esta despesa?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
