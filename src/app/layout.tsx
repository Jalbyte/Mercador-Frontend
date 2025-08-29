import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}