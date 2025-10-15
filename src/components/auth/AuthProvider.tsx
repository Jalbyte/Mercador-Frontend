"use client";

/**
 * Proveedor de autenticación unificado para Mercador
 * Fuente única de verdad para el estado de autenticación
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

// Interface unificada del usuario
export interface User {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  role?: string;
  image?: string;
  avatar_url?: string;
  two_factor_enabled: boolean;
}

interface MFARequiredData {
  factorId: string;
  tempToken: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: MFARequiredData | null;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  verifyMFA: (code: string) => Promise<void>;
  cancelMFA: () => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState<MFARequiredData | null>(null);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Función para obtener datos del usuario
  const fetchUser = async (): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return null;
        }
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const userData = data?.data || data;

      // Normalizar datos del usuario
      const normalizedUser: User = {
        id: userData.id || "",
        email: userData.email || "",
        full_name:
          userData.full_name ||
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
          userData.email?.split("@")[0] ||
          "",
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        country: userData.country,
        role: userData.role || userData.user_metadata?.role,
        image: userData.image || userData.avatar_url,
        avatar_url: userData.avatar_url || userData.image,
        two_factor_enabled: Boolean(userData.two_factor_enabled),
      };

      setUser(normalizedUser);
      return normalizedUser;
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      return null;
    }
  };

  // Login function
  const login = async (
    email: string,
    password: string,
    rememberMe = false
  ): Promise<void> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Manejar diferentes tipos de errores con mensajes específicos
      if (response.status === 401) {
        throw new Error("Credenciales incorrectas. Por favor verifica tu email y contraseña.");
      }
      
      if (response.status === 429) {
        throw new Error("Demasiados intentos de inicio de sesión. Por favor intenta nuevamente en unos minutos.");
      }
      
      if (response.status >= 500) {
        throw new Error("Error del servidor. Por favor intenta nuevamente más tarde.");
      }
      
      // Manejar errores de Zod (cuando error.error es un objeto)
      if (error.error && typeof error.error === "object" && error.error.name === "ZodError") {
        try {
          // Si error.error.message es un string JSON, parsearlo
          const zodErrorsRaw = typeof error.error.message === "string" 
            ? JSON.parse(error.error.message) 
            : error.error.message;
          
          const messages = zodErrorsRaw.map((e: any) => e.message).join(". ");
          throw new Error(messages);
        } catch (parseError) {
          throw new Error("Los datos ingresados no son válidos. Por favor revisa la información.");
        }
      }
      
      // Manejar errores específicos del backend
      if (error.error) {
        const backendError = error.error.toLowerCase();
        
        if (backendError.includes("email") && backendError.includes("not found")) {
          throw new Error("No existe una cuenta con este email. ¿Deseas crear una cuenta nueva?");
        }
        
        if (backendError.includes("password") && backendError.includes("incorrect")) {
          throw new Error("Contraseña incorrecta. ¿Olvidaste tu contraseña?");
        }
        
        if (backendError.includes("account") && backendError.includes("locked")) {
          throw new Error("Tu cuenta ha sido bloqueada temporalmente por seguridad. Intenta más tarde.");
        }
        
        if (backendError.includes("email") && backendError.includes("verify")) {
          throw new Error("Tu cuenta no ha sido verificada. Por favor revisa tu email y confirma tu cuenta.");
        }
        
        // Error genérico del backend
        throw new Error(error.error);
      }
      
      // Error genérico
      throw new Error("Error al iniciar sesión. Por favor intenta nuevamente.");
    }

    const data = await response.json();

    // Verificar si requiere MFA
    if (data.mfaRequired) {
      setMfaRequired({
        factorId: data.factorId,
        tempToken: data.tempToken,
      });
      // No completar el login aún, esperar verificación MFA
      return;
    }

    // Login completo sin MFA
    if (rememberMe) {
      localStorage.setItem("last-login-email", email);
    } else {
      localStorage.removeItem("last-login-email");
    }

    // Obtener datos del usuario después del login
    await fetchUser();
  };

  // Verificar código MFA durante login
  const verifyMFA = async (code: string): Promise<void> => {
    if (!mfaRequired) {
      throw new Error("No hay verificación MFA pendiente");
    }

    const response = await fetch(`${API_BASE}/auth/mfa/verify-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        factorId: mfaRequired.factorId,
        code,
        tempToken: mfaRequired.tempToken,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Código de verificación incorrecto";
      
      try {
        const error = await response.json();
        console.error("MFA verification error response:", error);
        
        // Mensajes específicos para MFA
        if (response.status === 401) {
          const backendError = (error.error || "").toLowerCase();
          
          if (backendError.includes("expired")) {
            errorMessage = "El código ha expirado. Por favor genera un nuevo código en tu aplicación autenticadora.";
          } else if (backendError.includes("invalid") || backendError.includes("incorrect")) {
            errorMessage = "Código incorrecto. Verifica el código en tu aplicación autenticadora e intenta nuevamente.";
          } else if (backendError.includes("challenge")) {
            errorMessage = "Error en la verificación. Por favor intenta iniciar sesión nuevamente.";
          } else {
            errorMessage = "Código de verificación incorrecto. Intenta nuevamente.";
          }
        } else if (response.status === 429) {
          errorMessage = "Demasiados intentos. Por favor espera un momento antes de intentar nuevamente.";
        } else if (response.status >= 500) {
          errorMessage = "Error del servidor. Por favor intenta iniciar sesión nuevamente.";
        } else {
          errorMessage = error.error || error.message || errorMessage;
        }
        
      } catch (parseError) {
        console.error("Error parsing MFA verification error response:", parseError);
        if (response.status >= 500) {
          errorMessage = "Error del servidor. Por favor intenta iniciar sesión nuevamente.";
        } else {
          errorMessage = "Error de verificación. Por favor intenta nuevamente.";
        }
      }
      
      throw new Error(errorMessage);
    }

    // MFA verificado, completar login
    setMfaRequired(null);
    await fetchUser();
  };

  // Cancelar verificación MFA
  const cancelMFA = (): void => {
    setMfaRequired(null);
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("last-login-email");
      router.push("/");
    }
  };

  // Update user function
  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!user) return;

    // Optimistic update
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);

    try {
      const response = await fetch(`${API_BASE}/profile/update`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setUser(user);
        throw new Error("Error actualizando usuario");
      }

      const result = await response.json();
      const serverUser = result?.data || result;

      if (serverUser) {
        setUser((prev) => ({ ...prev, ...serverUser }));
      }
    } catch (error) {
      // Revert optimistic update
      setUser(user);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    await fetchUser();
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setIsLoading(true);
      await fetchUser();
      if (mounted) setIsLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      if (mounted) initAuth();
    };

    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    mfaRequired,
    login,
    verifyMFA,
    cancelMFA,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado para usar el contexto de auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
