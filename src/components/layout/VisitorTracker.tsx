import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getDeviceId, getDeviceInfo } from '@/lib/device'

export function VisitorTracker() {
  const location = useLocation()
  const { user } = useAuth()
  const hasTrackedToday = useRef(false)

  useEffect(() => {
    // 1. Do not count internal admin routes as customer traffic
    if (location.pathname.startsWith('/admin')) return

    // 2. Prevent counting the same person multiple times per day (no re-counting on refresh or navigation)
    const todayStr = new Date().toISOString().split('T')[0]
    const visitKey = `ra_visited_day_${todayStr}`

    if (hasTrackedToday.current || localStorage.getItem(visitKey)) {
      return
    }

    hasTrackedToday.current = true
    localStorage.setItem(visitKey, 'true')

    const deviceId = getDeviceId()
    const visitorId = user?.id || deviceId
    const deviceInfo = getDeviceInfo()

    async function trackUniqueVisitor() {
      try {
        await supabase.rpc('record_page_view', {
          p_path: location.pathname,
          p_visitor_id: visitorId,
        })
      } catch {
        // Fallback to direct table insert
        try {
          await supabase.from('page_views').insert({
            page_path: location.pathname,
            visitor_id: visitorId,
            device_type: deviceInfo.deviceType,
            browser_info: deviceInfo.summaryAr,
          })
        } catch {
          // Fallback if extra columns don't exist yet
          try {
            await supabase.from('page_views').insert({
              page_path: location.pathname,
              visitor_id: visitorId,
            })
          } catch {
            // Silent catch to prevent any user impact
          }
        }
      }
    }

    trackUniqueVisitor()
  }, [location.pathname, user?.id])

  return null
}
