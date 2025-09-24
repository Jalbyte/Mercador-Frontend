"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

/**
 * Hook to detect auth routes and other routes where cart should be hidden
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

  // Routes where cart should be hidden (including auth routes and admin/dashboard routes)
  const isCartHiddenRoute = useMemo(() => {
    const cartHiddenRoutes = [
      // Auth routes
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      // Admin/Dashboard routes
      "/hub",
      "/dashboard",
      "/admin",
      "/profile",
      "/settings",
      "/account",
      "/checkout",
      "/payment",
      // Add more routes as needed
    ];

    // Check exact matches and route prefixes
    return cartHiddenRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
  }, [pathname]);

  const isLoginRoute = pathname === "/login";
  const isRegisterRoute = pathname === "/register";
  const isHubRoute = pathname === "/hub" || pathname.startsWith("/hub/");
  const isDashboardRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isProfileRoute =
    pathname === "/profile" || pathname.startsWith("/profile/");

  return {
    isAuthRoute,
    isCartHiddenRoute,
    isLoginRoute,
    isRegisterRoute,
    isHubRoute,
    isDashboardRoute,
    isProfileRoute,
    pathname,
  };
}
