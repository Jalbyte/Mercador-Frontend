"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiPieChart } from "react-icons/fi";

interface CategoryData {
  category: string;
  revenue: number;
  orders: number;
  percentage: number;
}

interface CategoryDistributionProps {
  data: CategoryData[];
  loading?: boolean;
}

export function CategoryDistribution({
  data,
  loading = false,
}: CategoryDistributionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-orange-500",
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiPieChart className="text-purple-600" />
            Distribución por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiPieChart className="text-purple-600" />
          Distribución por Categoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hay datos de categorías
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visual Bar Chart */}
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="font-medium text-gray-700">
                      {item.category}
                    </span>
                    <span className="text-gray-900 font-bold">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${
                        colors[index % colors.length]
                      } transition-all duration-500 ease-out rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Stats Table */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                {data.map((item, index) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          colors[index % colors.length]
                        }`}
                      ></div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.category}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.orders} {item.orders === 1 ? "orden" : "órdenes"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {formatCurrency(item.revenue)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {((item.revenue / totalRevenue) * 100).toFixed(1)}% del
                        total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="font-bold text-gray-900">Total</div>
                <div className="font-bold text-blue-600 text-lg">
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
