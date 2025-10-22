/**
 * Tests for useCart hook
 */
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '@/hooks/use-cart'
import { ReactNode } from 'react'

// Mock AuthProvider
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}))

// Mock fetch
global.fetch = jest.fn()

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
)

describe('useCart Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
  })

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const product = {
      id: '1',
      name: 'Test Product',
      price: 50000,
      image: '/test.jpg',
    }

    act(() => {
      result.current.addItem(product)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({
      ...product,
      quantity: 1,
    })
    expect(result.current.totalItems).toBe(1)
  })

  it('should update quantity when adding existing item', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const product = {
      id: '1',
      name: 'Test Product',
      price: 50000,
      image: '/test.jpg',
    }

    act(() => {
      result.current.addItem(product)
      result.current.addItem(product)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
    expect(result.current.totalItems).toBe(2)
  })

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const product = {
      id: '1',
      name: 'Test Product',
      price: 50000,
      image: '/test.jpg',
    }

    act(() => {
      result.current.addItem(product)
      result.current.removeItem('1')
    })

    expect(result.current.items).toHaveLength(0)
    expect(result.current.totalItems).toBe(0)
  })

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const product = {
      id: '1',
      name: 'Test Product',
      price: 50000,
      image: '/test.jpg',
    }

    act(() => {
      result.current.addItem(product)
      result.current.updateQuantity('1', 5)
    })

    expect(result.current.items[0].quantity).toBe(5)
    expect(result.current.totalItems).toBe(5)
  })

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const product1 = {
      id: '1',
      name: 'Product 1',
      price: 50000,
      image: '/test1.jpg',
    }

    const product2 = {
      id: '2',
      name: 'Product 2',
      price: 30000,
      image: '/test2.jpg',
    }

    act(() => {
      result.current.addItem(product1)
      result.current.addItem(product2)
      result.current.clearCart()
    })

    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
  })

  it('should persist cart to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    const product = {
      id: '1',
      name: 'Test Product',
      price: 50000,
      image: '/test.jpg',
    }

    act(() => {
      result.current.addItem(product)
    })

    const stored = localStorage.getItem('cart')
    expect(stored).toBeTruthy()
    
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe('1')
    expect(parsed[0].quantity).toBe(1)
  })

  it('should load cart from localStorage on init', () => {
    const cartData = [
      {
        id: '1',
        name: 'Stored Product',
        price: 50000,
        quantity: 3,
        image: '/stored.jpg',
      },
    ]

    localStorage.setItem('cart', JSON.stringify(cartData))

    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].name).toBe('Stored Product')
    expect(result.current.totalItems).toBe(3)
  })
})
