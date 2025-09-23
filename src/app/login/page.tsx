"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { useRouter, useSearchParams } from "next/navigation";
import { FiUser, FiShoppingCart, FiLoader } from "react-icons/fi";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const formRef = useRef<any>(null);

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
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ??
        (typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:3010`
          : "");

      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const body = isLogin
        ? {
            email: formData.email,
            password: formData.password,
            ...(formData.rememberMe !== undefined && {
              rememberMe: formData.rememberMe,
            }),
          }
        : {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            country: formData.country,
          };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Error en la autenticación");
      }

      if (isLogin) {
        // Guardar el email en localStorage para recordarlo si rememberMe está activado
        if (formData.rememberMe) {
          localStorage.setItem("last-login-email", formData.email);
        } else {
          localStorage.removeItem("last-login-email");
        }

        // Actualizar el estado de autenticación
        window.dispatchEvent(new CustomEvent("auth-changed"));

        // Redirigir al dashboard después de iniciar sesión exitosamente
        router.push("/");
      } else {
        // Registro exitoso: mostrar mensaje de verificación de email
        setInfo(`Se ha enviado un correo de verificación a ${formData.email}. Por favor, revisa tu bandeja de entrada y sigue las instrucciones para activar tu cuenta.`);
        setShowModal(true);
        formRef.current?.resetForm();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error en la autenticación";
      setError(errorMessage);
      setShowModal(true);
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
        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL ??
          (typeof window !== "undefined"
            ? `${window.location.protocol}//${window.location.hostname}:3010`
            : "");

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

          // Refresh the auth state
          window.dispatchEvent(new CustomEvent("auth-changed"));

          // Redirect to dashboard or home
          router.push("/dashboard");
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

  const handleSocialLogin = async (provider: string) => {
    console.log(`Iniciando sesión con ${provider}`);
    // TODO: Implement social login logic
    // This would typically redirect to the provider's OAuth page
    // or use a library like next-auth
  };

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

  return (
    <AuthLayout>
      <AuthHeader
        title={isLogin ? "Iniciar sesión" : "Crear cuenta"}
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
      <AuthFooter
        isLogin={isLogin}
        onToggleMode={() => !isLoading && setIsLogin(!isLogin)}
      />
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setError("");
          setInfo("");
        }}
        title={error ? "Error" : "Información"}
      >
        <div className="text-center p-4">
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <FiLoader className="animate-spin text-3xl text-blue-500" />
              <p>Verificando tu sesión...</p>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
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
