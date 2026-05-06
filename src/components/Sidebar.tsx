import { User, UserRole } from "../types";
import { 
  Building2, 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  Bell, 
  FileText, 
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Users,
  Wrench
} from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  user: User;
  currentView: string;
  setView: (view: any) => void;
  onLogout: () => void;
  isOpen: boolean;
}

export function Sidebar({ user, currentView, setView, onLogout, isOpen }: SidebarProps) {
  const isAdmin = user.role === "admin";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "resident"] },
    { id: "portal", label: "Portal do Morador", icon: Users, roles: ["admin", "resident"] },
    { id: "maintenance", label: "Manutenção", icon: Wrench, roles: ["admin", "resident"] },
    { id: "transparency", label: "Relatórios", icon: FileText, roles: ["admin", "resident"] },
    { id: "notifications", label: "Mural de Avisos", icon: Bell, roles: ["admin", "resident"] },
    { id: "expenses", label: "Despesas", icon: Receipt, roles: ["admin"] },
    { id: "income", label: "Receitas", icon: Wallet, roles: ["admin"] },
  ];

  return (
    <aside className={cn(
      "w-64 bg-[#0f172a] lg:bg-white/5 border-r border-white/10 backdrop-blur-xl flex flex-col h-screen sticky top-0 p-6 z-30 transition-transform duration-300",
      "fixed lg:relative",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="flex items-center space-x-3 mb-10">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
          <Building2 size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">CondoTrust</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          if (!item.roles.includes(user.role)) return null;
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                isActive 
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/5" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              )}
            >
              <Icon size={18} className={cn("transition-colors", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center space-x-3 p-4 mb-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 italic uppercase tracking-wider">{isAdmin ? "Síndico" : "Morador"}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
        >
          <LogOut size={18} />
          <span>Sair do sistema</span>
        </button>
      </div>
    </aside>
  );
}
