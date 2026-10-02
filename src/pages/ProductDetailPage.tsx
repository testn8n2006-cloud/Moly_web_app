import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Ruler,
  Home,
  MessageCircle,
  ShieldCheck,
  Truck,
  Scissors,
  RefreshCw,
  Copy,
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { ProductCard } from '@/components/products/ProductCard'
import { CustomMeasurementsModal } from '@/components/products/CustomMeasurementsModal'
import { ProductReviews } from '@/components/products/ProductReviews'
import { SmartSizeAssistant } from '@/components/products/SmartSizeAssistant'
import { getProductSku, copyProductSku, formatProductSku } from '@/lib/sku'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/SkeletonLoader'
import { Modal } from '@/components/ui/Modal'
import { formatPrice, cn } from '@/lib/utils'
import type { Product, CustomMeasurements } from '@/lib/types'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useLanguage()
  const { addItem } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showSmartAssistant, setShowSmartAssistant] = useState(false)

  const [customMeasurements, setCustomMeasurements] = useState<CustomMeasurements | null>(() => {
    try {
      const saved = localStorage.getItem(`ra_measurements_${id}`)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const { data: waNumber } = useQuery({
    queryKey: ['whatsapp-number'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_number').single()
      return data?.value || ''
    },
    staleTime: 1000 * 60 * 30,
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('No ID')
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (error) throw error
      return data as Product
    },
    enabled: !!id,
  })

  const { data: sizeGuide } = useQuery({
    queryKey: ['size-guide'],
    queryFn: async () => {
      const { data } = await supabase.from('site_content').select('*').eq('key', 'size_guide').single()
      return data
    },
  })

  const { data: related } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product!.category_id)
        .eq('is_visible', true)
        .neq('id', id!)
        .limit(4)
      return (data || []) as Product[]
    },
    enabled: !!product,
  })

  function handleSaveMeasurements(measurements: CustomMeasurements) {
    setCustomMeasurements(measurements)
    setSelectedSize('مقاس خاص')
    if (id) {
      localStorage.setItem(`ra_measurements_${id}`, JSON.stringify(measurements))
      try {
        const allMap = JSON.parse(localStorage.getItem('ra_all_measurements') || '{}')
        allMap[id] = {
          product_id: id,
          product_name: product?.name_ar || product?.name_en || '',
          ...measurements,
          updated_at: new Date().toISOString(),
        }
        localStorage.setItem('ra_all_measurements', JSON.stringify(allMap))
      } catch (err) {
        console.warn(err)
      }
    }
  }

  async function handleAddToCart() {
    if (!product) return
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error(t('يرجى اختيار المقاس', 'Please select a size'))
      return
    }
    if (selectedSize === 'مقاس خاص' && !customMeasurements) {
      setShowCustomModal(true)
      toast.error(t('يرجى إدخال قياساتكِ الخاصة أولاً للتفصيل', 'Please enter your custom measurements first'))
      return
    }
    if (product.colors.length > 0 && !selectedColor) {
      toast.error(t('يرجى اختيار اللون', 'Please select a color'))
      return
    }
    setAdding(true)
    await addItem(product.id, selectedSize, selectedColor, quantity)
    setAdding(false)
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={36} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-arabic">{t('المنتج غير موجود', 'Product not found')}</h2>
        <p className="text-gray-500 text-sm mb-6 font-arabic">{t('ربما تم حذف هذا المنتج أو نقله إلى رابط آخر.', 'This product might have been removed or moved.')}</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-royal text-white px-6 py-2.5 rounded-xl font-arabic text-sm hover:bg-royal-dark transition-colors shadow-sm">
          <Home size={16} />
          {t('العودة للرئيسية', 'Back to Home')}
        </Link>
      </div>
    )
  }

  const name = t(product.name_ar, product.name_en)
  const desc = t(product.description_ar || '', product.description_en || '')
  const displayPrice = product.sale_price ?? product.price
  const isOnSale = product.sale_price !== null
  const fav = isFavorite(product.id)
  const productSku = getProductSku(product)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex gap-2 text-sm text-gray-500 mb-6 font-arabic">
        <Link to="/" className="hover:text-royal">{t('الرئيسية', 'Home')}</Link>
        <span>/</span>
        <Link to={product.category_id === '00000000-0000-0000-0000-000000000001' ? '/women' : '/kids'} className="hover:text-royal">
          {product.category_id === '00000000-0000-0000-0000-000000000001' ? t('نساء', 'Women') : t('أطفال', 'Kids')}
        </Link>
        <span>/</span>
        <span className="text-gray-800">{name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
            {product.images[selectedImage] ? (
              <img
                src={product.images[selectedImage]}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ZoomIn size={60} />
              </div>
            )}
            {/* Nav arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage(i => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setSelectedImage(i => Math.min(product.images.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors',
                    i === selectedImage ? 'border-royal' : 'border-transparent'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-arabic">{name}</h1>
              {!product.in_stock && <Badge variant="danger">{t('نفد المخزون', 'Out of Stock')}</Badge>}
            </div>

            {/* Product Model Code (SKU) Badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-royal/5 border border-royal/15 text-xs text-gray-700 shadow-xs">
                <span className="text-gray-500 font-arabic text-xs">{t('كود الموديل:', 'Model Code:')}</span>
                <span className="font-english font-bold text-royal tracking-wider text-xs">{formatProductSku(productSku)}</span>
                <button
                  type="button"
                  onClick={() => copyProductSku(productSku, t('تم نسخ كود الموديل بنجاح', 'Model code copied successfully'))}
                  className="p-1 hover:bg-royal/10 text-gray-400 hover:text-royal rounded transition-colors active:scale-90"
                  title={t('نسخ كود الموديل', 'Copy Model Code')}
                  aria-label={t('نسخ كود الموديل', 'Copy Model Code')}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-royal">{formatPrice(displayPrice)}</span>
            {isOnSale && (
              <span className="text-gray-400 text-xl line-through">{formatPrice(product.price)}</span>
            )}
            {isOnSale && (
              <Badge variant="warning">
                {Math.round(((product.price - product.sale_price!) / product.price) * 100)}% {t('خصم', 'OFF')}
              </Badge>
            )}
          </div>

          {desc && <p className="text-gray-600 leading-relaxed font-arabic text-sm">{desc}</p>}

          {/* Sizes */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="font-bold text-gray-900 font-arabic text-sm">{t('المقاس', 'Size')}</label>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSmartAssistant(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-royal dark:text-blue-400 font-bold bg-royal/10 dark:bg-royal/20 hover:bg-royal/15 px-2.5 py-1 rounded-xl transition-all shadow-2xs hover:scale-105 active:scale-95"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  <span>{t('مساعد المقاس الذكي ✨', 'Smart Fit Assistant ✨')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="text-xs text-gray-500 hover:text-royal dark:text-gray-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1 font-arabic"
                >
                  <Ruler size={13} />
                  <span>{t('دليل المقاسات', 'Size Guide')}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Regular Sizes */}
              {product.sizes.map((size: string) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    'px-4 py-2 rounded-xl border text-sm font-semibold transition-all',
                    selectedSize === size
                      ? 'bg-royal text-white border-royal shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-royal bg-white hover:bg-gray-50'
                  )}
                >
                  {size}
                </button>
              ))}

              {/* Custom Size / Special Measurements Button */}
              <button
                type="button"
                onClick={() => {
                  if (!customMeasurements) {
                    setShowCustomModal(true)
                  } else {
                    setSelectedSize('مقاس خاص')
                  }
                }}
                className={cn(
                  'px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 font-arabic shadow-xs',
                  selectedSize === 'مقاس خاص'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40'
                    : 'border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400 hover:bg-amber-100/80'
                )}
              >
                <Scissors size={14} className={selectedSize === 'مقاس خاص' ? 'text-white' : 'text-amber-700'} />
                <span>{t('المقاسات الخاصة (تفصيل)', 'Custom Size')}</span>
                {customMeasurements && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans font-bold ${
                    selectedSize === 'مقاس خاص' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
                  }`}>
                    ✓
                  </span>
                )}
              </button>
            </div>

            {/* Custom Measurements Summary Details Card */}
            {selectedSize === 'مقاس خاص' && customMeasurements && (
              <div className="mt-3.5 p-4 bg-gradient-to-br from-amber-50/90 to-amber-100/40 border border-amber-200/90 rounded-2xl animate-fade-in space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center">
                      <Scissors size={13} />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-amber-950 font-arabic">
                      {t('تم تسجيل قياساتكِ الخاصة للتفصيل ✨', 'Custom measurements registered')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(true)}
                    className="text-xs text-royal font-bold hover:underline font-arabic flex items-center gap-1"
                  >
                    <span>{t('تعديل القياسات ✏️', 'Edit Measurements ✏️')}</span>
                  </button>
                </div>

                {/* 8 Measurements Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-arabic pt-1">
                  <div className="bg-white/95 p-2 rounded-xl border border-amber-100 shadow-xs">
                    <span className="text-gray-400 block text-[10px]">عرض الكتف:</span>
                    <span className="font-extrabold text-gray-900 font-english">{customMeasurements.shoulder} سم</span>
                  </div>
                  <div className="bg-white/95 p-2 rounded-xl border border-amber-100 shadow-xs">
                    <span className="text-gray-400 block text-[10px]">دوران الصدر:</span>
                    <span className="font-extrabold text-gray-900 font-english">{customMeasurements.chest} سم</span>
                  </div>
                  <div className="bg-white/95 p-2 rounded-xl border border-amber-100 shadow-xs">
                    <span className="text-gray-400 block text-[10px]">دوران الوسط:</span>
                    <span className="font-extrabold text-gray-900 font-english">{customMeasurements.waist} سم</span>
                  </div>
                  <div className="bg-white/95 p-2 rounded-xl border border-amber-100 shadow-xs">
                    <span className="text-gray-400 block text-[10px]">دوران الأرداف:</span>
                    <span className="font-extrabold text-gray-900 font-english">{customMeasurements.hips} سم</span>
                  </div>
                  <div className="bg-white/95 p-2 rounded-xl border border-amber-100 shadow-xs">
                    <span className="text-gray-400 block text-[10px]">طول الكم:</span>
                    <span className="font-extrabold text-gray-900 font-english">{customMeasurements.sleeve} سم</span>
                  </div>
                  <div className="bg-white/95 p-2 rounded-xl border border-amber-100 shadow-xs">
                    <span className="text-gray-400 block text-[10px]">دوران الذراع:</span>
                    <span className="font-extrabold text-gray-900 font-english">{customMeasurements.arm} سم</span>
                  </div>
                  <div className="bg-white/95 p-2 rounded-xl border border-amber-100 shadow-xs">
                    <span className="text-gray-400 block text-[10px]">دوران المعصم:</span>
                    <span className="font-extrabold text-gray-900 font-english">{customMeasurements.wrist} سم</span>
                  </div>
                  <div className="bg-white/95 p-2 rounded-xl border border-amber-100 shadow-xs">
                    <span className="text-gray-400 block text-[10px]">طول الموديل:</span>
                    <span className="font-extrabold text-gray-900 font-english">{customMeasurements.length} سم</span>
                  </div>
                </div>

                {customMeasurements.notes && (
                  <p className="text-[11px] text-amber-900 bg-white/90 p-2.5 rounded-xl border border-amber-100 font-arabic leading-relaxed">
                    <strong className="text-amber-950">ملاحظات التفصيل:</strong> {customMeasurements.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div>
              <label className="font-medium text-gray-900 font-arabic mb-2 block">{t('اللون', 'Color')}: <span className="font-normal text-gray-600">{selectedColor || ''}</span></label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'px-4 py-2 rounded-xl border text-sm transition-all font-arabic',
                      selectedColor === color
                        ? 'bg-royal text-white border-royal'
                        : 'border-gray-200 text-gray-700 hover:border-royal'
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="font-medium text-gray-900 font-arabic mb-2 block">{t('الكمية', 'Quantity')}</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-xl font-bold hover:bg-gray-50 transition-colors"
              >
                −
              </button>
              <span className="w-12 text-center font-bold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(20, q + 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-xl font-bold hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.in_stock}
                loading={adding}
                fullWidth
                className="font-arabic py-4 text-base font-bold shadow-md hover:shadow-lg"
              >
                <ShoppingBag size={20} />
                {product.in_stock ? t('أضف إلى السلة', 'Add to Cart') : t('نفد المخزون حالياً', 'Out of Stock')}
              </Button>
              <button
                onClick={() => toggleFavorite(product.id)}
                className="p-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all flex-shrink-0"
                aria-label={t('المفضلة', 'Favorite')}
              >
                <Heart size={22} className={cn(fav ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500')} />
              </button>
            </div>

            {/* Direct WhatsApp Consultation */}
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                  `مرحباً أتيليه R&A Couture 🌸\nأود الاستفسار عن تفصيل أو توفر هذا الموديل:\n*${product.name_ar || product.name_en}*\nالسعر: ${formatPrice(displayPrice)}\n${selectedSize ? `المقاس المفضل: ${selectedSize}\n` : ''}${selectedColor ? `اللون: ${selectedColor}\n` : ''}رابط الموديل: ${window.location.href}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 py-3 rounded-xl font-bold text-xs sm:text-sm font-arabic transition-all duration-200 shadow-xs"
              >
                <MessageCircle size={18} className="text-emerald-600" />
                <span>{t('استفسري عن تفصيل الموديل أو تعديل المقاس عبر واتساب', 'Inquire about tailoring or sizing on WhatsApp')}</span>
              </a>
            )}
          </div>

          {/* Luxury Atelier Trust Badges */}
          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100/90 space-y-2.5 pt-4 text-xs font-arabic text-gray-700">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={17} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900">{t('حق المعاينة مكفول:', 'Inspection Guaranteed:')}</span>{' '}
                <span>{t('يمكنكِ فحص القطعة والتأكد من المقاس والخامة مع المندوب قبل السداد.', 'Inspect fabric & fit with courier before payment.')}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Scissors size={17} className="text-royal flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900">{t('تفصيل وتشطيب يدوي فاخر:', 'Handmade Atelier Finish:')}</span>{' '}
                <span>{t('خياطة دقيقة بأقمشة مستوردة فاخرة مع بطانة مريحة.', 'Crafted with premium imported fabrics and soft lining.')}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Truck size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900">{t('شحن لكافة محافظات مصر:', 'Shipping All Egypt:')}</span>{' '}
                <span>{t('توصيل لباب بيتك خلال 2-4 أيام عمل.', 'Delivered to your doorstep in 2-4 days.')}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <RefreshCw size={17} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900">{t('استبدال سهل وسريع:', 'Easy Exchanges:')}</span>{' '}
                <span>{t('إمكانية استبدال المقاس بكل سلاسة خلال 7 أيام من الاستلام.', 'Easy size exchange within 7 days.')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <Modal open={showSizeGuide} onClose={() => setShowSizeGuide(false)} title={t('دليل المقاسات', 'Size Guide')}>
        {sizeGuide ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: t(sizeGuide.value_ar || '', sizeGuide.value_en || '') }} />
        ) : (
          <p>{t('جاري التحميل...', 'Loading...')}</p>
        )}
      </Modal>

      {/* Custom Measurements Modal */}
      <CustomMeasurementsModal
        open={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSave={handleSaveMeasurements}
        initialValues={customMeasurements}
        productName={name}
      />

      {/* Smart Size & Fit Assistant Modal */}
      <SmartSizeAssistant
        open={showSmartAssistant}
        onClose={() => setShowSmartAssistant(false)}
        productName={name}
        availableSizes={product.sizes}
        onSelectRecommendedSize={(sz) => {
          setSelectedSize(sz)
          toast.success(t(`تم اعتماد المقاس الموصى به: ${sz} ✓`, `Applied recommended size: ${sz} ✓`))
        }}
        onOpenCustomSize={() => setShowCustomModal(true)}
      />

      {/* Customer Reviews & Photo Testimonials */}
      <ProductReviews productId={product.id} productName={name} />

      {/* Related Products */}
      {related && related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 font-arabic mb-6">{t('منتجات ذات صلة', 'Related Products')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
