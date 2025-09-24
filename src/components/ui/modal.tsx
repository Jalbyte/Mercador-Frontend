import React from "react";

/**
 * Props del componente Modal.
 *
 * @interface ModalProps
 * @property {boolean} open - Controla si el modal está visible
 * @property {() => void} onClose - Función para cerrar el modal
 * @property {string} [title] - Título opcional del modal
 * @property {React.ReactNode} children - Contenido del modal
 */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Componente Modal - Ventana emergente para contenido superpuesto.
 *
 * Este componente implementa un modal básico con:
 * - Overlay oscuro para enfoque
 * - Posicionamiento centrado en pantalla
 * - Animación de entrada
 * - Botón de cierre accesible
 * - Título opcional
 * - Contenido personalizado
 * - Diseño responsive mejorado
 *
 * @component
 * @param {ModalProps} props - Props del componente
 * @returns {JSX.Element | null} Elemento JSX del modal o null si no está abierto
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * return (
 *   <>
 *     <Button onClick={() => setIsOpen(true)}>
 *       Abrir Modal
 *     </Button>
 *
 *     <Modal
 *       open={isOpen}
 *       onClose={() => setIsOpen(false)}
 *       title="Confirmar acción"
 *     >
 *       <p>¿Estás seguro de que quieres continuar?</p>
 *       <div className="flex gap-2 justify-center mt-4">
 *         <Button variant="outline" onClick={() => setIsOpen(false)}>
 *           Cancelar
 *         </Button>
 *         <Button onClick={handleConfirm}>
 *           Confirmar
 *         </Button>
 *       </div>
 *     </Modal>
 *   </>
 * );
 * ```
 *
 * @remarks
 * - El modal se renderiza condicionalmente basado en la prop `open`
 * - Incluye overlay con opacidad para enfocar la atención
 * - Posicionamiento fijo con z-index alto para superponer contenido
 * - Botón de cierre accesible con aria-label
 * - Animación sutil de entrada
 * - Diseño responsive con breakpoints móviles
 * - Ancho máximo aumentado para mejor experiencia
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] relative animate-fade-in overflow-hidden">
        {/* Header del modal */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-700"
              aria-label="Cerrar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Contenido del modal */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>

        {/* Botón de cierre alternativo si no hay título */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700 z-10"
            aria-label="Cerrar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
