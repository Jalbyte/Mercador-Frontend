'use client'

/**
 * Componente de Balance de Puntos
 * 
 * Muestra el balance actual de puntos del usuario con:
 * - Cantidad de puntos disponibles
 * - Conversión a pesos (100pts = $1,000)
 * - Animaciones al cambiar el balance
 * - Tooltip con información detallada
 * - Link al perfil para ver historial
 * 
 * @example
 * <PointsBalance />
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Gift, Sparkles, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface PointsBalanceData {
  balance: number
  totalEarned: number
  totalSpent: number
  valueInPesos: number
  constants: {
    pointsPer1000Pesos: number
    pesosPerPoint: number
    earningDivisor: number
  }
}

export function PointsBalance() {
  const { user, isAuthenticated } = useAuth()
  const [pointsData, setPointsData] = useState<PointsBalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [animateBalance, setAnimateBalance] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    fetchPointsBalance()
  }, [isAuthenticated])

  const fetchPointsBalance = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/points/balance`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al obtener balance de puntos')
      }

      const data = await response.json()
      
      // Si el balance cambió, animar
      if (pointsData && pointsData.balance !== data.balance) {
        setAnimateBalance(true)
        setTimeout(() => setAnimateBalance(false), 1000)
      }

      setPointsData(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching points balance:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // No mostrar si no hay sesión
  if (!isAuthenticated) {
    return null
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 animate-pulse">
        <Gift className="w-4 h-4 text-yellow-600" />
        <div className="h-4 w-20 bg-yellow-200 rounded"></div>
      </div>
    )
  }

  // Estado de error
  if (error || !pointsData) {
    return null // Fallar silenciosamente
  }

  const { balance, valueInPesos, totalEarned, totalSpent, constants } = pointsData

  return (
    <div className="relative">
      <Link 
        href="/perfil?tab=points"
        className="block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className={`
          flex items-center gap-2 px-3 py-2 
          bg-gradient-to-r from-yellow-50 to-amber-50 
          hover:from-yellow-100 hover:to-amber-100
          rounded-lg border border-yellow-200 
          hover:border-yellow-300
          transition-all duration-300
          cursor-pointer
          group
          ${animateBalance ? 'scale-110 shadow-lg' : ''}
        `}>
          <Gift className="w-4 h-4 text-yellow-600 group-hover:text-yellow-700 transition-colors" />
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className={`
                text-sm font-semibold text-yellow-900
                ${animateBalance ? 'animate-pulse' : ''}
              `}>
                {balance.toLocaleString('es-CO')}
              </span>
              <span className="text-xs text-yellow-700">pts</span>
              {animateBalance && (
                <Sparkles className="w-3 h-3 text-yellow-600 animate-spin" />
              )}
            </div>
            <span className="text-xs text-yellow-600">
              ${valueInPesos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </Link>

      {/* Tooltip con información detallada */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            <div className="p-2 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg">
              <Gift className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Tus Puntos
              </h3>
              <p className="text-xs text-gray-500">
                Sistema de recompensas
              </p>
            </div>
          </div>

          {/* Balance actual */}
          <div className="mb-3 p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-yellow-700 font-medium">
                Balance Disponible
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-yellow-900">
                  {balance.toLocaleString('es-CO')}
                </span>
                <span className="text-sm text-yellow-700">pts</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-yellow-600">
                Equivalente a
              </span>
              <span className="text-lg font-semibold text-yellow-800">
                ${valueInPesos.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP
              </span>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-700 font-medium">
                  Ganados
                </span>
              </div>
              <span className="text-sm font-semibold text-green-900">
                {totalEarned.toLocaleString('es-CO')} pts
              </span>
            </div>

            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-700 font-medium">
                  Usados
                </span>
              </div>
              <span className="text-sm font-semibold text-blue-900">
                {totalSpent.toLocaleString('es-CO')} pts
              </span>
            </div>
          </div>

          {/* Información */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 flex-shrink-0">💰</span>
              <p className="text-xs text-gray-600">
                <strong>{constants.pointsPer1000Pesos} pts</strong> = <strong>$1,000 COP</strong>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 flex-shrink-0">🎁</span>
              <p className="text-xs text-gray-600">
                Ganas <strong>1 punto</strong> por cada <strong>${constants.earningDivisor}</strong> gastados
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 flex-shrink-0">💡</span>
              <p className="text-xs text-gray-600">
                Usa tus puntos en <strong>cualquier compra</strong>
              </p>
            </div>
          </div>

          {/* Link al perfil */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Ver historial completo →
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
