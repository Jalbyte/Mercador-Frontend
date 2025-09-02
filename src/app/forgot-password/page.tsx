"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiArrowLeft, FiCheck } from "react-icons/fi";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { FormInput } from "@/components/auth/FormInput";

function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Password reset email sent to:", email);
      setIsEmailSent(true);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("No pudimos enviar el código. Inténtalo de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <FiCheck className="text-green-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">¡Correo enviado!</h2>
        <p className="text-gray-600 mb-6">
          Hemos enviado un correo a{" "}
          <span className="font-semibold">{email}</span> con las instrucciones
          para restablecer tu contraseña.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Si no ves el correo en tu bandeja de entrada, revisa tu carpeta de
            spam o correo no deseado.
          </p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8">
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">
          Ingresa tu correo electrónico y te enviaremos un enlace para
          restablecer tu contraseña.
        </p>

        <FormInput
          label="Correo Electrónico"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<FiMail size={18} />}
          placeholder="tu@email.com"
          required
        />

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center gap-1 mx-auto"
        >
          <FiArrowLeft size={16} />
          Volver al inicio de sesión
        </button>
      </div>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        <AuthHeader
          title="Recuperar Contraseña"
          subtitle="Te ayudaremos a recuperar el acceso a tu cuenta"
          icon={<FiMail size={32} />}
          onBack={() => window.history.back()}
        />
        <ForgotPasswordForm />
      </div>
    </AuthLayout>
  );
}
