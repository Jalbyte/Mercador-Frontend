"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function PurchasesPage() {
  // Mock data - in a real app, this would come from an API
  const orders = [
    {
      id: "ORD-12345",
      date: "2023-06-15",
      status: "Entregado",
      total: 149.99,
      items: [
        {
          name: "Licencia de Windows 10 Pro",
          quantity: 1,
          price: 99.99,
        },
        {
          name: "Licencia de Office 365",
          quantity: 1,
          price: 50.00,
        },
      ],
    },
    {
      id: "ORD-12344",
      date: "2023-05-22",
      status: "Entregado",
      total: 199.98,
      items: [
        {
          name: "Licencia de Adobe Photoshop",
          quantity: 2,
          price: 99.99,
        },
      ],
    },
  ];

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mis Compras</h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">No hay compras recientes</h2>
            <p className="text-gray-500 mb-6">Todavía no has realizado ninguna compra en nuestra tienda.</p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ver productos
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Orden #{order.id}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Realizada el {new Date(order.date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {order.status}
                  </span>
                </div>
                <div className="border-b border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {order.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Cantidad: {item.quantity}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ${item.price.toFixed(2)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                  <a
                    href={`/orders/${order.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Ver detalles
                  </a>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
