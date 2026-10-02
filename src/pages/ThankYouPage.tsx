import { useLocation, Link } from 'react-router-dom'
import { CheckCircle, MessageCircle, Home, Package, Truck } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

interface ThankYouState {
  orderNumber?: string
  total?: number
  waNumber?: string
  waMsg?: string
}

export default function ThankYouPage() {
  const { t } = useLanguage()
  const location = useLocation()
  const state = location.state as ThankYouState | null

  function openWhatsApp() {
    if (state?.waNumber && state?.waMsg) {
      window.open(`https://wa.me/${state.waNumber}?text=${state.waMsg}`, '_blank')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {/* Success Icon */}
      <div className="relative mx-auto w-28 h-28 mb-8">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center animate-fade-in">
          <CheckCircle size={56} className="text-green-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-10 h-10 bg-royal rounded-full flex items-center justify-center">
          <Package size={18} className="text-white" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3 font-arabic">
        {t('تم استلام طلبك!', 'Order Received!')}
      </h1>

      {state?.orderNumber && (
        <p className="text-gray-600 font-arabic mb-1">
          {t('رقم الطلب', 'Order number')}:{' '}
          <strong className="text-royal font-english text-lg">{state.orderNumber}</strong>
        </p>
      )}

      {state?.total !== undefined && (
        <p className="text-gray-600 font-arabic mb-8">
          {t('إجمالي الطلب', 'Order total')}:{' '}
          <strong className="text-royal">{formatPrice(state.total)}</strong>
        </p>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 text-right">
        <p className="text-sm text-gray-700 font-arabic leading-loose">
          {t(
            'تم إرسال طلبك عبر واتساب. سيتواصل معك فريقنا في أقرب وقت لتأكيد الطلب وترتيب الدفع والشحن. شكراً لثقتك بـ R&A Couture! 💙',
            'Your order was sent via WhatsApp. Our team will contact you shortly to confirm the order and arrange payment and shipping. Thank you for choosing R&A Couture! 💙'
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {state?.waNumber && (
          <Button
            fullWidth
            size="lg"
            onClick={openWhatsApp}
            className="bg-green-600 hover:bg-green-700 font-arabic gap-2"
          >
            <MessageCircle size={22} />
            {t('فتح واتساب للمتابعة', 'Open WhatsApp to Follow Up')}
          </Button>
        )}

        {state?.orderNumber && (
          <Link to={`/track-order?order=${state.orderNumber}`}>
            <Button fullWidth variant="outline" size="lg" className="font-arabic gap-2 border-royal text-royal hover:bg-royal hover:text-white transition-colors">
              <Truck size={18} />
              {t('تتبعي حالة طلبكِ لايف من هنا 🚚', 'Track Your Order Live 🚚')}
            </Button>
          </Link>
        )}

        <Link to="/">
          <Button fullWidth variant="outline" size="lg" className="font-arabic gap-2">
            <Home size={18} />
            {t('العودة للرئيسية', 'Back to Home')}
          </Button>
        </Link>

        <Link to="/women">
          <Button fullWidth variant="ghost" className="font-arabic text-sm">
            {t('تسوق المزيد', 'Continue Shopping')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
