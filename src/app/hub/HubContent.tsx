"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3010` : '')

export default function HubContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function verifyToken(token: string) {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!mounted) return { ok: false, body: null }
        if (!res.ok) return { ok: false, body: await res.text().catch(() => null) }
        const j = await res.json().catch(() => null)
        return { ok: true, body: j }
      } catch (err) {
        return { ok: false, body: String(err) }
      }
    }

    async function init() {
      setLoading(true)

      // Prefer token in query (from login redirect), fallback to stored token
      const urlToken = params?.get('token') ?? ''
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      let tokenToUse = urlToken || storedToken || ''

      if (!tokenToUse) {
        router.push('/')
        return
      }

      const result = await verifyToken(tokenToUse)
      if (!mounted) return

      if (!result.ok) {
        // If urlToken failed but we have a different stored token, try stored one
        if (urlToken && storedToken && storedToken !== urlToken) {
          const r2 = await verifyToken(storedToken)
          if (r2.ok) {
            setLoading(false)
            return
          }
        }

        setError('Token inválido o caducado')
        setTimeout(() => router.push('/'), 1200)
        return
      }

      // If token came from URL, save it to localStorage and clean URL
      if (urlToken) {
        try { localStorage.setItem('access_token', urlToken) } catch (e) {}
        // Remove token from URL to avoid leaking it; use replace to not create history entry
        router.replace('/hub')
      }

      setLoading(false)
    }

    init()

    return () => { mounted = false }
  }, [])

  if (loading) return <div className="p-8">Verificando sesión...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Hub principal</h1>
      <p className="mt-2">Autenticación verificada. Bienvenido.</p>
    </div>
  )
}