"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useReturns } from "@/hooks/use-returns";
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiLoader,
  FiAlertCircle,
  FiFilter,
  FiUser,
  FiCalendar,
  FiEye,
  FiCheck,
  FiX,
  FiTrendingUp,
} from "react-icons/fi";
import type { Return, ReturnStatus, RefundMethod } from "@/types/returns";

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

interface ReturnsAdminProps {
  className?: string;
}

export function ReturnsAdmin({ className = "" }: ReturnsAdminProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    returns,
    loading,
    error,
    getAllReturns,
    processReturn,
    getReturnsSummary,
  } = useReturns();

  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<"approved" | "rejected">("approved");
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("original_payment");
  const [adminNotes, setAdminNotes] = useState("");
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    // Verificar si es admin
    // TODO: Implementar verificación de rol admin
    loadReturns();
    loadSummary();
  }, [user, selectedStatus]);

  const loadReturns = async () => {
    const filters = selectedStatus !== "all" ? { status: selectedStatus } : undefined;
    await getAllReturns(filters);
  };

  const loadSummary = async () => {
    try {
      const data = await getReturnsSummary();
      setSummary(data.data);
    } catch (err) {
      console.error("Error loading summary:", err);
    }
  };

  const handleOpenProcessModal = (returnItem: Return, action: "approved" | "rejected") => {
    setSelectedReturn(returnItem);
    setProcessAction(action);
    setAdminNotes("");
    setRefundMethod("original_payment");
    setShowProcessModal(true);
  };

  const handleProcessReturn = async () => {
    if (!selectedReturn) return;

    try {
      setProcessing(selectedReturn.id);
      await processReturn(selectedReturn.id, {
        status: processAction,
        refund_method: processAction === "approved" ? refundMethod : undefined,
        admin_notes: adminNotes,
      });
      setShowProcessModal(false);
      await loadReturns();
      await loadSummary();
    } catch (err) {
      console.error("Error al procesar:", err);
      alert("Error al procesar la devolución");
    } finally {
      setProcessing(null);
    }
  };

  const filteredReturns = returns || [];

  if (loading && !returns.length) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando devoluciones...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="text-yellow-600 w-8 h-8" />
              <span className="text-2xl font-bold text-gray-900">
                {summary.pending_returns}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Pendientes</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <FiCheckCircle className="text-blue-600 w-8 h-8" />
              <span className="text-2xl font-bold text-gray-900">
                {summary.approved_returns}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Aprobadas</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <FiDollarSign className="text-green-600 w-8 h-8" />
              <span className="text-2xl font-bold text-gray-900">
                {summary.refunded_returns}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Reembolsadas</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <FiTrendingUp className="text-purple-600 w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">
                ${summary.total_refund_amount?.toLocaleString() || 0}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Total Reembolsado</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Devoluciones</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FiFilter className="mr-2" />
          Filtros
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Filtrar por estado</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos ({summary?.total_returns || 0})
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status as ReturnStatus)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedStatus === status
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
          <p className="text-gray-600">
            {selectedStatus === "all"
              ? "No hay solicitudes de devolución en el sistema."
              : `No hay devoluciones en estado "${STATUS_CONFIG[selectedStatus]?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((returnItem) => {
            const statusConfig = STATUS_CONFIG[returnItem.status];
            const StatusIcon = statusConfig.icon;
            const canProcess = returnItem.status === "pending";

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

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-2">
                        <FiPackage size={16} />
                        <span>Orden #{returnItem.order_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiUser size={16} />
                        <span>Usuario: {returnItem.user_id.substring(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiCalendar size={16} />
                        <span>
                          {new Date(returnItem.created_at).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                      {returnItem.refund_method && (
                        <div className="flex items-center gap-2">
                          <FiDollarSign size={16} />
                          <span className="capitalize">
                            {returnItem.refund_method.replace("_", " ")}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700 mb-2">
                      <span className="font-medium">Razón:</span> {returnItem.reason}
                    </p>

                    {returnItem.admin_notes && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Notas del administrador:
                        </p>
                        <p className="text-sm text-blue-800">{returnItem.admin_notes}</p>
                      </div>
                    )}
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
                    <p className="text-sm text-gray-600 mb-2 font-medium">
                      Productos ({returnItem.items.length}):
                    </p>
                    <div className="space-y-1">
                      {returnItem.items.map((item) => (
                        <p key={item.id} className="text-sm text-gray-700">
                          • {item.product_name || `Producto ${item.product_id}`} (x
                          {item.quantity}) - ${item.price.toLocaleString()}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {canProcess ? (
                    <>
                      <button
                        onClick={() => handleOpenProcessModal(returnItem, "approved")}
                        disabled={processing === returnItem.id}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiCheck className="mr-2" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleOpenProcessModal(returnItem, "rejected")}
                        disabled={processing === returnItem.id}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiX className="mr-2" />
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => router.push(`/admin/returns/${returnItem.id}`)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiEye className="mr-2" />
                      Ver detalles
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Process Modal */}
      {showProcessModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {processAction === "approved" ? "Aprobar" : "Rechazar"} Devolución
            </h3>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Devolución:</span> #{selectedReturn.id}
              </p>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Monto:</span> $
                {selectedReturn.refund_amount.toLocaleString()}
              </p>
            </div>

            {processAction === "approved" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de reembolso *
                </label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as RefundMethod)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="original_payment">Método de pago original</option>
                  <option value="store_credit">Crédito en la tienda</option>
                  <option value="bank_transfer">Transferencia bancaria</option>
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas administrativas
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder={`Agrega notas sobre esta ${
                  processAction === "approved" ? "aprobación" : "rechazo"
                }...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowProcessModal(false)}
                disabled={processing !== null}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessReturn}
                disabled={processing !== null}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  processAction === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processing !== null ? (
                  <>
                    <FiLoader className="animate-spin inline mr-2" />
                    Procesando...
                  </>
                ) : (
                  `Confirmar ${processAction === "approved" ? "aprobación" : "rechazo"}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
