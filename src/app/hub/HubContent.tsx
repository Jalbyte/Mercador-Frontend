"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export default function HubContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { refreshUser, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      setLoading(true)

      // Obtener token del hash fragment (signup redirect) o query params (login redirect)
      let urlToken = params?.get('access_token') ?? ''
      let refreshToken = params?.get('refresh_token') ?? ''
      let tokenType = ''
      
      // Si no hay token en query params, verificar hash fragment
      if (!urlToken && typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashToken = hashParams.get('access_token')
        const hashRefreshToken = hashParams.get('refresh_token')
        tokenType = hashParams.get('type') || ''
        
        // Auto-login tanto para recovery como para signup
        // Esto permite que el usuario confirme su email desde cualquier dispositivo
        if (hashToken && (tokenType === 'recovery' || tokenType === 'signup')) {
          urlToken = hashToken
          refreshToken = hashRefreshToken || ''
        }
      }
      
      const cookieToken = getCookie('sb_access_token')

      // Si hay token en URL (signup/recovery), primero establecer sesión en el backend
      if (urlToken && !cookieToken) {
        try {
          const sessionResponse = await fetch(`${API_BASE}/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              access_token: urlToken,
              refresh_token: refreshToken
            })
          })

          if (!mounted) return

          if (sessionResponse.ok) {
            // Limpiar el hash de la URL
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, document.title, window.location.pathname)
            }
          } else {
            setError('No se pudo establecer la sesión')
            setTimeout(() => router.push('/'), 1200)
            return
          }
        } catch (err) {
          setError('Error de conexión con el servidor')
          setTimeout(() => router.push('/'), 1200)
          return
        }
      }

      // If no token provided in URL and no cookie present, redirect
      if (!urlToken && !cookieToken) {
        router.push('/')
        return
      }

      // Ahora verificar la sesión usando el contexto de autenticación
      try {
        await refreshUser()
      } catch (err) {
        if (!mounted) return
        setError('Token inválido o caducado')
        setTimeout(() => router.push('/'), 1200)
        return
      }

      if (!mounted) return

      // Notificar al resto de la app que cambió el estado de autenticación
      try {
        window.dispatchEvent(new CustomEvent('auth-changed', { detail: { loggedIn: true } }))
      } catch (e) {
        // Ignore error
      }

      setLoading(false)
    }

    init()

    return () => { 
      mounted = false 
    }
  }, [])

  // Redirigir automáticamente a la raíz después de verificar la sesión
  useEffect(() => {
    if (!loading && !error) {
      const timer = setTimeout(() => {
        router.push('/')
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [loading, error, router])

  if (loading) return <div className="p-8">Verificando sesión...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Hub principal</h1>
      <p className="mt-2">Autenticación verificada. Redirigiendo...</p>
    </div>
  )
}