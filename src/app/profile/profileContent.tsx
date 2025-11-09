 "use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { FormInput } from "@/components/auth/FormInput";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { TwoFactorAuth } from "@/components/auth/TwoFactorAuth";
import { PointsHistory } from "@/components/points/PointsHistory";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiGlobe,
  FiLoader,
  FiMail,
  FiSave,
  FiUser,
  FiLock,
  FiX,
} from "react-icons/fi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Lista de países comunes
const countries = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela", "Estados Unidos", "Canadá", "España", "Francia", "Italia", "Reino Unido", "Alemania", "Portugal", "Otros"
];

export default function ProfileContent() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    updateUser,
  } = useAuth();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Eliminar perfil (soft delete)
  const handleDeleteProfile = async () => {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/profile/delete`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el perfil");
      }
      setDeleteModalOpen(false);
      setSuccess("");
      // Cerrar sesión y redirigir al home
      window.dispatchEvent(new CustomEvent("auth-changed"));
      router.push("/login?deleted=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el perfil");
    } finally {
      setDeleting(false);
    }
  };
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    country: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  // Scroll to points section if ?tab=points
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('tab') === 'points') {
        // Wait a bit for the component to render
        setTimeout(() => {
          const pointsSection = document.getElementById('points-section');
          if (pointsSection) {
            pointsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }
  }, []);

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        country: user.country || "",
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("La imagen debe ser menor a 2MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Solo se permiten archivos de imagen");
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("No se pudo obtener la información del usuario");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("full_name", formData.full_name);
      formDataToSend.append("country", formData.country);

      if (avatarFile) {
        formDataToSend.append("image_file", avatarFile);
      }

      const response = await fetch(`${API_BASE}/profile/update`, {
        method: "POST",
        credentials: "include",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el perfil");
      }

      const result = await response.json();
      const updatedData = result.data || result;

      // Update the auth context
      await updateUser({
        full_name: formData.full_name,
        country: formData.country,
        ...(updatedData.image && {
          image: updatedData.image,
          avatar_url: updatedData.image,
        }),
      });

      setSuccess("Perfil actualizado correctamente");

      // Clear avatar preview after successful upload
      if (avatarFile) {
        setAvatarFile(null);
        setAvatarPreview(null);
      }

      // Trigger auth refresh to sync header
      window.dispatchEvent(new CustomEvent("auth-changed"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar el perfil"
      );
    } finally {
      setSaving(false);
    }
  };

  const handle2FAStatusChange = async (enabled: boolean) => {
    if (enabled) {
      setSuccess("Autenticación de dos factores activada correctamente");
    } else {
      setSuccess("Autenticación de dos factores desactivada");
    }
    setError(""); 

    // Actualizar el estado del usuario en el contexto
    await updateUser({
      two_factor_enabled: enabled
    });
  };

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
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

            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 mb-4">
                {avatarPreview || user.image || user.avatar_url ? (
                  <img
                    src={avatarPreview || user.image || user.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FiUser className="text-gray-400" size={48} />
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                  Cambiar foto
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
                {(avatarPreview || user.image || user.avatar_url) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Formatos: JPG, PNG (Máx. 2MB)
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormInput
                  label="Nombre completo"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  icon={<FiUser size={18} />}
                  placeholder="Tu nombre completo"
                  required
                />
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <div className="relative">
                    <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecciona tu país</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <FormInput
                label="Correo Electrónico"
                name="email"
                type="email"
                value={user.email}
                onChange={() => {}} // Read only
                icon={<FiMail size={18} />}
                placeholder="tu@email.com"
                disabled
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

          {/* Mis Puntos */}
          <div id="points-section" className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Mis Puntos
            </h2>
            <PointsHistory />
          </div>

          {/* Seguridad */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Seguridad
            </h2>

            <TwoFactorAuth
              isEnabled={user.two_factor_enabled || false}
              onStatusChange={handle2FAStatusChange}
              loading={authLoading}
            />

            {/* Botón de borrar perfil */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Eliminar cuenta</h2>
              <p className="text-sm text-gray-600 mb-4">Esta acción marcará tu cuenta como eliminada. Podrás restaurarla si vuelves a iniciar sesión, pero no podrás acceder mientras esté eliminada.</p>
              <Button
                variant="destructive"
                onClick={() => setDeleteModalOpen(true)}
                className="w-full md:w-auto"
              >
                <FiX className="h-4 w-4 mr-2" />
                Borrar mi perfil
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={() => setPasswordModalOpen(true)}
              >
                <FiLock className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </Button>
            </div>
          </div>

          {/* Mensajes de estado */}
      {/* Modal de confirmación de borrado */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="¿Eliminar tu cuenta?">
        <div className="space-y-4">
          <p className="text-gray-700">¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es reversible, pero no podrás acceder hasta restaurarla.</p>
          {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg">{error}</div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProfile} disabled={deleting}>
              {deleting ? <FiLoader className="animate-spin h-4 w-4 mr-2" /> : <FiX className="h-4 w-4 mr-2" />}
              Sí, eliminar cuenta
            </Button>
          </div>
        </div>
      </Modal>
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

      {/* Modal de cambiar contraseña */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => {
          setSuccess("Contraseña actualizada correctamente");
        }}
      />
    </div>
  );
}
