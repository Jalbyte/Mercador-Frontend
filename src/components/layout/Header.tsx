"use client";

/**
 * Componente Header - Barra de navegación principal de Mercador.
 *
 * Este componente implementa la navegación completa de la aplicación incluyendo:
 * - Logo y enlace a la página principal
 * - Barra de búsqueda de productos
 * - Navegación por categorías
 * - Gestión de autenticación de usuarios
 * - Carrito de compras con contador
 * - Panel de administración para usuarios con permisos
 * - Menú de usuario con opciones de perfil y logout
 *
 * @module Header
 */

import { FiSearch, FiUser, FiChevronDown } from "react-icons/fi";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Constante que define la URL base de la API del backend.
 * Se utiliza para las peticiones de autenticación y verificación de permisos.
 * Configurada dinámicamente para funcionar en desarrollo y producción.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

/**
 * Componente Header - Barra de navegación principal de la aplicación Mercador.
 *
 * @component
 * @returns {JSX.Element} Elemento JSX que representa la barra de navegación completa
 *
 * @example
 * ```tsx
 * import { Header } from "@/components/layout/Header";
 *
 * export default function Layout() {
 *   return (
 *     <div>
 *       <Header />
 *       <main>{children}</main>
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * Funcionalidades principales:
 * - Autenticación automática al cargar la página
 * - Verificación de permisos de administrador
 * - Integración completa con el sistema de carrito
 * - Navegación responsive con Tailwind CSS
 * - Panel modal de administración de productos
 */
export function Header() {
  const { totalItems, setIsOpen, isOpen } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const pathname = usePathname();
  const isAdminDashboard = pathname?.startsWith("/dashboard");

  /**
   * Función que maneja el clic en el botón del carrito.
   * Abre el panel lateral del carrito de compras.
   */
  const handleCartClick = () => {
    console.log("Cart button clicked, setting isOpen to true");
    setIsOpen?.(true);
  };

  /**
   * Hook useEffect que verifica el estado de autenticación del usuario.
   * Realiza una petición al endpoint /auth/me para obtener información del usuario
   * y determinar si tiene permisos de administrador.
   *
   * @effect
   * @async
   * @listens auth-changed - Evento personalizado para actualizar el estado de auth
   */
  useEffect(() => {
    let mounted = true;
    async function checkAdmin() {
      setCheckingAdmin(true);
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });
        if (!mounted) return;
        if (!res.ok) {
          setIsAdmin(false);
          setIsAuthenticated(false);
          setUserName(null);
          setUserImage(null);
        } else {
          const j = await res.json().catch(() => null);
          // Backend returns { success: true, data: { role: string, ... } }
          const role = j?.data?.role ?? j?.data?.user_metadata?.role ?? null;
          const name =
            j?.data?.full_name ??
            j?.data?.user_metadata?.full_name ??
            j?.data?.email ??
            null;
          const image = j?.data?.image ?? null;
          setIsAdmin(role === "admin");
          setIsAuthenticated(true);
          setUserName(name);
          setUserImage(image);
        }
      } catch (err) {
        setIsAdmin(false);
        setIsAuthenticated(false);
        setUserName(null);
      } finally {
        if (mounted) setCheckingAdmin(false);
      }
    }
    checkAdmin();
    const onAuthChanged = () => {
      if (mounted) checkAdmin();
    };
    window.addEventListener("auth-changed", onAuthChanged as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener(
        "auth-changed",
        onAuthChanged as EventListener
      );
    };
  }, []);

  return (
    <header className="fixed w-full top-0 left-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-white/20 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo y enlace a la página principal */}
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Mercador
          </Link>

          {/* Barra de búsqueda */}
          <div className="relative flex-1 max-w-2xl mx-4">
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FiSearch className="absolute right-3 top-2.5 text-gray-400" />
          </div>

          {/* Navegación */}
          <nav className="flex items-center space-x-6">
            <ul className="flex items-center space-x-6">
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600 transition-colors"
                >
                  Inicio
                </Link>
              </li>

              <li className="relative group">
                <button className="flex items-center hover:text-blue-600 transition-colors">
                  <span>Categorías</span>
                  <FiChevronDown size={16} className="ml-1" />
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                  <a
                    href="/"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Licencias
                  </a>
                  <a
                    href="/"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Tarjetas de Regalo
                  </a>
                </div>
              </li>

              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Soporte
                </a>
              </li>

              {/* Carrito de compras */}
              <li>
                <button
                  onClick={handleCartClick}
                  className="relative p-2 hover:text-blue-600 transition-colors"
                  aria-label="Carrito de compras"
                >
                  <ShoppingCart size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              </li>

              {/* Perfil de usuario */}
              <li>
                {isAuthenticated ? (
                  <div className="relative group">
                    <button className="flex items-center space-x-2">
                      {userImage ? (
                        <img
                          src={userImage}
                          alt={userName || "Usuario"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <FiUser className="text-gray-600" />
                        </div>
                      )}
                      <span className="hidden md:inline">
                        {userName || "Mi cuenta"}
                      </span>
                      <FiChevronDown size={16} className="hidden md:block" />
                    </button>

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                      <Link
                        href="/perfil"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Mi perfil
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Panel de control
                        </Link>
                      )}
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={async () => {
                          await fetch(`${API_BASE}/auth/logout`, {
                            method: "POST",
                            credentials: "include",
                          });
                          window.dispatchEvent(new Event("auth-changed"));
                        }}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                  >
                    <FiUser size={18} />
                    <span className="hidden md:inline">Iniciar sesión</span>
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
