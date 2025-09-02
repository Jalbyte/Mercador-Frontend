"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

/**
 * Hook to detect auth routes
 */
export function useAuthRoute() {
  const pathname = usePathname();

  const isAuthRoute = useMemo(() => {
    const authRoutes = [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
    ];
    return authRoutes.includes(pathname);
  }, [pathname]);

  const isLoginRoute = pathname === "/login";
  const isRegisterRoute = pathname === "/register";

  return {
    isAuthRoute,
    isLoginRoute,
    isRegisterRoute,
    pathname,
  };
}
