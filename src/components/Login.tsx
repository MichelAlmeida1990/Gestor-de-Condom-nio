import { useState, FormEvent } from "react";
import { api } from "../lib/api";
import { User } from "../types";
import { Building2, Lock, User as UserIcon } from "lucide-react";

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.login({ email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError("Credenciais inválidas. Tente admin@condo.com ou morador@condo.com");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 overflow-hidden relative">
      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-white/5 backdrop-blur-2xl p-10 rounded-[32px] border border-white/10 shadow-2xl relative z-10">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-600/20">
            <Building2 size={32} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">CondoTrust</h2>
          <p className="mt-3 text-sm text-slate-400 font-medium">Gestão transparente e moderna</p>
        </div>
        
        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Email Corporativo</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <UserIcon size={18} />
                </span>
                <input
                  type="email"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white transition-all placeholder-slate-600"
                  placeholder="seu-email@condo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Senha de Acesso</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white transition-all placeholder-slate-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-rose-400 text-xs text-center font-bold bg-rose-500/10 py-3 rounded-xl border border-rose-500/20 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? "INICIANDO SESSÃO..." : "ACESSAR CONDOMÍNIO"}
          </button>

          <div className="text-center pt-6 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Modo de Demonstração:</p>
            <div className="flex justify-center space-x-4">
              <span className="text-[10px] text-slate-400 font-mono">admin@condo.com / ChangeMe123!</span>
              <span className="text-[10px] text-slate-400 font-mono">morador@condo.com / ChangeMe123!</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
