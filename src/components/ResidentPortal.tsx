import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { User, Notification } from "../types";
import { formatDate, cn } from "../lib/utils";
import { 
  Home, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Users, 
  Settings,
  Bell,
  Download,
  Eye
} from "lucide-react";

interface Document {
  id: number;
  title: string;
  type: string;
  date: string;
  url: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  type: "meeting" | "maintenance" | "social";
}

export function ResidentPortal({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notif] = await Promise.all([
          api.get("/notifications"),
        ]);
        setNotifications(notif);
        
        // Mock data for demonstration
        setDocuments([
          {
            id: 1,
            title: "Regulamento Interno",
            type: "PDF",
            date: "2024-01-15",
            url: "#"
          },
          {
            id: 2,
            title: "Ata da Última Assembleia",
            type: "PDF",
            date: "2024-01-10",
            url: "#"
          },
          {
            id: 3,
            title: "Demonstrativo Financeiro Janeiro",
            type: "XLSX",
            date: "2024-01-31",
            url: "#"
          }
        ]);
        
        setEvents([
          {
            id: 1,
            title: "Assembleia Ordinária",
            date: "2024-02-15",
            location: "Salão de Festas",
            type: "meeting"
          },
          {
            id: 2,
            title: "Manutenção do Elevador",
            date: "2024-02-10",
            location: "Bloco A",
            type: "maintenance"
          },
          {
            id: 3,
            title: "Festa Junina",
            date: "2024-06-15",
            location: "Área de Lazer",
            type: "social"
          }
        ]);
      } catch (error) {
        console.error("Failed to fetch portal data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: Home },
    { id: "documents", label: "Documentos", icon: FileText },
    { id: "events", label: "Eventos", icon: Calendar },
    { id: "notifications", label: "Comunicados", icon: Bell },
    { id: "community", label: "Comunidade", icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Portal do Morador</h1>
        <p className="text-indigo-100">Bem-vindo, {user.name}!</p>
      </header>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-xl backdrop-blur-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all",
                activeTab === tab.id
                  ? "bg-indigo-500 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Visão Geral</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <Bell className="text-indigo-400" size={24} />
                  <span className="text-2xl font-bold text-white">{notifications.length}</span>
                </div>
                <p className="text-slate-400">Novos Comunicados</p>
              </div>
              
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="text-purple-400" size={24} />
                  <span className="text-2xl font-bold text-white">{documents.length}</span>
                </div>
                <p className="text-slate-400">Documentos Disponíveis</p>
              </div>
              
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="text-emerald-400" size={24} />
                  <span className="text-2xl font-bold text-white">{events.length}</span>
                </div>
                <p className="text-slate-400">Próximos Eventos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Comunicados Recentes</h3>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notif) => (
                    <div key={notif.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <h4 className="font-medium text-white">{notif.title}</h4>
                      <p className="text-slate-400 text-sm mt-1">{notif.message}</p>
                      <p className="text-slate-500 text-xs mt-2">{formatDate(notif.date)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Próximos Eventos</h3>
                <div className="space-y-3">
                  {events.slice(0, 3).map((event) => (
                    <div key={event.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white">{event.title}</h4>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          event.type === "meeting" && "bg-blue-500/20 text-blue-400",
                          event.type === "maintenance" && "bg-amber-500/20 text-amber-400",
                          event.type === "social" && "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {event.type === "meeting" && "Reunião"}
                          {event.type === "maintenance" && "Manutenção"}
                          {event.type === "social" && "Social"}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{event.location}</p>
                      <p className="text-slate-500 text-xs mt-2">{formatDate(event.date)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Documentos</h2>
              <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                <Download size={16} />
                <span>Baixar Todos</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {documents.map((doc) => (
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
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Eventos e Agenda</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      event.type === "meeting" && "bg-blue-500/20 text-blue-400",
                      event.type === "maintenance" && "bg-amber-500/20 text-amber-400",
                      event.type === "social" && "bg-emerald-500/20 text-emerald-400"
                    )}>
                      {event.type === "meeting" && "Reunião"}
                      {event.type === "maintenance" && "Manutenção"}
                      {event.type === "social" && "Social"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-2">{event.title}</h3>
                  <p className="text-slate-400 text-sm mb-1">{event.location}</p>
                  <p className="text-slate-500 text-xs">{formatDate(event.date)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Comunicados</h2>
            
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white text-lg">{notif.title}</h3>
                    <span className="text-slate-500 text-sm">{formatDate(notif.date)}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{notif.message}</p>
                  {notif.expires_at && (
                    <p className="text-slate-500 text-sm mt-3">
                      Expira em: {formatDate(notif.expires_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "community" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Comunidade</h2>
            
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-semibold text-white mb-4">Áreas Comuns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="font-medium text-white">Salão de Festas</h4>
                  <p className="text-slate-400 text-sm mt-1">Disponível para reservas</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="font-medium text-white">Piscina</h4>
                  <p className="text-slate-400 text-sm mt-1">Aberta 8h-22h</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="font-medium text-white">Academia</h4>
                  <p className="text-slate-400 text-sm mt-1">Acesso 24h</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="font-medium text-white">Churrasqueira</h4>
                  <p className="text-slate-400 text-sm mt-1">Reserva necessária</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="font-semibold text-white mb-4">Serviços</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white">Zeladoria</span>
                  <span className="text-slate-400">24h</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white">Portaria</span>
                  <span className="text-slate-400">24h</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white">Manutenção</span>
                  <span className="text-slate-400">Seg-Sex 8h-17h</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
