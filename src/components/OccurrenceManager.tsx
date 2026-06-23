import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import { User, Occurrence } from "../types";
import { cn, formatDate, formatDateTime } from "../lib/utils";
import { AlertTriangle, Plus, X, Clock, CheckCircle, Loader, Camera, Calendar as CalendarIcon } from "lucide-react";

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
  const [form, setForm] = useState({ type: TYPES[0], description: "", occurrence_date: "", occurrence_time: "", evidence_url: "" });
  const [responseForm, setResponseForm] = useState({ status: "in_progress", admin_response: "" });
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  useEffect(() => {
    if (selectedOccurrence) {
      setResponseForm({
        status: selectedOccurrence.status || "in_progress",
        admin_response: selectedOccurrence.admin_response || "",
      });
    }
  }, [selectedOccurrence]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/occurrences", form);
      setForm({ type: TYPES[0], description: "", occurrence_date: "", occurrence_time: "", evidence_url: "" });
      setPreviewImage(null);
      setShowForm(false);
      fetchOccurrences();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitResponse = async (id: number) => {
    setProcessing(true);
    try {
      await api.put(`/occurrences/${id}`, responseForm);
      setOccurrences((prev) => prev.map((occ) => occ.id === id ? { ...occ, ...responseForm } : occ));
      if (selectedOccurrence?.id === id) {
        setSelectedOccurrence(prev => prev ? { ...prev, ...responseForm } : null);
      }
      await fetchOccurrences();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar ocorrência");
    } finally {
      setProcessing(false);
    }
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setForm({ ...form, evidence_url: reader.result as string });
      };
      reader.readAsDataURL(file);
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
                {TYPES.map((t) => <option key={t} value={t} className="bg-slate-800 text-white">{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Data da Ocorrência</label>
                <input
                  type="date"
                  value={form.occurrence_date}
                  onChange={(e) => setForm({ ...form, occurrence_date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Horário da Ocorrência</label>
                <input
                  type="time"
                  value={form.occurrence_time}
                  onChange={(e) => setForm({ ...form, occurrence_time: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
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
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Evidência (Foto) - Opcional</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="flex items-center justify-center space-x-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
                >
                  <Camera size={20} />
                  <span>{previewImage ? "Alterar foto" : "Adicionar foto como evidência"}</span>
                </label>
              </div>
              {previewImage && (
                <div className="mt-3 relative">
                  <img src={previewImage} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setForm({ ...form, evidence_url: "" });
                    }}
                    className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
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
        <>
          <div className="space-y-3">
            {occurrences.map((occ) => {
              const cfg = statusConfig[occ.status as keyof typeof statusConfig] || statusConfig.open;
              const Icon = cfg.icon;
              return (
                <div key={occ.id}
                  onClick={isAdmin ? () => setSelectedOccurrence(occ) : undefined}
                  className={cn("bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3", isAdmin ? "cursor-pointer hover:border-white/20" : "")}
                >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{occ.type}</span>
                      {isAdmin && occ.user_name && (
                        <span className="text-xs text-slate-500">• {occ.user_name}{occ.unit ? ` — Apto ${occ.unit}` : ""}</span>
                      )}
                    </div>
                    <p className="text-white text-sm">{occ.description}</p>
                    <div className="flex items-center space-x-3 text-slate-500 text-xs mt-1">
                      <span className="flex items-center space-x-1">
                        <CalendarIcon size={12} />
                        <span>{formatDate(occ.created_at)}</span>
                      </span>
                      {occ.occurrence_date && (
                        <span className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>Ocorrência: {formatDateTime(occ.occurrence_date, occ.occurrence_time)}</span>
                        </span>
                      )}
                    </div>
                    {occ.evidence_url && (
                      <div className="mt-2">
                        <img src={occ.evidence_url} alt="Evidência" className="w-full h-32 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                  <span className={cn("flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border", cfg.color)}>
                    <Icon size={12} />
                    <span>{cfg.label}</span>
                  </span>
                {isAdmin && (
                  <button type="button" onClick={() => setSelectedOccurrence(occ)}
                    className="ml-auto text-xs text-indigo-300 hover:text-white transition-colors">
                    Gerenciar
                  </button>
                )}
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
        {selectedOccurrence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
            <div className="bg-[#1e293b] w-full max-w-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{selectedOccurrence.type}</span>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedOccurrence.user_name}{selectedOccurrence.unit ? ` — Apto ${selectedOccurrence.unit}` : ""}</h2>
                </div>
                <button onClick={() => setSelectedOccurrence(null)} className="text-slate-500 hover:text-white p-2 bg-white/5 rounded-full transition-colors">
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
                    <button onClick={() => submitResponse(selectedOccurrence.id)} disabled={processing}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                      {processing ? "Salvando..." : "Salvar"}
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
      </>
      )}
    </div>
  );
}
