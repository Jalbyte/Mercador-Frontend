"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminPointsManagement } from "@/components/admin/AdminPointsManagement";
import {
  FiLoader,
  FiArrowLeft,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiUpload,
  FiTrendingUp,
  FiShoppingCart,
  FiPackage,
  FiUsers,
  FiDollarSign,
  FiAlertCircle,
  FiActivity,
  FiBarChart2,
  FiGift,
} from "react-icons/fi";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convertFileToBase64 } from "@/lib/utils.client";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProductsList } from "@/components/dashboard/TopProductsList";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { CategoryDistribution } from "@/components/dashboard/CategoryDistribution";
import { RecentUsers } from "@/components/dashboard/RecentUsers";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Tipos existentes del ProductAdmin
type ProductKeyInput = {
  license_key: string;
  status?: string;
  expiration_date?: string;
  activation_limit?: number;
};

type ProductKey = {
  id: string;
  product_id: string;
  license_key: string;
  user_id?: string;
  status?: string;
  expiration_date?: string;
  activation_limit?: number;
  created_at?: string;
  updated_at?: string;
};

type User = {
  id: string;
  full_name: string;
  email: string;
  country?: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  license_type?: number;
  license_category?: {
    id: number;
    type: string;
  } | null;
  image_url?: string | null;
  stock_quantity: number;
  available_keys?: number; // Nuevo campo calculado del backend
  created_at?: string;
  updated_at?: string;
};

type LicenseType = {
  id: string;
  type: string;
};

