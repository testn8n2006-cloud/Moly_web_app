import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useState } from 'react'
import { X } from 'lucide-react'

export function PromoBar() {
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(false)

  const { data: content } = useQuery({
    queryKey: ['promo-bar'],
    queryFn: async () => {
      const { data } = await supabase.from('site_content').select('*').eq('key', 'promo_bar').single()
      return data
    },
    staleTime: 1000 * 60 * 5,
  })

  if (dismissed || !content) return null

  const text = t(content.value_ar || '', content.value_en || '')
  if (!text) return null

  return (
    <div className="bg-royal text-white text-center py-2 px-8 text-sm font-arabic relative">
      <span>{text}</span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded p-0.5 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
