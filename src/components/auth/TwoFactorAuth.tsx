"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { FiShield, FiCheck, FiX, FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

interface TwoFactorAuthProps {
  isEnabled: boolean;
  onStatusChange: (enabled: boolean) => void;
}

export const TwoFactorAuth = ({
  isEnabled,
  onStatusChange,
}: TwoFactorAuthProps) => {
  const [showModal, setShowModal] = useState(false);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"setup" | "verify" | "success">("setup");

  const handleEnable2FA = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/auth/2fa/enable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al generar el código QR");
      }

      const data = await response.json();

      // Esperamos que el backend retorne { success: true, data: { qr_code_uri: "otpauth://..." } }
      const uri = data?.data?.qr_code_uri || data?.qr_code_uri;

      if (!uri) {
        throw new Error("No se recibió la URI del código QR");
      }

      setQrUri(uri);
      setShowModal(true);
      setStep("setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al configurar 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/auth/2fa/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Código de verificación incorrecto");
      }

      setStep("success");
      onStatusChange(true);

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        setShowModal(false);
        resetModal();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al verificar el código"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (
      !confirm(
        "¿Estás seguro de que deseas desactivar la autenticación de dos factores?"
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/auth/2fa/disable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al desactivar 2FA");
      }

      onStatusChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desactivar 2FA");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setQrUri(null);
    setVerificationCode("");
    setError("");
    setStep("setup");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetModal();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-full ${
              isEnabled ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            <FiShield
              className={`h-5 w-5 ${
                isEnabled ? "text-green-600" : "text-gray-400"
              }`}
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              Autenticación de Dos Factores
            </h3>
            <p className="text-sm text-gray-500">
              {isEnabled
                ? "Tu cuenta está protegida con autenticación de dos factores"
                : "Agrega una capa extra de seguridad a tu cuenta"}
            </p>
            <div className="flex items-center mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isEnabled
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {isEnabled ? (
                  <>
                    <FiCheck className="h-3 w-3 mr-1" />
                    Activado
                  </>
                ) : (
                  <>
                    <FiX className="h-3 w-3 mr-1" />
                    Desactivado
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={isEnabled ? handleDisable2FA : handleEnable2FA}
          variant={isEnabled ? "destructive" : "default"}
          disabled={loading}
          size="sm"
        >
          {loading ? <FiLoader className="animate-spin h-4 w-4 mr-2" /> : null}
          {isEnabled ? "Desactivar" : "Configurar"}
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {/* Modal para configurar 2FA */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title="Configurar Autenticación de Dos Factores"
      >
        <div className="text-left">
          {step === "setup" && qrUri && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Escanea este código QR con tu app de autenticación (Google
                  Authenticator, Authy, etc.)
                </p>

                <div className="bg-white p-4 rounded-lg border inline-block">
                  <QRCode
                    value={qrUri}
                    size={200}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-wider"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500">
                  Ingresa el código de 6 dígitos que aparece en tu app de
                  autenticación
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleVerify2FA}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {loading ? (
                    <FiLoader className="animate-spin h-4 w-4 mr-2" />
                  ) : null}
                  Verificar y Activar
                </Button>
                <Button
                  onClick={handleCloseModal}
                  variant="outline"
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheck className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  ¡2FA Configurado!
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Tu cuenta ahora está protegida con autenticación de dos
                  factores
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
