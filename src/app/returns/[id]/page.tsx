"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  FiLoader,
  FiAlertCircle,
  FiUser,
  FiCalendar,
  FiFileText,
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

export default function ReturnDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const returnId = params.id as string;
  const { user } = useAuth();
  const { getReturnById, getReturnHistory, loading } = useReturns();

  const [returnData, setReturnData] = useState<Return | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadReturnDetails();
  }, [user, returnId]);

  const loadReturnDetails = async () => {
    try {
      const data = await getReturnById(parseInt(returnId));
      if (data) {
        setReturnData(data);
        // Cargar historial
        const historyData = await getReturnHistory(parseInt(returnId));
        setHistory(historyData);
      } else {
        setError("Devolución no encontrada");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la devolución");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando detalles...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !returnData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <FiAlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[returnData.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <FiArrowLeft className="mr-2" />
            Volver
          </button>

          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Devolución #{returnData.id}
                </h1>
                <p className="text-gray-600">
                  Orden #{returnData.order_id} •{" "}
                  {new Date(returnData.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium border ${statusConfig.color}`}
              >
                <StatusIcon className="w-5 h-5 mr-2" />
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monto de reembolso</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${returnData.refund_amount.toLocaleString()}
                </p>
              </div>

              {returnData.refund_method && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Método de reembolso</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {returnData.refund_method.replace("_", " ")}
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Razón de devolución</p>
                <p className="text-gray-900">{returnData.reason}</p>
              </div>

              {returnData.admin_notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Notas del administrador</p>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-900">{returnData.admin_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Productos devueltos
            </h2>

            <div className="space-y-4">
              {returnData.items && returnData.items.length > 0 ? (
                returnData.items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.product_name || `Producto ${item.product_id}`}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Cantidad: {item.quantity} × ${item.price.toLocaleString()}
                        </p>
                        {item.reason && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Razón:</span> {item.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-900">
                          ${(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No hay items en esta devolución
                </p>
              )}
            </div>
          </div>

          {/* History */}
          {history && history.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Historial de cambios
              </h2>

              <div className="space-y-4">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            STATUS_CONFIG[entry.new_status as ReturnStatus]?.color || ""
                          }`}
                        >
                          {STATUS_CONFIG[entry.new_status as ReturnStatus]?.label ||
                            entry.new_status}
                        </span>
                        {entry.old_status && (
                          <>
                            <span className="text-gray-400">←</span>
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                              {STATUS_CONFIG[entry.old_status as ReturnStatus]?.label ||
                                entry.old_status}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleString("es-ES")}
                      </span>
                    </div>

                    {entry.changed_by_user && (
                      <p className="text-sm text-gray-600">
                        Por: {entry.changed_by_user.full_name || entry.changed_by_user.email}
                      </p>
                    )}

                    {entry.notes && (
                      <p className="text-sm text-gray-700 mt-1">{entry.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
