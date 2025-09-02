"use client";

import { useState } from "react";
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

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isLogin) {
        console.log("Login attempt with:", { email: data.email });
        // TODO: Implement actual login logic
        // router.push('/dashboard');
      } else {
        console.log("Register attempt with:", data);
        // TODO: Implement actual registration logic
        // After successful registration, you might want to log the user in automatically
        // or redirect to login page with a success message
        // router.push('/login?registered=true');
      }

      // Show success message or redirect
      alert(`¡${isLogin ? "Inicio de sesión" : "Registro"} exitoso!`);
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
            setIsLogin(!isLogin);
          }}
          loading={isLoading}
          error={error}
        />

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