export default function DashboardPage() {
  // Función helper para obtener el stock (prioriza available_keys si está disponible)
  const getProductStock = (product: Product): number => {
    return typeof product.available_keys === 'number'
      ? product.available_keys
      : product.stock_quantity;
  };

  // Lista de países comunes
  const countries = [
    "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela", "Estados Unidos", "Canadá", "España", "Francia", "Italia", "Reino Unido", "Alemania", "Portugal", "Otros"
  ];

  // Estado para el formulario de edición de usuario
  const [editForm, setEditForm] = useState<{ full_name: string; email: string; country: string }>({
    full_name: "",
    email: "",
    country: "",
  });
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "products" | "users" | "returns" | "reports" | "points"
  >("dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados del ProductAdmin existente
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [licenseType, setLicenseType] = useState<number | "">("");
  const [stockQuantity, setStockQuantity] = useState<number | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Estados para tipos de licencia
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [loadingLicenseTypes, setLoadingLicenseTypes] = useState(false);

  // Estados para product keys
  const [productKeys, setProductKeys] = useState<ProductKeyInput[]>([]);
  const [newKey, setNewKey] = useState("");
  const [randomCount, setRandomCount] = useState<number>(1);
  const [existingKeys, setExistingKeys] = useState<ProductKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  // Estados para filtros de productos
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLicenseFilter, setSelectedLicenseFilter] = useState<string>("all");

  // Estado para paginación de productos
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  // Estados para estadísticas del dashboard
  type DashboardStats = {
    totalSales: number;
    totalRevenue: number;
    totalProducts: number;
    totalUsers: number;
    lowStockProducts: number;
    recentOrders: number;
    topSellingProduct: string | null;
    averageOrderValue: number;
  };

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    lowStockProducts: 0,
    recentOrders: 0,
    topSellingProduct: null,
    averageOrderValue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Estados para el nuevo dashboard analítico
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Datos de estadísticas generales con tendencias
  const [overviewStats, setOverviewStats] = useState({
    totalRevenue: { value: 0, trend: 0, trendLabel: "" },
    totalOrders: { value: 0, trend: 0, trendLabel: "" },
    totalUsers: { value: 0, trend: 0, trendLabel: "" },
    totalProducts: { value: 0, trend: 0, trendLabel: "" },
  });

  // Datos de ventas para gráficos
  const [salesData, setSalesData] = useState<
    Array<{ date: string; revenue: number; orders: number }>
  >([]);

  // Top productos
  const [topProducts, setTopProducts] = useState<
    Array<{ id: string; name: string; sales: number; revenue: number; stock_quantity: number }>
  >([]);

  // Órdenes recientes
  const [recentOrdersData, setRecentOrdersData] = useState<
    Array<{
      id: string;
      user: {
        id: string;
        full_name: string;
        email: string;
      };
      total_amount: number;
      status: string;
      items_count: number;
      created_at: string;
    }>
  >([]);

  // Alertas de stock bajo
  const [lowStockItems, setLowStockItems] = useState<
    Array<{
      stock_quantity: number;
      id: string;
      name: string;
      image_url: string;
    }>
  >([]);

  // Distribución por categorías
  const [categoryData, setCategoryData] = useState<
    Array<{ category: string; revenue: number; orders: number; percentage: number }>
  >([]);

  // Usuarios recientes
  const [recentUsersData, setRecentUsersData] = useState<
    Array<{
      id: string;
      full_name: string;
      email: string;
      created_at: string;
      total_orders: number;
      total_spent: number;
    }>
  >([]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentProductPage(1);
  }, [searchQuery, selectedLicenseFilter]);

  useEffect(() => {
    let mounted = true;

    async function checkAdminAccess() {
      // Esperar a que termine la carga de autenticación
      if (authLoading) return;

      if (!mounted) return;

      // Si no hay usuario o no es admin, redirigir
      if (!user) {
        router.push("/login");
        return;
      }

      if (user.role !== "admin") {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      setUserName(user.full_name || user.email);
      fetchLicenseTypes();
      fetchProducts();
      setLoading(false);
    }

    checkAdminAccess();
    return () => {
      mounted = false;
    };
  }, [router, user, authLoading]);

  // Recargar productos cuando cambian filtros o página
  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [currentProductPage, searchQuery, selectedLicenseFilter]);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentProductPage(1);
  }, [searchQuery, selectedLicenseFilter]);

  // Funciones para gestión de usuarios
  async function fetchUsers() {
    try {
      setLoadingUsers(true);
      const response = await fetch(`${API_BASE}/admin/users`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        // Filtrar por búsqueda
        const filtered = searchTerm
          ? data.filter((user: User) =>
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          : data;
        setUsers(filtered);
        setTotalPages(Math.ceil(filtered.length / 12));
      } else {
        setUsers([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (activeSection === "users") {
      fetchUsers();
    }
  }, [activeSection, currentPage, searchTerm]);

  // Cargar estadísticas cuando se entra a la sección dashboard
  useEffect(() => {
    if (activeSection === "dashboard" && isAdmin) {
      fetchDashboardStats();
    }
  }, [activeSection, isAdmin]);

  // Cargar datos analíticos cuando cambia el período o se entra al dashboard
  useEffect(() => {
    if (activeSection === "dashboard" && isAdmin) {
      fetchAnalyticsData();
    }
  }, [activeSection, isAdmin, selectedPeriod]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserModal(true);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      country: user.country || "",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      try {
        const resp = await fetch(`${API_BASE}/admin/users/${userId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (resp.ok) {
          fetchUsers();
          alert("Usuario eliminado correctamente");
        } else {
          const data = await resp.json().catch(() => ({}));
          alert(data?.error || "Error al eliminar el usuario");
        }
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        alert("Error al eliminar el usuario");
      }
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      const resp = await fetch(`${API_BASE}/admin/users/${editingUser.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editForm.full_name,
          email: editForm.email,
          country: editForm.country,
        }),
      });
      if (resp.ok) {
        fetchUsers();
        setShowUserModal(false);
        setEditingUser(null);
        alert("Usuario actualizado correctamente");
      } else {
        const data = await resp.json().catch(() => ({}));
        alert(data?.error || "Error al actualizar el usuario");
      }
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      alert("Error al actualizar el usuario");
    }
  };
  // Modal de edición de usuario
  const renderUserEditModal = () => (
    <Modal
      open={showUserModal}
      onClose={() => {
        setShowUserModal(false);
        setEditingUser(null);
      }}
      title="Editar Usuario"
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSaveUser();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editForm.full_name}
            onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="email"
            value={editForm.email}
            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={editForm.country}
            onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
            required
          >
            <option value="">Selecciona un país</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowUserModal(false);
              setEditingUser(null);
            }}
          >
            Cancelar
          </Button>
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
  // ...en el render principal, antes de los modales de producto:
  { renderUserEditModal() }

  // Funciones del ProductAdmin existente
  async function fetchLicenseTypes() {
    setLoadingLicenseTypes(true);
    try {
      const resp = await fetch(`${API_BASE}/products/license-types`, {
        credentials: "include",
      });

      if (!resp.ok) {
        console.error("Failed to fetch license types:", resp.status);
        return;
      }

      const json = await resp.json();
      if (json?.success && json?.data) {
        setLicenseTypes(json.data);
      }
    } catch (e: any) {
      console.error("Error fetching license types:", e);
    } finally {
      setLoadingLicenseTypes(false);
    }
  }

  // Función para cargar estadísticas del dashboard
  async function fetchDashboardStats() {
    setLoadingStats(true);
    try {
      // Obtener productos
      const productsResp = await fetch(`${API_BASE}/products`, {
        credentials: "include",
      });
      const productsData = await productsResp.json();
      const allProducts = productsData?.data?.products || [];

      // Obtener usuarios
      const usersResp = await fetch(`${API_BASE}/admin/users`, {
        credentials: "include",
      });
      const usersData = await usersResp.json();
      const allUsers = Array.isArray(usersData) ? usersData : [];

      // Obtener órdenes (asumiendo que existe el endpoint)
      let allOrders = [];
      let totalRevenue = 0;
      let recentOrdersCount = 0;
      let topProduct = null;

      try {
        const ordersResp = await fetch(`${API_BASE}/admin/orders`, {
          credentials: "include",
        });
        if (ordersResp.ok) {
          const ordersData = await ordersResp.json();
          allOrders = ordersData?.data || ordersData || [];
          console.log(allOrders)
          setRecentOrdersData(allOrders);

          // Calcular ingresos totales
          totalRevenue = allOrders.reduce((sum: number, order: any) => {
            return sum + (order.total_amount || 0);
          }, 0);

          // Contar órdenes recientes (últimos 30 días)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          recentOrdersCount = allOrders.filter((order: any) => {
            const orderDate = new Date(order.created_at);
            return orderDate >= thirtyDaysAgo;
          }).length;

          // Encontrar producto más vendido
          const productSales: { [key: string]: { name: string; count: number } } = {};
          allOrders.forEach((order: any) => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                const productName = item.product_name || "Desconocido";
                if (!productSales[productName]) {
                  productSales[productName] = { name: productName, count: 0 };
                }
                productSales[productName].count += item.quantity || 1;
              });
            }
          });

          const sortedProducts = Object.values(productSales).sort((a, b) => b.count - a.count);
          topProduct = sortedProducts.length > 0 ? sortedProducts[0].name : null;
        }
      } catch (e) {
        console.log("No se pudieron cargar las órdenes:", e);
      }

      // Contar productos con stock bajo (menos de 5 unidades)
      const lowStock = allProducts.filter((p: Product) => p.stock_quantity < 5).length;

      // Calcular promedio de valor de orden
      const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

      setDashboardStats({
        totalSales: allOrders.length,
        totalRevenue,
        totalProducts: allProducts.length,
        totalUsers: allUsers.length,
        lowStockProducts: lowStock,
        recentOrders: recentOrdersCount,
        topSellingProduct: topProduct,
        averageOrderValue: avgOrderValue,
      });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  }


  // Función para cargar datos analíticos del dashboard
  async function fetchAnalyticsData() {
    setAnalyticsLoading(true);
    try {
      // Fetch overview stats with trends
      try {
        const overviewResp = await fetch(
          `${API_BASE}/admin/stats/overview?period=${selectedPeriod}`,
          { credentials: "include" }
        );
        if (overviewResp.ok) {
          let data = await overviewResp.json();
          data = data.data
          setOverviewStats({
            totalRevenue: {
              value: data.totalRevenue || 0,
              trend: data.revenueGrowth || 0,
              trendLabel: `vs período anterior`,
            },
            totalOrders: {
              value: data.totalOrders || 0,
              trend: data.ordersGrowth || 0,
              trendLabel: `vs período anterior`,
            },
            totalUsers: {
              value: data.totalUsers || 0,
              trend: data.usersGrowth || 0,
              trendLabel: `vs período anterior`,
            },
            totalProducts: {
              value: data.totalProducts || 0,
              trend: data.productsGrowth || 0,
              trendLabel: `vs período anterior`,
            },
          });
        }
      } catch (e) {
        console.log("No se pudo cargar overview stats:", e);
      }

      // Fetch sales data for charts
      try {
        const salesResp = await fetch(
          `${API_BASE}/admin/stats/sales?period=${selectedPeriod}`,
          { credentials: "include" }
        );
        if (salesResp.ok) {
          const data = await salesResp.json();
          setSalesData(data.data.sales || []);
        }
      } catch (e) {
        console.log("No se pudo cargar sales data:", e);
      }

      // Fetch top products
      try {
        const topProductsResp = await fetch(
          `${API_BASE}/admin/stats/top-products?limit=10`,
          { credentials: "include" }
        );
        if (topProductsResp.ok) {
          const data = await topProductsResp.json();
          setTopProducts(data.data || []);
        }
      } catch (e) {
        console.log("No se pudo cargar top products:", e);
      }

      // Fetch recent orders
      try {
        const ordersResp = await fetch(
          `${API_BASE}/admin/orders/recent?limit=10`,
          { credentials: "include" }
        );
        if (ordersResp.ok) {
          const data = await ordersResp.json();
        }
      } catch (e) {
        console.log("No se pudo cargar recent orders:", e);
      }

      // Fetch low stock alerts
      try {
        const lowStockResp = await fetch(
          `${API_BASE}/admin/stats/low-stock?threshold=10`,
          { credentials: "include" }
        );
        if (lowStockResp.ok) {
          const data = await lowStockResp.json();
          setLowStockItems(data.data || []);
        }
      } catch (e) {
        console.log("No se pudo cargar low stock alerts:", e);
      }

      // Fetch category distribution
      try {
        const categoryResp = await fetch(
          `${API_BASE}/admin/stats/top-categories`,
          { credentials: "include" }
        );
        if (categoryResp.ok) {
          const data = await categoryResp.json();
          setCategoryData(data.data || []);
        }
      } catch (e) {
        console.log("No se pudo cargar category data:", e);
      }

      // Fetch recent users
      try {
        const usersResp = await fetch(
          `${API_BASE}/admin/stats/recent-users?limit=10`,
          { credentials: "include" }
        );
        if (usersResp.ok) {
          const data = await usersResp.json();
          setRecentUsersData(data.data || []);
        }
      } catch (e) {
        console.log("No se pudo cargar recent users:", e);
      }
    } catch (error) {
      console.error("Error al cargar datos analíticos:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function fetchProducts() {
    setLoadingProducts(true);
    setError(null);
    try {
      // If a license filter is active, fetch all products and filter client-side
      const hasLicenseFilter = selectedLicenseFilter !== "all";

      if (hasLicenseFilter) {
        const respAll = await fetch(
          `${API_BASE}/products?search=${encodeURIComponent(searchQuery || "")}&page=1&limit=10000`
        );
        let jsonAll: any = undefined;
        try {
          jsonAll = await respAll.json();
        } catch (parseErr) {
          const text = await respAll.text().catch(() => "");
          throw new Error(
            `Server returned ${respAll.status} ${respAll.statusText}: ${text || "non-JSON response"}`
          );
        }

        if (!respAll.ok || !jsonAll?.success) {
          const errObj = jsonAll?.error ?? jsonAll?.message ?? "Failed to fetch products";
          throw new Error(typeof errObj === 'string' ? errObj : JSON.stringify(errObj));
        }

        setProducts(jsonAll.data.products ?? []);
        // Let local filteredProducts (computed below) drive the visible list
        setTotalProductsCount((jsonAll.data.products ?? []).length);
        setLoadingProducts(false);
        return;
      }

      // Construir query params con paginación - solo búsqueda al servidor
      const params = new URLSearchParams({
        page: currentProductPage.toString(),
        limit: '12',
      });

      if (searchQuery) params.append('search', searchQuery);

      const resp = await fetch(`${API_BASE}/products?${params.toString()}`);
      let json: any = undefined;
      try {
        json = await resp.json();
      } catch (parseErr) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `Server returned ${resp.status} ${resp.statusText}: ${text || "non-JSON response"
          }`
        );
      }

      if (!resp.ok || !json?.success) {
        const errObj =
          json?.error ?? json?.message ?? "Failed to fetch products";
        const errMsg = Array.isArray(errObj)
          ? errObj
            .map((it: any) => it?.message ?? JSON.stringify(it))
            .join("\n")
          : typeof errObj === "string"
            ? errObj
            : errObj?.message ?? JSON.stringify(errObj);
        setError(errMsg || "Failed to fetch products");
        setProducts([]);
        setTotalProductsCount(0);
      } else {
        setProducts(json.data.products ?? []);
        setTotalProductsCount(json.data.pagination?.total ?? 0);
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoadingProducts(false);
    }
  }

  async function fetchProductKeys(productId: string) {
    setLoadingKeys(true);
    try {
      const resp = await fetch(`${API_BASE}/products/${productId}/keys`);
      const json = await resp.json();
      if (resp.ok && json?.success) {
        setExistingKeys(json.data || []);
      } else {
        setExistingKeys([]);
      }
    } catch {
      setExistingKeys([]);
    } finally {
      setLoadingKeys(false);
    }
  }

  // Generador de claves aleatorias
  function generateRandomKey(length = 16, seq?: number) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let key = "";
    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (typeof seq === "number") {
      const s = String(seq).padStart(4, "0");
      return `${key}-${s}`;
    }
    return key;
  }

  // Función para añadir claves aleatorias
  async function handleAddRandomKey(count = 1) {
    if (count <= 0) return;

    if (editingId) {
      setLoadingKeys(true);
      setError(null);
      try {
        const created: ProductKey[] = [];
        const startIdx = (existingKeys?.length || 0) + 1;
        for (let i = 0; i < count; i++) {
          const seq = startIdx + i;
          const license = generateRandomKey(16, seq);
          const resp = await fetch(`${API_BASE}/products/${editingId}/keys`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ license_key: license }),
          });
          let json: any;
          try {
            json = await resp.json();
          } catch (e) {
            const text = await resp.text().catch(() => "");
            throw new Error(
              `Server returned ${resp.status} ${resp.statusText}: ${text || "non-JSON response"
              }`
            );
          }
          if (!resp.ok || !json?.success) {
            const msg = json?.error ?? json?.message ?? "Failed to create key";
            throw new Error(
              Array.isArray(msg)
                ? msg
                  .map((m: any) => m?.message ?? JSON.stringify(m))
                  .join("\n")
                : typeof msg === "string"
                  ? msg
                  : JSON.stringify(msg)
            );
          }
          created.push(json.data);
        }
        setExistingKeys((prev) => [...created, ...(prev || [])]);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoadingKeys(false);
      }
      return;
    }

    setProductKeys((prev) => {
      const startIdx = prev.length + 1;
      const newKeys: ProductKeyInput[] = [];
      for (let i = 0; i < count; i++) {
        const seq = startIdx + i;
        newKeys.push({ license_key: generateRandomKey(16, seq) });
      }
      return [...prev, ...newKeys];
    });
  }

  // Función para añadir clave manual
  async function handleAddManualKey() {
    if (!newKey.trim()) return;

    if (editingId) {
      setLoadingKeys(true);
      setError(null);
      try {
        const resp = await fetch(`${API_BASE}/products/${editingId}/keys`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ license_key: newKey.trim() }),
        });
        let json: any;
        try {
          json = await resp.json();
        } catch (e) {
          const text = await resp.text().catch(() => "");
          throw new Error(
            `Server returned ${resp.status} ${resp.statusText}: ${text || "non-JSON response"
            }`
          );
        }
        if (!resp.ok || !json?.success) {
          const msg = json?.error ?? json?.message ?? "Failed to create key";
          throw new Error(
            Array.isArray(msg)
              ? msg.map((m: any) => m?.message ?? JSON.stringify(m)).join("\n")
              : typeof msg === "string"
                ? msg
                : JSON.stringify(msg)
          );
        }
        setExistingKeys((prev) => [json.data, ...(prev || [])]);
        setNewKey("");
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoadingKeys(false);
      }
      return;
    }

    setProductKeys((prev) => [...prev, { license_key: newKey.trim() }]);
    setNewKey("");
  }

  function handleRemoveKey(idx: number) {
    setProductKeys((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleDeleteExistingKey(keyId: string) {
    if (!editingId) return;
    if (!confirm("¿Eliminar esta clave?")) return;
    setLoadingKeys(true);
    setError(null);
    try {
      const resp = await fetch(
        `${API_BASE}/products/${editingId}/keys/${keyId}`,
        { method: "DELETE" }
      );
      let json: any;
      try {
        json = await resp.json();
      } catch (e) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `Server returned ${resp.status} ${resp.statusText}: ${text || "non-JSON response"
          }`
        );
      }
      if (!resp.ok || !json?.success) {
        const msg = json?.error ?? json?.message ?? "Failed to delete key";
        throw new Error(
          Array.isArray(msg)
            ? msg.map((m: any) => m?.message ?? JSON.stringify(m)).join("\n")
            : typeof msg === "string"
              ? msg
              : JSON.stringify(msg)
        );
      }
      setExistingKeys((prev) => (prev || []).filter((k) => k.id !== keyId));
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoadingKeys(false);
    }
  }

  // Manejo de archivos
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setImageError(null);

    if (!f) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

    if (!ALLOWED_TYPES.includes(f.type)) {
      setImageError("Tipo de imagen no permitido. Usa PNG, JPEG, WEBP.");
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (f.size > MAX_SIZE_BYTES) {
      setImageError("Imagen demasiado grande. Máximo 2 MB.");
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageFile(f);
    const url = URL.createObjectURL(f);
    setImagePreview(url);
  }

  // Envío del formulario
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoadingProducts(true);
    setError(null);

    try {
      const payload: any = {
        name,
        description,
        price: typeof price === "number" ? price : Number(price),
        category,
        license_type: licenseType ? String(licenseType) : undefined,
        stock_quantity:
          typeof stockQuantity === "number"
            ? stockQuantity
            : Number(stockQuantity),
      };

      if (!editingId && productKeys.length > 0) {
        payload.product_keys = productKeys;
      }

      if (imageFile) {
        const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
        const MAX_SIZE_BYTES = 2 * 1024 * 1024;
        if (!ALLOWED_TYPES.includes(imageFile.type))
          throw new Error("Tipo de imagen no permitido (cliente)");
        if (imageFile.size > MAX_SIZE_BYTES)
          throw new Error("Imagen demasiado grande (cliente)");

        const dataUrl = await convertFileToBase64(imageFile);
        payload.image_url = dataUrl;
      } else if (
        imagePreview &&
        !imagePreview.startsWith("blob:") &&
        !imagePreview.startsWith("data:")
      ) {
        payload.image_url = imagePreview;
      }

      if (!payload.image_url) delete payload.image_url;

      let resp;
      if (editingId) {
        resp = await fetch(`${API_BASE}/products/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        resp = await fetch(`${API_BASE}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      let json: any = undefined;
      try {
        json = await resp.json();
      } catch (parseErr) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `Server returned ${resp.status} ${resp.statusText}: ${text || "non-JSON response"
          }`
        );
      }

      if (!resp.ok || !json?.success) {
        const errObj =
          json?.error ??
          json?.message ??
          `Failed to save product (status ${resp.status})`;
        const errMsg = Array.isArray(errObj)
          ? errObj
            .map((it: any) => it?.message ?? JSON.stringify(it))
            .join("\n")
          : typeof errObj === "string"
            ? errObj
            : errObj?.message ?? JSON.stringify(errObj);
        setError(errMsg || `Failed to save product (status ${resp.status})`);
      } else {
        await fetchProducts();
        resetForm();
        setShowCreateModal(false);
        setShowEditModal(false);
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoadingProducts(false);
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
      });
      let json: any = undefined;
      try {
        json = await resp.json();
      } catch (parseErr) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `Server returned ${resp.status} ${resp.statusText}: ${text || "non-JSON response"
          }`
        );
      }

      if (!resp.ok || !json?.success) {
        const errObj = json?.error ?? json?.message ?? "Failed to delete";
        const errMsg = Array.isArray(errObj)
          ? errObj
            .map((it: any) => it?.message ?? JSON.stringify(it))
            .join("\n")
          : typeof errObj === "string"
            ? errObj
            : errObj?.message ?? JSON.stringify(errObj);
        setError(errMsg || "Failed to delete");
      } else {
        await fetchProducts();
        setShowDeleteConfirmModal(false);
        setProductToDelete(null);
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setIsDeleting(false);
    }
  }

  function confirmDelete(id: string, name: string) {
    setProductToDelete({ id, name });
    setShowDeleteConfirmModal(true);
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description);
    setPrice(p.price);
    setCategory(p.category);
    setLicenseType(p.license_type || "");
    setStockQuantity(p.stock_quantity);
    setImagePreview(p.image_url ?? null);
    setImageFile(null);
    setProductKeys([]);
    setExistingKeys([]);
    fetchProductKeys(p.id);
    setShowEditModal(true);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setLicenseType("");
    setStockQuantity("");
    setImageFile(null);
    setImagePreview(null);
    setProductKeys([]);
    setNewKey("");
    setExistingKeys([]);
    setError(null);
    setImageError(null);
  }

  function openCreateModal() {
    resetForm();
    setShowCreateModal(true);
  }

  // Filtrar productos por tipo de licencia en caso de que el backend no lo aplique
  const filteredProducts =
    selectedLicenseFilter === "all"
      ? products
      : products.filter((product) => {
        const licenseId =
          typeof product.license_type === "number"
            ? product.license_type.toString()
            : product.license_type ?? undefined;
        const fallbackId = product.license_category?.id
          ? product.license_category.id.toString()
          : undefined;
        return (
          licenseId === selectedLicenseFilter ||
          fallbackId === selectedLicenseFilter
        );
      });

  // Paginación de productos (calculada desde el servidor cuando no hay filtro)
  const productsPerPage = 12;
  // When filtered client-side, make totalProductsCount reflect filtered length
  const effectiveTotal = selectedLicenseFilter === "all" ? totalProductsCount : filteredProducts.length;
  const totalProductPages = Math.ceil(effectiveTotal / productsPerPage);

  // Visible slice for current page (client-side pagination when filtered)
  const displayedProducts = filteredProducts.slice(
    (currentProductPage - 1) * productsPerPage,
    currentProductPage * productsPerPage
  );

  // Componente del formulario mejorado para el modal
  const renderProductForm = () => (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Keys Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Claves de Producto
          </label>

          {!editingId ? (
            // Crear producto - claves locales
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agregar clave manual"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
                <Button type="button" onClick={handleAddManualKey} size="sm">
                  Añadir
                </Button>
                <input
                  type="number"
                  min={1}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={randomCount}
                  onChange={(e) => setRandomCount(Number(e.target.value) || 1)}
                  title="Cantidad de claves a generar"
                />
                <Button
                  type="button"
                  onClick={() => handleAddRandomKey(randomCount)}
                  variant="secondary"
                  size="sm"
                >
                  Random
                </Button>
              </div>

              {productKeys.length > 0 && (
                <div className="max-h-32 overflow-auto border border-gray-200 rounded-md p-3 bg-white">
                  {productKeys.map((k, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="font-mono text-xs text-gray-700">
                        {k.license_key}
                      </span>
                      <button
                        type="button"
                        className="ml-2 text-red-500 hover:text-red-700 text-xs"
                        onClick={() => handleRemoveKey(idx)}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Puedes añadir varias claves antes de crear el producto.
              </p>
            </div>
          ) : (
            // Editar producto - claves existentes
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agregar clave manual"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
                <Button type="button" onClick={handleAddManualKey} size="sm">
                  Añadir
                </Button>
                <input
                  type="number"
                  min={1}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={randomCount}
                  onChange={(e) => setRandomCount(Number(e.target.value) || 1)}
                />
                <Button
                  type="button"
                  onClick={() => handleAddRandomKey(randomCount)}
                  variant="secondary"
                  size="sm"
                >
                  Random
                </Button>
              </div>

              {loadingKeys ? (
                <div className="text-sm text-gray-500 flex items-center">
                  <FiLoader className="animate-spin mr-2" size={16} />
                  Cargando claves...
                </div>
              ) : existingKeys.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Este producto no tiene claves.
                </div>
              ) : (
                <div className="max-h-32 overflow-auto border border-gray-200 rounded-md p-3 bg-white">
                  {existingKeys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="font-mono text-xs text-gray-700">
                        {k.license_key}
                      </span>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 text-xs"
                        onClick={() => handleDeleteExistingKey(k.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (COP $)
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                placeholder="Ej: 50000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={price as any}
                onChange={(e) =>
                  setPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {typeof price === "number" && price > 0
                  ? `$ ${price.toLocaleString('es-CO')}`
                  : "Ingrese el precio en pesos colombianos"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={stockQuantity as any}
                onChange={(e) =>
                  setStockQuantity(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Seleccione una categoría</option>
              <option value="Licencias">Licencias</option>
              <option value="Tarjeta de Regalo">Tarjeta de Regalo</option>
              <option value="Software">Software</option>
              <option value="Suscripciones">Suscripciones</option>
              <option value="Juegos">Juegos</option>
              <option value="Antivirus">Antivirus</option>
              <option value="Ofimática">Ofimática</option>
              <option value="Otra">Otra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Licencia
            </label>
            {loadingLicenseTypes ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FiLoader className="animate-spin" size={16} />
                Cargando tipos de licencia...
              </div>
            ) : (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">Seleccionar tipo de licencia</option>
                {licenseTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Selecciona el tipo de licencia desde la base de datos
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors"
              >
                <FiUpload size={16} />
                Seleccionar imagen
              </label>
              {imageFile && (
                <span className="text-sm text-gray-600">{imageFile.name}</span>
              )}
            </div>

            {imageError && (
              <div className="text-sm text-red-600 mt-1">{imageError}</div>
            )}

            {imagePreview && (
              <div className="mt-3">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-40 object-contain border border-gray-200 rounded-md bg-gray-50"
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loadingProducts}>
            {loadingProducts ? (
              <div className="flex items-center gap-2">
                <FiLoader className="animate-spin" size={16} />
                {editingId ? "Guardando..." : "Creando..."}
              </div>
            ) : editingId ? (
              "Guardar Cambios"
            ) : (
              "Crear Producto"
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <FiLoader className="animate-spin text-blue-600 mr-2" size={32} />
          <span className="text-gray-600">Verificando permisos...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal para editar usuario */}
      {showUserModal && (
        <Modal
          open={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          title="Editar Usuario"
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSaveUser();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editForm.full_name}
                onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={editForm.country}
                onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                required
              >
                <option value="">Selecciona un país</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Modal>
      )}
      {/* Header del Dashboard */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Volver al inicio"
              >
                <FiArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel de Administración
                </h1>
                <p className="text-gray-600">
                  Bienvenido, {userName || "Administrador"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Administrador
              </div>
              <Button
                onClick={async () => {
                  try {
                    await fetch(`${API_BASE}/auth/logout`, {
                      method: "POST",
                      credentials: "include",
                    });
                  } catch (e) {
                    // ignore
                  }
                  window.location.href = "/";
                }}
                variant="outline"
                size="sm"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación del Dashboard */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`relative py-4 px-6 font-medium transition-all duration-300 ${activeSection === "dashboard"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Estadísticas
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transition-all duration-300 transform ${activeSection === "dashboard" ? "scale-x-100" : "scale-x-0"
                  }`}
              ></span>
            </button>
            <button
              onClick={() => setActiveSection("products")}
              className={`relative py-4 px-6 font-medium transition-all duration-300 ${activeSection === "products"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Gestión de Productos
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transition-all duration-300 transform ${activeSection === "products" ? "scale-x-100" : "scale-x-0"
                  }`}
              ></span>
            </button>
            <button
              onClick={() => setActiveSection("users")}
              className={`relative py-4 px-6 font-medium transition-all duration-300 ${activeSection === "users"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Usuarios
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transition-all duration-300 transform ${activeSection === "users" ? "scale-x-100" : "scale-x-0"
                  }`}
              ></span>
            </button>
            <button
              onClick={() => setActiveSection("returns")}
              className={`relative py-4 px-6 font-medium transition-all duration-300 ${activeSection === "returns"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Devoluciones
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transition-all duration-300 transform ${activeSection === "returns" ? "scale-x-100" : "scale-x-0"
                  }`}
              ></span>
            </button>
            <button
              onClick={() => setActiveSection("points")}
              className={`relative py-4 px-6 font-medium transition-all duration-300 ${activeSection === "points"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Puntos
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transition-all duration-300 transform ${activeSection === "points" ? "scale-x-100" : "scale-x-0"
                  }`}
              ></span>
            </button>
            <button
              onClick={() => setActiveSection("reports")}
              className={`relative py-4 px-6 font-medium transition-all duration-300 ${activeSection === "reports"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Reportes
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transition-all duration-300 transform ${activeSection === "reports" ? "scale-x-100" : "scale-x-0"
                  }`}
              ></span>
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido del Dashboard */}
      <div className="container mx-auto px-4 py-8">
        {activeSection === "dashboard" ? (
          <div className="space-y-6">
            {/* Header con título y selector de período */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h2>
                <p className="text-gray-600 mt-1">Análisis detallado del rendimiento de tu negocio</p>
              </div>
              <div className="flex items-center gap-3">
                <PeriodSelector
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                />
                <Button
                  onClick={fetchAnalyticsData}
                  disabled={analyticsLoading}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  {analyticsLoading ? (
                    <>
                      <FiLoader className="animate-spin" size={16} />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <FiActivity size={16} />
                      Actualizar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* KPI Cards - Estadísticas Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                title="Ingresos Totales"
                value={`$${overviewStats.totalRevenue.value.toLocaleString("es-ES")}`}
                icon={<FiDollarSign size={24} />}
                trend={overviewStats.totalRevenue.trend}
                trendLabel={overviewStats.totalRevenue.trendLabel}
                loading={analyticsLoading}
              />
              <StatCard
                title="Órdenes"
                value={overviewStats.totalOrders.value.toString()}
                icon={<FiShoppingCart size={24} />}
                trend={overviewStats.totalOrders.trend}
                trendLabel={overviewStats.totalOrders.trendLabel}
                loading={analyticsLoading}
              />
              <StatCard
                title="Usuarios"
                value={overviewStats.totalUsers.value.toString()}
                icon={<FiUsers size={24} />}
                trend={overviewStats.totalUsers.trend}
                trendLabel={overviewStats.totalUsers.trendLabel}
                loading={analyticsLoading}
              />
              <StatCard
                title="Productos"
                value={overviewStats.totalProducts.value.toString()}
                icon={<FiPackage size={24} />}
                trend={overviewStats.totalProducts.trend}
                trendLabel={overviewStats.totalProducts.trendLabel}
                loading={analyticsLoading}
              />
            </div>

            {/* Charts Section - Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalesChart data={salesData} loading={analyticsLoading} />
              <CategoryDistribution data={categoryData} loading={analyticsLoading} />
            </div>

            {/* Top Products and Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopProductsList products={topProducts} loading={analyticsLoading} />
              <RecentOrders orders={recentOrdersData} loading={analyticsLoading} />
            </div>

            {/* Alerts and Recent Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LowStockAlerts items={lowStockItems} loading={analyticsLoading} />
              <RecentUsers users={recentUsersData} loading={analyticsLoading} />
            </div>
          </div>
        ) : activeSection === "users" ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Lista de Usuarios
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar usuarios..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    + Nuevo Usuario
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nombre
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Correo
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Estado
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingUsers ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        <div className="flex justify-center items-center space-x-2">
                          <svg
                            className="animate-spin h-5 w-5 text-blue-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Cargando usuarios...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_deleted ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                              }`}
                          >
                            {user.is_deleted ? (
                              <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">Inactivo</span>
                            ) : (
                              <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">Activo</span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Editar usuario"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar usuario"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando{" "}
                <span className="font-medium">
                  {(currentPage - 1) * 10 + 1}
                </span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(currentPage * 10, users.length)}
                </span>{" "}
                de <span className="font-medium">{users.length}</span>{" "}
                resultados
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((p: number) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === 1
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Mostrar páginas alrededor de la página actual
                  let pageNum =
                    currentPage <= 3
                      ? i + 1
                      : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;

                  // Asegurarse de que no se muestren números de página fuera de rango
                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === pageNum
                        ? "bg-blue-50 text-blue-600 border-blue-300"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p: number) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === totalPages
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        ) : activeSection === "points" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Puntos</h2>
                <p className="text-gray-600 mt-1">Administra los puntos de todos los usuarios del sistema</p>
              </div>
            </div>
            <AdminPointsManagement />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              {/* Header de la sección de productos */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Gestión de Productos
                  </h2>
                  <p className="text-gray-600">
                    Administra el catálogo de productos y sus claves de licencia
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={fetchProducts}
                    variant="outline"
                    disabled={loadingProducts}
                    className="flex items-center gap-2"
                  >
                    {loadingProducts ? (
                      <FiLoader className="animate-spin" size={16} />
                    ) : (
                      "Actualizar"
                    )}
                  </Button>
                  <Button
                    onClick={openCreateModal}
                    className="flex items-center gap-2"
                  >
                    <FiPlus size={16} />
                    Crear Producto
                  </Button>
                </div>
              </div>

              {/* Barra de búsqueda y filtros */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Buscador */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Buscar por nombre, descripción o categoría..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  {/* Filtro por tipo de licencia */}
                  <div className="sm:w-64">
                    <select
                      value={selectedLicenseFilter}
                      onChange={(e) => setSelectedLicenseFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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

                  {/* Botón para limpiar filtros */}
                  {(searchQuery !== "" || selectedLicenseFilter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedLicenseFilter("all");
                      }}
                      className="whitespace-nowrap"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>

                {/* Contador de resultados */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Mostrando <span className="font-semibold">{filteredProducts.length}</span> de{" "}
                    <span className="font-semibold">{totalProductsCount}</span> productos
                  </span>
                </div>
              </div>

              {/* Error general */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6 text-sm">
                  {error}
                </div>
              )}

              {/* Lista de productos existente del ProductAdmin */}
              {loadingProducts && !products.length ? (
                <div className="flex items-center justify-center py-12">
                  <FiLoader
                    className="animate-spin text-blue-600 mr-2"
                    size={24}
                  />
                  <span className="text-gray-600">Cargando productos...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <div className="text-lg font-medium mb-2">
                        No hay productos registrados
                      </div>
                      <p className="text-sm">
                        Comienza creando tu primer producto
                      </p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <div className="text-lg font-medium mb-2">
                        No se encontraron productos
                      </div>
                      <p className="text-sm">
                        Intenta ajustar los filtros de búsqueda
                      </p>
                    </div>
                  ) : (
                    filteredProducts.map((p) => (
                      <Card
                        key={p.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="w-full h-32 bg-gray-100 flex-shrink-0 overflow-hidden rounded-lg mb-4">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                                Sin imagen
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg mb-1">
                                {p.name}
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {p.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-green-600">
                                ${p.price.toLocaleString('es-CO')}
                              </span>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">
                                  {p.category}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Stock: {getProductStock(p)} keys disponibles
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEdit(p)}
                                className="flex-1 flex items-center gap-1 justify-center"
                              >
                                <FiEdit size={14} />
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDelete(p.id, p.name)}
                                className="flex-1 flex items-center gap-1 justify-center"
                              >
                                <FiTrash2 size={14} />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Paginación de productos */}
              {!loadingProducts && totalProductPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentProductPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentProductPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentProductPage(page)}
                        className={`px-4 py-2 rounded-lg transition-colors ${currentProductPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentProductPage((prev) => Math.min(totalProductPages, prev + 1))}
                    disabled={currentProductPage === totalProductPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear producto */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Crear Nuevo Producto"
      >
        {renderProductForm()}
      </Modal>

      {/* Modal para editar producto */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Editar Producto"
      >
        {renderProductForm()}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        open={showDeleteConfirmModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteConfirmModal(false);
            setProductToDelete(null);
            setError(null);
          }
        }}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar el producto{" "}
            <span className="font-semibold text-gray-900">
              "{productToDelete?.name}"
            </span>
            ?
          </p>
          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer y se eliminarán todas las claves
            asociadas al producto.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setProductToDelete(null);
                setError(null);
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => productToDelete && handleDelete(productToDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <FiLoader className="animate-spin" size={16} />
                  Eliminando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FiTrash2 size={16} />
                  Eliminar Producto
                </div>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}