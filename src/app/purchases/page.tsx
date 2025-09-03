"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import {
  FiPackage,
  FiDownload,
  FiEye,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiTruck,
  FiFileText,
} from "react-icons/fi";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  licenseKey?: string;
  downloadUrl?: string;
}

interface Order {
  id: string;
  date: string;
  status: "delivered" | "processing" | "pending" | "cancelled";
  total: number;
  paymentMethod: string;
  items: OrderItem[];
}

const STATUS_CONFIG = {
  delivered: {
    label: "Entregado",
    color: "bg-green-100 text-green-800",
    icon: FiCheckCircle,
  },
  processing: {
    label: "Procesando",
    color: "bg-blue-100 text-blue-800",
    icon: FiClock,
  },
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
    icon: FiClock,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800",
    icon: FiClock,
  },
};

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Datos simulados de órdenes
  const [orders] = useState<Order[]>([
    {
      id: "ORD-2024-001",
      date: "2024-01-15",
      status: "delivered",
      total: 149.99,
      paymentMethod: "Tarjeta de Crédito ****1234",
      items: [
        {
          id: "1",
          name: "Microsoft Office 365 Personal",
          quantity: 1,
          price: 89.99,
          licenseKey: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
          downloadUrl: "https://office.com/download",
        },
        {
          id: "2",
          name: "Antivirus Norton 360 Standard",
          quantity: 1,
          price: 59.99,
          licenseKey: "YYYYY-YYYYY-YYYYY-YYYYY-YYYYY",
          downloadUrl: "https://norton.com/download",
        },
      ],
    },
    {
      id: "ORD-2024-002",
      date: "2024-01-10",
      status: "delivered",
      total: 299.98,
      paymentMethod: "PayPal",
      items: [
        {
          id: "3",
          name: "Adobe Creative Cloud All Apps",
          quantity: 1,
          price: 199.99,
          licenseKey: "ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ",
          downloadUrl: "https://adobe.com/download",
        },
        {
          id: "4",
          name: "Windows 11 Pro",
          quantity: 1,
          price: 99.99,
          licenseKey: "AAAAA-AAAAA-AAAAA-AAAAA-AAAAA",
          downloadUrl: "https://microsoft.com/download",
        },
      ],
    },
    {
      id: "ORD-2024-003",
      date: "2024-01-08",
      status: "processing",
      total: 79.99,
      paymentMethod: "Tarjeta de Débito ****5678",
      items: [
        {
          id: "5",
          name: "Photoshop CC 2024",
          quantity: 1,
          price: 79.99,
        },
      ],
    },
  ]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDownload = (item: OrderItem) => {
    if (item.downloadUrl) {
      // En una app real, esto sería un enlace de descarga real
      console.log("Downloading:", item.name);
      alert(`Iniciando descarga de ${item.name}`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mis Compras
            </h1>
            <p className="text-gray-600">
              Gestiona y descarga tus licencias de software
            </p>
          </div>

          {/* Filtros y búsqueda */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FiSearch
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Buscar por ID de orden o nombre de producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="delivered">Entregado</option>
                  <option value="processing">Procesando</option>
                  <option value="pending">Pendiente</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de órdenes */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FiPackage className="mx-auto text-gray-400 mb-4" size={48} />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm || statusFilter !== "all"
                  ? "No se encontraron compras"
                  : "No hay compras recientes"}
              </h2>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta ajustar tus filtros de búsqueda"
                  : "Todavía no has realizado ninguna compra en nuestra tienda."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <a
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver productos
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const StatusIcon = STATUS_CONFIG[order.status].icon;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Header de la orden */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Orden #{order.id}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <FiCalendar size={14} />
                              {formatDate(order.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiCreditCard size={14} />
                              {order.paymentMethod}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              STATUS_CONFIG[order.status].color
                            }`}
                          >
                            <StatusIcon size={14} />
                            {STATUS_CONFIG[order.status].label}
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            ${order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Items de la orden */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">
                                {item.name}
                              </h4>
                              <div className="text-sm text-gray-600">
                                Cantidad: {item.quantity} • $
                                {item.price.toFixed(2)}
                              </div>
                              {item.licenseKey && (
                                <div className="mt-2 text-xs">
                                  <span className="text-gray-500">
                                    Clave de licencia:
                                  </span>
                                  <code className="ml-2 px-2 py-1 bg-white rounded border text-gray-800">
                                    {item.licenseKey}
                                  </code>
                                </div>
                              )}
                            </div>

                            {order.status === "delivered" && (
                              <div className="flex gap-2 ml-4">
                                {item.downloadUrl && (
                                  <button
                                    onClick={() => handleDownload(item)}
                                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    <FiDownload size={14} />
                                    Descargar
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <FiEye size={14} />
                                  Detalles
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal de detalles de orden */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4">
                    Detalles de la Orden #{selectedOrder.id}
                  </h3>
                  {/* Add more order details here */}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
