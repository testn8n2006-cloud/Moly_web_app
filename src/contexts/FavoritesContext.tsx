import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Favorite } from '@/lib/types'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

interface FavoritesContextType {
  favorites: Favorite[]
  count: number
  isFavorite: (productId: string) => boolean
  toggleFavorite: (productId: string) => Promise<void>
  loading: boolean
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(false)

  const fetchFavorites = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setFavorites(data || [])
    } catch (err) {
      console.error('Favorites fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchFavorites()
    else setFavorites([])
  }, [user, fetchFavorites])

  const isFavorite = (productId: string) =>
    favorites.some(f => f.product_id === productId)

  async function toggleFavorite(productId: string) {
    if (!user) return
    const already = isFavorite(productId)
    // Optimistic update
    if (already) {
      setFavorites(prev => prev.filter(f => f.product_id !== productId))
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
      if (error) {
        toast.error('حدث خطأ')
        await fetchFavorites()
      }
    } else {
      setFavorites(prev => [...prev, { user_id: user.id, product_id: productId, created_at: new Date().toISOString() }])
      const { error } = await supabase
        .from('favorites')
        .insert({ product_id: productId })
      if (error) {
        toast.error('حدث خطأ')
        await fetchFavorites()
      } else {
        toast.success('أُضيف إلى المفضلة ♥')
      }
    }
  }

  return (
    <FavoritesContext.Provider value={{ favorites, count: favorites.length, isFavorite, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
