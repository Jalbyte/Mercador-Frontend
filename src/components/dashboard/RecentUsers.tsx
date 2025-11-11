"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiUserPlus, FiShoppingCart, FiDollarSign } from "react-icons/fi";

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
}

interface RecentUsersProps {
  users: RecentUser[];
  loading?: boolean;
}

export function RecentUsers({ users, loading = false }: RecentUsersProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getUserBadge = (orders: number, spent: number) => {
    if (spent >= 1000) return { label: "VIP", color: "bg-purple-100 text-purple-700" };
    if (spent >= 500) return { label: "Premium", color: "bg-blue-100 text-blue-700" };
    if (orders >= 5) return { label: "Frecuente", color: "bg-green-100 text-green-700" };
    if (orders > 0) return { label: "Activo", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Nuevo", color: "bg-gray-100 text-gray-700" };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiUserPlus className="text-green-600" />
            Usuarios Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiUserPlus className="text-green-600" />
          Usuarios Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hay usuarios recientes
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const badge = getUserBadge(user.total_orders, user.total_spent);
              return (
                <div
                  key={user.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-gray-500 text-xs mb-1">
                        Registro
                      </div>
                      <div className="font-medium text-gray-900 text-xs">
                        {formatDate(user.created_at)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-gray-500 text-xs mb-1 flex items-center justify-center gap-1">
                        <FiShoppingCart size={12} />
                        Órdenes
                      </div>
                      <div className="font-bold text-gray-900">
                        {user.total_orders}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-gray-500 text-xs mb-1 flex items-center justify-center gap-1">
                        <FiDollarSign size={12} />
                        Gastado
                      </div>
                      <div className="font-bold text-green-600 text-xs">
                        {formatCurrency(user.total_spent)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
