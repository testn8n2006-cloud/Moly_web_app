import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency = 'EGP'): string {
  let normalized = currency?.trim().toUpperCase() || 'EGP'
  if (normalized === 'EG' || normalized === 'LE' || normalized === 'ج.م' || normalized === 'جنيه') {
    normalized = 'EGP'
  }

  try {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: normalized,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `${price.toLocaleString('ar-EG')} ج.م`
  }
}

export function formatDate(dateStr: string, locale = 'ar-EG'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr))
}

export function compressImage(file: File, maxSizePx = 1600, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxSizePx || height > maxSizePx) {
          if (width > height) {
            height = Math.round((height * maxSizePx) / width)
            width = maxSizePx
          } else {
            width = Math.round((width * maxSizePx) / height)
            height = maxSizePx
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Compression failed')); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
          },
          'image/webp',
          quality
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

export function buildWhatsAppMessage(params: {
  orderNumber: string
  items: Array<{ name: string; size?: string | null; color?: string | null; quantity: number; price: number }>
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  couponCode?: string | null
  customerName: string
  phone: string
  city: string
  address: string
  notes?: string | null
  currency?: string
}): string {
  const c = params.currency || 'EGP'
  const fmt = (n: number) => `${n.toFixed(2)} ${c}`

  let msg = `🛍️ *طلب جديد من R&A Couture*\n`
  msg += `رقم الطلب: *${params.orderNumber}*\n\n`
  msg += `*تفاصيل الطلب:*\n`

  for (const item of params.items) {
    msg += `• ${item.name}`
    if (item.size) msg += ` - المقاس: ${item.size}`
    if (item.color) msg += ` - اللون: ${item.color}`
    msg += ` × ${item.quantity} = ${fmt(item.price * item.quantity)}\n`
  }

  msg += `\n*ملخص الطلب:*\n`
  msg += `المجموع الفرعي: ${fmt(params.subtotal)}\n`

  if (params.discount > 0) {
    msg += `الخصم (${params.couponCode || ''}): -${fmt(params.discount)}\n`
  }

  msg += `رسوم الشحن: ${fmt(params.shippingFee)}\n`
  msg += `*الإجمالي: ${fmt(params.total)}*\n\n`

  msg += `*بيانات العميل:*\n`
  msg += `الاسم: ${params.customerName}\n`
  msg += `الهاتف: ${params.phone}\n`
  msg += `المدينة: ${params.city}\n`
  msg += `العنوان: ${params.address}\n`

  if (params.notes) {
    msg += `ملاحظات: ${params.notes}\n`
  }

  msg += `\nسيتم ترتيب الدفع والشحن عبر هذه المحادثة. شكراً لتسوقك معنا! 💙`

  return encodeURIComponent(msg)
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '…'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الدقهلية',
  'الشرقية',
  'المنوفية',
  'الغربية',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'البحيرة',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء',
]

// Alias for backwards compatibility
export const SAUDI_CITIES = EGYPT_GOVERNORATES

