"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/components/auth/AuthProvider";
import { useReturns } from "@/hooks/use-returns";
import {
  FiArrowLeft,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiEye,
  FiLoader,
  FiAlertCircle,
  FiFilter,
} from "react-icons/fi";
import type { Return, ReturnStatus } from "@/types/returns";

const STATUS_CONFIG: Record<ReturnStatus, { label: string; color: string; icon: any }> = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: FiClock,
  },
  approved: {
    label: "Aprobada",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: FiCheckCircle,
  },
  rejected: {
    label: "Rechazada",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: FiXCircle,
  },
  refunded: {
    label: "Reembolsada",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: FiDollarSign,
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: FiXCircle,
  },
};

export default function ReturnsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { returns, loading, error, getReturns, cancelReturn } = useReturns();

  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    loadReturns();
  }, [isAuthenticated, isLoading, selectedStatus]);

  const loadReturns = async () => {
    const filters = selectedStatus !== "all" ? { status: selectedStatus } : undefined;
    await getReturns(filters);
  };

  const handleCancelReturn = async (returnId: number) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta devolución?")) {
      return;
    }

    try {
      setCancelling(returnId);
      await cancelReturn(returnId);
      await loadReturns();
    } catch (err) {
      console.error("Error al cancelar:", err);
    } finally {
      setCancelling(null);
    }
  };

  const handleViewDetails = (returnId: number) => {
    router.push(`/returns/${returnId}`);
  };

  const filteredReturns = returns || [];

  if (loading && !returns.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando devoluciones...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/orders")}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <FiArrowLeft className="mr-2" />
              Volver a mis órdenes
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Mis Devoluciones
                </h1>
                <p className="text-gray-600">
                  Gestiona tus solicitudes de devolución
                </p>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiFilter className="mr-2" />
                Filtros
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Filtrar por estado</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus("all")}
                  className={`px-4 py-2 rounded-lg transition-colors ${selectedStatus === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  Todos
                </button>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status as ReturnStatus)}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Returns List */}
          {filteredReturns.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay devoluciones
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedStatus === "all"
                  ? "No has realizado ninguna solicitud de devolución aún."
                  : `No tienes devoluciones en estado "${STATUS_CONFIG[selectedStatus]?.label}".`}
              </p>
              <button
                onClick={() => router.push("/orders")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver mis órdenes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReturns.map((returnItem) => {
                const statusConfig = STATUS_CONFIG[returnItem.status];
                const StatusIcon = statusConfig.icon;
                const canCancel = returnItem.status === "pending" || returnItem.status === "approved";

                return (
                  <div
                    key={returnItem.id}
                    className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Devolución #{returnItem.id}
                          </h3>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-4 h-4 mr-1" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Orden #{returnItem.order_id} •{" "}
                          {new Date(returnItem.created_at).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-gray-700 line-clamp-2">{returnItem.reason}</p>
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-600 mb-1">Monto de reembolso</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${returnItem.refund_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Items preview */}
                    {returnItem.items && returnItem.items.length > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">
                          Claves ({returnItem.items.length}):
                        </p>
                        <div className="space-y-1">
                          {returnItem.items.slice(0, 2).map((item) => (
                            <p key={item.id} className="text-sm text-gray-700">
                              • {item.product_name || `Clave de ${item.product.name}`} (
                              {item.product_key_id})
                            </p>
                          ))}
                          {returnItem.items.length > 2 && (
                            <p className="text-sm text-gray-500 italic">
                              + {returnItem.items.length - 2} más...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Admin notes */}
                    {returnItem.admin_notes && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Nota del administrador:
                        </p>
                        <p className="text-sm text-blue-800">{returnItem.admin_notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewDetails(returnItem.id)}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiEye className="mr-2" />
                        Ver detalles
                      </button>

                      {canCancel && (
                        <button
                          onClick={() => handleCancelReturn(returnItem.id)}
                          disabled={cancelling === returnItem.id}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelling === returnItem.id ? (
                            <FiLoader className="animate-spin" />
                          ) : (
                            "Cancelar"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
