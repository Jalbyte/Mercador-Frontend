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
 * - Diseño responsive con max-width
 */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative animate-fade-in">
        {title && <h2 className="text-lg font-semibold mb-2 text-center">{title}</h2>}
        <div className="mb-4 text-center">{children}</div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
};
