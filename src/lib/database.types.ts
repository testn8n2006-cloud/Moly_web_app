export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          slug: string
          name_ar: string
          name_en: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name_ar: string
          name_en: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      product_types: {
        Row: {
          id: string
          slug: string
          name_ar: string
          name_en: string
          category_id: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name_ar: string
          name_en: string
          category_id?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_types']['Insert']>
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          description_ar: string | null
          description_en: string | null
          price: number
          sale_price: number | null
          category_id: string
          type_id: string | null
          sizes: string[]
          colors: string[]
          images: string[]
          in_stock: boolean
          is_visible: boolean
          is_featured: boolean
          sku: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          description_ar?: string | null
          description_en?: string | null
          price: number
          sale_price?: number | null
          category_id: string
          type_id?: string | null
          sizes?: string[]
          colors?: string[]
          images?: string[]
          in_stock?: boolean
          is_visible?: boolean
          is_featured?: boolean
          sku?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          size: string | null
          color: string | null
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          product_id: string
          size?: string | null
          color?: string | null
          quantity: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>
        Relationships: []
      }
      favorites: {
        Row: {
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          user_id?: string
          product_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['favorites']['Insert']>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          customer_name: string
          phone: string
          city: string
          address: string
          notes: string | null
          subtotal: number
          discount: number
          shipping_fee: number
          total: number
          coupon_code: string | null
          status: 'new' | 'confirmed' | 'shipped' | 'cancelled'
          admin_notes: string | null
          device_id: string | null
          device_type: string | null
          browser_info: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          user_id?: string | null
          customer_name: string
          phone: string
          city: string
          address: string
          notes?: string | null
          subtotal: number
          discount?: number
          shipping_fee?: number
          total: number
          coupon_code?: string | null
          status?: 'new' | 'confirmed' | 'shipped' | 'cancelled'
          admin_notes?: string | null
          device_id?: string | null
          device_type?: string | null
          browser_info?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          size: string | null
          color: string | null
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          size?: string | null
          color?: string | null
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
        Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          type: 'percent' | 'fixed'
          value: number
          expires_at: string | null
          usage_limit: number | null
          used_count: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          type: 'percent' | 'fixed'
          value: number
          expires_at?: string | null
          usage_limit?: number | null
          used_count?: number
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['coupons']['Insert']>
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          value_ar: string | null
          value_en: string | null
          image_url: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value_ar?: string | null
          value_en?: string | null
          image_url?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['site_content']['Insert']>
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
        Relationships: []
      }
      admins: {
        Row: {
          user_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['admins']['Insert']>
        Relationships: []
      }
      page_views: {
        Row: {
          id: string
          visitor_id: string | null
          page_path: string
          device_type: string | null
          browser_info: string | null
          created_at: string
        }
        Insert: {
          id?: string
          visitor_id?: string | null
          page_path: string
          device_type?: string | null
          browser_info?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['page_views']['Insert']>
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          customer_name: string
          city: string | null
          rating: number
          comment: string
          image_url: string | null
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          customer_name: string
          city?: string | null
          rating: number
          comment: string
          image_url?: string | null
          is_verified?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      validate_coupon: {
        Args: {
          p_code: string
          p_subtotal: number
        }
        Returns: Json
      }
      create_order: {
        Args: {
          p_customer_name: string
          p_phone: string
          p_city: string
          p_address: string
          p_notes: string
          p_coupon_code?: string | null
        }
        Returns: Json
      }
      record_page_view: {
        Args: {
          p_path: string
          p_visitor_id?: string | null
        }
        Returns: void
      }
      get_visitor_stats: {
        Args: Record<string, never>
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
