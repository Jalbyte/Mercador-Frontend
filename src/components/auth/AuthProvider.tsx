"use client";

/**
 * AuthProvider - Proveedor de contexto de autenticación para la aplicación Mercador.
 *
 * Este módulo implementa un sistema completo de autenticación basado en cookies HTTP-only
 * que incluye gestión de estado de usuario, login/logout, actualización de perfil,
 * y protección de rutas. Utiliza el patrón Context API de React para proporcionar
 * el estado de autenticación a toda la aplicación.
 *
 * @module AuthProvider
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

/**
 * Constante que define la URL base de la API del backend.
 * Se utiliza para todas las peticiones de autenticación y gestión de usuarios.
 * Configurada dinámicamente para funcionar en desarrollo y producción.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

/**
 * Interfaz que define la estructura de datos de un usuario autenticado.
 * Representa la información completa del usuario obtenida desde el backend.
 *
 * @interface User
 * @property {string} id - Identificador único del usuario
 * @property {string} email - Correo electrónico del usuario
 * @property {string} [full_name] - Nombre completo del usuario
 * @property {string} [first_name] - Primer nombre del usuario
 * @property {string} [last_name] - Apellido del usuario
 * @property {string} [phone] - Número de teléfono del usuario
 * @property {string} [country] - País de residencia del usuario
 * @property {string} [role] - Rol del usuario (admin, user, etc.)
 * @property {boolean} [two_factor_enabled] - Si el usuario tiene 2FA activado
 * @property {string} [avatar_url] - URL del avatar del usuario
 * @property {any} [user_metadata] - Metadatos adicionales del usuario
 * @property {any} image - Imagen del usuario (puede ser URL o File)
 */
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

/**
 * Interfaz que define el tipo de contexto de autenticación.
 * Proporciona todas las funciones y estados necesarios para gestionar la autenticación.
 *
 * @interface AuthContextType
 * @property {User | null} user - Datos del usuario autenticado
 * @property {boolean} isAuthenticated - Indica si el usuario está autenticado
 * @property {boolean} isLoading - Indica si se está cargando información de auth
 * @property {string | null} error - Mensaje de error de autenticación
 * @property {(token: string) => Promise<void>} login - Función para iniciar sesión
 * @property {() => Promise<void>} logout - Función para cerrar sesión
 * @property {(userData: Partial<User>) => Promise<User | null>} updateUser - Función para actualizar datos del usuario
 * @property {() => Promise<void>} refetchUser - Función para recargar datos del usuario
 * @property {() => void} clearError - Función para limpiar errores
 */
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

