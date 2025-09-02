"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiShield, FiRefreshCw } from "react-icons/fi";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";

export default function VerifyCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push("/forgot-password");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(
        `input[name="code-${index + 1}"]`
      ) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.querySelector(
        `input[name="code-${index - 1}"]`
      ) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) {
        newCode[i] = pastedData[i];
      }
    }
    setCode(newCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeString = code.join("");

    if (codeString.length !== 6) {
      setError("Por favor ingresa el código completo de 6 dígitos");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Verifying code:", codeString, "for email:", email);

      // Redirect to reset password page
      router.push(
        `/reset-password?email=${encodeURIComponent(email!)}&code=${codeString}`
      );
    } catch (err) {
      console.error("Code verification error:", err);
      setError("Código incorrecto. Por favor inténtalo de nuevo.");
      setCode(["", "", "", "", "", ""]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setCanResend(false);
    setTimeLeft(300);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Resending code to:", email);

      // Reset form
      setCode(["", "", "", "", "", ""]);
      setError("");
    } catch (err) {
      console.error("Resend code error:", err);
      setError("No pudimos reenviar el código. Inténtalo de nuevo.");
      setCanResend(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
        <AuthHeader
          title="Verificar Código"
          subtitle="Ingresa el código de 6 dígitos que enviamos a tu email"
          icon={<FiShield size={32} />}
          onBack={() => router.push("/forgot-password")}
        />

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Código enviado a:</p>
            <p className="font-semibold text-gray-900">{email}</p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 text-center">
              Código de Verificación
            </label>

            <div className="flex gap-3 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  name={`code-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  maxLength={1}
                  pattern="[0-9]"
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || code.join("").length !== 6}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verificando..." : "Verificar Código"}
          </button>

          <div className="text-center space-y-3">
            {timeLeft > 0 ? (
              <p className="text-sm text-gray-500">
                El código expira en:{" "}
                <span className="font-semibold text-red-600">
                  {formatTime(timeLeft)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-600 font-medium">
                El código ha expirado
              </p>
            )}

            <button
              type="button"
              onClick={handleResendCode}
              disabled={!canResend || isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
            >
              <FiRefreshCw size={16} />
              {canResend ? "Reenviar código" : "Reenviar código"}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
