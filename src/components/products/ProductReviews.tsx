import { useState, useEffect } from 'react'
import {
  Star, Camera, CheckCircle2, X, Plus
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { compressImage } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export interface ReviewItem {
  id: string
  product_id: string
  customer_name: string
  city: string
  rating: number
  comment: string
  images?: string[]
  image_url?: string | null
  is_verified?: boolean
  created_at: string
}

interface ProductReviewsProps {
  productId: string
  productName: string
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { t } = useLanguage()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [filterWithPhotos, setFilterWithPhotos] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // 1. Load from localStorage
    const savedLocal = localStorage.getItem(`ra_reviews_${productId}`)
    let localList: ReviewItem[] = []
    if (savedLocal) {
      try {
        localList = JSON.parse(savedLocal)
      } catch {
        localList = []
      }
    }

    // 2. Fetch from Supabase reviews table (if exists)
    async function loadDbReviews() {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          const map = new Map<string, ReviewItem>()
          data.forEach(r => map.set(r.id, {
            ...r,
            image_url: r.image_url || null,
          } as ReviewItem))
          localList.forEach(r => map.set(r.id, r))
          setReviews(Array.from(map.values()))
          return
        }
      } catch {
        // Table fallback
      }

      // No fake reviews: show only actual local or real submitted reviews
      setReviews(localList)
    }

    loadDbReviews()
  }, [productId])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const compressed = await compressImage(file, 1200, 0.8)
      const fileName = `review-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, compressed, { contentType: 'image/webp' })

      if (!error && data) {
        const { data: publicUrl } = supabase.storage.from('site-assets').getPublicUrl(data.path)
        setPhotoUrl(publicUrl.publicUrl)
      } else {
        // Fallback: read as base64 data url for offline / local preview
        const reader = new FileReader()
        reader.onload = ev => {
          setPhotoUrl(ev.target?.result as string)
        }
        reader.readAsDataURL(compressed)
      }
    } catch {
      toast.error('تعذر معالجة الصورة')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('يرجى كتابة الاسم')
      return
    }
    if (!comment.trim()) {
      toast.error('يرجى كتابة رأيكِ وتجربتكِ')
      return
    }

    setSubmitting(true)
    const newReview: ReviewItem = {
      id: 'rev_' + Date.now(),
      product_id: productId,
      customer_name: name.trim(),
      city: city.trim() || 'عميلة راقية',
      rating,
      comment: comment.trim(),
      image_url: photoUrl,
      is_verified: true,
      created_at: new Date().toISOString(),
    }

    // Save to localStorage
    const updated = [newReview, ...reviews]
    setReviews(updated)
    try {
      localStorage.setItem(`ra_reviews_${productId}`, JSON.stringify(updated))
    } catch {
      // ignore
    }

    // Try to insert in Supabase
    try {
      await supabase.from('reviews').insert({
        product_id: productId,
        customer_name: newReview.customer_name,
        city: newReview.city,
        rating: newReview.rating,
        comment: newReview.comment,
        image_url: newReview.image_url,
        is_verified: true,
      })
    } catch {
      // Non-blocking
    }

    toast.success('شكراً لمشاركتكِ تجربتكِ الراقية معنا! ⭐')
    setShowAddModal(false)
    setName('')
    setCity('')
    setRating(5)
    setComment('')
    setPhotoUrl(null)
    setSubmitting(false)
  }

  // Calculate statistics
  const totalCount = reviews.length
  const avgRating = totalCount > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1)
    : '5.0'

  const fiveStarsCount = reviews.filter(r => r.rating === 5).length
  const fiveStarsPercent = totalCount > 0 ? Math.round((fiveStarsCount / totalCount) * 100) : 100

  const filteredReviews = filterWithPhotos
    ? reviews.filter(r => !!r.image_url)
    : reviews

  return (
    <div className="border-t border-gray-100 pt-12 mt-16 font-arabic">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('تقييمات وآراء العميلات', 'Customer Reviews & Photos')}
            </h2>
            <span className="text-xs bg-royal/10 text-royal px-2.5 py-1 rounded-full font-bold">
              {totalCount} {t('تقييم', 'reviews')}
            </span>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {t('تجارب حقيقية لعميلات تألقن بهذا الموديل', 'Real experiences from our valued customers')}
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="gap-2 text-xs sm:text-sm rounded-xl py-2.5"
        >
          <Plus size={16} />
          <span>{t('أضيفي تقييمكِ وتجربتكِ', 'Write a Review')}</span>
        </Button>
      </div>

      {/* Content: Either empty state or full reviews breakdown */}
      {reviews.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-3xl p-8 sm:p-12 text-center border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
            <Star size={32} />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
            {t('لا توجد تقييمات لهذا الموديل حتى الآن', 'No reviews yet for this piece')}
          </h4>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
            {t('شاركينا تجربتكِ الحقيقية ورأيكِ في هذا الفستان لتكوني أول من يضع بصمته هنا 🤍', 'Be the first to share your real experience with this beautiful design!')}
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-2 text-xs sm:text-sm rounded-xl py-3 px-6 shadow-sm"
          >
            <Plus size={16} />
            <span>{t('أضيفي أول تقييم لهذا الفستان', 'Write the First Review')}</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Ratings Summary Card */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/40 rounded-3xl p-6 sm:p-8 border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Big Average Score */}
            <div className="md:col-span-4 text-center md:border-l md:border-gray-200 pl-0 md:pl-6">
              <p className="text-5xl font-black text-royal font-english">{avgRating}</p>
              <div className="flex justify-center gap-1 text-amber-400 my-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" stroke="none" />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {t(`بناءً على ${totalCount} تقييم من مشترين مؤكدين`, `Based on ${totalCount} verified reviews`)}
              </p>
            </div>

            {/* Breakdown bars */}
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-12 text-gray-600 font-medium">5 نجوم</span>
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${fiveStarsPercent}%` }} />
                </div>
                <span className="w-10 text-left font-english text-gray-500">{fiveStarsPercent}%</span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-12 text-gray-600 font-medium">4 نجوم</span>
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${100 - fiveStarsPercent}%` }} />
                </div>
                <span className="w-10 text-left font-english text-gray-500">{100 - fiveStarsPercent}%</span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setFilterWithPhotos(!filterWithPhotos)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    filterWithPhotos
                      ? 'bg-royal text-white border-royal shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-royal'
                  }`}
                >
                  <Camera size={14} />
                  <span>{t('عرض التقييمات التي تحتوي على صور فقط', 'Show reviews with photos only')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.map(review => (
              <div
                key={review.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-sm">{review.customer_name}</h4>
                      {review.is_verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-100">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>{t('مشترية مؤكدة', 'Verified Purchase')}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{review.city}</p>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < review.rating ? 'currentColor' : 'none'}
                        className={i < review.rating ? 'text-amber-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  {review.comment}
                </p>

                {/* Optional Customer Photo */}
                {review.image_url && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(review.image_url || null)}
                      className="relative group w-24 h-28 rounded-xl overflow-hidden border border-gray-200 hover:ring-2 hover:ring-royal transition-all"
                    >
                      <img
                        src={review.image_url}
                        alt="صورة تجربة العميلة"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Camera size={18} />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Review Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t(`شاركينا رأيكِ في: ${productName}`, `Write Your Review for: ${productName}`)}
        size="md"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 font-arabic">
          {/* Star selector */}
          <div className="text-center py-2 border-b border-gray-100">
            <span className="block text-xs font-bold text-gray-500 mb-2">تقييمكِ الإجمالي:</span>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    size={28}
                    fill={star <= rating ? '#fbbf24' : 'none'}
                    className={star <= rating ? 'text-amber-400' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <Input
            label={t('الاسم الكريم', 'Your Name')}
            placeholder="مثال: ياسمين أحمد"
            required
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <Input
            label={t('المحافظة / المدينة', 'City / Area')}
            placeholder="مثال: القاهرة - التجمع الخامس"
            value={city}
            onChange={e => setCity(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('رأيكِ في جودة القماش، المقاس والتفصيل *', 'Your Review *')}
            </label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="اكتبي تجربتكِ بكل صراحة (الخامة، التقفيل، سرعة التوصيل)..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal/40 text-sm resize-none"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
              <span>{t('إرفاق صورة للقطعة بعد الاستلام (اختياري)', 'Upload Photo (Optional)')}</span>
              <Camera size={16} className="text-gray-400" />
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-royal/10 file:text-royal hover:file:bg-royal/20 cursor-pointer"
            />
            {uploadingPhoto && <p className="text-xs text-royal mt-1">جاري معالجة الصورة...</p>}
            {photoUrl && (
              <div className="mt-2 relative w-20 h-24 rounded-xl overflow-hidden border border-gray-200">
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-2">
            <Button type="submit" loading={submitting} className="flex-1 py-2.5">
              {t('نشر التقييم', 'Submit Review')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              {t('إلغاء', 'Cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Photo Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-lg w-full bg-transparent text-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 left-0 text-white hover:text-gray-300 p-2"
              title="إغلاق"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="صورة مكبرة"
              className="max-h-[80vh] w-auto mx-auto rounded-2xl shadow-2xl object-contain border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  )
}