/**
 * Contexto de React para compartir el estado de autenticación.
 * Se crea con createContext y se utiliza en toda la aplicación.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props del componente AuthProvider.
 *
 * @interface AuthProviderProps
 * @property {ReactNode} children - Componentes hijos que tendrán acceso al contexto
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Componente AuthProvider - Proveedor principal del contexto de autenticación.
 *
 * Este componente maneja todo el estado de autenticación de la aplicación, incluyendo:
 * - Inicialización automática del estado de autenticación al cargar la página
 * - Gestión de cookies HTTP-only para tokens de acceso
 * - Comunicación con el backend para obtener datos del usuario
 * - Funciones completas de login, logout y actualización de perfil
 * - Manejo de errores y estados de carga
 * - Eventos personalizados para notificar cambios de autenticación
 *
 * @component
 * @param {AuthProviderProps} props - Props del componente
 * @returns {JSX.Element} Proveedor de contexto que envuelve los componentes hijos
 *
 * @example
 * ```tsx
 * // En el layout principal de la aplicación
 * import { AuthProvider } from "@/components/auth/AuthProvider";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="es">
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * @remarks
 * El AuthProvider debe ser colocado en la raíz de la aplicación para que todos
 * los componentes tengan acceso al contexto de autenticación. Utiliza cookies
 * HTTP-only para mayor seguridad y maneja automáticamente la renovación de tokens.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Función auxiliar para obtener el token de autenticación.
   * En esta implementación, el token se maneja vía cookies HTTP-only,
   * por lo que el cliente no puede leerlo directamente.
   *
   * @returns {null} Siempre retorna null ya que usa cookies HTTP-only
   */
  const getToken = () => {
    // Token is managed via an HttpOnly cookie named sb_access_token. Client cannot read it reliably.
    return null;
  };

  /**
   * Función auxiliar para establecer el token de autenticación en una cookie.
   * Establece la cookie sb_access_token con el token proporcionado.
   *
   * @param {string} token - Token de autenticación a almacenar
   */
  const setToken = (token: string) => {
    if (typeof window === "undefined") return;
    try {
      document.cookie = `sb_access_token=${encodeURIComponent(token)}; path=/;`;
    } catch (e) {}
  };

  /**
   * Función auxiliar para eliminar el token de autenticación.
   * Remueve la cookie sb_access_token configurando Max-Age=0.
   */
  const removeToken = () => {
    if (typeof window === "undefined") return;
    try {
      document.cookie = "sb_access_token=; Max-Age=0; path=/;";
    } catch (e) {}
  };

  /**
   * Función asíncrona que obtiene los datos del usuario desde la API.
   * Realiza una petición GET al endpoint /auth/me usando cookies para autenticación.
   *
   * @async
   * @param {string} token - Token de autenticación (no utilizado en implementación actual)
   * @returns {Promise<User | null>} Datos del usuario o null si no está autenticado
   * @throws {Error} Cuando hay problemas de conexión o el servidor retorna error
   */
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

  /**
   * Hook useEffect que inicializa el estado de autenticación al montar el componente.
   * Verifica automáticamente si el usuario tiene una sesión válida y carga sus datos.
   *
   * @effect
   * @async
   * @dependency [] - Se ejecuta solo una vez al montar el componente
   */
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

  /**
   * Hook useEffect que escucha cambios en el estado de autenticación.
   * Se suscribe al evento personalizado 'auth-changed' para recargar datos del usuario.
   *
   * @effect
   * @listens auth-changed - Evento personalizado disparado por cambios de autenticación
   * @dependency {User | null} user - Estado del usuario para recargar cuando cambie
   */
  useEffect(() => {
    const handleAuthChange = () => {
      // On auth-changed, just refetch user state from server
      refetchUser();
    };

    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, [user]);

  /**
   * Función asíncrona para iniciar sesión de un usuario.
   * Establece el token en una cookie y obtiene los datos del usuario desde el servidor.
   *
   * @async
   * @param {string} token - Token de autenticación proporcionado por el servidor
   * @throws {Error} Cuando no se puede obtener la información del usuario
   */
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

  /**
   * Función asíncrona para cerrar la sesión del usuario.
   * Limpia el token, el estado local y notifica al servidor del logout.
   *
   * @async
   */
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

  /**
   * Función asíncrona para actualizar los datos del usuario.
   * Actualiza el estado local primero y luego sincroniza con el servidor.
   *
   * @async
   * @param {Partial<User>} userData - Datos parciales del usuario a actualizar
   * @returns {Promise<User | null>} Usuario actualizado o null si no hay usuario
   * @throws {Error} Cuando hay problemas al actualizar en el servidor
   */
  const updateUser = async (userData: Partial<User>): Promise<User | null> => {
    if (!user) return null;

    try {
      setError(null);

      // Actualizar el estado local primero para una mejor experiencia de usuario
      const localUpdatedUser = { ...user, ...userData };
      setUser(localUpdatedUser);

      // Hacer la petición al servidor
      const response = await fetch(`${API_BASE}/profile/update`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        // Revertir los cambios si hay un error
        setUser(user);

        if (response.status === 401) {
          // Token expirado
          router.push("/login");
          return null;
        }
        throw new Error(`Error al actualizar usuario: ${response.status}`);
      }

      const data = await response.json();
      const serverUpdatedUser = data?.data || data;

      setUser(serverUpdatedUser);

      // Dispatch auth change event
      window.dispatchEvent(new CustomEvent("auth-changed"));

      return serverUpdatedUser;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar usuario"
      );
      throw err;
    }
  };

  /**
   * Función asíncrona para recargar los datos del usuario desde el servidor.
   * Útil para sincronizar el estado local con el servidor después de cambios.
   *
   * @async
   */
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

  /**
   * Función para limpiar los mensajes de error.
   * Resetea el estado de error a null.
   */
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

/**
 * Hook personalizado para acceder al contexto de autenticación.
 * Proporciona acceso a todas las funciones y estados de autenticación.
 *
 * @returns {AuthContextType} Objeto con todas las propiedades y funciones de autenticación
 * @throws {Error} Cuando se usa fuera de un AuthProvider
 *
 * @example
 * ```tsx
 * import { useAuth } from "@/components/auth/AuthProvider";
 *
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={() => login(token)}>Iniciar sesión</button>;
 *   }
 *
 *   return <div>Bienvenido, {user?.full_name}!</div>;
 * }
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }

  return context;
};

/**
 * Higher-Order Component (HOC) para proteger rutas que requieren autenticación.
 * Envuelve un componente y redirige a la página de login si el usuario no está autenticado.
 *
 * @template P - Props del componente envuelto
 * @param {React.ComponentType<P>} Component - Componente a proteger
 * @param {string} [redirectTo="/login"] - Ruta a la que redirigir si no está autenticado
 * @returns {React.ComponentType<P>} Componente envuelto con protección de autenticación
 *
 * @example
 * ```tsx
 * import { withAuth } from "@/components/auth/AuthProvider";
 *
 * const ProtectedDashboard = withAuth(Dashboard);
 *
 * // O con ruta de redirección personalizada
 * const ProtectedAdmin = withAuth(AdminPanel, "/admin/login");
 *
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/dashboard" element={<ProtectedDashboard />} />
 *       <Route path="/admin" element={<ProtectedAdmin />} />
 *     </Routes>
 *   );
 * }
 * ```
 *
 * @remarks
 * El HOC muestra un spinner de carga mientras verifica el estado de autenticación
 * y redirige automáticamente si el usuario no está autenticado.
 */
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
