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

/**
 * Constante que define la URL base de la API del backend.
 * Se utiliza para las peticiones de autenticación y verificación de permisos.
 * Configurada dinámicamente para funcionar en desarrollo y producción.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3010` : '');

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
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
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
          const name = j?.data?.full_name ?? j?.data?.user_metadata?.full_name ?? j?.data?.email ?? null;
          const image = j?.data?.image ?? null;
          setIsAdmin(role === 'admin');
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
    const onAuthChanged = () => { if (mounted) checkAdmin(); };
    window.addEventListener('auth-changed', onAuthChanged as EventListener);
    return () => { mounted = false; window.removeEventListener('auth-changed', onAuthChanged as EventListener); };
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo y enlace a la página principal */}
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Mercador
          </Link>

          {/* Barra de búsqueda de productos */}
          <div className="relative flex-1 max-w-2xl">
            <input
              type="text"
              placeholder="Buscar licencias..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
              <FiSearch size={20} />
            </button>
          </div>

          {/* Sección de acciones del usuario - Login/Carrito/Admin */}
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600"
              >
                <FiUser size={20} />
                <span>Iniciar sesión</span>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                {userImage && (
                  <img
                    src={userImage}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-gray-300"
                  />
                )}
                <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                  Editar perfil
                </Link>
                <button
                  onClick={async () => {
                    try {
                      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
                    } catch (e) {
                      // ignore
                    }
                    // Refresh auth state: simple approach is reload
                    setIsAuthenticated(false);
                    setIsAdmin(false);
                    setUserName(null);
                    setUserImage(null);
                    window.location.href = '/';
                  }}
                  className="px-3 py-1 rounded bg-gray-100 text-sm hover:bg-gray-200"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
            { !checkingAdmin && isAdmin && (
              <button
                onClick={() => setShowAdmin(true)}
                className="px-3 py-1 rounded bg-gray-100 text-sm hover:bg-gray-200"
                type="button"
              >
                Admin
              </button>
            )}
            <button
              onClick={handleCartClick}
              className="relative flex items-center gap-1 text-gray-700 hover:text-blue-600"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <Link
              href="/dashboard"
              className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Barra de navegación principal */}
        <nav className="mt-4">
          <ul className="flex gap-6 text-sm font-medium">
            <li>
              <Link href="/" className="hover:text-blue-600">
                Inicio
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <a href="#" className="hover:text-blue-600">
                Categorías
              </a>
              <FiChevronDown size={16} />
            </li>
            <li>
              <a href="#" className="hover:text-blue-600">
                Ofertas
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-600">
                Nuevo
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-600">
                Soporte
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
