'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface CartAddon {
  groupId: string
  groupName: string
  optionId: string
  optionName: string
  price: number
}

export interface CartItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes?: string
  addons: CartAddon[]
  unitPrice: number // price + addons
  totalPrice: number // unitPrice * quantity
}

interface CartContextType {
  items: CartItem[]
  restaurantId: string
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children, restaurantId }: { children: React.ReactNode; restaurantId: string }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    const id = `${item.menuItemId}-${Date.now()}`
    setItems((prev) => [...prev, { ...item, id }])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, quantity, totalPrice: i.unitPrice * quantity }
            : i
        )
      )
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0)

  return (
    <CartContext.Provider
      value={{ items, restaurantId, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
