"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiLoader, FiArrowLeft } from "react-icons/fi";
import { Header } from "@/components/layout/Header";
import ProductAdmin from "@/components/products/ProductAdmin";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3010` : '');

export default function DashboardPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAdminAccess() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (!mounted) return;
        
        if (!res.ok) {
          // No autenticado, redirigir al login
          router.push('/login');
          return;
        }

        const j = await res.json().catch(() => null);
        const role = j?.data?.role ?? j?.data?.user_metadata?.role ?? null;
        const name = j?.data?.full_name ?? j?.data?.user_metadata?.full_name ?? j?.data?.email ?? null;
        
        if (role !== 'admin') {
          // No es admin, redirigir al home
          router.push('/');
          return;
        }

        setIsAdmin(true);
        setUserName(name);
      } catch (err) {
        console.error('Error checking admin access:', err);
        router.push('/');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkAdminAccess();
    return () => { mounted = false };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <FiLoader className="animate-spin text-blue-600" size={32} />
          <span className="ml-2 text-gray-600">Verificando permisos...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // El useEffect ya maneja la redirección
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Volver al inicio"
              >
                <FiArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel de Administración
                </h1>
                <p className="text-gray-600">
                  Bienvenido, {userName || 'Administrador'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Administrador
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            <button className="py-4 px-2 border-b-2 border-blue-500 text-blue-600 font-medium">
              Gestión de Productos
            </button>
            <button className="py-4 px-2 text-gray-500 hover:text-gray-700 font-medium">
              Usuarios
            </button>
            <button className="py-4 px-2 text-gray-500 hover:text-gray-700 font-medium">
              Pedidos
            </button>
            <button className="py-4 px-2 text-gray-500 hover:text-gray-700 font-medium">
              Reportes
            </button>
            <button className="py-4 px-2 text-gray-500 hover:text-gray-700 font-medium">
              Configuración
            </button>
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <ProductAdmin />
        </div>
      </div>
    </div>
  );
}