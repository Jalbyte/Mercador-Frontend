"use client";

export const dynamic = 'force-dynamic'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiArrowLeft } from "react-icons/fi";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { FormInput } from "@/components/auth/FormInput";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Password reset email sent to:", email);
      setIsEmailSent(true);

      // Redirect to verify code page after 2 seconds
      setTimeout(() => {
        router.push(`/verify-code?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("No pudimos enviar el código. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <AuthLayout>
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          <AuthHeader
            title="¡Código Enviado!"
            subtitle="Revisa tu bandeja de entrada"
            icon={<FiMail size={32} />}
          />

          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <FiMail size={32} className="text-green-600" />
              </div>
              <p className="text-gray-600 mb-2">
                Hemos enviado un código de verificación a:
              </p>
              <p className="font-semibold text-gray-900">{email}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Si no ves el email en unos minutos, revisa tu carpeta de spam o
                promociones.
              </p>
            </div>

            <p className="text-sm text-gray-500">
              Serás redirigido automáticamente...
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
        <AuthHeader
          title="Recuperar Contraseña"
          subtitle="Ingresa tu email para recibir el código de verificación"
          icon={<FiMail size={32} />}
          onBack={() => router.push("/login")}
        />

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Enviando..." : "Enviar Código"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center gap-1"
            >
              <FiArrowLeft size={16} />
              Volver al inicio de sesión
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
