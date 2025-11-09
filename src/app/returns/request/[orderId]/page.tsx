"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/components/auth/AuthProvider";
import { useReturns } from "@/hooks/use-returns";
import {
  FiArrowLeft,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import type { CreateReturnRequest } from "@/types/returns";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : "");

type OrderItem = {
  id: number;
  price: number;
  quantity: number;
  order_id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    image_url?: string;
  };
  license_key?: string;
  product_key_id?: string; // UUID de la clave de licencia
};

type Order = {
  id: number;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  shipping_address?: {
    city: string;
    region: string;
    country: string;
    phoneNumber: string;
    addressLine1: string;
  };
  payment_method?: string;
  order_items: OrderItem[];
};

export default function RequestReturnPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const { isLoading, isAuthenticated } = useAuth();
  const { createReturn, loading: submitting } = useReturns();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estado del formulario
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set()); // UUIDs de las claves seleccionadas
  const [keyReasons, setKeyReasons] = useState<Record<string, string>>({});
  const [generalReason, setGeneralReason] = useState("");
  const [eligibility, setEligibility] = useState<any>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchOrderDetails();
  }, [isAuthenticated, isLoading, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("sb-localhost-auth-token");
      let authToken = null;

      if (token) {
        try {
          const parsed = JSON.parse(token);
          authToken = parsed.access_token;
        } catch (e) {
          console.error("Error parsing token:", e);
        }
      }

      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar la orden");
      }

      const data = await response.json();
      setOrder(data.data);

      // Cargar información de elegibilidad (claves disponibles)
      const eligibilityResponse = await fetch(
        `${API_BASE}/returns/eligibility/${orderId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          credentials: "include",
        }
      );

      if (eligibilityResponse.ok) {
        const eligibilityData = await eligibilityResponse.json();
        setEligibility(eligibilityData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la orden");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyToggle = (keyId: string) => {
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(keyId)) {
      newSelected.delete(keyId);
    } else {
      newSelected.add(keyId);
    }
    setSelectedKeys(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedKeys.size === 0) {
      setError("Por favor selecciona al menos una clave para devolver");
      return;
    }

    if (!generalReason.trim()) {
      setError("Por favor proporciona una razón para la devolución");
      return;
    }

    try {
      const returnData: CreateReturnRequest = {
        order_id: parseInt(orderId),
        reason: generalReason,
        product_key_ids: Array.from(selectedKeys),
        notes: keyReasons[Array.from(selectedKeys)[0]] || undefined,
      };

      await createReturn(returnData);
      setSuccess(true);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push("/returns");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la devolución");
    }
  };

  const calculateRefundAmount = () => {
    if (!eligibility?.available_keys) return 0;

    let total = 0;
    selectedKeys.forEach((keyId) => {
      const key = eligibility.available_keys.find((k: any) => k.id === keyId);
      if (key) {
        total += key.price;
      }
    });
    return total;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando orden...</span>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Solicitud de devolución enviada!
            </h2>
            <p className="text-gray-600 mb-4">
              Tu solicitud ha sido recibida y será revisada por nuestro equipo.
              Te notificaremos por correo electrónico sobre el estado de tu devolución.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo a tus devoluciones...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <FiArrowLeft className="mr-2" />
            Volver
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Solicitar Devolución
            </h1>
            <p className="text-gray-600">
              Orden #{orderId} - {order && new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Selección de claves de licencia */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Claves de licencia a devolver
              </h2>

              {!eligibility || !eligibility.available_keys || eligibility.available_keys.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiPackage className="mx-auto mb-3 text-gray-400" size={48} />
                  <p>No hay claves disponibles para devolución</p>
                  <p className="text-sm mt-2">
                    Es posible que ya hayas solicitado la devolución de todas las claves disponibles
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eligibility.available_keys.map((key: any) => (
                    <div
                      key={key.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        selectedKeys.has(key.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(key.id)}
                          onChange={() => handleKeyToggle(key.id)}
                          className="mt-1 mr-4 w-5 h-5 text-blue-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {key.product_name}
                              </h3>
                              
                              <p className="text-sm text-gray-600 mt-1">
                                id: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{key.id}</code>
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Clave: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{key.license_key_preview}</code>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ${key.price.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {selectedKeys.has(key.id) && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Razón específica (opcional)
                              </label>
                              <input
                                type="text"
                                value={keyReasons[key.id] || ""}
                                onChange={(e) =>
                                  setKeyReasons((prev) => ({
                                    ...prev,
                                    [key.id]: e.target.value,
                                  }))
                                }
                                placeholder="Ej: La licencia no funciona, producto defectuoso..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Razón general */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Detalles de la devolución
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón de la devolución <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={generalReason}
                    onChange={(e) => setGeneralReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe el motivo de tu devolución..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Por favor, explica detalladamente por qué deseas devolver estas licencias.
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Claves seleccionadas:</span>
                  <span className="font-semibold">{selectedKeys.size}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-900 font-semibold">
                    Monto estimado de reembolso:
                  </span>
                  <span className="font-bold text-blue-600">
                    ${calculateRefundAmount().toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * El monto final será determinado por el administrador al procesar tu devolución
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || selectedKeys.size === 0}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar solicitud"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
