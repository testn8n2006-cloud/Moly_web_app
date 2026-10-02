import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { Skeleton } from '@/components/ui/SkeletonLoader'
import { Truck, RefreshCw, Clock, Shield } from 'lucide-react'

export default function ShippingPage() {
  const { t } = useLanguage()

  const { data: content, isLoading } = useQuery({
    queryKey: ['shipping-policy'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', 'shipping_policy')
        .single()
      return data
    },
  })

  const { data: settings } = useQuery({
    queryKey: ['shipping-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['shipping_note', 'default_shipping_fee'])
      return Object.fromEntries((data || []).map(r => [r.key, r.value]))
    },
  })

  const infoCards = [
    {
      icon: Truck,
      titleAr: 'الشحن والتوصيل',
      titleEn: 'Shipping & Delivery',
      descAr: 'يتم التوصيل خلال 2-4 أيام عمل لجميع محافظات مصر',
      descEn: 'Delivery within 2-4 business days to all Egypt governorates',
      bg: 'bg-blue-50',
      iconColor: 'text-royal',
    },
    {
      icon: RefreshCw,
      titleAr: 'الإرجاع والاستبدال',
      titleEn: 'Returns & Exchanges',
      descAr: 'نقبل الإرجاع خلال 7 أيام من الاستلام بشرط أن يكون المنتج بحالته الأصلية',
      descEn: 'Returns accepted within 7 days of receipt in original condition',
      bg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: Clock,
      titleAr: 'وقت المعالجة',
      titleEn: 'Processing Time',
      descAr: 'يتم معالجة الطلبات خلال 1-2 أيام عمل من تأكيد الطلب',
      descEn: 'Orders processed within 1-2 business days of confirmation',
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: Shield,
      titleAr: 'ضمان الجودة',
      titleEn: 'Quality Guarantee',
      descAr: 'نضمن جودة جميع منتجاتنا وسنتواصل معك لحل أي مشكلة',
      descEn: 'We guarantee the quality of all our products and will resolve any issue',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-3 font-arabic">{t('الشحن والإرجاع', 'Shipping & Returns')}</h1>
      <p className="text-gray-500 mb-10 font-arabic">{t('كل ما تحتاجين معرفته عن الشحن والإرجاع', 'Everything you need to know about shipping and returns')}</p>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {infoCards.map((card, i) => (
          <div key={i} className={`${card.bg} rounded-2xl p-6`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <card.icon size={24} className={card.iconColor} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1.5 font-arabic">{t(card.titleAr, card.titleEn)}</h3>
                <p className="text-gray-600 text-sm leading-relaxed font-arabic">{t(card.descAr, card.descEn)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Policy */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 text-xl mb-4 font-arabic">{t('سياسة الشحن الكاملة', 'Full Shipping Policy')}</h2>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : (
          <p className="text-gray-600 leading-loose font-arabic whitespace-pre-line text-sm">
            {t(content?.value_ar || '', content?.value_en || '')}
          </p>
        )}
        {settings?.shipping_note && (
          <div className="mt-4 bg-blue-50 rounded-xl p-4">
            <p className="text-royal text-sm font-arabic">{settings.shipping_note}</p>
          </div>
        )}
      </div>
    </div>
  )
}
