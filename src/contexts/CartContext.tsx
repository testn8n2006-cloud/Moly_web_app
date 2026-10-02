import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { CartItemWithProduct } from '@/lib/types'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

interface CartContextType {
  items: CartItemWithProduct[]
  count: number
  total: number
  loading: boolean
  addItem: (productId: string, size: string | null, color: string | null, quantity?: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  refetch: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItemWithProduct[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`*, product:products(*)`)
        .order('created_at', { ascending: true })

      if (error) throw error
      setItems((data as unknown as CartItemWithProduct[]) || [])
    } catch (err) {
      console.error('Cart fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchCart()
    else setItems([])
  }, [user, fetchCart])

  async function addItem(productId: string, size: string | null, color: string | null, quantity = 1) {
    if (!user) return
    // Optimistic update handled via refetch
    const { error } = await supabase
      .from('cart_items')
      .upsert(
        { product_id: productId, size, color, quantity, user_id: user.id },
        { onConflict: 'user_id,product_id,size,color' }
      )
    if (error) {
      toast.error('حدث خطأ في إضافة المنتج')
      return
    }
    await fetchCart()
    toast.success('تمت الإضافة إلى السلة ✓')
  }

  async function removeItem(itemId: string) {
    setItems(prev => prev.filter(i => i.id !== itemId))
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId)
    if (error) {
      toast.error('حدث خطأ')
      await fetchCart()
    }
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1 || quantity > 20) return
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i))
    const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId)
    if (error) {
      toast.error('حدث خطأ')
      await fetchCart()
    }
  }

  async function clearCart() {
    if (!user) return
    setItems([])
    await supabase.from('cart_items').delete().eq('user_id', user.id)
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => {
    const price = i.product?.sale_price ?? i.product?.price ?? 0
    return sum + price * i.quantity
  }, 0)

  return (
    <CartContext.Provider value={{ items, count, total, loading, addItem, removeItem, updateQuantity, clearCart, refetch: fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
