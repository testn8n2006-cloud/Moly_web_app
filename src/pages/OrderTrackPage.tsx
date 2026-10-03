import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Truck, CheckCircle2, PackageCheck, AlertCircle,
  MessageCircle, Scissors, Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { OrderWithItems } from '@/lib/types'
import { getProductSku, formatProductSku } from '@/lib/sku'

export default function OrderTrackPage() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [searched, setSearched] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Dynamic WhatsApp Number from Settings
  const { data: waNumber } = useQuery({
    queryKey: ['whatsapp-number'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_number').single()
      return data?.value || '201004590848'
    },
    staleTime: 1000 * 60 * 30,
  })

  // Check URL params on initial load
  useEffect(() => {
    const q = searchParams.get('order') || searchParams.get('phone')
    if (q) {
      setSearchTerm(q)
      fetchOrder(q)
    }
  }, [searchParams])

  async function fetchOrder(termToSearch?: string) {
    const term = (termToSearch || searchTerm).trim()
    if (!term) return

    setSearching(true)
    setErrorMsg('')
    setOrder(null)

    try {
      // 1. Search by order_number or phone
      const cleanTerm = term.replace(/[^a-zA-Z0-9]/g, '')
      let q = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      if (term.toUpperCase().startsWith('RA')) {
        q = q.ilike('order_number', `%${term}%`)
      } else {
        q = q.or(`order_number.ilike.%${term}%,phone.ilike.%${cleanTerm}%`)
      }

      const { data: orders, error: orderErr } = await q
      if (orderErr) throw orderErr

      if (!orders || orders.length === 0) {
        setErrorMsg(t('لم نعثر على أي طلب بهذا الرقم أو الهاتف. يرجى التأكد من البيانات والمحاولة مجدداً.', 'No order found with this number or phone.'))
        setSearched(true)
        setSearching(false)
        return
      }

      const foundOrder = orders[0]

      // 2. Fetch order items
      const { data: items, error: itemsErr } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', foundOrder.id)

      if (itemsErr) throw itemsErr

      setOrder({
        ...foundOrder,
        order_items: (items || []) as OrderWithItems['order_items'],
      })
      setSearched(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء البحث'
      setErrorMsg(msg)
      setSearched(true)
    } finally {
      setSearching(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchOrder()
  }

  // Progress Stage Calculation
  let currentStep = 1
  if (order) {
    if (order.status === 'confirmed') currentStep = 2
    else if (order.status === 'shipped') currentStep = 3
    else if (order.status === 'delivered') currentStep = 4
    else if (order.status === 'cancelled') currentStep = 0
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="w-16 h-16 bg-royal/10 dark:bg-royal/30 text-royal dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Truck size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white font-arabic mb-3">
          {t('تتبعي حالة طلبكِ وموعد التوصيل', 'Track Your Order & Delivery')}
        </h1>
        <p className="text-gray-700 dark:text-slate-300 font-arabic text-sm leading-relaxed">
          {t('أدخلي رقم الطلب الخاص بكِ (مثل: RA26100201) أو رقم هاتفكِ لمعرفة كافة تفاصيل الشحن والتفصيل فوراً.', 'Enter your order number or phone number to see full tracking details.')}
        </p>
      </div>

      {/* Search Bar Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200/80 dark:border-slate-800 max-w-2xl mx-auto mb-10 transition-colors">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('اكتبي رقم الطلب أو رقم الهاتف...', 'Type order number or phone...')}
              className="w-full pr-11 pl-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-arabic text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal transition-all"
              required
            />
          </div>
          <Button type="submit" loading={searching} className="py-3 px-8 font-arabic text-sm rounded-2xl shadow-md">
            {t('تتبع الطلب', 'Track Order')}
          </Button>
        </form>
      </div>

      {/* Error state */}
      {errorMsg && searched && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 max-w-2xl mx-auto text-center font-arabic text-rose-800 mb-8 animate-fade-in">
          <AlertCircle size={28} className="text-rose-500 mx-auto mb-2" />
          <p className="font-bold text-sm mb-1">{t('عذراً، لم يتم العثور على الطلب', 'Order not found')}</p>
          <p className="text-xs text-rose-600">{errorMsg}</p>
        </div>
      )}

      {/* Order Details Result */}
      {order && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-gray-200/80 dark:border-slate-800 overflow-hidden animate-slide-up transition-colors">
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-royal to-royal-dark text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-200 text-xs font-arabic">{t('رقم الطلب:', 'Order #:')}</span>
                <span className="font-english font-bold text-lg tracking-wider">{order.order_number}</span>
              </div>
              <p className="text-xs text-blue-200 font-arabic">
                {t('تاريخ الطلب:', 'Ordered on:')} {formatDate(order.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-blue-200 font-arabic">{t('المبلغ المطلوب عند الاستلام:', 'Total COD:')}</span>
              <span className="text-xl sm:text-2xl font-extrabold text-white font-english bg-white/10 px-4 py-1.5 rounded-xl border border-white/20">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Visual Step Progress Tracker */}
            {order.status !== 'cancelled' ? (
              <div className="bg-gray-50/80 dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-200/80 dark:border-slate-700">
                <h3 className="font-bold text-gray-950 dark:text-white font-arabic text-sm mb-6 text-center">
                  {t('مراحل تجهيز وتوصيل طلبكِ', 'Order Journey')}
                </h3>

                <div className="grid grid-cols-4 gap-2 relative">
                  {/* Background Progress Bar */}
                  <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 dark:bg-slate-700 -z-0">
                    <div
                      className="h-full bg-royal dark:bg-blue-400 transition-all duration-700"
                      style={{
                        width: currentStep === 1 ? '12%' : currentStep === 2 ? '38%' : currentStep === 3 ? '68%' : '100%'
                      }}
                    />
                  </div>

                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                      currentStep >= 1 ? 'bg-royal text-white ring-4 ring-royal/20' : 'bg-gray-200 dark:bg-slate-700 text-gray-400'
                    }`}>
                      <CheckCircle2 size={18} />
                    </div>
                    <span className="font-arabic font-bold text-[11px] sm:text-xs text-gray-950 dark:text-white mt-2">
                      {t('استلام الطلب', 'Order Placed')}
                    </span>
                    <span className="font-arabic text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                      currentStep >= 2 ? 'bg-amber-500 text-white ring-4 ring-amber-400/20' : 'bg-gray-200 dark:bg-slate-700 text-gray-400'
                    }`}>
                      <PackageCheck size={18} />
                    </div>
                    <span className="font-arabic font-bold text-[11px] sm:text-xs text-gray-950 dark:text-white mt-2">
                      {t('التجهيز', 'Crafting')}
                    </span>
                    <span className="font-arabic text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                      {currentStep >= 2 ? t('بالمشغل', 'In Progress') : t('قيد الانتظار', 'Pending')}
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                      currentStep >= 3 ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20' : 'bg-gray-200 dark:bg-slate-700 text-gray-400'
                    }`}>
                      <Truck size={18} />
                    </div>
                    <span className="font-arabic font-bold text-[11px] sm:text-xs text-gray-950 dark:text-white mt-2">
                      {t('مع المندوب', 'Shipped')}
                    </span>
                    <span className="font-arabic text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                      {currentStep >= 3 ? t('في الطريق', 'On Way') : t('التالي', 'Next')}
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                      currentStep >= 4 ? 'bg-teal-600 text-white ring-4 ring-teal-500/20' : 'bg-gray-200 dark:bg-slate-700 text-gray-400'
                    }`}>
                      <Sparkles size={18} />
                    </div>
                    <span className="font-arabic font-bold text-[11px] sm:text-xs text-gray-950 dark:text-white mt-2">
                      {t('تم الاستلام ✓', 'Delivered ✓')}
                    </span>
                    <span className="font-arabic text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                      {currentStep >= 4 ? t('استلم بنجاح ✓', 'Delivered ✓') : t('الوصول', 'Final')}
                    </span>
                  </div>
                </div>

                {/* Delivered celebration alert */}
                {order.status === 'delivered' && (
                  <div className="mt-6 p-4 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 flex items-center gap-3 font-arabic animate-fade-in">
                    <Sparkles size={22} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-xs sm:text-sm">
                        {t('تم استلام الفستان وتسليم الطلب بنجاح! 👗✨', 'Your dress has been delivered successfully! 👗✨')}
                      </p>
                      <p className="text-[11px] sm:text-xs text-teal-700 dark:text-teal-300 mt-0.5">
                        {t('سعداء جداً بخدمتكِ ونتمنى أن تتألقي به دائماً في أجمل مناسباتكِ.', 'Delighted to serve you. Wishing you royal moments!')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 font-arabic">
                <AlertCircle size={22} className="text-rose-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">{t('تم إلغاء هذا الطلب', 'Order Cancelled')}</p>
                  <p className="text-xs text-rose-600 mt-0.5">{t('تم إلغاء الطلب بناءً على رغبتك أو للتواصل المباشر.', 'This order was cancelled.')}</p>
                </div>
              </div>
            )}

            {/* Delivery Address & Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-100 text-xs sm:text-sm font-arabic">
              <div>
                <span className="text-gray-400 block mb-1">{t('اسم المستلم:', 'Customer:')}</span>
                <span className="font-bold text-gray-900">{order.customer_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">{t('رقم الهاتف:', 'Phone:')}</span>
                <span className="font-english font-bold text-royal" dir="ltr">{order.phone}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">{t('المحافظة / المدينة:', 'City:')}</span>
                <span className="font-medium text-gray-800">{order.city}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">{t('طريقة الدفع:', 'Payment:')}</span>
                <span className="font-bold text-emerald-700">{t('الدفع عند الاستلام (COD)', 'Cash on Delivery')}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-400 block mb-1">{t('العنوان المسجل للتوصيل:', 'Address:')}</span>
                <span className="text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200 block">{order.address}</span>
              </div>
            </div>

            {/* Items in this Order */}
            <div>
              <h3 className="font-bold text-gray-900 font-arabic text-sm sm:text-base mb-3">
                {t('المنتجات في هذا الطلب', 'Items in this order')}
              </h3>

              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                {order.order_items.map(item => {
                  const skuCode = item.product_id ? formatProductSku(getProductSku({ id: item.product_id, sku: (item.product as any)?.sku })) : ''
                  return (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-arabic font-bold text-gray-900 text-sm">{item.product_name}</p>
                          {skuCode && (
                            <span className="text-[11px] font-english font-bold text-royal bg-royal/5 px-2 py-0.5 rounded border border-royal/10">
                              {skuCode}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 text-xs text-gray-500 font-arabic mt-1">
                          {item.size === 'مقاس خاص' ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <Scissors size={12} />
                              <span>{t('تفصيل بمقاس خاص', 'Custom Tailored')}</span>
                            </span>
                          ) : (
                            item.size && <span className="bg-gray-100 px-2 py-0.5 rounded">{t('المقاس:', 'Size:')} {item.size}</span>
                          )}
                          {item.color && <span className="bg-gray-100 px-2 py-0.5 rounded">{t('اللون:', 'Color:')} {item.color}</span>}
                        </div>
                      </div>
                      <div className="text-left font-english">
                        <span className="text-xs text-gray-500">{item.quantity} × {formatPrice(item.unit_price)} = </span>
                        <span className="font-bold text-royal font-arabic">{formatPrice(item.quantity * item.unit_price)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Support Action */}
            <div className="bg-royal/5 rounded-2xl p-5 border border-royal/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-right">
                <p className="font-bold text-gray-900 font-arabic text-sm">{t('هل تودين تعديل موعد التسليم أو لديكِ استفسار؟', 'Need assistance with your delivery?')}</p>
                <p className="text-xs text-gray-500 font-arabic">{t('فريق خدمة عميلات R&A Couture في خدمتكِ على مدار الساعة عبر الواتساب.', 'Our support team is ready on WhatsApp.')}</p>
              </div>

              <a
                href={`https://wa.me/${waNumber || '201004590848'}?text=${encodeURIComponent(`أهلاً R&A Couture 🌸 أود الاستفسار عن طلبي رقم: ${order.order_number}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-arabic text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
              >
                <MessageCircle size={16} />
                <span>{t('تواصل سريع عبر واتساب', 'WhatsApp Support')}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
