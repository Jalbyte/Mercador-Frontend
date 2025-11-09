/**
 * Página de template de email para notificación de orden
 * 
 * Esta es la página principal del email que se envía al usuario.
 * Muestra el estado del pago y avisa sobre los archivos adjuntos.
 * 
 * Los detalles de la factura se encuentran en /email/invoice (PDF adjunto)
 * 
 * URL: /email/order-status?reference=ORDER-123&status=confirmed&keysCount=3
 * 
 * @example
 * // Ver en navegador
 * http://localhost:3000/email/order-status?reference=ORDER-123&status=confirmed&keysCount=3
 */

import React from 'react'

interface PageProps {
  searchParams: {
    reference?: string
    status?: string
    keysCount?: string // Total number of keys assigned
    orderId?: string
    customerName?: string
  }
}

export default function OrderStatusEmailPage({ searchParams }: PageProps) {
  const {
    reference = 'UNKNOWN',
    status = 'pending',
    keysCount: keysCountStr,
    orderId,
    customerName = 'Cliente'
  } = searchParams

  const keysCount = parseInt(keysCountStr || '0', 10)

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
        <title>{`Orden ${reference} - ${currentStatus.title}`}</title>
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
      <body suppressHydrationWarning={true}>
        <div className="container">
          {/* Header */}
          <div className="header">
            <div className="header-icon">{currentStatus.icon}</div>
            <h1>{currentStatus.title}</h1>
            <p>{currentStatus.message}</p>
          </div>

          {/* Content */}
          <div className="content">
            {/* Greeting */}
            <div className="section">
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>
                Hola {customerName},
              </h2>
              <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.7' }}>
                {status === 'confirmed' && (
                  <>
                    ¡Gracias por tu compra! Tu orden <strong>{reference}</strong> ha sido procesada exitosamente.
                  </>
                )}
                {status === 'pending' && (
                  <>
                    Tu orden <strong>{reference}</strong> está siendo procesada. Te notificaremos cuando se complete.
                  </>
                )}
                {(status === 'cancelled' || status === 'error') && (
                  <>
                    Tu orden <strong>{reference}</strong> no pudo ser procesada. Si necesitas ayuda, contáctanos.
                  </>
                )}
              </p>
            </div>

            {/* Attachments Info */}
            {status === 'confirmed' && keysCount > 0 && (
              <div className="section">
                <h2 className="section-title">📎 Archivos Adjuntos</h2>
                <div style={{ 
                  background: '#f0f9ff', 
                  border: '2px solid #0ea5e9', 
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #bae6fd'
                  }}>
                    <div style={{ fontSize: '32px' }}>📄</div>
                    <div>
                      <p style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#0c4a6e',
                        marginBottom: '4px'
                      }}>
                        Factura Detallada (PDF)
                      </p>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Encuentra el detalle completo de tu compra en el archivo <strong>factura-{orderId}.pdf</strong>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ fontSize: '32px' }}>�</div>
                    <div>
                      <p style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#0c4a6e',
                        marginBottom: '4px'
                      }}>
                        Claves de Licencia (TXT)
                      </p>
                      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                        Tus <strong>{keysCount} clave(s)</strong> de licencia están en el archivo <strong>claves-orden-{orderId}.txt</strong>
                      </p>
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#0369a1',
                        background: '#e0f2fe',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}>
                        💡 <strong>Importante:</strong> Cada clave incluye su ID único para validación: <code style={{ 
                          background: '#0c4a6e', 
                          color: '#e0f2fe', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }}>[ID: XXX]</code>
                      </p>
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#0369a1',
                        background: '#e0f2fe',
                        padding: '8px 12px',
                        borderRadius: '6px'
                      }}>
                        💾 Tip: Guarda este archivo en un lugar seguro. No puedes consultar tus claves en tu perfil.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Call to Action */}
            {status === 'confirmed' && (
              <div className="section" style={{ textAlign: 'center', paddingTop: '16px' }}>
                <a 
                  href="https://mercador.app/profile" 
                  style={{
                    display: 'inline-block',
                    padding: '12px 32px',
                    background: '#4f46e5',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '15px'
                  }}
                >
                  Ver Mi Perfil
                </a>
                <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '12px' }}>
                  Accede a todas tus compras y claves
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="footer">
            <div className="logo">Mercador</div>
            <p>Marketplace de licencias y productos digitales</p>
            <div className="footer-links">
              <a href="https://mercador.app" className="footer-link">Sitio Web</a>
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
