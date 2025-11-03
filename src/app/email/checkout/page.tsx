/**
 * Página de template de email para checkout/factura
 * 
 * Esta página muestra el detalle completo de la compra con productos,
 * cantidades, precios y total. Se usa para emails de confirmación
 * y para generar PDFs de facturas.
 * 
 * URL: /email/checkout?orderId=123&reference=ORDER-123&items=[...]&total=150000&customerName=Juan
 * 
 * @example
 * // Ver en navegador
 * http://localhost:3000/email/checkout?orderId=123&reference=ORDER-123&customerName=Juan&customerEmail=juan@example.com&total=150000&items=[{"id":"1","name":"Producto A","price":50000,"quantity":2},{"id":"2","name":"Producto B","price":50000,"quantity":1}]
 * 
 * // Puppeteer lo convierte a PDF
 * puppeteer.goto('http://localhost:3000/email/checkout?orderId=123&reference=ORDER-123&...')
 */

import React from 'react'

interface CheckoutItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface PageProps {
  searchParams: {
    orderId?: string
    reference?: string
    items?: string // JSON string of CheckoutItem[]
    total?: string
    subtotal?: string
    tax?: string
    discount?: string
    customerName?: string
    customerEmail?: string
    customerPhone?: string
    paymentMethod?: string
    transactionDate?: string
    status?: string
  }
}

