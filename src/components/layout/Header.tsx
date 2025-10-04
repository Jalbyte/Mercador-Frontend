"use client";

/**
 * Header optimizado que usa AuthProvider como fuente única de verdad
 * Elimina llamadas duplicadas a la API y mejora el performance
 */

import { FiSearch, FiUser, FiChevronDown } from "react-icons/fi";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks";
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { totalItems, setIsOpen } = useCart();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);

  // Determinar si es admin usando el contexto de auth
  const isAdmin = user?.role === "admin";

  // Cerrar menú cuando se hace click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCartClick = () => {
    console.log("Cart button clicked, setting isOpen to true");
    setIsOpen?.(true);
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
      // AuthProvider maneja la redirección automáticamente
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
  };

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
              <li className="relative" ref={menuRef}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="hidden md:block w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ) : isAuthenticated && user ? (
                  <div>
                    <button
                      onClick={toggleUserMenu}
                      className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
                      aria-haspopup="true"
                      aria-expanded={showUserMenu}
                    >
                      {user.image || user.avatar_url ? (
                        <img
                          src={user.image || user.avatar_url}
                          alt={user.full_name || "Usuario"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <FiUser className="text-gray-600" />
                        </div>
                      )}
                      <span className="hidden md:inline text-sm">
                        {user.full_name ||
                          user.email?.split("@")[0] ||
                          "Mi cuenta"}
                      </span>
                      <FiChevronDown
                        size={16}
                        className={`hidden md:block transition-transform duration-200 ${
                          showUserMenu ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                          {user.email}
                        </div>

                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                          role="menuitem"
                        >
                          Mi perfil
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                            role="menuitem"
                          >
                            Panel de control
                          </Link>
                        )}

                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            onClick={handleLogout}
                            role="menuitem"
                          >
                            Cerrar sesión
                          </button>
                        </div>
                      </div>
                    )}
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
