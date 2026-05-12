import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { ResidentUser, Occurrence } from "../types";
import { cn, formatDate } from "../lib/utils";
import { Users, CheckCircle, XCircle, Clock, MessageSquare, X } from "lucide-react";

const statusConfig = {
  open: { label: "Aberta", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  in_progress: { label: "Em andamento", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  resolved: { label: "Resolvida", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

export function AdminUsers() {
  const [tab, setTab] = useState<"users" | "occurrences">("users");
  const [users, setUsers] = useState<ResidentUser[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<number | null>(null);
  const [responseForm, setResponseForm] = useState({ status: "in_progress", admin_response: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, o] = await Promise.all([api.get("/admin/users"), api.get("/occurrences")]);
      setUsers(u);
      setOccurrences(o);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateUserStatus = async (id: number, status: string) => {
    await api.put(`/admin/users/${id}/status`, { status });
    fetchAll();
  };

  const submitResponse = async (id: number) => {
    await api.put(`/occurrences/${id}`, responseForm);
    setResponding(null);
    setResponseForm({ status: "in_progress", admin_response: "" });
    fetchAll();
  };

  const pending = users.filter((u) => u.status === "pending");
  const active = users.filter((u) => u.status === "active");
  const rejected = users.filter((u) => u.status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gestão de Moradores</h1>
        <p className="text-slate-400 text-sm mt-1">Aprove cadastros e gerencie ocorrências</p>
      </div>

      <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit">
        <button onClick={() => setTab("users")} className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all", tab === "users" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white")}>
          Moradores {pending.length > 0 && <span className="ml-1.5 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>}
        </button>
        <button onClick={() => setTab("occurrences")} className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all", tab === "occurrences" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white")}>
          Ocorrências {occurrences.filter(o => o.status === "open").length > 0 && <span className="ml-1.5 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full">{occurrences.filter(o => o.status === "open").length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
        </div>
      ) : tab === "users" ? (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3">Aguardando Aprovação ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map((u) => (
                  <div key={u.id} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-slate-400 text-sm">{u.email}{u.unit ? ` • Apto ${u.unit}` : ""}{u.phone ? ` • ${u.phone}` : ""}</p>
                      <p className="text-slate-500 text-xs mt-1">Cadastrado em {formatDate(u.created_at)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => updateUserStatus(u.id, "active")} className="flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <CheckCircle size={15} /><span>Aprovar</span>
                      </button>
                      <button onClick={() => updateUserStatus(u.id, "rejected")} className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <XCircle size={15} /><span>Rejeitar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-3">Moradores Ativos ({active.length})</h2>
              <div className="space-y-2">
                {active.map((u) => (
                  <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="text-slate-400 text-sm">{u.email}{u.unit ? ` • Apto ${u.unit}` : ""}</p>
                    </div>
                    <button onClick={() => updateUserStatus(u.id, "rejected")} className="text-xs text-slate-500 hover:text-rose-400 transition-colors">
                      Revogar acesso
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rejected.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-3">Rejeitados ({rejected.length})</h2>
              <div className="space-y-2">
                {rejected.map((u) => (
                  <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap opacity-60">
                    <div>
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="text-slate-400 text-sm">{u.email}</p>
                    </div>
                    <button onClick={() => updateUserStatus(u.id, "active")} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                      Reativar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {users.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 space-y-2">
              <Users size={32} />
              <p>Nenhum morador cadastrado ainda</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {occurrences.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 space-y-2">
              <MessageSquare size={32} />
              <p>Nenhuma ocorrência registrada</p>
            </div>
          ) : occurrences.map((occ) => {
            const cfg = statusConfig[occ.status];
            return (
              <div key={occ.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{occ.type}</span>
                      {occ.user_name && <span className="text-xs text-slate-500">• {occ.user_name}{occ.unit ? ` — Apto ${occ.unit}` : ""}</span>}
                    </div>
                    <p className="text-white text-sm">{occ.description}</p>
                    <p className="text-slate-500 text-xs mt-1">{formatDate(occ.created_at)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", cfg.color)}>{cfg.label}</span>
                    {occ.status !== "resolved" && (
                      <button onClick={() => { setResponding(occ.id); setResponseForm({ status: occ.status === "open" ? "in_progress" : occ.status, admin_response: occ.admin_response || "" }); }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <MessageSquare size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {occ.admin_response && responding !== occ.id && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                    <p className="text-xs font-bold text-indigo-400 mb-1">Sua resposta</p>
                    <p className="text-slate-300 text-sm">{occ.admin_response}</p>
                  </div>
                )}

                {responding === occ.id && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Responder ocorrência</p>
                      <button onClick={() => setResponding(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                    </div>
                    <select value={responseForm.status} onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="in_progress" className="bg-slate-800">Em andamento</option>
                      <option value="resolved" className="bg-slate-800">Resolvida</option>
                    </select>
                    <textarea rows={3} value={responseForm.admin_response} onChange={(e) => setResponseForm({ ...responseForm, admin_response: e.target.value })}
                      placeholder="Escreva uma resposta para o morador..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    <button onClick={() => submitResponse(occ.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                      Salvar resposta
                    </button>
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
