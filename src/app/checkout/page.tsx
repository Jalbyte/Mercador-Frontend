"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import WompiCheckout from "@/components/payment/WompiCheckout";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/hooks/use-cart";
import { Gift, Sparkles, Calculator, AlertCircle } from "lucide-react";

// API base URL from environment variable
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  order_items?: any[];
}

interface PointsBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  valueInPesos: number;
  constants: {
    pointsPer1000Pesos: number;
    pesosPerPoint: number;
    earningDivisor: number;
  }
}

function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExistingOrder, setIsExistingOrder] = useState(false);
  
  // Estados para puntos
  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [loadingPoints, setLoadingPoints] = useState(true);

  // Obtener orderId desde la URL
  const orderIdFromUrl = searchParams.get('orderId');

  // Verificar autenticación y carrito
  useEffect(() => {
    // Esperar a que termine de cargar la autenticación
    if (isAuthLoading) return;

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Si hay un orderId en la URL, cargar esa orden (orden pendiente)
    if (orderIdFromUrl) {
      setIsExistingOrder(true);
      loadExistingOrder(orderIdFromUrl);
      fetchPointsBalance();
      return;
    }

    // Si no hay orderId y el carrito está vacío, redirigir al inicio
    if (!cartItems || cartItems.length === 0) {
      router.push("/");
      return;
    }

    // Todo OK, crear la orden desde el carrito y obtener balance de puntos
    createOrder();
    fetchPointsBalance();
  }, [isAuthLoading, isAuthenticated, cartItems, orderIdFromUrl]);

  // Obtener balance de puntos
  const fetchPointsBalance = async () => {
    try {
      const response = await fetch(`${API_BASE}/points/balance`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPointsBalance(data);
      }
    } catch (err) {
      console.error('Error fetching points balance:', err);
    } finally {
      setLoadingPoints(false);
    }
  };

  // Cargar orden existente desde el backend (para órdenes pendientes)
  const loadExistingOrder = async (orderId: string) => {
    try {
      console.log("📦 Cargando orden existente:", orderId);

      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Orden cargada:", result.data);

      // Validar que la orden esté pendiente
      if (result.data.status !== 'pending') {
        throw new Error('Esta orden ya ha sido procesada o no está disponible para pago');
      }

      setOrder(result.data);
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Error cargando orden:", err);
      setError(err.message || "No se pudo cargar la orden");
      setLoading(false);
    }
  };

  // Crear orden al cargar la página
  const createOrder = async () => {
    try {
      console.log("🛒 Creando orden antes del pago...");

      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          shippingAddress: {
            // Datos de envío por defecto - en producción obtener del formulario
            addressLine1: "Calle 123 #45-67",
            city: "Bogotá",
            region: "Cundinamarca",
            country: "Colombia",
            phoneNumber: "3001234567"
          },
          paymentMethod: 'wompi'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Orden creada:", result.data);

      setOrder(result.data);
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Error creando orden:", err);
      setError(err.message || "No se pudo crear la orden");
      setLoading(false);
    }
  };

  // Calcular descuento por puntos
  const calculateDiscount = () => {
    if (!usePoints || pointsToUse === 0 || !pointsBalance) return 0;
    return pointsToUse * pointsBalance.constants.pesosPerPoint;
  };

  // Calcular total final
  const calculateFinalTotal = () => {
    if (!order) return 0;
    const discount = calculateDiscount();
    return Math.max(0, order.total_amount - discount);
  };

  // Calcular puntos máximos que se pueden usar
  const getMaxPoints = () => {
    if (!pointsBalance || !order) return 0;
    const maxByBalance = pointsBalance.balance;
    const maxByOrderTotal = Math.floor(order.total_amount / pointsBalance.constants.pesosPerPoint);
    return Math.min(maxByBalance, maxByOrderTotal);
  };

  // Manejar cambio en el slider de puntos
  const handlePointsChange = (value: number) => {
    const maxPoints = getMaxPoints();
    setPointsToUse(Math.min(value, maxPoints));
  };

  // Calcular puntos que se ganarán
  const calculateEarnedPoints = () => {
    const finalTotal = calculateFinalTotal();
    if (!pointsBalance) return 0;
    return Math.floor(finalTotal / pointsBalance.constants.earningDivisor);
  };

  // Manejar pago 100% con puntos
  const handlePayWithPoints = async () => {
    if (!order) {
      setError("No hay orden disponible");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/wompi/pay-with-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ orderId: order.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'No se pudo procesar el pago con puntos');
      }

      const result = await response.json();
      console.log("✅ Pago con puntos exitoso:", result);
      
      if (!isExistingOrder) {
        clearCart();
      }
      router.push(`/checkout/success?orderId=${order.id}&transactionId=points-payment`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando tu orden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!order || !user) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <p className="text-gray-600">No se pudo crear la orden</p>
        </div>
      </div>
    );
  }

  // Función para guardar los puntos en order_points antes del pago
  const savePointsBeforePayment = async () => {
    if (!usePoints || pointsToUse === 0) {
      console.log("💎 No se usan puntos en esta compra");
      return;
    }

    try {
      console.log("💎 Guardando puntos para usar:", pointsToUse);
      
      const response = await fetch(`${API_BASE}/points/pre-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.id,
          pointsToUse: pointsToUse
        }),
      });

      if (!response.ok) {
        console.error("❌ Error guardando puntos");
        throw new Error("No se pudieron guardar los puntos");
      }

      console.log("✅ Puntos guardados correctamente");
    } catch (err: any) {
      console.error("❌ Error en savePointsBeforePayment:", err);
      throw err; // Re-lanzar error para que Wompi no abra
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {isExistingOrder ? `Completar Pago - Orden #${order.id}` : 'Checkout - Mercador'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Resumen y Puntos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resumen de la orden */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Resumen de tu orden</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID de orden:</span>
                <span className="font-medium">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium capitalize">{order.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${order.total_amount?.toLocaleString('es-CO') || '0'} COP</span>
              </div>
              {order.order_items && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{order.order_items.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Productos en la orden */}
          {order.order_items && order.order_items.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Productos</h2>
              <div className="flex flex-col space-y-4">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                    {/* Imagen del producto */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product?.image_url || '/placeholder.png'}
                        alt={item.product?.name || 'Producto'}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>

                    {/* Detalles del producto */}
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.product?.name || 'Producto sin nombre'}
                      </h3>
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Cantidad:</span>
                          <span className="font-medium">{item.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Precio unitario:</span>
                          <span className="font-medium">${item.price?.toLocaleString('es-CO')} COP</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t">
                          <span className="font-semibold">Subtotal:</span>
                          <span className="font-semibold text-purple-600">
                            ${((item.price || 0) * (item.quantity || 0)).toLocaleString('es-CO')} COP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección de Puntos */}
          {!loadingPoints && pointsBalance && pointsBalance.balance > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-md p-6 border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Gift className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-yellow-900">
                    Usar Puntos de Recompensa
                  </h2>
                  <p className="text-sm text-yellow-700">
                    Tienes {pointsBalance.balance.toLocaleString('es-CO')} puntos disponibles
                    (${pointsBalance.valueInPesos.toLocaleString('es-CO')} COP)
                  </p>
                </div>
              </div>

              {/* Toggle para usar puntos */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => {
                    setUsePoints(!usePoints);
                    if (usePoints) setPointsToUse(0);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    usePoints ? 'bg-yellow-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      usePoints ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-900">
                  {usePoints ? 'Puntos activados' : 'Activar puntos'}
                </span>
              </div>

              {/* Slider de puntos */}
              {usePoints && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Cantidad de puntos a usar
                      </label>
                      <span className="text-sm font-bold text-yellow-900">
                        {pointsToUse.toLocaleString('es-CO')} pts
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={getMaxPoints()}
                      value={pointsToUse}
                      onChange={(e) => handlePointsChange(parseInt(e.target.value))}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, #ca8a04 0%, #ca8a04 ${(pointsToUse / getMaxPoints()) * 100}%, #fef08a ${(pointsToUse / getMaxPoints()) * 100}%, #fef08a 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>0</span>
                      <span>{getMaxPoints().toLocaleString('es-CO')}</span>
                    </div>
                  </div>

                  {/* Botones rápidos */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePointsChange(Math.floor(getMaxPoints() * 0.25))}
                      className="flex-1 px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded transition-colors"
                    >
                      25%
                    </button>
                    <button
                      onClick={() => handlePointsChange(Math.floor(getMaxPoints() * 0.5))}
                      className="flex-1 px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded transition-colors"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => handlePointsChange(Math.floor(getMaxPoints() * 0.75))}
                      className="flex-1 px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded transition-colors"
                    >
                      75%
                    </button>
                    <button
                      onClick={() => handlePointsChange(getMaxPoints())}
                      className="flex-1 px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                    >
                      Máx
                    </button>
                  </div>

                  {/* Información del descuento */}
                  {pointsToUse > 0 && (
                    <div className="bg-yellow-100 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calculator className="w-4 h-4 text-yellow-700" />
                        <span className="font-medium text-yellow-900">Descuento aplicado:</span>
                        <span className="font-bold text-yellow-900">
                          -${calculateDiscount().toLocaleString('es-CO')} COP
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-yellow-700" />
                        <span className="font-medium text-yellow-900">Balance después del pago:</span>
                        <span className="font-bold text-yellow-900">
                          {(pointsBalance.balance - pointsToUse).toLocaleString('es-CO')} pts
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info sobre puntos a ganar */}
              <div className="mt-4 pt-4 border-t border-yellow-200">
                <div className="flex items-center gap-2 text-sm text-yellow-800">
                  <Gift className="w-4 h-4" />
                  <span>
                    Con esta compra ganarás{' '}
                    <strong className="text-yellow-900">
                      {calculateEarnedPoints()} puntos
                    </strong>
                    {' '}(${(calculateEarnedPoints() * pointsBalance.constants.pesosPerPoint).toLocaleString('es-CO')} COP)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha - Total y Pago */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Total a Pagar</h2>
            
            {/* Desglose */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>${order.total_amount?.toLocaleString('es-CO')} COP</span>
              </div>
              {usePoints && pointsToUse > 0 && (
                <div className="flex justify-between text-yellow-700">
                  <span className="font-medium">Descuento (puntos):</span>
                  <span className="font-medium">-${calculateDiscount().toLocaleString('es-CO')} COP</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between items-baseline">
                <span className="text-lg font-bold">Total:</span>
                <div className="text-right">
                  {usePoints && pointsToUse > 0 && (
                    <div className="text-xs text-gray-500 line-through">
                      ${order.total_amount?.toLocaleString('es-CO')} COP
                    </div>
                  )}
                  <div className="text-2xl font-bold text-purple-600">
                    ${calculateFinalTotal().toLocaleString('es-CO')} COP
                  </div>
                </div>
              </div>
            </div>

            {/* Alerta si usa todos los puntos */}
            {usePoints && pointsToUse === pointsBalance?.balance && pointsBalance.balance > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Estás usando todos tus puntos disponibles. Tu balance quedará en 0 pts.
                  </p>
                </div>
              </div>
            )}

            {/* Componente de Wompi o Botón de Pagar con Puntos */}
            {calculateFinalTotal() === 0 && usePoints ? (
              <button
                onClick={handlePayWithPoints}
                className="w-full py-3 text-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-md hover:from-green-600 hover:to-emerald-700 transition-all"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar Pago con Puntos'}
              </button>
            ) : (
              <WompiCheckout
                amount={calculateFinalTotal()}
                currency="COP"
                reference={`ORDER-${order.id}`}
                customerEmail={user.email || ""}
                customerName={user.full_name || "Cliente"}
                customerPhone="3001234567"
                onBeforePayment={savePointsBeforePayment}
                onSuccess={(transaction) => {
                  console.log("✅ Pago exitoso:", transaction);
                  if (!isExistingOrder) {
                    clearCart();
                  }
                  router.push(`/checkout/success?orderId=${order.id}&transactionId=${transaction.id}`);
                }}
                onError={(error) => {
                  console.error("❌ Error en el pago:", error);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
