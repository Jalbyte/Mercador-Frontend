"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// API base URL from environment variable
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Extender Window para incluir WidgetCheckout de Wompi
declare global {
  interface Window {
    WidgetCheckout?: any;
  }
}

interface WompiCheckoutProps {
  amount: number;
  currency?: string;
  reference: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerPhonePrefix?: string; // Prefijo del país
  onBeforePayment?: () => Promise<void>; // Callback antes de iniciar el pago
  onSuccess?: (transaction: any) => void;
  onError?: (error: any) => void;
}

export default function WompiCheckout({
  amount,
  currency = "COP",
  reference,
  customerEmail,
  customerName = "Cliente",
  customerPhone = "3001234567",
  customerPhonePrefix = "+57", // Por defecto Colombia
  onBeforePayment,
  onSuccess,
  onError,
}: WompiCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar el script de Wompi y obtener la public key
  useEffect(() => {
    // Obtener configuración pública
    const fetchConfig = async () => {
      try {
        console.log("🔍 Obteniendo config de Wompi desde:", `${API_BASE}/wompi/config`);
        const response = await fetch(`${API_BASE}/wompi/config`);
        if (response.ok) {
          const config = await response.json();
          console.log("✅ Config recibida:", config);
          if (!config.publicKey) {
            console.error("❌ La respuesta no contiene publicKey:", config);
            setError("La configuración de Wompi no contiene la Public Key");
            return;
          }
          setPublicKey(config.publicKey);
          console.log("✅ Public Key configurada:", config.publicKey);
        } else {
          const errorText = await response.text();
          console.error("❌ Error obteniendo config:", response.status, errorText);
          setError("No se pudo obtener la configuración de Wompi");
        }
      } catch (err) {
        console.error("❌ Error obteniendo config:", err);
        setError("Error de conexión con el servidor");
      }
    };

    fetchConfig();

    // Cargar el script del widget de Wompi
    const script = document.createElement("script");
    script.src = "https://checkout.wompi.co/widget.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ Script de Wompi cargado");
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error("❌ Error cargando script de Wompi");
      setError("Error cargando el widget de Wompi");
    };
    document.body.appendChild(script);

    return () => {
      // Limpiar el script al desmontar
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Generar firma y abrir el widget de Wompi
  const handlePayment = async () => {
    if (!scriptLoaded) {
      setError("El widget de Wompi aún está cargando...");
      return;
    }

    if (!publicKey) {
      setError("La public key de Wompi no está disponible");
      return;
    }

    if (!window.WidgetCheckout) {
      setError("El widget de Wompi no está disponible");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ejecutar callback antes del pago (si existe)
      if (onBeforePayment) {
        console.log("🎯 Ejecutando acciones antes del pago...");
        await onBeforePayment();
      }

      // Generar firma de integridad en el backend
      const response = await fetch(`${API_BASE}/wompi/generate-signature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          amount,
          currency,
          reference,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details || errorData.error || `Error: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("✅ Firma de integridad generada:", {
        reference: data.reference,
        amountInCents: data.amountInCents,
      });

      // Validar que tenemos todos los datos necesarios
      console.log("🔍 Verificando datos para inicializar Widget:", {
        publicKey,
        currency,
        amountInCents: data.amountInCents,
        reference,
        signature: data.signature,
        customerEmail,
      });

      if (!publicKey) {
        throw new Error("No se pudo obtener la Public Key");
      }

      // Determinar si estamos en sandbox basado en la public key
      const isSandbox = publicKey.includes('test');
      console.log("🏖️ Modo sandbox:", isSandbox);

      // Crear el widget de Wompi con la firma de integridad del backend
      const checkoutConfig: any = {
        currency: currency,
        amountInCents: data.amountInCents, // Usar el monto calculado por el backend
        reference: reference,
        publicKey: publicKey,
        signature: {
          integrity: data.signature, // Firma generada en el backend
        },
        redirectUrl: `${window.location.origin}/checkout/wompi-callback`,
        customerData: {
          email: customerEmail,
          fullName: customerName,
          phoneNumber: customerPhone,
          phoneNumberPrefix: customerPhonePrefix, // Prefijo del país
          // NO incluir campos adicionales aquí - Wompi solo acepta campos específicos
        },
      };

      // Si estamos en sandbox, agregar el parámetro sandbox: true
      if (isSandbox) {
        checkoutConfig.sandbox = true;
        console.log("✅ Modo sandbox activado");
      }

      console.log("🚀 Inicializando Widget con config:", checkoutConfig);
      const checkout = new window.WidgetCheckout(checkoutConfig);

      // Abrir el widget
      checkout.open((result: any) => {
        console.log("📦 Resultado del pago:", result);

        if (result.transaction) {
          setTransaction(result.transaction);
          if (result.transaction.status === "APPROVED") {
            onSuccess?.(result.transaction);
          } else {
            onError?.(result);
          }
        }
      });
    } catch (err: any) {
      console.error("Error procesando pago:", err);
      const errorMessage = err.message || "No se pudo procesar el pago";
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  if (error && !loading) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
        <Button
          onClick={() => {
            setError(null);
            setTransaction(null);
          }}
          variant="outline"
          className="w-full"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (transaction) {
    return (
      <div className="space-y-4">
        <div
          className={`border-2 rounded-lg p-6 ${
            transaction.status === "APPROVED"
              ? "bg-green-50 border-green-200"
              : transaction.status === "DECLINED"
              ? "bg-red-50 border-red-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <h3
            className={`font-semibold mb-3 flex items-center text-lg ${
              transaction.status === "APPROVED"
                ? "text-green-800"
                : transaction.status === "DECLINED"
                ? "text-red-800"
                : "text-yellow-800"
            }`}
          >
            {transaction.status === "APPROVED" && "✅ Pago Aprobado"}
            {transaction.status === "DECLINED" && "❌ Pago Rechazado"}
            {transaction.status === "PENDING" && "⏳ Pago Pendiente"}
          </h3>

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Referencia:</span>{" "}
              <span className="font-mono bg-white px-2 py-1 rounded">
                {transaction.reference}
              </span>
            </p>
            <p>
              <span className="font-semibold">Monto:</span> ${amount.toLocaleString()} {currency}
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setTransaction(null);
            setError(null);
          }}
          variant="outline"
          className="w-full"
        >
          Realizar otro pago
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-3">
          <svg
            className="w-8 h-8 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-lg text-gray-800">
              Pago con Wompi
            </h3>
            <p className="text-sm text-gray-600">
              Procesamiento seguro de pagos
            </p>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Monto a pagar:</span>
            <span className="font-bold text-gray-900">
              ${amount.toLocaleString()} {currency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Referencia:</span>
            <span className="font-mono text-xs text-gray-700">{reference}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs mt-4">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
            ✓ Seguro
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
            ✓ Rápido
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
            🔒 Encriptado
          </span>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        disabled={loading || !scriptLoaded || !publicKey}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Procesando...
          </span>
        ) : !scriptLoaded || !publicKey ? (
          "Cargando Wompi..."
        ) : (
          "Pagar con Wompi"
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        💳 Acepta tarjetas de crédito y débito, PSE y más
      </p>
    </div>
  );
}
