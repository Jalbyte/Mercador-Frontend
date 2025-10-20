"use client";

import { Button } from "@/components/ui/button";

interface CartMergeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onKeepLocal: () => void;
  onLoadBackend: () => void;
  localItemCount: number;
  backendItemCount: number;
}

/**
 * Diálogo que aparece cuando un usuario inicia sesión con un carrito local existente
 * y también tiene un carrito guardado en el backend.
 * 
 * Permite al usuario elegir entre:
 * - Mantener el carrito local (sobrescribe el backend)
 * - Cargar el carrito del backend (descarta el local)
 */
export function CartMergeDialog({
  isOpen,
  onClose,
  onKeepLocal,
  onLoadBackend,
  localItemCount,
  backendItemCount,
}: CartMergeDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ¿Qué carrito quieres usar?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tienes un carrito local con <strong>{localItemCount} producto{localItemCount !== 1 ? 's' : ''}</strong> y
              un carrito guardado con <strong>{backendItemCount} producto{backendItemCount !== 1 ? 's' : ''}</strong>.
              <br /><br />
              ¿Cuál te gustaría usar?
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={onKeepLocal}
              variant="default"
              className="w-full"
            >
              Mantener carrito actual ({localItemCount} producto{localItemCount !== 1 ? 's' : ''})
            </Button>
            <Button
              onClick={onLoadBackend}
              variant="outline"
              className="w-full"
            >
              Cargar carrito guardado ({backendItemCount} producto{backendItemCount !== 1 ? 's' : ''})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
