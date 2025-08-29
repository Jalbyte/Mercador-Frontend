'use client';

import { FiSearch, FiUser, FiChevronDown } from 'react-icons/fi';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/hooks';

export function Header() {
  const { totalItems, setIsOpen } = useCart();

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
            <button className="flex items-center gap-1 text-gray-700 hover:text-blue-600">
              <FiUser size={20} />
              <span>Iniciar sesión</span>
            </button>
            <button
              onClick={() => setIsOpen(true)}
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
            <li><Link href="/" className="hover:text-blue-600">Inicio</Link></li>
            <li className="flex items-center gap-1">
              <a href="#" className="hover:text-blue-600">Categorías</a>
              <FiChevronDown size={16} />
            </li>
            <li><a href="#" className="hover:text-blue-600">Ofertas</a></li>
            <li><a href="#" className="hover:text-blue-600">Nuevo</a></li>
            <li><a href="#" className="hover:text-blue-600">Soporte</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
