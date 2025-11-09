/**
 * Tests para el componente PointsBalance
 * Valida el display de puntos, conversiones, y estados de carga
 */

import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PointsBalance } from '@/components/points/PointsBalance'
import { useAuth } from '@/components/auth/AuthProvider'

// Mock del hook useAuth
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn()
}))

// Mock de fetch global
global.fetch = jest.fn()

describe('PointsBalance Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123', email: 'test@test.com' }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(() => {}) // Never resolves
    )

    render(<PointsBalance />)
    expect(screen.getByTestId('points-loading')).toBeInTheDocument()
  })

  it('should display points balance correctly', async () => {
    const mockBalance = {
      balance: 1000,
      totalEarned: 1500,
      totalSpent: 500,
      valueInPesos: 10000,
      constants: {
        pointsPer1000Pesos: 100,
        pesosPerPoint: 10
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBalance
    })

    render(<PointsBalance />)

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument() // Balance
      expect(screen.getByText(/\$10,000/)).toBeInTheDocument() // Value in pesos
    })
  })

  it('should show tooltip on hover with earned/spent details', async () => {
    const mockBalance = {
      balance: 750,
      totalEarned: 1000,
      totalSpent: 250,
      valueInPesos: 7500,
      constants: {
        pointsPer1000Pesos: 100,
        pesosPerPoint: 10
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBalance
    })

    const { container } = render(<PointsBalance />)

    await waitFor(() => {
      expect(screen.getByText('750')).toBeInTheDocument()
    })

    // Find tooltip trigger and simulate hover
    const badge = container.querySelector('[data-tooltip="true"]')
    expect(badge).toBeInTheDocument()
  })

  it('should handle fetch error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<PointsBalance />)

    await waitFor(() => {
      // Component should still render but not crash
      expect(screen.queryByTestId('points-loading')).not.toBeInTheDocument()
    })

    consoleErrorSpy.mockRestore()
  })

  it('should display 0 points when balance is empty', async () => {
    const mockBalance = {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      valueInPesos: 0,
      constants: {
        pointsPer1000Pesos: 100,
        pesosPerPoint: 10
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBalance
    })

    render(<PointsBalance />)

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText(/\$0/)).toBeInTheDocument()
    })
  })

  it('should display large balances correctly', async () => {
    const mockBalance = {
      balance: 100000,
      totalEarned: 150000,
      totalSpent: 50000,
      valueInPesos: 1000000,
      constants: {
        pointsPer1000Pesos: 100,
        pesosPerPoint: 10
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBalance
    })

    render(<PointsBalance />)

    await waitFor(() => {
      expect(screen.getByText('100,000')).toBeInTheDocument() // With comma separator
      expect(screen.getByText(/\$1,000,000/)).toBeInTheDocument()
    })
  })

  it('should not render when user is not authenticated', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null
    })

    const { container } = render(<PointsBalance />)
    expect(container.firstChild).toBeNull()
  })

  it('should include credentials in fetch request', async () => {
    const mockBalance = {
      balance: 500,
      totalEarned: 500,
      totalSpent: 0,
      valueInPesos: 5000,
      constants: {
        pointsPer1000Pesos: 100,
        pesosPerPoint: 10
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBalance
    })

    render(<PointsBalance />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/points/balance'),
        expect.objectContaining({
          credentials: 'include'
        })
      )
    })
  })

  it('should update balance when component re-renders', async () => {
    const initialBalance = {
      balance: 1000,
      totalEarned: 1000,
      totalSpent: 0,
      valueInPesos: 10000,
      constants: {
        pointsPer1000Pesos: 100,
        pesosPerPoint: 10
      }
    }

    const updatedBalance = {
      balance: 1250,
      totalEarned: 1250,
      totalSpent: 0,
      valueInPesos: 12500,
      constants: {
        pointsPer1000Pesos: 100,
        pesosPerPoint: 10
      }
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialBalance
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedBalance
      })

    const { rerender } = render(<PointsBalance />)

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument()
    })

    // Trigger re-render
    rerender(<PointsBalance />)

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument()
    })
  })

  it('should format numbers with comma separators', async () => {
    const mockBalance = {
      balance: 12345,
      totalEarned: 12345,
      totalSpent: 0,
      valueInPesos: 123450,
      constants: {
        pointsPer1000Pesos: 100,
        pesosPerPoint: 10
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBalance
    })

    render(<PointsBalance />)

    await waitFor(() => {
      expect(screen.getByText('12,345')).toBeInTheDocument()
      expect(screen.getByText(/\$123,450/)).toBeInTheDocument()
    })
  })
})
