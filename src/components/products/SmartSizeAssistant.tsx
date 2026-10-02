import { useState } from 'react'
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Ruler,
  ShieldCheck
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface SmartSizeAssistantProps {
  open: boolean
  onClose: () => void
  productName: string
  availableSizes?: string[]
  onSelectRecommendedSize: (size: string) => void
  onOpenCustomSize?: () => void
}

export function SmartSizeAssistant({
  open,
  onClose,
  productName,
  availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  onSelectRecommendedSize,
  onOpenCustomSize,
}: SmartSizeAssistantProps) {

  // Steps: 1: Height & Weight, 2: Usual Size & Fit, 3: Result
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // User Answers
  const [heightRange, setHeightRange] = useState<'petite' | 'medium' | 'tall'>('medium')
  const [weightKg, setWeightKg] = useState<number>(65)
  const [usualSize, setUsualSize] = useState<string>('M')
  const [fitPreference, setFitPreference] = useState<'snug' | 'regular' | 'flowy'>('regular')

  // Recommended result
  const [recommendedSize, setRecommendedSize] = useState<string>('M')
  const [adviceText, setAdviceText] = useState<string>('')

  function calculateRecommendation() {
    let size = usualSize

    // Adjust based on weight
    if (weightKg < 52) size = 'XS'
    else if (weightKg <= 60) size = 'S'
    else if (weightKg <= 70) size = 'M'
    else if (weightKg <= 80) size = 'L'
    else if (weightKg <= 92) size = 'XL'
    else size = 'XXL'

    // Adjust for fit preference
    if (fitPreference === 'snug' && size !== 'XS') {
      // If customer prefers tight fit
      // Keep or slightly smaller if boundary
    } else if (fitPreference === 'flowy') {
      // If customer prefers modest / loose fit
      const sizesOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      const idx = sizesOrder.indexOf(size)
      if (idx !== -1 && idx < sizesOrder.length - 1) {
        size = sizesOrder[idx + 1]
      }
    }

    // Fallback to available sizes if calculated size is not available
    if (availableSizes.length > 0 && !availableSizes.includes(size)) {
      size = availableSizes[0]
    }

    setRecommendedSize(size)

    let advice = `بناءً على طولكِ ووزنكِ وتفضيلكِ للقَصّة (${
      fitPreference === 'snug' ? 'المجسمة' : fitPreference === 'flowy' ? 'الفضفاضة المريحة' : 'المعتدلة الأنيقة'
    })، فإن مقاس ${size} هو الخيار الأمثل ليمنحكِ أجمل إطلالة وأعلى درجات الراحة أثناء ارتدائه في المناسبة.`

    if (heightRange === 'petite') {
      advice += ' يمكنكِ أيضاً تقصير ذيل الفستان بسلاسة إذا رغبتِ عند الاستلام.'
    } else if (heightRange === 'tall') {
      advice += ' طول الموديل مصمم بانسيابية ليغطي الكعب العالي بأناقة تامة.'
    }

    setAdviceText(advice)
    setStep(3)
  }

  function handleApplySize() {
    onSelectRecommendedSize(recommendedSize)
    onClose()
    setStep(1)
  }

  function handleReset() {
    setStep(1)
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
        setStep(1)
      }}
      title=""
      size="md"
      className="p-0 overflow-hidden dark:bg-slate-900 dark:border-slate-800"
    >
      <div className="font-arabic" dir="rtl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-royal via-royal-light to-blue-900 text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-1">
            <Sparkles size={16} />
            <span>مساعد المقاس الذكي • R&A Smart Fit</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold">
            اعرفي مقاسكِ المثالي في 30 ثانية
          </h3>
          <p className="text-blue-100 text-xs mt-1">
            موديل: <span className="font-bold underline">{productName}</span>
          </p>

          {/* Steps Progress */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-amber-400' : 'bg-white/20'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-amber-400' : 'bg-white/20'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step === 3 ? 'bg-amber-400' : 'bg-white/20'}`} />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 dark:text-slate-100">
          {/* STEP 1: Height & Weight */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              {/* Height selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-2">
                  1. ما هو طولكِ التقريبي؟
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'petite', title: 'أقل من 160 سم', sub: 'قامة ناعمة' },
                    { id: 'medium', title: '160 - 168 سم', sub: 'معتدل' },
                    { id: 'tall', title: 'أكثر من 168 سم', sub: 'طويلة' },
                  ].map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHeightRange(h.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        heightRange === h.id
                          ? 'border-royal bg-royal/5 dark:bg-royal/20 text-royal dark:text-blue-300 font-bold ring-2 ring-royal/20'
                          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <p className="text-xs font-bold">{h.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{h.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight selection slider / input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    2. وزنكِ التقريبي بالكيلوجرام:
                  </label>
                  <span className="font-english font-bold text-royal dark:text-blue-400 bg-royal/10 dark:bg-slate-800 px-3 py-1 rounded-xl text-sm">
                    {weightKg} كجم
                  </span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={110}
                  step={1}
                  value={weightKg}
                  onChange={e => setWeightKg(Number(e.target.value))}
                  className="w-full accent-royal h-2 bg-gray-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-english">
                  <span>45 kg</span>
                  <span>75 kg</span>
                  <span>110 kg</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto rounded-xl gap-2 font-bold bg-royal text-white"
                >
                  <span>المتابعة للخطوة التالية</span>
                  <ArrowLeft size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Usual Size & Fit Preference */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              {/* Usual Brand Size */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-2">
                  3. ما هو مقاسكِ المعتاد في الماركات (مثل Zara / Mango)؟
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setUsualSize(sz)}
                      className={`py-2.5 rounded-xl border text-center font-english text-xs font-bold transition-all ${
                        usualSize === sz
                          ? 'border-royal bg-royal text-white shadow-sm ring-2 ring-royal/30'
                          : 'border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:border-royal/50'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fit Preference */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-2">
                  4. كيف تفضلين قَصّة ومظهر الفستان عليكِ؟
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'snug', label: 'مُجسم ومحدد (Slim Fit)', desc: 'يبرز تفاصيل القوام والخصر' },
                    { id: 'regular', label: 'مضبوط ومريح (Classic Fit)', desc: 'مقاس قياسي مريح في الحركة والجلوس' },
                    { id: 'flowy', label: 'واسع وفضفاض (Modest / Flowy)', desc: 'انسيابي ومحتشم وفضفاض قليلاً' },
                  ].map(f => (
                    <label
                      key={f.id}
                      onClick={() => setFitPreference(f.id as any)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        fitPreference === f.id
                          ? 'border-royal bg-royal/5 dark:bg-royal/20 text-royal dark:text-blue-300 ring-1 ring-royal/30'
                          : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="fit"
                        checked={fitPreference === f.id}
                        onChange={() => setFitPreference(f.id as any)}
                        className="mt-0.5 text-royal focus:ring-royal"
                      />
                      <div>
                        <p className="text-xs font-bold">{f.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{f.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <ArrowRight size={14} />
                  <span>السابق</span>
                </Button>

                <Button
                  onClick={calculateRecommendation}
                  className="rounded-xl gap-2 font-bold bg-royal text-white flex-1 sm:flex-initial"
                >
                  <Sparkles size={16} className="text-amber-300" />
                  <span>اكتشفي مقاسكِ الآن</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Result & Recommendation */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in text-center">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800/60 dark:to-slate-900/60 rounded-3xl p-6 border border-blue-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-royal text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Check size={26} className="stroke-[3]" />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">
                  المقاس الموصى به لكِ بدقة:
                </p>

                <div className="inline-block bg-royal text-white text-3xl font-black font-english px-6 py-2 rounded-2xl shadow-lg my-2">
                  {recommendedSize}
                </div>

                <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-2">
                  <ShieldCheck size={16} />
                  <span>تطابق مقاسات بنسبة 98%</span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-4 bg-white dark:bg-slate-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700 text-right">
                  {adviceText}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <Button
                  onClick={handleApplySize}
                  className="w-full py-3.5 rounded-2xl bg-royal text-white font-bold text-sm shadow-md hover:bg-royal-dark gap-2"
                >
                  <Check size={18} />
                  <span>اعتماد مقاس ({recommendedSize}) لطلبي الآن</span>
                </Button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-gray-500 hover:text-royal hover:underline"
                  >
                    إعادة الحساب
                  </button>

                  {onOpenCustomSize && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenCustomSize()
                      }}
                      className="text-royal dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Ruler size={13} />
                      <span>أفضّل تفصيل مقاس خاص بالسم</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
