"use client";

import { useCart } from "@/hooks";
import { Toast } from "@/components/ui/toast";
import { usePathname } from "next/navigation";

export function CartToastManager() {
  const pathname = usePathname();
  const { showToast, toastMessage, hideToast } = useCart();

  // No renderizar en páginas de email (para PDFs y templates)
  if (pathname?.startsWith('/email')) {
    return null;
  }

  if (!showToast) return null;

  return <Toast message={toastMessage} onClose={hideToast} />;
}
