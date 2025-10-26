"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import WompiCheckout from "@/components/payment/WompiCheckout";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/hooks/use-cart";

// API base URL from environment variable
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  items?: any[];
}

function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticación y carrito
  useEffect(() => {
    // Esperar a que termine de cargar la autenticación
    if (isAuthLoading) return;

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Si el carrito está vacío, redirigir al inicio
    if (!cartItems || cartItems.length === 0) {
      router.push("/");
      return;
    }

    // Todo OK, crear la orden
    createOrder();
  }, [isAuthLoading, isAuthenticated, cartItems]);

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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout - Mercador</h1>

      {/* Mostrar resumen de la orden */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Resumen de tu orden</h2>
        <div className="space-y-2">
          <p><span className="font-semibold">ID de orden:</span> {order.id}</p>
          <p><span className="font-semibold">Estado:</span> {order.status}</p>
          <p><span className="font-semibold">Total:</span> ${order.total_amount?.toLocaleString() || '0'} COP</p>
          {order.items && (
            <p><span className="font-semibold">Items:</span> {order.items.length}</p>
          )}
        </div>
      </div>

      <WompiCheckout
        amount={order.total_amount || 0}
        currency="COP"
        reference={`ORDER-${order.id}`} // Usar el ID real de la orden
        customerEmail={user.email || ""}
        customerName={user.full_name || "Cliente"}
        customerPhone="3001234567"
        onSuccess={(transaction) => {
          console.log("✅ Pago exitoso:", transaction);
          // Limpiar carrito después del pago exitoso
          clearCart();
          router.push(`/checkout/success?orderId=${order.id}&transactionId=${transaction.id}`);
        }}
        onError={(error) => {
          console.error("❌ Error en el pago:", error);
          router.push(`/checkout/failure?orderId=${order.id}&error=${encodeURIComponent(error.message || 'Error desconocido')}`);
        }}
      />
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
