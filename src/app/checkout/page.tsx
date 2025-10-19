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
    // Si hay un ID de pago en la URL, verificar su estado
    const paymentId = searchParams.get('id');
    if (paymentId) {
      verifyPaymentStatus(paymentId);
    } else {
      // Si no hay ID, crear nueva preferencia de pago
      createPaymentPreference();
    }
  }, [searchParams]);

  const createPaymentPreference = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/payments/create`, {
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
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setPayment(data.data);
    } catch (err) {
      console.error('Error creando preferencia de pago:', err);
      setError("No se pudo crear la preferencia de pago");
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

  // Integración con Checkout Pro de Mercado Pago
  const handleCheckout = () => {
    if (payment?.init_point) {
      // Redirigir a Mercado Pago Checkout Pro
      window.location.href = payment.init_point;
    } else {
      alert("No se pudo obtener el enlace de pago");
    }
  };

  if (loading) return <div className="p-8">Procesando...</div>;
  if (error) return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="text-red-500 mb-4">{error}</div>
      <Button onClick={() => router.push('/login')}>Iniciar Sesión</Button>
    </div>
  );

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Checkout Mercador</h1>
      {payment && (
        <div className="mb-4">
          <p>Preferencia de pago creada exitosamente</p>
          <p>ID: <span className="font-mono">{payment.id}</span></p>
          <p>Orden ID: <span className="font-mono">{payment.external_reference}</span></p>
        </div>
      )}
      <Button onClick={handleCheckout} className="w-full" disabled={!payment}>
        Pagar con Mercado Pago
      </Button>
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
