"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

export interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  two_factor_enabled?: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const getToken = () => {
    if (typeof window === "undefined") return null;
  // Token is stored in an HttpOnly cookie named sb_access_token; client cannot read it reliably.
  // Return null to force server-validated flow using credentials: 'include'.
  return null;
  };

  const setToken = (token: string) => {
    if (typeof window === "undefined") return;
  // Prefer server to set cookie; as a fallback set a non-HttpOnly cookie so client can still work in some envs.
  try { document.cookie = `sb_access_token=${encodeURIComponent(token)}; path=/;` } catch (e) {}
  };

  const removeToken = () => {
    if (typeof window === "undefined") return;
  try { document.cookie = 'sb_access_token=; Max-Age=0; path=/;' } catch (e) {}
  };

  const fetchUser = async (showErrors = false) => {
    // Use cookie-based auth: call /auth/me with credentials so browser sends sb_access_token cookie
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthenticated; ensure any cookie is removed client-side and return
          removeToken();
          setUser(null);
          setIsAuthenticated(false);
          return null;
        }

        if (showErrors) {
          throw new Error(`Error: ${response.status}`);
        }
        return null;
      }

      const data = await response.json();
      const userData = data?.data || data;

      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error("Error fetching user:", error);
      if (showErrors) {
        throw error;
      }
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: "PUT",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        setUser(null);
        setIsAuthenticated(false);
        router.push("/login");
        return null;
      }
      throw new Error(`Error al actualizar perfil: ${response.status}`);
    }

    const data = await response.json();
    const updatedUser = data?.data || data;

    setUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
      router.push("/");
    }
  };

  const requireAuth = (redirectTo = "/login") => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    loading,
    isAuthenticated,
    fetchUser,
    updateProfile,
    logout,
    requireAuth,
    getToken,
    setToken,
    removeToken,
  };
};
