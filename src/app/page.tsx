"use client";

import Link from "next/link";
import {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiChevronDown,
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
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:3010` : "");

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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {image && (
        <div className="h-48 relative">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <span className="text-sm text-blue-600 font-medium">{category}</span>
        <h3 className="text-xl font-semibold mt-2 mb-1">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-gray-900">
            ${price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Agregar al carrito
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

  // 🔥 Agregar datos quemados al carrito SOLO la primera vez
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
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/products`)
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const body = await res.json()
        // Backend returns { success: true, data: { products: [...], pagination: {...} } }
        const items = body?.data?.products ?? []
        const mapped = items.map((p: any) => ({
          id: p.id,
          title: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          image: p.image_url ?? "/placeholder.png"
        }))
        if (mounted) setProducts(mapped)
      } catch (err: any) {
        if (mounted) setError(err.message ?? 'Failed to load products')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Licencias de Software al Mejor Precio
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Encuentra las mejores ofertas en licencias de software originales
            con garantía y soporte técnico
          </p>
          <button className="bg-white text-blue-700 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
            Ver Ofertas Especiales
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Licencias Populares</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              Categorías
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Ver Todas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && <div className="col-span-full text-center">Cargando productos...</div>}
          {error && <div className="col-span-full text-center text-red-500">{error}</div>}
          {!loading && !error && products.length === 0 && (
            <div className="col-span-full text-center">No hay productos disponibles.</div>
          )}

          {!loading && !error && products.map((license) => (
            <LicenseCard key={license.id} {...license} />
          ))}
        </div>

        {/* 🔥 Sección para probar funciones del carrito */}
        <div className="mt-12 p-6 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            🧪 Zona de Pruebas del Carrito
          </h3>
          <div className="flex gap-4 flex-wrap">
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
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              ➕ Agregar Item Aleatorio
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
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              📦 Agregar Paquete (3 items)
            </button>

            <button
              onClick={() => {
                // Limpiar carrito y reiniciar todo
                clearCart();
                localStorage.removeItem("cart-initialized");
                window.location.reload();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              🗑️ Reset Total
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Mercador</h3>
              <p className="text-gray-400">
                Tu tienda confiable de licencias de software originales al mejor
                precio.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Compañía</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Trabaja con Nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Términos y Condiciones
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Política de Privacidad
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Centro de Ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Preguntas Frecuentes
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Métodos de Pago
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>contacto@mercador.com</li>
                <li>+1 234 567 890</li>
                <li>Armenia, Colombia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p> © 2025 Mercador. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
