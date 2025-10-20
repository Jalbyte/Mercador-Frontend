"use client";

import { useCart } from "@/hooks";
import { useAuthRoute } from "@/hooks/use-auth-route";
import { useAuth } from "@/components/auth/AuthProvider";
import { Modal } from "@/components/ui/modal";
import { useState, useEffect, useRef } from "react";
import SaleDetail from "./SaleDetail";
import { CreditCardForm } from "./CreditCardForm";
import { X, Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export function Cart() {
  const router = useRouter();
  const { isCartHiddenRoute } = useAuthRoute();
  const {
    isOpen,
    setIsOpen,
    items: cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    isValid,
    isLoading: isCartLoading,
    fixItem,
  } = useCart();

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();
  const clearConfirmRef = useRef<HTMLDivElement>(null);

  // Cerrar modal de confirmación al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clearConfirmRef.current && !clearConfirmRef.current.contains(event.target as Node)) {
        setShowClearConfirm(false);
      }
    }

    if (showClearConfirm) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showClearConfirm]);

  // Hide cart on auth routes, admin routes, and other specified routes
  if (isCartHiddenRoute) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
        aria-label="Abrir carrito"
      >
        <ShoppingCart className="h-6 w-6" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <Card className="h-full w-full max-w-md flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Carrito de Compras</CardTitle>
          <div className="flex items-center gap-2 relative">
            {cartItems.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Vaciar carrito
                </Button>
                
                {/* Modal de confirmación pequeño */}
                {showClearConfirm && (
                  <div 
                    ref={clearConfirmRef}
                    className="absolute top-full right-0 mt-2 z-[60] w-64 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 animate-[fadeIn_0.2s_ease-out]"
                  >
                    <p className="text-sm text-gray-700 mb-3">
                      ¿Vaciar el carrito?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          clearCart();
                          setShowClearConfirm(false);
                        }}
                        className="flex-1"
                      >
                        Vaciar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar carrito"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {cartItems.map((item) => {
                const hasIssue = item.is_available === false || item.has_enough_stock === false;
                return (
                  <li
                    key={item.id}
                    className={`flex flex-col gap-2 border-b pb-4 ${hasIssue ? 'bg-destructive/5 p-2 rounded-md' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={hasIssue}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={hasIssue}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Mensajes de validación */}
                    {item.is_available === false && (
                      <div className="flex flex-col gap-2 text-sm">
                        <p className="text-destructive font-medium">
                          ⚠️ Este producto ya no está disponible
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => fixItem(item.id)}
                          className="w-full"
                        >
                          Eliminar del carrito
                        </Button>
                      </div>
                    )}
                    
                    {item.is_available !== false && item.has_enough_stock === false && (
                      <div className="flex flex-col gap-2 text-sm">
                        <p className="text-amber-600 dark:text-amber-400 font-medium">
                          ⚠️ Stock insuficiente. Solo quedan {item.max_quantity} unidades disponibles
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fixItem(item.id)}
                          className="w-full border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                        >
                          Ajustar a {item.max_quantity} unidades
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>

        {cartItems.length > 0 && (
          <CardFooter className="border-t p-4 flex flex-col gap-4">
            {!isValid && (
              <div className="w-full p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  ⚠️ Hay problemas con algunos productos. Por favor, corrígelos antes de continuar.
                </p>
              </div>
            )}
            <div className="flex justify-between w-full">
              <span>Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <Button 
              className="w-full" 
              size="lg" 
              disabled={!isValid || isCartLoading}
              onClick={async () => {
              // If auth is still loading, give simple feedback
              if (isLoading) {
                alert("Verificando sesión, por favor espera...");
                return;
              }

              if (!isAuthenticated) {
                // Not authenticated: notify and redirect to login
                alert("Debes iniciar sesión para proceder al pago");
                setIsOpen(false);
                router.push("/login");
                return;
              }

              // Authenticated: open sale detail modal
              setIsDetailOpen(true);
            }}>
              {isCartLoading ? "Validando..." : "Proceder al pago"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsOpen(false);
                router.push("/");
              }}
            >
              Seguir comprando
            </Button>
          </CardFooter>
        )}
      </Card>
      {/* Detalle de venta modal: muestra los items del carrito y el total */}
      <Modal open={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalle de venta">
        <SaleDetail
          items={cartItems}
          subtotal={subtotal}
          onCancel={() => setIsDetailOpen(false)}
          onConfirm={() => {
            // Cerrar modal de detalle y mostrar formulario de tarjeta
            setIsDetailOpen(false);
            setShowCreditCardForm(true);
          }}
        />
      </Modal>

      {/* Formulario de tarjeta de crédito */}
      {showCreditCardForm && (
        <CreditCardForm
          isLoading={isProcessingPayment}
          onCancel={() => {
            setShowCreditCardForm(false);
            setIsOpen(true);
          }}
          onSubmit={async (cardData) => {
            setIsProcessingPayment(true);
            try {
              const API_BASE =
                process.env.NEXT_PUBLIC_API_URL ??
                (typeof window !== "undefined"
                  ? `${window.location.protocol}//${window.location.hostname}:3010`
                  : "");

              // 1. Sincronizar items del carrito local con Supabase
              console.log("📦 Sincronizando carrito con Supabase...");
              for (const item of cartItems) {
                const addToCartRes = await fetch(`${API_BASE}/cart/items`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    productId: item.id,
                    quantity: item.quantity,
                  }),
                });

                if (!addToCartRes.ok) {
                  throw new Error(`Error al agregar item ${item.name} al carrito`);
                }
              }
              console.log("✅ Carrito sincronizado");

              // 2. Verificar que el usuario esté autenticado
              if (!user) {
                alert("Debes iniciar sesión para proceder al pago");
                setShowCreditCardForm(false);
                router.push("/login");
                return;
              }

              // Extraer nombre y apellido del full_name o usar valores por defecto
              const nameParts = (user.full_name || "").split(" ");
              const firstName = nameParts[0] || "Cliente";
              const lastName = nameParts.slice(1).join(" ") || "Mercador";

              // 3. Crear preferencia de pago en el backend (PayU) con datos de tarjeta
              console.log("💳 Creando pago con PayU...");
              const res = await fetch(`${API_BASE}/payu/create`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                  payer: {
                    email: user.email,
                    name: firstName,
                    surname: lastName
                  },
                  creditCard: cardData
                })
              });

              if (!res.ok) {
                if (res.status === 401) {
                  alert("Debes iniciar sesión para proceder al pago");
                  setShowCreditCardForm(false);
                  router.push("/login");
                  return;
                }
                const errorData = await res.json();
                throw new Error(errorData.error || `Error: ${res.status}`);
              }

              const data = await res.json();
              console.log("✅ Pago procesado con PayU:", data);

              // Cerrar formulario y carrito
              setShowCreditCardForm(false);
              setIsOpen(false);

              // PayU procesa el pago inmediatamente
              if (data.redirect_url) {
                // Redirigir a la página de resultado
                console.log("🔄 Redirigiendo a resultado del pago...");
                window.location.href = data.redirect_url;
              } else if (data.state === 'APPROVED') {
                // Pago aprobado, redirigir a éxito
                router.push(`/payment/success?transaction_id=${data.transaction_id}`);
              } else if (data.state === 'DECLINED') {
                // Pago rechazado
                router.push(`/payment/failure?transaction_id=${data.transaction_id}`);
              } else {
                alert("Pago procesado. Estado: " + (data.state || 'Desconocido'));
              }
            } catch (err) {
              console.error('❌ Error al procesar pago:', err);
              alert(err instanceof Error ? err.message : "Error al conectar con el backend");
              setShowCreditCardForm(false);
              setIsOpen(true);
            } finally {
              setIsProcessingPayment(false);
            }
          }}
        />
      )}
    </div>
  );
}
