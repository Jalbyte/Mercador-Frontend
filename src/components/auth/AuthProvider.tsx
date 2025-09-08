"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

export interface User {
  image: any;
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  role?: string;
  two_factor_enabled?: boolean;
  avatar_url?: string;
  user_metadata?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<User | null>;
  refetchUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper functions
  const getToken = () => {
    // Token is managed via an HttpOnly cookie named sb_access_token. Client cannot read it reliably.
    return null;
  };

  const setToken = (token: string) => {
    if (typeof window === "undefined") return;
    try {
      document.cookie = `sb_access_token=${encodeURIComponent(token)}; path=/;`;
    } catch (e) {}
  };

  const removeToken = () => {
    if (typeof window === "undefined") return;
    try {
      document.cookie = "sb_access_token=; Max-Age=0; path=/;";
    } catch (e) {}
  };

  // Fetch user data from API
  const fetchUserData = async (token: string): Promise<User | null> => {
    try {
      // Use cookie-based auth: server should set sb_access_token cookie and we include credentials
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired
          removeToken();
          return null;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data?.data || data;
    } catch (err) {
      console.error("Error fetching user data:", err);
      throw err;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to fetch user via cookie-based session
        const userData = await fetchUserData("");

        if (!mounted) return;

        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Error al verificar autenticación"
          );
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for auth changes from other parts of the app
  useEffect(() => {
    const handleAuthChange = () => {
      // On auth-changed, just refetch user state from server
      refetchUser();
    };

    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, [user]);

  // Login function
  const login = async (token: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      setToken(token);
      const userData = await fetchUserData(token);

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);

        // Dispatch auth change event
        window.dispatchEvent(new CustomEvent("auth-changed"));
      } else {
        throw new Error("No se pudo obtener la información del usuario");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Try to call logout endpoint using cookie-based auth
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.warn("Error calling logout endpoint:", err);
        // Continue with local logout even if server logout fails
      }
    } finally {
      // Always perform local cleanup
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);

      // Dispatch auth change event
      window.dispatchEvent(new CustomEvent("auth-changed"));
    }
  };

  // Update user function
  const updateUser = async (userData: Partial<User>): Promise<User | null> => {
    try {
      setError(null);

      const response = await fetch(`${API_BASE}/auth/me`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired
          await logout();
          router.push("/login");
          return null;
        }
        throw new Error(`Error al actualizar usuario: ${response.status}`);
      }

      const data = await response.json();
      const updatedUser = data?.data || data;

      setUser(updatedUser);

      // Dispatch auth change event
      window.dispatchEvent(new CustomEvent("auth-changed"));

      return updatedUser;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar usuario"
      );
      throw err;
    }
  };

  // Refetch user data
  const refetchUser = async (): Promise<void> => {
    try {
      setError(null);

      const userData = await fetchUserData("");

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al recargar usuario"
      );
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateUser,
    refetchUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }

  return context;
};

// HOC for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = "/login"
) => {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
};
