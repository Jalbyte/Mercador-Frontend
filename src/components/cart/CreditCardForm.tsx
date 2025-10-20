"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock } from "lucide-react";

// Componentes simples de UI
const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Label = ({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
);

interface CreditCardFormProps {
  onSubmit: (cardData: {
    number: string;
    name: string;
    expirationDate: string;
    securityCode: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CreditCardForm({ onSubmit, onCancel, isLoading }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Formatear número de tarjeta con espacios
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "");
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(formatCardNumber(value));
      setErrors({ ...errors, cardNumber: "" });
    }
  };

  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 2 && /^\d*$/.test(value)) {
      const month = parseInt(value);
      if (value === "" || (month >= 1 && month <= 12)) {
        setExpiryMonth(value);
        setErrors({ ...errors, expiry: "" });
      }
    }
  };

  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setExpiryYear(value);
      setErrors({ ...errors, expiry: "" });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setCvv(value);
      setErrors({ ...errors, cvv: "" });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const cleanedNumber = cardNumber.replace(/\s/g, "");
    if (!cleanedNumber) {
      newErrors.cardNumber = "Número de tarjeta requerido";
    } else if (cleanedNumber.length < 13 || cleanedNumber.length > 16) {
      newErrors.cardNumber = "Número de tarjeta inválido";
    }

    if (!cardName.trim()) {
      newErrors.cardName = "Nombre del titular requerido";
    }

    if (!expiryMonth || !expiryYear) {
      newErrors.expiry = "Fecha de expiración requerida";
    } else {
      const month = parseInt(expiryMonth);
      const year = parseInt(expiryYear);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      if (month < 1 || month > 12) {
        newErrors.expiry = "Mes inválido";
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiry = "Tarjeta expirada";
      }
    }

    if (!cvv) {
      newErrors.cvv = "CVV requerido";
    } else if (cvv.length < 3) {
      newErrors.cvv = "CVV inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const paddedMonth = expiryMonth.padStart(2, "0");
    
    onSubmit({
      number: cardNumber.replace(/\s/g, ""),
      name: cardName.toUpperCase(),
      expirationDate: `${expiryYear}/${paddedMonth}`,
      securityCode: cvv,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Información de Pago</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Ingresa los datos de tu tarjeta de crédito o débito
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Número de tarjeta */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Número de Tarjeta</Label>
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumberChange}
                className={errors.cardNumber ? "border-red-500" : ""}
                disabled={isLoading}
                maxLength={19}
              />
              {errors.cardNumber && (
                <p className="text-sm text-red-500">{errors.cardNumber}</p>
              )}
            </div>

            {/* Nombre del titular */}
            <div className="space-y-2">
              <Label htmlFor="cardName">Nombre del Titular</Label>
              <Input
                id="cardName"
                type="text"
                placeholder="JUAN PEREZ"
                value={cardName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setCardName(e.target.value.toUpperCase());
                  setErrors({ ...errors, cardName: "" });
                }}
                className={errors.cardName ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.cardName && (
                <p className="text-sm text-red-500">{errors.cardName}</p>
              )}
            </div>

            {/* Fecha de expiración y CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Expiración</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="MM"
                    value={expiryMonth}
                    onChange={handleExpiryMonthChange}
                    className={errors.expiry ? "border-red-500" : ""}
                    disabled={isLoading}
                    maxLength={2}
                  />
                  <Input
                    type="text"
                    placeholder="AAAA"
                    value={expiryYear}
                    onChange={handleExpiryYearChange}
                    className={errors.expiry ? "border-red-500" : ""}
                    disabled={isLoading}
                    maxLength={4}
                  />
                </div>
                {errors.expiry && (
                  <p className="text-sm text-red-500">{errors.expiry}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={handleCvvChange}
                  className={errors.cvv ? "border-red-500" : ""}
                  disabled={isLoading}
                  maxLength={4}
                />
                {errors.cvv && (
                  <p className="text-sm text-red-500">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Información de seguridad */}
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm">
              <Lock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                Tus datos están protegidos con encriptación de nivel bancario
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Procesando..." : "Pagar Ahora"}
              </Button>
            </div>

            {/* Tarjetas de prueba (solo en desarrollo) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  🧪 Tarjetas de Prueba (Sandbox):
                </p>
                <div className="text-xs space-y-1 text-blue-800">
                  <p>✅ APROBADA: 4111111111111111</p>
                  <p>❌ RECHAZADA: 4097440000000004</p>
                  <p>⏳ PENDIENTE: 4666666666666669</p>
                  <p className="mt-1 text-blue-600">CVV: 123 | Exp: 12/2030</p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
