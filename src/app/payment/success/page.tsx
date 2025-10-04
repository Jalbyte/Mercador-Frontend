"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type PaymentStatus = 'success' | 'failure' | 'pending';

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const paymentId = searchParams.get('payment_id');
      const externalReference = searchParams.get('external_reference');
      const collectionStatus = searchParams.get('collection_status');

      if (!paymentId) {
        setStatus('failure');
        setLoading(false);
        return;
      }

      try {
        // Verificar el estado del pago con el backend
        const response = await fetch(`http://localhost:3010/payments/status/${paymentId}`, {
          credentials: "include" // Incluir cookies de autenticación
        });

        if (response.ok) {
          const data = await response.json();
          setPaymentInfo(data);

          // Determinar el estado basado en la respuesta de Mercado Pago
          if (data.approved) {
            setStatus('success');
          } else if (data.status === 'pending') {
            setStatus('pending');
          } else {
            setStatus('failure');
          }
        } else {
          // Si no podemos verificar, usar el parámetro de URL como fallback
          if (collectionStatus === 'approved') {
            setStatus('success');
          } else if (collectionStatus === 'pending') {
            setStatus('pending');
          } else {
            setStatus('failure');
          }
        }
      } catch (error) {
        console.error('Error verificando pago:', error);
        setStatus('failure');
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg">Verificando estado del pago...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-700 mb-2">¡Pago Exitoso!</h1>
            <p className="text-gray-600 mb-4">
              Tu pago ha sido procesado correctamente. Las claves de licencia estarán disponibles en tu perfil.
            </p>
            {paymentInfo && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left max-w-md mx-auto">
                <p><strong>ID de Pago:</strong> {paymentInfo.id}</p>
                <p><strong>Monto:</strong> ${paymentInfo.transaction_amount}</p>
                <p><strong>Estado:</strong> {paymentInfo.status}</p>
              </div>
            )}
            <div className="space-x-4">
              <Button onClick={() => router.push('/profile')}>
                Ver Mis Claves
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Seguir Comprando
              </Button>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="text-center">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-yellow-700 mb-2">Pago Pendiente</h1>
            <p className="text-gray-600 mb-4">
              Tu pago está siendo procesado. Te notificaremos cuando se complete.
            </p>
            {paymentInfo && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left max-w-md mx-auto">
                <p><strong>ID de Pago:</strong> {paymentInfo.id}</p>
                <p><strong>Estado:</strong> {paymentInfo.status}</p>
              </div>
            )}
            <Button onClick={() => router.push('/')}>
              Volver al Inicio
            </Button>
          </div>
        );

      case 'failure':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-700 mb-2">Pago Rechazado</h1>
            <p className="text-gray-600 mb-4">
              Tu pago no pudo ser procesado. Por favor, intenta nuevamente.
            </p>
            {paymentInfo && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left max-w-md mx-auto">
                <p><strong>ID de Pago:</strong> {paymentInfo.id}</p>
                <p><strong>Estado:</strong> {paymentInfo.status}</p>
                <p><strong>Detalle:</strong> {paymentInfo.status_detail}</p>
              </div>
            )}
            <div className="space-x-4">
              <Button onClick={() => router.push('/cart')}>
                Intentar de Nuevo
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Volver al Inicio
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Estado Desconocido</h1>
            <p className="text-gray-600 mb-4">
              No se pudo determinar el estado del pago.
            </p>
            <Button onClick={() => router.push('/')}>
              Volver al Inicio
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        {renderContent()}
      </div>
    </div>
  );
}