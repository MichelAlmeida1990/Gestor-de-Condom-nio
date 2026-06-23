import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { ResidentUser, Occurrence } from "../types";
import { cn, formatDate, formatDateTime } from "../lib/utils";
import { Users, CheckCircle, XCircle, MessageSquare, X, User as UserIcon, Heart, Car, Phone, AlertTriangle } from "lucide-react";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";

const statusConfig = {
  open: { label: "Aberta", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  in_progress: { label: "Em andamento", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  resolved: { label: "Resolvida", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

interface AdminUsersProps {
  onPendingCount?: (count: number) => void;
}

export function AdminUsers({ onPendingCount }: AdminUsersProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"users" | "occurrences">("users");
  const [users, setUsers] = useState<ResidentUser[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseForm, setResponseForm] = useState({ status: "in_progress", admin_response: "" });
  const [selectedUser, setSelectedUser] = useState<ResidentUser | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (selectedOccurrence) {
      setResponseForm({
        status: selectedOccurrence.status === "resolved" ? "resolved" : selectedOccurrence.status || "in_progress",
        admin_response: selectedOccurrence.admin_response || "",
      });
    }
  }, [selectedOccurrence]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, o] = await Promise.all([api.get("/admin/users"), api.get("/occurrences")]);
      setUsers(u);
      setOccurrences(o);
      onPendingCount?.(u.filter((x: ResidentUser) => x.status === "pending").length);
      if (selectedOccurrence) {
        const updatedOccurrence = o.find((item) => item.id === selectedOccurrence.id);
        if (updatedOccurrence) setSelectedOccurrence(updatedOccurrence);
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao carregar dados", "error");
    } finally {
      setLoading(false);
    }
  }, [onPendingCount, toast, selectedOccurrence]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fechar modais com Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedUser(null);
        setSelectedOccurrence(null);
        setConfirm(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const updateUserStatus = (id: number, status: string, name: string) => {
    const action = status === "active" ? "aprovar" : status === "rejected" ? "rejeitar" : "alterar";
    setConfirm({
      message: `Deseja ${action} o acesso de ${name}?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.put(`/admin/users/${id}/status`, { status });
          toast(status === "active" ? "Morador aprovado!" : "Acesso revogado.", status === "active" ? "success" : "info");
          fetchAll();
          if (selectedUser?.id === id) setSelectedUser(prev => prev ? { ...prev, status: status as ResidentUser["status"] } : null);
        } catch (err: unknown) {
          toast(err instanceof Error ? err.message : "Erro ao atualizar status", "error");
        }
      }
    });
  };

  const submitResponse = async (id: number) => {
    try {
      await api.put(`/occurrences/${id}`, responseForm);
      toast("Resposta salva com sucesso!", "success");
      setResponseForm({ status: "in_progress", admin_response: "" });
      setOccurrences((prev) => prev.map((occ) => occ.id === id ? { ...occ, ...responseForm } : occ));
      if (selectedOccurrence?.id === id) {
        setSelectedOccurrence(prev => prev ? { ...prev, ...responseForm } : null);
      }
      fetchAll();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao salvar resposta", "error");
    }
  };

  const pending = users.filter((u) => u.status === "pending");
  const active = users.filter((u) => u.status === "active");
  const rejected = users.filter((u) => u.status === "rejected");

  const Field = ({ label, value }: { label: string; value?: string }) =>
    value ? (
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    ) : null;

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
                    <button onClick={() => setSelectedUser(u)} className="text-left flex-1 min-w-0 hover:opacity-80 transition-opacity">
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-slate-400 text-sm">{u.email}{u.unit ? ` • Apto ${u.unit}` : ""}{u.phone ? ` • ${u.phone}` : ""}</p>
                      <p className="text-slate-500 text-xs mt-1">Cadastrado em {formatDate(u.created_at)}</p>
                    </button>
                    <div className="flex space-x-2">
                      <button onClick={() => updateUserStatus(u.id, "active", u.name)} className="flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <CheckCircle size={15} /><span>Aprovar</span>
                      </button>
                      <button onClick={() => updateUserStatus(u.id, "rejected", u.name)} className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
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
                    <button onClick={() => setSelectedUser(u)} className="text-left flex-1 min-w-0 hover:opacity-80 transition-opacity">
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="text-slate-400 text-sm">{u.email}{u.unit ? ` • Apto ${u.unit}` : ""}</p>
                    </button>
                    <button onClick={() => updateUserStatus(u.id, "rejected", u.name)} className="text-xs text-slate-500 hover:text-rose-400 transition-colors">
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
                    <button onClick={() => setSelectedUser(u)} className="text-left flex-1 min-w-0 hover:opacity-80 transition-opacity">
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="text-slate-400 text-sm">{u.email}</p>
                    </button>
                    <button onClick={() => updateUserStatus(u.id, "active", u.name)} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
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
            const cfg = statusConfig[occ.status as keyof typeof statusConfig] || statusConfig.open;
            return (
              <button key={occ.id} onClick={() => setSelectedOccurrence(occ)} className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{occ.type}</span>
                      {occ.user_name && <span className="text-xs text-slate-500">• {occ.user_name}{occ.unit ? ` — Apto ${occ.unit}` : ""}</span>}
                    </div>
                    <p className="text-white text-sm line-clamp-2">{occ.description}</p>
                    <p className="text-slate-500 text-xs mt-1">{formatDate(occ.created_at)}</p>
                  </div>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border shrink-0", cfg.color)}>{cfg.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal Perfil do Morador */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-2xl rounded-[32px] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", selectedUser.status === "active" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : selectedUser.status === "pending" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20")}>
                    {selectedUser.status === "active" ? "Ativo" : selectedUser.status === "pending" ? "Pendente" : "Rejeitado"}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white p-2 bg-white/5 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Dados Pessoais */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Dados Pessoais</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <Field label="Email" value={selectedUser.email} />
                  <Field label="Telefone" value={selectedUser.phone} />
                  <Field label="Apartamento" value={selectedUser.unit} />
                  <Field label="CPF" value={selectedUser.cpf} />
                  <Field label="Data de Nascimento" value={selectedUser.birthdate ? formatDate(selectedUser.birthdate) : undefined} />
                  <Field label="Veículos" value={selectedUser.vehicles} />
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Cadastrado em</p>
                    <p className="text-sm text-white">{formatDate(selectedUser.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Contato de Emergência */}
              {(selectedUser.emergency_contact || selectedUser.emergency_phone) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Phone size={16} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Contato de Emergência</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10">
                    <Field label="Nome do Contato" value={selectedUser.emergency_contact} />
                    <Field label="Telefone de Emergência" value={selectedUser.emergency_phone} />
                  </div>
                </div>
              )}

              {/* Saúde */}
              {(selectedUser.blood_type || selectedUser.health_notes) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Heart size={16} className="text-rose-400" />
                    <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest">Informações de Saúde</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 bg-rose-500/5 rounded-2xl p-4 border border-rose-500/10">
                    <Field label="Tipo Sanguíneo" value={selectedUser.blood_type} />
                    <Field label="Condições de Saúde / Observações" value={selectedUser.health_notes} />
                  </div>
                </div>
              )}

              {!selectedUser.emergency_contact && !selectedUser.blood_type && !selectedUser.health_notes && (
                <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                  <p className="text-amber-300 text-sm">Morador não preencheu informações de emergência e saúde.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              {selectedUser.status === "pending" && (
                <>
                  <button onClick={() => updateUserStatus(selectedUser.id, "active", selectedUser.name)} className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-all">
                    Aprovar Cadastro
                  </button>
                  <button onClick={() => updateUserStatus(selectedUser.id, "rejected", selectedUser.name)} className="flex-1 py-3 text-sm font-bold text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 transition-all">
                    Rejeitar
                  </button>
                </>
              )}
              {selectedUser.status === "active" && (
                <button onClick={() => updateUserStatus(selectedUser.id, "rejected", selectedUser.name)} className="flex-1 py-3 text-sm font-bold text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 transition-all">
                  Revogar Acesso
                </button>
              )}
              {selectedUser.status === "rejected" && (
                <button onClick={() => updateUserStatus(selectedUser.id, "active", selectedUser.name)} className="flex-1 py-3 text-sm font-bold text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all">
                  Reativar
                </button>
              )}
              <button onClick={() => setSelectedUser(null)} className="flex-1 py-3 text-sm font-bold text-slate-400 border border-white/10 rounded-xl hover:bg-white/5 transition-all">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhe Ocorrência */}
      {selectedOccurrence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-[32px] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{selectedOccurrence.type}</span>
                <h2 className="text-lg font-bold text-white mt-1">{selectedOccurrence.user_name}{selectedOccurrence.unit ? ` — Apto ${selectedOccurrence.unit}` : ""}</h2>
              </div>
              <button onClick={() => { setSelectedOccurrence(null); }} className="text-slate-500 hover:text-white p-2 bg-white/5 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Descrição</p>
                <p className="text-white text-sm leading-relaxed">{selectedOccurrence.description}</p>
                <div className="flex items-center space-x-4 text-slate-500 text-xs mt-3">
                  <span>{formatDate(selectedOccurrence.created_at)}</span>
                  {selectedOccurrence.occurrence_date && (
                    <span>Ocorrência: {formatDateTime(selectedOccurrence.occurrence_date, selectedOccurrence.occurrence_time)}</span>
                  )}
                </div>
              </div>
              {selectedOccurrence.evidence_url && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Evidência</p>
                  <img src={selectedOccurrence.evidence_url} alt="Evidência" className="w-full h-40 object-cover rounded-lg" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status atual</span>
                <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", (statusConfig[selectedOccurrence.status as keyof typeof statusConfig] || statusConfig.open).color)}>
                  {(statusConfig[selectedOccurrence.status as keyof typeof statusConfig] || statusConfig.open).label}
                </span>
              </div>
              {selectedOccurrence.admin_response && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                  <p className="text-xs font-bold text-indigo-400 mb-2">Resposta do Síndico</p>
                  <p className="text-slate-300 text-sm">{selectedOccurrence.admin_response}</p>
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select value={responseForm.status} onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="open" className="bg-slate-800 text-white">Aberta</option>
                    <option value="in_progress" className="bg-slate-800 text-white">Em andamento</option>
                    <option value="resolved" className="bg-slate-800 text-white">Resolvida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Resposta do Síndico</label>
                  <textarea rows={4} value={responseForm.admin_response} onChange={(e) => setResponseForm({ ...responseForm, admin_response: e.target.value })}
                    placeholder="Escreva uma resposta para o morador..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => submitResponse(selectedOccurrence.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                    Salvar
                  </button>
                  <button onClick={() => setSelectedOccurrence(null)} className="flex-1 text-slate-400 border border-white/10 hover:bg-white/5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          confirmLabel="Confirmar"
          title="Confirmar ação"
        />
      )}
    </div>
  );
}
