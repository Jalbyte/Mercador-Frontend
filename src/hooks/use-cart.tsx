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

import { createContext, useContext, useState, useMemo, useEffect } from "react";

/**
 * Tipo que define la estructura de un item en el carrito de compras.
 *
 * @typedef {Object} CartItem
 * @property {string} id - Identificador único del producto
 * @property {string} name - Nombre del producto
 * @property {number} price - Precio unitario del producto
 * @property {number} quantity - Cantidad del producto en el carrito
 * @property {string} image - URL de la imagen del producto
 */
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
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
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
      }
    }
    setIsMounted(true);
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
   * Si el item ya existe, incrementa su cantidad. Si no existe, lo agrega con cantidad 1.
   *
   * @param {Omit<CartItem, "quantity">} item - Item a agregar (sin cantidad)
   */
  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);

      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      return [...prevItems, { ...item, quantity: 1 }];
    });
    
    // Mostrar notificación
    setToastMessage(`"${item.name}" agregado al carrito`);
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  /**
   * Función para remover completamente un item del carrito.
   *
   * @param {string} id - ID del item a remover
   */
  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  /**
   * Función para actualizar la cantidad de un item en el carrito.
   * Si la cantidad es menor a 1, remueve el item completamente.
   *
   * @param {string} id - ID del item a actualizar
   * @param {number} quantity - Nueva cantidad del item
   */
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  /**
   * Función para vaciar completamente el carrito.
   * Remueve todos los items del carrito.
   */
  const clearCart = () => {
    setItems([]);
  };

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
    }),
    [
      items,
      totalItems,
      isOpen,
      showToast,
      toastMessage,
      removeItem,
      updateQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
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
