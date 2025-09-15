import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Componente Card - Contenedor principal para tarjetas de contenido.
 *
 * Este componente implementa un contenedor visual con:
 * - Bordes redondeados y sombra sutil
 * - Fondo y colores temáticos
 * - Diseño responsive y accesible
 * - Composición con subcomponentes especializados
 *
 * @component
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props del componente
 * @param {React.Ref<HTMLDivElement>} ref - Referencia al elemento div
 * @returns {JSX.Element} Elemento JSX que representa la tarjeta
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Título de la tarjeta</CardTitle>
 *     <CardDescription>Descripción opcional</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Contenido principal de la tarjeta</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Acción</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * Componente CardHeader - Encabezado de la tarjeta.
 *
 * Se utiliza para el título y descripción principal de la tarjeta.
 * Incluye espaciado vertical automático entre elementos hijos.
 *
 * @component
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props del componente
 * @param {React.Ref<HTMLDivElement>} ref - Referencia al elemento div
 * @returns {JSX.Element} Elemento JSX que representa el encabezado
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * Componente CardTitle - Título principal de la tarjeta.
 *
 * Renderiza un encabezado h3 con estilos semánticos apropiados.
 * Incluye espaciado optimizado y tipografía prominente.
 *
 * @component
 * @param {React.HTMLAttributes<HTMLHeadingElement>} props - Props del componente
 * @param {React.Ref<HTMLParagraphElement>} ref - Referencia al elemento h3
 * @returns {JSX.Element} Elemento JSX que representa el título
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * Componente CardDescription - Descripción secundaria de la tarjeta.
 *
 * Muestra texto descriptivo con estilos de color muted.
 * Complementa al título con información adicional.
 *
 * @component
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - Props del componente
 * @param {React.Ref<HTMLParagraphElement>} ref - Referencia al elemento p
 * @returns {JSX.Element} Elemento JSX que representa la descripción
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * Componente CardContent - Contenido principal de la tarjeta.
 *
 * Área principal donde se coloca el contenido de la tarjeta.
 * Incluye padding superior reducido para conectar con el header.
 *
 * @component
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props del componente
 * @param {React.Ref<HTMLDivElement>} ref - Referencia al elemento div
 * @returns {JSX.Element} Elemento JSX que representa el contenido
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * Componente CardFooter - Pie de la tarjeta.
 *
 * Se utiliza para acciones, botones o información adicional al final.
 * Incluye layout flex para alinear elementos horizontalmente.
 *
 * @component
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props del componente
 * @param {React.Ref<HTMLDivElement>} ref - Referencia al elemento div
 * @returns {JSX.Element} Elemento JSX que representa el pie
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
