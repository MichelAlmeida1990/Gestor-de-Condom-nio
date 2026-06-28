import { useState, FormEvent } from "react";
import { api } from "../lib/api";
import { User } from "../types";
import { Building2, Lock, User as UserIcon, Phone, Home } from "lucide-react";

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.login({ email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await api.register({ email, password, name, unit, phone });
      setSuccess(data.message);
      setEmail(""); setPassword(""); setName(""); setUnit(""); setPhone("");
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 overflow-hidden relative">
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

        {/* Mode toggle */}
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${ mode === "login" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white" }`}>
            Entrar
          </button>
          <button onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${ mode === "register" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white" }`}>
            Cadastrar-se
          </button>
        </div>

        {mode === "login" ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors"><UserIcon size={18} /></span>
              <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600" />
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors"><Lock size={18} /></span>
              <input type="password" required placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600" />
            </div>
            {error && <div className="text-rose-400 text-xs text-center font-bold bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50">
              {loading ? "ENTRANDO..." : "ACESSAR"}
            </button>
            <div className="text-center pt-2 space-y-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Acesse com suas credenciais de conta configurada.</p>
            </div>

          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors"><UserIcon size={18} /></span>
              <input type="text" required placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600" />
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors"><UserIcon size={18} /></span>
              <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600" />
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors"><Lock size={18} /></span>
              <input type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600" />
            </div>
            <div className="flex space-x-3">
              <div className="relative group flex-1">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors"><Home size={18} /></span>
                <input type="text" placeholder="Apartamento" value={unit} onChange={(e) => setUnit(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600" />
              </div>
              <div className="relative group flex-1">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors"><Phone size={18} /></span>
                <input type="tel" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600" />
              </div>
            </div>
            {error && <div className="text-rose-400 text-xs text-center font-bold bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">{error}</div>}
            {success && <div className="text-emerald-400 text-xs text-center font-bold bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20">{success}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50">
              {loading ? "CADASTRANDO..." : "SOLICITAR CADASTRO"}
            </button>
            <p className="text-center text-xs text-slate-500">Seu cadastro será analisado pelo síndico.</p>
          </form>
        )}
      </div>
    </div>
  );
}
