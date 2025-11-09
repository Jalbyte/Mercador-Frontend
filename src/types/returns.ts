/**
 * Tipos y interfaces para el sistema de devoluciones
 */

/**
 * Estados posibles de una devolución
 */
export type ReturnStatus = 
  | 'pending'      // Pendiente de revisión
  | 'approved'     // Aprobada, pendiente de reembolso
  | 'rejected'     // Rechazada
  | 'refunded'     // Reembolsada
  | 'cancelled';   // Cancelada por el usuario

/**
 * Métodos de reembolso disponibles
 */
export type RefundMethod = 
  | 'original_payment'  // Devolver al método de pago original
  | 'store_credit'      // Crédito en la tienda
  | 'bank_transfer';    // Transferencia bancaria

/**
 * Estados de créditos de tienda
 */
export type StoreCreditStatus = 
  | 'active'    // Activo y disponible
  | 'used'      // Completamente usado
  | 'expired';  // Expirado

/**
 * Razones comunes para devoluciones
 */
export type ReturnReason =
  | 'defective'           // Producto defectuoso
  | 'wrong_item'          // Producto incorrecto
  | 'not_as_described'    // No coincide con la descripción
  | 'changed_mind'        // Cambió de opinión
  | 'better_price'        // Encontró mejor precio
  | 'license_not_working' // Licencia no funciona
  | 'other';              // Otro motivo

/**
 * Item de una devolución
 */
export interface ReturnItem {
  product: any;
  id: number;
  return_id: number;
  product_key_id: string; // UUID de la clave de licencia devuelta
  product_id?: number; // ID del producto (puede obtenerse de la clave)
  product_name?: string; // Nombre del producto
  license_key?: string; // La clave de licencia devuelta
  price: number; // Precio de la clave
  reason?: string; // Razón específica de esta clave
  created_at: string;
  quantity: number;
}

/**
 * Devolución completa
 */
export interface Return {
  id: number;
  order_id: number;
  user_id: string;
  status: ReturnStatus;
  reason: string;
  refund_amount: number;
  refund_method?: RefundMethod;
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  items?: ReturnItem[];
  order?: {
    id: number;
    total_amount: number;
    created_at: string;
  };
}

/**
 * Datos para crear una nueva devolución
 */
export interface CreateReturnRequest {
  order_id: number;
  reason: string;
  product_key_ids: string[]; // UUIDs de las claves de licencia a devolver
  notes?: string; // Notas adicionales opcionales
}

/**
 * Datos para actualizar el estado de una devolución (admin)
 */
export interface UpdateReturnRequest {
  status: ReturnStatus;
  admin_notes?: string;
  refund_method?: RefundMethod;
}

/**
 * Respuesta de la API con paginación
 */
export interface ReturnsResponse {
  returns: Return[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Filtros para listar devoluciones
 */
export interface ReturnFilters {
  status?: ReturnStatus;
  user_id?: string;
  order_id?: number;
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

/**
 * Elegibilidad de claves para devolución
 */
export interface ReturnEligibility {
  eligible: boolean;
  order_id: number;
  available_keys: {
    id: string; // UUID de la clave (product_key_id)
    license_key: string; // El código de la licencia
    product_id: number;
    product_name: string;
    price: number;
    purchase_date: string;
    status: string; // Estado de la clave (active, assigned, etc)
  }[];
  purchase_date: string;
  reason?: string; // Razón por la cual no es elegible (si aplica)
}

/**
 * Crédito de tienda
 */
export interface StoreCredit {
  id: number;
  user_id: string;
  return_id?: number;
  amount: number;
  balance: number;
  status: StoreCreditStatus;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Balance de créditos de tienda
 */
export interface StoreCreditBalance {
  user_id: string;
  total_balance: number;
  active_credits: StoreCredit[];
}

/**
 * Historial de cambio de estado
 */
export interface ReturnStatusHistory {
  id: number;
  return_id: number;
  old_status?: ReturnStatus;
  new_status: ReturnStatus;
  changed_by: string;
  changed_by_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  notes?: string;
  created_at: string;
}

/**
 * Resumen de devoluciones para admin
 */
export interface ReturnsSummary {
  total_returns: number;
  pending_returns: number;
  approved_returns: number;
  rejected_returns: number;
  refunded_returns: number;
  cancelled_returns: number;
  total_refund_amount: number;
  average_refund_amount: number;
  return_rate: number;
}

/**
 * Devolución con información completa (incluyendo relaciones)
 */
export interface ReturnWithDetails extends Return {
  items: (ReturnItem & {
    product?: {
      id: number;
      name: string;
      image_url?: string;
    };
  })[];
  order: {
    id: number;
    total_amount: number;
    created_at: string;
    status: string;
  };
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  processed_by_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  status_history?: ReturnStatusHistory[];
}

/**
 * Paginación genérica
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
