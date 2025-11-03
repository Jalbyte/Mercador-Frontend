# 📧 Email Templates - Frontend

Plantillas de email renderizadas como páginas de Next.js para generación de PDFs.

## 🎯 Cómo funciona

### 1. El backend hace fetch a la página

```typescript
// Backend (mail.service.ts)
const html = await fetch('http://localhost:3000/email/order-status?reference=ORDER-123&status=confirmed')
  .then(r => r.text())
```

### 2. Next.js renderiza la página como HTML

La página en `/email/order-status` es una página normal de Next.js que:
- Recibe parámetros por `searchParams`
- Renderiza HTML estilizado
- Funciona en navegador Y en Puppeteer

### 3. Puppeteer genera el PDF (opcional)

```typescript
// Backend (mail.service.ts)
const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.goto('http://localhost:3000/email/order-status?reference=ORDER-123')
const pdf = await page.pdf({ format: 'A4' })
```

## 📁 Estructura

```
src/app/email/
├── order-status/
│   └── page.tsx          # Template de estado de orden
└── checkout/
    └── page.tsx          # Template de factura/checkout
```

## 📋 Plantillas disponibles

### 1. **Order Status** (`/email/order-status`)
Notificación de estado de orden (confirmado, pendiente, cancelado, error).

**Parámetros:**
- `reference` - Referencia de la orden
- `status` - Estado: confirmed | pending | cancelled | error
- `orderId` - ID de la orden (opcional)
- `customerEmail` - Email del cliente (opcional)
- `totalAmount` - Monto total (opcional)
- `assigned` - JSON de claves asignadas (opcional)

**Ejemplo:**
```
http://localhost:3000/email/order-status?reference=ORDER-123&status=confirmed&orderId=456&totalAmount=150000
```

### 2. **Checkout/Invoice** (`/email/checkout`)
Factura detallada con listado de productos, cantidades, precios y resumen.

**Parámetros:**
- `orderId` - ID de la orden
- `reference` - Referencia de la orden
- `items` - JSON array de productos: `[{"id":"1","name":"Producto A","price":50000,"quantity":2}]`
- `total` - Monto total
- `subtotal` - Subtotal (opcional, se calcula automáticamente)
- `tax` - Impuestos (opcional)
- `discount` - Descuento (opcional)
- `customerName` - Nombre del cliente
- `customerEmail` - Email del cliente (opcional)
- `customerPhone` - Teléfono del cliente (opcional)
- `paymentMethod` - Método de pago (opcional)
- `transactionDate` - Fecha de transacción (opcional)
- `status` - Estado: confirmed | pending | cancelled (default: confirmed)

**Ejemplo:**
```
http://localhost:3000/email/checkout?orderId=123&reference=ORDER-123&customerName=Juan&customerEmail=juan@example.com&total=150000&items=[{"id":"1","name":"Licencia Windows 11","price":50000,"quantity":2},{"id":"2","name":"Office 365","price":50000,"quantity":1}]&paymentMethod=Wompi
```

## 🎨 Crear nueva plantilla

### 1. Crear la página

```tsx
// src/app/email/welcome/page.tsx
interface PageProps {
  searchParams: {
    name?: string
    email?: string
  }
}

export default function WelcomeEmailPage({ searchParams }: PageProps) {
  const { name = 'Usuario', email } = searchParams

  return (
    <html>
      <head>
        <title>Bienvenido {name}</title>
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              background: #f3f4f6;
            }
            .card {
              background: white;
              padding: 32px;
              border-radius: 8px;
              max-width: 600px;
              margin: 0 auto;
            }
          `
        }} />
      </head>
      <body>
        <div className="card">
          <h1>¡Bienvenido {name}!</h1>
          <p>Gracias por registrarte en Mercador.</p>
          {email && <p>Tu email: {email}</p>}
        </div>
      </body>
    </html>
  )
}
```

### 2. Usar desde el backend

```typescript
// Backend
await sendOrderEmail({
  to: user.email,
  subject: 'Bienvenido a Mercador',
  templatePath: `${FRONTEND_URL}/email/welcome`,
  templateQuery: {
    name: user.name,
    email: user.email
  },
  attachPdf: false
})
```

## 🧪 Testing

### Ver en el navegador

Abre en tu navegador para ver cómo se renderiza:

```
http://localhost:3000/email/order-status?reference=ORDER-123&status=confirmed
```

### Probar con diferentes estados

```bash
# Orden confirmada
http://localhost:3000/email/order-status?reference=ORDER-123&status=confirmed&assigned={"101":2}

# Orden pendiente
http://localhost:3000/email/order-status?reference=ORDER-456&status=pending

# Orden cancelada
http://localhost:3000/email/order-status?reference=ORDER-789&status=cancelled

# Error
http://localhost:3000/email/order-status?reference=ORDER-999&status=error
```

### Generar PDF manualmente

Usa Puppeteer en el backend:

```typescript
import puppeteer from 'puppeteer'

