import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Star, Plus, Trash2, CheckCircle2,
  Camera, Filter, Search, MessageSquare, AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { compressImage } from '@/lib/utils'
import type { Product } from '@/lib/types'
import toast from 'react-hot-toast'

interface AdminReviewItem {
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

export default function AdminReviews() {
  const qc = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all')

  // Form states for adding real review
  const [formProductId, setFormProductId] = useState('')
  const [formCustomerName, setFormCustomerName] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formRating, setFormRating] = useState(5)
  const [formComment, setFormComment] = useState('')
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null)
  const [formIsVerified, setFormIsVerified] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 1. Fetch all store products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['admin-products-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name_ar', { ascending: true })
      if (error) throw error
      return (data || []) as Product[]
    },
  })

  // 2. Fetch all reviews
  const { data: reviews = [], isLoading, refetch } = useQuery<AdminReviewItem[]>({
    queryKey: ['admin-reviews-list'],
    queryFn: async () => {
      // Try from Supabase
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data) {
          // Merge with any localStorage reviews
          const localMap = new Map<string, AdminReviewItem>()
          data.forEach(r => localMap.set(r.id, {
            ...r,
            image_url: r.image_url || null,
          } as AdminReviewItem))

          // Also check all localStorage reviews keys
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('ra_reviews_')) {
              try {
                const list: AdminReviewItem[] = JSON.parse(localStorage.getItem(key) || '[]')
                list.forEach(r => {
                  if (!localMap.has(r.id)) localMap.set(r.id, r)
                })
              } catch {
                // Ignore parse errors
              }
            }
          }

          return Array.from(localMap.values())
        }
      } catch {
        // Table fallback
      }

      // Local storage fallback if offline
      const fallbackList: AdminReviewItem[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('ra_reviews_')) {
          try {
            const list = JSON.parse(localStorage.getItem(key) || '[]')
            fallbackList.push(...list)
          } catch {
            // Ignore
          }
        }
      }
      return fallbackList
    },
  })

  // Photo upload handler
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const compressed = await compressImage(file, 1200, 0.8)
      const fileName = `review-admin-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, compressed, { contentType: 'image/webp' })

      if (!error && data) {
        const { data: publicUrl } = supabase.storage.from('site-assets').getPublicUrl(data.path)
        setFormImageUrl(publicUrl.publicUrl)
      } else {
        const reader = new FileReader()
        reader.onload = ev => {
          setFormImageUrl(ev.target?.result as string)
        }
        reader.readAsDataURL(compressed)
      }
    } catch {
      toast.error('تعذر رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  // Create real review submit
  async function handleCreateReview(e: React.FormEvent) {
    e.preventDefault()

    if (!formProductId) {
      toast.error('يرجى اختيار المنتج أولاً')
      return
    }
    if (!formCustomerName.trim()) {
      toast.error('يرجى كتابة اسم العميلة')
      return
    }
    if (!formComment.trim()) {
      toast.error('يرجى كتابة نص التقييم ورأي العميلة')
      return
    }

    setSubmitting(true)
    const newId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const imagesArr = formImageUrl ? [formImageUrl] : []

    const reviewObj: AdminReviewItem = {
      id: newId,
      product_id: formProductId,
      customer_name: formCustomerName.trim(),
      city: formCity.trim() || 'القاهرة',
      rating: formRating,
      comment: formComment.trim(),
      images: imagesArr,
      image_url: formImageUrl,
      is_verified: formIsVerified,
      created_at: new Date().toISOString(),
    }

    try {
      // 1. Save to Supabase
      try {
        await supabase.from('reviews').insert({
          id: newId,
          product_id: formProductId,
          customer_name: reviewObj.customer_name,
          city: reviewObj.city,
          rating: reviewObj.rating,
          comment: reviewObj.comment,
          image_url: formImageUrl,
          is_verified: reviewObj.is_verified,
        })
      } catch (err) {
        console.warn('DB insert fallback:', err)
      }

      // 2. Save to localStorage for instant local view
      const localKey = `ra_reviews_${formProductId}`
      const existing: AdminReviewItem[] = JSON.parse(localStorage.getItem(localKey) || '[]')
      existing.unshift(reviewObj)
      localStorage.setItem(localKey, JSON.stringify(existing))

      toast.success('تمت إضافة تقييم العميلة الحقيقي بنجاح ✓')
      setShowAddModal(false)
      // Reset form
      setFormCustomerName('')
      setFormCity('')
      setFormComment('')
      setFormImageUrl(null)
      setFormRating(5)

      refetch()
      qc.invalidateQueries({ queryKey: ['admin-reviews-list'] })
    } catch {
      toast.error('حدث خطأ أثناء حفظ التقييم')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete review
  async function handleDeleteReview(review: AdminReviewItem) {
    if (!confirm(`هل أنت متأكد من حذف تقييم العميلة "${review.customer_name}"؟`)) return

    try {
      // Delete from DB
      await supabase.from('reviews').delete().eq('id', review.id)

      // Delete from local
      const localKey = `ra_reviews_${review.product_id}`
      const existing: AdminReviewItem[] = JSON.parse(localStorage.getItem(localKey) || '[]')
      const updated = existing.filter(r => r.id !== review.id)
      localStorage.setItem(localKey, JSON.stringify(updated))

      toast.success('تم حذف التقييم')
      refetch()
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    const matchesProduct = selectedProductFilter === 'all' || r.product_id === selectedProductFilter
    const matchesSearch = !search ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase())
    return matchesProduct && matchesSearch
  })

  // Product helper map
  const productMap = new Map(products.map(p => [p.id, p]))

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto font-arabic">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500" size={26} />
              <span>إدارة تقييمات وآراء العميلات الحقيقية</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              أضف تجارب العميلات الحقيقية وصورهن الواقعية، وتحكم في جميع الآراء المعروضة في المتجر
            </p>
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            className="gap-2 bg-royal hover:bg-royal-dark text-white rounded-xl py-2.5 px-5 shadow-sm"
          >
            <Plus size={18} />
            <span>إضافة تقييم حقيقي جديد</span>
          </Button>
        </div>

        {/* Real Data Notice */}
        <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-royal flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <span className="font-bold">نظام تقييمات واقعي 100%:</span> تم إيقاف أي مراجعات وهمية مسبقة. التقييمات المعروضة هنا وفي صفحات الفساتين هي فقط الآراء التي تضيفها أنت هنا بنفسك أو التي ترسلها العميلات بعد الشراء.
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث باسم العميلة أو المدينة أو النص..."
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-gray-400" />
            <select
              value={selectedProductFilter}
              onChange={e => setSelectedProductFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-royal/30 w-full md:w-64"
            >
              <option value="all">كل المنتجات ({reviews.length} تقييم)</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name_ar}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reviews Table / List */}
        {isLoading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-8 h-8 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">جاري تحميل التقييمات...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
              <MessageSquare size={30} />
            </div>
            <h3 className="font-bold text-gray-800 text-base mb-1">لا توجد تقييمات مطابقة</h3>
            <p className="text-gray-500 text-xs mb-4">
              يمكنك إضافة أول تقييم حقيقي لعميلة اشترت من متجرك أو عبر الواتساب بالضغط على الزر أدناه
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              variant="outline"
              className="rounded-xl text-xs gap-1.5"
            >
              <Plus size={14} /> إضافة تقييم الآن
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReviews.map(review => {
              const product = productMap.get(review.product_id)
              const img = review.image_url || review.images?.[0]

              return (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Product info */}
                    <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-100">
                      {product?.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="w-12 h-14 object-cover rounded-lg border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                          صورة
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-gray-400 block">المنتج:</span>
                        <p className="font-bold text-xs text-gray-900 truncate">
                          {product?.name_ar || 'منتج غير محدد'}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-sm">{review.customer_name}</h4>
                          {review.is_verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                              <CheckCircle2 size={10} /> مشترية موثقة
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{review.city}</p>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < review.rating ? 'currentColor' : 'none'}
                            stroke={i < review.rating ? 'none' : 'currentColor'}
                            className={i < review.rating ? 'text-amber-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="text-xs text-gray-700 leading-relaxed mb-3 bg-gray-50 p-3 rounded-xl">
                      "{review.comment}"
                    </p>

                    {/* Attached Photo Preview */}
                    {img && (
                      <div className="mb-3">
                        <span className="text-[11px] text-gray-400 block mb-1">صورة تجربة العميلة:</span>
                        <img
                          src={img}
                          alt="تجربة"
                          className="w-20 h-24 object-cover rounded-xl border border-gray-200 shadow-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span>{new Date(review.created_at).toLocaleDateString('ar-EG')}</span>
                    <button
                      onClick={() => handleDeleteReview(review)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
                    >
                      <Trash2 size={14} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal: Add Real Review */}
        <Modal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="إضافة تقييم حقيقي لعميلة"
          size="md"
        >
          <form onSubmit={handleCreateReview} className="space-y-4">
            {/* Product selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                اختيار الفستان / المنتج <span className="text-red-500">*</span>
              </label>
              <select
                value={formProductId}
                onChange={e => setFormProductId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-royal/40"
              >
                <option value="">-- اضغطي لاختيار الفستان --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name_ar} ({p.price} ج.م)
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Name & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="اسم العميلة"
                placeholder="مثال: منى عبد الرحمن"
                value={formCustomerName}
                onChange={e => setFormCustomerName(e.target.value)}
                required
              />
              <Input
                label="المدينة / المنطقة"
                placeholder="مثال: الشيخ زايد أو المعادي"
                value={formCity}
                onChange={e => setFormCity(e.target.value)}
              />
            </div>

            {/* Rating Stars Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                التقييم بالنجوم:
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(st => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setFormRating(st)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      size={26}
                      fill={st <= formRating ? '#fbbf24' : 'none'}
                      className={st <= formRating ? 'text-amber-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <Textarea
              label="نص التجربة ورأي العميلة"
              placeholder="اكتبِ هنا الرأي الحقيقي للعميلة عن الفستان، المقاس، والقماش..."
              value={formComment}
              onChange={e => setFormComment(e.target.value)}
              rows={3}
              required
            />

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                صورة تجربة واقعية للعميلة بالفستان (اختياري):
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-royal rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-gray-600 transition-colors">
                  <Camera size={16} />
                  <span>{uploadingImage ? 'جاري الرفع...' : 'رفع صورة من الجهاز'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
                {formImageUrl && (
                  <div className="relative">
                    <img
                      src={formImageUrl}
                      alt="معاينة"
                      className="w-12 h-14 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setFormImageUrl(null)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Verified buyer toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 font-bold select-none pt-2">
              <input
                type="checkbox"
                checked={formIsVerified}
                onChange={e => setFormIsVerified(e.target.checked)}
                className="w-4 h-4 text-royal rounded focus:ring-royal"
              />
              <span>إظهار شارة «مشترية موثقة ✓» بجانب الاسم</span>
            </label>

            {/* Submit buttons */}
            <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
              <Button
                type="submit"
                loading={submitting}
                className="flex-1 rounded-xl bg-royal text-white font-bold"
              >
                حفظ ونشر التقييم في المتجر
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
