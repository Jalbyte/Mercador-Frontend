"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutFailure() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const error = searchParams.get('error');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Obtener detalles de la orden
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          setOrder(result.data);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Icono de error */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pago No Procesado</h1>
          <p className="text-gray-600">Hubo un problema al procesar tu pago</p>
        </div>

        {/* Detalles del error */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-800">Detalles del problema</h2>

          {error && (
            <div className="mb-4">
              <p className="text-red-700 font-medium">Error reportado:</p>
              <p className="text-red-600 mt-1">{decodeURIComponent(error)}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Verificando estado de la orden...</p>
            </div>
          ) : order ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">ID de Orden:</span>
                <span className="font-mono text-sm bg-white px-2 py-1 rounded border">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Estado:</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  order.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : order.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Total:</span>
                <span className="font-bold text-lg">${order.total_amount?.toLocaleString()} COP</span>
              </div>
            </div>
          ) : orderId ? (
            <div className="text-center py-4">
              <p className="text-gray-700">ID de Orden: <span className="font-mono">{orderId}</span></p>
              <p className="text-sm text-gray-500 mt-1">No se pudieron cargar los detalles completos</p>
            </div>
          ) : (
            <p className="text-gray-700">No hay información adicional disponible</p>
          )}
        </div>

        {/* Posibles causas */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">Posibles causas del error</h3>
          <ul className="space-y-2 text-yellow-800">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Fondos insuficientes en la tarjeta
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Tarjeta expirada o bloqueada
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Error en la conexión con el banco
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Datos de la tarjeta incorrectos
            </li>
          </ul>
        </div>

        {/* ¿Qué hacer ahora? */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">¿Qué puedes hacer?</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Verificar los datos de tu tarjeta y volver a intentar
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Usar una tarjeta diferente
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Contactar a tu banco si el problema persiste
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Revisar el estado de tu orden en "Mis órdenes"
            </li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/checkout')}
            className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Ver mis órdenes
          </button>
        </div>
      </div>
    </div>
  );
}