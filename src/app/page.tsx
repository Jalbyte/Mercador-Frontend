"use client";

import Link from "next/link";
import {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiChevronDown,
  FiStar,
  FiShield,
  FiZap,
  FiHeart,
  FiTrendingUp,
} from "react-icons/fi";
import { Header } from "@/components/layout/Header";
import { useCart } from "@/hooks";
import { useEffect, useState } from "react";
import Image from "next/image";

type LicenseCardProps = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
};

// Client-side API base (can be set via NEXT_PUBLIC_API_URL)
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

const LicenseCard = ({
  id,
  title,
  description,
  price,
  category,
  image,
}: LicenseCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id,
      name: title,
      price,
      image,
    });
  };

  return (
    <div className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] border border-gray-100">
      {/* Badge de categoría */}
      <div className="relative">
        {image && (
          <div className="h-48 relative overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            {category}
          </span>
        </div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
          {description}
        </p>

        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ${price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
          >
            <FiShoppingCart className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { addItem, items, clearCart } = useCart();
  const [products, setProducts] = useState<LicenseCardProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agregar datos quemados al carrito SOLO la primera vez
  useEffect(() => {
    // Verificar si ya hemos inicializado los datos de prueba
    const hasInitialized = localStorage.getItem("cart-initialized");

    // Solo agregar datos si nunca hemos inicializado Y el carrito está vacío
    if (!hasInitialized && items.length === 0) {
      const testItems = [
        {
          id: "test-1",
          name: "Photoshop CC 2024",
          price: 29.99,
          image:
            "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop",
        },
        {
          id: "test-2",
          name: "Antivirus Premium",
          price: 15.99,
          image:
            "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop",
        },
      ];

      // Marcar como inicializado
      localStorage.setItem("cart-initialized", "true");

      // Agregar items con un pequeño delay
      setTimeout(() => {
        testItems.forEach((item) => addItem(item));
      }, 1000);
    }
  }, [addItem, items.length]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const body = await res.json();
        // Backend returns { success: true, data: { products: [...], pagination: {...} } }
        const items = body?.data?.products ?? [];
        const mapped = items.map((p: any) => ({
          id: p.id,
          title: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          image:
            p.image_url ??
            process.env.NEXT_PUBLIC_PLACEHOLDER_URL ??
            "/placeholder.png",
        }));
        if (mounted) setProducts(mapped);
      } catch (err: any) {
        if (mounted) setError(err.message ?? "Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section - Mejorado */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white pt-32 pb-20 overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-16 -translate-y-16"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Licencias
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              al Mejor Precio
            </span>
          </h1>

          <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed text-blue-100">
            Encuentra las mejores ofertas en licencias originales con garantía
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
              Explorar Catálogo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section - Nuevo */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <FiShield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Garantía Total</h3>
              <p className="text-gray-600">
                Todas nuestras licencias incluyen garantía y soporte técnico
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <FiZap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Activación Instantánea</h3>
              <p className="text-gray-600">
                Recibe tu licencia y actívala inmediatamente
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <FiStar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Precios Exclusivos</h3>
              <p className="text-gray-600">
                Los mejores precios del mercado con descuentos especiales
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Licencias Populares
            </h2>
            <p className="text-gray-600">Descubre los productos más vendidos</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300 font-medium">
              Categorías
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium">
              Ver Todas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading && (
            <div className="col-span-full text-center py-16">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-lg font-medium text-gray-600">
                  Cargando productos...
                </span>
              </div>
            </div>
          )}
          {error && (
            <div className="col-span-full text-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-red-600 font-medium">{error}</div>
              </div>
            </div>
          )}
          {!loading && !error && products.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md mx-auto">
                <div className="text-gray-600">
                  No hay productos disponibles.
                </div>
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            products.map((license) => (
              <LicenseCard key={license.id} {...license} />
            ))}
        </div>

        {/* 🔥 Sección para probar funciones del carrito - Mejorada */}
        <div className="mt-16 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🧪</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Zona de Pruebas del Carrito
              </h3>
              <p className="text-gray-600">
                Prueba las funcionalidades del carrito de compras
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() =>
                addItem({
                  id: "demo-" + Date.now(),
                  name: "Producto Demo",
                  price: Math.floor(Math.random() * 100) + 10,
                  image:
                    "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400&h=300&fit=crop",
                })
              }
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium flex items-center justify-center gap-2"
            >
              <span className="text-xl">➕</span>
              Agregar Item Aleatorio
            </button>

            <button
              onClick={() => {
                const bulkItems = [
                  {
                    id: "bulk-1",
                    name: "Excel Premium",
                    price: 45.99,
                    image:
                      "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400&h=300&fit=crop",
                  },
                  {
                    id: "bulk-2",
                    name: "PowerPoint Pro",
                    price: 35.99,
                    image:
                      "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400&h=300&fit=crop",
                  },
                  {
                    id: "bulk-3",
                    name: "Teams Business",
                    price: 25.99,
                    image:
                      "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400&h=300&fit=crop",
                  },
                ];
                bulkItems.forEach((item) => addItem(item));
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium flex items-center justify-center gap-2"
            >
              <span className="text-xl">📦</span>
              Agregar Paquete (3 items)
            </button>

            <button
              onClick={() => {
                // Limpiar carrito y reiniciar todo
                clearCart();
                localStorage.removeItem("cart-initialized");
                window.location.reload();
              }}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-4 rounded-xl hover:from-red-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium flex items-center justify-center gap-2"
            >
              <span className="text-xl">🗑️</span>
              Reset Total
            </button>
          </div>
        </div>
      </main>

      {/* Footer - Mejorado */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl translate-x-48 translate-y-48"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-10 h-10 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-white">M</span>
                </div>
                <h3 className="text-2xl font-bold">Mercador</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Tu tienda confiable de licencias de software originales al mejor
                precio, con garantía y soporte técnico.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">Compañía</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Términos y Condiciones
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Política de Privacidad
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">Soporte</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Centro de Ayuda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Contacto
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Preguntas Frecuentes
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    Métodos de Pago
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg">Contacto</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  contacto@mercador.com
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  +57 312 567 890
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Armenia, Colombia
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Mercador. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
