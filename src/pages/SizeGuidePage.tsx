import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { Skeleton } from '@/components/ui/SkeletonLoader'
import { Ruler } from 'lucide-react'

const WOMEN_SIZES = [
  { size: 'XS', bust: '80', waist: '60', hips: '86', eu: '34' },
  { size: 'S',  bust: '84', waist: '64', hips: '90', eu: '36' },
  { size: 'M',  bust: '88', waist: '68', hips: '94', eu: '38' },
  { size: 'L',  bust: '92', waist: '72', hips: '98', eu: '40' },
  { size: 'XL', bust: '96', waist: '76', hips: '102', eu: '42' },
  { size: 'XXL',bust: '100',waist: '80', hips: '106', eu: '44' },
]

const KIDS_SIZES = [
  { size: '2-3Y',  height: '92-98',  chest: '55' },
  { size: '4-5Y',  height: '104-110', chest: '59' },
  { size: '6-7Y',  height: '116-122', chest: '63' },
  { size: '8-9Y',  height: '128-134', chest: '67' },
  { size: '10-11Y',height: '140-146', chest: '71' },
  { size: '12-13Y',height: '152-158', chest: '75' },
]

export default function SizeGuidePage() {
  const { t } = useLanguage()

  const { data: content, isLoading } = useQuery({
    queryKey: ['size-guide-page'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', 'size_guide')
        .single()
      return data
    },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-3">
        <Ruler size={28} className="text-royal" />
        <h1 className="text-3xl font-bold text-gray-900 font-arabic">{t('دليل المقاسات', 'Size Guide')}</h1>
      </div>
      <p className="text-gray-500 mb-10 font-arabic">
        {t('ابحثي عن مقاسك المثالي بسهولة', 'Find your perfect size easily')}
      </p>

      {/* How to Measure Tip */}
      <div className="bg-royal/5 border border-royal/20 rounded-2xl p-5 mb-8">
        <h3 className="font-bold text-royal mb-2 font-arabic">{t('كيف تأخذين مقاساتك؟', 'How to take your measurements?')}</h3>
        <ul className="text-sm text-gray-700 font-arabic space-y-1 list-disc list-inside">
          <li>{t('قيسي الصدر: حول الجزء الأعلى والأوسع من الصدر', 'Bust: Around the fullest part of your chest')}</li>
          <li>{t('قيسي الخصر: حول أضيق جزء في خصرك', 'Waist: Around the narrowest part of your waist')}</li>
          <li>{t('قيسي الأرداف: حول الجزء الأعرض من الوركين', 'Hips: Around the widest part of your hips')}</li>
          <li>{t('استخدمي شريط قياس مرن للحصول على نتائج دقيقة', 'Use a flexible measuring tape for accurate results')}</li>
        </ul>
      </div>

      {/* Women Sizes */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 font-arabic">{t('مقاسات النساء (سم)', "Women's Sizes (cm)")}</h2>
        <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-royal text-white">
                <th className="px-4 py-3 text-right font-arabic">{t('المقاس', 'Size')}</th>
                <th className="px-4 py-3 text-center font-arabic">{t('EU', 'EU')}</th>
                <th className="px-4 py-3 text-center font-arabic">{t('الصدر', 'Bust')}</th>
                <th className="px-4 py-3 text-center font-arabic">{t('الخصر', 'Waist')}</th>
                <th className="px-4 py-3 text-center font-arabic">{t('الأرداف', 'Hips')}</th>
              </tr>
            </thead>
            <tbody>
              {WOMEN_SIZES.map((row, i) => (
                <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-bold font-english text-royal">{row.size}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.eu}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.bust}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.waist}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kids Sizes */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 font-arabic">{t('مقاسات الأطفال (سم)', "Kids' Sizes (cm)")}</h2>
        <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-royal text-white">
                <th className="px-4 py-3 text-right font-arabic">{t('المقاس / العمر', 'Size / Age')}</th>
                <th className="px-4 py-3 text-center font-arabic">{t('الطول (سم)', 'Height (cm)')}</th>
                <th className="px-4 py-3 text-center font-arabic">{t('محيط الصدر (سم)', 'Chest (cm)')}</th>
              </tr>
            </thead>
            <tbody>
              {KIDS_SIZES.map((row, i) => (
                <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-bold font-english text-royal">{row.size}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.height}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.chest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DB content */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : content && (
        <div className="bg-gray-50 rounded-2xl p-6">
          <p className="text-gray-700 whitespace-pre-line font-arabic text-sm leading-relaxed">
            {t(content.value_ar || '', content.value_en || '')}
          </p>
        </div>
      )}
    </div>
  )
}
