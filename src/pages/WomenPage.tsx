import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import type { Product } from '@/lib/types'
import { ShoppingBag } from 'lucide-react'

const WOMEN_CATEGORY_ID = '00000000-0000-0000-0000-000000000001'

export default function WomenPage() {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('newest')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const PER_PAGE = 12

  const { data: categoryData } = useQuery({
    queryKey: ['category-slug-women'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id').eq('slug', 'women').maybeSingle()
      return data?.id || WOMEN_CATEGORY_ID
    },
    staleTime: 1000 * 60 * 30,
  })
  const categoryId = categoryData || WOMEN_CATEGORY_ID

  const { data: types } = useQuery({
    queryKey: ['product-types', categoryId],
    queryFn: async () => {
      const { data } = await supabase.from('product_types').select('*').eq('category_id', categoryId).order('sort_order')
      return data || []
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['products-women', categoryId, search, selectedType, selectedSizes, sortBy, minPrice, maxPrice, page],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('category_id', categoryId)
        .eq('is_visible', true)

      if (search) query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%`)
      if (selectedType) query = query.eq('type_id', selectedType)
      if (selectedSizes.length > 0) query = query.overlaps('sizes', selectedSizes)
      if (minPrice) query = query.gte('price', parseFloat(minPrice))
      if (maxPrice) query = query.lte('price', parseFloat(maxPrice))

      switch (sortBy) {
        case 'price_asc': query = query.order('price', { ascending: true }); break
        case 'price_desc': query = query.order('price', { ascending: false }); break
        case 'name_ar': query = query.order('name_ar', { ascending: true }); break
        default: query = query.order('created_at', { ascending: false })
      }

      query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
      const { data, error, count } = await query
      if (error) throw error
      return { products: data as Product[], total: count || 0 }
    },
    staleTime: 1000 * 60 * 2,
  })

  const totalPages = Math.ceil((data?.total || 0) / PER_PAGE)

  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  function toggleSize(size: string) {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])
    setPage(1)
  }

  function clearFilters() {
    setSearch(''); setSelectedType(''); setSelectedSizes([]); setSortBy('newest'); setMinPrice(''); setMaxPrice(''); setPage(1)
  }

  const hasFilters = search || selectedType || selectedSizes.length > 0 || minPrice || maxPrice

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Luxury Header Banner */}
      <div className="mb-6 bg-gradient-to-r from-royal via-royal-dark to-[#0f172a] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs font-bold text-amber-300 bg-white/10 px-3 py-1 rounded-full font-arabic border border-white/20 inline-block mb-2">
            ✨ {t('تشكيلة الأتيليه الحصرية', 'Exclusive Atelier Collection')}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-arabic">
            {t('أزياء نسائية راقية', "Women's Haute Couture")}
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1.5 font-arabic max-w-xl">
            {t(
              'فساتين سهرة، عبايات فخمة، وأطقم خروج مصممة بأجود الخامات مع حق المعاينة قبل الاستلام.',
              'Evening dresses, luxury abayas, and chic sets crafted with premium fabrics. Inspection on delivery.'
            )}
          </p>
        </div>
      </div>

      {/* Quick Type Filter Pills */}
      {types && types.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => { setSelectedType(''); setPage(1) }}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold font-arabic transition-all whitespace-nowrap shadow-xs ${
              !selectedType
                ? 'bg-royal text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-royal/40 hover:bg-gray-50'
            }`}
          >
            {t('الكل', 'All Styles')} {data?.total !== undefined && `(${data.total})`}
          </button>
          {types.map(tItem => (
            <button
              key={tItem.id}
              onClick={() => { setSelectedType(tItem.id); setPage(1) }}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold font-arabic transition-all whitespace-nowrap shadow-xs ${
                selectedType === tItem.id
                  ? 'bg-royal text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-royal/40 hover:bg-gray-50'
              }`}
            >
              {t(tItem.name_ar, tItem.name_en)}
            </button>
          ))}
        </div>
      )}

      {/* Search + Sort bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={t('ابحثي عن فستان، عباية، لون...', 'Search dresses, abayas, colors...')}
            className="w-full pr-11 pl-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal/40 font-arabic text-sm"
          />
        </div>
        <Button variant="outline" size="md" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline font-arabic">{t('تصفية متقدمة', 'Filters')}</span>
          {hasFilters && <span className="w-2 h-2 bg-royal rounded-full" />}
        </Button>
        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value); setPage(1) }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal/40 text-sm font-arabic bg-white"
        >
          <option value="newest">{t('الأحدث', 'Newest')}</option>
          <option value="price_asc">{t('السعر: الأقل أولاً', 'Price: Low to High')}</option>
          <option value="price_desc">{t('السعر: الأعلى أولاً', 'Price: High to Low')}</option>
          <option value="name_ar">{t('الاسم أبجدياً', 'Name A-Z')}</option>
        </select>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 font-arabic">{t('تصفية المنتجات', 'Filter Products')}</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-arabic flex items-center gap-1">
                <X size={14} />{t('مسح الكل', 'Clear All')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block font-arabic">{t('النوع', 'Type')}</label>
              <select
                value={selectedType}
                onChange={e => { setSelectedType(e.target.value); setPage(1) }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-arabic bg-white focus:outline-none focus:ring-2 focus:ring-royal/40"
              >
                <option value="">{t('الكل', 'All')}</option>
                {types?.map(type => (
                  <option key={type.id} value={type.id}>{t(type.name_ar, type.name_en)}</option>
                ))}
              </select>
            </div>
            {/* Price Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block font-arabic">{t('نطاق السعر', 'Price Range')}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => { setMinPrice(e.target.value); setPage(1) }}
                  placeholder={t('من', 'Min')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal/40"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => { setMaxPrice(e.target.value); setPage(1) }}
                  placeholder={t('إلى', 'Max')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal/40"
                />
              </div>
            </div>
            {/* Sizes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block font-arabic">{t('المقاسات', 'Sizes')}</label>
              <div className="flex flex-wrap gap-2">
                {allSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                      selectedSizes.includes(size)
                        ? 'bg-royal text-white border-royal'
                        : 'border-gray-200 text-gray-600 hover:border-royal'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-gray-500 mb-4 font-arabic">
          {data?.total} {t('منتج', 'products')}
        </p>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <ProductGridSkeleton count={12} />
      ) : data?.products?.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t('لا توجد منتجات', 'No Products Found')}
          description={t('جربي تعديل معايير البحث', 'Try adjusting your search criteria')}
          action={hasFilters ? <Button onClick={clearFilters}>{t('مسح الفلاتر', 'Clear Filters')}</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            {t('السابق', 'Previous')}
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  p === page ? 'bg-royal text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            {t('التالي', 'Next')}
          </Button>
        </div>
      )}
    </div>
  )
}
