"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiCheck, FiLoader, FiAlertCircle } from "react-icons/fi";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { FormInput } from "@/components/auth/FormInput";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Obtener token del magic link desde la URL
  const token = searchParams.get("token");
  const access_token = searchParams.get("access_token");
  const refresh_token = searchParams.get("refresh_token");

  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
  });

  // Verificar el token y extraer el email del token de Supabase
  useEffect(() => {
    const verifyToken = async () => {
      const tokenToVerify = token || access_token;

      if (!tokenToVerify) {
        setError("Token de recuperación no válido o expirado");
        setIsValidToken(false);
        return;
      }

      try {
        setIsValidToken(true);
        // El token será validado cuando se intente cambiar la contraseña
      } catch (err) {
        console.error("Error verifying token:", err);
        setError("Error al verificar el enlace de recuperación");
        setIsValidToken(false);
      }
    };

    verifyToken();
  }, [token, access_token]);

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let feedback = "";

    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 0:
      case 1:
        feedback = "Muy débil";
        break;
      case 2:
        feedback = "Débil";
        break;
      case 3:
        feedback = "Regular";
        break;
      case 4:
        feedback = "Fuerte";
        break;
      case 5:
        feedback = "Muy fuerte";
        break;
    }

    return { score, feedback };
  };

  const handlePasswordChange = (
    field: "newPassword" | "confirmPassword",
    value: string
  ) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
    setError("");

    if (field === "newPassword") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (passwords.newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (passwordStrength.score < 2) {
      setError(
        "La contraseña es demasiado débil. Usa mayúsculas, números y símbolos"
      );
      return;
    }

    setIsLoading(true);

    try {
      const tokenToUse = token || access_token;

      // Actualizar la contraseña usando la API del backend
      const response = await fetch(`${API_BASE}/auth/password/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: tokenToUse,
          password: passwords.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Error al actualizar la contraseña"
        );
      }

      console.log("Password reset successful");
      setIsSuccess(true);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push("/login?message=password-reset-success");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No pudimos actualizar tu contraseña. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state mientras verificamos el token
  if (isValidToken === null) {
    return (
      <AuthLayout>
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 text-center">
            <FiLoader
              className="animate-spin text-blue-600 mx-auto mb-4"
              size={32}
            />
            <p className="text-gray-600">
              Verificando enlace de recuperación...
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Token inválido
  if (isValidToken === false) {
    return (
      <AuthLayout>
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          <AuthHeader
            title="Enlace No Válido"
            subtitle="El enlace de recuperación ha expirado o no es válido"
            icon={<FiAlertCircle size={32} />}
          />

          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <FiAlertCircle size={32} className="text-red-600" />
              </div>
              <p className="text-gray-600 mb-4">
                {error ||
                  "El enlace de recuperación ha expirado o no es válido"}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                Los enlaces de recuperación expiran después de 1 hora por
                motivos de seguridad.
              </p>
            </div>

            <button
              onClick={() => router.push("/forgot-password")}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/50 transition-all"
            >
              Solicitar Nuevo Enlace
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          <AuthHeader
            title="¡Contraseña Actualizada!"
            subtitle="Tu contraseña ha sido cambiada exitosamente"
            icon={<FiCheck size={32} />}
          />

          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <FiCheck size={32} className="text-green-600" />
              </div>
              <p className="text-gray-600 mb-4">
                Tu contraseña ha sido actualizada correctamente.
              </p>
              {userEmail && (
                <p className="text-sm text-gray-500">
                  Para la cuenta:{" "}
                  <span className="font-semibold">{userEmail}</span>
                </p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>

            <p className="text-sm text-gray-500">
              Serás redirigido al inicio de sesión automáticamente...
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const getStrengthColor = () => {
    if (passwordStrength.score <= 1) return "text-red-600 bg-red-100";
    if (passwordStrength.score <= 2) return "text-orange-600 bg-orange-100";
    if (passwordStrength.score <= 3) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  const getStrengthBarWidth = () => {
    return `${(passwordStrength.score / 5) * 100}%`;
  };

  const getStrengthBarColor = () => {
    if (passwordStrength.score <= 1) return "bg-red-500";
    if (passwordStrength.score <= 2) return "bg-orange-500";
    if (passwordStrength.score <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <AuthLayout>
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
        <AuthHeader
          title="Nueva Contraseña"
          subtitle="Crea una contraseña segura para tu cuenta"
          icon={<FiLock size={32} />}
        />

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {userEmail && (
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600">
                Cambiando contraseña para:{" "}
                <span className="font-semibold">{userEmail}</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            <FormInput
              label="Nueva Contraseña"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              value={passwords.newPassword}
              onChange={(e) =>
                handlePasswordChange("newPassword", e.target.value)
              }
              icon={<FiLock size={18} />}
              placeholder="••••••••"
              required
              minLength={8}
              showPasswordToggle={true}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            {passwords.newPassword && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Fortaleza de la contraseña:
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStrengthColor()}`}
                  >
                    {passwordStrength.feedback}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor()}`}
                    style={{ width: getStrengthBarWidth() }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>La contraseña debe contener:</p>
                  <ul className="grid grid-cols-2 gap-1 text-xs">
                    <li
                      className={
                        passwords.newPassword.length >= 8
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    >
                      ✓ 8+ caracteres
                    </li>
                    <li
                      className={
                        /[A-Z]/.test(passwords.newPassword)
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    >
                      ✓ Mayúsculas
                    </li>
                    <li
                      className={
                        /[a-z]/.test(passwords.newPassword)
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    >
                      ✓ Minúsculas
                    </li>
                    <li
                      className={
                        /[0-9]/.test(passwords.newPassword)
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    >
                      ✓ Números
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <FormInput
              label="Confirmar Nueva Contraseña"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={passwords.confirmPassword}
              onChange={(e) =>
                handlePasswordChange("confirmPassword", e.target.value)
              }
              icon={<FiLock size={18} />}
              placeholder="••••••••"
              required
              minLength={8}
            />

            {passwords.confirmPassword && (
              <div className="text-sm">
                {passwords.newPassword === passwords.confirmPassword ? (
                  <p className="text-green-600 flex items-center gap-1">
                    <FiCheck size={16} /> Las contraseñas coinciden
                  </p>
                ) : (
                  <p className="text-red-600">Las contraseñas no coinciden</p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              isLoading ||
              !passwords.newPassword ||
              !passwords.confirmPassword ||
              passwords.newPassword !== passwords.confirmPassword
            }
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}

function LoadingFallback() {
  return (
    <AuthLayout>
      <div className="flex justify-center py-8">
        <FiLoader className="animate-spin text-blue-600" size={32} />
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
