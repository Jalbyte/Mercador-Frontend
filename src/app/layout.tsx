import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Cart } from '@/components/cart/Cart';
import { CartProvider } from '@/hooks';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mercador - Licencias de Software',
  description: 'Encuentra las mejores licencias de software al mejor precio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-screen bg-background`}>
        <CartProvider>
          <main className="min-h-screen bg-base-200/50">
            {children}
            <Cart />
          </main>
        </CartProvider>
      </body>
    </html>
  );
}