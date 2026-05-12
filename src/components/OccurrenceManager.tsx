import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { User, Occurrence } from "../types";
import { cn, formatDate } from "../lib/utils";
import { AlertTriangle, Plus, X, Clock, CheckCircle, Loader } from "lucide-react";

const TYPES = ["Barulho", "Vazamento", "Área comum", "Segurança", "Limpeza", "Elevador", "Outro"];

const statusConfig = {
  open: { label: "Aberta", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
  in_progress: { label: "Em andamento", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Loader },
  resolved: { label: "Resolvida", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
};

export function OccurrenceManager({ user }: { user: User }) {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: TYPES[0], description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchOccurrences = async () => {
    try {
      const data = await api.get("/occurrences");
      setOccurrences(data);
    } catch {
      setError("Erro ao carregar ocorrências");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOccurrences(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/occurrences", form);
      setForm({ type: TYPES[0], description: "" });
      setShowForm(false);
      fetchOccurrences();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ocorrências</h1>
          <p className="text-slate-400 text-sm mt-1">{isAdmin ? "Gerencie as ocorrências dos moradores" : "Registre e acompanhe suas ocorrências"}</p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            <Plus size={16} />
            <span>Nova Ocorrência</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Nova Ocorrência</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TYPES.map((t) => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descreva a ocorrência com detalhes..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <div className="flex space-x-3">
              <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                {submitting ? "Enviando..." : "Registrar"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
        </div>
      ) : occurrences.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-500 space-y-2">
          <AlertTriangle size={32} />
          <p>Nenhuma ocorrência registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {occurrences.map((occ) => {
            const cfg = statusConfig[occ.status];
            const Icon = cfg.icon;
            return (
              <div key={occ.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{occ.type}</span>
                      {isAdmin && occ.user_name && (
                        <span className="text-xs text-slate-500">• {occ.user_name}{occ.unit ? ` — Apto ${occ.unit}` : ""}</span>
                      )}
                    </div>
                    <p className="text-white text-sm">{occ.description}</p>
                    <p className="text-slate-500 text-xs mt-1">{formatDate(occ.created_at)}</p>
                  </div>
                  <span className={cn("flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border", cfg.color)}>
                    <Icon size={12} />
                    <span>{cfg.label}</span>
                  </span>
                </div>
                {occ.admin_response && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                    <p className="text-xs font-bold text-indigo-400 mb-1">Resposta do Síndico</p>
                    <p className="text-slate-300 text-sm">{occ.admin_response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
