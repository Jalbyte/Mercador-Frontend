import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiUser as UserIcon } from "react-icons/fi";
import { ShoppingCart } from "lucide-react";
import { FormInput } from "./FormInput";
import { SocialLogin } from "./SocialLogin";

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  acceptTerms?: boolean;
  rememberMe?: boolean;
}

interface AuthFormProps {
  isLogin: boolean;
  onSubmit: (data: Omit<FormData, "confirmPassword" | "acceptTerms">) => void;
  onSocialLogin?: (provider: "google" | "facebook") => void;
  onToggleMode: () => void;
  loading?: boolean;
  error?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  isLogin,
  onSubmit,
  onSocialLogin,
  onToggleMode,
  loading = false,
  error,
}) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    acceptTerms: false,
    rememberMe: false,
  });

  // Cargar email guardado al montar el componente
  React.useEffect(() => {
    if (isLogin && typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("last-login-email");
      if (savedEmail) {
        setFormData((prev) => ({ ...prev, email: savedEmail }));
      }
    }
  }, [isLogin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { confirmPassword, acceptTerms, ...submitData } = formData;
    // Include rememberMe in the submission
    onSubmit({
      ...submitData,
      rememberMe: formData.rememberMe
    });
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    if (onSocialLogin) {
      onSocialLogin(provider);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-6 p-8">
        {!isLogin && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Nombre"
              name="firstName"
              type="text"
              value={formData.firstName || ""}
              onChange={handleInputChange}
              icon={<UserIcon size={18} />}
              placeholder="Tu nombre"
              required
            />
            <FormInput
              label="Apellido"
              name="lastName"
              type="text"
              value={formData.lastName || ""}
              onChange={handleInputChange}
              icon={<UserIcon size={18} />}
              placeholder="Tu apellido"
              required
            />
          </div>
        )}

        <FormInput
          label="Correo Electrónico"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          icon={<FiMail size={18} />}
          placeholder="tu@email.com"
          required
        />

        <FormInput
          label="Contraseña"
          name="password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleInputChange}
          icon={<FiLock size={18} />}
          placeholder="••••••••"
          required
          minLength={isLogin ? undefined : 8}
          showPasswordToggle={true}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        {!isLogin && (
          <FormInput
            label="Confirmar Contraseña"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword || ""}
            onChange={handleInputChange}
            icon={<FiLock size={18} />}
            placeholder="••••••••"
            required
            minLength={8}
          />
        )}

        {isLogin ? (
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={!!formData.rememberMe}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Recordarme</span>
            </label>
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        ) : (
          <div className="flex items-start">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={!!formData.acceptTerms}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
              required
            />
            <label className="ml-2 text-sm text-gray-600">
              Acepto los{" "}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                términos y condiciones
              </a>{" "}
              y la{" "}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                política de privacidad
              </a>
            </label>
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading
            ? "Cargando..."
            : isLogin
            ? "Iniciar Sesión"
            : "Crear Cuenta"}
        </button>

        <SocialLogin onGoogleLogin={() => handleSocialLogin("google")} />
      </form>
    </div>
  );
};
