import { useState, useEffect, FormEvent } from "react";
import { api } from "../lib/api";
import { User, Notification } from "../types";
import { formatDate, cn } from "../lib/utils";
import { Home, FileText, Calendar, Users, Bell, Download, Eye, User as UserIcon, Heart, Phone, Car, Save, AlertTriangle } from "lucide-react";
import { useToast } from "./Toast";

interface ResidentPortalProps {
  user: User;
  onProfileUpdate: (user: User) => void;
}

interface ProfileForm {
  name: string;
  phone: string;
  unit: string;
  cpf: string;
  birthdate: string;
  emergency_contact: string;
  emergency_phone: string;
  blood_type: string;
  health_notes: string;
  vehicles: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não sei"];

const documents: { id: number; title: string; type: string; date: string; url: string }[] = [];
const events: { id: number; title: string; date: string; location: string; type: "meeting" | "maintenance" | "social" }[] = [];

export function ResidentPortal({ user, onProfileUpdate }: ResidentPortalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>({
    name: user.name,
    phone: user.phone || "",
    unit: user.unit || "",
    cpf: "",
    birthdate: "",
    emergency_contact: "",
    emergency_phone: "",
    blood_type: "",
    health_notes: "",
    vehicles: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notif, prof] = await Promise.all([
          api.get("/notifications"),
          api.get("/profile"),
        ]);
        setNotifications(notif);
        setProfile({
          name: prof.name || user.name,
          phone: prof.phone || "",
          unit: prof.unit || "",
          cpf: prof.cpf || "",
          birthdate: prof.birthdate || "",
          emergency_contact: prof.emergency_contact || "",
          emergency_phone: prof.emergency_phone || "",
          blood_type: prof.blood_type || "",
          health_notes: prof.health_notes || "",
          vehicles: prof.vehicles || "",
        });
      } catch (error) {
        console.error("Failed to fetch portal data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.name]);

  // Fechar modal com Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveTab("overview"); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const result = await api.put("/profile", profile as unknown as Record<string, unknown>);
      localStorage.setItem("user", JSON.stringify(result.user));
      onProfileUpdate(result.user);
      toast("Perfil atualizado com sucesso!", "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Erro ao salvar perfil", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const hasEmergencyInfo = profile.emergency_contact || profile.emergency_phone || profile.blood_type || profile.health_notes;

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: Home },
    { id: "profile", label: "Meu Perfil", icon: UserIcon },
    { id: "documents", label: "Documentos", icon: FileText },
    { id: "events", label: "Eventos", icon: Calendar },
    { id: "notifications", label: "Comunicados", icon: Bell },
    { id: "community", label: "Comunidade", icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all placeholder-slate-600 text-sm";
  const labelClass = "block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="space-y-6">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Portal do Morador</h1>
        <p className="text-indigo-100">Bem-vindo, {user.name}!</p>
        {!hasEmergencyInfo && (
          <div className="mt-4 flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-2.5 text-amber-200 text-sm w-fit">
            <AlertTriangle size={15} />
            <span>Complete seu perfil com informações de emergência e saúde.</span>
          </div>
        )}
      </header>

      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl backdrop-blur-sm min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn("flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm relative",
                  activeTab === tab.id ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.id === "profile" && !hasEmergencyInfo && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-8 backdrop-blur-md">

        {/* VISÃO GERAL */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Visão Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <Bell className="text-indigo-400" size={24} />
                  <span className="text-2xl font-bold text-white">{notifications.length}</span>
                </div>
                <p className="text-slate-400">Comunicados</p>
              </div>
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="text-purple-400" size={24} />
                  <span className="text-2xl font-bold text-white">{documents.length}</span>
                </div>
                <p className="text-slate-400">Documentos</p>
              </div>
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="text-emerald-400" size={24} />
                  <span className="text-2xl font-bold text-white">{events.length}</span>
                </div>
                <p className="text-slate-400">Eventos</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Comunicados Recentes</h3>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notif) => (
                    <div key={notif.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <h4 className="font-medium text-white">{notif.title}</h4>
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-slate-500 text-xs mt-2">{formatDate(notif.date)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Próximos Eventos</h3>
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <div className="bg-white/5 p-8 rounded-xl border border-white/10 text-center text-slate-500">
                      Nenhum evento agendado no momento.
                    </div>
                  ) : (
                    events.slice(0, 3).map((event) => (
                      <div key={event.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">{event.title}</h4>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium",
                            event.type === "meeting" && "bg-blue-500/20 text-blue-400",
                            event.type === "maintenance" && "bg-amber-500/20 text-amber-400",
                            event.type === "social" && "bg-emerald-500/20 text-emerald-400"
                          )}>
                            {event.type === "meeting" ? "Reunião" : event.type === "maintenance" ? "Manutenção" : "Social"}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{event.location}</p>
                        <p className="text-slate-500 text-xs mt-2">{formatDate(event.date)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERFIL */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Meu Perfil</h2>
              <button type="submit" disabled={savingProfile}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                <Save size={16} />
                {savingProfile ? "Salvando..." : "Salvar Perfil"}
              </button>
            </div>

            {/* Dados Pessoais */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <UserIcon size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Dados Pessoais</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nome Completo *</label>
                  <input type="text" required className={inputClass} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>CPF</label>
                  <input type="text" className={inputClass} placeholder="000.000.000-00" value={profile.cpf} onChange={e => setProfile({ ...profile, cpf: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Data de Nascimento</label>
                  <input type="date" className={inputClass} value={profile.birthdate} onChange={e => setProfile({ ...profile, birthdate: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <input type="tel" className={inputClass} placeholder="(11) 99999-9999" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Apartamento / Unidade</label>
                  <input type="text" className={inputClass} placeholder="Ex: 101A" value={profile.unit} onChange={e => setProfile({ ...profile, unit: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Veículos */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Car size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Veículos</h3>
              </div>
              <div>
                <label className={labelClass}>Placa(s) e descrição do veículo</label>
                <input type="text" className={inputClass} placeholder="Ex: ABC-1234 — Honda Civic Prata" value={profile.vehicles} onChange={e => setProfile({ ...profile, vehicles: e.target.value })} />
              </div>
            </div>

            {/* Emergência */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Phone size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Contato de Emergência</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10">
                <div>
                  <label className={labelClass}>Nome do Contato</label>
                  <input type="text" className={inputClass} placeholder="Ex: Maria Silva (mãe)" value={profile.emergency_contact} onChange={e => setProfile({ ...profile, emergency_contact: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Telefone de Emergência</label>
                  <input type="tel" className={inputClass} placeholder="(11) 99999-9999" value={profile.emergency_phone} onChange={e => setProfile({ ...profile, emergency_phone: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Saúde */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart size={16} className="text-rose-400" />
                <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest">Informações de Saúde</h3>
              </div>
              <p className="text-slate-500 text-xs mb-4">Estas informações são confidenciais e acessadas apenas pelo síndico em caso de emergência.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-rose-500/5 rounded-2xl p-4 border border-rose-500/10">
                <div>
                  <label className={labelClass}>Tipo Sanguíneo</label>
                  <select className={inputClass} value={profile.blood_type} onChange={e => setProfile({ ...profile, blood_type: e.target.value })}>
                    <option value="" className="bg-slate-800 text-white">Selecione...</option>
                    {BLOOD_TYPES.map(t => <option key={t} value={t} className="bg-slate-800 text-white">{t}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className={labelClass}>Condições de Saúde / Alergias / Medicamentos</label>
                  <textarea rows={3} className={cn(inputClass, "resize-none")}
                    placeholder="Ex: diabético, alérgico a penicilina, usa marca-passo..."
                    value={profile.health_notes}
                    onChange={e => setProfile({ ...profile, health_notes: e.target.value })} />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* DOCUMENTOS */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-bold text-white">Documentos</h2>
            </div>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="bg-white/5 p-8 rounded-xl border border-white/10 text-center text-slate-500">
                  Nenhum documento disponível no momento.
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="bg-white/5 p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                          <FileText className="text-indigo-400" size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{doc.title}</h4>
                          <p className="text-slate-400 text-sm">{doc.type} • {formatDate(doc.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Eye size={16} /></button>
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Download size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* EVENTOS */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Eventos e Agenda</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.length === 0 ? (
                <div className="col-span-full bg-white/5 p-8 rounded-xl border border-white/10 text-center text-slate-500">
                  Nenhum evento agendado no momento.
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-medium mb-4 inline-block",
                      event.type === "meeting" && "bg-blue-500/20 text-blue-400",
                      event.type === "maintenance" && "bg-amber-500/20 text-amber-400",
                      event.type === "social" && "bg-emerald-500/20 text-emerald-400"
                    )}>
                      {event.type === "meeting" ? "Reunião" : event.type === "maintenance" ? "Manutenção" : "Social"}
                    </span>
                    <h3 className="font-semibold text-white mb-2">{event.title}</h3>
                    <p className="text-slate-400 text-sm mb-1">{event.location}</p>
                    <p className="text-slate-500 text-xs">{formatDate(event.date)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COMUNICADOS */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Comunicados</h2>
            <div className="space-y-4">
              {notifications.length === 0 && <p className="text-slate-500 text-center py-10 italic">Nenhum comunicado no momento.</p>}
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white text-lg">{notif.title}</h3>
                    <span className="text-slate-500 text-sm shrink-0 ml-4">{formatDate(notif.date)}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{notif.message}</p>
                  {notif.expires_at && (
                    <p className="text-amber-400 text-sm mt-3 flex items-center gap-1">
                      <AlertTriangle size={13} /> Expira em: {formatDate(notif.expires_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMUNIDADE */}
        {activeTab === "community" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Comunidade</h2>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-semibold text-white mb-4">Áreas Comuns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[["Salão de Festas", "Disponível para reservas"], ["Piscina", "Aberta 8h–22h"], ["Academia", "Acesso 24h"], ["Churrasqueira", "Reserva necessária"]].map(([name, info]) => (
                  <div key={name} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="font-medium text-white">{name}</h4>
                    <p className="text-slate-400 text-sm mt-1">{info}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-semibold text-white mb-4">Serviços</h3>
              <div className="space-y-3">
                {[["Zeladoria", "24h"], ["Portaria", "24h"], ["Manutenção", "Seg–Sex 8h–17h"]].map(([name, hours]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white">{name}</span>
                    <span className="text-slate-400">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
