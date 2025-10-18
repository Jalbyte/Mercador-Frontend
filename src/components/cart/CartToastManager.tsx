"use client";

import { useCart } from "@/hooks";
import { Toast } from "@/components/ui/toast";

export function CartToastManager() {
  const { showToast, toastMessage, hideToast } = useCart();

  if (!showToast) return null;

  return <Toast message={toastMessage} onClose={hideToast} />;
}
