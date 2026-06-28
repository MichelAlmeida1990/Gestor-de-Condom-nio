import { useState, useEffect } from "react";
import type { FormEvent } from "react";
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
  XCircle,
  X,
  Save,
  Eye,
  Printer
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

export function MaintenanceManager({ user }: { user: User }) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
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
        const data = await api.get("/maintenance");
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch maintenance data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingRequest) {
        const updatedRequest = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          assigned_to: formData.assigned_to || undefined,
          status: editingRequest.status,
          cost: editingRequest.cost
        };

        await api.put(`/maintenance/${editingRequest.id}`, updatedRequest);
        setRequests(requests.map(req => 
          req.id === editingRequest.id 
            ? { ...req, ...updatedRequest, updated_at: new Date().toISOString(), completed_at: updatedRequest.status === 'completed' ? new Date().toISOString() : req.completed_at }
            : req
        ));
      } else {
        const newRequestPayload = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          assigned_to: formData.assigned_to || undefined,
        };

        const newRequest = await api.post("/maintenance", newRequestPayload);
        setRequests([
          ...requests,
          {
            id: newRequest.id,
            ...newRequestPayload,
            status: "pending",
            requested_by: user.name,
            created_at: newRequest.created_at,
            updated_at: newRequest.created_at,
          },
        ]);
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
    if (!confirm("Tem certeza que deseja excluir esta solicitação?")) return;
    try {
      await api.delete(`/maintenance/${id}`);
      setRequests(requests.filter(req => req.id !== id));
    } catch (error) {
      console.error("Failed to delete maintenance request", error);
    }
  };

  const updateStatus = async (id: number, status: MaintenanceRequest['status']) => {
    try {
      const request = requests.find(req => req.id === id);
      if (!request) return;
      await api.put(`/maintenance/${id}`, {
        title: request.title,
        description: request.description,
        category: request.category,
        priority: request.priority,
        assigned_to: request.assigned_to || undefined,
        status,
        cost: request.cost,
      });
      setRequests(requests.map(req => 
        req.id === id 
          ? { 
              ...req, 
              status, 
              updated_at: new Date().toISOString(),
              completed_at: status === 'completed' ? new Date().toISOString() : undefined
            }
          : req
      ));
    } catch (error) {
      console.error("Failed to update maintenance status", error);
    }
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
                      <option key={cat.value} value={cat.value} className="bg-slate-800 text-white">{cat.label}</option>
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
                      <option key={pri.value} value={pri.value} className="bg-slate-800 text-white">{pri.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {user.role === "admin" && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Atribuído para</label>
                  <input
                    type="text"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white transition-all placeholder-slate-600"
                    placeholder="Nome do prestador ou responsável"
                  />
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

      {/* Detail View Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
          <div className="bg-[#1e293b] w-full max-w-3xl rounded-[32px] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white tracking-tighter">Detalhes da Solicitação</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Título</label>
                  <p className="text-white font-medium">{selectedRequest.title}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Descrição</label>
                  <p className="text-white">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Categoria</label>
                    <p className="text-white">{categories.find(c => c.value === selectedRequest.category)?.label}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Prioridade</label>
                    <span className={`text-sm font-medium ${priorities.find(p => p.value === selectedRequest.priority)?.color}`}>
                      {priorities.find(p => p.value === selectedRequest.priority)?.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Status</label>
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const statusInfo = statuses.find(s => s.value === selectedRequest.status);
                        const StatusIcon = statusInfo?.icon || Clock;
                        return <>
                          <StatusIcon className={statusInfo?.color} size={16} />
                          <span className="text-white">{statusInfo?.label}</span>
                        </>;
                      })()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Solicitante</label>
                    <div className="flex items-center space-x-2">
                      <UserIcon size={14} />
                      <span className="text-white">{selectedRequest.requested_by}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Data de Abertura</label>
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} />
                      <span className="text-white">{new Date(selectedRequest.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às {new Date(selectedRequest.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {selectedRequest.updated_at && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Última Atualização</label>
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} />
                        <span className="text-white">{new Date(selectedRequest.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às {new Date(selectedRequest.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedRequest.assigned_to && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Atribuído para</label>
                    <p className="text-white">{selectedRequest.assigned_to}</p>
                  </div>
                )}

                {selectedRequest.completed_at && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Data de Conclusão</label>
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} />
                      <span className="text-white">{new Date(selectedRequest.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às {new Date(selectedRequest.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                )}

                {selectedRequest.cost && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Custo</label>
                    <p className="text-white">R$ {selectedRequest.cost.toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 min-w-[120px] py-3 text-sm font-bold text-slate-400 border border-white/10 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center space-x-2"
                >
                  <X size={16} />
                  <span>Fechar</span>
                </button>
                <button
                  onClick={() => {
                    setEditingRequest(selectedRequest);
                    setFormData({
                      title: selectedRequest.title,
                      description: selectedRequest.description,
                      category: selectedRequest.category,
                      priority: selectedRequest.priority,
                      assigned_to: selectedRequest.assigned_to || ""
                    });
                    setShowForm(true);
                    setSelectedRequest(null);
                  }}
                  className="flex-1 min-w-[120px] py-3 text-sm font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
                >
                  <Edit size={16} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(selectedRequest.id)}
                  className="flex-1 min-w-[120px] py-3 text-sm font-bold text-white bg-rose-600 rounded-2xl hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Excluir</span>
                </button>
                <button
                  onClick={() => {
                    // View functionality - could open in a new tab or different format
                    window.open(window.location.href, '_blank');
                  }}
                  className="flex-1 min-w-[120px] py-3 text-sm font-bold text-white bg-cyan-600 rounded-2xl hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center space-x-2"
                >
                  <Eye size={16} />
                  <span>Visualizar</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 min-w-[120px] py-3 text-sm font-bold text-white bg-slate-600 rounded-2xl hover:bg-slate-500 transition-all shadow-lg shadow-slate-600/20 flex items-center justify-center space-x-2"
                >
                  <Printer size={16} />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
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
              {requests.length === 0 && (
                <tr>
                  <td colSpan={user.role === "admin" ? 7 : 6} className="px-6 py-16 text-center text-slate-500">
                    Nenhuma solicitação registrada.
                  </td>
                </tr>
              )}
              {requests.map((request) => {
                const statusInfo = statuses.find(s => s.value === request.status);
                const priorityInfo = priorities.find(p => p.value === request.priority);
                const StatusIcon = statusInfo?.icon || Clock;
                
                return (
                  <tr 
                    key={request.id} 
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">#{request.id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-indigo-400">{request.title}</div>
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
                        <span>{new Date(request.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às {new Date(request.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
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
                              <option key={status.value} value={status.value} className="bg-slate-800 text-white">{status.label}</option>
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
