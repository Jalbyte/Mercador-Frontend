"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3010` : '')

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export default function HubContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function verifyViaCookie() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include'
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

      // Prefer token in query (from login redirect), fallback to cookie
      const urlToken = params?.get('access_token') ?? ''
      const cookieToken = getCookie('sb_access_token')

      // If no token provided in URL and no cookie present, redirect
      if (!urlToken && !cookieToken) {
        router.push('/')
        return
      }

      // If urlToken present we still call verify via cookie (server should set cookie on redirect)
      const result = await verifyViaCookie()
      if (!mounted) return

      if (!result.ok) {
        setError('Token inválido o caducado')
        setTimeout(() => router.push('/'), 1200)
        return
      }

      // If token came from URL we expect the server to set the cookie and the redirect to /hub
      if (urlToken) {
        try {
          // attempt to set a non-httpOnly cookie client-side if server didn't, fallback
          if (!cookieToken && typeof document !== 'undefined' && urlToken) {
            document.cookie = `sb_access_token=${encodeURIComponent(urlToken)}; path=/;`
          }
        } catch (e) {}
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