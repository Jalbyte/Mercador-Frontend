"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { FiLoader, FiEye, FiCheck, FiX, FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';

type ReturnItem = {
    id: number;
    product_id: number;
    product_key_id: string;
    quantity?: number;
    quantity_deprecated?: number;
    price: number;
    reason?: string;
    product?: {
        name: string;
        image_url?: string;
    };
};

type OrderPoints = {
    points_used: number;
    points_earned: number;
    discount_amount: number;
};

type Return = {
    id: number;
    order_id: number;
    user_id: string;
    status: ReturnStatus;
    reason: string;
    refund_amount: number;
    refund_method?: string;
    admin_notes?: string;
    notes?: string;
    created_at: string;
    processed_at?: string;
    user?: {
        full_name: string;
        email: string;
    };
    order?: {
        reference?: string;
        total_amount: number;
        created_at?: string;
    };
    items?: ReturnItem[];
    order_points?: OrderPoints;
};

export default function ReturnsManagementPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [returns, setReturns] = useState<Return[]>([]);
    const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Estados para filtros
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    // Estados para el modal de procesamiento
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
    const [adminNotes, setAdminNotes] = useState('');
    const [refundMethod, setRefundMethod] = useState<string>('original_payment');

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        if (user.role !== "admin") {
            router.push("/");
            return;
        }

        setIsAdmin(true);
        setLoading(false);
    }, [router, user, authLoading]);

    useEffect(() => {
        if (isAdmin) {
            fetchReturns();
        }
    }, [isAdmin, statusFilter, currentPage]);

    async function fetchReturns() {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await fetch(`${API_BASE}/returns/admin/all?${params}`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.status === 401) {
                router.push('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Error al cargar devoluciones');
            }

            const data = await response.json();

            if (data.success && data.data) {
                setReturns(data.data);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages || 1);
                }
            }
        } catch (error: any) {
            console.error('Error fetching returns:', error);
        } finally {
            setLoading(false);
        }
    }

    async function viewDetails(returnId: number) {
        try {
            const response = await fetch(`${API_BASE}/returns/${returnId}`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.status === 401) {
                router.push('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Error al cargar detalles');
            }

            const data = await response.json();

            if (data.success && data.data) {
                setSelectedReturn(data.data);
                setShowDetailModal(true);
            }
        } catch (error: any) {
            console.error('Error fetching return details:', error);
            alert('Error al cargar los detalles de la devolución');
        }
    }

    function openProcessModal(returnData: Return, action: 'approve' | 'reject') {
        setSelectedReturn(returnData);
        setProcessAction(action);
        setAdminNotes('');
        setRefundMethod('store_credit'); // Siempre crédito en tienda
        setShowProcessModal(true);
    }

    async function processReturn() {
        if (!selectedReturn) return;

        try {
            setProcessing(true);

            const body: any = {
                status: processAction === 'approve' ? 'approved' : 'rejected',
            };

            if (adminNotes.trim()) {
                body.admin_notes = adminNotes.trim();
            }

            // Siempre usar crédito en tienda para reembolsos
            if (processAction === 'approve') {
                body.refund_method = 'store_credit';
            }

            const response = await fetch(`${API_BASE}/returns/admin/${selectedReturn.id}/process`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.status === 401) {
                router.push('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al procesar la devolución');
            }

            const data = await response.json();

            if (data.success) {
                alert(`✅ Devolución ${processAction === 'approve' ? 'aprobada' : 'rechazada'} exitosamente. Se ha enviado un correo al cliente.`);
                setShowProcessModal(false);
                setShowDetailModal(false);
                fetchReturns();
            }
        } catch (error: any) {
            console.error('Error processing return:', error);
            alert(error.message || 'Error al procesar la devolución');
        } finally {
            setProcessing(false);
        }
    }

    const getStatusBadge = (status: ReturnStatus) => {
        const badges = {
            pending: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
            approved: { text: 'Aprobada', color: 'bg-green-100 text-green-800' },
            rejected: { text: 'Rechazada', color: 'bg-red-100 text-red-800' },
            refunded: { text: 'Reembolsada', color: 'bg-blue-100 text-blue-800' },
            cancelled: { text: 'Cancelada', color: 'bg-gray-100 text-gray-800' },
        };

        const badge = badges[status] || badges.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FiLoader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Devoluciones</h1>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
                        >
                            ← Volver al Dashboard
                        </button>
                    </div>

                    {/* Filtros */}
                    <div className="flex items-center gap-4">
                        <FiFilter className="text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="approved">Aprobadas</option>
                            <option value="rejected">Rechazadas</option>
                            <option value="refunded">Reembolsadas</option>
                            <option value="cancelled">Canceladas</option>
                        </select>
                    </div>
                </div>

                {/* Tabla de devoluciones */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {returns.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No hay devoluciones {statusFilter !== 'all' ? `con estado "${statusFilter}"` : ''}
                                        </td>
                                    </tr>
                                ) : (
                                    returns.map((ret) => (
                                        <tr key={ret.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{ret.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>{ret.user?.full_name || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{ret.user?.email || ''}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                #{ret.order_id}
                                                {ret.order?.reference && (
                                                    <div className="text-xs text-gray-500">{ret.order.reference}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${Number(ret.refund_amount || 0).toLocaleString('es-CO')} COP
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(ret.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(ret.created_at).toLocaleDateString('es-CO')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => viewDetails(ret.id)}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                        title="Ver detalles"
                                                    >
                                                        <FiEye className="w-5 h-5" />
                                                    </button>
                                                    {ret.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => openProcessModal(ret, 'approve')}
                                                                className="text-green-600 hover:text-green-900 p-1"
                                                                title="Aprobar"
                                                            >
                                                                <FiCheck className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => openProcessModal(ret, 'reject')}
                                                                className="text-red-600 hover:text-red-900 p-1"
                                                                title="Rechazar"
                                                            >
                                                                <FiX className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                                Página {currentPage} de {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiChevronLeft />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Detalles */}
            {showDetailModal && selectedReturn && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Devolución #{selectedReturn.id}
                                </h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Estado */}
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-700">Estado:</span>
                                    {getStatusBadge(selectedReturn.status)}
                                </div>

                                {/* Información del Usuario */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        👤 Información del Cliente
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-700">Nombre:</span>{' '}
                                            <span className="text-gray-900">{selectedReturn.user?.full_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Email:</span>{' '}
                                            <span className="text-gray-900">{selectedReturn.user?.email || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">ID de usuario:</span>{' '}
                                            <span className="text-gray-600 text-xs font-mono">{selectedReturn.user_id}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Información de la Orden */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        🛒 Información de la Orden
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="font-medium text-blue-800">Orden ID:</span>{' '}
                                            <span className="text-blue-900">#{selectedReturn.order_id}</span>
                                        </div>
                                        {selectedReturn.order?.reference && (
                                            <div>
                                                <span className="font-medium text-blue-800">Referencia:</span>{' '}
                                                <span className="text-blue-900">{selectedReturn.order.reference}</span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-medium text-blue-800">Total de la orden:</span>{' '}
                                            <span className="text-blue-900 font-semibold">
                                                ${Number(selectedReturn.order?.total_amount || 0).toLocaleString('es-CO')} COP
                                            </span>
                                        </div>
                                        {selectedReturn.order?.created_at && (
                                            <div>
                                                <span className="font-medium text-blue-800">Fecha de compra:</span>{' '}
                                                <span className="text-blue-900">
                                                    {new Date(selectedReturn.order.created_at).toLocaleString('es-CO')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Información de Puntos Usados */}
                                {selectedReturn.order_points && selectedReturn.order_points.points_used > 0 && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                            💎 Puntos Usados en la Orden Original
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="bg-purple-100 p-3 rounded">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-purple-800">Puntos gastados:</span>
                                                    <span className="text-purple-900 font-bold text-lg">
                                                        {selectedReturn.order_points.points_used} puntos
                                                    </span>
                                                </div>
                                                <div className="text-purple-700 text-xs">
                                                    Equivalente a ${(selectedReturn.order_points.points_used * 10).toLocaleString('es-CO')} COP de descuento
                                                </div>
                                            </div>
                                            {selectedReturn.order_points.discount_amount > 0 && (
                                                <div>
                                                    <span className="font-medium text-purple-800">Descuento aplicado:</span>{' '}
                                                    <span className="text-purple-900">
                                                        ${Number(selectedReturn.order_points.discount_amount).toLocaleString('es-CO')} COP
                                                    </span>
                                                </div>
                                            )}
                                            {selectedReturn.order_points.points_earned > 0 && (
                                                <div>
                                                    <span className="font-medium text-purple-800">Puntos ganados por esta compra:</span>{' '}
                                                    <span className="text-purple-900">{selectedReturn.order_points.points_earned} puntos</span>
                                                </div>
                                            )}
                                            <div className="mt-3 p-3 bg-white border border-purple-200 rounded">
                                                <div className="text-xs font-medium text-purple-900 mb-1">⚠️ Importante:</div>
                                                <div className="text-xs text-purple-800">
                                                    Al aprobar esta devolución, se calcularán y reembolsarán los puntos de forma proporcional
                                                    según el monto devuelto. El cálculo será automático.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Monto de Reembolso con Cálculo de Puntos */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-green-900 mb-3">💰 Monto de Reembolso</h3>

                                    {/* Monto principal */}
                                    <div className="text-3xl font-bold text-green-900 mb-1">
                                        ${Number(selectedReturn.refund_amount || 0).toLocaleString('es-CO')} COP
                                    </div>
                                    <div className="text-sm text-green-700 mb-4">
                                        Este monto se devolverá como crédito en tienda
                                    </div>

                                    {/* Cálculo de puntos a reembolsar */}
                                    {selectedReturn.order_points && selectedReturn.order_points.points_used > 0 && selectedReturn.order?.total_amount && (
                                        <div className="mt-4 pt-4 border-t border-green-200">
                                            <div className="text-sm font-semibold text-green-900 mb-2">
                                                📊 Cálculo de Puntos a Reembolsar
                                            </div>

                                            <div className="space-y-2 text-sm bg-white rounded p-3 border border-green-200">
                                                {(() => {
                                                    const totalOrder = Number(selectedReturn.order.total_amount);
                                                    const refundAmount = Number(selectedReturn.refund_amount);
                                                    const pointsUsed = selectedReturn.order_points.points_used;
                                                    const pointsDiscount = pointsUsed * 10; // Cada punto = 10 COP

                                                    // Calcular el precio realmente pagado (después del descuento de puntos)
                                                    const actualPaid = totalOrder - pointsDiscount;

                                                    // Calcular porcentaje de devolución sobre lo pagado realmente
                                                    const refundPercentage = (actualPaid / totalOrder) * 100;

                                                    // Calcular puntos proporcionales a reembolsar
                                                    const pointsToRefund = Math.floor(Math.floor(refundAmount / 10) * refundPercentage / 100);

                                                    return (
                                                        <>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-700">Total de la orden:</span>
                                                                <span className="font-medium text-gray-900">
                                                                    ${totalOrder.toLocaleString('es-CO')} COP
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-700">Descuento por puntos:</span>
                                                                <span className="font-medium text-purple-700">
                                                                    -${pointsDiscount.toLocaleString('es-CO')} COP ({pointsUsed} pts)
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center pb-2 border-b border-gray-300">
                                                                <span className="text-gray-700 font-semibold">Realmente pagado:</span>
                                                                <span className="font-bold text-gray-900">
                                                                    ${actualPaid.toLocaleString('es-CO')} COP
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center mt-2">
                                                                <span className="text-gray-700">Monto a devolver:</span>
                                                                <span className="font-medium text-green-700">
                                                                    ${refundAmount.toLocaleString('es-CO')} COP
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                                                <span className="text-gray-700">Porcentaje de devolución:</span>
                                                                <span className="font-semibold text-green-700">
                                                                    {refundPercentage.toFixed(2)}%
                                                                </span>
                                                            </div>

                                                            <div className="mt-3 pt-3 border-t border-green-300">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-gray-700">Fórmula:</span>
                                                                    <span className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                                                                        {Math.floor(refundAmount / 10)} × {refundPercentage.toFixed(2)}%
                                                                    </span>
                                                                </div>

                                                                <div className="flex justify-between items-center mt-2 p-3 bg-green-100 rounded border border-green-300">
                                                                    <span className="font-semibold text-green-900">💎 Puntos a reembolsar:</span>
                                                                    <span className="font-bold text-2xl text-green-900">
                                                                        {pointsToRefund} puntos
                                                                    </span>
                                                                </div>

                                                                <div className="text-xs text-gray-600 mt-1 text-right">
                                                                    Equivalente a ${(pointsToRefund * 10).toLocaleString('es-CO')} COP
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                                                                <strong>ℹ️ Nota:</strong> El cálculo se hace sobre el monto realmente pagado (después del descuento).
                                                                Los puntos se reembolsarán automáticamente al aprobar la devolución.
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Razón del Cliente */}
                                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                                    <div className="font-semibold text-amber-900 mb-2">📝 Razón del cliente:</div>
                                    <p className="text-amber-800 whitespace-pre-wrap">{selectedReturn.reason}</p>
                                </div>

                                {/* Notas Adicionales del Cliente */}
                                {selectedReturn.notes && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <div className="font-semibold text-gray-900 mb-2">💬 Notas adicionales del cliente:</div>
                                        <p className="text-gray-700 whitespace-pre-wrap">{selectedReturn.notes}</p>
                                    </div>
                                )}

                                {/* Productos a Devolver */}
                                {selectedReturn.items && selectedReturn.items.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            📦 Productos a Devolver ({selectedReturn.items.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedReturn.items.map((item: ReturnItem) => (
                                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition">
                                                    <div className="flex items-start gap-4">
                                                        {item.product?.image_url && (
                                                            <img
                                                                src={item.product.image_url}
                                                                alt={item.product.name || 'Producto'}
                                                                className="w-20 h-20 object-cover rounded border border-gray-200"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-gray-900 text-lg">
                                                                {item.product?.name || `Producto #${item.product_id}`}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                                                <div>
                                                                    <span className="text-gray-600">Precio:</span>{' '}
                                                                    <span className="font-medium text-gray-900">
                                                                        ${Number(item.price).toLocaleString('es-CO')} COP
                                                                    </span>
                                                                </div>
                                                                {(item.quantity || item.quantity_deprecated) && (
                                                                    <div>
                                                                        <span className="text-gray-600">Cantidad:</span>{' '}
                                                                        <span className="font-medium text-gray-900">
                                                                            {item.quantity || item.quantity_deprecated}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                                                <div className="text-gray-600">🔑 Clave de producto:</div>
                                                                <div className="font-mono text-gray-900 mt-1 break-all">
                                                                    {item.product_key_id}
                                                                </div>
                                                            </div>
                                                            {item.reason && (
                                                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                                                                    <div className="text-amber-800">
                                                                        <strong>Razón específica:</strong> {item.reason}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notas del Administrador */}
                                {selectedReturn.admin_notes && (
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                                        <div className="font-semibold text-blue-900 mb-2">💼 Notas del administrador:</div>
                                        <p className="text-blue-800 whitespace-pre-wrap">{selectedReturn.admin_notes}</p>
                                    </div>
                                )}

                                {/* Método de Reembolso */}
                                {selectedReturn.refund_method && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <span className="font-semibold text-gray-700">Método de reembolso: </span>
                                        <span className="text-gray-900">
                                            {selectedReturn.refund_method === 'original_payment' ? '💳 Método de pago original' :
                                                selectedReturn.refund_method === 'store_credit' ? '🏪 Crédito en tienda' :
                                                    selectedReturn.refund_method === 'bank_transfer' ? '🏦 Transferencia bancaria' :
                                                        selectedReturn.refund_method}
                                        </span>
                                    </div>
                                )}

                                {/* Fechas */}
                                <div className="text-sm text-gray-600">
                                    <div>Creada: {new Date(selectedReturn.created_at).toLocaleString('es-CO')}</div>
                                    {selectedReturn.processed_at && (
                                        <div>Procesada: {new Date(selectedReturn.processed_at).toLocaleString('es-CO')}</div>
                                    )}
                                </div>
                            </div>

                            {/* Acciones */}
                            {selectedReturn.status === 'pending' && (
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            openProcessModal(selectedReturn, 'approve');
                                        }}
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                                    >
                                        ✅ Aprobar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false);
                                            openProcessModal(selectedReturn, 'reject');
                                        }}
                                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                                    >
                                        ❌ Rechazar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Procesamiento */}
            {showProcessModal && selectedReturn && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {processAction === 'approve' ? '✅ Aprobar' : '❌ Rechazar'} Devolución
                                </h2>
                                <button
                                    onClick={() => setShowProcessModal(false)}
                                    disabled={processing}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded">
                                    <div className="text-sm text-gray-600">Devolución #{selectedReturn.id}</div>
                                    <div className="font-semibold">{selectedReturn.user?.full_name}</div>
                                    <div className="text-sm text-gray-600">
                                        Orden #{selectedReturn.order_id} - ${Number(selectedReturn.refund_amount).toLocaleString('es-CO')} COP
                                    </div>
                                </div>

                                {processAction === 'approve' && (
                                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                                        <div className="flex items-start gap-2">
                                            <div className="text-green-600 font-semibold text-2xl">💳</div>
                                            <div>
                                                <div className="font-semibold text-green-900 mb-1">Método de reembolso</div>
                                                <p className="text-green-800 text-sm">
                                                    El reembolso se realizará como <strong>crédito en tienda</strong>.
                                                    El cliente podrá usar estos créditos en futuras compras.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notas del administrador (opcional)
                                    </label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Agrega notas sobre esta decisión..."
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        ℹ️ Se enviará un correo automático al cliente notificando esta decisión.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setShowProcessModal(false)}
                                    disabled={processing}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={processReturn}
                                    disabled={processing}
                                    className={`flex-1 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 ${processAction === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <FiLoader className="w-5 h-5 animate-spin" />
                                            Procesando...
                                        </span>
                                    ) : (
                                        `Confirmar ${processAction === 'approve' ? 'Aprobación' : 'Rechazo'}`
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
