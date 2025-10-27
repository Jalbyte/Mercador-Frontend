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
  license_type?: number | string;
  license_category?: {
    id: number;
    type: string;
  } | null;
  image_url?: string | null;
  stock_quantity: number;
};

type LicenseType = {
  id: string;
  type: string;
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{
    min: number;
    max: number;
  }>({ min: 0, max: 500000 });
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 12;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  // Estados para tipos de licencia
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [loadingLicenseTypes, setLoadingLicenseTypes] = useState(false);

  // Cargar tipos de licencia
  useEffect(() => {
    async function fetchLicenseTypes() {
      setLoadingLicenseTypes(true);
      try {
        const res = await fetch(`${API_BASE}/products/license-types`);
        if (res.ok) {
          const body = await res.json();
          if (body?.success && body?.data) {
            setLicenseTypes(body.data);
          }
        }
      } catch (err) {
        console.error("Error al cargar tipos de licencia:", err);
      } finally {
        setLoadingLicenseTypes(false);
      }
    }

    fetchLicenseTypes();
  }, []);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Cargar productos con paginación del servidor
  useEffect(() => {
    let controller: AbortController | null = null;
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        // If a license filter is active, fetch all products so we can filter client-side
        const hasLicenseFilter = selectedCategory !== "all";

        if (hasLicenseFilter) {
          // Request a large limit (server should support) to retrieve full list for client filtering
          const signal = (controller = new AbortController()).signal;
          const resAll = await fetch(
            `${API_BASE}/products?search=${encodeURIComponent(
              debouncedSearch || ""
            )}&page=1&limit=10000`,
            { signal }
          );
          if (!resAll.ok) throw new Error(`Error al cargar productos: ${resAll.status}`);
          const bodyAll = await resAll.json();
          const allItems = bodyAll?.data?.products ?? [];
          setProducts(allItems);
          // We'll allow the local filters effect to compute filteredProducts
          // but set a provisional total so pagination UI can render immediately
          setTotalProducts(allItems.length);
          setFilteredProducts(allItems);
          setLoading(false);
          return;
        }

        // Normal server-paginated fetch when no license filter is applied
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });

        if (searchTerm) params.append("search", searchTerm);
        // Do not append selectedCategory here because server-side support is inconsistent

  const signal = (controller = new AbortController()).signal;
  const res = await fetch(`${API_BASE}/products?${params.toString()}`, { signal });
        if (!res.ok) throw new Error(`Error al cargar productos: ${res.status}`);
        const body = await res.json();
        const items = body?.data?.products ?? [];
        const total = body?.data?.pagination?.total ?? items.length;

        setProducts(items);
        setFilteredProducts(items);
        setTotalProducts(total);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // request was cancelled - just return silently
          return;
        }
        setError(err.message ?? "Error al cargar productos");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();

    return () => {
      if (controller) controller.abort();
    };
  }, [currentPage, debouncedSearch, selectedCategory]);

  // Debounce searchTerm -> debouncedSearch (500ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Aplicar filtros locales (tipo de licencia, precio y ordenamiento)
  useEffect(() => {
    let filtered = [...products];

    // Filtro por tipo de licencia (en caso de que el backend no lo aplique)
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => {
        const licenseId =
          typeof p.license_type === "number"
            ? p.license_type.toString()
            : p.license_type ?? undefined;
        const fallbackId = p.license_category?.id?.toString();
        return licenseId === selectedCategory || fallbackId === selectedCategory;
      });
    }

    // Filtro por rango de precio (local)
    filtered = filtered.filter(
      (p) => p.price >= priceRange.min && p.price <= priceRange.max
    );

    // Ordenamiento (local)
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
  }, [selectedCategory, priceRange, sortBy, products]);

  // When we filter client-side (selectedCategory active), make totalProducts follow filtered count
  useEffect(() => {
    if (selectedCategory !== "all") {
      setTotalProducts(filteredProducts.length);
    }
  }, [filteredProducts, selectedCategory]);

  // Compute visible products for current page (client-side pagination when filtering)
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddToCart = (product: Product) => {
    const item = {
      // Normalizar id como string para mantener consistencia con items desde backend
      id: String(product.id),
      name: product.name,
      price: product.price,
      image: product.image_url || "/placeholder.png",
      // Pasamos el stock disponible para que el hook no permita excederlo desde el front
      max_quantity: Number(product.stock_quantity ?? 0),
    };
    // Loguear el product original y el item normalizado para depuración
    console.debug("handleAddToCart: product, item", { product, item });
    addItem(item);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange({ min: 0, max: 500000 });
    setSortBy("name-asc");
    setShowPriceFilter(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-24 sm:pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4">
            Catálogo de Productos
          </h1>
          <p className="text-base sm:text-lg text-blue-100">
            Explora nuestra amplia selección de licencias
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Barra de búsqueda y controles */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6 md:mb-8">
          {/* Primera fila: Buscador y botones de acción */}
          <div className="flex flex-col gap-4 mb-4">
            {/* Buscador */}
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
              />
            </div>

            {/* Controles - Ahora en fila separada */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              {/* Botón de filtro de precio */}
              <button
                onClick={() => setShowPriceFilter(!showPriceFilter)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 text-sm md:text-base ${
                  showPriceFilter
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FiFilter size={18} />
                <span className="whitespace-nowrap">Filtro de Precio</span>
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
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors text-sm md:text-base"
                >
                  <FiX size={18} />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* Segunda fila: Categoría (Tipo de Licencia) y Ordenamiento */}
          <div className="flex flex-col gap-4">
            {/* Filtro por tipo de licencia (Categoría) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Tipo de Licencia:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm md:text-base"
                disabled={loadingLicenseTypes}
              >
                <option value="all">Todos los tipos</option>
                {licenseTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenamiento */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Ordenar por:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm md:text-base"
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
                        ${priceRange.min.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="500000"
                      step="10000"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>$0</span>
                      <span>$500.000</span>
                    </div>
                  </div>

                  {/* Precio máximo */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Precio máximo
                      </label>
                      <span className="text-lg font-bold text-purple-600">
                        ${priceRange.max.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="500000"
                      step="10000"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>$0</span>
                      <span>$500.000</span>
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
            Mostrando <span className="font-semibold">{filteredProducts.length}</span> de{" "}
            <span className="font-semibold">{totalProducts}</span> productos
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
          <>
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
                        ${product.price.toLocaleString('es-CO')}
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

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
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
