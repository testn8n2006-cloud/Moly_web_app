import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, Tag, ArrowLeft, Truck, ShieldCheck, Sparkles, RefreshCw, Scissors } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { CouponResult } from '@/lib/types'
import { getProductSku, formatProductSku } from '@/lib/sku'
import toast from 'react-hot-toast'

const FREE_SHIPPING_THRESHOLD = 1500 // In Egyptian Pounds (EGP)

export default function CartPage() {
  const { t, isRTL } = useLanguage()
  const { items, removeItem, updateQuantity, total } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [expandedMeasurements, setExpandedMeasurements] = useState<Record<string, boolean>>({})
  const navigate = useNavigate()

  const discount = couponResult?.valid ? (couponResult.discount || 0) : 0
  const finalTotal = Math.max(0, total - discount)

  // Free shipping progress calculation
  const hasFreeShipping = total >= FREE_SHIPPING_THRESHOLD
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const shippingProgress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))

  async function validateCoupon() {
    if (!couponCode.trim()) return
    setValidating(true)
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: couponCode.trim().toUpperCase(),
        p_subtotal: total,
      })
      if (error) throw error
      const result = data as unknown as CouponResult
      setCouponResult(result)
      if (result.valid) {
        toast.success(t('تم تطبيق كود الخصم بنجاح!', 'Coupon applied successfully!'))
      } else {
        toast.error(result.message || t('كوبون غير صالح', 'Invalid coupon'))
      }
    } catch {
      toast.error(t('حدث خطأ في التحقق من الكود', 'Error validating coupon'))
    } finally {
      setValidating(false)
    }
  }

  function handleCheckout() {
    navigate('/checkout', {
      state: {
        couponCode: couponResult?.valid ? couponCode : undefined,
        discount,
      },
    })
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <EmptyState
          icon={ShoppingBag}
          title={t('سلة التسوق فارغة', 'Your Cart is Empty')}
          description={t(
            'لم تقومي بإضافة أي قطع إلى سلتك بعد. استكشفي أحدث فساتين السهرة والعبايات الراقية الآن!',
            'You haven\'t added any pieces to your cart yet. Explore our latest luxury evening dresses and abayas!'
          )}
          action={
            <div className="flex gap-3 justify-center">
              <Link to="/women">
                <Button size="lg" className="font-arabic shadow-md px-8">
                  {t('تسوقي التشكيلة النسائية', "Shop Women's Collection")}
                </Button>
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Title & Badge */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-arabic">{t('سلة التسوق', 'Shopping Cart')}</h1>
        <span className="bg-royal text-white text-xs sm:text-sm px-2.5 py-0.5 rounded-full font-bold">
          {items.reduce((s, i) => s + i.quantity, 0)} {t('قطع', 'items')}
        </span>
      </div>

      {/* Free Shipping Progress Bar */}
      <div className="bg-white rounded-3xl p-5 mb-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${hasFreeShipping ? 'bg-emerald-100 text-emerald-700' : 'bg-royal/10 text-royal'}`}>
              {hasFreeShipping ? <Sparkles size={18} /> : <Truck size={18} />}
            </div>
            <p className="font-bold text-xs sm:text-sm text-gray-800 font-arabic">
              {hasFreeShipping ? (
                <span className="text-emerald-700 font-extrabold">
                  🎉 {t('مبروك! طلبيتك مؤهلة للشحن المجاني لكافة المحافظات!', 'Congratulations! You unlocked FREE shipping across Egypt!')}
                </span>
              ) : (
                <span>
                  {t('أضيفي منتجات بقيمة', 'Add products worth')}{' '}
                  <span className="text-royal font-extrabold">{formatPrice(remainingForFreeShipping)}</span>{' '}
                  {t('للحصول على شحن مجاني لكافة المحافظات', 'for FREE shipping')}
                </span>
              )}
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500 font-english">
            {shippingProgress}%
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              hasFreeShipping
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-royal-light to-royal'
            }`}
            style={{ width: `${shippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {items.map(item => {
            const unitPrice = item.product?.sale_price ?? item.product?.price ?? 0
            const itemTotal = unitPrice * item.quantity

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100 flex gap-4 sm:gap-5 hover:shadow-md transition-shadow animate-fade-in"
              >
                {/* Thumbnail */}
                <Link to={`/product/${item.product_id}`} className="flex-shrink-0">
                  <div className="w-20 sm:w-24 h-28 sm:h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                    <img
                      src={item.product?.images?.[0] || ''}
                      alt={item.product?.name_ar || ''}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/product/${item.product_id}`} className="block">
                        <h3 className="font-bold text-gray-900 font-arabic text-sm sm:text-base line-clamp-2 hover:text-royal transition-colors">
                          {t(item.product?.name_ar || '', item.product?.name_en || '')}
                        </h3>
                        <span className="inline-block mt-0.5 text-[11px] font-english font-bold text-royal/80 bg-royal/5 px-2 py-0.5 rounded border border-royal/10">
                          {formatProductSku(getProductSku(item.product))}
                        </span>
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                        title={t('حذف من السلة', 'Remove')}
                        aria-label={t('حذف', 'Remove')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Variations */}
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2 flex-wrap items-center">
                        {item.size === 'مقاس خاص' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-900 bg-amber-100/80 border border-amber-300 px-2.5 py-0.5 rounded-lg font-arabic font-bold flex items-center gap-1 shadow-xs">
                              <Scissors size={12} className="text-amber-700" />
                              <span>{t('تفصيل بمقاس خاص ✨', 'Custom Tailored Size ✨')}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setExpandedMeasurements(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                              className="text-[11px] text-royal underline font-arabic font-bold hover:text-royal-dark"
                            >
                              {expandedMeasurements[item.id] ? t('إخفاء المقاسات', 'Hide Measurements') : t('عرض القياسات', 'View Measurements')}
                            </button>
                          </div>
                        ) : (
                          item.size && (
                            <span className="text-xs text-gray-600 bg-gray-50 border border-gray-200/80 px-2.5 py-0.5 rounded-lg font-arabic font-medium">
                              {t('المقاس', 'Size')}: <span className="font-bold text-gray-900">{item.size}</span>
                            </span>
                          )
                        )}

                        {item.color && (
                          <span className="text-xs text-gray-600 bg-gray-50 border border-gray-200/80 px-2.5 py-0.5 rounded-lg font-arabic font-medium">
                            {t('اللون', 'Color')}: <span className="font-bold text-gray-900">{item.color}</span>
                          </span>
                        )}
                      </div>

                      {/* Expandable Measurements Box */}
                      {item.size === 'مقاس خاص' && expandedMeasurements[item.id] && (() => {
                        let m: any = null
                        try {
                          const raw = localStorage.getItem(`ra_measurements_${item.product_id}`)
                          if (raw) m = JSON.parse(raw)
                        } catch (e) {
                          console.warn(e)
                        }
                        if (!m) return null

                        return (
                          <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-[11px] font-arabic space-y-1.5 animate-slide-up">
                            <p className="font-bold text-amber-950 text-xs">قياسات التفصيل الخاصة:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-english">
                              <div className="bg-white p-1.5 rounded-lg border border-amber-100"><span className="text-gray-400 font-arabic text-[10px]">كتف: </span><strong>{m.shoulder}</strong> cm</div>
                              <div className="bg-white p-1.5 rounded-lg border border-amber-100"><span className="text-gray-400 font-arabic text-[10px]">صدر: </span><strong>{m.chest}</strong> cm</div>
                              <div className="bg-white p-1.5 rounded-lg border border-amber-100"><span className="text-gray-400 font-arabic text-[10px]">وسط: </span><strong>{m.waist}</strong> cm</div>
                              <div className="bg-white p-1.5 rounded-lg border border-amber-100"><span className="text-gray-400 font-arabic text-[10px]">أرداف: </span><strong>{m.hips}</strong> cm</div>
                              <div className="bg-white p-1.5 rounded-lg border border-amber-100"><span className="text-gray-400 font-arabic text-[10px]">كم: </span><strong>{m.sleeve}</strong> cm</div>
                              <div className="bg-white p-1.5 rounded-lg border border-amber-100"><span className="text-gray-400 font-arabic text-[10px]">ذراع: </span><strong>{m.arm}</strong> cm</div>
                              <div className="bg-white p-1.5 rounded-lg border border-amber-100"><span className="text-gray-400 font-arabic text-[10px]">معصم: </span><strong>{m.wrist}</strong> cm</div>
                              <div className="bg-white p-1.5 rounded-lg border border-amber-100"><span className="text-gray-400 font-arabic text-[10px]">طول: </span><strong>{m.length}</strong> cm</div>
                            </div>
                            {m.notes && <p className="text-amber-900 bg-white/80 p-1.5 rounded-lg border border-amber-100"><strong>ملاحظات:</strong> {m.notes}</p>}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Quantity & Item Total */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/70 rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white text-gray-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold font-english">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= 20}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white text-gray-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="text-end">
                      <p className="font-extrabold text-royal text-base sm:text-lg font-english">
                        {formatPrice(itemTotal)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-gray-400 font-english">
                          {formatPrice(unitPrice)} {t('للقطعة', 'each')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="pt-2">
            <Link
              to="/women"
              className="inline-flex items-center gap-2 text-royal text-sm font-bold hover:underline font-arabic group"
            >
              <ArrowLeft size={16} className={`transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
              <span>{t('متابعة التسوق واكتشاف المزيد', 'Continue Shopping')}</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 sticky top-24 space-y-6">
            <h2 className="font-extrabold text-gray-900 font-arabic text-xl pb-3 border-b border-gray-100">
              {t('ملخص الطلب', 'Order Summary')}
            </h2>

            {/* Coupon Code Section */}
            <div>
              <label className="text-xs font-bold text-gray-700 mb-2 block font-arabic">
                {t('هل لديكِ كود خصم؟', 'Have a promo code?')}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => {
                      setCouponCode(e.target.value.toUpperCase())
                      setCouponResult(null)
                    }}
                    placeholder="WELCOME10"
                    className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal/40 font-english tracking-wider uppercase font-semibold`}
                  />
                </div>
                <Button size="sm" onClick={validateCoupon} loading={validating} className="font-arabic px-4">
                  {t('تطبيق', 'Apply')}
                </Button>
              </div>
              {couponResult?.valid && (
                <p className="text-emerald-700 text-xs mt-2 font-arabic font-medium flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200/80">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>{t('تم تطبيق خصم بقيمة', 'Discount applied:')} {formatPrice(discount)}</span>
                </p>
              )}
              {couponResult && !couponResult.valid && (
                <p className="text-red-500 text-xs mt-1.5 font-arabic font-medium">{couponResult.message}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between font-arabic">
                <span className="text-gray-600">{t('المجموع الفرعي', 'Subtotal')}</span>
                <span className="font-bold text-gray-900 font-english">{formatPrice(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-arabic">
                  <span>{t('قيمة الخصم', 'Discount')}</span>
                  <span className="font-bold font-english">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-arabic text-xs text-gray-500">
                <span>{t('الشحن', 'Shipping')}</span>
                <span>
                  {hasFreeShipping ? (
                    <span className="text-emerald-600 font-bold font-arabic">{t('مجاني 🎉', 'Free 🎉')}</span>
                  ) : (
                    <span>{t('يُحدد في خطوة العنوان', 'Calculated at checkout')}</span>
                  )}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline font-bold font-arabic">
                <span className="text-base text-gray-900">{t('الإجمالي التقريبي', 'Estimated Total')}</span>
                <span className="text-royal text-2xl font-extrabold font-english">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <Button
              fullWidth
              size="lg"
              onClick={handleCheckout}
              className="font-arabic py-4 rounded-2xl shadow-lg hover:shadow-xl text-base font-extrabold"
            >
              {t('متابعة لإتمام الطلب', 'Proceed to Checkout')}
            </Button>

            {/* Reassurance Badges */}
            <div className="space-y-2.5 pt-2 text-xs font-arabic border-t border-gray-100 text-gray-600">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                <span>{t('معاينة وفحص الطلب قبل الدفع لمندوب الشحن', 'Inspect piece before paying the courier')}</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-royal flex-shrink-0" />
                <span>{t('إمكانية استبدال المقاس خلال 7 أيام', 'Easy size exchange within 7 days')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-amber-600 flex-shrink-0" />
                <span>{t('توصيل سريع لجميع المحافظات خلال 2-4 أيام', 'Fast courier delivery across Egypt')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
