/**
 * Layout principal de la aplicación Mercador
 *
 * Este componente define la estructura base de toda la aplicación Next.js,
 * incluyendo configuración de metadata, proveedores de contexto global,
 * navegación de accesibilidad y componentes compartidos.
 *
 * Características principales:
 * - Configuración de fuente Inter de Google Fonts
 * - Metadata SEO optimizada para licencias de software
 * - Proveedores de contexto: AuthProvider y CartProvider
 * - Navegación por teclado con skip links
 * - Componentes globales: Carrito y barra de accesibilidad
 * - Tema base con Tailwind CSS
 *
 * @component
 *
 * @example
 * ```tsx
 * // Este layout se aplica automáticamente a todas las páginas
 * // No requiere importación manual
 *
 * // Estructura resultante:
 * // <html>
 * //   <body>
 * //     <AuthProvider>
 * //       <CartProvider>
 * //         <main>{children}</main>
 * //         <Cart />
 * //         <AccessibilitySidebar />
 * //       </CartProvider>
 * //     </AuthProvider>
 * //   </body>
 * // </html>
 * ```
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Cart } from "@/components/cart/Cart";
import { CartProvider } from "@/hooks";
import { AccessibilitySidebar } from "@/components/accessibility/page";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

/**
 * Metadata SEO para la aplicación Mercador
 *
 * Configuración de metadatos optimizados para motores de búsqueda,
 * incluyendo título descriptivo y descripción enfocada en licencias de software.
 */
export const metadata: Metadata = {
  title: "Mercador - Licencias de Software",
  description: "Encuentra las mejores licencias de software al mejor precio",
};

/**
 * Props del componente RootLayout
 */
interface RootLayoutProps {
  /** Contenido de las páginas hijas que se renderizarán en el main */
  children: React.ReactNode;
}

/**
 * Componente RootLayout - Layout principal de Next.js
 *
 * Este es el layout raíz que envuelve toda la aplicación. Configura:
 * - La estructura HTML básica con idioma español
 * - La fuente Inter para consistencia tipográfica
 * - Los proveedores de contexto global (autenticación y carrito)
 * - Componentes globales que aparecen en todas las páginas
 * - Navegación accesible con skip links
 *
 * @param props - Props del componente
 * @returns Elemento JSX con la estructura completa de la aplicación
 */
export default function RootLayout({
  children,
}: RootLayoutProps) {
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
