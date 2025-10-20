"use client";

import { useState } from "react";
import { FiX, FiLock, FiLoader } from "react-icons/fi";
import { FormInput } from "./FormInput";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validaciones
    if (!formData.newPassword.trim()) {
      setError("La nueva contraseña es requerida");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    // Validar que contenga mayúscula, minúscula y carácter especial
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/;
    if (!passwordRegex.test(formData.newPassword)) {
      setError(
        "La contraseña debe contener al menos una mayúscula, una minúscula y un carácter especial"
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/password/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          newPassword: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            "Error al cambiar la contraseña"
        );
      }

      const data = await response.json();
      setSuccess("Contraseña actualizada correctamente");
      
      // Limpiar formulario
      setFormData({
        newPassword: "",
        confirmPassword: "",
      });

      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cambiar la contraseña"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Limpiar formulario al cerrar
    setFormData({
      newPassword: "",
      confirmPassword: "",
    });
    setError("");
    setSuccess("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <FiLock className="text-blue-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Cambiar Contraseña
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar"
            >
              <FiX size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nueva Contraseña */}
            <FormInput
              label="Nueva Contraseña"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange}
              icon={<FiLock size={18} />}
              placeholder="Tu nueva contraseña"
              disabled={isLoading}
              required
            />

            {/* Confirmar Contraseña */}
            <FormInput
              label="Confirmar Contraseña"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              icon={<FiLock size={18} />}
              placeholder="Confirma tu nueva contraseña"
              disabled={isLoading}
              required
            />

            {/* Requisitos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-900 mb-2">
                La contraseña debe:
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Tener al menos 8 caracteres</li>
                <li>• Contener mayúsculas (A-Z)</li>
                <li>• Contener minúsculas (a-z)</li>
                <li>• Contener un carácter especial (!@#$%^&*)</li>
              </ul>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-100 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="rounded-lg bg-green-100 border border-green-200 p-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="animate-spin h-4 w-4" />
                    Actualizando...
                  </>
                ) : (
                  "Cambiar Contraseña"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
