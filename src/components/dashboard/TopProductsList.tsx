"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiTrendingUp, FiPackage, FiAlertTriangle } from "react-icons/fi";

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  stock_quantity: number;
}

interface TopProductsListProps {
  products: TopProduct[];
  loading?: boolean;
}

export function TopProductsList({
  products,
  loading = false,
}: TopProductsListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiTrendingUp className="text-green-600" />
            Top Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
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
          <FiTrendingUp className="text-green-600" />
          Top Productos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hay productos disponibles
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiPackage size={14} />
                        {product.sales} ventas
                      </span>
                      {product.stock_quantity < 10 && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <FiAlertTriangle size={14} />
                          Stock bajo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {formatCurrency(product.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Stock: {product.stock_quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
