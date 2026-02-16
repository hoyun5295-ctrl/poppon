'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';

export function Toast() {
  const { toast, hideToast } = useAuth();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.visible) {
      setIsExiting(false);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => hideToast(), 250);
      }, 2700);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, toast.message, hideToast]);

  if (!toast.visible) return null;

  const config = {
    success: {
      icon: <CheckCircle2 className="w-[18px] h-[18px]" />,
      bg: 'bg-surface-900',
      text: 'text-white',
      iconColor: 'text-emerald-400',
    },
    error: {
      icon: <XCircle className="w-[18px] h-[18px]" />,
      bg: 'bg-surface-900',
      text: 'text-white',
      iconColor: 'text-red-400',
    },
    info: {
      icon: <Info className="w-[18px] h-[18px]" />,
      bg: 'bg-surface-900',
      text: 'text-white',
      iconColor: 'text-blue-400',
    },
  }[toast.type];

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex justify-center pointer-events-none pt-safe">
      <div
        className={`
          pointer-events-auto mt-4 mx-4 flex items-center gap-2.5 px-4 py-3 rounded-xl
          ${config.bg} shadow-[0_8px_30px_rgba(0,0,0,0.16)]
          ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}
        `}
      >
        <span className={config.iconColor}>{config.icon}</span>
        <span className={`text-sm font-medium ${config.text} leading-tight`}>
          {toast.message}
        </span>
        <button
          onClick={() => { setIsExiting(true); setTimeout(() => hideToast(), 250); }}
          className="ml-1 p-0.5 rounded-md text-white/50 hover:text-white/80 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
