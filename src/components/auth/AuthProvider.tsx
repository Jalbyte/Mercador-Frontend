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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      throw new Error(error.message || "Error en el login");
    }

    // Guardar email si recordar
    if (rememberMe) {
      localStorage.setItem("last-login-email", email);
    } else {
      localStorage.removeItem("last-login-email");
    }

    // Obtener datos del usuario después del login
    await fetchUser();
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
    login,
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