export default function CheckoutEmailPage({ searchParams }: PageProps) {
  const {
    orderId = 'N/A',
    reference = 'N/A',
    items: itemsJson = '[]',
    total = '0',
    subtotal,
    tax = '0',
    discount = '0',
    customerName = 'Cliente',
    customerEmail,
    customerPhone,
    paymentMethod = 'Tarjeta de crédito',
    transactionDate,
    status = 'confirmed'
  } = searchParams

  // Parse items
  let items: CheckoutItem[] = []
  try {
    items = JSON.parse(itemsJson)
  } catch (e) {
    console.error('Error parsing items:', e)
  }

  // Calculate subtotal if not provided
  const calculatedSubtotal = subtotal 
    ? parseFloat(subtotal)
    : items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const totalAmount = parseFloat(total)
  const taxAmount = parseFloat(tax)
  const discountAmount = parseFloat(discount)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Status config
  const statusConfig = {
    confirmed: {
      color: '#10B981',
      icon: '✅',
      title: 'Pago Confirmado',
      badge: 'PAGADO'
    },
    pending: {
      color: '#F59E0B',
      icon: '⏳',
      title: 'Pago Pendiente',
      badge: 'PENDIENTE'
    },
    cancelled: {
      color: '#EF4444',
      icon: '❌',
      title: 'Pago Cancelado',
      badge: 'CANCELADO'
    }
  }

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`Factura ${reference} - Mercador`}</title>
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background: #f3f4f6;
              padding: 24px;
            }

            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }

            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              padding: 40px 32px;
            }

            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 24px;
            }

            .logo {
              font-size: 28px;
              font-weight: 700;
            }

            .status-badge {
              background: ${currentStatus.color};
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .header-title {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 8px;
            }

            .header-subtitle {
              font-size: 16px;
              opacity: 0.9;
            }

            .content {
              padding: 32px;
            }

            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 24px;
              margin-bottom: 32px;
              padding-bottom: 32px;
              border-bottom: 2px solid #e5e7eb;
            }

            .info-section {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
            }

            .info-title {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              font-weight: 600;
              margin-bottom: 12px;
            }

            .info-text {
              color: #111827;
              margin-bottom: 4px;
            }

            .info-text strong {
              display: block;
              font-size: 16px;
              margin-bottom: 4px;
            }

            .table-container {
              margin-bottom: 32px;
            }

            .section-title {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 16px;
              color: #111827;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            thead {
              background: #f9fafb;
            }

            th {
              text-align: left;
              padding: 12px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              font-weight: 600;
              border-bottom: 2px solid #e5e7eb;
            }

            th:last-child {
              text-align: right;
            }

            td {
              padding: 16px 12px;
              border-bottom: 1px solid #e5e7eb;
              color: #1f2937;
            }

            td:last-child {
              text-align: right;
              font-weight: 600;
            }

            tbody tr:hover {
              background: #f9fafb;
            }

            .item-name {
              font-weight: 600;
              color: #111827;
              margin-bottom: 4px;
            }

            .item-id {
              font-size: 12px;
              color: #6b7280;
            }

            .quantity {
              color: #6b7280;
            }

            .summary {
              margin-left: auto;
              max-width: 400px;
              background: #f9fafb;
              padding: 24px;
              border-radius: 8px;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              font-size: 15px;
            }

            .summary-row.subtotal {
              color: #6b7280;
            }

            .summary-row.discount {
              color: #10B981;
            }

            .summary-row.tax {
              color: #6b7280;
            }

            .summary-row.total {
              border-top: 2px solid #e5e7eb;
              margin-top: 12px;
              padding-top: 16px;
              font-size: 20px;
              font-weight: 700;
              color: #111827;
            }

            .footer {
              background: #f9fafb;
              padding: 32px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }

            .footer-logo {
              font-size: 20px;
              font-weight: 700;
              color: #4f46e5;
              margin-bottom: 8px;
            }

            .footer-links {
              margin-top: 16px;
              margin-bottom: 16px;
            }

            .footer-link {
              color: #4f46e5;
              text-decoration: none;
              margin: 0 12px;
            }

            .footer-link:hover {
              text-decoration: underline;
            }

            .thank-you {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              padding: 24px;
              border-radius: 8px;
              margin-bottom: 32px;
              text-align: center;
            }

            .thank-you h2 {
              font-size: 24px;
              margin-bottom: 8px;
            }

            .thank-you p {
              font-size: 16px;
              opacity: 0.9;
            }

            @media print {
              body {
                background: white;
                padding: 0;
              }
              
              .container {
                box-shadow: none;
              }

              .footer-links {
                display: none;
              }
            }

            @media (max-width: 640px) {
              .info-grid {
                grid-template-columns: 1fr;
                gap: 16px;
              }

              .header {
                padding: 24px 20px;
              }

              .content {
                padding: 20px;
              }

              .header-top {
                flex-direction: column;
                gap: 16px;
              }

              table {
                font-size: 14px;
              }

              th, td {
                padding: 8px;
              }
            }
          `
        }} />
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <div className="header-top">
              <div className="logo">💎 Mercador</div>
              <div className="status-badge">
                <span>{currentStatus.icon}</span>
                <span>{currentStatus.badge}</span>
              </div>
            </div>
            <div className="header-title">Factura de Compra</div>
            <div className="header-subtitle">{currentStatus.title}</div>
          </div>

          {/* Content */}
          <div className="content">
            {/* Thank You Message */}
            {status === 'confirmed' && (
              <div className="thank-you">
                <h2>¡Gracias por tu compra!</h2>
                <p>Tu pedido ha sido procesado exitosamente</p>
              </div>
            )}

            {/* Order & Customer Info */}
            <div className="info-grid">
              <div className="info-section">
                <div className="info-title">Información de la Orden</div>
                <div className="info-text">
                  <strong>Orden #{orderId}</strong>
                </div>
                <div className="info-text">
                  Referencia: {reference}
                </div>
                <div className="info-text">
                  Fecha: {transactionDate || new Date().toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="info-text">
                  Método de pago: {paymentMethod}
                </div>
              </div>

              <div className="info-section">
                <div className="info-title">Información del Cliente</div>
                <div className="info-text">
                  <strong>{customerName}</strong>
                </div>
                {customerEmail && (
                  <div className="info-text">
                    📧 {customerEmail}
                  </div>
                )}
                {customerPhone && (
                  <div className="info-text">
                    📱 {customerPhone}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="table-container">
              <h2 className="section-title">Detalle de Productos</h2>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.id}-${index}`}>
                      <td>
                        <div className="item-name">{item.name}</div>
                        <div className="item-id">ID: {item.id}</div>
                      </td>
                      <td className="quantity">×{item.quantity}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="summary">
              <div className="summary-row subtotal">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculatedSubtotal)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="summary-row discount">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              
              {taxAmount > 0 && (
                <div className="summary-row tax">
                  <span>IVA (19%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              
              <div className="summary-row total">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Additional Info */}
            {status === 'confirmed' && (
              <div style={{ 
                marginTop: '32px', 
                padding: '20px', 
                background: '#eff6ff', 
                borderRadius: '8px',
                borderLeft: '4px solid #3b82f6'
              }}>
                <p style={{ fontSize: '14px', color: '#1e40af', marginBottom: '8px' }}>
                  <strong>📦 Próximos pasos:</strong>
                </p>
                <ul style={{ paddingLeft: '20px', color: '#1e3a8a' }}>
                  <li>Tus claves de producto han sido enviadas a tu perfil</li>
                  <li>Puedes acceder a ellas en cualquier momento desde tu cuenta</li>
                  <li>Si tienes alguna pregunta, contáctanos a soporte@mercador.app</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer">
            <div className="footer-logo">Mercador</div>
            <p>Marketplace de licencias y productos digitales</p>
            <div className="footer-links">
              <a href="https://mercador.app" className="footer-link">Sitio Web</a>
              <a href="https://mercador.app/help" className="footer-link">Ayuda</a>
              <a href="https://mercador.app/terms" className="footer-link">Términos</a>
              <a href="https://mercador.app/privacy" className="footer-link">Privacidad</a>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
              © {new Date().getFullYear()} Mercador. Todos los derechos reservados.
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
              Este es un documento generado automáticamente. Para cualquier consulta,<br />
              contacta a soporte@mercador.app
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
