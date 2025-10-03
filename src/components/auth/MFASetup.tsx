/**
 * Componente para configurar MFA por primera vez
 * Muestra el QR code y permite verificar el código TOTP
 */

import React, { useState, useEffect } from "react";
import { FiShield, FiCopy, FiCheck, FiX, FiLoader } from "react-icons/fi";
import { useMFA } from "./MFAProvider";

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const { startEnrollment, verifyEnrollment, cancelEnrollment, enrollData } =
    useMFA();

  const [step, setStep] = useState<"loading" | "qr" | "verify">("loading");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    initEnrollment();
  }, []);

  const initEnrollment = async () => {
    try {
      setStep("loading");
      await startEnrollment();
      setStep("qr");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al iniciar configuración"
      );
    }
  };

  const handleCopySecret = () => {
    if (enrollData?.secret) {
      navigator.clipboard.writeText(enrollData.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData || code.length !== 6) return;

    setIsVerifying(true);
    setError("");

    try {
      await verifyEnrollment(enrollData.factorId, code);
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido");
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    cancelEnrollment();
    onCancel?.();
  };

  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <FiLoader className="animate-spin text-4xl text-blue-500 mb-4" />
        <p className="text-gray-600">Generando código QR...</p>
      </div>
    );
  }

  if (!enrollData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error al cargar la configuración MFA</p>
        <button
          onClick={initEnrollment}
          className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <FiShield className="text-green-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Configurar autenticación en dos pasos
          </h2>
          <p className="text-gray-600">
            Protege tu cuenta con una capa adicional de seguridad
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Scan QR Code */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">
              Paso 1: Escanea el código QR
            </h3>
            <p className="text-gray-600 mb-4">
              Usa una aplicación autenticadora como Google Authenticator, Authy
              o Microsoft Authenticator para escanear este código:
            </p>

            <div className="flex flex-col items-center">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                {enrollData.qrCode ? (
                  <img
                    src={enrollData.qrCode}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">QR no disponible</span>
                  </div>
                )}
              </div>

              {/* Manual entry option */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  ¿No puedes escanear el código?
                </p>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border">
                  <code className="text-sm font-mono text-gray-800 flex-1">
                    {enrollData.secret}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Copiar código"
                  >
                    {secretCopied ? (
                      <FiCheck className="text-green-600" />
                    ) : (
                      <FiCopy className="text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Ingresa este código manualmente en tu aplicación
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Verify Code */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">
              Paso 2: Verifica el código
            </h3>
            <p className="text-gray-600 mb-4">
              Ingresa el código de 6 dígitos que muestra tu aplicación
              autenticadora:
            </p>

            <form onSubmit={handleVerify}>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setCode(value);
                      setError("");
                    }}
                    placeholder="000000"
                    disabled={isVerifying}
                    className={`w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 rounded-lg
                      ${
                        error
                          ? "border-red-500 focus:border-red-600"
                          : "border-gray-300 focus:border-blue-500"
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-200
                      disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  />
                  {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={code.length !== 6 || isVerifying}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg
                    transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed
                    flex items-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              💡 Consejo de seguridad
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Guarda códigos de respaldo en un lugar seguro por si pierdes
                acceso a tu aplicación
              </li>
              <li>
                • Nunca compartas tus códigos de autenticación con nadie
              </li>
              <li>
                • Asegúrate de tener tu dispositivo cerca cuando inicies sesión
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isVerifying}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              <FiX />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
