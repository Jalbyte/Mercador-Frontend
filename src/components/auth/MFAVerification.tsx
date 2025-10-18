/**
 * Componente para verificar código TOTP durante el login
 * Se muestra cuando el usuario tiene MFA activado
 */

import React, { useState, useRef, useEffect } from "react";
import { FiLock, FiLoader, FiArrowLeft } from "react-icons/fi";

interface MFAVerificationProps {
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}

export function MFAVerification({
  onVerify,
  onCancel,
  loading = false,
  error,
}: MFAVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Focus en el primer input al montar
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleChange = (index: number, value: string) => {
    setLocalError("");

    // Solo permitir dígitos
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Mover al siguiente input si se ingresó un dígito
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit cuando se completan los 6 dígitos
    if (newCode.every((digit) => digit !== "")) {
      handleSubmit(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Retroceder al input anterior con Backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Mover con flechas
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    // Validar que sean 6 dígitos
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setCode(digits);
      inputRefs.current[5]?.focus();

      // Auto-submit
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (codeToSubmit: string) => {
    if (isSubmitting) return;

    const finalCode = codeToSubmit || code.join("");
    if (finalCode.length !== 6) {
      setLocalError("Por favor ingresa los 6 dígitos");
      return;
    }

    setIsSubmitting(true);
    setLocalError("");

    try {
      await onVerify(finalCode);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Código inválido"
      );
      // Limpiar el código en caso de error
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(code.join(""));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FiLock className="text-blue-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verificación en dos pasos
          </h2>
          <p className="text-gray-600">
            Ingresa el código de 6 dígitos de tu aplicación autenticadora
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleManualSubmit}>
          {/* Code inputs */}
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isSubmitting || loading}
                className={`w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg transition-colors
                  ${
                    localError
                      ? "border-red-500 focus:border-red-600"
                      : "border-gray-300 focus:border-blue-500"
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-200
                  disabled:bg-gray-100 disabled:cursor-not-allowed`}
              />
            ))}
          </div>

          {/* Error message */}
          {localError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{localError}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || loading || code.some((d) => !d)}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg
              transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {isSubmitting || loading ? (
              <>
                <FiLoader className="animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar"
            )}
          </button> 
        </form>
      </div>
    </div>
  );
}
