import type { Database } from './database.types'

export type Category = Database['public']['Tables']['categories']['Row']
export type ProductType = Database['public']['Tables']['product_types']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Coupon = Database['public']['Tables']['coupons']['Row']
export type SiteContent = Database['public']['Tables']['site_content']['Row']
export type Setting = Database['public']['Tables']['settings']['Row']

export interface CartItemWithProduct extends CartItem {
  product: Product
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { product?: Product | null })[]
}

export interface Language {
  code: 'ar' | 'en'
  dir: 'rtl' | 'ltr'
  label: string
}

export interface FilterState {
  search: string
  category_id: string
  type_id: string
  sizes: string[]
  colors: string[]
  min_price: number | null
  max_price: number | null
  in_stock: boolean | null
  sort: 'newest' | 'price_asc' | 'price_desc' | 'name_ar'
}

export interface CouponResult {
  valid: boolean
  discount?: number
  type?: 'percent' | 'fixed'
  value?: number
  code?: string
  message?: string
}

export interface OrderResult {
  success: boolean
  order_id?: string
  order_number?: string
  subtotal?: number
  discount?: number
  shipping_fee?: number
  total?: number
  message?: string
}

export interface CheckoutFormData {
  customer_name: string
  phone: string
  city: string
  address: string
  notes: string
  coupon_code: string
  device_id?: string
  device_type?: string
  browser_info?: string
}

export interface CustomMeasurements {
  shoulder: string // عرض الكتف
  chest: string    // دوران الصدر
  waist: string    // دوران الوسط
  hips: string     // دوران الأرداف
  sleeve: string   // طول الكم
  arm: string      // دوران الذراع
  wrist: string    // دوران المعصم
  length: string   // طول الموديل
  notes?: string   // ملاحظات إضافية للتفصيل
}

