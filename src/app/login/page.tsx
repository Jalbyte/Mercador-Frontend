"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { FiUser, FiShoppingCart } from "react-icons/fi";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Mostrar mensaje si viene de registro
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setInfo("Verifique su correo para activar la cuenta");
        setShowModal(true);
        // Limpiar el parámetro de la URL
        const url = new URL(window.location.href);
        url.searchParams.delete('registered');
        window.history.replaceState({}, document.title, url.pathname);
      }
    }
  }, []);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError("");

    try {
      // Call backend login for real
      const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3010` : '')

      if (isLogin) {
        const resp = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: data.email, password: data.password })
        });

        const json = await resp.json().catch(() => null);

        if (!resp.ok || !json) {
          const errObj = json?.error ?? json?.message ?? `Login failed: ${resp.status} ${resp.statusText}`;
          const errMsg = typeof errObj === 'string' ? errObj : (errObj?.message ?? JSON.stringify(errObj));
          setError(errMsg || 'Login failed');
          return;
        }

        // Notify other parts of the app that auth changed, then go to main page.
        try {
          window.dispatchEvent(new CustomEvent('auth-changed', { detail: { loggedIn: true } }));
        } catch (e) {
          // noop in non-browser env (shouldn't happen client-side)
        }
        router.push('/');
        return;
      } else {
        // registration: call signup endpoint, then redirect to login
        const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3010` : '')
        const resp = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password, full_name: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() })
        })
        const json = await resp.json().catch(() => null);
        if (!resp.ok || !json?.success) {
          const errObj = json?.error ?? json?.message ?? 'Registration failed';
          const errMsg = typeof errObj === 'string' ? errObj : (errObj?.message ?? JSON.stringify(errObj));
          setError(errMsg || 'Registration failed');
          return;
        }
        // After registration redirect to login with success query
        if (window.location.pathname === '/login') {
          window.location.href = '/login?registered=true';
        } else {
          router.push('/login?registered=true');
        }
        return
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

  return (
    <AuthLayout>
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
        <AuthHeader
          title={isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          subtitle={
            isLogin
              ? "Accede a las mejores licencias de software"
              : "Únete a miles de usuarios satisfechos"
          }
          icon={isLogin ? <FiUser size={32} /> : <FiShoppingCart size={32} />}
          onBack={() => router.push("/")}
        />


        <AuthForm
          isLogin={isLogin}
          onSubmit={handleSubmit}
          onSocialLogin={handleSocialLogin}
          onToggleMode={() => {
            setError("");
            setInfo("");
            setIsLogin(!isLogin);
          }}
          loading={isLoading}
          error={error}
        />

        <Modal open={showModal} onClose={() => setShowModal(false)} title="¡Cuenta creada!">
          <div className="text-blue-700">
            {info}
          </div>
        </Modal>

        <div className="px-8 pb-8">
          <AuthFooter
            isLogin={isLogin}
            onToggleMode={() => {
              setError("");
              setIsLogin(!isLogin);
            }}
          />
        </div>
      </div>
    </AuthLayout>
  );
}
