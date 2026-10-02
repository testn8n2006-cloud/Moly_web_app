import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const CITY_KEYS = [
  { key: 'shipping_fee_القاهرة', label: 'القاهرة' },
  { key: 'shipping_fee_الجيزة', label: 'الجيزة' },
  { key: 'shipping_fee_الإسكندرية', label: 'الإسكندرية' },
  { key: 'shipping_fee_القليوبية', label: 'القليوبية' },
  { key: 'shipping_fee_الدقهلية', label: 'الدقهلية' },
  { key: 'shipping_fee_الشرقية', label: 'الشرقية' },
  { key: 'shipping_fee_الغربية', label: 'الغربية' },
  { key: 'shipping_fee_المنوفية', label: 'المنوفية' },
  { key: 'shipping_fee_البحيرة', label: 'البحيرة' },
  { key: 'shipping_fee_دمياط', label: 'دمياط' },
  { key: 'shipping_fee_بورسعيد', label: 'بورسعيد' },
  { key: 'shipping_fee_الإسماعيلية', label: 'الإسماعيلية' },
  { key: 'shipping_fee_السويس', label: 'السويس' },
  { key: 'shipping_fee_الفيوم', label: 'الفيوم' },
  { key: 'shipping_fee_بني سويف', label: 'بني سويف' },
  { key: 'shipping_fee_المنيا', label: 'المنيا' },
  { key: 'shipping_fee_أسيوط', label: 'أسيوط' },
  { key: 'shipping_fee_سوهاج', label: 'سوهاج' },
  { key: 'shipping_fee_قنا', label: 'قنا' },
  { key: 'shipping_fee_الأقصر', label: 'الأقصر' },
  { key: 'shipping_fee_أسوان', label: 'أسوان' },
  { key: 'shipping_fee_البحر الأحمر', label: 'البحر الأحمر' },
  { key: 'shipping_fee_مطروح', label: 'مطروح' },
]

export default function AdminSettings() {
  const qc = useQueryClient()
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ['admin-settings-all'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*')
      return Object.fromEntries((data || []).map(s => [s.key, s.value || '']))
    },
  })

  function get(key: string) {
    if (key in localChanges) return localChanges[key]
    return settings?.[key] ?? ''
  }

  function set(key: string, value: string) {
    setLocalChanges(prev => ({ ...prev, [key]: value }))
  }

  async function saveAll() {
    if (Object.keys(localChanges).length === 0) {
      toast.error('لا توجد تغييرات للحفظ')
      return
    }
    setSaving(true)
    for (const [key, value] of Object.entries(localChanges)) {
      await supabase
        .from('settings')
        .upsert({ key, value }, { onConflict: 'key' })
    }
    qc.invalidateQueries({ queryKey: ['admin-settings-all'] })
    setLocalChanges({})
    toast.success('تم حفظ الإعدادات')
    setSaving(false)
  }

  const hasChanges = Object.keys(localChanges).length > 0

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-5 font-arabic text-lg">إعدادات عامة</h2>
          <div className="space-y-4">
            {/* Store Open/Closed Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-arabic">حالة المتجر</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => set('store_open', get('store_open') === 'true' ? 'false' : 'true')}
                  className={`w-14 h-7 rounded-full transition-colors relative flex-shrink-0 ${get('store_open') === 'true' ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-200 ${get('store_open') === 'true' ? 'right-0.5' : 'left-0.5'}`}
                  />
                </button>
                <span className="text-sm font-arabic font-medium">
                  {get('store_open') === 'true' ? (
                    <span className="text-green-600">✓ المتجر مفتوح</span>
                  ) : (
                    <span className="text-red-500">✕ المتجر مغلق</span>
                  )}
                </span>
              </div>
              {get('store_open') === 'false' && (
                <p className="text-xs text-amber-600 mt-1.5 font-arabic">
                  تنبيه: إغلاق المتجر سيمنع العملاء من إتمام الطلبات
                </p>
              )}
            </div>

            <Input
              label="رقم واتساب (مع رمز الدولة، بدون +)"
              value={get('whatsapp_number')}
              onChange={e => set('whatsapp_number', e.target.value)}
              placeholder="201000000000"
              hint="مثال: 201012345678"
            />
            <Input
              label="اسم المتجر"
              value={get('site_name')}
              onChange={e => set('site_name', e.target.value)}
              placeholder="R&A Couture"
            />
            <Input
              label="العملة"
              value={get('currency')}
              onChange={e => set('currency', e.target.value)}
              placeholder="EGP"
              hint="رمز العملة (EGP, USD, EUR...)"
            />
            <Input
              label="الحد الأدنى للطلب (اختياري)"
              type="number"
              value={get('minimum_order')}
              onChange={e => set('minimum_order', e.target.value)}
              hint="أدخلي 0 لعدم وجود حد أدنى"
            />
            <Input
              label="رسوم الشحن الافتراضية (ج.م)"
              type="number"
              value={get('default_shipping_fee')}
              onChange={e => set('default_shipping_fee', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-arabic">ملاحظة الشحن</label>
              <textarea
                rows={2}
                value={get('shipping_note')}
                onChange={e => set('shipping_note', e.target.value)}
                placeholder="مثال: يتم التوصيل خلال 2-4 أيام عمل لجميع المحافظات"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-royal/40 resize-none"
              />
            </div>
          </div>
        </div>

        {/* City Shipping Fees */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-2 font-arabic text-lg">رسوم الشحن حسب المحافظة</h2>
          <p className="text-gray-500 text-sm mb-5 font-arabic">اتركي الحقل فارغاً لاستخدام رسوم الشحن الافتراضية</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CITY_KEYS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-sm font-arabic text-gray-700 w-28 flex-shrink-0">{label}</span>
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="number"
                    value={get(key)}
                    onChange={e => set(key, e.target.value)}
                    placeholder={get('default_shipping_fee') || '50'}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal/40"
                  />
                  <span className="text-xs text-gray-400 font-arabic flex-shrink-0">ج.م</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className={`sticky bottom-4 transition-opacity ${hasChanges ? 'opacity-100' : 'opacity-60'}`}>
          <Button
            fullWidth
            size="lg"
            onClick={saveAll}
            loading={saving}
            disabled={!hasChanges}
            className="font-arabic gap-2 shadow-lg"
          >
            <Save size={18} />
            {hasChanges ? `حفظ ${Object.keys(localChanges).length} تغيير` : 'لا توجد تغييرات'}
          </Button>
          {hasChanges && (
            <button
              onClick={() => setLocalChanges({})}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-2 font-arabic flex items-center justify-center gap-1"
            >
              <RefreshCw size={13} /> تراجع عن التغييرات
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
