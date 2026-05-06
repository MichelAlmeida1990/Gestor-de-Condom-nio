import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { User } from "../types";
import { formatDate, cn } from "../lib/utils";
import { 
  Wrench, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  User as UserIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  requested_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  cost?: number;
}

interface Vendor {
  id: number;
  name: string;
  category: string;
  phone: string;
  email: string;
  rating: number;
}

export function MaintenanceManager({ user }: { user: User }) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "hidraulica",
    priority: "medium" as const,
    assigned_to: ""
  });

  const categories = [
    { value: "hidraulica", label: "Hidráulica" },
    { value: "eletrica", label: "Elétrica" },
    { value: "alvenaria", label: "Alvenaria" },
    { value: "pintura", label: "Pintura" },
    { value: "limpeza", label: "Limpeza" },
    { value: "jardinagem", label: "Jardinagem" },
    { value: "elevadores", label: "Elevadores" },
    { value: "portaria", label: "Portaria" },
    { value: "outros", label: "Outros" }
  ];

  const priorities = [
    { value: "low", label: "Baixa", color: "text-slate-400" },
    { value: "medium", label: "Média", color: "text-amber-400" },
    { value: "high", label: "Alta", color: "text-orange-400" },
    { value: "urgent", label: "Urgente", color: "text-rose-400" }
  ];

  const statuses = [
    { value: "pending", label: "Pendente", icon: Clock, color: "text-amber-400" },
    { value: "in_progress", label: "Em Andamento", icon: AlertCircle, color: "text-indigo-400" },
    { value: "completed", label: "Concluído", icon: CheckCircle, color: "text-emerald-400" },
    { value: "cancelled", label: "Cancelado", icon: XCircle, color: "text-slate-400" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock data for demonstration
        setRequests([
          {
            id: 1,
            title: "Vazamento no teto do apto 201",
            description: "Vazamento de água no teto da sala do apartamento 201, provavelmente do apartamento 301.",
            category: "hidraulica",
            priority: "high",
            status: "pending",
            requested_by: "João Silva",
            created_at: "2024-02-01"
          },
          {
            id: 2,
            title: "Manutenção preventiva elevador social",
            description: "Manutenção mensal programada do elevador social conforme contrato.",
            category: "elevadores",
            priority: "medium",
            status: "in_progress",
            requested_by: "Admin",
            assigned_to: "Elevadores S/A",
            created_at: "2024-02-01",
            updated_at: "2024-02-02"
          },
          {
            id: 3,
            title: "Troca de lâmpadas garagem",
            description: "Substituir lâmpadas queimadas na garagem subsolo.",
            category: "eletrica",
            priority: "low",
            status: "completed",
            requested_by: "Maria Santos",
            assigned_to: "Zelador José",
            created_at: "2024-01-28",
            updated_at: "2024-01-29",
            completed_at: "2024-01-29",
            cost: 150.00
          }
        ]);

        setVendors([
          {
            id: 1,
            name: "Elevadores S/A",
            category: "Elevadores",
            phone: "(11) 3456-7890",
            email: "contato@elevadores.com.br",
            rating: 4.5
          },
          {
            id: 2,
            name: "Hidráulica Express",
            category: "Hidráulica",
            phone: "(11) 2345-6789",
            email: "contato@hidraulica.com.br",
            rating: 4.2
          },
          {
            id: 3,
            name: "Elétrica Total",
            category: "Elétrica",
            phone: "(11) 3456-1234",
            email: "contato@eletrica.com.br",
            rating: 4.0
          }
        ]);
      } catch (error) {
        console.error("Failed to fetch maintenance data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRequest) {
        // Update request
        setRequests(requests.map(req => 
          req.id === editingRequest.id 
            ? { ...req, ...formData, updated_at: new Date().toISOString().split('T')[0] }
            : req
        ));
      } else {
        // Create new request
        const newRequest: MaintenanceRequest = {
          id: Date.now(),
          ...formData,
          status: "pending",
          requested_by: user.name,
          created_at: new Date().toISOString().split('T')[0]
        };
        setRequests([...requests, newRequest]);
      }
      
      setShowForm(false);
      setEditingRequest(null);
      setFormData({
        title: "",
        description: "",
        category: "hidraulica",
        priority: "medium",
        assigned_to: ""
      });
    } catch (error) {
      console.error("Failed to save maintenance request", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta solicitação?")) {
      setRequests(requests.filter(req => req.id !== id));
    }
  };

  const updateStatus = (id: number, status: MaintenanceRequest['status']) => {
    setRequests(requests.map(req => 
      req.id === id 
        ? { 
            ...req, 
            status, 
            updated_at: new Date().toISOString().split('T')[0],
            completed_at: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined
          }
        : req
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Manutenção</h1>
          <p className="text-slate-400">Gerenciamento de solicitações e ordens de serviço</p>
        </div>
        {user.role === "admin" && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} />
            <span>Nova Solicitação</span>
          </button>
        )}
      </header>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-2xl rounded-[32px] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <h2 className="text-2xl font-black text-white tracking-tighter">
                {editingRequest ? "Editar Solicitação" : "Nova Solicitação de Manutenção"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Título</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all placeholder-slate-600"
                  placeholder="Descreva brevemente o problema"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Descrição</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all placeholder-slate-600 h-24 resize-none"
                  placeholder="Descreva detalhadamente o problema ou serviço necessário"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenanceRequest['priority'] })}
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white appearance-none"
                  >
                    {priorities.map(pri => (
                      <option key={pri.value} value={pri.value}>{pri.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {user.role === "admin" && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Atribuído para</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white appearance-none"
                  >
                    <option value="">Selecione um prestador</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.name}>{vendor.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRequest(null);
                    setFormData({
                      title: "",
                      description: "",
                      category: "hidraulica",
                      priority: "medium",
                      assigned_to: ""
                    });
                  }}
                  className="flex-1 py-4 text-sm font-bold text-slate-400 border border-white/10 rounded-2xl hover:bg-white/5 transition-all"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 text-sm font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                >
                  {editingRequest ? "ATUALIZAR" : "CRIAR"} SOLICITAÇÃO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statuses.map((status) => {
          const Icon = status.icon;
          const count = requests.filter(req => req.status === status.value).length;
          return (
            <div key={status.value} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <Icon className={status.color} size={24} />
                <span className="text-2xl font-bold text-white">{count}</span>
              </div>
              <p className="text-slate-400">{status.label}</p>
            </div>
          );
        })}
      </div>

      {/* Requests Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Solicitações</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Título</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Solicitante</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Data</th>
                {user.role === "admin" && <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.map((request) => {
                const statusInfo = statuses.find(s => s.value === request.status);
                const priorityInfo = priorities.find(p => p.value === request.priority);
                const StatusIcon = statusInfo?.icon || Clock;
                
                return (
                  <tr key={request.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">#{request.id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{request.title}</div>
                        <div className="text-xs text-slate-400 mt-1">{request.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {categories.find(c => c.value === request.category)?.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${priorityInfo?.color}`}>
                        {priorityInfo?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={statusInfo?.color} size={16} />
                        <span className="text-sm text-slate-300">{statusInfo?.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <div className="flex items-center space-x-2">
                        <UserIcon size={14} />
                        <span>{request.requested_by}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} />
                        <span>{formatDate(request.created_at)}</span>
                      </div>
                    </td>
                    {user.role === "admin" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <select
                            value={request.status}
                            onChange={(e) => updateStatus(request.id, e.target.value as MaintenanceRequest['status'])}
                            className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {statuses.map(status => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              setEditingRequest(request);
                              setFormData({
                                title: request.title,
                                description: request.description,
                                category: request.category,
                                priority: request.priority,
                                assigned_to: request.assigned_to || ""
                              });
                              setShowForm(true);
                            }}
                            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(request.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
