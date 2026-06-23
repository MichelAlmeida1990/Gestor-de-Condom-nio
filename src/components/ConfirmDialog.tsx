import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  title?: string;
}

export function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = "Excluir", title = "Confirmar ação" }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-xl p-4">
      <div className="bg-[#1e293b] w-full max-w-sm rounded-[24px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 p-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl">
              <AlertTriangle size={20} className="text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-sm font-bold text-slate-400 border border-white/10 rounded-xl hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-500 transition-all">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
