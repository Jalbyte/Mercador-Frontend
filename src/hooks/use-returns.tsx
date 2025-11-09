"use client";

/**
 * Hook personalizado para gestión de devoluciones en Mercador
 * 
 * Este hook proporciona funcionalidad completa para:
 * - Crear solicitudes de devolución
 * - Listar devoluciones del usuario
 * - Ver detalles de una devolución específica
 * - Actualizar estado de devoluciones (admin)
 * - Cancelar solicitudes de devolución
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import type {
  Return,
  CreateReturnRequest,
  UpdateReturnRequest,
  ReturnFilters,
  ReturnsResponse,
} from '@/types/returns';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3010`
    : '');

interface UseReturnsResult {
  returns: Return[];
  loading: boolean;
  error: string | null;
  createReturn: (data: CreateReturnRequest) => Promise<Return>;
  getReturns: (filters?: ReturnFilters) => Promise<void>;
  getReturnById: (id: number) => Promise<Return | null>;
  updateReturnStatus: (id: number, data: UpdateReturnRequest) => Promise<Return>;
  cancelReturn: (id: number) => Promise<void>;
  checkEligibility: (orderItemId: number) => Promise<any>;
  getStoreCredits: () => Promise<any>;
  getReturnHistory: (returnId: number) => Promise<any[]>;
  // Admin functions
  getAllReturns: (filters?: ReturnFilters) => Promise<void>;
  processReturn: (id: number, data: UpdateReturnRequest) => Promise<Return>;
  updateReturn: (id: number, data: UpdateReturnRequest) => Promise<Return>;
  getReturnsSummary: () => Promise<any>;
}

/**
 * Hook para gestionar devoluciones
 */
export function useReturns(): UseReturnsResult {
  const { user } = useAuth();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener token de autenticación
   */
  const getAuthToken = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    // Intentar obtener el token de Supabase
    const supabaseAuth = localStorage.getItem('sb-localhost-auth-token');
    if (supabaseAuth) {
      try {
        const parsed = JSON.parse(supabaseAuth);
        return parsed.access_token;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  /**
   * Crear una nueva solicitud de devolución
   */
  const createReturn = useCallback(
    async (data: CreateReturnRequest): Promise<Return> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/returns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al crear la devolución');
        }

        const newReturn = await response.json();
        setReturns((prev) => [newReturn, ...prev]);
        return newReturn;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * Obtener lista de devoluciones con filtros opcionales
   */
  const getReturns = useCallback(
    async (filters?: ReturnFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const queryParams = new URLSearchParams();

        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.user_id) queryParams.append('user_id', filters.user_id);
        if (filters?.order_id) queryParams.append('order_id', filters.order_id.toString());
        if (filters?.page) queryParams.append('page', filters.page.toString());
        if (filters?.limit) queryParams.append('limit', filters.limit.toString());

        const response = await fetch(`${API_BASE}/returns/my-returns?${queryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener las devoluciones');
        }

        const result = await response.json();
        
        // Handle both response formats:
        // New format: { success: true, data: [...], pagination: {...} }
        // Old format: { returns: [...] }
        if (result.success && result.data) {
          setReturns(result.data);
        } else if (result.returns) {
          setReturns(result.returns);
        } else {
          setReturns([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        console.error('Error fetching returns:', err);
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * Obtener detalles de una devolución específica
   */
  const getReturnById = useCallback(
    async (id: number): Promise<Return | null> => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE}/returns/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener la devolución');
        }

        const result = await response.json();
        
        // Handle both response formats:
        // New format: { success: true, data: {...} }
        // Old format: direct return object
        if (result.success && result.data) {
          return result.data;
        } else if (result.id) {
          // Direct return object (old format)
          return result;
        }
        
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        console.error('Error fetching return:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * Actualizar estado de una devolución (solo admin)
   */
  const updateReturnStatus = useCallback(
    async (id: number, data: UpdateReturnRequest): Promise<Return> => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE}/returns/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al actualizar la devolución');
        }

        const updatedReturn = await response.json();

        // Actualizar en el estado local
        setReturns((prev) =>
          prev.map((ret) => (ret.id === id ? updatedReturn : ret))
        );

        return updatedReturn;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * Cancelar una solicitud de devolución
   */
  const cancelReturn = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE}/returns/${id}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cancelar la devolución');
        }

        // Actualizar estado local
        setReturns((prev) =>
          prev.map((ret) =>
            ret.id === id ? { ...ret, status: 'cancelled' as const } : ret
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * Verificar elegibilidad de devolución para un item
   */
  const checkEligibility = useCallback(
    async (orderItemId: number) => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE}/returns/eligibility/${orderItemId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al verificar elegibilidad');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * Obtener créditos de tienda del usuario
   */
  const getStoreCredits = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE}/returns/store-credits`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener créditos');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * Obtener historial de una devolución
   */
  const getReturnHistory = useCallback(
    async (returnId: number) => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE}/returns/${returnId}/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener historial');
        }

        const data = await response.json();
        return data.data || [];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * [ADMIN] Obtener todas las devoluciones del sistema
   */
  const getAllReturns = useCallback(
    async (filters?: ReturnFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const queryParams = new URLSearchParams();

        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.order_id) queryParams.append('order_id', filters.order_id.toString());
        if (filters?.start_date) queryParams.append('start_date', filters.start_date);
        if (filters?.end_date) queryParams.append('end_date', filters.end_date);
        if (filters?.page) queryParams.append('page', filters.page.toString());
        if (filters?.limit) queryParams.append('limit', filters.limit.toString());

        const response = await fetch(`${API_BASE}/returns/admin/all?${queryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener devoluciones');
        }

        const data = await response.json();
        setReturns(data.data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        console.error('Error fetching all returns:', err);
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * [ADMIN] Procesar una devolución (aprobar/rechazar)
   */
  const processReturn = useCallback(
    async (id: number, data: UpdateReturnRequest): Promise<Return> => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE}/returns/admin/${id}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al procesar la devolución');
        }

        const updatedReturn = await response.json();

        // Actualizar en el estado local
        setReturns((prev) =>
          prev.map((ret) => (ret.id === id ? updatedReturn.data : ret))
        );

        return updatedReturn.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * [ADMIN] Actualizar una devolución
   */
  const updateReturn = useCallback(
    async (id: number, data: UpdateReturnRequest): Promise<Return> => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE}/returns/admin/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al actualizar la devolución');
        }

        const updatedReturn = await response.json();

        // Actualizar en el estado local
        setReturns((prev) =>
          prev.map((ret) => (ret.id === id ? updatedReturn.data : ret))
        );

        return updatedReturn.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  /**
   * [ADMIN] Obtener resumen de devoluciones
   */
  const getReturnsSummary = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAuthToken();
        const response = await fetch(`${API_BASE}/returns/admin/summary`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }, credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener resumen');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  return {
    returns,
    loading,
    error,
    createReturn,
    getReturns,
    getReturnById,
    updateReturnStatus,
    cancelReturn,
    checkEligibility,
    getStoreCredits,
    getReturnHistory,
    // Admin functions
    getAllReturns,
    processReturn,
    updateReturn,
    getReturnsSummary,
  };
}
