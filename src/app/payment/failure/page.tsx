"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

function PaymentFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id');
    const orderId = searchParams.get('order_id');
    
    if (transactionId) {
      setPaymentInfo({
        id: transactionId,
        status: 'DECLINED',
        status_detail: 'La transacción fue rechazada'
      });
    }
    
    // Si tenemos orderId, podemos verificar con el backend
    if (orderId) {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ??
        (typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:3010`
          : "");
      
      fetch(`${API_BASE}/payu/status/${orderId}`, {
        credentials: "include"
      })
        .then(res => res.json())
        .then(data => setPaymentInfo(data))
        .catch(err => console.error('Error verificando pago:', err));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-red-700 mb-2">Pago Rechazado</h1>
        <p className="text-gray-600 mb-4">
          Tu pago no pudo ser procesado. Por favor, intenta nuevamente con otro método de pago.
        </p>
        {paymentInfo && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
            <p><strong>ID de Pago:</strong> {paymentInfo.id}</p>
            <p><strong>Estado:</strong> {paymentInfo.status}</p>
            <p><strong>Detalle:</strong> {paymentInfo.status_detail}</p>
          </div>
        )}
        <div className="space-x-4">
          <Button onClick={() => router.push('/')}>
            Intentar de Nuevo
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PaymentFailurePage />
    </Suspense>
  );
}
