import { useState, useEffect } from "react";
import { User } from "./types";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { Sidebar } from "./components/Sidebar";
import { ExpenseManager } from "./components/ExpenseManager";
import { NotificationFeed } from "./components/NotificationFeed";
import { TransparencyReport } from "./components/TransparencyReport";
import { IncomeManager } from "./components/IncomeManager";
import { ResidentPortal } from "./components/ResidentPortal";
import { MaintenanceManager } from "./components/MaintenanceManager";
import { OccurrenceManager } from "./components/OccurrenceManager";
import { AdminUsers } from "./components/AdminUsers";

type View = "dashboard" | "expenses" | "income" | "notifications" | "transparency" | "portal" | "maintenance" | "occurrences" | "admin-users";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Carregando...</div>;

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-100 font-sans">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        currentView={view}
        setView={(v) => { setView(v); setSidebarOpen(false); }}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 backdrop-blur-xl sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="19" y2="6" />
              <line x1="3" y1="12" x2="19" y2="12" />
              <line x1="3" y1="18" x2="19" y2="18" />
            </svg>
          </button>
          <span className="text-base font-bold text-white">CondoTrust</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {view === "dashboard" && <Dashboard user={user} />}
            {view === "expenses" && <ExpenseManager user={user} />}
            {view === "income" && <IncomeManager user={user} />}
            {view === "notifications" && <NotificationFeed user={user} />}
            {view === "transparency" && <TransparencyReport user={user} />}
            {view === "portal" && <ResidentPortal user={user} />}
            {view === "maintenance" && <MaintenanceManager user={user} />}
            {view === "occurrences" && <OccurrenceManager user={user} />}
            {view === "admin-users" && <AdminUsers />}
          </div>
        </main>
      </div>
    </div>
  );
}
