"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function WompiCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const transactionId = searchParams.get("id");
    const status = searchParams.get("status");

    if (transactionId) {
      // Consultar el estado de la transacción en el backend
      verifyTransaction(transactionId);
    } else if (status) {
      // Si no hay ID pero hay status, mostrar el resultado
      setTransaction({ status });
      setLoading(false);
    } else {
      setError("No se recibió información de la transacción");
      setLoading(false);
    }
  }, [searchParams]);

  const verifyTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/wompi/status/${transactionId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo verificar la transacción");
      }

      const data = await response.json();
      setTransaction(data.data);
    } catch (err: any) {
      console.error("Error verificando transacción:", err);
      setError(err.message || "Error al verificar la transacción");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-16 w-16 bg-purple-200 rounded-full mx-auto"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="mt-6 text-center text-gray-600">
            Verificando transacción...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-6xl mb-4 text-center">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Error
          </h1>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/checkout")}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Intentar de nuevo
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = transaction?.status === "APPROVED";
  const isDeclined = transaction?.status === "DECLINED";
  const isPending = transaction?.status === "PENDING";

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        isApproved
          ? "bg-gradient-to-br from-green-50 to-emerald-50"
          : isDeclined
          ? "bg-gradient-to-br from-red-50 to-orange-50"
          : "bg-gradient-to-br from-yellow-50 to-amber-50"
      }`}
    >
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        {/* Icono */}
        <div className="text-6xl mb-4 text-center">
          {isApproved && "✅"}
          {isDeclined && "❌"}
          {isPending && "⏳"}
          {!isApproved && !isDeclined && !isPending && "❓"}
        </div>

        {/* Título */}
        <h1
          className={`text-2xl font-bold mb-2 text-center ${
            isApproved
              ? "text-green-800"
              : isDeclined
              ? "text-red-800"
              : "text-yellow-800"
          }`}
        >
          {isApproved && "¡Pago Exitoso!"}
          {isDeclined && "Pago Rechazado"}
          {isPending && "Pago Pendiente"}
          {!isApproved && !isDeclined && !isPending && "Estado Desconocido"}
        </h1>

        {/* Mensaje */}
        <p className="text-gray-600 mb-6 text-center">
          {isApproved &&
            "Tu pago ha sido procesado correctamente. ¡Gracias por tu compra!"}
          {isDeclined &&
            "Tu pago no pudo ser procesado. Por favor intenta con otro método de pago."}
          {isPending &&
            "Tu pago está siendo procesado. Te notificaremos cuando se complete."}
          {!isApproved &&
            !isDeclined &&
            !isPending &&
            "No pudimos determinar el estado de tu pago."}
        </p>

        {/* Detalles de la transacción */}
        {transaction && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            {transaction.id && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ID Transacción:</span>
                <span className="font-mono text-xs font-semibold text-gray-800">
                  {transaction.id}
                </span>
              </div>
            )}
            {transaction.reference && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Referencia:</span>
                <span className="font-mono text-xs text-gray-800">
                  {transaction.reference}
                </span>
              </div>
            )}
            {transaction.amount_in_cents && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monto:</span>
                <span className="font-bold text-gray-800">
                  ${(transaction.amount_in_cents / 100).toLocaleString()}{" "}
                  {transaction.currency || "COP"}
                </span>
              </div>
            )}
            {transaction.status && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estado:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isApproved
                      ? "bg-green-200 text-green-900"
                      : isDeclined
                      ? "bg-red-200 text-red-900"
                      : "bg-yellow-200 text-yellow-900"
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
            )}
            {transaction.status_message && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mensaje:</span>
                <span className="text-gray-800 text-right max-w-xs">
                  {transaction.status_message}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="space-y-3">
          {isApproved && (
            <>
              <Button
                onClick={() => router.push("/orders")}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
              >
                Ver mis pedidos
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                Volver al inicio
              </Button>
            </>
          )}

          {isDeclined && (
            <>
              <Button
                onClick={() => router.push("/checkout")}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Intentar de nuevo
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                Volver al inicio
              </Button>
            </>
          )}

          {isPending && (
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600"
            >
              Volver al inicio
            </Button>
          )}

          {!isApproved && !isDeclined && !isPending && (
            <>
              <Button
                onClick={() => router.push("/checkout")}
                className="w-full"
              >
                Volver al checkout
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                Volver al inicio
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WompiCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">Cargando...</div>
        </div>
      }
    >
      <WompiCallbackContent />
    </Suspense>
  );
}
