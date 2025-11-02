/**
 * Página de template de email para estado de orden
 * 
 * Esta página se renderiza tanto en el navegador como por Puppeteer
 * para generar PDFs de reportes de compra.
 * 
 * URL: /email/order-status?reference=ORDER-123&status=confirmed&assigned={"101":2}
 * 
 * @example
 * // Ver en navegador
 * http://localhost:3000/email/order-status?reference=ORDER-123&status=confirmed
 * 
 * // Puppeteer lo convierte a PDF
 * puppeteer.goto('http://localhost:3000/email/order-status?reference=ORDER-123')
 */

import React from 'react'

interface PageProps {
  searchParams: {
    reference?: string
    status?: string
    assigned?: string
    orderId?: string
    customerEmail?: string
    totalAmount?: string
  }
}

export default function OrderStatusEmailPage({ searchParams }: PageProps) {
  const {
    reference = 'UNKNOWN',
    status = 'pending',
    assigned,
    orderId,
    customerEmail,
    totalAmount
  } = searchParams

  // Parse assigned keys if provided
  let assignedKeys: Record<string, number> = {}
  if (assigned) {
    try {
      assignedKeys = JSON.parse(assigned)
    } catch (e) {
      console.error('Error parsing assigned keys:', e)
    }
  }

  // Status display
  const statusConfig = {
    confirmed: {
      color: '#10B981',
      icon: '✅',
      title: 'Pago Confirmado',
      message: 'Tu pago ha sido procesado exitosamente.'
    },
    pending: {
      color: '#F59E0B',
      icon: '⏳',
      title: 'Pago Pendiente',
      message: 'Estamos procesando tu pago.'
    },
    cancelled: {
      color: '#EF4444',
      icon: '❌',
      title: 'Pago Rechazado',
      message: 'Tu pago fue rechazado. Por favor intenta nuevamente.'
    },
    error: {
      color: '#EF4444',
      icon: '⚠️',
      title: 'Error en el Pago',
      message: 'Ocurrió un error al procesar tu pago.'
    }
  }

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Orden {reference} - {currentStatus.title}</title>
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
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }

            .header {
              background: ${currentStatus.color};
              color: white;
              padding: 32px 24px;
              text-align: center;
            }

            .header-icon {
              font-size: 48px;
              margin-bottom: 16px;
            }

            .header h1 {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 8px;
            }

            .header p {
              font-size: 16px;
              opacity: 0.9;
            }

            .content {
              padding: 32px 24px;
            }

            .section {
              margin-bottom: 24px;
            }

            .section-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 12px;
              color: #111827;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e5e7eb;
            }

            .info-row:last-child {
              border-bottom: none;
            }

            .info-label {
              color: #6b7280;
              font-weight: 500;
            }

            .info-value {
              color: #111827;
              font-weight: 600;
            }

            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 14px;
              font-weight: 600;
              background: ${currentStatus.color}20;
              color: ${currentStatus.color};
            }

            .keys-list {
              background: #f9fafb;
              border-radius: 8px;
              padding: 16px;
            }

            .key-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }

            .key-item:last-child {
              border-bottom: none;
            }

            .footer {
              background: #f9fafb;
              padding: 24px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }

            .footer-links {
              margin-top: 16px;
            }

            .footer-link {
              color: #4f46e5;
              text-decoration: none;
              margin: 0 8px;
            }

            .footer-link:hover {
              text-decoration: underline;
            }

            .logo {
              font-size: 20px;
              font-weight: 700;
              color: #4f46e5;
              margin-bottom: 8px;
            }

            @media print {
              body {
                background: white;
                padding: 0;
              }
              
              .container {
                box-shadow: none;
              }
            }
          `
        }} />
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <div className="header-icon">{currentStatus.icon}</div>
            <h1>{currentStatus.title}</h1>
            <p>{currentStatus.message}</p>
          </div>

          {/* Content */}
          <div className="content">
            {/* Order Info */}
            <div className="section">
              <h2 className="section-title">Información de la Orden</h2>
              <div className="info-row">
                <span className="info-label">Referencia:</span>
                <span className="info-value">{reference}</span>
              </div>
              {orderId && (
                <div className="info-row">
                  <span className="info-label">ID de Orden:</span>
                  <span className="info-value">#{orderId}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Estado:</span>
                <span className="badge">{status}</span>
              </div>
              {totalAmount && (
                <div className="info-row">
                  <span className="info-label">Total:</span>
                  <span className="info-value">${totalAmount} COP</span>
                </div>
              )}
              {customerEmail && (
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{customerEmail}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Fecha:</span>
                <span className="info-value">
                  {new Date().toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Assigned Keys (if any) */}
            {status === 'confirmed' && Object.keys(assignedKeys).length > 0 && (
              <div className="section">
                <h2 className="section-title">🔑 Claves Asignadas</h2>
                <div className="keys-list">
                  {Object.entries(assignedKeys).map(([productId, count]) => (
                    <div key={productId} className="key-item">
                      <span>Producto #{productId}</span>
                      <span className="info-value">{count} clave(s)</span>
                    </div>
                  ))}
                  <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
                    Las claves han sido enviadas a tu perfil. Puedes verlas en tu cuenta.
                  </p>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="section">
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                {status === 'confirmed' && (
                  <>
                    ¡Gracias por tu compra! Tu orden ha sido procesada exitosamente.
                    Puedes ver los detalles de tu orden en tu perfil.
                  </>
                )}
                {status === 'pending' && (
                  <>
                    Tu pago está siendo procesado. Te notificaremos cuando se complete.
                  </>
                )}
                {(status === 'cancelled' || status === 'error') && (
                  <>
                    Si necesitas ayuda o quieres intentar nuevamente, contáctanos.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div className="logo">Mercador</div>
            <p>Marketplace de licencias y productos digitales</p>
            <div className="footer-links">
              <a href="https://mercador.app" className="footer-link">Sitio Web</a>
              <a href="https://mercador.app/help" className="footer-link">Ayuda</a>
              <a href="https://mercador.app/terms" className="footer-link">Términos</a>
            </div>
            <p style={{ marginTop: '16px', fontSize: '12px' }}>
              © {new Date().getFullYear()} Mercador. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
