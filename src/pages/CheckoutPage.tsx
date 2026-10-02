import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { MessageCircle, ShoppingBag, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'
import { formatPrice, buildWhatsAppMessage, EGYPT_GOVERNORATES } from '@/lib/utils'
import type { CheckoutFormData, OrderResult } from '@/lib/types'
import { getDeviceInfo } from '@/lib/device'
import { getProductSku, formatProductSku } from '@/lib/sku'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'

export default function CheckoutPage() {
  const { t } = useLanguage()
  const { items, total, clearCart, loading: cartLoading } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)

  const passedState = location.state as { couponCode?: string; discount?: number } | null
  const couponCode = passedState?.couponCode || ''
  const discount = passedState?.discount || 0

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['checkout-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['whatsapp_number', 'store_open', 'currency', 'default_shipping_fee', 'minimum_order'])
      return Object.fromEntries((data || []).map(r => [r.key, r.value]))
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutFormData>({
    defaultValues: { coupon_code: couponCode, notes: '' },
  })

  const watchedCity = watch('city')

  const { data: shippingFee } = useQuery({
    queryKey: ['shipping-fee', watchedCity],
    queryFn: async () => {
      if (!watchedCity) return parseFloat(settings?.default_shipping_fee || '50')
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', `shipping_fee_${watchedCity.toLowerCase()}`)
        .maybeSingle()
      return data?.value
        ? parseFloat(data.value)
        : parseFloat(settings?.default_shipping_fee || '50')
    },
    enabled: !!watchedCity && !!settings,
  })

  const fee = shippingFee ?? parseFloat(settings?.default_shipping_fee || '50')
  const finalTotal = total - discount + fee
  const currency = settings?.currency || 'EGP'

  // Redirect if cart is empty after initial loading completes
  useEffect(() => {
    if (!settingsLoading && !cartLoading && items.length === 0) {
      navigate('/cart')
    }
  }, [items, settingsLoading, cartLoading, navigate])

  if (settingsLoading || cartLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-royal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Store closed
  if (settings?.store_open === 'false') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 font-arabic">
          {t('المتجر مغلق حالياً', 'Store Currently Closed')}
        </h2>
        <p className="text-gray-500 font-arabic">
          {t('نعتذر، المتجر مغلق مؤقتاً. يرجى المحاولة لاحقاً.', 'Sorry, the store is temporarily closed. Please try again later.')}
        </p>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  async function onSubmit(data: CheckoutFormData) {
    setSubmitting(true)
    try {
      // Format custom measurements if any item has size === 'مقاس خاص'
      let finalNotes = data.notes?.trim() || ''
      const customItems = items.filter(i => i.size === 'مقاس خاص')
      if (customItems.length > 0) {
        let measurementsBlock = '\n\n✂️ [مقاسات التفصيل الخاصة]:'
        for (const item of customItems) {
          const pName = t(item.product?.name_ar || '', item.product?.name_en || '')
          try {
            const raw = localStorage.getItem(`ra_measurements_${item.product_id}`)
            if (raw) {
              const m = JSON.parse(raw)
              measurementsBlock += `\n• موديل (${pName}):`
              measurementsBlock += `\n  - عرض الكتف: ${m.shoulder} سم`
              measurementsBlock += `\n  - دوران الصدر: ${m.chest} سم`
              measurementsBlock += `\n  - دوران الوسط: ${m.waist} سم`
              measurementsBlock += `\n  - دوران الأرداف: ${m.hips} سم`
              measurementsBlock += `\n  - طول الكم: ${m.sleeve} سم`
              measurementsBlock += `\n  - دوران الذراع: ${m.arm} سم`
              measurementsBlock += `\n  - دوران المعصم: ${m.wrist} سم`
              measurementsBlock += `\n  - طول الموديل: ${m.length} سم`
              if (m.notes) measurementsBlock += `\n  - ملاحظات إضافية: ${m.notes}`
            }
          } catch (e) {
            console.warn(e)
          }
        }
        finalNotes = (finalNotes ? `${finalNotes}\n` : '') + measurementsBlock
      }

      const { data: result, error } = await supabase.rpc('create_order', {
        p_customer_name: data.customer_name,
        p_phone: data.phone,
        p_city: data.city,
        p_address: data.address,
        p_notes: finalNotes || '',
        p_coupon_code: couponCode || null,
      })

      if (error) throw error

      const orderResult = result as unknown as OrderResult
      if (!orderResult.success) {
        toast.error(orderResult.message || t('حدث خطأ في الطلب', 'Order error'))
        setSubmitting(false)
        return
      }

      // Attach client device metadata to order record for admin recognition & analytics
      const deviceInfo = getDeviceInfo()
      if (orderResult.order_id) {
        try {
          await supabase.from('orders').update({
            device_id: deviceInfo.deviceId,
            device_type: deviceInfo.deviceType,
            browser_info: deviceInfo.summaryAr,
          }).eq('id', orderResult.order_id)
        } catch {
          // Non-blocking fallback if database column is being created
        }
      }

      const waNumber = settings?.whatsapp_number || ''
      const waMsg = buildWhatsAppMessage({
        orderNumber: orderResult.order_number!,
        items: items.map(i => {
          const skuCode = formatProductSku(getProductSku(i.product))
          const baseName = t(i.product?.name_ar || '', i.product?.name_en || '')
          return {
            name: `${baseName} [${skuCode}]`,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
            price: i.product?.sale_price ?? i.product?.price ?? 0,
          }
        }),
        subtotal: orderResult.subtotal!,
        discount: orderResult.discount!,
        shippingFee: orderResult.shipping_fee!,
        total: orderResult.total!,
        couponCode: couponCode || null,
        customerName: data.customer_name,
        phone: data.phone,
        city: data.city,
        address: data.address,
        notes: finalNotes || null,
        currency,
      })

      await clearCart()

      // Open WhatsApp
      const waUrl = `https://wa.me/${waNumber}?text=${waMsg}`
      window.open(waUrl, '_blank')

      navigate('/thank-you', {
        state: {
          orderNumber: orderResult.order_number,
          total: orderResult.total,
          waNumber,
          waMsg,
        },
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('حدث خطأ', 'Error occurred')
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 font-arabic">{t('إتمام الطلب', 'Checkout')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-5 font-arabic text-lg">{t('بيانات التوصيل', 'Delivery Information')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 font-arabic">
                  {t('الاسم الكامل', 'Full Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('customer_name', {
                    required: t('مطلوب', 'Required'),
                    minLength: { value: 2, message: t('اسم قصير جداً', 'Name too short') },
                  })}
                  placeholder={t('الاسم الكامل', 'Full Name')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-arabic focus:outline-none focus:ring-2 focus:ring-royal/40 focus:border-royal"
                />
                {errors.customer_name && (
                  <p className="mt-1 text-xs text-red-500 font-arabic">{errors.customer_name.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 font-arabic">
                  {t('رقم الهاتف', 'Phone Number')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phone', {
                    required: t('مطلوب', 'Required'),
                    pattern: {
                      value: /^[\d\s\+\-\(\)]{7,20}$/,
                      message: t('رقم غير صحيح', 'Invalid phone number'),
                    },
                  })}
                  type="tel"
                  placeholder="01X XXXX XXXX أو +20 1X XXXX XXXX"
                  dir="ltr"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-english focus:outline-none focus:ring-2 focus:ring-royal/40 focus:border-royal"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500 font-arabic">{errors.phone.message}</p>
                )}
              </div>

              {/* City / Governorate */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 font-arabic">
                  {t('المحافظة', 'Governorate')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register('city', { required: t('مطلوب', 'Required') })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-arabic bg-white focus:outline-none focus:ring-2 focus:ring-royal/40 focus:border-royal appearance-none"
                  >
                    <option value="">{t('اختاري المحافظة', 'Select Governorate')}</option>
                    {EGYPT_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.city && (
                  <p className="mt-1 text-xs text-red-500 font-arabic">{errors.city.message}</p>
                )}
                {watchedCity && (
                  <p className="mt-1 text-xs text-green-600 font-arabic">
                    {t('رسوم الشحن:', 'Shipping fee:')} {formatPrice(fee, currency)}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 font-arabic">
                  {t('العنوان الكامل', 'Full Address')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('address', {
                    required: t('مطلوب', 'Required'),
                    minLength: { value: 5, message: t('عنوان قصير جداً', 'Address too short') },
                  })}
                  rows={3}
                  placeholder={t('الحي، الشارع، رقم المبنى...', 'District, Street, Building number...')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-arabic focus:outline-none focus:ring-2 focus:ring-royal/40 focus:border-royal resize-none"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500 font-arabic">{errors.address.message}</p>
                )}
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 font-arabic">
                  {t('ملاحظات (اختياري)', 'Notes (optional)')}
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder={t('أي ملاحظات خاصة بالطلب...', 'Any special notes...')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-arabic focus:outline-none focus:ring-2 focus:ring-royal/40 focus:border-royal resize-none"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={submitting}
            className="font-arabic py-4 text-base"
          >
            <MessageCircle size={22} />
            {t('تأكيد الطلب وإرسال عبر واتساب', 'Confirm & Send via WhatsApp')}
          </Button>
          <p className="text-xs text-gray-400 text-center font-arabic">
            {t('سيتم فتح واتساب تلقائياً بعد تأكيد الطلب', 'WhatsApp will open automatically after order confirmation')}
          </p>
        </form>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4 font-arabic">{t('ملخص الطلب', 'Order Summary')}</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 items-start">
                  <img
                    src={item.product?.images?.[0] || ''}
                    alt=""
                    className="w-12 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                    onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 font-arabic line-clamp-2">
                      {t(item.product?.name_ar || '', item.product?.name_en || '')}
                    </p>
                    <p className="text-xs text-gray-500 font-arabic flex items-center gap-1 mt-0.5">
                      {item.size === 'مقاس خاص' ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold text-[10px]">
                          ✂️ تفصيل بمقاس خاص
                        </span>
                      ) : (
                        item.size && <span>{t('المقاس', 'Size')}: {item.size}</span>
                      )}
                      {item.color && <span>• {item.color}</span>}
                    </p>
                    <p className="text-xs font-bold text-royal mt-0.5">
                      {item.quantity} × {formatPrice(item.product?.sale_price ?? item.product?.price ?? 0, currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between font-arabic">
                <span className="text-gray-600">{t('المجموع', 'Subtotal')}</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-arabic">
                  <span>{t('خصم', 'Discount')}</span>
                  <span>−{formatPrice(discount, currency)}</span>
                </div>
              )}
              {couponCode && discount > 0 && (
                <div className="flex justify-between text-xs text-gray-400 font-arabic">
                  <span>{t('كود الخصم', 'Coupon')}</span>
                  <span className="font-english tracking-wider">{couponCode}</span>
                </div>
              )}
              <div className="flex justify-between font-arabic">
                <span className="text-gray-600">{t('الشحن', 'Shipping')}</span>
                <span>{fee > 0 ? formatPrice(fee, currency) : t('مجاني', 'Free')}</span>
              </div>
              <div className="flex justify-between font-bold font-arabic border-t border-gray-100 pt-2 text-base">
                <span>{t('الإجمالي', 'Total')}</span>
                <span className="text-royal">{formatPrice(finalTotal, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
