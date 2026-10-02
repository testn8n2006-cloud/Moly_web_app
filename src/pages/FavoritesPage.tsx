import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { ProductCard } from '@/components/products/ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { ProductGridSkeleton } from '@/components/ui/SkeletonLoader'
import type { Product } from '@/lib/types'

export default function FavoritesPage() {
  const { t } = useLanguage()
  const { favorites, loading } = useFavorites()

  const { data: products, isLoading } = useQuery({
    queryKey: ['favorites-products', favorites.map(f => f.product_id).join(',')],
    queryFn: async () => {
      if (favorites.length === 0) return []
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', favorites.map(f => f.product_id))
      if (error) throw error
      return data as Product[]
    },
    enabled: !loading,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-arabic">{t('قائمة المفضلة', 'Favorites')}</h1>
        <p className="text-gray-500 mt-1 font-arabic">
          {favorites.length > 0
            ? t(`${favorites.length} منتج مفضل`, `${favorites.length} favorite items`)
            : t('لا توجد منتجات مفضلة بعد', 'No favorites yet')}
        </p>
      </div>

      {(isLoading || loading) ? (
        <ProductGridSkeleton count={8} />
      ) : products?.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t('لا توجد منتجات مفضلة', 'No Favorites Yet')}
          description={t('ابدئي بإضافة منتجات إلى مفضلتك بالضغط على أيقونة القلب', 'Start adding products to your favorites by clicking the heart icon')}
          action={
            <div className="flex gap-3">
              <Link to="/women"><Button className="font-arabic">{t('تصفحي مجموعة النساء', "Women's Collection")}</Button></Link>
              <Link to="/kids"><Button variant="outline" className="font-arabic">{t('تصفحي مجموعة الأطفال', "Kids' Collection")}</Button></Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products?.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
