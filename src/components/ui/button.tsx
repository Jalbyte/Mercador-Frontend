import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Variantes del componente Button usando class-variance-authority.
 * Define los estilos base y las variantes disponibles para el botón.
 *
 * @remarks
 * Incluye estilos base para accesibilidad, estados disabled, y transiciones.
 * Las variantes incluyen colores y estilos visuales diferentes.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Props del componente Button.
 * Extiende las props nativas de HTMLButtonElement y las variantes de buttonVariants.
 *
 * @interface ButtonProps
 * @extends {React.ButtonHTMLAttributes<HTMLButtonElement>}
 * @extends {VariantProps<typeof buttonVariants>}
 * @property {boolean} [asChild] - Si usar Slot para composición de componentes
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * Componente Button - Botón reutilizable con múltiples variantes y tamaños.
 *
 * Este componente implementa un botón flexible y accesible que soporta:
 * - Múltiples variantes visuales (default, destructive, outline, etc.)
 * - Diferentes tamaños (sm, default, lg, icon)
 * - Composición con Radix UI Slot
 * - Accesibilidad completa con focus management
 * - Estados disabled automáticos
 *
 * @component
 * @param {ButtonProps} props - Props del componente
 * @param {React.Ref<HTMLButtonElement>} ref - Referencia al elemento button
 * @returns {JSX.Element} Elemento JSX que representa el botón
 *
 * @example
 * ```tsx
 * // Botón por defecto
 * <Button>Click me</Button>
 *
 * // Botón destructivo pequeño
 * <Button variant="destructive" size="sm">
 *   Eliminar
 * </Button>
 *
 * // Botón outline grande
 * <Button variant="outline" size="lg">
 *   Acción principal
 * </Button>
 *
 * // Botón como enlace usando composición
 * <Button asChild>
 *   <Link href="/dashboard">Ir al dashboard</Link>
 * </Button>
 *
 * // Botón de icono
 * <Button variant="ghost" size="icon">
 *   <FiSearch />
 * </Button>
 * ```
 *
 * @remarks
 * - Usa class-variance-authority para gestión eficiente de variantes
 * - Implementa forwardRef para acceso directo al DOM
 * - Soporta composición con Radix UI Slot
 * - Incluye estilos de accesibilidad y focus management
 * - Compatible con todas las props nativas de HTMLButtonElement
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
