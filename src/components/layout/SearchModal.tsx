import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, ShoppingBag, ArrowLeft, ArrowRight, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/types'
import { getProductSku, formatProductSku } from '@/lib/sku'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

const POPULAR_SEARCHES = ['فساتين سهرة', 'عبايات', 'أطفال', 'طقم كاجوال', 'حرير']

export function SearchModal({ open, onClose }: SearchModalProps) {
  const { t, isRTL } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setQuery('')
      setResults([])
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const cleanQuery = query.trim().replace(/^#/, '')
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('is_visible', true)
          .or(`name_ar.ilike.%${cleanQuery}%,name_en.ilike.%${cleanQuery}%,description_ar.ilike.%${cleanQuery}%,sku.ilike.%${cleanQuery}%`)
          .limit(6)
        setResults((data || []) as Product[])
      } catch (err) {
        console.warn('Search query error:', err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10" role="dialog">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-royal-dark/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 animate-slide-up">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-3">
          <Search size={22} className="text-royal flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('ابحثي عن فساتين، عبايات، أطقم، مقاسات...', 'Search dresses, abayas, sets, sizes...')}
            className="w-full text-base sm:text-lg text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none font-arabic"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 font-arabic transition-colors flex-shrink-0"
          >
            {t('إلغاء', 'Cancel')}
          </button>
        </div>

        {/* Popular searches suggestions */}
        {!query && (
          <div className="p-6">
            <p className="text-xs font-bold text-gray-400 font-arabic mb-3">
              {t('عمليات البحث الشائعة:', 'Popular Searches:')}
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(tag)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium font-arabic bg-royal/5 text-royal hover:bg-royal hover:text-white transition-all duration-200 border border-royal/10"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-royal border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400 font-arabic mt-3">{t('جاري البحث في التشكيلة...', 'Searching collection...')}</p>
          </div>
        )}

        {/* Results */}
        {!loading && query && (
          <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto">
            {results.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 font-arabic px-1">
                  {t(`وجدنا ${results.length} نتائج`, `Found ${results.length} results`)}
                </p>
                <div className="divide-y divide-gray-100">
                  {results.map(product => {
                    const price = product.sale_price ?? product.price
                    const isOnSale = product.sale_price !== null && product.sale_price !== undefined

                    return (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-14 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name_ar}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Tag size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-arabic font-bold text-gray-900 text-sm truncate group-hover:text-royal transition-colors">
                              {t(product.name_ar, product.name_en)}
                            </h4>
                            <span className="text-[10px] font-english font-bold text-royal/80 bg-royal/5 px-1.5 py-0.2 rounded border border-royal/10 flex-shrink-0">
                              {formatProductSku(getProductSku(product))}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-royal text-sm font-english">
                              {formatPrice(price)}
                            </span>
                            {isOnSale && (
                              <span className="text-xs text-gray-400 line-through font-english">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-gray-300 group-hover:text-royal transition-colors">
                          {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag size={24} className="text-gray-400" />
                </div>
                <p className="font-bold text-gray-800 text-sm font-arabic">
                  {t('لم نجد نتائج مطابقة لـ', 'No products matched')} "{query}"
                </p>
                <p className="text-gray-400 text-xs font-arabic mt-1">
                  {t('جربي البحث بكلمات أخرى مثل: فستان، عباية، سهرة', 'Try searching for other keywords like dress, abaya')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
