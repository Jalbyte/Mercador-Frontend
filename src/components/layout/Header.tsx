"use client";

import { useRef, useState } from "react";
import {
  FiSearch,
  FiUser,
  FiChevronDown,
  FiLogOut,
  FiEdit,
  FiShoppingBag,
} from "react-icons/fi";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks";
import { useAuth } from "@/context/AuthContext";

const UserDropdown = ({ userName }: { userName: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  const handleLogoutClick = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-700 hover:text-blue-600 focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <FiUser size={16} />
        </div>
        <span className="hidden sm:inline">{userName}</span>
        <FiChevronDown
          className={`transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
          <Link
            href="/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <FiEdit className="mr-2" />
            Editar perfil
          </Link>
          <Link
            href="/purchases"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <FiShoppingBag className="mr-2" />
            Mis compras
          </Link>
          <button
            onClick={handleLogoutClick}
            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            <FiLogOut className="mr-2" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export function Header() {
  const { totalItems, setIsOpen } = useCart();
  const { user, isAuthenticated, loading } = useAuth();
  const userName = user?.name || "Usuario";

  const handleCartClick = () => {
    console.log("Cart button clicked, setting isOpen to true");
    setIsOpen?.(true);
  };

  if (loading) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

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
            {isAuthenticated ? (
              <UserDropdown userName={userName} />
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600"
              >
                <FiUser size={20} />
                <span>Iniciar sesión</span>
              </Link>
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
            <li>
              <a href="#" className="hover:text-blue-600">
                Ofertas
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-600">
                Productos
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
