import { Link } from 'react-router-dom'
import { Instagram, Facebook, MessageCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function Footer() {
  const { t } = useLanguage()
  
  const { data: content } = useQuery({
    queryKey: ['site-content-footer'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_content')
        .select('*')
        .in('key', ['footer_about', 'social_instagram', 'social_facebook', 'social_tiktok'])
      return Object.fromEntries((data || []).map(r => [r.key, r]))
    },
    staleTime: 1000 * 60 * 10,
  })

  const { data: waData } = useQuery({
    queryKey: ['settings-wa'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_number').single()
      return data?.value || ''
    },
    staleTime: 1000 * 60 * 10,
  })

  const instagram = content?.social_instagram?.value_ar
  const facebook = content?.social_facebook?.value_ar

  return (
    <footer className="bg-royal dark:bg-[#070e20] text-white mt-20 border-t border-transparent dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.jpg"
                alt="R&A Couture"
                className="w-14 h-14 rounded-full object-cover shadow-md ring-2 ring-white/30"
              />
              <div>
                <p className="font-bold text-xl font-english tracking-wide">R&A Couture</p>
                <p className="text-blue-200 text-sm font-arabic">أزياء وتفصيل راقٍ</p>
              </div>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed font-arabic max-w-sm">
              {content?.footer_about ? t(content.footer_about.value_ar || '', content.footer_about.value_en || '') : 'R&A Couture - أزياء راقية لكل امرأة ناجحة'}
            </p>
            <div className="flex gap-3 mt-4">
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Instagram size={18} />
                </a>
              )}
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Facebook size={18} />
                </a>
              )}
              {waData && (
                <a href={`https://wa.me/${waData}`} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                  <MessageCircle size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4 font-arabic">{t('روابط سريعة', 'Quick Links')}</h3>
            <ul className="space-y-2">
              {[
                { href: '/women', label: t('نساء', 'Women') },
                { href: '/kids', label: t('أطفال', 'Kids') },
                { href: '/favorites', label: t('المفضلة', 'Favorites') },
                { href: '/about', label: t('عن المتجر', 'About Us') },
                { href: '/contact', label: t('اتصل بنا', 'Contact') },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-blue-200 hover:text-white text-sm transition-colors font-arabic">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold mb-4 font-arabic">{t('الدعم', 'Support')}</h3>
            <ul className="space-y-2">
              {[
                { href: '/track-order', label: t('تتبع حالة طلبكِ 🚚', 'Track Your Order 🚚') },
                { href: '/shipping', label: t('الشحن والإرجاع', 'Shipping & Returns') },
                { href: '/size-guide', label: t('دليل المقاسات', 'Size Guide') },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-blue-200 hover:text-white text-sm transition-colors font-arabic">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-blue-200 text-sm font-arabic">
            © {new Date().getFullYear()} R&A Couture. {t('جميع الحقوق محفوظة', 'All rights reserved')}
          </p>

          <p className="text-blue-300 text-xs">
            {t('التواصل عبر واتساب فقط', 'Contact via WhatsApp only')}
          </p>
        </div>
      </div>
    </footer>
  )
}
