import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { User, Notification } from "../types";
import { formatDate } from "../lib/utils";
import { Bell, Plus, Trash2, X, AlertCircle, Info, Calendar } from "lucide-react";

export function NotificationFeed({ user }: { user: User }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: "", message: "", expires_at: "" });
  const isAdmin = user.role === "admin";

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get("/notifications");
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/notifications", { 
        ...formData, 
        date: new Date().toISOString().split('T')[0] 
      });
      setShowModal(false);
      setFormData({ title: "", message: "", expires_at: "" });
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover aviso?")) return;
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Mural de Avisos</h1>
          <p className="text-slate-400 mt-1">Comunicados e atualizações para toda a comunidade.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={20} />
            <span>Criar Novo Aviso</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-slate-500">Sincronizando mural...</div>
        ) : notifications.length === 0 ? (
          <div className="col-span-full bg-white/5 p-20 rounded-3xl border border-white/5 backdrop-blur-md flex flex-col items-center text-center">
            <Bell size={64} className="text-slate-700 mb-4" />
            <p className="text-slate-400 font-bold tracking-tight text-xl">Silêncio no mural...</p>
            <p className="text-slate-500 mt-2">Nenhum aviso ativo no momento.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="bg-white/5 p-8 rounded-[32px] border border-white/5 backdrop-blur-md shadow-2xl relative group overflow-hidden hover:border-white/20 transition-all">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-start space-x-5">
                  <div className="mt-1 h-12 w-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <Info size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{n.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center mt-1 font-bold uppercase tracking-widest">
                      <Calendar size={14} className="mr-1.5 text-indigo-500" />
                      {formatDate(n.date)}
                    </p>
                    <p className="mt-6 text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{n.message}</p>
                    {n.expires_at && (
                      <div className="mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl text-xs font-black border border-amber-500/10 uppercase tracking-tighter">
                        <AlertCircle size={14} />
                        <span>Vencimento: {formatDate(n.expires_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(n.id)} className="opacity-0 group-hover:opacity-100 p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all" />
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-[32px] shadow-2xl p-8 border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase whitespace-nowrap">Novo Comunicado</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white p-2 bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Título do Aviso</label>
                <input
                  type="text"
                  required
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-all"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Defina um assunto direto"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Mensagem Detalhada</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-all"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Escreva aqui o conteúdo do comunicado..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Expirar em (Data limite)</label>
                <input
                  type="date"
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-all appearance-none"
                  value={formData.expires_at}
                  onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-bold text-slate-400 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/10 transition-all">DESCARTAR</button>
                <button type="submit" className="flex-1 py-4 font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">PUBLICAR MURAL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
