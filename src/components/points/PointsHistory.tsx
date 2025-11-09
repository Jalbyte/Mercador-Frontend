'use client'

/**
 * Componente de Historial de Puntos
 * 
 * Muestra:
 * - Balance actual con conversión a pesos
 * - Estadísticas (ganados/usados totales)
 * - Historial de transacciones paginado
 * - Filtros por tipo de transacción
 * 
 * @example
 * <PointsHistory />
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Gift, TrendingUp, TrendingDown, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

interface PointsTransaction {
  id: string
  amount: number
  type: 'earned' | 'spent' | 'refund' | 'adjustment'
  description: string
  orderId?: number
  createdAt: string
  valueInPesos: number
}

interface PointsBalance {
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

export function PointsHistory() {
  const { isAuthenticated } = useAuth()
  const [balance, setBalance] = useState<PointsBalance | null>(null)
  const [transactions, setTransactions] = useState<PointsTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const limit = 10

  useEffect(() => {
    if (!isAuthenticated) return

    fetchBalance()
    fetchTransactions()
  }, [isAuthenticated, page, filterType])

  const fetchBalance = async () => {
    try {
      const response = await fetch(`${API_BASE}/points/balance`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setBalance(data)
      }
    } catch (err) {
      console.error('Error fetching balance:', err)
      setError('Error al cargar el balance')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true)
      const offset = (page - 1) * limit
      const response = await fetch(
        `${API_BASE}/points/transactions?limit=${limit}&offset=${offset}`,
        { credentials: 'include' }
      )

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
        setHasMore(data.pagination.hasMore)
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'spent':
        return <TrendingDown className="w-5 h-5 text-blue-600" />
      case 'refund':
        return <RefreshCw className="w-5 h-5 text-yellow-600" />
      case 'adjustment':
        return <Filter className="w-5 h-5 text-gray-600" />
      default:
        return <Gift className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'earned':
        return 'bg-green-100 text-green-800'
      case 'spent':
        return 'bg-blue-100 text-blue-800'
      case 'refund':
        return 'bg-yellow-100 text-yellow-800'
      case 'adjustment':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'earned':
        return 'Ganado'
      case 'spent':
        return 'Usado'
      case 'refund':
        return 'Reembolso'
      case 'adjustment':
        return 'Ajuste'
      default:
        return type
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType)

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (error || !balance) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error || 'No se pudo cargar la información de puntos'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-md p-6 border-2 border-yellow-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Gift className="w-8 h-8 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-yellow-900">Tus Puntos</h2>
            <p className="text-sm text-yellow-700">Sistema de recompensas Mercador</p>
          </div>
        </div>

        {/* Balance principal */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Balance Disponible</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-bold text-yellow-900">
                {balance.balance.toLocaleString('es-CO')}
              </span>
              <span className="text-xl text-yellow-700">pts</span>
            </div>
            <p className="text-lg text-yellow-800 mt-2">
              ≈ ${balance.valueInPesos.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Total Ganado</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {balance.totalEarned.toLocaleString('es-CO')} pts
            </p>
            <p className="text-xs text-green-700 mt-1">
              ${(balance.totalEarned * balance.constants.pesosPerPoint).toLocaleString('es-CO')} COP
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Total Usado</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {balance.totalSpent.toLocaleString('es-CO')} pts
            </p>
            <p className="text-xs text-blue-700 mt-1">
              ${(balance.totalSpent * balance.constants.pesosPerPoint).toLocaleString('es-CO')} COP
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 pt-4 border-t border-yellow-200 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-yellow-600">💰</span>
            <p className="text-yellow-800">
              <strong>{balance.constants.pointsPer1000Pesos} puntos</strong> = <strong>$1,000 COP</strong>
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-yellow-600">🎁</span>
            <p className="text-yellow-800">
              Ganas <strong>1 punto</strong> por cada <strong>${balance.constants.earningDivisor}</strong> gastados
            </p>
          </div>
        </div>
      </div>

      {/* Historial de Transacciones */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Historial de Transacciones</h3>
          
          {/* Filtro */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">Todas</option>
            <option value="earned">Ganados</option>
            <option value="spent">Usados</option>
            <option value="refund">Reembolsos</option>
            <option value="adjustment">Ajustes</option>
          </select>
        </div>

        {loadingTransactions ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando transacciones...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No hay transacciones para mostrar</p>
          </div>
        ) : (
          <>
            {/* Tabla de transacciones */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Descripción</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Puntos</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                            {getTypeLabel(transaction.type)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {transaction.description}
                        {transaction.orderId && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Orden #{transaction.orderId})
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('es-CO')} pts
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        ${transaction.valueInPesos.toLocaleString('es-CO')} COP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              
              <span className="text-sm text-gray-600">
                Página {page}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
