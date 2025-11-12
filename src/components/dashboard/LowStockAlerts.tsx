"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { FiAlertTriangle, FiPackage } from "react-icons/fi";

interface LowStockItem {
  stock_quantity: number;
  id: string;
  name: string;
  image_url: string;
}

interface LowStockAlertsProps {
  items: LowStockItem[];
  loading?: boolean;
}

export function LowStockAlerts({ items, loading = false }: LowStockAlertsProps) {
  const getDaysUntilOutOfStock = (stock: number, salesPerDay: number) => {
    if (salesPerDay === 0) return Infinity;
    const days = Math.floor(stock / (salesPerDay / 30));
    return days;
  };

  const getUrgencyColor = (stock: number, minStock: number) => {
    const percentage = (stock / minStock) * 100;
    if (percentage <= 50) return "text-red-600 bg-red-100";
    if (percentage <= 100) return "text-yellow-600 bg-yellow-100";
    return "text-orange-600 bg-orange-100";
  };

  const getUrgencyLevel = (stock: number, minStock: number) => {
    const percentage = (stock / minStock) * 100;
    if (percentage <= 50) return "Crítico";
    if (percentage <= 100) return "Urgente";
    return "Bajo";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiAlertTriangle className="text-orange-600" />
            Alertas de Stock Bajo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <FiAlertTriangle className="text-orange-600" />
          Alertas de Stock Bajo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FiPackage size={48} className="mx-auto mb-2 opacity-50" />
            <p>No hay alertas de stock bajo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="p-4 border-l-4 border-orange-500 bg-orange-50/50 rounded-r-lg hover:bg-orange-50 transition-colors flex items-center justify-between"
                >
                  <div>

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {item.name}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">Stock Actual</div>
                        <div className="font-bold text-gray-900">
                          {item.stock_quantity} unidades
                        </div>
                      </div>
                      <div>
                      </div>
                    </div>
                  </div>
                  <Image src={item.image_url} alt={item.name} width={128} height={128} className="w-20 h-fit" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
