import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

let toastIdCounter = 0;
const listeners = new Set<(toasts: ToastMessage[]) => void>();
let currentToasts: ToastMessage[] = [];

export function showToast(type: ToastType, message: string, duration = 4000) {
  const id = `toast-${toastIdCounter++}`;
  currentToasts = [...currentToasts, { id, type, message }];
  listeners.forEach((l) => l(currentToasts));
  setTimeout(() => dismissToast(id), duration);
}

export function dismissToast(id: string) {
  currentToasts = currentToasts.filter((t) => t.id !== id);
  listeners.forEach((l) => l(currentToasts));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const config = {
    success: { icon: CheckCircle2, color: 'text-success-600', bg: 'bg-success-50', border: 'border-success-200' },
    error: { icon: AlertCircle, color: 'text-danger-600', bg: 'bg-danger-50', border: 'border-danger-200' },
    info: { icon: Info, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-200' },
    warning: { icon: AlertTriangle, color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-200' },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 rounded-xl border ${config.border} ${config.bg} p-3.5 shadow-card-hover animate-slide-in`}>
      <Icon className={`h-5 w-5 shrink-0 ${config.color}`} />
      <p className="flex-1 text-sm text-ink-700">{toast.message}</p>
      <button onClick={onDismiss} className="shrink-0 text-ink-400 hover:text-ink-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
