import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X, CheckCircle2, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export interface RealSocialProofAlert {
  id: string
  customer_name: string
  city: string
  product_id?: string
  product_name: string
  product_image?: string
  time_ago?: string
  is_active: boolean
  created_at: string
}

export function SocialProofPopup() {
  const location = useLocation()
  const [alerts, setAlerts] = useState<RealSocialProofAlert[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Load only REAL alerts configured by Admin
  useEffect(() => {
    async function loadRealAlerts() {
      // 1. Try Supabase settings table
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'social_proof_alerts')
          .single()

        if (data?.value) {
          const parsed = JSON.parse(data.value)
          if (Array.isArray(parsed)) {
            const active = parsed.filter((a: RealSocialProofAlert) => a.is_active)
            setAlerts(active)
            localStorage.setItem('ra_social_proof_alerts', JSON.stringify(parsed))
            return
          }
        }
      } catch {
        // Table or key fallback
      }

      // 2. Try localStorage fallback
      const saved = localStorage.getItem('ra_social_proof_alerts')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            const active = parsed.filter((a: RealSocialProofAlert) => a.is_active)
            setAlerts(active)
          }
        } catch {
          setAlerts([])
        }
      } else {
        setAlerts([])
      }
    }

    loadRealAlerts()
  }, [])

  useEffect(() => {
    // Disable on checkout, thank-you, and admin pages
    if (
      location.pathname.startsWith('/admin') ||
      location.pathname === '/checkout' ||
      location.pathname === '/thank-you'
    ) {
      setVisible(false)
      return
    }

    // Zero fake data: if no real alerts configured by admin, do not run or pop up anything
    if (alerts.length === 0 || dismissed) {
      setVisible(false)
      return
    }

    let hideTimeout: ReturnType<typeof setTimeout>
    let nextTimeout: ReturnType<typeof setTimeout>

    function triggerPopup() {
      if (dismissed || alerts.length === 0) return

      setVisible(true)

      // Hide after 6 seconds
      hideTimeout = setTimeout(() => {
        setVisible(false)
        // Cycle to next alert
        setCurrentIndex(prev => (prev + 1) % alerts.length)
        // Wait 35 to 50 seconds before next popup
        const delay = 35000 + Math.random() * 15000
        nextTimeout = setTimeout(triggerPopup, delay)
      }, 6000)
    }

    // Initial popup delay: 9 seconds after opening
    const initialTimer = setTimeout(triggerPopup, 9000)

    return () => {
      clearTimeout(initialTimer)
      clearTimeout(hideTimeout)
      clearTimeout(nextTimeout)
    }
  }, [alerts, location.pathname, dismissed])

  // If no alerts exist, or closed, or invisible: RENDER ABSOLUTELY NOTHING
  if (!visible || alerts.length === 0 || dismissed) return null

  const currentAlert = alerts[currentIndex] || alerts[0]
  if (!currentAlert) return null

  const linkTarget = currentAlert.product_id ? `/product/${currentAlert.product_id}` : '/women'

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm w-[calc(100vw-2.5rem)] sm:w-auto animate-slide-up">
      <div className="bg-white/95 backdrop-blur-md border border-royal/15 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3.5 relative group hover:border-royal transition-all duration-300 font-arabic">
        {/* Close Button */}
        <button
          onClick={e => {
            e.stopPropagation()
            setVisible(false)
            setDismissed(true)
          }}
          className="absolute -top-2 -left-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs transition-colors shadow-sm"
          title="إغلاق"
          aria-label="إغلاق"
        >
          <X size={12} />
        </button>

        {/* Thumbnail */}
        <Link to={linkTarget} className="flex-shrink-0">
          <div className="w-14 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
            {currentAlert.product_image ? (
              <img
                src={currentAlert.product_image}
                alt={currentAlert.product_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-royal/40">
                <ShoppingBag size={20} />
              </div>
            )}
          </div>
        </Link>

        {/* Real Info Content */}
        <Link to={linkTarget} className="flex-1 min-w-0 block">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mb-0.5">
            <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
            <span>
              {currentAlert.customer_name} {currentAlert.city ? `من ${currentAlert.city}` : ''} اشترت للتو
            </span>
          </div>

          <p className="font-bold text-gray-900 text-xs truncate group-hover:text-royal transition-colors">
            {currentAlert.product_name}
          </p>

          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
            <span>{currentAlert.time_ago || 'طلب حقيقي مؤكد'}</span>
            <span className="text-royal font-semibold">عرض الموديل ←</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
