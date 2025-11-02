import { renderToString } from 'react-dom/server'
import React from 'react'

export default async function handler(req: any, res: any) {
  const url = new URL(req.url)
  const reference = url.searchParams.get('reference') || 'UNKNOWN'
  const status = url.searchParams.get('status') || 'pending'

  // Very simple HTML template. Frontend team should replace with real components.
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Orden ${reference} - ${status}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111 }
          .card { border: 1px solid #eee; padding: 20px; border-radius: 8px }
          .muted { color: #666 }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Estado de la orden ${reference}</h1>
          <p class="muted">Estado: <strong>${status}</strong></p>
          <p>Gracias por comprar en Mercador. Si necesitas ayuda, responde este correo.</p>
        </div>
      </body>
    </html>
  `

  // In Next.js route handlers you return Response; here we emulate simple behavior
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
}
