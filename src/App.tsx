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

type View = "dashboard" | "expenses" | "income" | "notifications" | "transparency" | "portal" | "maintenance";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [loading, setLoading] = useState(true);

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
      <Sidebar user={user} currentView={view} setView={setView} onLogout={handleLogout} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {view === "dashboard" && <Dashboard user={user} />}
          {view === "expenses" && <ExpenseManager user={user} />}
          {view === "income" && <IncomeManager user={user} />}
          {view === "notifications" && <NotificationFeed user={user} />}
          {view === "transparency" && <TransparencyReport user={user} />}
          {view === "portal" && <ResidentPortal user={user} />}
          {view === "maintenance" && <MaintenanceManager user={user} />}
        </div>
      </main>
    </div>
  );
}
