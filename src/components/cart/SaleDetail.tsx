"use client";

import React from "react";
import { Button } from "@/components/ui/button";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

interface SaleDetailProps {
  items: CartItem[];
  subtotal: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const SaleDetail: React.FC<SaleDetailProps> = ({
  items,
  subtotal,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4 items-center border-b pb-2">
        <div className="col-span-7 font-medium">Producto</div>
        <div className="col-span-2 text-center">Cant.</div>
        <div className="col-span-3 text-right">Total</div>
      </div>

      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-7 flex items-center gap-3">
            <img
              src={item.image}
              alt={item.name}
              className="h-10 w-10 rounded-md object-cover"
            />
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground">${item.price.toLocaleString('es-CO')} c/u</div>
            </div>
          </div>
          <div className="col-span-2 text-center">{item.quantity}</div>
          <div className="col-span-3 text-right font-medium">${(item.price * item.quantity).toLocaleString('es-CO')}</div>
        </div>
      ))}

      <div className="border-t pt-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium">${subtotal.toLocaleString('es-CO')}</span>
        </div>
        <div className="flex justify-between mt-2">
          <span>Valor total de keys</span>
          <span className="font-semibold">${subtotal.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onConfirm}>Confirmar compra</Button>
      </div>
    </div>
  );
};

export default SaleDetail;
