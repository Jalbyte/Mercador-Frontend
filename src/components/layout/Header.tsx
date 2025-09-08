"use client";

import { FiSearch, FiUser, FiChevronDown } from "react-icons/fi";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks";
import { useEffect, useState } from "react";
import ProductAdmin from "@/components/products/ProductAdmin";

// Prefer explicit env var; if missing, assume backend runs on same host at port 3010 (dev default).
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3010` : '')

export function Header() {
  const { totalItems, setIsOpen, isOpen } = useCart();
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const handleCartClick = () => {
    console.log("Cart button clicked, setting isOpen to true");
    setIsOpen?.(true);
  };

  useEffect(() => {
    let mounted = true
  async function checkAdmin() {
      setCheckingAdmin(true)
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
        if (!mounted) return
        if (!res.ok) {
          setIsAdmin(false)
          setIsAuthenticated(false)
          setUserName(null)
          setUserImage(null)
        } else {
          const j = await res.json().catch(() => null)
          // Backend returns { success: true, data: { role: string, ... } }
          const role = j?.data?.role ?? j?.data?.user_metadata?.role ?? null
          const name = j?.data?.full_name ?? j?.data?.user_metadata?.full_name ?? j?.data?.email ?? null
          const image = j?.data?.image ?? null
          setIsAdmin(role === 'admin')
          setIsAuthenticated(true)
          setUserName(name)
          setUserImage(image)
        }
      } catch (err) {
        setIsAdmin(false)
        setIsAuthenticated(false)
        setUserName(null)
      } finally {
        if (mounted) setCheckingAdmin(false)
      }
    }
    checkAdmin()
  const onAuthChanged = () => { if (mounted) checkAdmin() }
  window.addEventListener('auth-changed', onAuthChanged as EventListener)
  return () => { mounted = false; window.removeEventListener('auth-changed', onAuthChanged as EventListener) }
  }, [])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Mercador
          </Link>

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
                      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
                    } catch (e) {
                      // ignore
                    }
                    // Refresh auth state: simple approach is reload
                    setIsAuthenticated(false)
                    setIsAdmin(false)
                    setUserName(null)
                    setUserImage(null)
                    window.location.href = '/'
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
              className="relative p-2 text-gray-700 hover:text-blue-600"
              aria-label="Carrito de compras"
              type="button"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

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

      {showAdmin && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/50">
          <div className="bg-white w-full max-w-6xl h-[90vh] overflow-auto rounded shadow-lg">
            <div className="p-3 border-b flex items-center justify-between">
              <h4 className="font-semibold">Admin - Productos</h4>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 bg-gray-200 rounded"
                  onClick={() => setShowAdmin(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="p-4">
              <ProductAdmin />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
