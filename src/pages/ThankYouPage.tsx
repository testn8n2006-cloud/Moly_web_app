import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  CheckCircle, MessageCircle, Home, Package, Truck,
  ShieldCheck, Check
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

interface ThankYouState {
  orderNumber?: string
  total?: number
  customerName?: string
  phone?: string
  city?: string
  address?: string
  waNumber?: string
  waMsg?: string
}

export default function ThankYouPage() {
  const { t } = useLanguage()
  const location = useLocation()
  const state = location.state as ThankYouState | null
  const [confirmed, setConfirmed] = useState(false)

  function openWhatsApp() {
    const num = state?.waNumber || '201004590848'
    if (state?.waMsg) {
      window.open(`https://wa.me/${num}?text=${state.waMsg}`, '_blank')
      setConfirmed(true)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-16 text-center">
      {/* Success Icon */}
      <div className="relative mx-auto w-24 h-24 mb-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-fade-in shadow-inner">
          <CheckCircle size={52} className="text-green-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-9 h-9 bg-royal rounded-full flex items-center justify-center shadow-md">
          <Package size={17} className="text-white" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 font-arabic">
        {t('تم تسجيل طلبكِ بنجاح! 👗✨', 'Order Submitted Successfully! 👗✨')}
      </h1>
      <p className="text-gray-500 font-arabic text-sm mb-6">
        {t('شكراً لثقتكِ بـ R&A Couture للأزياء الراقية', 'Thank you for shopping at R&A Couture')}
      </p>

      {/* Verification Card (Anti-Fake Order Assurance) */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border-2 border-amber-300/80 rounded-3xl p-5 sm:p-6 mb-6 text-right shadow-sm relative overflow-hidden animate-slide-up">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="font-extrabold text-amber-950 font-arabic text-base sm:text-lg">
              {confirmed
                ? t('تم إرسال تأكيد الحجز بنجاح! ✓', 'Reservation Confirmed! ✓')
                : t('خطوة أخيرة: تأكيد الحجز والجدية عبر واتساب', 'Final Step: Confirm Order via WhatsApp')}
            </h2>
            <p className="text-amber-800 text-xs sm:text-sm font-arabic mt-1 leading-relaxed">
              {confirmed
                ? t('سعداء جداً بتأكيدكِ! جاري تحضير الفستان في المشغل وسنوافيكِ بموعد خروج الشحنة مع المندوب.', 'Thank you! Your dress is being prepared at our atelier.')
                : t('لضمان عدم حجز الفستان لطلبات غير جادّة ولسرعة إرساله للمشغل فوراً، يرجى الضغط أدناه لتأكيد رغبتكِ بالاستلام.', 'To secure your dress size and avoid cancellation, please confirm your delivery on WhatsApp.')}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {state?.waNumber && (
          <div className="mt-4">
            <Button
              fullWidth
              size="lg"
              onClick={openWhatsApp}
              className={`font-arabic py-3.5 sm:py-4 text-base rounded-2xl gap-2 font-bold shadow-md transition-all ${
                confirmed
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
              }`}
            >
              {confirmed ? <Check size={20} /> : <MessageCircle size={22} />}
              {confirmed
                ? t('فتح المحادثة مجدداً على واتساب 💬', 'Open WhatsApp Chat Again 💬')
                : t('اضغطي هنا لتأكيد رغبتك بالاستلام عبر واتساب 💬', 'Click to Confirm Your Order on WhatsApp 💬')}
            </Button>
            {!confirmed && (
              <p className="text-[11px] text-amber-700 text-center font-arabic mt-2">
                {t('⚡ يفتح محادثة واتساب جاهزة برقم طلبكِ لإرسالها بضغطة واحدة', '⚡ Opens ready WhatsApp message with your order number')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Order Summary Snapshot */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs mb-6 text-right font-arabic">
        <h3 className="font-bold text-gray-900 text-sm mb-4 border-b border-gray-100 pb-3 flex items-center justify-between">
          <span>{t('تفاصيل الطلب المسجل:', 'Order Summary:')}</span>
          {state?.orderNumber && (
            <span className="font-english text-royal font-extrabold text-base tracking-wider">
              {state.orderNumber}
            </span>
          )}
        </h3>

        <div className="space-y-2.5 text-xs sm:text-sm">
          {state?.customerName && (
            <div className="flex justify-between items-center text-gray-700">
              <span className="text-gray-400">{t('اسم العميلة:', 'Customer:')}</span>
              <span className="font-bold text-gray-900">{state.customerName}</span>
            </div>
          )}

          {state?.phone && (
            <div className="flex justify-between items-center text-gray-700">
              <span className="text-gray-400">{t('رقم الهاتف:', 'Phone:')}</span>
              <span className="font-english font-medium text-gray-900" dir="ltr">{state.phone}</span>
            </div>
          )}

          {state?.city && (
            <div className="flex justify-between items-center text-gray-700">
              <span className="text-gray-400">{t('المحافظة والعنوان:', 'Address:')}</span>
              <span className="font-medium text-gray-900 text-left">{state.city} - {state.address}</span>
            </div>
          )}

          {state?.total !== undefined && (
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 font-bold">
              <span className="text-gray-700">{t('المبلغ عند الاستلام:', 'Total COD:')}</span>
              <span className="text-base sm:text-lg text-royal font-english font-extrabold">
                {formatPrice(state.total)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="space-y-3">
        {state?.orderNumber && (
          <Link to={`/track-order?order=${state.orderNumber}`}>
            <Button fullWidth variant="outline" size="lg" className="font-arabic gap-2 border-royal text-royal hover:bg-royal hover:text-white rounded-2xl transition-colors">
              <Truck size={18} />
              {t('تتبعي حالة طلبكِ لايف من هنا 🚚', 'Track Your Order Live 🚚')}
            </Button>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link to="/">
            <Button fullWidth variant="secondary" size="md" className="font-arabic gap-1.5 rounded-2xl text-xs sm:text-sm">
              <Home size={16} />
              {t('الرئيسية', 'Home')}
            </Button>
          </Link>

          <Link to="/women">
            <Button fullWidth variant="ghost" size="md" className="font-arabic text-royal hover:bg-royal/10 rounded-2xl text-xs sm:text-sm">
              {t('تسوق المزيد 🛍️', 'Shop More 🛍️')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
