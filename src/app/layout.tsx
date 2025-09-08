import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Cart } from "@/components/cart/Cart";
import { CartProvider } from "@/hooks";
import { AccessibilitySidebar } from "@/components/accessibility/page";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mercador - Licencias de Software",
  description: "Encuentra las mejores licencias de software al mejor precio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-screen bg-background`}>
        {/* Skip link para navegación por teclado */}
        <a href="#main-content" className="skip-link focus:outline-none">
          Saltar al contenido principal
        </a>

        <AuthProvider>
          <CartProvider>
            <main id="main-content" className="min-h-screen bg-base-200/50">
              {children}
              <Cart />
            </main>

            {/* Componente de accesibilidad */}
            <AccessibilitySidebar />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
