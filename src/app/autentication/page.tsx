"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiSave, FiArrowLeft, FiLoader } from "react-icons/fi";
import { Header } from "@/components/layout/Header";
import { FormInput } from "@/components/auth/FormInput";
import { TwoFactorAuth } from "@/components/auth/TwoFactorAuth";
import { Button } from "@/components/ui/button";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  two_factor_enabled?: boolean;
  phone?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      // Use cookie-based auth
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return;
        }
        throw new Error("Error al cargar el perfil");
      }

      const data = await response.json();
      const userProfile = data?.data || data;

      setProfile(userProfile);
      setFormData({
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el perfil"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el perfil");
      }

      const data = await response.json();
      const updatedProfile = data?.data || data;

      setProfile(updatedProfile);
      setSuccess("Perfil actualizado correctamente");

      // Disparar evento de cambio de auth para actualizar el header
      window.dispatchEvent(new CustomEvent("auth-changed"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar el perfil"
      );
    } finally {
      setSaving(false);
    }
  };

  const handle2FAStatusChange = (enabled: boolean) => {
    if (profile) {
      setProfile({ ...profile, two_factor_enabled: enabled });
    }
    if (enabled) {
      setSuccess("Autenticación de dos factores activada correctamente");
    } else {
      setSuccess("Autenticación de dos factores desactivada");
    }
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <FiLoader className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Volver atrás"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Editar Perfil</h1>
          </div>

          <div className="space-y-6">
            {/* Información Personal */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información Personal
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Nombre"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    icon={<FiUser size={18} />}
                    placeholder="Tu nombre"
                  />
                  <FormInput
                    label="Apellido"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    icon={<FiUser size={18} />}
                    placeholder="Tu apellido"
                  />
                </div>

                <FormInput
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  icon={<FiMail size={18} />}
                  placeholder="tu@email.com"
                  disabled
                />

                <FormInput
                  label="Teléfono (Opcional)"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  icon={<FiUser size={18} />}
                  placeholder="+57 300 123 4567"
                />

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto"
                >
                  {saving ? (
                    <FiLoader className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <FiSave className="h-4 w-4 mr-2" />
                  )}
                  Guardar Cambios
                </Button>
              </form>
            </div>

            {/* Seguridad */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Seguridad
              </h2>

              <TwoFactorAuth
                isEnabled={profile?.two_factor_enabled || false}
                onStatusChange={handle2FAStatusChange}
              />

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => router.push("/change-password")}
                  className="w-full md:w-auto"
                >
                  Cambiar Contraseña
                </Button>
              </div>
            </div>

            {/* Mensajes de estado */}
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
