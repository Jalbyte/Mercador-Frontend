/**
 * Página de factura/invoice detallada
 * 
 * Esta página muestra el detalle completo de la compra incluyendo:
 * - Información del cliente
 * - Lista de productos con precios
 * - Subtotal, impuestos y total
 * - Información de la transacción
 * 
 * Se renderiza para convertirse a PDF adjunto en el email
 * 
 * URL: /email/invoice?orderId=123&reference=ORDER-123&...
 * 
 * @example
 * // Ver en navegador
 * http://localhost:3000/email/invoice?orderId=123&reference=ORDER-123&customerName=Juan&customerEmail=juan@example.com&items=[...]
 * 
 * // Puppeteer lo convierte a PDF
 * puppeteer.goto('http://localhost:3000/email/invoice?orderId=123&...')
 */

import React from 'react'

interface InvoiceItem {
  product_id: number
  name: string
  quantity: number
  price: number
}

interface PageProps {
  searchParams: {
    orderId?: string
    reference?: string
    customerName?: string
    customerEmail?: string
    customerPhone?: string
    items?: string // JSON stringified array
    subtotal?: string
    tax?: string
    total?: string
    paymentMethod?: string
    transactionId?: string
    date?: string
    status?: string
  }
}

export default function InvoicePage({ searchParams }: PageProps) {
  const {
    orderId = 'N/A',
    reference = 'N/A',
    customerName = 'Cliente',
    customerEmail,
    customerPhone,
    items: itemsJson,
    subtotal: subtotalStr,
    tax: taxStr,
    total: totalStr,
    paymentMethod = 'Wompi',
    transactionId,
    date,
    status = 'paid'
  } = searchParams

  // Parse items
  let items: InvoiceItem[] = []
  if (itemsJson) {
    try {
      items = JSON.parse(itemsJson)
    } catch (e) {
      console.error('Error parsing items:', e)
    }
  }

  const subtotal = parseFloat(subtotalStr || '0')
  const tax = parseFloat(taxStr || '0')
  const total = parseFloat(totalStr || '0')
  const invoiceDate = date ? new Date(date) : new Date()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`Factura ${reference}`}</title>
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
              padding: 40px;
            }

            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 1px solid #e0e0e0;
            }

            .invoice-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }

            .invoice-logo {
              font-size: 32px;
              font-weight: 700;
              letter-spacing: -1px;
            }

            .invoice-title {
              text-align: right;
            }

            .invoice-title h1 {
              font-size: 36px;
              font-weight: 300;
              margin-bottom: 8px;
            }

            .invoice-title .invoice-number {
              font-size: 14px;
              opacity: 0.9;
            }

            .invoice-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              padding: 40px;
              border-bottom: 2px solid #f0f0f0;
            }

            .info-section h3 {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              color: #999;
              margin-bottom: 12px;
              letter-spacing: 0.5px;
            }

            .info-section p {
              font-size: 14px;
              color: #333;
              margin-bottom: 4px;
            }

            .info-section .highlight {
              font-weight: 600;
              color: #667eea;
            }

            .invoice-items {
              padding: 0 40px;
            }

            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }

            .items-table thead {
              background: #f8f9fa;
            }

            .items-table th {
              text-align: left;
              padding: 16px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              color: #666;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #e0e0e0;
            }

            .items-table th:last-child,
            .items-table td:last-child {
              text-align: right;
            }

            .items-table td {
              padding: 16px;
              border-bottom: 1px solid #f0f0f0;
              font-size: 14px;
            }

            .items-table tbody tr:hover {
              background: #f8f9fa;
            }

            .product-name {
              font-weight: 500;
              color: #333;
            }

            .product-id {
              font-size: 12px;
              color: #999;
              margin-top: 2px;
            }

            .invoice-totals {
              padding: 20px 40px 40px;
              display: flex;
              justify-content: flex-end;
            }

            .totals-table {
              width: 300px;
            }

            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              font-size: 14px;
            }

            .totals-row.subtotal,
            .totals-row.tax {
              color: #666;
              border-bottom: 1px solid #f0f0f0;
            }

            .totals-row.total {
              font-size: 20px;
              font-weight: 700;
              color: #667eea;
              padding-top: 16px;
              border-top: 2px solid #667eea;
            }

            .invoice-footer {
              background: #f8f9fa;
              padding: 30px 40px;
              border-top: 1px solid #e0e0e0;
            }

            .footer-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 20px;
            }

            .footer-section h4 {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              color: #666;
              margin-bottom: 8px;
              letter-spacing: 0.5px;
            }

            .footer-section p {
              font-size: 13px;
              color: #666;
              line-height: 1.6;
            }

            .status-badge {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .status-paid {
              background: #d1fae5;
              color: #065f46;
            }

            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }

            .thank-you {
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              font-size: 14px;
              color: #666;
            }

            .thank-you strong {
              color: #667eea;
            }

            @media print {
              body {
                padding: 0;
              }
              
              .invoice-container {
                border: none;
              }
            }

            @page {
              margin: 0;
              size: A4;
            }
          `
        }} />
      </head>
      <body>
        <div className="invoice-container">
          {/* Header */}
          <div className="invoice-header">
            <div className="invoice-logo">Mercador</div>
            <div className="invoice-title">
              <h1>FACTURA</h1>
              <div className="invoice-number">#{reference}</div>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="invoice-info">
            {/* Customer Info */}
            <div className="info-section">
              <h3>Facturado a</h3>
              <p className="highlight">{customerName}</p>
              {customerEmail && <p>{customerEmail}</p>}
              {customerPhone && <p>{customerPhone}</p>}
            </div>

            {/* Invoice Details */}
            <div className="info-section">
              <h3>Detalles de la Factura</h3>
              <p><strong>Orden:</strong> #{orderId}</p>
              <p><strong>Fecha:</strong> {invoiceDate.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p>
                <strong>Estado:</strong>{' '}
                <span className={`status-badge status-${status}`}>
                  {status === 'paid' ? 'Pagado' : 'Pendiente'}
                </span>
              </p>
              {transactionId && (
                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  ID Transacción: {transactionId}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="invoice-items">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Cantidad</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Precio Unit.</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="product-name">{item.name}</div>
                      <div className="product-id">ID: {item.product_id}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="invoice-totals">
            <div className="totals-table">
              <div className="totals-row subtotal">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="totals-row tax">
                  <span>IVA (19%):</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              )}
              <div className="totals-row total">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="invoice-footer">
            <div className="footer-grid">
              <div className="footer-section">
                <h4>Método de Pago</h4>
                <p>{paymentMethod}</p>
                {transactionId && (
                  <p style={{ fontSize: '11px', marginTop: '4px' }}>
                    Ref: {transactionId}
                  </p>
                )}
              </div>
              <div className="footer-section">
                <h4>Contacto</h4>
                <p>Email: soporte@mercador.app</p>
                <p>Web: www.mercador.app</p>
              </div>
            </div>

            <div className="thank-you">
              <p>¡Gracias por tu compra en <strong>Mercador</strong>!</p>
              <p style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
                Tus claves de licencia se encuentran adjuntas en el correo electrónico.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
