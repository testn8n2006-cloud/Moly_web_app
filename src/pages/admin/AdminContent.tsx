import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { compressImage } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ContentField {
  key: string
  labelAr: string
  type: 'text' | 'textarea' | 'url'
  hasImage?: boolean
  rows?: number
}

const CONTENT_FIELDS: ContentField[] = [
  { key: 'promo_bar', labelAr: 'شريط العروض (أعلى الصفحة)', type: 'text' },
  { key: 'hero_title', labelAr: 'عنوان البانر الرئيسي', type: 'text', hasImage: true },
  { key: 'hero_subtitle', labelAr: 'وصف البانر الرئيسي', type: 'text' },
  { key: 'hero_button_text', labelAr: 'نص زر البانر', type: 'text' },
  { key: 'hero_button_link', labelAr: 'رابط زر البانر', type: 'url' },
  { key: 'category_women_card', labelAr: 'صورة وبطاقة تشكيلة النساء (الصفحة الرئيسية)', type: 'text', hasImage: true },
  { key: 'category_kids_card', labelAr: 'صورة وبطاقة تشكيلة الأطفال (الصفحة الرئيسية)', type: 'text', hasImage: true },
  { key: 'about_content', labelAr: 'محتوى صفحة عن المتجر', type: 'textarea', hasImage: true, rows: 6 },
  { key: 'shipping_policy', labelAr: 'سياسة الشحن والإرجاع', type: 'textarea', rows: 5 },
  { key: 'size_guide', labelAr: 'دليل المقاسات (ملاحظات إضافية)', type: 'textarea', rows: 5 },
  { key: 'footer_about', labelAr: 'نص الفوتر', type: 'text' },
  { key: 'social_instagram', labelAr: 'رابط انستغرام', type: 'url' },
  { key: 'social_facebook', labelAr: 'رابط فيسبوك', type: 'url' },
  { key: 'social_tiktok', labelAr: 'رابط تيك توك', type: 'url' },
]

interface LocalEntry {
  ar: string
  en: string
  img: string
}

export default function AdminContent() {
  const qc = useQueryClient()
  const [localEdits, setLocalEdits] = useState<Record<string, LocalEntry>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  const { data: content } = useQuery({
    queryKey: ['admin-site-content'],
    queryFn: async () => {
      const { data } = await supabase.from('site_content').select('*')
      return Object.fromEntries((data || []).map(r => [r.key, r]))
    },
  })

  function getField(key: string, field: keyof LocalEntry): string {
    if (localEdits[key]?.[field] !== undefined) return localEdits[key][field]
    const row = content?.[key]
    if (!row) return ''
    if (field === 'ar') return row.value_ar || ''
    if (field === 'en') return row.value_en || ''
    return row.image_url || ''
  }

  function setField(key: string, field: keyof LocalEntry, value: string) {
    setLocalEdits(prev => {
      const current = prev[key] || {
        ar: getField(key, 'ar'),
        en: getField(key, 'en'),
        img: getField(key, 'img'),
      }
      return {
        ...prev,
        [key]: {
          ...current,
          [field]: value,
        },
      }
    })
  }

  async function handleImageUpload(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingKey(key)
    try {
      const compressed = await compressImage(file, 1600, 0.85)
      const fileName = `content-${key}-${Date.now()}.webp`
      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, compressed, { contentType: 'image/webp', upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(data.path)
      setField(key, 'img', urlData.publicUrl)
      toast.success('تم رفع الصورة')
    } catch (err) {
      toast.error('فشل رفع الصورة')
    } finally {
      setUploadingKey(null)
      e.target.value = ''
    }
  }

  async function handleSave() {
    const keysToSave = Object.keys(localEdits)
    if (keysToSave.length === 0) { toast.error('لا توجد تغييرات'); return }
    setSaving(true)
    for (const key of keysToSave) {
      const vals = localEdits[key]
      await supabase.from('site_content').upsert({
        key,
        value_ar: vals.ar,
        value_en: vals.en,
        image_url: vals.img || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
    }
    qc.invalidateQueries({ queryKey: ['admin-site-content'] })
    setLocalEdits({})
    toast.success('تم حفظ المحتوى')
    setSaving(false)
  }

  const hasChanges = Object.keys(localEdits).length > 0

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 font-arabic">{hasChanges ? `${Object.keys(localEdits).length} حقل معدّل` : 'لا توجد تغييرات'}</p>
        </div>

        {CONTENT_FIELDS.map(({ key, labelAr, type, hasImage, rows }) => (
          <div key={key} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-950 dark:text-white font-arabic text-base">{labelAr}</h3>
              {localEdits[key] && (
                <span className="w-2.5 h-2.5 bg-royal dark:bg-blue-400 rounded-full animate-pulse" title="معدّل" />
              )}
            </div>
            <div className="space-y-4">
              {/* Arabic */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 mb-1.5 block font-arabic">عربي</label>
                {type === 'textarea' ? (
                  <textarea
                    rows={rows || 4}
                    value={getField(key, 'ar')}
                    onChange={e => setField(key, 'ar', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-950 dark:text-white rounded-xl font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-royal/40 resize-none transition-colors"
                    dir="rtl"
                  />
                ) : (
                  <input
                    value={getField(key, 'ar')}
                    onChange={e => setField(key, 'ar', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-950 dark:text-white rounded-xl font-arabic text-sm focus:outline-none focus:ring-2 focus:ring-royal/40 transition-colors"
                    dir={type === 'url' ? 'ltr' : 'rtl'}
                  />
                )}
              </div>

              {/* English */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 mb-1.5 block">English</label>
                {type === 'textarea' ? (
                  <textarea
                    rows={rows || 4}
                    value={getField(key, 'en')}
                    onChange={e => setField(key, 'en', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal/40 resize-none transition-colors"
                    dir="ltr"
                  />
                ) : (
                  <input
                    value={getField(key, 'en')}
                    onChange={e => setField(key, 'en', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-950 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal/40 transition-colors"
                    dir="ltr"
                  />
                )}
              </div>

              {/* Image Upload */}
              {hasImage && (
                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 mb-2 block font-arabic">صورة</label>
                  {getField(key, 'img') && (
                    <div className="relative mb-2 group">
                      <img
                        src={getField(key, 'img')}
                        alt=""
                        className="h-28 w-full object-cover rounded-xl"
                      />
                      <a
                        href={getField(key, 'img')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 left-2 bg-white/90 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink size={14} className="text-gray-600" />
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm text-gray-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                      <ImageIcon size={16} />
                      <span className="font-arabic text-xs font-medium">{uploadingKey === key ? 'جاري الرفع...' : 'رفع صورة'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={e => handleImageUpload(key, e)}
                        disabled={uploadingKey === key}
                        className="hidden"
                      />
                    </label>
                    {getField(key, 'img') && (
                      <button
                        onClick={() => setField(key, 'img', '')}
                        className="text-xs text-red-500 hover:text-red-700 font-arabic font-medium"
                      >
                        إزالة الصورة
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Sticky Save */}
        <div className={`sticky bottom-4 transition-all ${hasChanges ? 'opacity-100 translate-y-0' : 'opacity-50'}`}>
          <Button
            fullWidth
            size="lg"
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            className="font-arabic gap-2 shadow-xl"
          >
            <Save size={18} />
            {hasChanges ? `حفظ ${Object.keys(localEdits).length} تغيير` : 'حفظ التغييرات'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
