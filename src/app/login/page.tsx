"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { useRouter, useSearchParams } from "next/navigation";
import { FiUser, FiLoader, FiLock, FiArrowLeft } from "react-icons/fi";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { useAuth } from "@/components/auth/AuthProvider";
import { MFAVerification } from "@/components/auth/MFAVerification";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading, mfaRequired, verifyMFA, cancelMFA } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreCallback, setRestoreCallback] = useState<null | (() => Promise<void>)>(null);
  const formRef = useRef<any>(null);

  // Redirect if already authenticated
  // El CartProvider se encargará automáticamente de sincronizar el carrito
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleFormSubmit = async (formData: {
    email: string;
    password: string;
    full_name?: string;
    country?: string;
    rememberMe?: boolean;
  }) => {
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Use AuthProvider login - handles MFA automatically
        await login(
          formData.email,
          formData.password,
          formData.rememberMe,
          {
            onAccountDeleted: (restoreFn: () => Promise<void>) => {
              setRestoreCallback(() => restoreFn);
              setShowRestoreModal(true);
            },
          }
        );
        // If no MFA required, redirect will happen automatically
        // If MFA required, mfaRequired state will be set in AuthProvider
      } else {
        // Registration logic
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            country: formData.country,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || result.message || "Error en el registro"
          );
        }

        // Registration successful
        setInfo(
          `Se ha enviado un correo de verificación a ${formData.email}. Por favor, revisa tu bandeja de entrada y sigue las instrucciones para activar tu cuenta.`
        );
        setShowModal(true);
        formRef.current?.resetForm();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error en la autenticación";
      setError(errorMessage);
      // No mostrar modal para errores de login, solo usar el mensaje inline
    } finally {
      setIsLoading(false);
    }
  };

  // Handle magic link verification and other URL parameters
  useEffect(() => {
    const verifyMagicLink = async () => {
      const token = searchParams?.get("token");
      if (!token) return;

      setIsVerifying(true);
      setInfo("Verificando enlace mágico...");
      setShowModal(true);

      try {
        const response = await fetch(`${API_BASE}/auth/verify-magiclink`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          // Clear the token from URL
          const url = new URL(window.location.href);
          url.searchParams.delete("token");
          window.history.replaceState({}, document.title, url.pathname);

          // Trigger auth refresh
          window.dispatchEvent(new CustomEvent("auth-changed"));

          // Redirect to home
          router.push("/");
        } else {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || "Error al verificar el enlace");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al verificar el enlace mágico"
        );
        setShowModal(true);
      } finally {
        setIsVerifying(false);
      }
    };

    // Handle other URL parameters
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      if (params.get("registered") === "true") {
        setInfo("Verifique su correo para activar la cuenta");
        setShowModal(true);
      } else if (params.get("message") === "password-reset-success") {
        setInfo(
          "Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión."
        );
        setShowModal(true);
      } else if (params.get("token")) {
        verifyMagicLink();
        return;
      }

      // Clean up URL parameters
      const url = new URL(window.location.href);
      let shouldUpdate = false;

      if (params.has("registered")) {
        url.searchParams.delete("registered");
        shouldUpdate = true;
      }
      if (params.has("message")) {
        url.searchParams.delete("message");
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        window.history.replaceState({}, document.title, url.toString());
      }
    }
  }, [searchParams, router]);

  const getModalTitle = () => {
    if (info.includes("actualizada correctamente")) {
      return "¡Contraseña Actualizada!";
    }
    if (info.includes("correo de verificación")) {
      return "¡Correo Enviado!";
    }
    return "¡Cuenta creada!";
  };

  const getModalIcon = () => {
    if (info.includes("actualizada correctamente")) {
      return "🔐";
    }
    if (info.includes("correo de verificación")) {
      return "📧";
    }
    return "✅";
  };

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin text-3xl text-blue-500" />
      </div>
    );
  }

  // Don't render if already authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin text-3xl text-blue-500" />
      </div>
    );
  }



  return (
    <AuthLayout>
      <AuthHeader
        title={isLogin ? "Inicio de sesión" : "Crea tu cuenta"}
        subtitle={
          isLogin
            ? "Ingresa a tu cuenta para continuar"
            : "Crea una cuenta para comenzar"
        }
        icon={<FiUser size={32} />}
      />
      <AuthForm
        ref={formRef}
        isLogin={isLogin}
        onSubmit={handleFormSubmit}
        onToggleMode={() => !isLoading && setIsLogin(!isLogin)}
        loading={isLoading}
        error={error}
      />
      {/* Modal para restaurar cuenta eliminada */}
      <Modal
        open={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setRestoreCallback(null);
        }}
        title="Restaurar cuenta eliminada"
      >
        <div className="p-6 text-center">
          <p className="mb-4 text-gray-700">
            Tu cuenta fue eliminada previamente. Si continúas, tu cuenta y todos tus datos serán restaurados bajo las condiciones de uso actuales.
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={async () => {
                setShowRestoreModal(false);
                setIsLoading(true);
                setError("");
                try {
                  if (restoreCallback) {
                    await restoreCallback();
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Error al restaurar la cuenta");
                } finally {
                  setIsLoading(false);
                  setRestoreCallback(null);
                }
              }}
            >
              Restaurar y continuar
            </button>
            <button
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowRestoreModal(false);
                setRestoreCallback(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
      <AuthFooter
        isLogin={isLogin}
        onToggleMode={() => !isLoading && setIsLogin(!isLogin)}
      />
      {/* Modal de Verificación MFA */}
      <Modal
        open={!!mfaRequired}
        onClose={() => {
          cancelMFA();
          setError("");
        }}
        title="Verificación de Seguridad"
      >
        <div className="p-6">
          {mfaRequired && (
            <MFAVerification
              onVerify={async (code) => {
                setIsLoading(true);
                try {
                  await verifyMFA(code);
                  // El redirect se maneja automáticamente en AuthProvider
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Código inválido");
                } finally {
                  setIsLoading(false);
                }
              }}
              onCancel={() => {
                cancelMFA();
                setError("");
              }}
              loading={isLoading}
              error={error}
            />
          )}

          {error && (
            <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                cancelMFA();
                setError("");
              }}
              className="w-full text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <FiArrowLeft size={16} />
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal solo para mensajes informativos y verificación */}
      <Modal
        open={showModal && (!!info || isVerifying)}
        onClose={() => {
          setShowModal(false);
          setError("");
          setInfo("");
        }}
        title="Información"
      >
        <div className="text-center p-4">
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <FiLoader className="animate-spin text-3xl text-blue-500" />
              <p>Verificando tu sesión...</p>
            </div>
          ) : (
            <p className="text-green-600">{info}</p>
          )}
        </div>
      </Modal>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <FiLoader className="animate-spin text-3xl text-blue-500" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
