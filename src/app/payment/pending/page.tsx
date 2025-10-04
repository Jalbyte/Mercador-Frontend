"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export default function PaymentPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    if (paymentId) {
      // Verificar el estado del pago
      fetch(`http://localhost:3010/payments/status/${paymentId}`, {
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
        <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-yellow-700 mb-2">Pago Pendiente</h1>
        <p className="text-gray-600 mb-4">
          Tu pago está siendo procesado. Recibirás una notificación cuando se complete.
          Esto puede tomar unos minutos.
        </p>
        {paymentInfo && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
            <p><strong>ID de Pago:</strong> {paymentInfo.id}</p>
            <p><strong>Estado:</strong> {paymentInfo.status}</p>
          </div>
        )}
        <div className="space-x-4">
          <Button onClick={() => router.push('/profile')}>
            Ver Mis Órdenes
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}