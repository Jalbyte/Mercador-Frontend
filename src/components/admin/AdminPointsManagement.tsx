/**
 * Componente para gestionar puntos de usuarios desde el panel de administración
 * Permite ver, filtrar y ajustar puntos de cualquier usuario
 */

"use client";

import { useState, useEffect } from "react";
import {
  FiGift,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiDollarSign,
  FiFilter,
  FiSearch,
  FiPlus,
  FiMinus,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface UserPoints {
  userId: string;
  email: string;
  fullName: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  valueInPesos: number;
  createdAt: string;
  updatedAt: string;
}

interface PointsStats {
  totalUsers: number;
  totalPointsInCirculation: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  valueInPesos: number;
  constants: {
    pointsPer1000Pesos: number;
    pesosPerPoint: number;
    earningDivisor: number;
  };
  transactionsByType: {
    earned: number;
    spent: number;
    refund: number;
    adjustment: number;
  };
  topUsers: Array<{
    userId: string;
    email: string;
    fullName: string;
    balance: number;
    totalEarned: number;
    valueInPesos: number;
  }>;
}

interface AdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserPoints | null;
  onSuccess: () => void;
}

function AdjustPointsModal({ isOpen, onClose, user, onSuccess }: AdjustModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/admin/points/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user.userId,
          amount,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al ajustar puntos");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setAmount(0);
        setReason("");
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al ajustar puntos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ajustar Puntos
        </h2>

        {success ? (
          <div className="text-center py-8">
            <FiCheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <p className="text-green-700 font-semibold">
              ¡Puntos ajustados exitosamente!
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Usuario:</p>
              <p className="font-semibold text-gray-900">{user.email}</p>
              <p className="text-sm text-gray-600 mt-2">Balance actual:</p>
              <p className="text-2xl font-bold text-blue-600">
                {user.balance.toLocaleString()} pts
              </p>
              <p className="text-sm text-gray-500">
                ≈ ${user.valueInPesos.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad de puntos *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAmount(Math.max(0, amount - 100))}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    <FiMinus />
                  </button>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 100 (positivo para agregar, negativo para quitar)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(amount + 100)}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    <FiPlus />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {amount > 0 ? "Agregar" : amount < 0 ? "Quitar" : "Sin cambios"}{" "}
                  {Math.abs(amount)} puntos ≈ ${(Math.abs(amount) * 10).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón del ajuste *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Compensación por error en sistema, Promoción especial, etc."
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <FiAlertCircle className="text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || amount === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Confirmar Ajuste"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function AdminPointsManagement() {
  const [users, setUsers] = useState<UserPoints[]>([]);
  const [stats, setStats] = useState<PointsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"balance" | "total_earned" | "total_spent">("balance");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPoints | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [page, sortBy, order]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/points/stats`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const offset = page * limit;
      const response = await fetch(
        `${API_BASE}/admin/points/users?limit=${limit}&offset=${offset}&sortBy=${sortBy}&order=${order}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }

      const data = await response.json();
      setUsers(data.users);
      setHasMore(data.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustPoints = (user: UserPoints) => {
    setSelectedUser(user);
    setShowAdjustModal(true);
  };

  const handleAdjustSuccess = () => {
    fetchUsers();
    fetchStats();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <FiUsers className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Puntos en Circulación</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.totalPointsInCirculation.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  ≈ ${stats.valueInPesos.toLocaleString()}
                </p>
              </div>
              <FiGift className="text-amber-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ganado</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalPointsEarned.toLocaleString()}
                </p>
              </div>
              <FiTrendingUp className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gastado</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.totalPointsSpent.toLocaleString()}
                </p>
              </div>
              <FiTrendingDown className="text-red-500" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="balance">Balance</option>
              <option value="total_earned">Total Ganado</option>
              <option value="total_spent">Total Gastado</option>
            </select>

            <button
              onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {order === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Ganado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Gastado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor ($)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FiLoader className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
                    <p className="text-gray-600">Cargando usuarios...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FiAlertCircle className="mx-auto text-red-600 mb-2" size={32} />
                    <p className="text-red-600">{error}</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-blue-600">
                        {user.balance.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-green-600">
                        {user.totalEarned.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-red-600">
                        {user.totalSpent.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-medium text-gray-900">
                        ${user.valueInPesos.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleAdjustPoints(user)}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        <FiGift size={14} />
                        Ajustar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Página {page + 1} • Mostrando {filteredUsers.length} usuarios
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiChevronLeft />
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Siguiente
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Adjust Points Modal */}
      <AdjustPointsModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        user={selectedUser}
        onSuccess={handleAdjustSuccess}
      />
    </div>
  );
}
