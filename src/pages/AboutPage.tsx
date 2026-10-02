import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { Skeleton } from '@/components/ui/SkeletonLoader'
import { Shield, Star, Truck, Heart } from 'lucide-react'

export default function AboutPage() {
  const { t } = useLanguage()

  const { data: content, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', 'about_content')
        .single()
      return data
    },
  })

  const values = [
    {
      icon: Star,
      titleAr: 'جودة استثنائية',
      titleEn: 'Exceptional Quality',
      descAr: 'نختار أفضل الخامات والتصاميم لتقديم تجربة استثنائية',
      descEn: 'We select the finest fabrics and designs to deliver an exceptional experience',
    },
    {
      icon: Heart,
      titleAr: 'شغف بالموضة',
      titleEn: 'Passion for Fashion',
      descAr: 'حب حقيقي للأزياء يدفعنا لتقديم الأفضل دائماً',
      descEn: 'A genuine love for fashion drives us to always deliver our best',
    },
    {
      icon: Shield,
      titleAr: 'ثقة واطمئنان',
      titleEn: 'Trust & Confidence',
      descAr: 'رضا عميلاتنا هو أولويتنا القصوى في كل خطوة',
      descEn: 'Our customers\' satisfaction is our top priority at every step',
    },
    {
      icon: Truck,
      titleAr: 'توصيل سريع',
      titleEn: 'Fast Delivery',
      descAr: 'نوصل طلبك لباب منزلك في أسرع وقت ممكن',
      descEn: 'We deliver your order to your doorstep as quickly as possible',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-royal to-blue-800 text-white py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 font-arabic">{t('عن R&A Couture', 'About R&A Couture')}</h1>
        <p className="text-blue-100 text-lg max-w-xl mx-auto font-arabic">
          {t('أزياء راقية لكل امرأة ناجحة', 'Elegant fashion for every successful woman')}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        {/* Story */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-arabic">{t('قصتنا', 'Our Story')}</h2>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : (
              <p className="text-gray-600 leading-relaxed font-arabic text-base">
                {t(content?.value_ar || '', content?.value_en || '')}
              </p>
            )}
          </div>
          <div className="rounded-3xl overflow-hidden shadow-xl">
            <img
              src={content?.image_url || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800'}
              alt="About R&A Couture"
              className="w-full h-72 object-cover"
            />
          </div>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center font-arabic">{t('قيمنا', 'Our Values')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-royal/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <v.icon size={24} className="text-royal" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 font-arabic text-sm">{t(v.titleAr, v.titleEn)}</h3>
                <p className="text-gray-500 text-xs leading-relaxed font-arabic">{t(v.descAr, v.descEn)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
