import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { User, Reservation } from "../types";
import { cn, formatDate } from "../lib/utils";
import { Calendar, Clock, Plus, Trash2, Check, X, AlertTriangle, Building, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";
import { reservationSchema } from "../lib/validation";

const AREAS = ["Salão de Festas", "Churrasqueira", "Espaço Gourmet", "Quadra Poliesportiva"] as const;
const SLOTS = [
  "Manhã (08:00 - 12:00)",
  "Tarde (13:00 - 17:00)",
  "Noite (18:00 - 22:00)",
  "Dia Inteiro (08:00 - 22:00)"
] as const;

const statusConfig = {
  pending: { label: "Pendente", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
  approved: { label: "Aprovada", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
  rejected: { label: "Rejeitada", color: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: XCircle }
};

export function ReservationManager({ user }: { user: User }) {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"my-reservations" | "agenda" | "admin-pending">("agenda");

  const [form, setForm] = useState({
    area_name: AREAS[0] as string,
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0], // amanhã por padrão
    time_slot: SLOTS[0] as string
  });

  const isAdmin = user.role === "admin";

  const fetchReservations = async () => {
    try {
      const data = await api.get("/reservations");
      setReservations(data);
    } catch (error) {
      toast("Erro ao carregar reservas.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    if (isAdmin) {
      setActiveTab("admin-pending");
    } else {
      setActiveTab("my-reservations");
    }
  }, [isAdmin]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validation = reservationSchema.safeParse(form);
      if (!validation.success) {
        toast(validation.error.issues[0].message, "error");
        setSubmitting(false);
        return;
      }

      await api.post("/reservations", validation.data);
      toast("Reserva solicitada com sucesso!", "success");
      setShowForm(false);
      fetchReservations();
    } catch (err: any) {
      toast(err.message || "Erro ao solicitar reserva.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: "approved" | "rejected") => {
    try {
      await api.put(`/reservations/${id}/status`, { status });
      toast(status === "approved" ? "Reserva aprovada com sucesso!" : "Reserva rejeitada.", "success");
      fetchReservations();
    } catch (err: any) {
      toast(err.message || "Erro ao atualizar status da reserva.", "error");
    }
  };

  const handleCancelReservation = async () => {
    if (confirmCancel === null) return;
    try {
      await api.delete(`/reservations/${confirmCancel}`);
      toast("Reserva cancelada com sucesso.", "info");
      fetchReservations();
    } catch (err: any) {
      toast(err.message || "Erro ao cancelar reserva.", "error");
    } finally {
      setConfirmCancel(null);
    }
  };

  const myReservations = reservations.filter(r => r.user_id === user.id);
  const approvedReservations = reservations.filter(r => r.status === "approved");
  const pendingReservations = reservations.filter(r => r.status === "pending");

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Reservas de Áreas Comuns</h1>
          <p className="text-slate-400 mt-1">
            {isAdmin 
              ? "Gerencie as solicitações e a ocupação das áreas comuns." 
              : "Reserve espaços de lazer para você e seus convidados."}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          <span>Solicitar Nova Reserva</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit backdrop-blur-sm">
        {!isAdmin && (
          <button
            onClick={() => setActiveTab("my-reservations")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === "my-reservations" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            Minhas Reservas
          </button>
        )}
        <button
          onClick={() => setActiveTab("agenda")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            activeTab === "agenda" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"
          )}
        >
          Agenda do Condomínio
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("admin-pending")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all relative",
              activeTab === "admin-pending" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            Pendentes
            {pendingReservations.length > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingReservations.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Formulário de Reserva (Modal) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-[32px] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <h2 className="text-2xl font-black text-white tracking-tighter">Solicitar Reserva</h2>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Área Comum</label>
                  <select
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white appearance-none"
                    value={form.area_name}
                    onChange={e => setForm({ ...form, area_name: e.target.value })}
                  >
                    {AREAS.map(a => <option key={a} value={a} className="bg-[#1e293b] text-white">{a}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Data da Reserva</label>
                  <input
                    type="date"
                    required
                    min={today}
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Período</label>
                  <select
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white appearance-none"
                    value={form.time_slot}
                    onChange={e => setForm({ ...form, time_slot: e.target.value })}
                  >
                    {SLOTS.map(s => <option key={s} value={s} className="bg-[#1e293b] text-white">{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-4 text-sm font-bold text-slate-400 border border-white/10 rounded-2xl hover:bg-white/5 transition-all"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 text-sm font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? "SOLICITANDO..." : "SOLICITAR RESERVA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ABA: MINHAS RESERVAS */}
          {activeTab === "my-reservations" && (
            <div className="space-y-4">
              {myReservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-2 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                  <Building size={32} />
                  <p>Você não possui solicitações de reserva de área comum.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myReservations.map((resv) => {
                    const cfg = statusConfig[resv.status];
                    const Icon = cfg.icon;
                    return (
                      <div key={resv.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4 backdrop-blur-md shadow-xl">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{resv.area_name}</span>
                            <h3 className="text-lg font-bold text-white mt-1">{formatDate(resv.date)}</h3>
                            <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1">
                              <Clock size={14} className="text-slate-500" />
                              {resv.time_slot}
                            </p>
                          </div>
                          <span className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border", cfg.color)}>
                            <Icon size={12} />
                            <span>{cfg.label}</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Solicitada em {formatDate(resv.created_at)}</span>
                          <button
                            onClick={() => setConfirmCancel(resv.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={13} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA: AGENDA DO CONDOMÍNIO (APROVADAS) */}
          {activeTab === "agenda" && (
            <div className="space-y-4">
              {approvedReservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-2 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                  <Calendar size={32} />
                  <p>Nenhuma reserva aprovada para as próximas semanas.</p>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 border-b border-white/5 text-[10px] font-bold uppercase tracking-[0.2em]">
                          <th className="px-8 py-6">Área Reservada</th>
                          <th className="px-8 py-6">Data</th>
                          <th className="px-8 py-6">Período</th>
                          <th className="px-8 py-6">Reservado Por</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {approvedReservations.map((resv) => (
                          <tr key={resv.id} className="hover:bg-white/5 transition-all">
                            <td className="px-8 py-5">
                              <span className="px-3 py-1 bg-indigo-500/10 rounded-lg text-[10px] font-black text-indigo-300 uppercase tracking-wider border border-indigo-500/10">
                                {resv.area_name}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-sm text-white font-medium">{formatDate(resv.date)}</td>
                            <td className="px-8 py-5 text-sm text-slate-400">{resv.time_slot}</td>
                            <td className="px-8 py-5 text-sm text-slate-300">
                              {resv.user_name} {resv.unit ? `(Apto ${resv.unit})` : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA: ADMIN PENDENTES */}
          {activeTab === "admin-pending" && (
            <div className="space-y-4">
              {pendingReservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-2 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                  <AlertTriangle size={32} className="text-emerald-400/80" />
                  <p className="text-slate-400">Nenhuma solicitação de reserva pendente de aprovação.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReservations.map((resv) => (
                    <div key={resv.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4 backdrop-blur-md shadow-xl border-l-4 border-l-amber-500">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Reserva Pendente</span>
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Solicitada em {formatDate(resv.created_at)}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mt-2">{resv.area_name}</h3>
                        <p className="text-slate-300 text-sm mt-1">Morador: <span className="font-semibold text-white">{resv.user_name}</span> {resv.unit ? `— Apto ${resv.unit}` : ""}</p>
                        <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-2">
                          <Calendar size={14} /> {formatDate(resv.date)}
                        </p>
                        <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1">
                          <Clock size={14} /> {resv.time_slot}
                        </p>
                      </div>
                      <div className="flex space-x-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleStatusChange(resv.id, "approved")}
                          className="flex-1 flex items-center justify-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        >
                          <Check size={16} />
                          <span>Aprovar</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(resv.id, "rejected")}
                          className="flex-1 flex items-center justify-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        >
                          <X size={16} />
                          <span>Rejeitar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {confirmCancel !== null && (
        <ConfirmDialog
          title="Confirmar Cancelamento"
          message="Tem certeza que deseja cancelar esta reserva?"
          confirmLabel="Sim, cancelar"
          onConfirm={handleCancelReservation}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
    </div>
  );
}
