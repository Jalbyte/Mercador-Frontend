"use client";

import React, { Suspense, useState, useEffect } from "react";
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

  // Handle magic link verification and other URL parameters
  useEffect(() => {
    const verifyMagicLink = async () => {
      const token = searchParams.get('token');
      if (!token) return;

      setIsVerifying(true);
      setInfo("Verificando enlace mágico...");
      setShowModal(true);

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL ??
          (typeof window !== "undefined"
            ? `${window.location.protocol}//${window.location.hostname}:3010`
            : "");

        const response = await fetch(`${API_BASE}/auth/verify-magiclink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          // Clear the token from URL
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          window.history.replaceState({}, document.title, url.pathname);
          
          // Refresh the auth state
          window.dispatchEvent(new CustomEvent("auth-changed"));
          
          // Redirect to dashboard or home
          router.push('/dashboard');
        } else {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || 'Error al verificar el enlace');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al verificar el enlace mágico');
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

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError("");

    // Guardar email para autocompletado futuro
    if (data.email && typeof window !== "undefined") {
      localStorage.setItem("last-login-email", data.email);
    }

    try {
      // Call backend login for real
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ??
        (typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:3010`
          : "");

      if (isLogin) {
        const resp = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: data.email, password: data.password }),
        });

        const json = await resp.json().catch(() => null);

        if (!resp.ok || !json) {
          const errObj =
            json?.error ??
            json?.message ??
            `Login failed: ${resp.status} ${resp.statusText}`;
          const errMsg =
            typeof errObj === "string"
              ? errObj
              : errObj?.message ?? JSON.stringify(errObj);
          setError(errMsg || "Login failed");
          return;
        }

        // Notify other parts of the app that auth changed, then go to main page.
        try {
          window.dispatchEvent(
            new CustomEvent("auth-changed", { detail: { loggedIn: true } })
          );
        } catch (e) {
          // noop in non-browser env (shouldn't happen client-side)
        }
        router.push("/");
        return;
      } else {
        // registration: call signup endpoint, then redirect to login
        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL ??
          (typeof window !== "undefined"
            ? `${window.location.protocol}//${window.location.hostname}:3010`
            : "");
        const resp = await fetch(`${API_BASE}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            full_name: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
          }),
        });
        const json = await resp.json().catch(() => null);
        if (!resp.ok || !json?.success) {
          const errObj = json?.error ?? json?.message ?? "Registration failed";
          const errMsg =
            typeof errObj === "string"
              ? errObj
              : errObj?.message ?? JSON.stringify(errObj);
          setError(errMsg || "Registration failed");
          return;
        }
        // After registration redirect to login with success query
        if (window.location.pathname === "/login") {
          window.location.href = "/login?registered=true";
        } else {
          router.push("/login?registered=true");
        }
        return;
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(
        "Ocurrió un error durante la autenticación. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
    return "¡Cuenta creada!";
  };

  const getModalIcon = () => {
    if (info.includes("actualizada correctamente")) {
      return "🔐";
    }
    return "✅";
  };

  return (
    <AuthLayout>
      <AuthHeader 
        title={isLogin ? "Iniciar sesión" : "Crear cuenta"}
        subtitle={isLogin ? "Ingresa a tu cuenta para continuar" : "Crea una cuenta para comenzar"}
        icon={<FiUser size={32} />}
      />
      <AuthForm
        isLogin={isLogin}
        onSubmit={async (data) => {
          // Handle form submission here
          console.log('Form submitted:', data);
        }}
        onToggleMode={() => setIsLogin(!isLogin)}
        error={error}
      />
      <AuthFooter 
        isLogin={isLogin} 
        onToggleMode={() => setIsLogin(!isLogin)} 
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin text-3xl text-blue-500" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
