import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'

export function PromoBar() {
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(false)

  const { data: content } = useQuery({
    queryKey: ['promo-bar'],
    queryFn: async () => {
      const { data } = await supabase.from('site_content').select('*').eq('key', 'promo_bar').maybeSingle()
      return data
    },
    staleTime: 1000 * 60 * 5,
  })

  if (dismissed || !content) return null

  const text = t(content.value_ar || '', content.value_en || '')
  if (!text) return null

  return (
    <div className="bg-gradient-to-r from-royal-dark via-royal to-blue-950 text-white text-center py-2 px-8 text-xs sm:text-sm font-arabic relative shadow-inner z-50 border-b border-white/10">
      <div className="flex items-center justify-center gap-2">
        <Sparkles size={14} className="text-amber-300 animate-pulse flex-shrink-0" />
        <span className="font-semibold tracking-wide leading-relaxed">{text}</span>
        <Sparkles size={14} className="text-amber-300 animate-pulse flex-shrink-0 hidden sm:inline" />
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
        aria-label="إغلاق الشريط"
        title="إغلاق"
      >
        <X size={14} />
      </button>
    </div>
  )
}
