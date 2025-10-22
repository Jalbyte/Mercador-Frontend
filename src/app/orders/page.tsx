"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  FiShoppingBag,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiChevronDown,
  FiChevronUp,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  license_key?: string;
};

type Order = {
  id: number;
  total_amount: number;
  status: string;
  payment_method?: string;
  created_at: string;
  items?: OrderItem[];
};

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPurchaseHistory();
    }
  }, [isAuthenticated]);

  const fetchPurchaseHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Error al cargar el historial de compras");
      }

      const data = await response.json();

      if (data.success) {
        setOrders(data.data || []);
      } else {
        throw new Error(data.error || "Error al cargar el historial");
      }
    } catch (err) {
      console.error("Error fetching purchase history:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar el historial"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "completado":
        return "bg-green-100 text-green-800";
      case "pending":
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Completado";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-32">
          <div className="flex items-center justify-center">
            <FiLoader className="animate-spin text-blue-600" size={32} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-24 sm:pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <FiShoppingBag size={40} />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Historial de Compras
            </h1>
          </div>
          <p className="text-base sm:text-lg text-blue-100">
            Revisa todas tus compras realizadas
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiLoader className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <FiAlertCircle size={24} />
              <h3 className="font-semibold">Error</h3>
            </div>
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchPurchaseHistory}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center max-w-md mx-auto">
            <FiShoppingBag className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No hay compras registradas
            </h3>
            <p className="text-gray-600 mb-6">
              Aún no has realizado ninguna compra
            </p>
            <button
              onClick={() => router.push("/productos")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
              >
                {/* Order Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrderExpansion(order.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Orden #{order.id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FiCalendar size={16} />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiPackage size={16} />
                          <span>
                            {order.items?.length || 0}{" "}
                            {(order.items?.length || 0) === 1 ? "producto" : "productos"}
                          </span>
                        </div>
                        {order.payment_method && (
                          <div className="flex items-center gap-2">
                            <FiDollarSign size={16} />
                            <span className="capitalize">
                              {order.payment_method}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${order.total_amount.toLocaleString("es-CO")}
                        </p>
                      </div>
                      {expandedOrders.has(order.id) ? (
                        <FiChevronUp
                          className="text-gray-400"
                          size={24}
                        />
                      ) : (
                        <FiChevronDown
                          className="text-gray-400"
                          size={24}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Details (Expandable) */}
                {expandedOrders.has(order.id) && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Productos
                    </h4>
                    <div className="space-y-3">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 mb-1">
                                  {item.product_name}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  Cantidad: {item.quantity} × $
                                {item.unit_price.toLocaleString("es-CO")}
                              </p>
                              {item.license_key && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-xs text-blue-800 font-medium mb-1">
                                    Clave de licencia:
                                  </p>
                                  <code className="text-sm text-blue-900 font-mono">
                                    {item.license_key}
                                  </code>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ${item.total_price.toLocaleString("es-CO")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          No hay productos en esta orden
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
