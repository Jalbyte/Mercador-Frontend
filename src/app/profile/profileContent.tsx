"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiMail,
  FiSave,
  FiArrowLeft,
  FiLoader,
  FiPhone,
} from "react-icons/fi";
import { Header } from "@/components/layout/Header";
import { FormInput } from "@/components/auth/FormInput";
import { TwoFactorAuth } from "@/components/auth/TwoFactorAuth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  two_factor_enabled: boolean;
  phone: string;
}

// Helper function to get full name with fallbacks
function getFullName(profile: any, user: any): string {
  if (profile.full_name) return profile.full_name;
  
  const firstName = profile.first_name || user?.first_name || '';
  const lastName = profile.last_name || user?.last_name || '';
  
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  return user?.full_name || '';
}

// Helper function to get two-factor status with fallbacks
function getTwoFactorStatus(profile: any, user: any): boolean {
  if (profile.two_factor_enabled !== undefined) {
    return Boolean(profile.two_factor_enabled);
  }
  return Boolean(user?.two_factor_enabled);
}

export default function ProfileContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Initialize with default values that match the UserProfile interface
  const defaultProfile: UserProfile = {
    id: '',
    email: '',
    full_name: '',
    first_name: '',
    last_name: '',
    two_factor_enabled: false,
    phone: ''
  };
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated, authLoading]);

  // Helper function to get full name with fallbacks
  const getFullName = (profile: any, userData: any): string => {
    if (profile.full_name) return profile.full_name;
    
    const firstName = profile.first_name || userData?.first_name || '';
    const lastName = profile.last_name || userData?.last_name || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return userData?.full_name || '';
  };

  // Helper function to get two-factor status with fallbacks
  const getTwoFactorStatus = (profile: any, userData: any): boolean => {
    if (profile.two_factor_enabled !== undefined) {
      return Boolean(profile.two_factor_enabled);
    }
    return Boolean(userData?.two_factor_enabled);
  };

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");

    try {
          // Update form data from auth context user with fallbacks
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      
      // Set profile from auth context user with fallbacks
      const userFullName = user.full_name || 
                         (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : "");
      
      const initialProfile: UserProfile = {
        id: user.id || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        full_name: userFullName,
        phone: user.phone || "",
        two_factor_enabled: user.two_factor_enabled || false
      };
      setProfile(initialProfile);

      // Fetch additional profile data if needed
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Error al cargar el perfil");
      }

      const data = await response.json();
      const userProfile = data?.data || data;

// Update profile with additional data if needed
      if (userProfile) {
        const updatedProfile: UserProfile = {
          id: userProfile.id || user?.id || '',
          email: userProfile.email || user?.email || '',
          first_name: userProfile.first_name || user?.first_name || '',
          last_name: userProfile.last_name || user?.last_name || '',
          full_name: getFullName(userProfile, user),
          phone: userProfile.phone || user?.phone || '',
          two_factor_enabled: getTwoFactorStatus(userProfile, user)
        };
        setProfile(updatedProfile);
      }
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
      if (!user) {
        router.push("/login");
        return;
      }

      const updatedUser = await updateUser({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      });

      if (updatedUser) {
        setSuccess("Perfil actualizado correctamente");
        // Update local profile state with updated data
        setProfile(prev => ({
          ...prev,
          first_name: updatedUser.first_name || formData.first_name,
          last_name: updatedUser.last_name || formData.last_name,
          full_name: updatedUser.full_name || `${formData.first_name} ${formData.last_name}`.trim(),
          phone: updatedUser.phone || formData.phone,
        }));
      }
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
                  icon={<FiPhone size={18} />}
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
