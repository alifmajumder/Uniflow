import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[110] flex flex-col items-center gap-2 pointer-events-none px-4 pt-4 sm:items-end sm:p-6">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className="pointer-events-auto w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border border-primary-500/30 text-slate-100 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 fade-in duration-300 flex gap-4"
          role="alert"
        >
          <div className="p-3 bg-primary-500/20 text-primary-400 rounded-xl h-fit flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 py-1">
            <h4 className="font-bold text-sm text-white mb-1">{toast.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{toast.message}</p>
          </div>
          <button 
            onClick={() => onDismiss(toast.id)}
            className="text-slate-500 hover:text-white transition-colors h-fit p-1 -mr-2 -mt-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};