import { useState, useEffect, lazy, Suspense } from "react";
import { User } from "./types";
import { Login } from "./components/Login";
import { Sidebar } from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";

const Dashboard = lazy(() => import("./components/Dashboard").then(m => ({ default: m.Dashboard })));
const ExpenseManager = lazy(() => import("./components/ExpenseManager").then(m => ({ default: m.ExpenseManager })));
const NotificationFeed = lazy(() => import("./components/NotificationFeed").then(m => ({ default: m.NotificationFeed })));
const TransparencyReport = lazy(() => import("./components/TransparencyReport").then(m => ({ default: m.TransparencyReport })));
const IncomeManager = lazy(() => import("./components/IncomeManager").then(m => ({ default: m.IncomeManager })));
const ResidentPortal = lazy(() => import("./components/ResidentPortal").then(m => ({ default: m.ResidentPortal })));
const MaintenanceManager = lazy(() => import("./components/MaintenanceManager").then(m => ({ default: m.MaintenanceManager })));
const OccurrenceManager = lazy(() => import("./components/OccurrenceManager").then(m => ({ default: m.OccurrenceManager })));
const AdminUsers = lazy(() => import("./components/AdminUsers").then(m => ({ default: m.AdminUsers })));
const ReservationManager = lazy(() => import("./components/ReservationManager").then(m => ({ default: m.ReservationManager })));

type View = "dashboard" | "expenses" | "income" | "notifications" | "transparency" | "portal" | "maintenance" | "occurrences" | "admin-users" | "reservations";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#0f172a] text-slate-400">Carregando...</div>;

  if (!user) {
    return <ToastProvider><Login onLogin={(u) => setUser(u)} /></ToastProvider>;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#0f172a] text-slate-100 font-sans">
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
          pendingCount={pendingCount}
        />

        <div className="flex-1 flex flex-col min-w-0">
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
            <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400">Carregando...</div>}>
              <div className="max-w-7xl mx-auto space-y-8">
                {view === "dashboard" && <Dashboard user={user} />}
                {view === "expenses" && <ExpenseManager user={user} />}
                {view === "income" && <IncomeManager user={user} />}
                {view === "notifications" && <NotificationFeed user={user} />}
                {view === "transparency" && <TransparencyReport user={user} />}
                {view === "portal" && <ResidentPortal user={user} onProfileUpdate={(u) => setUser(u)} />}
                {view === "maintenance" && <MaintenanceManager user={user} />}
                {view === "occurrences" && <OccurrenceManager user={user} />}
                {view === "admin-users" && <AdminUsers onPendingCount={setPendingCount} />}
                {view === "reservations" && <ReservationManager user={user} />}
              </div>
            </Suspense>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
