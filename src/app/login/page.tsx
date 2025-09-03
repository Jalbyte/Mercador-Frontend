"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiShoppingCart } from "react-icons/fi";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Call the login function from AuthContext
        await login(data.email, data.password);
        // The AuthContext will handle the redirection after successful login
      } else {
        // For registration, you would typically make an API call to your backend
        // and then log the user in automatically after successful registration
        // For now, we'll just log in the user with the provided credentials
        await login(data.email, data.password);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(
        err instanceof Error ? err.message : "Ocurrió un error durante la autenticación. Por favor, inténtalo de nuevo."
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
