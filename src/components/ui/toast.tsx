"use client";

import { useEffect } from "react";
import { X, CheckCircle } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-20 right-4 z-[100] animate-[slideInRight_0.3s_ease-out]">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 flex items-center gap-3 min-w-[300px] max-w-md">
        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
        <p className="text-sm text-gray-700 flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
