import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bell, Plus, Trash2, CheckCircle2,
  Sparkles, Eye, EyeOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { Product, OrderWithItems } from '@/lib/types'
import toast from 'react-hot-toast'

export interface SocialProofAlertItem {
  id: string
  customer_name: string
  city: string
  product_id: string
  product_name: string
  product_image: string
  time_ago: string
  is_active: boolean
  created_at: string
}

export default function AdminSocialProof() {
  const [alerts, setAlerts] = useState<SocialProofAlertItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  // Form states
  const [formName, setFormName] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formProductId, setFormProductId] = useState('')
  const [formTimeAgo, setFormTimeAgo] = useState('منذ 15 دقيقة')

  // Fetch all store products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['admin-products-for-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_visible', true)
        .order('name_ar', { ascending: true })
      if (error) throw error
      return (data || []) as Product[]
    },
  })

  // Fetch recent real orders (for 1-click import)
  const { data: recentOrders = [] } = useQuery<OrderWithItems[]>({
    queryKey: ['admin-recent-orders-for-alerts'],
    queryFn: async () => {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (ordersError || !ordersData) return []

        const orderIds = ordersData.map(o => o.id)
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds)

        const ordersWithItems = ordersData.map(order => ({
          ...order,
          order_items: (itemsData || []).filter(item => item.order_id === order.id),
        }))

        return ordersWithItems as OrderWithItems[]
      } catch {
        return []
      }
    },
  })

  // Load saved alerts from settings table or localStorage
  useEffect(() => {
    async function loadAlerts() {
      // 1. Check Supabase settings
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'social_proof_alerts')
          .single()

        if (data?.value) {
          const parsed = JSON.parse(data.value)
          if (Array.isArray(parsed)) {
            setAlerts(parsed)
            localStorage.setItem('ra_social_proof_alerts', JSON.stringify(parsed))
            return
          }
        }
      } catch {
        // Table or key not ready yet
      }

      // 2. Check localStorage fallback
      const savedLocal = localStorage.getItem('ra_social_proof_alerts')
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal)
          if (Array.isArray(parsed)) {
            setAlerts(parsed)
          }
        } catch {
          setAlerts([])
        }
      } else {
        setAlerts([])
      }
    }

    loadAlerts()
  }, [])

  // Persist alerts helper
  async function persistAlerts(updated: SocialProofAlertItem[]) {
    setAlerts(updated)
    const jsonStr = JSON.stringify(updated)
    localStorage.setItem('ra_social_proof_alerts', jsonStr)

    // Save to Supabase settings
    try {
      await supabase.from('settings').upsert({
        key: 'social_proof_alerts',
        value: jsonStr,
        updated_at: new Date().toISOString(),
      })
    } catch (err) {
      console.warn('Settings upsert fallback:', err)
    }
  }

  // Add new real alert
  async function handleAddAlert(e: React.FormEvent) {
    e.preventDefault()

    if (!formProductId) {
      toast.error('يرجى اختيار المنتج')
      return
    }
    if (!formName.trim()) {
      toast.error('يرجى كتابة اسم العميلة')
      return
    }

    const selectedProduct = products.find(p => p.id === formProductId)
    if (!selectedProduct) return

    const newAlert: SocialProofAlertItem = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      customer_name: formName.trim(),
      city: formCity.trim() || 'القاهرة',
      product_id: selectedProduct.id,
      product_name: selectedProduct.name_ar,
      product_image: selectedProduct.images?.[0] || '',
      time_ago: formTimeAgo || 'منذ قليل',
      is_active: true,
      created_at: new Date().toISOString(),
    }

    const updated = [newAlert, ...alerts]
    await persistAlerts(updated)

    toast.success('تمت إضافة إشعار الشراء الحقيقي بنجاح ✓')
    setShowAddModal(false)
    setFormName('')
    setFormCity('')
    setFormProductId('')
  }

  // 1-Click Import from real order
  async function handleImportFromOrder(order: OrderWithItems) {
    const firstItem = order.order_items?.[0]
    const prod = products.find(p => p.id === firstItem?.product_id) || products[0]

    const newAlert: SocialProofAlertItem = {
      id: `alert-ord-${order.id.slice(0, 8)}`,
      customer_name: order.customer_name,
      city: order.city,
      product_id: prod?.id || '',
      product_name: firstItem?.product_name || prod?.name_ar || 'فستان سهرة',
      product_image: prod?.images?.[0] || '',
      time_ago: 'طلب حقيقي مؤكد',
      is_active: true,
      created_at: order.created_at,
    }

    // Check if duplicate
    if (alerts.some(a => a.id === newAlert.id)) {
      toast.error('تمت إضافة هذا الطلب من قبل')
      return
    }

    const updated = [newAlert, ...alerts]
    await persistAlerts(updated)
    toast.success(`تم تحويل طلب العميلة "${order.customer_name}" إلى إشعار حي بنجاح!`)
  }

  // Toggle active
  async function handleToggleActive(id: string) {
    const updated = alerts.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a)
    await persistAlerts(updated)
  }

  // Delete alert
  async function handleDeleteAlert(id: string) {
    if (!confirm('هل تريد حذف هذا الإشعار؟')) return
    const updated = alerts.filter(a => a.id !== id)
    await persistAlerts(updated)
    toast.success('تم حذف الإشعار')
  }

  const activeCount = alerts.filter(a => a.is_active).length

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto font-arabic">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="text-royal" size={26} />
              <span>إدارة إشعارات الشراء الحيّة (Social Proof)</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              تحكم بالكامل في إشعارات الشراء المنبثقة للزوار وأضف عميلات حقيقيات من طلباتك فقط
            </p>
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-2 bg-royal hover:bg-royal-dark text-white rounded-xl py-2.5 px-5 shadow-sm"
          >
            <Plus size={18} />
            <span>إضافة إشعار عميلة حقيقي</span>
          </Button>
        </div>

        {/* Zero Fake Guarantee Banner */}
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 mb-8 flex items-start gap-3.5">
          <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-emerald-950 text-sm">ضمان الشفافية والبيانات الحقيقية 100%:</h4>
            <p className="text-xs text-emerald-900 leading-relaxed">
              تم إلغاء توليد أي أسماء أو مدن عشوائية. إذا كانت هذه القائمة فارغة أو إذا قمت بإيقاف تفعيل الإشعارات، <strong>فلن يظهر أي إشعار عائم في واجهة المتجر نهائياً</strong>. الإشعارات تظهر فقط للعميلات الحقيقيات اللاتي تضيفهن أنت هنا أو تقوم باستيرادهن من أحدث الطلبات.
            </p>
          </div>
        </div>

        {/* 1-Click Import Section from Real Orders */}
        {recentOrders.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>استيراد سريع من أحدث طلبيات المتجر الحقيقية</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  هذه طلبيات قام بها عملاء فعليون، يمكنك تحويل أي منها لإشعار حي بضغطة زر واحدة:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentOrders.slice(0, 6).map(order => {
                const isImported = alerts.some(a => a.id === `alert-ord-${order.id.slice(0, 8)}`)
                const firstItem = order.order_items?.[0]

                return (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3"
                  >
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs text-gray-900 truncate">
                        {order.customer_name} ({order.city})
                      </p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        اشترت: {firstItem?.product_name || 'فستان'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleImportFromOrder(order)}
                      disabled={isImported}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
                        isImported
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-royal text-white hover:bg-royal-dark shadow-xs'
                      }`}
                    >
                      {isImported ? 'مُضاف ✓' : '+ إضافة كإشعار'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Current Active Alerts List */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                قائمة الإشعارات الحالية ({alerts.length})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                النشط حالياً: <span className="font-bold text-emerald-600">{activeCount}</span> من أصل {alerts.length}
              </p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Bell size={28} />
              </div>
              <h4 className="font-bold text-gray-800 text-base mb-1">لا توجد إشعارات مضافة حالياً</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
                المتجر حالياً نظيف تماماً ولن يعرض أي إشعارات منبثقة للزوار حتى تقوم بإضافة عميلاتكِ الحقيقيات هنا.
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                variant="outline"
                className="rounded-xl text-xs gap-1.5"
              >
                <Plus size={14} /> إضافة إشعار الآن
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    item.is_active
                      ? 'border-gray-200 bg-white hover:border-royal/40'
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt=""
                        className="w-12 h-14 object-cover rounded-xl border border-gray-200 shadow-xs flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                        فستان
                      </div>
                    )}

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{item.customer_name}</span>
                        <span className="text-xs text-gray-400">• {item.city}</span>
                        {item.is_active ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            نشط الآن
                          </span>
                        ) : (
                          <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                            متوقف
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        اشترت: <span className="font-bold text-royal">{item.product_name}</span> ({item.time_ago})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        item.is_active
                          ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-100'
                      }`}
                      title={item.is_active ? 'إيقاف مؤقت' : 'تفعيل'}
                    >
                      {item.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      <span className="hidden sm:inline">{item.is_active ? 'ظاهر' : 'مخفي'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteAlert(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Add Real Alert */}
        <Modal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="إضافة إشعار شراء لعميلة حقيقية"
          size="md"
        >
          <form onSubmit={handleAddAlert} className="space-y-4 font-arabic">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                اختيار الفستان الذي تم شراؤه <span className="text-red-500">*</span>
              </label>
              <select
                value={formProductId}
                onChange={e => setFormProductId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-royal/40"
              >
                <option value="">-- اختاري الفستان من المتجر --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name_ar} ({p.price} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="اسم العميلة الحقيقية"
                placeholder="مثال: نورهان الشريف"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
              />
              <Input
                label="المدينة أو المنطقة"
                placeholder="مثال: المعادي أو الشيخ زايد"
                value={formCity}
                onChange={e => setFormCity(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                توقيت الطلب (النص المعروض):
              </label>
              <select
                value={formTimeAgo}
                onChange={e => setFormTimeAgo(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-royal/40"
              >
                <option value="منذ 5 دقائق">منذ 5 دقائق</option>
                <option value="منذ 15 دقيقة">منذ 15 دقيقة</option>
                <option value="منذ نصف ساعة">منذ نصف ساعة</option>
                <option value="منذ ساعتين">منذ ساعتين</option>
                <option value="اليوم">اليوم</option>
                <option value="أمس">أمس</option>
                <option value="طلب حقيقي مؤكد">طلب حقيقي مؤكد</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
              <Button
                type="submit"
                className="flex-1 rounded-xl bg-royal text-white font-bold"
              >
                حفظ وإضافة للإشعارات الحية
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  )
}
