import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

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
