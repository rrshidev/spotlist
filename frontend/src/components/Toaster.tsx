'use client';

import { useToast } from '@/contexts/ToastContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px]
            animate-in slide-in-from-right duration-300
            ${toast.type === 'success' ? 'bg-green-900/80 border border-green-500/50' : ''}
            ${toast.type === 'error' ? 'bg-red-900/80 border border-red-500/50' : ''}
            ${toast.type === 'info' ? 'bg-blue-900/80 border border-blue-500/50' : ''}
          `}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          <span className="flex-1 text-sm">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}