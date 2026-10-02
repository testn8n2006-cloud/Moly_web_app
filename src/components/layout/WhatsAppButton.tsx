import { MessageCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

export function WhatsAppButton() {
  const { t } = useLanguage()
  const { data: waNumber } = useQuery({
    queryKey: ['whatsapp-number'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_number').single()
      return data?.value || ''
    },
    staleTime: 1000 * 60 * 30,
  })

  if (!waNumber) return null

  return (
    <a
      href={`https://wa.me/${waNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:bg-green-600 transition-all duration-200"
      aria-label={t('تواصل معنا على واتساب', 'Contact us on WhatsApp')}
    >
      <MessageCircle size={28} className="text-white" fill="white" />
    </a>
  )
}
