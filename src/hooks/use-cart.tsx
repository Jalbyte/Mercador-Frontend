"use client";

/**
 * Hook personalizado para gestión completa del carrito de compras en Mercador.
 *
 * Este módulo implementa un sistema completo de carrito de compras que incluye:
 * - Gestión de estado global del carrito usando Context API
 * - Persistencia automática en localStorage
 * - Funciones para agregar, remover y actualizar items
 * - Cálculo automático del total de items
 * - Control del estado del panel lateral del carrito
 * - Optimizaciones de rendimiento con useMemo
 *
 * @module useCart
 */

import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef, ReactNode } from "react";
import { CartMergeDialog } from "@/components/cart/CartMergeDialog";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Tipo que define la estructura de un item en el carrito de compras.
 *
 * @typedef {Object} CartItem
 * @property {string} id - Identificador único del producto
 * @property {string} name - Nombre del producto
 * @property {number} price - Precio unitario del producto
 * @property {number} quantity - Cantidad del producto en el carrito
 * @property {string} image - URL de la imagen del producto
 * @property {number} [max_quantity] - Stock máximo disponible
 * @property {boolean} [is_available] - Si el producto aún existe
 * @property {boolean} [has_enough_stock] - Si hay suficiente stock
 */
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  max_quantity?: number;
  is_available?: boolean;
  has_enough_stock?: boolean;
};

/**
 * Tipo que define la interfaz del contexto del carrito de compras.
 * Proporciona todas las funciones y estados necesarios para gestionar el carrito.
 *
 * @typedef {Object} CartContextType
 * @property {CartItem[]} items - Array de items en el carrito
 * @property {number} totalItems - Total de items en el carrito (suma de cantidades)
 * @property {boolean} isOpen - Estado del panel lateral del carrito
 * @property {(isOpen: boolean) => void} setIsOpen - Función para abrir/cerrar el panel
 * @property {(item: Omit<CartItem, "quantity">) => void} addItem - Función para agregar item
 * @property {(id: string) => void} removeItem - Función para remover item
 * @property {(id: string, quantity: number) => void} updateQuantity - Función para actualizar cantidad
 * @property {() => void} clearCart - Función para vaciar el carrito
 * @property {() => Promise<void>} syncCart - Sincronizar carrito con backend
 * @property {boolean} isValid - Si todos los items del carrito son válidos
 * @property {boolean} isLoading - Si está cargando datos del backend
 * @property {boolean} isAuthenticated - Si el usuario está autenticado
 * @property {() => Promise<void>} handleLoginSync - Maneja sincronización al iniciar sesión
 */
type CartContextType = {
  items: CartItem[];
  totalItems: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  showToast: boolean;
  toastMessage: string;
  hideToast: () => void;
  syncCart: () => Promise<void>;
  isValid: boolean;
  isLoading: boolean;
  fixItem: (id: string) => Promise<void>;
  isAuthenticated: boolean;
  handleLoginSync: () => Promise<void>;
};

/**
 * Contexto de React para compartir el estado del carrito de compras.
 * Se crea con createContext y se utiliza en toda la aplicación.
 */
