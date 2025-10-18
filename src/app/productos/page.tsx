"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { useCart } from "@/hooks";
import {
  FiSearch,
  FiShoppingCart,
  FiFilter,
  FiX,
  FiChevronDown,
} from "react-icons/fi";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string | null;
  stock_quantity: number;
};

function ProductosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{
    min: number;
    max: number;
  }>({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  // Obtener categorías únicas
  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  // Cargar productos
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error(`Error al cargar productos: ${res.status}`);
        const body = await res.json();
        const items = body?.data?.products ?? [];
        setProducts(items);
        setFilteredProducts(items);
      } catch (err: any) {
        setError(err.message ?? "Error al cargar productos");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...products];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoría
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filtro por rango de precio
    filtered = filtered.filter(
      (p) => p.price >= priceRange.min && p.price <= priceRange.max
    );

    // Ordenamiento
    switch (sortBy) {
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, priceRange, sortBy, products]);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || "/placeholder.png",
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange({ min: 0, max: 1000 });
    setSortBy("name-asc");
    setShowPriceFilter(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-32 pb-16">
        <div className="container mx-auto px-3">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Catálogo de Productos
          </h1>
          <p className="text-lg text-blue-100">
            Explora nuestra amplia selección de licencias
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Barra de búsqueda y controles */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          {/* Primera fila: Buscador y botones de acción */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-4">
            {/* Buscador */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar productos por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Controles de la derecha */}
            <div className="flex flex-wrap gap-3">
              {/* Botón de filtro de precio */}
              <button
                onClick={() => setShowPriceFilter(!showPriceFilter)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  showPriceFilter
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FiFilter size={18} />
                Filtro de Precio
                {showPriceFilter && (
                  <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </button>

              {/* Botón limpiar filtros */}
              {(searchTerm || selectedCategory !== "all" || showPriceFilter) && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
                >
                  <FiX size={18} />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Segunda fila: Categoría y Ordenamiento */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Filtro por categoría */}
            <div className="flex items-center gap-3 flex-1">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Categoría:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all"
                      ? "Todas las categorías"
                      : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenamiento */}
            <div className="flex items-center gap-3 flex-1">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Ordenar por:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
                <option value="price-asc">Precio (menor a mayor)</option>
                <option value="price-desc">Precio (mayor a menor)</option>
              </select>
            </div>
          </div>

          {/* Panel de filtro de precio (colapsable) */}
          {showPriceFilter && (
            <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top duration-300">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiFilter className="text-blue-600" />
                  Rango de Precio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Precio mínimo */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Precio mínimo
                      </label>
                      <span className="text-lg font-bold text-blue-600">
                        ${priceRange.min}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="10"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>$0</span>
                      <span>$1000</span>
                    </div>
                  </div>

                  {/* Precio máximo */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Precio máximo
                      </label>
                      <span className="text-lg font-bold text-purple-600">
                        ${priceRange.max}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="10"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>$0</span>
                      <span>$1000</span>
                    </div>
                  </div>
                </div>
                
                {/* Resumen del rango */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Mostrando productos entre{" "}
                    <span className="font-bold text-blue-600">${priceRange.min}</span> y{" "}
                    <span className="font-bold text-purple-600">${priceRange.max}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resultados */}
        <div className="mb-6">
          <p className="text-gray-600">
            Mostrando {filteredProducts.length} de {products.length} productos
          </p>
        </div>

        {/* Grid de productos */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium text-gray-600">
                Cargando productos...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
            <div className="text-red-600 font-medium text-center">{error}</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              No se encontraron productos con los filtros seleccionados
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] border border-gray-100"
              >
                {/* Imagen del producto */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <Image
                    src={product.image_url || "/placeholder.png"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {product.category}
                    </span>
                  </div>
                  {product.stock_quantity === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        Agotado
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Stock: {product.stock_quantity}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock_quantity === 0}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <FiShoppingCart className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-32">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg font-medium text-gray-600">
                Cargando productos...
              </span>
            </div>
          </div>
        </div>
      }
    >
      <ProductosContent />
    </Suspense>
  );
}
