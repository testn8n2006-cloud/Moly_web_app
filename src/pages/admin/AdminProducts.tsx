import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, Copy, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { formatPrice, compressImage } from '@/lib/utils'
import type { Product } from '@/lib/types'
import { getProductSku, formatProductSku, copyProductSku } from '@/lib/sku'
import toast from 'react-hot-toast'

interface ProductFormData {
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  price: number
  sale_price: number | null
  category_id: string
  type_id: string
  sizes: string
  colors: string
  in_stock: boolean
  is_visible: boolean
  is_featured: boolean
  images: string[]
  sku: string
}

const EMPTY_FORM: ProductFormData = {
  name_ar: '', name_en: '', description_ar: '', description_en: '',
  price: 0, sale_price: null, category_id: '', type_id: '',
  sizes: '', colors: '', in_stock: true, is_visible: true, is_featured: false, images: [],
  sku: '',
}

export default function AdminProducts() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: async () => {
      let q = supabase.from('products').select('*').order('created_at', { ascending: false })
      if (search) {
        const clean = search.trim().replace(/^#/, '')
        q = q.or(`name_ar.ilike.%${clean}%,name_en.ilike.%${clean}%,sku.ilike.%${clean}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return data as Product[]
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order')
      return data || []
    },
  })

  const { data: productTypes } = useQuery({
    queryKey: ['product-types-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('product_types').select('*').order('sort_order')
      return data || []
    },
  })

  function openAdd() {
    setEditProduct(null)
    setFormData(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(product: Product) {
    setEditProduct(product)
    setFormData({
      name_ar: product.name_ar,
      name_en: product.name_en,
      description_ar: product.description_ar || '',
      description_en: product.description_en || '',
      price: product.price,
      sale_price: product.sale_price,
      category_id: product.category_id,
      type_id: product.type_id || '',
      sizes: product.sizes.join(', '),
      colors: product.colors.join(', '),
      in_stock: product.in_stock,
      is_visible: product.is_visible,
      is_featured: product.is_featured,
      images: product.images,
      sku: product.sku || '',
    })
    setShowForm(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file)
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
        const { data, error } = await supabase.storage.from('product-images').upload(fileName, compressed, { contentType: 'image/webp' })
        if (error) { toast.error('Upload failed: ' + error.message); continue }
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
        urls.push(urlData.publicUrl)
      } catch (err) {
        toast.error('Image processing failed')
      }
    }
    setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }))
    setUploading(false)
    e.target.value = ''
  }

  function getFriendlyErrorMessage(errMessage: string): string {
    if (errMessage.includes('violates check constraint') || errMessage.includes('products_check')) {
      return 'خطأ في الأسعار: تأكد من أن السعر وسعر التخفيض أرقام موجبة (غير سالبة)، وأن سعر التخفيض أقل من السعر الأساسي'
    }
    if (errMessage.includes('category_id')) {
      return 'يرجى اختيار فئة المنتج'
    }
    return errMessage
  }

  async function handleSave() {
    if (!formData.name_ar.trim() || !formData.name_en.trim()) {
      toast.error('يرجى إدخال اسم المنتج بالعربية والإنجليزية')
      return
    }
    if (!formData.category_id) {
      toast.error('يرجى اختيار فئة المنتج')
      return
    }

    const priceNum = Number(formData.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('يرجى إدخال سعر صحيح أكبر من صفر')
      return
    }

    let salePriceNum: number | null = null
    if (formData.sale_price !== null && formData.sale_price !== undefined && String(formData.sale_price).trim() !== '') {
      salePriceNum = Number(formData.sale_price)
      if (isNaN(salePriceNum) || salePriceNum < 0) {
        toast.error('سعر التخفيض لا يمكن أن يكون سالباً. اكتب سعر البيع المخفض (مثال: 300)')
        return
      }
      if (salePriceNum >= priceNum) {
        toast.error(`سعر التخفيض (${salePriceNum} ج.م) يجب أن يكون أقل من السعر الأساسي (${priceNum} ج.م)`)
        return
      }
    }

    setSaving(true)
    const payload = {
      name_ar: formData.name_ar.trim(),
      name_en: formData.name_en.trim(),
      description_ar: formData.description_ar?.trim() || null,
      description_en: formData.description_en?.trim() || null,
      price: priceNum,
      sale_price: salePriceNum,
      category_id: formData.category_id,
      type_id: formData.type_id || null,
      sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: formData.colors.split(',').map(c => c.trim()).filter(Boolean),
      in_stock: formData.in_stock,
      is_visible: formData.is_visible,
      is_featured: formData.is_featured,
      images: formData.images,
      sku: formData.sku?.trim() ? formData.sku.trim().toUpperCase() : null,
    }

    if (editProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id)
      if (error) {
        toast.error(getFriendlyErrorMessage(error.message))
        setSaving(false)
        return
      }
      toast.success('تم تحديث المنتج بنجاح')
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) {
        toast.error(getFriendlyErrorMessage(error.message))
        setSaving(false)
        return
      }
      toast.success('تم إضافة المنتج بنجاح')
    }
    qc.invalidateQueries({ queryKey: ['admin-products'] })
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('تم حذف المنتج')
    qc.invalidateQueries({ queryKey: ['admin-products'] })
    setShowDeleteConfirm(null)
  }

  async function handleDuplicate(product: Product) {
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = product
    const { error } = await supabase.from('products').insert({ ...rest, name_ar: rest.name_ar + ' - نسخة', is_visible: false })
    if (error) { toast.error(error.message); return }
    toast.success('تم تكرار المنتج')
    qc.invalidateQueries({ queryKey: ['admin-products'] })
  }

  async function handleBulkAction(action: string) {
    if (selected.length === 0) return
    if (action === 'delete') {
      if (!confirm(`هل تريد حذف ${selected.length} منتجات؟`)) return
      await supabase.from('products').delete().in('id', selected)
    } else if (action === 'hide') {
      await supabase.from('products').update({ is_visible: false }).in('id', selected)
    } else if (action === 'show') {
      await supabase.from('products').update({ is_visible: true }).in('id', selected)
    } else if (action === 'out_of_stock') {
      await supabase.from('products').update({ in_stock: false }).in('id', selected)
    }
    toast.success('تم تنفيذ الإجراء')
    setSelected([])
    qc.invalidateQueries({ queryKey: ['admin-products'] })
  }

  const filteredTypes = productTypes?.filter(t => !formData.category_id || t.category_id === formData.category_id)

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث..."
                className="pr-9 pl-4 py-2 border border-gray-200 rounded-xl text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-royal/40"
              />
            </div>
            {selected.length > 0 && (
              <select
                onChange={e => { handleBulkAction(e.target.value); e.target.value = '' }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-arabic bg-white"
                defaultValue=""
              >
                <option value="" disabled>إجراء مجمعي ({selected.length})</option>
                <option value="show">إظهار</option>
                <option value="hide">إخفاء</option>
                <option value="out_of_stock">نفد المخزون</option>
                <option value="delete">حذف</option>
              </select>
            )}
          </div>
          <Button onClick={openAdd} className="font-arabic gap-2">
            <Plus size={18} />
            إضافة منتج
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      onChange={e => setSelected(e.target.checked ? (products?.map(p => p.id) || []) : [])}
                      checked={selected.length === products?.length && products?.length > 0}
                      className="rounded"
                    />
                  </th>
                  <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">المنتج</th>
                  <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">كود الموديل (SKU)</th>
                  <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">السعر</th>
                  <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">الفئة</th>
                  <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">الحالة</th>
                  <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                )}
                {products?.map(product => {
                  const skuCode = getProductSku(product)
                  return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(product.id)}
                        onChange={e => setSelected(prev => e.target.checked ? [...prev, product.id] : prev.filter(id => id !== product.id))}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-10 h-12 object-cover rounded-lg flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-arabic font-medium text-gray-900">{product.name_ar}</p>
                          <p className="text-gray-400 text-xs font-english">{product.name_en}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-royal/5 border border-royal/15 rounded-lg text-xs font-english font-bold text-royal shadow-2xs">
                        <span>{formatProductSku(skuCode)}</span>
                        <button
                          type="button"
                          onClick={() => copyProductSku(skuCode)}
                          className="p-0.5 hover:bg-white text-gray-400 hover:text-royal rounded transition-colors"
                          title="نسخ كود الموديل"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-royal">{formatPrice(product.sale_price ?? product.price)}</p>
                        {product.sale_price && <p className="text-gray-400 text-xs line-through">{formatPrice(product.price)}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {categories?.find(c => c.id === product.category_id)?.name_ar || ''}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={product.in_stock ? 'success' : 'danger'}>
                          {product.in_stock ? 'متوفر' : 'نفد'}
                        </Badge>
                        {!product.is_visible && <Badge variant="warning">مخفي</Badge>}
                        {product.is_featured && <Badge variant="info">مميز</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-royal transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => handleDuplicate(product)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-green-600 transition-colors"><Copy size={15} /></button>
                        <button onClick={() => setShowDeleteConfirm(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          {products?.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-400 font-arabic">لا توجد منتجات</div>
          )}
        </div>

        {/* Product Form Modal */}
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
          size="xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="الاسم بالعربية" required value={formData.name_ar} onChange={e => setFormData(p => ({ ...p, name_ar: e.target.value }))} />
            <Input label="Name in English" required value={formData.name_en} onChange={e => setFormData(p => ({ ...p, name_en: e.target.value }))} />
            <div className="sm:col-span-2">
              <Input
                label="كود الموديل / SKU (اختياري)"
                placeholder="مثال: RA-W1042 أو RA-DRESS-01"
                hint="إذا تركته فارغاً، سيتولى النظام توليد كود ذكي تلقائي لكل منتج بناءً على فئته"
                value={formData.sku}
                onChange={e => setFormData(p => ({ ...p, sku: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-arabic">الوصف بالعربية</label>
              <textarea rows={3} value={formData.description_ar} onChange={e => setFormData(p => ({ ...p, description_ar: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal/40 resize-none font-arabic" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (English)</label>
              <textarea rows={3} value={formData.description_en} onChange={e => setFormData(p => ({ ...p, description_en: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal/40 resize-none" />
            </div>
            <div>
              <Input
                label="السعر الأساسي (ج.م) *"
                type="number"
                min="0"
                step="any"
                required
                placeholder="مثال: 350"
                value={formData.price || ''}
                onChange={e => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Input
                label="سعر البيع بعد الخصم (اختياري)"
                type="number"
                min="0"
                step="any"
                placeholder="مثال: 300"
                hint="اكتب السعر النهائي للمنتج بعد الخصم (وليس قيمة الخصم بالسالب)"
                error={
                  formData.sale_price !== null && formData.sale_price !== undefined && String(formData.sale_price).trim() !== '' && Number(formData.sale_price) < 0
                    ? 'لا يمكن إدخال رقم سالب! اكتب السعر النهائي بعد الخصم'
                    : formData.sale_price !== null && formData.sale_price !== undefined && String(formData.sale_price).trim() !== '' && Number(formData.price) > 0 && Number(formData.sale_price) >= Number(formData.price)
                    ? `سعر التخفيض يجب أن يكون أقل من السعر الأساسي (${formData.price} ج.م)`
                    : undefined
                }
                value={formData.sale_price ?? ''}
                onChange={e => {
                  const val = e.target.value
                  setFormData(p => ({ ...p, sale_price: val !== '' ? parseFloat(val) : null }))
                }}
              />
              {formData.sale_price !== null && formData.sale_price !== undefined && String(formData.sale_price).trim() !== '' && Number(formData.sale_price) > 0 && Number(formData.sale_price) < Number(formData.price) && (
                <div className="mt-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-arabic flex items-center justify-between">
                  <span>خصم {Math.round(((Number(formData.price) - Number(formData.sale_price)) / Number(formData.price)) * 100)}%</span>
                  <span className="font-english font-medium">توفير للعميل: {(Number(formData.price) - Number(formData.sale_price)).toFixed(0)} ج.م</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-arabic">الفئة</label>
              <select value={formData.category_id} onChange={e => setFormData(p => ({ ...p, category_id: e.target.value, type_id: '' }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal/40 font-arabic bg-white">
                <option value="">اختر الفئة</option>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-arabic">النوع</label>
              <select value={formData.type_id} onChange={e => setFormData(p => ({ ...p, type_id: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal/40 font-arabic bg-white">
                <option value="">بدون نوع</option>
                {filteredTypes?.map(t => <option key={t.id} value={t.id}>{t.name_ar}</option>)}
              </select>
            </div>
            <Input label="المقاسات (مفصولة بفاصلة)" placeholder="S, M, L, XL" value={formData.sizes} onChange={e => setFormData(p => ({ ...p, sizes: e.target.value }))} />
            <Input label="الألوان (مفصولة بفاصلة)" placeholder="أحمر, أزرق, أبيض" value={formData.colors} onChange={e => setFormData(p => ({ ...p, colors: e.target.value }))} />

            {/* Images */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-arabic">صور المنتج</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-royal file:text-white hover:file:bg-royal-dark cursor-pointer"
              />
              {uploading && <p className="text-sm text-royal mt-1 font-arabic">جاري الرفع...</p>}
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.images.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-20 h-24 object-cover rounded-xl" />
                      {i === 0 && <span className="absolute top-1 right-1 bg-royal text-white text-xs px-1.5 py-0.5 rounded font-arabic">غلاف</span>}
                      <button
                        onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                        className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="sm:col-span-2 flex flex-wrap gap-4">
              {([
                ['in_stock', 'متوفر في المخزون'],
                ['is_visible', 'مرئي للعملاء'],
                ['is_featured', 'منتج مميز'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setFormData(p => ({ ...p, [key]: !p[key] }))}
                    className={`w-11 h-6 rounded-full transition-colors ${formData[key] ? 'bg-royal' : 'bg-gray-200'} relative`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData[key] ? 'translate-x-5 right-0.5' : 'right-0.5'}`} style={{ transform: formData[key] ? 'translateX(-20px)' : 'translateX(0)' }} />
                  </div>
                  <span className="text-sm font-arabic text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button fullWidth onClick={handleSave} loading={saving || uploading} className="font-arabic">
              {editProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="font-arabic">إلغاء</Button>
          </div>
        </Modal>

        {/* Delete Confirm */}
        <Modal open={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="تأكيد الحذف" size="sm">
          <p className="text-gray-700 font-arabic mb-5">هل أنت متأكد من حذف هذا المنتج؟</p>
          <div className="flex gap-3">
            <Button variant="danger" fullWidth onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} className="font-arabic">حذف</Button>
            <Button variant="outline" fullWidth onClick={() => setShowDeleteConfirm(null)} className="font-arabic">إلغاء</Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  )
}
