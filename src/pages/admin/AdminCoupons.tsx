import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import type { Coupon } from '@/lib/types'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  code: '',
  type: 'percent' as 'percent' | 'fixed',
  value: 10,
  expires_at: '',
  usage_limit: '',
  is_active: true,
}

export default function AdminCoupons() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Coupon[]
    },
  })

  async function handleSave() {
    if (!form.code) { toast.error('يرجى إدخال الكود'); return }
    setSaving(true)
    const { error } = await supabase.from('coupons').insert({
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      expires_at: form.expires_at || null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      is_active: form.is_active,
    })
    if (error) {
      toast.error(error.message.includes('unique') ? 'هذا الكود موجود مسبقاً' : error.message)
      setSaving(false)
      return
    }
    toast.success('تم إضافة الكوبون')
    qc.invalidateQueries({ queryKey: ['admin-coupons'] })
    setForm({ ...EMPTY_FORM })
    setShowForm(false)
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('coupons').update({ is_active: !current }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['admin-coupons'] })
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('تم حذف الكوبون')
    qc.invalidateQueries({ queryKey: ['admin-coupons'] })
    setDeleteId(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-900 font-arabic text-lg">كودات الخصم</h2>
            <p className="text-sm text-gray-500 font-arabic">{coupons?.length || 0} كوبون</p>
          </div>
          <Button onClick={() => { setForm({ ...EMPTY_FORM }); setShowForm(true) }} className="gap-2 font-arabic">
            <Plus size={18} />
            إضافة كوبون
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['الكود', 'النوع', 'القيمة', 'الاستخدام', 'تاريخ الانتهاء', 'الحالة', ''].map(h => (
                    <th key={h} className="text-right px-4 py-3 font-arabic text-gray-600 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))}
                {coupons?.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-english font-bold text-royal tracking-widest text-sm">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-arabic text-gray-600">
                      {coupon.type === 'percent' ? 'نسبة مئوية' : 'قيمة ثابتة'}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {coupon.type === 'percent' ? `${coupon.value}%` : `${coupon.value} ج.م`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.used_count}
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' / ∞'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {coupon.expires_at ? formatDate(coupon.expires_at) : 'بدون انتهاء'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(coupon.id, coupon.is_active)}>
                        <Badge variant={coupon.is_active ? 'success' : 'danger'}>
                          {coupon.is_active ? 'نشط' : 'معطل'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteId(coupon.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isLoading && !coupons?.length && (
            <div className="text-center py-12 text-gray-400 font-arabic">لا توجد كودات خصم</div>
          )}
        </div>

        {/* Add Form Modal */}
        <Modal open={showForm} onClose={() => setShowForm(false)} title="إضافة كوبون جديد" size="sm">
          <div className="space-y-4">
            <Input
              label="كود الخصم"
              required
              value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
              placeholder="WELCOME10"
              hint="سيتم تحويله تلقائياً لأحرف كبيرة"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-arabic">نوع الخصم</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value as 'percent' | 'fixed' }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-arabic bg-white focus:outline-none focus:ring-2 focus:ring-royal/40"
              >
                <option value="percent">نسبة مئوية (%)</option>
                <option value="fixed">قيمة ثابتة (ج.م)</option>
              </select>
            </div>
            <Input
              label={form.type === 'percent' ? 'النسبة (%)' : 'القيمة (ج.م)'}
              type="number"
              required
              value={form.value}
              onChange={e => setForm(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
              hint={form.type === 'percent' ? 'أدخلي النسبة (1-100)' : 'أدخلي القيمة بالجنيه'}
            />
            <Input
              label="تاريخ الانتهاء (اختياري)"
              type="date"
              value={form.expires_at}
              onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
            />
            <Input
              label="حد الاستخدام (اختياري)"
              type="number"
              value={form.usage_limit}
              onChange={e => setForm(p => ({ ...p, usage_limit: e.target.value }))}
              hint="اتركيه فارغاً للاستخدام غير المحدود"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.is_active ? 'bg-royal' : 'bg-gray-300'} relative`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_active ? 'right-0.5' : 'left-0.5'}`} />
              </button>
              <span className="text-sm font-arabic text-gray-700">{form.is_active ? 'نشط' : 'معطل'}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button fullWidth onClick={handleSave} loading={saving} className="font-arabic">إضافة</Button>
              <Button variant="outline" fullWidth onClick={() => setShowForm(false)} className="font-arabic">إلغاء</Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirm */}
        <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="تأكيد الحذف" size="sm">
          <p className="font-arabic text-gray-700 mb-5">هل تريدين حذف هذا الكوبون نهائياً؟</p>
          <div className="flex gap-3">
            <Button variant="danger" fullWidth onClick={() => deleteId && handleDelete(deleteId)} className="font-arabic">حذف</Button>
            <Button variant="outline" fullWidth onClick={() => setDeleteId(null)} className="font-arabic">إلغاء</Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  )
}
