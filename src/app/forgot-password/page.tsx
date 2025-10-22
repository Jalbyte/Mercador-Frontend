"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiArrowLeft, FiCheck, FiLoader } from "react-icons/fi";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { FormInput } from "@/components/auth/FormInput";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Error al enviar el correo de recuperación"
        );
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Forgot password error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No pudimos enviar el correo de recuperación. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          <AuthHeader
            title="Revisa tu correo"
            subtitle="Te hemos enviado un enlace de recuperación"
            icon={<FiCheck size={32} />}
          />

          <div className="p-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <FiCheck size={32} className="text-green-600" />
              </div>
              <p className="text-gray-600 mb-4">
                Hemos enviado un enlace de recuperación a{" "}
                <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Por favor, revisa tu bandeja de entrada y haz clic en el enlace
                para restablecer tu contraseña.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2 font-medium">
                💡 Consejos importantes:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                <li>El enlace expira en 1 hora por seguridad</li>
                <li>Revisa la carpeta de spam si no lo encuentras</li>
                <li>Solo funciona una vez</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/50 transition-all"
              >
                Volver al inicio de sesión
              </button>

              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                }}
                className="w-full text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <FiMail size={16} />
                Enviar a otro correo
              </button>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
        <AuthHeader
          title="Recupera tu contraseña"
          subtitle="Te enviaremos un enlace para restablecer tu contraseña"
          icon={<FiMail size={32} />}
        />

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-6">
              Ingresa tu correo electrónico y te enviaremos un enlace para que
              puedas restablecer tu contraseña.
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
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FiLoader className="animate-spin" size={18} />
                  Enviando...
                </>
              ) : (
                <>
                  <FiMail size={18} />
                  Enviar enlace de recuperación
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              disabled={isLoading}
              className="w-full text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
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
