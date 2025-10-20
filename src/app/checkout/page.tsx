"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";
import WompiCheckout from "@/components/payment/WompiCheckout";

function CheckoutPage() {
  const router = useRouter();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout - Mercador</h1>
      
      <WompiCheckout
        amount={50000}
        currency="COP"
        reference={`ORDER-${Date.now()}`}
        customerEmail="cliente@example.com"
        customerName="Juan Pérez"
        onSuccess={(transaction) => {
          console.log("✅ Pago exitoso:", transaction);
          router.push("/checkout/wompi-callback?status=APPROVED");
        }}
        onError={(error) => {
          console.error("❌ Error en el pago:", error);
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
