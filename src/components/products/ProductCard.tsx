import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, Tag, X, Plus, Minus, Check, AlertCircle, Ruler } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useCart } from '@/contexts/CartContext'
import type { Product } from '@/lib/types'
import { formatPrice, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
  currency?: string
}

export function ProductCard({ product, currency = 'EGP' }: ProductCardProps) {
  const { t, isRTL } = useLanguage()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const [secondaryError, setSecondaryError] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  // Quick Select Modal States (Mandatory Choices)
  const [showQuickModal, setShowQuickModal] = useState(false)
  const [modalSize, setModalSize] = useState<string | null>(null)
  const [modalColor, setModalColor] = useState<string | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const name = t(product.name_ar, product.name_en)
  const coverImage = product.images?.[0] || ''
  const secondaryImage = product.images?.[1] || null
  const isOnSale = product.sale_price !== null && product.sale_price !== undefined
  const displayPrice = isOnSale ? product.sale_price! : product.price
  const savings = isOnSale ? (product.price - product.sale_price!) : 0
  const favorite = isFavorite(product.id)

  function openQuickSelect(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!product.in_stock) return
    setModalSize(null)
    setModalColor(null)
    setModalQuantity(1)
    setAttemptedSubmit(false)
    setShowQuickModal(true)
  }

  async function handleConfirmQuickAdd() {
    const hasSizes = product.sizes && product.sizes.length > 0
    const hasColors = product.colors && product.colors.length > 0

    setAttemptedSubmit(true)

    if (hasSizes && !modalSize) {
      toast.error(t('يرجى اختيار المقاس أولاً', 'Please select a size first'))
      return
    }

    if (hasColors && !modalColor) {
      toast.error(t('يرجى اختيار اللون أولاً', 'Please select a color first'))
      return
    }

    setAddingToCart(true)
    try {
      await addItem(product.id, modalSize, modalColor, modalQuantity)
      setShowQuickModal(false)
    } finally {
      setAddingToCart(false)
    }
  }

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await toggleFavorite(product.id)
  }

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-800 hover:border-royal/30 flex flex-col justify-between block relative"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-slate-800">
        {coverImage && !imgError ? (
          <>
            {/* Primary Image */}
            <img
              src={coverImage}
              alt={name}
              className={cn(
                'w-full h-full object-cover transition-all duration-500',
                secondaryImage && !secondaryError
                  ? 'group-hover:opacity-0 group-hover:scale-105'
                  : 'group-hover:scale-105'
              )}
              loading="lazy"
              onError={() => setImgError(true)}
            />
            {/* Secondary Image Flip on Hover */}
            {secondaryImage && !secondaryError && (
              <img
                src={secondaryImage}
                alt={`${name} - 2`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                loading="lazy"
                onError={() => setSecondaryError(true)}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800">
            <Tag size={40} className="text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className={cn('absolute top-3 flex flex-col gap-1.5 z-10', isRTL ? 'right-3' : 'left-3')}>
          {!product.in_stock && (
            <Badge variant="danger" className="shadow-sm font-arabic">{t('نفد المخزون', 'Out of Stock')}</Badge>
          )}
          {isOnSale && product.in_stock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-arabic bg-amber-500 text-white shadow-md">
              {t('خصم', 'Sale')} {Math.round((savings / product.price) * 100)}%
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className={cn(
            'absolute top-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm hover:scale-110 active:scale-95 transition-all z-10',
            isRTL ? 'left-3' : 'right-3'
          )}
          aria-label={t('المفضلة', 'Favorite')}
        >
          <Heart
            size={18}
            className={cn('transition-colors', favorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500')}
          />
        </button>

        {/* Quick Add overlay */}
        {product.in_stock && (
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
            <button
              type="button"
              onClick={openQuickSelect}
              className="w-full bg-royal dark:bg-blue-600 text-white py-2.5 rounded-xl text-xs sm:text-sm font-bold font-arabic flex items-center justify-center gap-2 hover:bg-royal-dark dark:hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md"
            >
              <ShoppingBag size={16} />
              {t('إضافة سريعة للطلب', 'Quick Add')}
            </button>
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Colors preview */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 mb-1.5 flex-wrap">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-arabic">
                {product.colors.slice(0, 3).join(' • ')}
                {product.colors.length > 3 && ` +${product.colors.length - 3}`}
              </span>
            </div>
          )}

          <h3 className="font-bold text-gray-900 dark:text-slate-100 text-xs sm:text-sm leading-snug line-clamp-2 font-arabic mb-2 group-hover:text-royal dark:group-hover:text-blue-400 transition-colors">
            {name}
          </h3>
        </div>

        {/* Price & Savings */}
        <div className="pt-2 border-t border-gray-50 dark:border-slate-800 flex items-baseline justify-between gap-1 flex-wrap">
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-royal dark:text-blue-400 text-sm sm:text-base font-english">
              {formatPrice(displayPrice, currency)}
            </span>
            {isOnSale && (
              <span className="text-gray-400 dark:text-gray-500 text-xs line-through font-english">
                {formatPrice(product.price, currency)}
              </span>
            )}
          </div>
          {isOnSale && savings > 0 && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-arabic bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md">
              {t(`وفري ${Math.round(savings)} ج.م`, `Save ${Math.round(savings)}`)}
            </span>
          )}
        </div>
      </div>

      {/* Quick Select Modal Portal - Mandatory Customer Selections */}
      {showQuickModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            e.stopPropagation()
            setShowQuickModal(false)
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up border border-gray-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/60 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <img 
                  src={coverImage} 
                  alt={name} 
                  className="w-14 h-16 sm:w-16 sm:h-20 object-cover rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm"
                  onError={() => setImgError(true)}
                />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-1 font-arabic">
                    {name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-extrabold text-royal dark:text-blue-400 text-base font-english">
                      {formatPrice(displayPrice, currency)}
                    </span>
                    {isOnSale && (
                      <span className="text-gray-400 dark:text-gray-500 text-xs line-through font-english">
                        {formatPrice(product.price, currency)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-arabic mt-0.5">
                    حددي المقاس واللون المفضلين لكِ بدقة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
              {/* Size Selection (Mandatory if sizes exist) */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-200 font-arabic flex items-center gap-1.5">
                      <span>{t('المقاس', 'Size')}</span>
                      <span className="text-red-500 text-xs font-normal">*(إجباري)</span>
                    </label>
                    {modalSize && (
                      <span className="text-xs text-royal dark:text-blue-300 font-bold font-arabic bg-royal/10 dark:bg-royal/30 px-2 py-0.5 rounded-md">
                        {t('المحدد:', 'Selected:')} {modalSize}
                      </span>
                    )}
                  </div>

                  <div className={cn(
                    "grid grid-cols-4 sm:grid-cols-5 gap-2 p-1 rounded-xl transition-all",
                    attemptedSubmit && !modalSize && "ring-2 ring-red-400/50 bg-red-50/40 dark:bg-red-950/20 p-2"
                  )}>
                    {product.sizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setModalSize(sz)}
                        className={cn(
                          'py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all text-center font-english',
                          modalSize === sz
                            ? 'bg-royal text-white border-royal shadow-sm ring-2 ring-royal/30'
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-royal/50 hover:bg-gray-50 dark:hover:bg-slate-700'
                        )}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  {attemptedSubmit && !modalSize && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-arabic">
                      <AlertCircle size={14} /> {t('يرجى تحديد مقاسكِ للمتابعة', 'Please pick a size to proceed')}
                    </p>
                  )}

                  {/* Custom Measurement Link */}
                  <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-arabic">مقاسكِ غير متوفر أو ترغبين بتفصيل؟</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickModal(false)
                        navigate(`/product/${product.id}#custom-size`)
                      }}
                      className="text-xs text-royal dark:text-blue-400 hover:underline font-bold font-arabic flex items-center gap-1"
                    >
                      <Ruler size={14} />
                      {t('تفصيل بمقاس خاص بالسنتيمتر', 'Custom size in cm')}
                    </button>
                  </div>
                </div>
              )}

              {/* Color Selection (Mandatory if colors exist) */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-200 font-arabic flex items-center gap-1.5">
                      <span>{t('اللون', 'Color')}</span>
                      <span className="text-red-500 text-xs font-normal">*(إجباري)</span>
                    </label>
                    {modalColor && (
                      <span className="text-xs text-royal dark:text-blue-300 font-bold font-arabic bg-royal/10 dark:bg-royal/30 px-2 py-0.5 rounded-md">
                        {t('المحدد:', 'Selected:')} {modalColor}
                      </span>
                    )}
                  </div>

                  <div className={cn(
                    "flex flex-wrap gap-2 p-1 rounded-xl transition-all",
                    attemptedSubmit && !modalColor && "ring-2 ring-red-400/50 bg-red-50/40 dark:bg-red-950/20 p-2"
                  )}>
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setModalColor(c)}
                        className={cn(
                          'py-2 px-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-all flex items-center gap-1.5 font-arabic',
                          modalColor === c
                            ? 'bg-royal text-white border-royal shadow-sm ring-2 ring-royal/30'
                            : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-royal/50 hover:bg-gray-50 dark:hover:bg-slate-700'
                        )}
                      >
                        {modalColor === c && <Check size={14} className="stroke-[3]" />}
                        <span>{c}</span>
                      </button>
                    ))}
                  </div>

                  {attemptedSubmit && !modalColor && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-arabic">
                      <AlertCircle size={14} /> {t('يرجى تحديد اللون المفضل', 'Please pick a color')}
                    </p>
                  )}
                </div>
              )}

              {/* Quantity Stepper */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-200 font-arabic mb-2">
                  {t('الكمية', 'Quantity')}
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                      disabled={modalQuantity <= 1}
                      className="p-2 sm:p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                      aria-label="تقليل"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-bold text-sm sm:text-base font-english text-gray-900 dark:text-slate-100">
                      {modalQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => Math.min(10, q + 1))}
                      disabled={modalQuantity >= 10}
                      className="p-2 sm:p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                      aria-label="زيادة"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <span className="text-xs text-gray-500 dark:text-gray-400 font-arabic">
                    {t(`الإجمالي: ${formatPrice(displayPrice * modalQuantity, currency)}`, `Total: ${formatPrice(displayPrice * modalQuantity, currency)}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/90 flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmQuickAdd}
                disabled={addingToCart}
                className="flex-1 bg-royal dark:bg-blue-600 text-white py-3 rounded-2xl text-sm font-bold font-arabic flex items-center justify-center gap-2 hover:bg-royal-dark dark:hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md disabled:opacity-60"
              >
                {addingToCart ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingBag size={18} />
                )}
                <span>{t('تأكيد وإضافة للسلة', 'Confirm & Add to Bag')}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                className="px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium font-arabic text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t('إلغاء', 'Cancel')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Link>
  )
}