const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Componente CartProvider - Proveedor del contexto del carrito de compras.
 *
 * Este componente maneja todo el estado del carrito de compras, incluyendo:
 * - Estado de los items en el carrito
 * - Control del panel lateral del carrito
 * - Persistencia automática en localStorage
 * - Cálculo del total de items
 * - Funciones para gestionar items del carrito
 *
 * @component
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto
 * @returns {JSX.Element} Proveedor de contexto que envuelve los componentes hijos
 *
 * @example
 * ```tsx
 * // En el layout principal de la aplicación
 * import { CartProvider } from "@/hooks/use-cart";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="es">
 *       <body>
 *         <CartProvider>
 *           {children}
 *         </CartProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * @remarks
 * El CartProvider debe ser colocado en la raíz de la aplicación para que todos
 * los componentes tengan acceso al contexto del carrito. Utiliza localStorage
 * para persistir el estado del carrito entre sesiones del navegador.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [backendCart, setBackendCart] = useState<CartItem[]>([]);
  const [mergeDone, setMergeDone] = useState(false); // Flag para saber si ya se hizo el merge

  // Cola de sincronización para operaciones batch
  const syncQueueRef = useRef<Map<number, number>>(new Map()); // productId -> quantity
  // Map para almacenar la cantidad previa (antes de la operación) por productId
  const syncPrevQuantitiesRef = useRef<Map<number, number>>(new Map());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Usar isAuthenticated del AuthProvider
  const { isAuthenticated } = useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  /**
   * Función para sincronizar el carrito con el backend
   * Solo se ejecuta si el usuario está autenticado
   * @param silent - Si es true, no muestra el indicador de loading
   */
  const syncCart = useCallback(async (silent: boolean = false) => {
    // No sincronizar si no está autenticado
    if (!isAuthenticated) {
      console.log("User not authenticated, skipping cart sync");
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Si falla la autenticación, simplemente retornar
        if (response.status === 401) {
          console.log("Cart sync failed: Not authenticated");
          return;
        }
        throw new Error("Failed to sync cart");
      }

      const data = await response.json();

      if (data.success && data.data) {
        const backendItems = data.data.items.map((item: any) => ({
          id: String(item.product_id),
          name: item.product?.name || "Unknown Product",
          price: item.product?.price || 0,
          quantity: item.quantity,
          image: item.product?.image_url || "/placeholder.png",
          max_quantity: item.max_quantity,
          is_available: item.is_available,
          has_enough_stock: item.has_enough_stock,
        }));

        setItems(backendItems);
        setIsValid(data.data.valid !== false);
      }
    } catch (error) {
      console.error("Error syncing cart:", error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [API_BASE, isAuthenticated]);

  /**
   * Función para corregir un item con problemas (ajustar cantidad o eliminar)
   * Solo funciona si está autenticado
   */
  const fixItem = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      console.log("User not authenticated, cannot fix item");
      return;
    }

    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      const newQuantity = !item.is_available ? 0 : item.max_quantity || 0;

      const response = await fetch(`${API_BASE}/cart/items/manage`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: Number(id),
          quantity: newQuantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fix item");
      }

      // Sincronizar carrito después de corregir
      await syncCart();

      if (newQuantity === 0) {
        setToastMessage(`Producto eliminado del carrito`);
      } else {
        setToastMessage(`Cantidad ajustada a ${newQuantity} unidades`);
      }
      setShowToast(true);
    } catch (error) {
      console.error("Error fixing item:", error);
      setToastMessage("Error al corregir el item");
      setShowToast(true);
    }
  }, [items, API_BASE, syncCart, isAuthenticated]);

  /**
   * Función para sincronizar múltiples operaciones del carrito al backend en batch
   */
  const syncBatchToBackend = useCallback(async (operations: Array<{ productId: number; quantity: number; max_quantity?: number }>) => {
    if (!isAuthenticated || operations.length === 0) return;

    try {
      const response = await fetch(`${API_BASE}/cart/items/batch`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operations,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync batch operations");
      }

      const data = await response.json();

      // Verificar si hubo errores en alguna operación
      const failed = data.results?.filter((r: any) => r.action === 'failed') || [];
      if (failed.length > 0) {
        console.error("Some operations failed:", failed);

        // Mostrar mensajes específicos de error
        failed.forEach((failedOp: any) => {
          console.error(`Product ${failedOp.productId}: ${failedOp.error}`);
        });

        // Sincronizar el carrito con el backend para obtener el estado real
        await syncCart();

        setToastMessage(`Error: ${failed[0].error}`);
        setShowToast(true);

        return { success: false, failed };
      } else {
        console.log(`✅ Batch sync completed: ${operations.length} operations`);
      }

      return data;
    } catch (error) {
      console.error("Error syncing batch to backend:", error);
      // Sincronizar para obtener el estado real del backend
      await syncCart();
      setToastMessage("Error al sincronizar carrito");
      setShowToast(true);
      return { success: false };
    }
  }, [isAuthenticated, API_BASE, syncCart]);

  /**
   * Procesa la cola de sincronización y envía operaciones acumuladas al backend
   */
  const flushSyncQueue = useCallback(async () => {
    if (!isAuthenticated || syncQueueRef.current.size === 0) return;

    // Copiar operaciones desde la cola
    const entries = Array.from(syncQueueRef.current.entries());

    const operations = entries.map(([productId, quantity]) => ({
      productId,
      quantity,
      max_quantity: items.find(i => Number(i.id) === Number(productId))?.max_quantity ?? undefined,
    }));

    // Limpiar la cola y cancelar timeout inmediatamente para evitar reentradas
    syncQueueRef.current.clear();
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    // Enviar operaciones usando la función existente
    const result = await syncBatchToBackend(operations);

    // Si hubo operaciones fallidas, hacer rollback utilizando las cantidades previas
    const failed = result?.failed || [];
    if (failed.length > 0) {
      // Revertir sólo los productos fallidos a su cantidad previa almacenada
      setItems((prevItems) => {
        let next = [...prevItems];
        failed.forEach((f: any) => {
          const pid = Number(f.productId);
          const prevQty = syncPrevQuantitiesRef.current.get(pid);
          // Si no tenemos prevQty, no intentamos revertir
          if (prevQty == null) return;

          if (prevQty <= 0) {
            // eliminar el item
            next = next.filter((it) => Number(it.id) !== pid);
          } else {
            // restaurar cantidad previa
            next = next.map((it) => (Number(it.id) === pid ? { ...it, quantity: prevQty } : it));
          }
          // limpiar prev map para este producto
          syncPrevQuantitiesRef.current.delete(pid);
        });
        return next;
      });
      // El syncBatchToBackend ya muestra toast y sincroniza, no duplicamos mensajes
      return;
    }

    // Si todo fue OK, limpiar los prev stored para las operaciones aplicadas
    entries.forEach(([productId]) => syncPrevQuantitiesRef.current.delete(Number(productId)));
  }, [isAuthenticated, syncBatchToBackend]);

  /**
   * Agrega una operación a la cola de sincronización
   */
  const queueSync = useCallback((productId: number, quantity: number) => {
    if (!isAuthenticated) return;

    // Agregar/actualizar en la cola
    syncQueueRef.current.set(productId, quantity);

    // Cancelar timeout anterior
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Programar flush después de 500ms de inactividad
    syncTimeoutRef.current = setTimeout(() => {
      flushSyncQueue();
    }, 500);
  }, [isAuthenticated, flushSyncQueue]);

  /**
   * Función para enviar el carrito local al backend
   */
  const uploadLocalCartToBackend = useCallback(async (localItems: CartItem[]) => {
    if (!isAuthenticated) return;

    // If localItems is empty, we still may want to clear backend
    if (localItems.length === 0) {
      try {
        // Send a batch clear if backend has items (we don't know here) - call syncBatchToBackend with empty ops
        // To be safe, call syncCart first to check
        await syncCart();
        const backendHasItems = items.length > 0;
        if (backendHasItems) {
          const clearOps = items.map((it) => ({ productId: Number(it.id), quantity: 0 }));
          await syncBatchToBackend(clearOps);
        }
        setToastMessage("Carrito local sincronizado con el servidor");
        setShowToast(true);
      } catch (error) {
        console.error("Error uploading/clearing local cart:", error);
        setToastMessage("Error al sincronizar carrito");
        setShowToast(true);
      }
      return;
    }

    try {
      // Convertir items a operaciones batch
      const localOps = localItems.map(item => ({
        productId: Number(item.id),
        quantity: item.quantity,
        max_quantity: item.max_quantity ?? undefined,
      }));

      // Fetch backend cart directly to know which items to remove
      const resp = await fetch(`${API_BASE}/cart`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      let backendList: any[] = [];
      if (resp.ok) {
        const data = await resp.json();
        backendList = data?.data?.items || [];
      }

      const backendProductIds = new Set(backendList.map((it: any) => Number(it.product_id)));
      const localProductIds = new Set(localItems.map((it) => Number(it.id)));

      // Items present in backend but not in local should be removed (quantity 0)
      const removeOps = Array.from(backendProductIds).filter((pid) => !localProductIds.has(pid)).map((pid) => ({ productId: pid, quantity: 0 }));

      const operations = [...localOps, ...removeOps];

      if (operations.length > 0) {
        await syncBatchToBackend(operations);
      }

      // Sincronizar para obtener el carrito actualizado con validación
      await syncCart();

      setToastMessage("Carrito local sincronizado con el servidor");
      setShowToast(true);
    } catch (error) {
      console.error("Error uploading local cart:", error);
      setToastMessage("Error al sincronizar carrito");
      setShowToast(true);
    }
  }, [syncCart, isAuthenticated, syncBatchToBackend]);

  /**
   * Maneja la sincronización del carrito al iniciar sesión
   */
  const handleLoginSync = useCallback(async () => {
    if (!isAuthenticated || mergeDone) return; // No hacer nada si ya se hizo el merge

    // Obtener carrito local
    const localCart = items.length > 0 ? items : [];

    // Si hay carrito local, preguntar qué hacer
    if (localCart.length > 0) {
      try {
        // Primero, verificar si hay carrito en el backend
        const response = await fetch(`${API_BASE}/cart`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const backendItems = data.success && data.data ? data.data.items : [];

          // Helper: comparar carts por product_id -> quantity
          const compareCarts = (local: CartItem[], backend: any[]) => {
            const mapLocal = new Map<number, number>()
            local.forEach(it => mapLocal.set(Number(it.id), Number(it.quantity || 0)))
            const mapBackend = new Map<number, number>()
            backend.forEach((it: any) => mapBackend.set(Number(it.product_id), Number(it.quantity || 0)))

            if (mapLocal.size !== mapBackend.size) return false
            for (const [pid, qty] of mapLocal) {
              if (!mapBackend.has(pid)) return false
              if (mapBackend.get(pid) !== qty) return false
            }
            return true
          }

          // If both carts are present and identical, skip merge prompt
          if (backendItems.length > 0 && localCart.length > 0 && compareCarts(localCart, backendItems)) {
            // carts identical: mark merged and sync to ensure server/local are consistent
            await syncCart();
            setMergeDone(true);
            setToastMessage('Carrito sincronizado automáticamente (sin cambios)');
            setShowToast(true);
            return;
          }

          if (backendItems.length > 0) {
            // Hay carrito en ambos lados - preguntar al usuario
            const mappedBackendItems = backendItems.map((item: any) => ({
              id: String(item.product_id),
              name: item.product?.name || "Unknown Product",
              price: item.product?.price || 0,
              quantity: item.quantity,
              image: item.product?.image_url || "/placeholder.png",
              max_quantity: item.max_quantity,
              is_available: item.is_available,
              has_enough_stock: item.has_enough_stock,
            }));

            setBackendCart(mappedBackendItems);
            setShowMergeDialog(true);
          } else {
            // No hay carrito en backend, subir el local
            await uploadLocalCartToBackend(localCart);
            setMergeDone(true); // Marcar como completado
          }
        }
      } catch (error) {
        console.error("Error checking backend cart:", error);
        // Si hay error, subir el carrito local de todos modos
        await uploadLocalCartToBackend(localCart);
        setMergeDone(true); // Marcar como completado
      }
    } else {
      // No hay carrito local, simplemente sincronizar
      await syncCart();
      setMergeDone(true); // Marcar como completado
    }
  }, [isAuthenticated, mergeDone, items, API_BASE, syncCart, uploadLocalCartToBackend]);

  /**
   * Mantiene el carrito local y lo sube al backend
   */
  const handleKeepLocal = useCallback(async () => {
    setShowMergeDialog(false);
    setBackendCart([]); // Limpiar el carrito del backend en memoria
    // Try to apply local cart to backend and keep local state
    try {
      await uploadLocalCartToBackend(items);
      // local items already represent desired state, ensure merge flag set
      setMergeDone(true);
      setToastMessage("Se ha mantenido el carrito local y sincronizado con el servidor");
      setShowToast(true);
    } catch (e) {
      // uploadLocalCartToBackend handles its own errors and toasts, but ensure mergeDone isn't set on failure
      console.error("handleKeepLocal error:", e);
    }
  }, [items, uploadLocalCartToBackend]);

  /**
   * Carga el carrito del backend y descarta el local
   */
  const handleLoadBackend = useCallback(async () => {
    setShowMergeDialog(false);
    setBackendCart([]); // Limpiar el carrito del backend en memoria
    try {
      await syncCart();
      // syncCart will populate `items` from backend; ensure local persists that
      setMergeDone(true);
      setToastMessage("Carrito del servidor cargado");
      setShowToast(true);
    } catch (e) {
      console.error("handleLoadBackend error:", e);
    }
  }, [syncCart]);

  /**
   * Hook useEffect que carga el carrito desde localStorage al montar el componente.
   * Restaura el estado del carrito de sesiones anteriores del navegador.
   *
   * @effect
   * @dependency [] - Se ejecuta solo una vez al montar el componente
   */
  useEffect(() => {
    const savedCart =
      typeof window !== "undefined" ? localStorage.getItem("cart") : null;
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          // Normalizar ids y tipos por si vienen como números o strings distintos
          const normalized: CartItem[] = parsed.map((it: any) => {
            const id = it?.id != null ? String(it.id) : String(it?.product_id ?? "");
            const quantity = Number(it?.quantity ?? 0);
            const max_quantity = it?.max_quantity != null ? Number(it.max_quantity) : undefined;
            const clampedQuantity = typeof max_quantity === 'number' ? Math.min(quantity, max_quantity) : quantity;
            return {
              id,
              name: it?.name ?? it?.product?.name ?? "Unknown",
              price: Number(it?.price ?? 0),
              quantity: clampedQuantity,
              image: it?.image ?? it?.product?.image_url ?? "/placeholder.png",
              max_quantity,
              is_available: it?.is_available,
              has_enough_stock: it?.has_enough_stock,
            } as CartItem;
          });
          setItems(normalized);
        } else {
          // Si no es array, fallback
          setItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
      }
    }
    setIsMounted(true);

    // Verificar autenticación y sincronizar si está autenticado
    if (isAuthenticated) {
      syncCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Hook useEffect que guarda el carrito en localStorage cada vez que cambia.
   * Persiste el estado del carrito para mantenerlo entre sesiones del navegador.
   *
   * @effect
   * @dependency {CartItem[]} items - Estado de los items del carrito
   * @dependency {boolean} isMounted - Flag que indica si el componente está montado
   */
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, isMounted]);

  /**
   * Hook useEffect que sincroniza el carrito cuando se abre
   * Solo si está autenticado
   */
  useEffect(() => {
    if (isOpen && isMounted && isAuthenticated) {
      syncCart();
    }
  }, [isOpen, isMounted, syncCart, isAuthenticated]);

  /**
   * Hook useEffect que detecta cuando el usuario inicia sesión
   * y sincroniza el carrito automáticamente
   */
  useEffect(() => {
    if (isMounted && isAuthenticated && !mergeDone) {
      // Llamar a handleLoginSync cuando el usuario inicia sesión
      handleLoginSync().catch(console.error);
    }

    // Si el usuario cierra sesión, resetear el flag de merge
    if (isMounted && !isAuthenticated) {
      setMergeDone(false);
    }
  }, [isAuthenticated, isMounted, mergeDone, handleLoginSync]);

  /**
   * Hook useEffect para limpiar la cola de sincronización al desmontar
   */
  useEffect(() => {
    return () => {
      // Flush pendiente antes de desmontar
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (syncQueueRef.current.size > 0) {
        // No podemos hacer async en cleanup, pero la cola se perderá
        console.warn("Sync queue had pending operations on unmount");
      }
    };
  }, []);

  /**
   * Cálculo memoizado del total de items en el carrito.
   * Suma las cantidades de todos los items para obtener el total.
   *
   * @memo
   * @returns {number} Total de items en el carrito
   */
  const totalItems = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  /**
   * Función para agregar un item al carrito.
   * Usa actualización optimista: actualiza la UI inmediatamente y valida en segundo plano.
   * Si la validación falla, revierte los cambios.
   *
   * @param {Omit<CartItem, "quantity">} item - Item a agregar (sin cantidad)
   */
  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    // Si el item provee max_quantity, respetarlo (stock disponible)
    const currentItem = items.find((i) => i.id === item.id);
    const currentQty = currentItem ? currentItem.quantity : 0;
    // Normalize/parse max_quantity values (accept numeric strings, null)
    const rawItemMax = (item as any).max_quantity;
    const rawCurrentMax = currentItem?.max_quantity;
    const parsedItemMax = rawItemMax != null && (typeof rawItemMax === 'number' || rawItemMax !== '') ? Number(rawItemMax) : undefined;
    const parsedCurrentMax = rawCurrentMax != null && (typeof rawCurrentMax === 'number' || (typeof rawCurrentMax === 'string' && rawCurrentMax !== '')) ? Number(rawCurrentMax) : undefined;
    const maxQty = parsedItemMax ?? parsedCurrentMax ?? Infinity;
    const newQuantity = currentQty + 1;

    // Debug: ayudar a diagnosticar problemas con addItem cuando no hay sesión
    // (se puede quitar luego)
    try {
      // eslint-disable-next-line no-console
      console.debug(`[cart] addItem called`, { id: item.id, name: item.name, currentQty, rawItemMax, rawCurrentMax, parsedItemMax, parsedCurrentMax, maxQty, newQuantity, isAuthenticated });
    } catch (e) {
      // ignore
    }

    // Si el nuevo valor excede el stock máximo, mostrar mensaje y no agregar
    if (typeof maxQty === "number" && newQuantity > maxQty) {
      // eslint-disable-next-line no-console
      console.warn(`[cart] addItem prevented: exceeding maxQty`, { id: item.id, currentQty, maxQty, newQuantity });
      setToastMessage(`No hay suficiente stock. Máximo disponible: ${maxQty}`);
      setShowToast(true);
      return;
    }

    const previousItems = [...items]; // Guardar estado anterior para posible rollback

    // ACTUALIZACIÓN OPTIMISTA: Actualizar UI inmediatamente
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);

      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      return [...prevItems, { ...item, quantity: 1 }];
    });

    // Mostrar notificación inmediata
    setToastMessage(`"${item.name}" agregado al carrito`);
    setShowToast(true);

    // Debug: confirmar que el item fue agregado localmente
    try {
      // eslint-disable-next-line no-console
      console.debug(`[cart] added locally`, { id: item.id, name: item.name, newQuantity });
    } catch (e) {
      // ignore
    }

    // Si está autenticado, encolar la operación para batch; almacenar cantidad previa
    if (isAuthenticated) {
      // Guardar la cantidad previa si no está guardada ya
      const pid = Number(item.id);
      if (!syncPrevQuantitiesRef.current.has(pid)) {
        syncPrevQuantitiesRef.current.set(pid, currentQty);
      }
      queueSync(pid, newQuantity);
      // eslint-disable-next-line no-console
      console.debug(`[cart] queued addItem`, { id: item.id, newQuantity });
    }
  }, [items, isAuthenticated, API_BASE, syncCart]);

  const hideToast = () => {
    setShowToast(false);
  };

  /**
   * Función para remover completamente un item del carrito.
   * Usa actualización optimista: remueve inmediatamente de la UI y sincroniza en segundo plano.
   *
   * @param {string} id - ID del item a remover
   */
  const removeItem = useCallback((id: string) => {
    const previousItems = [...items]; // Guardar estado anterior para posible rollback

    // ACTUALIZACIÓN OPTIMISTA: Remover de UI inmediatamente
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));

    // Si está autenticado, encolar la operación para batch y guardar cantidad previa
    if (isAuthenticated) {
      const pid = Number(id);
      const current = items.find((i) => i.id === id);
      const prevQty = current ? current.quantity : 0;
      if (!syncPrevQuantitiesRef.current.has(pid)) {
        syncPrevQuantitiesRef.current.set(pid, prevQty);
      }
      queueSync(pid, 0);
      // eslint-disable-next-line no-console
      console.debug(`[cart] queued removeItem`, { id, prevQty });
    }
  }, [items, isAuthenticated, API_BASE, syncCart]);

  /**
   * Función para actualizar la cantidad de un item en el carrito.
   * Usa actualización optimista: actualiza la UI inmediatamente y valida en segundo plano.
   * Si la validación falla, revierte los cambios.
   *
   * @param {string} id - ID del item a actualizar
   * @param {number} quantity - Nueva cantidad del item
   */
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }

    // Validar contra stock máximo si existe
    const currentItem = items.find((i) => i.id === id);
    const rawCurrentMax = currentItem?.max_quantity;
    const parsedCurrentMax = rawCurrentMax != null && (typeof rawCurrentMax === 'number' || (typeof rawCurrentMax === 'string' && rawCurrentMax !== '')) ? Number(rawCurrentMax) : undefined;
    const maxQty = parsedCurrentMax ?? Infinity;

    if (typeof maxQty === 'number' && quantity > maxQty) {
      // No permitir actualizar por encima del stock
      // eslint-disable-next-line no-console
      console.warn(`[cart] updateQuantity prevented: exceeding maxQty`, { id, quantity, maxQty });
      setToastMessage(`No hay suficiente stock. Máximo disponible: ${maxQty}`);
      setShowToast(true);
      return;
    }

    const previousItems = [...items]; // Guardar estado anterior para posible rollback

    // ACTUALIZACIÓN OPTIMISTA: Actualizar UI inmediatamente
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );

    // Si está autenticado, encolar la operación para que el batch se envíe
    // solo después del debounce (flushSyncQueue). Esto evita hacer un POST
    // en cada pulsación y recupera el comportamiento anterior.
    if (isAuthenticated) {
      const pid = Number(id);
      if (!syncPrevQuantitiesRef.current.has(pid)) {
        // guardar la cantidad previa (desde previousItems)
        const prev = previousItems.find((i) => i.id === id)?.quantity ?? 0;
        syncPrevQuantitiesRef.current.set(pid, prev);
      }
      queueSync(Number(id), quantity);
      // eslint-disable-next-line no-console
      console.debug(`[cart] queued quantity update`, { id, quantity });
    }
  }, [items, isAuthenticated, API_BASE, syncCart, removeItem]);

  /**
   * Función para vaciar completamente el carrito.
   * Remueve todos los items del carrito local y del backend si está autenticado.
   */
  const clearCart = useCallback(async () => {
    // Prefer to clear backend first; only clear local state on success to avoid data loss
    const currentItems = [...items]; // Guardar items actuales
    if (isAuthenticated && currentItems.length > 0) {
      try {
        const operations = currentItems.map(item => ({ productId: Number(item.id), quantity: 0 }));
        const result = await syncBatchToBackend(operations);
        // If backend indicates success (no failed ops), clear local
        const failed = result?.failed || [];
        if (failed.length === 0) {
          setItems([]);
          setToastMessage("Carrito vacío");
          setShowToast(true);
          console.log(`✅ Cart cleared: ${operations.length} items removed from backend`);
        } else {
          setToastMessage("No se pudo vaciar completamente el carrito en el servidor");
          setShowToast(true);
          console.error("Some items failed to clear:", failed);
        }
      } catch (error) {
        console.error("Error clearing backend cart:", error);
        setToastMessage("Error al vaciar el carrito en el servidor");
        setShowToast(true);
      }
    } else {
      // Not authenticated or already empty - just clear local
      setItems([]);
      setToastMessage("Carrito vacío");
      setShowToast(true);
    }
  }, [isAuthenticated, items, syncBatchToBackend]);

  /**
   * Valor memoizado del contexto del carrito.
   * Incluye todas las funciones y estados para optimizar el rendimiento.
   *
   * @memo
   * @returns {CartContextType} Objeto con todas las propiedades del contexto
   */
  const value = useMemo(
    () => ({
      items,
      totalItems,
      isOpen,
      setIsOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      showToast,
      toastMessage,
      hideToast,
      syncCart,
      isValid,
      isLoading,
      fixItem,
      isAuthenticated,
      handleLoginSync,
    }),
    [
      items,
      totalItems,
      isOpen,
      showToast,
      toastMessage,
      isValid,
      isLoading,
      syncCart,
      fixItem,
      isAuthenticated,
      handleLoginSync,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartMergeDialog
        isOpen={showMergeDialog}
        onClose={() => setShowMergeDialog(false)}
        onKeepLocal={handleKeepLocal}
        onLoadBackend={handleLoadBackend}
        // Enviar suma de cantidades (claves a pedir) en lugar de número de líneas
        localItemCount={items.reduce((s, it) => s + Number(it.quantity || 0), 0)}
        backendItemCount={backendCart.reduce((s, it) => s + Number(it.quantity || 0), 0)}
      />
    </CartContext.Provider>
  );
}

/**
 * Hook personalizado para acceder al contexto del carrito de compras.
 * Proporciona acceso a todas las funciones y estados del carrito.
 *
 * @returns {CartContextType} Objeto con todas las propiedades y funciones del carrito
 * @throws {Error} Cuando se usa fuera de un CartProvider
 *
 * @example
 * ```tsx
 * import { useCart } from "@/hooks/use-cart";
 *
 * function ProductCard({ product }) {
 *   const { addItem, totalItems } = useCart();
 *
 *   const handleAddToCart = () => {
 *     addItem({
 *       id: product.id,
 *       name: product.name,
 *       price: product.price,
 *       image: product.image,
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleAddToCart}>Agregar al carrito</button>
 *       <span>Items en carrito: {totalItems}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
