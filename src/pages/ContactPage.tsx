import { useLanguage } from '@/contexts/LanguageContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { MessageCircle, Clock } from 'lucide-react'

export default function ContactPage() {
  const { t } = useLanguage()

  const { data: wa } = useQuery({
    queryKey: ['whatsapp-contact'],
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .single()
      return data?.value || ''
    },
  })

  const contactCards = [
    {
      icon: MessageCircle,
      titleAr: 'واتساب',
      titleEn: 'WhatsApp',
      valueAr: wa ? `+${wa}` : '',
      valueEn: wa ? `+${wa}` : '',
      href: wa ? `https://wa.me/${wa}` : undefined,
      bg: 'bg-green-50',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      isExternal: true,
    },
    {
      icon: Clock,
      titleAr: 'ساعات العمل',
      titleEn: 'Working Hours',
      valueAr: 'يومياً من 9ص حتى 11م',
      valueEn: 'Daily 9AM - 11PM',
      bg: 'bg-blue-50',
      iconColor: 'text-royal',
      iconBg: 'bg-blue-100',
      isExternal: false,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 font-arabic">
          {t('اتصلي بنا', 'Contact Us')}
        </h1>
        <p className="text-gray-500 text-lg font-arabic max-w-xl mx-auto">
          {t('نحن هنا لمساعدتك في أي استفسار أو طلب', "We're here to help with any inquiry or request")}
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
        {contactCards.map((card, i) => {
          const content = (
            <div className={`${card.bg} rounded-2xl p-6 flex items-center gap-5 ${card.href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
              <div className={`w-16 h-16 ${card.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                <card.icon size={30} className={card.iconColor} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg font-arabic mb-1">
                  {t(card.titleAr, card.titleEn)}
                </h3>
                <p className={`text-gray-600 text-sm ${i === 0 ? 'font-english' : 'font-arabic'}`}>
                  {t(card.valueAr, card.valueEn)}
                </p>
              </div>
            </div>
          )

          if (card.href) {
            return (
              <a key={i} href={card.href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            )
          }
          return <div key={i}>{content}</div>
        })}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 text-xl mb-6 font-arabic">{t('أسئلة شائعة', 'Frequently Asked Questions')}</h2>
        <div className="space-y-5">
          {[
            {
              qAr: 'كيف يمكنني إتمام طلبي؟',
              qEn: 'How do I complete my order?',
              aAr: 'أضيفي المنتجات لسلة التسوق، ثم اتبعي خطوات الطلب وسيتم التواصل معك عبر واتساب.',
              aEn: 'Add products to your cart, follow the checkout steps, and we\'ll contact you via WhatsApp.',
            },
            {
              qAr: 'ما هي طرق الدفع المتاحة؟',
              qEn: 'What payment methods are available?',
              aAr: 'يتم ترتيب الدفع عبر واتساب بعد تأكيد الطلب - نقبل التحويل البنكي وبطاقات الائتمان.',
              aEn: 'Payment is arranged via WhatsApp after order confirmation - we accept bank transfer and credit cards.',
            },
            {
              qAr: 'كم يستغرق التوصيل؟',
              qEn: 'How long does delivery take?',
              aAr: 'يتم التوصيل خلال 3-5 أيام عمل حسب المدينة.',
              aEn: 'Delivery takes 3-5 business days depending on the city.',
            },
          ].map((faq, i) => (
            <div key={i} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
              <h4 className="font-semibold text-gray-900 mb-1.5 font-arabic">{t(faq.qAr, faq.qEn)}</h4>
              <p className="text-gray-600 text-sm font-arabic leading-relaxed">{t(faq.aAr, faq.aEn)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
