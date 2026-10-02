import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Shield, AlertCircle, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminAdmins() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admin-admins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  async function handleDelete(userId: string) {
    if (userId === user?.id) {
      toast.error('لا يمكنك حذف نفسك من قائمة المشرفين')
      setDeleteId(null)
      return
    }
    const { error } = await supabase.from('admins').delete().eq('user_id', userId)
    if (error) { toast.error(error.message); return }
    toast.success('تم إزالة المشرف')
    qc.invalidateQueries({ queryKey: ['admin-admins'] })
    setDeleteId(null)
  }

  function copyUserId() {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('تم نسخ الـ User ID')
    }
  }

  const addAdminSQL = `-- أضفي هذا الأمر في Supabase SQL Editor:\nINSERT INTO admins (user_id)\nVALUES ('USER_ID_HERE');\n\n-- أو لإضافة مستخدم بريده الإلكتروني:\nINSERT INTO admins (user_id)\nSELECT id FROM auth.users\nWHERE email = 'admin@example.com';`

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-5">
        {/* My Account Info */}
        <div className="bg-royal rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={22} className="text-blue-200" />
            <h2 className="font-bold font-arabic">حسابك الحالي</h2>
          </div>
          <p className="text-blue-100 text-sm font-arabic mb-1">البريد: {user?.email || 'بدون بريد (جلسة مجهولة)'}</p>
          {user?.id && (
            <div className="flex items-center gap-2 mt-2">
              <code className="text-xs text-blue-200 font-english bg-white/10 px-2 py-1 rounded flex-1 truncate">
                {user.id}
              </code>
              <button onClick={copyUserId} className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* How to Add Admin */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 mb-2 font-arabic">كيفية إضافة مشرف جديد</h3>
              <ol className="text-sm text-amber-800 font-arabic space-y-1 list-decimal list-inside leading-relaxed">
                <li>افتحي Supabase Dashboard → Authentication → Users</li>
                <li>أنشئي مستخدماً جديداً بالبريد وكلمة المرور</li>
                <li>انسخي الـ User ID من القائمة</li>
                <li>الصقيه في SQL Editor كما يلي:</li>
              </ol>
              <div className="mt-3 bg-amber-900/10 rounded-xl p-3">
                <code className="text-xs font-english text-amber-900 whitespace-pre-wrap block leading-relaxed">
                  {addAdminSQL}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Admins Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 font-arabic">قائمة المشرفين</h2>
            <p className="text-gray-500 text-sm font-arabic mt-0.5">{admins?.length || 0} مشرف</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">User ID</th>
                  <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">تاريخ الإضافة</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && Array.from({ length: 2 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
                {admins?.map(admin => (
                  <tr key={admin.user_id} className={`hover:bg-gray-50 ${admin.user_id === user?.id ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="font-english text-xs text-gray-600 truncate max-w-xs">
                          {admin.user_id}
                        </code>
                        {admin.user_id === user?.id && (
                          <span className="text-xs bg-royal text-white px-2 py-0.5 rounded-full font-arabic">أنت</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-arabic">
                      {formatDate(admin.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {admin.user_id !== user?.id && (
                        <button
                          onClick={() => setDeleteId(admin.user_id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="إزالة المشرف"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isLoading && !admins?.length && (
            <div className="text-center py-10 text-gray-400 font-arabic">لا يوجد مشرفون</div>
          )}
        </div>

        {/* Delete Confirm */}
        <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="تأكيد الإزالة" size="sm">
          <p className="font-arabic text-gray-700 mb-5">هل تريدين إزالة صلاحيات هذا المشرف؟ لن يتمكن من الوصول للوحة التحكم بعد ذلك.</p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              fullWidth
              onClick={() => deleteId && handleDelete(deleteId)}
              className="font-arabic"
            >
              إزالة
            </Button>
            <Button variant="outline" fullWidth onClick={() => setDeleteId(null)} className="font-arabic">
              إلغاء
            </Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  )
}
