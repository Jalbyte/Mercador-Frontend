"use client";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// API base URL from environment variable
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay un ID de transacción en la URL
    const transactionId = searchParams.get('transaction_id');
    if (transactionId) {
      verifyPaymentStatus(transactionId);
    }
  }, [searchParams]);

  const createPaymentPreference = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/payu/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // Incluir cookies de autenticación
        body: JSON.stringify({
          payer: {
            email: "cliente@example.com", // Esto debería venir del usuario autenticado
            name: "Juan",
            surname: "Pérez"
          },
          shipping_address: {
            street_name: "Calle Falsa",
            street_number: 123,
            zip_code: "12345"
          }
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Debes iniciar sesión para proceder al pago");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      setPayment(data);
      
      // Si el pago fue procesado, redirigir automáticamente
      if (data.redirect_url) {
        setTimeout(() => {
          window.location.href = data.redirect_url;
        }, 2000); // 2 segundos para mostrar el resultado
      }
    } catch (err: any) {
      console.error('Error creando pago:', err);
      setError(err.message || "No se pudo procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  const verifyPaymentStatus = async (paymentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/payments/status/${paymentId}`, {
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setPayment(data);
      } else {
        setError("No se pudo verificar el estado del pago");
      }
    } catch (err) {
      console.error('Error verificando pago:', err);
      setError("Error al verificar el pago");
    } finally {
      setLoading(false);
    }
  };

  // Manejar el checkout con PayU
  const handleCheckout = () => {
    createPaymentPreference();
  };

  const handleRedirectToPayment = () => {
    if (payment?.redirect_url) {
      window.location.href = payment.redirect_url;
    } else {
      setError("No se pudo obtener el enlace de pago");
    }
  };

  if (loading) return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <p className="mt-4 text-gray-600">Procesando pago...</p>
    </div>
  );

  if (error) return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
      <Button onClick={() => router.push('/login')} variant="outline">
        Iniciar Sesión
      </Button>
    </div>
  );

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout - Mercador</h1>
      
      {!payment && (
        <div className="space-y-6 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-lg text-gray-800">Pago con PayU Latam</h3>
                <p className="text-sm text-gray-600">Procesamiento seguro de pagos con tarjeta</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">✓ Seguro</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">✓ Rápido</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">🧪 Modo Sandbox</span>
            </div>
          </div>

          <Button 
            onClick={handleCheckout} 
            className="w-full py-6 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando pago...
              </span>
            ) : (
              'Pagar con PayU'
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            💳 En modo sandbox se usa automáticamente la tarjeta de prueba VISA: 4111111111111111
          </p>
        </div>
      )}

      {/* Resultado del pago */}
      {payment && (
        <div className="space-y-6">
          <div className={`border-2 rounded-lg p-6 ${
            payment.state === 'APPROVED' 
              ? 'bg-green-50 border-green-200' 
              : payment.state === 'DECLINED'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h3 className={`font-semibold mb-3 flex items-center text-lg ${
              payment.state === 'APPROVED' 
                ? 'text-green-800' 
                : payment.state === 'DECLINED'
                ? 'text-red-800'
                : 'text-yellow-800'
            }`}>
              {payment.state === 'APPROVED' && (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {payment.state === 'DECLINED' && (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {payment.state === 'PENDING' && (
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {payment.state === 'APPROVED' && 'Pago procesado exitosamente'}
              {payment.state === 'DECLINED' && 'Pago rechazado'}
              {payment.state === 'PENDING' && 'Pago pendiente'}
              {!payment.state && 'Transacción creada'}
            </h3>
            
            <div className="space-y-2 text-sm">
              {payment.transaction_id && (
                <p>
                  <span className="font-semibold">ID Transacción:</span>{' '}
                  <span className="font-mono text-xs bg-white px-2 py-1 rounded">{payment.transaction_id}</span>
                </p>
              )}
              
              {payment.order_id && (
                <p>
                  <span className="font-semibold">Orden:</span>{' '}
                  <span className="font-mono bg-white px-2 py-1 rounded">{payment.order_id}</span>
                </p>
              )}

              {payment.state && (
                <p>
                  <span className="font-semibold">Estado:</span>{' '}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    payment.state === 'APPROVED' ? 'bg-green-200 text-green-900' :
                    payment.state === 'DECLINED' ? 'bg-red-200 text-red-900' :
                    'bg-yellow-200 text-yellow-900'
                  }`}>
                    {payment.state}
                  </span>
                </p>
              )}

              {payment.response_message && (
                <p>
                  <span className="font-semibold">Mensaje:</span>{' '}
                  <span className="text-gray-700">{payment.response_message}</span>
                </p>
              )}

              {payment.mode && (
                <p>
                  <span className="font-semibold">Modo:</span>{' '}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    payment.mode === 'sandbox' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {payment.mode === 'sandbox' ? '🧪 Modo de Prueba' : '🚀 Producción'}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                {payment.state === 'APPROVED' && '✓ Serás redirigido a la página de confirmación en unos segundos...'}
                {payment.state === 'DECLINED' && 'Por favor intenta con otro método de pago'}
                {payment.state === 'PENDING' && 'Tu pago está siendo procesado'}
              </p>
            </div>
          </div>

          {payment.redirect_url && (
            <Button 
              onClick={handleRedirectToPayment} 
              className="w-full py-6 text-lg"
            >
              Ver Detalles del Pago
            </Button>
          )}
        </div>
      )}
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