const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.goto('http://localhost:3000/email/order-status?reference=ORDER-123&status=confirmed')
await page.pdf({ path: 'order.pdf', format: 'A4' })
await browser.close()
```

## 🎨 Estilos

### Inline styles vs CSS-in-JS

Para emails, usa **inline styles** con `dangerouslySetInnerHTML`:

```tsx
<style dangerouslySetInnerHTML={{
  __html: `
    body { font-family: Arial, sans-serif; }
    .card { background: white; padding: 20px; }
  `
}} />
```

**¿Por qué?**
- ✅ Funciona en email clients
- ✅ Puppeteer lo renderiza correctamente
- ✅ No necesita CSS externo

### Tipografía segura

Usa fuentes web-safe:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
```

### Colores de estado

```typescript
const statusColors = {
  confirmed: '#10B981',  // Verde
  pending: '#F59E0B',    // Naranja
  cancelled: '#EF4444',  // Rojo
  error: '#EF4444'       // Rojo
}
```

## 📱 Responsive

### Mobile-first

```css
body {
  padding: 24px;
}

@media (max-width: 600px) {
  body {
    padding: 12px;
  }
  
  .container {
    font-size: 14px;
  }
}
```

### Print styles

Para PDFs:

```css
@media print {
  body {
    background: white;
    padding: 0;
  }
  
  .no-print {
    display: none;
  }
}
```

## 🔒 Seguridad

### Sanitizar inputs

Los `searchParams` vienen de la URL, así que sanitiza:

```tsx
const reference = searchParams.reference?.substring(0, 50) || 'UNKNOWN'
const status = ['confirmed', 'pending', 'cancelled', 'error'].includes(searchParams.status || '')
  ? searchParams.status
  : 'pending'
```

### No exponer datos sensibles

❌ **NO hagas esto:**
```tsx
// NO incluyas datos sensibles en los query params
?creditCard=1234-5678-9012-3456
?password=secret123
```

✅ **HAZ esto:**
```tsx
// Solo referencias y flags públicas
?reference=ORDER-123&status=confirmed&orderId=456
```

## ⚡ Performance

### Server-side rendering

Next.js renderiza estas páginas en el servidor automáticamente:

```tsx
// Esta página se renderiza en el servidor
export default function OrderStatusEmailPage({ searchParams }: PageProps) {
  // Este código corre en el servidor, no en el navegador
  return <html>...</html>
}
```

### Cache

Para mejorar performance:

```tsx
// app/email/order-status/page.tsx
export const revalidate = 60 // Cache por 60 segundos
```

### Metadata

Añade metadata para SEO:

```tsx
export const metadata = {
  title: 'Email Template - Order Status',
  robots: {
    index: false, // No indexar en Google
    follow: false
  }
}
```

## 🚀 Deploy

### Variables de entorno

En el backend (.env):

```bash
# URL del frontend en producción
FRONTEND_URL=https://mercador.app
```

### Vercel

Si usas Vercel para el frontend:

```bash
# Backend apunta al dominio de Vercel
FRONTEND_URL=https://mercador.vercel.app
```

### Docker

Si ambos en Docker:

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      FRONTEND_URL: http://frontend:3000
  
  frontend:
    ports:
      - "3000:3000"
```

## 📚 Ejemplos

### Plantilla de bienvenida

```tsx
// app/email/welcome/page.tsx
export default function WelcomePage({ searchParams }: any) {
  return (
    <html>
      <body>
        <h1>¡Bienvenido {searchParams.name}!</h1>
      </body>
    </html>
  )
}
```

### Plantilla de reset de contraseña

```tsx
// app/email/reset-password/page.tsx
export default function ResetPasswordPage({ searchParams }: any) {
  const { token, email } = searchParams
  
  return (
    <html>
      <body>
        <h1>Resetear contraseña</h1>
        <p>Email: {email}</p>
        <a href={`https://mercador.app/reset?token=${token}`}>
          Resetear contraseña
        </a>
      </body>
    </html>
  )
}
```

### Plantilla de factura

```tsx
// app/email/invoice/page.tsx
export default function InvoicePage({ searchParams }: any) {
  const { orderId, items, total } = searchParams
  const itemsList = JSON.parse(items || '[]')
  
  return (
    <html>
      <body>
        <h1>Factura #{orderId}</h1>
        <table>
          {itemsList.map((item: any) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>${item.price}</td>
            </tr>
          ))}
        </table>
        <p>Total: ${total}</p>
      </body>
    </html>
  )
}
```

## 🐛 Troubleshooting

### Estilos no se aplican

**Problema:** Los estilos no aparecen en el PDF

**Solución:** Usa inline styles con `dangerouslySetInnerHTML`:

```tsx
<style dangerouslySetInnerHTML={{ __html: `...` }} />
```

### Imágenes no cargan

**Problema:** Las imágenes no aparecen en el PDF

**Solución:** Usa URLs absolutas:

```tsx
<img src="https://mercador.app/logo.png" />
// NO: <img src="/logo.png" />
```

### Fuentes custom no funcionan

**Problema:** Google Fonts no carga en PDF

**Solución:** Usa fuentes web-safe o embebe la fuente:

```css
@font-face {
  font-family: 'MyFont';
  src: url(data:font/woff2;base64,...);
}
```

---

**Última actualización:** Noviembre 2, 2025
