import { useState, useEffect } from 'react'
import { X, Scissors, Sparkles, HelpCircle, Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import type { CustomMeasurements } from '@/lib/types'
import toast from 'react-hot-toast'

interface CustomMeasurementsModalProps {
  open: boolean
  onClose: () => void
  onSave: (measurements: CustomMeasurements) => void
  initialValues?: CustomMeasurements | null
  productName?: string
}

const DEFAULT_MEASUREMENTS: CustomMeasurements = {
  shoulder: '',
  chest: '',
  waist: '',
  hips: '',
  sleeve: '',
  arm: '',
  wrist: '',
  length: '',
  notes: '',
}

export function CustomMeasurementsModal({
  open,
  onClose,
  onSave,
  initialValues,
  productName,
}: CustomMeasurementsModalProps) {
  const { t } = useLanguage()
  const [form, setForm] = useState<CustomMeasurements>(DEFAULT_MEASUREMENTS)
  const [showTips, setShowTips] = useState(false)

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setForm(initialValues)
      } else {
        setForm(DEFAULT_MEASUREMENTS)
      }
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, initialValues])

  if (!open) return null

  function handleChange(field: keyof CustomMeasurements, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate that numbers are filled
    const requiredFields: Array<{ key: keyof CustomMeasurements; label: string }> = [
      { key: 'shoulder', label: 'عرض الكتف' },
      { key: 'chest', label: 'دوران الصدر' },
      { key: 'waist', label: 'دوران الوسط' },
      { key: 'hips', label: 'دوران الأرداف' },
      { key: 'sleeve', label: 'طول الكم' },
      { key: 'arm', label: 'دوران الذراع' },
      { key: 'wrist', label: 'دوران المعصم' },
      { key: 'length', label: 'طول الموديل' },
    ]

    for (const item of requiredFields) {
      const val = form[item.key]?.trim()
      if (!val) {
        toast.error(`يرجى إدخال قياس: ${item.label}`)
        return
      }
      const num = parseFloat(val)
      if (isNaN(num) || num <= 0) {
        toast.error(`يرجى إدخال رقم صحيح لـ: ${item.label}`)
        return
      }
    }

    onSave(form)
    toast.success(t('تم حفظ مقاساتكِ الخاصة بنجاح ✨', 'Custom measurements saved successfully!'))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0c1836]/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0c1836] via-royal to-[#102048] p-5 sm:p-6 text-white flex-shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center flex-shrink-0">
              <Scissors size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold font-arabic">
                  {t('تفصيل بمقاساتكِ الخاصة (Haute Couture)', 'Custom Bespoke Tailoring')}
                </h2>
                <Sparkles size={16} className="text-amber-300" />
              </div>
              <p className="text-blue-100 text-xs sm:text-sm font-arabic mt-0.5">
                {productName ? `${productName} — ` : ''}
                {t('فريق أتيليه R&A سيقوم بتفصيل هذا الموديل خصيصاً على مقاساتكِ', 'Handmade to your exact body measurements')}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {/* Guide Banner */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm font-arabic">
                <Info size={16} className="text-amber-700 flex-shrink-0" />
                <span>{t('جميع القياسات تُقاس بالسنتيمتر (cm) باستخدام مازورة مرنة', 'All measurements in centimeters (cm)')}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTips(!showTips)}
                className="text-xs text-amber-800 font-bold underline font-arabic flex items-center gap-1 flex-shrink-0 hover:text-amber-950"
              >
                <HelpCircle size={14} />
                <span>{showTips ? t('إخفاء الإرشادات', 'Hide Tips') : t('إرشادات القياس', 'Measurement Tips')}</span>
              </button>
            </div>

            {showTips && (
              <div className="mt-3 pt-3 border-t border-amber-200/70 text-xs text-amber-900 font-arabic space-y-1.5 animate-fade-in leading-relaxed">
                <p>• <strong>عرض الكتف:</strong> من عظمة طرف الكتف الأيمن حتى عظمة طرف الكتف الأيسر عبر الظهر مستقيماً.</p>
                <p>• <strong>دوران الصدر:</strong> مرري المازورة حول أعرض نقطة في الصدر والظهر بشكل دائري متوازن.</p>
                <p>• <strong>دوران الوسط (الخصر):</strong> حول أضيق منطقة في البطن أعلى السرة بحوالي 2-3 سم.</p>
                <p>• <strong>دوران الأرداف (الهانش):</strong> حول أعرض منطقة في محيط الأرداف والمازورة حرة وغير مشدودة.</p>
                <p>• <strong>طول الكم:</strong> من بداية مفصل الكتف حتى نهاية عظمة معصم اليد.</p>
                <p>• <strong>طول الموديل:</strong> من أعلى نقطة في الكتف عند الرقبة مستقيماً إلى الأسفل حتى الطول المطلوب للفستان.</p>
              </div>
            )}
          </div>

          {/* Measurements Fields Grid */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-arabic mb-3">
              {t('القياسات الأساسية (بالسنتيمتر):', 'Required Body Measurements (cm):')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* 1. عرض الكتف */}
              <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80 focus-within:border-royal focus-within:bg-white transition-colors">
                <label className="block text-xs font-bold text-gray-800 font-arabic mb-1">
                  1. {t('عرض الكتف (سم)', 'Shoulder Width (cm)')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="20"
                  max="70"
                  required
                  value={form.shoulder}
                  onChange={e => handleChange('shoulder', e.target.value)}
                  placeholder="مثلاً: 40"
                  className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-sm font-english focus:outline-none focus:ring-1 focus:ring-royal"
                />
                <p className="text-[11px] text-gray-400 font-arabic mt-1">من عظمة الكتف للأخرى عبر الظهر</p>
              </div>

              {/* 2. دوران الصدر */}
              <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80 focus-within:border-royal focus-within:bg-white transition-colors">
                <label className="block text-xs font-bold text-gray-800 font-arabic mb-1">
                  2. {t('دوران الصدر (سم)', 'Bust / Chest Circumference (cm)')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="40"
                  max="160"
                  required
                  value={form.chest}
                  onChange={e => handleChange('chest', e.target.value)}
                  placeholder="مثلاً: 96"
                  className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-sm font-english focus:outline-none focus:ring-1 focus:ring-royal"
                />
                <p className="text-[11px] text-gray-400 font-arabic mt-1">محيط كامل حول أعرض نقطة في الصدر</p>
              </div>

              {/* 3. دوران الوسط */}
              <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80 focus-within:border-royal focus-within:bg-white transition-colors">
                <label className="block text-xs font-bold text-gray-800 font-arabic mb-1">
                  3. {t('دوران الوسط / الخصر (سم)', 'Waist Circumference (cm)')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="40"
                  max="150"
                  required
                  value={form.waist}
                  onChange={e => handleChange('waist', e.target.value)}
                  placeholder="مثلاً: 76"
                  className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-sm font-english focus:outline-none focus:ring-1 focus:ring-royal"
                />
                <p className="text-[11px] text-gray-400 font-arabic mt-1">محيط أضيق منطقة فوق السرة</p>
              </div>

              {/* 4. دوران الأرداف */}
              <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80 focus-within:border-royal focus-within:bg-white transition-colors">
                <label className="block text-xs font-bold text-gray-800 font-arabic mb-1">
                  4. {t('دوران الأرداف / الهانش (سم)', 'Hips Circumference (cm)')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="50"
                  max="180"
                  required
                  value={form.hips}
                  onChange={e => handleChange('hips', e.target.value)}
                  placeholder="مثلاً: 104"
                  className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-sm font-english focus:outline-none focus:ring-1 focus:ring-royal"
                />
                <p className="text-[11px] text-gray-400 font-arabic mt-1">محيط أعرض منطقة في الهانش</p>
              </div>

              {/* 5. طول الكم */}
              <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80 focus-within:border-royal focus-within:bg-white transition-colors">
                <label className="block text-xs font-bold text-gray-800 font-arabic mb-1">
                  5. {t('طول الكم (سم)', 'Sleeve Length (cm)')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="20"
                  max="90"
                  required
                  value={form.sleeve}
                  onChange={e => handleChange('sleeve', e.target.value)}
                  placeholder="مثلاً: 60"
                  className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-sm font-english focus:outline-none focus:ring-1 focus:ring-royal"
                />
                <p className="text-[11px] text-gray-400 font-arabic mt-1">من عظمة الكتف حتى المعصم</p>
              </div>

              {/* 6. دوران الذراع */}
              <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80 focus-within:border-royal focus-within:bg-white transition-colors">
                <label className="block text-xs font-bold text-gray-800 font-arabic mb-1">
                  6. {t('دوران الذراع / الزند (سم)', 'Upper Arm Circumference (cm)')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="15"
                  max="70"
                  required
                  value={form.arm}
                  onChange={e => handleChange('arm', e.target.value)}
                  placeholder="مثلاً: 32"
                  className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-sm font-english focus:outline-none focus:ring-1 focus:ring-royal"
                />
                <p className="text-[11px] text-gray-400 font-arabic mt-1">محيط أعرض جزء في الذراع من الأعلى</p>
              </div>

              {/* 7. دوران المعصم */}
              <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80 focus-within:border-royal focus-within:bg-white transition-colors">
                <label className="block text-xs font-bold text-gray-800 font-arabic mb-1">
                  7. {t('دوران المعصم / الإسورة (سم)', 'Wrist Circumference (cm)')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="10"
                  max="40"
                  required
                  value={form.wrist}
                  onChange={e => handleChange('wrist', e.target.value)}
                  placeholder="مثلاً: 18"
                  className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-sm font-english focus:outline-none focus:ring-1 focus:ring-royal"
                />
                <p className="text-[11px] text-gray-400 font-arabic mt-1">محيط المعصم عند مفصل اليد</p>
              </div>

              {/* 8. طول الموديل */}
              <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-200/80 focus-within:border-royal focus-within:bg-white transition-colors">
                <label className="block text-xs font-bold text-gray-800 font-arabic mb-1">
                  8. {t('طول الموديل / الفستان (سم)', 'Total Garment Length (cm)')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="50"
                  max="200"
                  required
                  value={form.length}
                  onChange={e => handleChange('length', e.target.value)}
                  placeholder="مثلاً: 145"
                  className="w-full bg-white px-3 py-2 border border-gray-200 rounded-xl text-sm font-english focus:outline-none focus:ring-1 focus:ring-royal"
                />
                <p className="text-[11px] text-gray-400 font-arabic mt-1">من أعلى الكتف حتى نهاية الفستان المطلوب</p>
              </div>
            </div>
          </div>

          {/* Tailoring Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-800 font-arabic mb-1.5">
              {t('ملاحظات خاصة للتفصيل (اختياري):', 'Custom Tailoring Notes (Optional):')}
            </label>
            <textarea
              rows={2}
              value={form.notes || ''}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder={t(
                'مثال: تفضيل قصة فضفاضة قليلاً، تقفيل فتحة الصدر، إضافة بطانة داخلية كاملة، أو أي تعديل خاص...',
                'e.g. looser fit preference, modest neckline closure, full lining...'
              )}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-xs sm:text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-royal/30 resize-none bg-gray-50/50 focus:bg-white"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Button
              type="submit"
              size="lg"
              fullWidth
              className="font-arabic py-3.5 text-sm font-bold shadow-md hover:shadow-lg bg-royal hover:bg-royal-dark text-white flex items-center justify-center gap-2"
            >
              <Check size={18} />
              <span>{t('تأكيد وحفظ المقاسات الخاصة', 'Save & Confirm Measurements')}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onClose}
              className="font-arabic text-sm px-6"
            >
              {t('إلغاء', 'Cancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
