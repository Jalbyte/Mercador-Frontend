"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiArrowLeft, FiExternalLink } from "react-icons/fi";
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
  const [error, setError] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Autocompletar email si hay uno guardado en localStorage
  useState(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("last-login-email");
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log(
        "Sending forgot password request to:",
        `${API_BASE}/auth/login/magiclink`
      );

      const response = await fetch(`${API_BASE}/auth/login/magiclink`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        throw new Error(
          `El servidor respondió con formato incorrecto. Status: ${response.status}`
        );
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Error del servidor (${response.status})`
        );
      }

      console.log("Magic link sent to:", email);
      setIsEmailSent(true);

      // Guardar el email para futuro uso
      if (typeof window !== "undefined") {
        localStorage.setItem("last-login-email", email);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No pudimos enviar el enlace. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <AuthLayout>
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          <AuthHeader
            title="¡Enlace Enviado!"
            subtitle="Revisa tu bandeja de entrada"
            icon={<FiMail size={32} />}
          />

          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <FiExternalLink size={32} className="text-green-600" />
              </div>
              <p className="text-gray-600 mb-2">
                Hemos enviado un enlace mágico a:
              </p>
              <p className="font-semibold text-gray-900">{email}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">
                <strong>¿Cómo funciona?</strong>
              </p>
              <ul className="text-xs text-blue-700 text-left space-y-1">
                <li>• Haz clic en el enlace que enviamos a tu email</li>
                <li>
                  • Serás redirigido automáticamente para cambiar tu contraseña
                </li>
                <li>• El enlace expira en 1 hora por seguridad</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                Si no ves el email en unos minutos, revisa tu carpeta de spam o
                promociones.
              </p>
            </div>

            <div className="space-y-3">
              <div className="pt-4 border-t">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <FiArrowLeft size={16} />
                  Volver al inicio de sesión
                </button>
              </div>
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
          title="Recuperar Contraseña"
          subtitle="Te enviaremos un enlace mágico para cambiar tu contraseña"
          icon={<FiMail size={32} />}
          onBack={() => router.push("/login")}
        />

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <FiExternalLink className="text-blue-600 mt-0.5" size={18} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Enlace Mágico</p>
                <p>
                  Te enviaremos un enlace seguro por email. Solo haz clic en él
                  para cambiar tu contraseña sin necesidad de códigos.
                </p>
              </div>
            </div>
          </div>

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
            {isLoading ? "Enviando..." : "Enviar Enlace Mágico"}
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
