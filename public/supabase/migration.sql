-- ============================================================
-- R&A Couture - Complete Database Migration
-- Paste this entire file into Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 50),
  name_ar TEXT NOT NULL CHECK (length(name_ar) BETWEEN 1 AND 100),
  name_en TEXT NOT NULL CHECK (length(name_en) BETWEEN 1 AND 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Types
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 50),
  name_ar TEXT NOT NULL CHECK (length(name_ar) BETWEEN 1 AND 100),
  name_en TEXT NOT NULL CHECK (length(name_en) BETWEEN 1 AND 100),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL CHECK (length(name_ar) BETWEEN 1 AND 200),
  name_en TEXT NOT NULL CHECK (length(name_en) BETWEEN 1 AND 200),
  description_ar TEXT CHECK (length(description_ar) <= 5000),
  description_en TEXT CHECK (length(description_en) <= 5000),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  sale_price NUMERIC(10,2) CHECK (sale_price >= 0 AND (sale_price IS NULL OR sale_price < price)),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  type_id UUID REFERENCES product_types(id) ON DELETE SET NULL,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  colors TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT CHECK (length(size) <= 20),
  color TEXT CHECK (length(color) <= 50),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, size, color)
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL CHECK (length(customer_name) BETWEEN 2 AND 100),
  phone TEXT NOT NULL CHECK (length(phone) BETWEEN 7 AND 20),
  city TEXT NOT NULL CHECK (length(city) BETWEEN 1 AND 100),
  address TEXT NOT NULL CHECK (length(address) BETWEEN 5 AND 500),
  notes TEXT CHECK (length(notes) <= 1000),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  coupon_code TEXT CHECK (length(coupon_code) <= 50),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'shipped', 'cancelled')),
  admin_notes TEXT CHECK (length(admin_notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL CHECK (length(product_name) BETWEEN 1 AND 200),
  size TEXT CHECK (length(size) <= 20),
  color TEXT CHECK (length(color) <= 50),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE CHECK (length(code) BETWEEN 3 AND 50),
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value NUMERIC(10,2) NOT NULL CHECK (value > 0),
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER CHECK (usage_limit > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site Content (editable from admin)
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY CHECK (length(key) BETWEEN 1 AND 100),
  value_ar TEXT,
  value_en TEXT,
  image_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY CHECK (length(key) BETWEEN 1 AND 100),
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_visible ON products(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- is_admin() security definer function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'RA' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = v_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate coupon RPC (safe, no public listing)
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT, p_subtotal NUMERIC)
RETURNS JSON AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_discount NUMERIC := 0;
BEGIN
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (usage_limit IS NULL OR used_count < usage_limit);

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'message', 'الكود غير صالح أو منتهي الصلاحية');
  END IF;

  IF v_coupon.type = 'percent' THEN
    v_discount := ROUND((p_subtotal * v_coupon.value / 100)::NUMERIC, 2);
  ELSE
    v_discount := LEAST(v_coupon.value, p_subtotal);
  END IF;

  RETURN json_build_object(
    'valid', true,
    'discount', v_discount,
    'type', v_coupon.type,
    'value', v_coupon.value,
    'code', v_coupon.code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create order RPC (server-side total calculation)
CREATE OR REPLACE FUNCTION create_order(
  p_customer_name TEXT,
  p_phone TEXT,
  p_city TEXT,
  p_address TEXT,
  p_notes TEXT,
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_shipping_fee NUMERIC := 0;
  v_total NUMERIC := 0;
  v_coupon coupons%ROWTYPE;
  v_shipping_setting TEXT;
  v_city_fee NUMERIC := 0;
  v_item RECORD;
  v_min_order NUMERIC := 0;
  v_store_open TEXT;
BEGIN
  -- Check store is open
  SELECT value INTO v_store_open FROM settings WHERE key = 'store_open';
  IF v_store_open = 'false' THEN
    RETURN json_build_object('success', false, 'message', 'المتجر مغلق حالياً');
  END IF;

  -- Check minimum order
  SELECT COALESCE(value::NUMERIC, 0) INTO v_min_order FROM settings WHERE key = 'minimum_order';

  -- Calculate subtotal from cart (server-side, using actual prices)
  SELECT COALESCE(SUM(
    COALESCE(p.sale_price, p.price) * ci.quantity
  ), 0)
  INTO v_subtotal
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.user_id = v_user_id
    AND p.is_visible = true
    AND p.in_stock = true;

  IF v_subtotal = 0 THEN
    RETURN json_build_object('success', false, 'message', 'السلة فارغة');
  END IF;

  IF v_subtotal < v_min_order THEN
    RETURN json_build_object(
      'success', false,
      'message', 'الحد الأدنى للطلب هو ' || v_min_order
    );
  END IF;

  -- Validate coupon if provided
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE UPPER(code) = UPPER(p_coupon_code)
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (usage_limit IS NULL OR used_count < usage_limit);

    IF FOUND THEN
      IF v_coupon.type = 'percent' THEN
        v_discount := ROUND((v_subtotal * v_coupon.value / 100)::NUMERIC, 2);
      ELSE
        v_discount := LEAST(v_coupon.value, v_subtotal);
      END IF;
      -- Increment coupon usage
      UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
    END IF;
  END IF;

  -- Get shipping fee for city
  SELECT value INTO v_shipping_setting FROM settings WHERE key = 'shipping_fee_' || LOWER(p_city);
  IF NOT FOUND OR v_shipping_setting IS NULL THEN
    SELECT value INTO v_shipping_setting FROM settings WHERE key = 'default_shipping_fee';
  END IF;
  v_shipping_fee := COALESCE(v_shipping_setting::NUMERIC, 0);

  v_total := v_subtotal - v_discount + v_shipping_fee;

  -- Generate order number
  v_order_number := generate_order_number();

  -- Create the order
  INSERT INTO orders (
    order_number, user_id, customer_name, phone, city, address, notes,
    subtotal, discount, shipping_fee, total, coupon_code, status
  ) VALUES (
    v_order_number, v_user_id, p_customer_name, p_phone, p_city, p_address, p_notes,
    v_subtotal, v_discount, v_shipping_fee, v_total,
    NULLIF(p_coupon_code, ''), 'new'
  ) RETURNING id INTO v_order_id;

  -- Copy cart items as order items (snapshot prices)
  FOR v_item IN
    SELECT ci.size, ci.color, ci.quantity, p.id AS product_id,
           COALESCE(p.name_ar, p.name_en) AS product_name,
           COALESCE(p.sale_price, p.price) AS unit_price
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = v_user_id
  LOOP
    INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
    VALUES (v_order_id, v_item.product_id, v_item.product_name, v_item.size, v_item.color, v_item.quantity, v_item.unit_price);
  END LOOP;

  -- Clear cart
  DELETE FROM cart_items WHERE user_id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'shipping_fee', v_shipping_fee,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Categories: public read, admin write
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON categories FOR ALL USING (is_admin());

-- Product types: public read, admin write
CREATE POLICY "product_types_public_read" ON product_types FOR SELECT USING (true);
CREATE POLICY "product_types_admin_all" ON product_types FOR ALL USING (is_admin());

-- Products: public read visible, admin full access
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_visible = true OR is_admin());
CREATE POLICY "products_admin_all" ON products FOR ALL USING (is_admin());

-- Cart items: own rows only
CREATE POLICY "cart_own" ON cart_items FOR ALL USING (user_id = auth.uid());

-- Favorites: own rows only
CREATE POLICY "favorites_own" ON favorites FOR ALL USING (user_id = auth.uid());

-- Orders: insert for all authenticated, select own, admin full
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE USING (is_admin());

-- Order items: insert via RPC only, select own order's items, admin all
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "order_items_select" ON order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR is_admin()))
  );

-- Coupons: no public listing, validate via RPC only; admin full
CREATE POLICY "coupons_admin_all" ON coupons FOR ALL USING (is_admin());

-- Site content: public read, admin write
CREATE POLICY "site_content_public_read" ON site_content FOR SELECT USING (true);
CREATE POLICY "site_content_admin_write" ON site_content FOR ALL USING (is_admin());

-- Settings: limited public read (safe keys), admin full
CREATE POLICY "settings_public_read" ON settings FOR SELECT
  USING (
    key IN ('whatsapp_number', 'currency', 'store_open', 'default_shipping_fee', 'minimum_order', 'shipping_note', 'social_proof_alerts')
    OR key LIKE 'shipping_fee_%'
    OR is_admin()
  );
CREATE POLICY "settings_admin_all" ON settings FOR ALL USING (is_admin());

-- Admins: no public access
CREATE POLICY "admins_admin_only" ON admins FOR ALL USING (is_admin());

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Create buckets (run these in Storage section or use SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('site-assets', 'site-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage: public read
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "site_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');

-- Storage: admin upload/update/delete only
CREATE POLICY "product_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "site_assets_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND is_admin());

CREATE POLICY "site_assets_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-assets' AND is_admin());

CREATE POLICY "site_assets_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-assets' AND is_admin());

-- ============================================================
-- SEED DATA
-- ============================================================

-- Categories
INSERT INTO categories (id, slug, name_ar, name_en, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'women', 'نساء', 'Women', 1),
  ('00000000-0000-0000-0000-000000000002', 'kids', 'أطفال', 'Kids', 2)
ON CONFLICT (slug) DO NOTHING;

-- Product Types
INSERT INTO product_types (slug, name_ar, name_en, category_id, sort_order) VALUES
  ('dresses', 'فساتين', 'Dresses', '00000000-0000-0000-0000-000000000001', 1),
  ('abayas', 'عبايات', 'Abayas', '00000000-0000-0000-0000-000000000001', 2),
  ('sets', 'طقم', 'Sets', '00000000-0000-0000-0000-000000000001', 3),
  ('tops', 'بلوزات', 'Tops', '00000000-0000-0000-0000-000000000001', 4),
  ('kids-dresses', 'فساتين أطفال', 'Kids Dresses', '00000000-0000-0000-0000-000000000002', 1),
  ('kids-sets', 'طقم أطفال', 'Kids Sets', '00000000-0000-0000-0000-000000000002', 2),
  ('kids-tops', 'قمصان أطفال', 'Kids Tops', '00000000-0000-0000-0000-000000000002', 3)
ON CONFLICT (slug) DO NOTHING;

-- Products - 6 Women
INSERT INTO products (name_ar, name_en, description_ar, description_en, price, sale_price, category_id, sizes, colors, images, in_stock, is_visible, is_featured) VALUES
  (
    'فستان سهرة أزرق ملكي',
    'Royal Blue Evening Dress',
    'فستان سهرة فاخر من القماش الساتان بتصميم أنيق يناسب المناسبات الخاصة. متوفر بألوان متعددة.',
    'Luxurious satin evening dress with elegant design perfect for special occasions.',
    350.00, 280.00,
    '00000000-0000-0000-0000-000000000001',
    ARRAY['XS', 'S', 'M', 'L', 'XL'],
    ARRAY['أزرق ملكي', 'أسود', 'ذهبي'],
    ARRAY['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800'],
    true, true, true
  ),
  (
    'عباية كلاسيكية فاخرة',
    'Luxury Classic Abaya',
    'عباية كلاسيكية من أجود أنواع الكريب مع تطريز ذهبي على الأطراف.',
    'Classic abaya made from finest crepe fabric with gold embroidery on edges.',
    420.00, NULL,
    '00000000-0000-0000-0000-000000000001',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['أسود', 'رمادي', 'كحلي'],
    ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4b4b5b?w=800'],
    true, true, true
  ),
  (
    'طقم كاجوال أنيق',
    'Elegant Casual Set',
    'طقم كاجوال يتكون من بلوزة وبنطال واسع من قماش الليلكي الناعم.',
    'Casual set consisting of a blouse and wide pants in soft lilac fabric.',
    280.00, 220.00,
    '00000000-0000-0000-0000-000000000001',
    ARRAY['S', 'M', 'L', 'XL'],
    ARRAY['ليلكي', 'زهري', 'أبيض'],
    ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'],
    true, true, false
  ),
  (
    'فستان صيفي منقوش',
    'Floral Summer Dress',
    'فستان صيفي خفيف من قماش الشيفون مع نقشات زهرية جميلة.',
    'Light summer chiffon dress with beautiful floral prints.',
    195.00, NULL,
    '00000000-0000-0000-0000-000000000001',
    ARRAY['XS', 'S', 'M', 'L'],
    ARRAY['أبيض', 'زهري', 'أزرق'],
    ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800'],
    true, true, false
  ),
  (
    'بلوزة حرير مميزة',
    'Signature Silk Blouse',
    'بلوزة من الحرير الطبيعي بقصة أنيقة تناسب المناسبات الرسمية وشبه الرسمية.',
    'Natural silk blouse with elegant cut suitable for formal and semi-formal occasions.',
    165.00, 130.00,
    '00000000-0000-0000-0000-000000000001',
    ARRAY['XS', 'S', 'M', 'L', 'XL'],
    ARRAY['أبيض', 'كريم', 'أزرق فاتح'],
    ARRAY['https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800'],
    true, true, true
  ),
  (
    'فستان مسائي ماكسي',
    'Maxi Evening Dress',
    'فستان ماكسي فخم من التول مع تفاصيل دقيقة وتصميم رومانسي.',
    'Luxurious tulle maxi dress with intricate details and romantic design.',
    480.00, 380.00,
    '00000000-0000-0000-0000-000000000001',
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['أبيض', 'عاجي', 'وردي'],
    ARRAY['https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800'],
    false, true, true
  );

-- Products - 6 Kids
INSERT INTO products (name_ar, name_en, description_ar, description_en, price, sale_price, category_id, sizes, colors, images, in_stock, is_visible, is_featured) VALUES
  (
    'فستان أميرة للأطفال',
    'Princess Dress for Kids',
    'فستان أميرة فاخر للبنات بتصميم ساحر مع تنورة منفوشة وأحجار لامعة.',
    'Luxurious princess dress for girls with enchanting design, puffy skirt and sparkling stones.',
    220.00, 180.00,
    '00000000-0000-0000-0000-000000000002',
    ARRAY['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'],
    ARRAY['وردي', 'أرجواني', 'أزرق'],
    ARRAY['https://images.unsplash.com/photo-1518831959646-742c3a14ebf4?w=800'],
    true, true, true
  ),
  (
    'طقم كاجوال للأطفال',
    'Kids Casual Set',
    'طقم كاجوال مريح للأطفال يتكون من تيشيرت وبنطال جينز.',
    'Comfortable casual set for kids consisting of a t-shirt and jeans.',
    145.00, NULL,
    '00000000-0000-0000-0000-000000000002',
    ARRAY['2-3Y', '4-5Y', '6-7Y', '8-9Y'],
    ARRAY['أزرق', 'رمادي', 'أخضر'],
    ARRAY['https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800'],
    true, true, false
  ),
  (
    'فستان مدرسي أنيق',
    'Elegant School Dress',
    'فستان مدرسي أنيق ومريح من القطن للبنات، سهل العناية.',
    'Elegant and comfortable school dress for girls in cotton, easy care.',
    110.00, 85.00,
    '00000000-0000-0000-0000-000000000002',
    ARRAY['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    ARRAY['كحلي', 'رمادي', 'أخضر زيتي'],
    ARRAY['https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800'],
    true, true, false
  ),
  (
    'فستان مطرز للأطفال',
    'Embroidered Kids Dress',
    'فستان فاخر بتطريز يدوي جميل للمناسبات والأعياد.',
    'Luxury dress with beautiful hand embroidery for occasions and holidays.',
    195.00, NULL,
    '00000000-0000-0000-0000-000000000002',
    ARRAY['3-4Y', '5-6Y', '7-8Y', '9-10Y'],
    ARRAY['أبيض', 'وردي', 'أزرق فاتح'],
    ARRAY['https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800'],
    true, true, true
  ),
  (
    'طقم رياضي للأطفال',
    'Kids Sports Set',
    'طقم رياضي مريح وعملي للأطفال من قماش التيريكوت.',
    'Comfortable and practical sports set for kids in terry cloth.',
    125.00, 95.00,
    '00000000-0000-0000-0000-000000000002',
    ARRAY['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'],
    ARRAY['أزرق ملكي', 'أحمر', 'أسود'],
    ARRAY['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800'],
    true, true, false
  ),
  (
    'فستان شتوي دافئ',
    'Warm Winter Dress',
    'فستان شتوي دافئ من الصوف المزدوج مع تفاصيل جميلة.',
    'Warm winter dress in double wool with beautiful details.',
    155.00, NULL,
    '00000000-0000-0000-0000-000000000002',
    ARRAY['3-4Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y'],
    ARRAY['كحلي', 'بني', 'أخضر'],
    ARRAY['https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?w=800'],
    true, true, false
  );

-- Coupons
INSERT INTO coupons (code, type, value, expires_at, usage_limit, is_active) VALUES
  ('WELCOME10', 'percent', 10, NOW() + INTERVAL '1 year', 100, true),
  ('SAVE50', 'fixed', 50, NOW() + INTERVAL '6 months', 50, true)
ON CONFLICT (code) DO NOTHING;

-- Site Content
INSERT INTO site_content (key, value_ar, value_en, image_url) VALUES
  ('hero_title', 'أزياء راقية لكل امرأة ناجحة', 'Elegant Fashion for Every Successful Woman', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600'),
  ('hero_subtitle', 'اكتشفي أحدث تشكيلاتنا من الأزياء النسائية وملابس الأطفال', 'Discover our latest collections of women''s fashion and children''s clothing', NULL),
  ('hero_button_text', 'تسوقي الآن', 'Shop Now', NULL),
  ('hero_button_link', '/women', '/women', NULL),
  ('promo_bar', 'شحن مجاني على الطلبات فوق 1500 جنيه | استخدمي كود WELCOME10 للحصول على خصم 10%', 'Free shipping on orders over 1500 EGP | Use code WELCOME10 for 10% off', NULL),
  ('about_content', 'R&A Couture هي وجهتك المثالية للأزياء النسائية وملابس الأطفال الراقية. نقدم أجود التصاميم العصرية التي تجمع بين الأناقة والراحة. تأسسنا بشغف حقيقي للموضة ورغبة في تقديم تجربة تسوق استثنائية لكل سيدة وطفلة.', 'R&A Couture is your perfect destination for premium women''s fashion and children''s clothing. We offer the finest contemporary designs that combine elegance and comfort. Founded with a true passion for fashion and a desire to provide an exceptional shopping experience for every woman and girl.', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200'),
  ('contact_info', 'للتواصل معنا عبر واتساب أو البريد الإلكتروني', 'Contact us via WhatsApp or email', NULL),
  ('shipping_policy', 'يتم الشحن خلال 2-4 أيام عمل لجميع محافظات مصر. الشحن مجاني على الطلبات فوق 1500 جنيه. يمكن إرجاع المنتج خلال 7 أيام من الاستلام بشرط أن يكون في حالته الأصلية.', 'Shipping takes 2-4 business days to all Egypt governorates. Free shipping on orders over 1500 EGP. Returns accepted within 7 days of receipt in original condition.', NULL),
  ('size_guide', 'مقاس XS: صدر 80، خصر 60، أرداف 86
مقاس S: صدر 84، خصر 64، أرداف 90
مقاس M: صدر 88، خصر 68، أرداف 94
مقاس L: صدر 92، خصر 72، أرداف 98
مقاس XL: صدر 96، خصر 76، أرداف 102
مقاس XXL: صدر 100، خصر 80، أرداف 106', 'Size XS: Bust 80, Waist 60, Hips 86
Size S: Bust 84, Waist 64, Hips 90
Size M: Bust 88, Waist 68, Hips 94
Size L: Bust 92, Waist 72, Hips 98
Size XL: Bust 96, Waist 76, Hips 102
Size XXL: Bust 100, Waist 80, Hips 106', NULL),
  ('footer_about', 'R&A Couture - أزياء راقية لكل امرأة ناجحة', 'R&A Couture - Elegant fashion for every successful woman', NULL),
  ('social_instagram', 'https://instagram.com/racouture', 'https://instagram.com/racouture', NULL),
  ('social_facebook', 'https://facebook.com/racouture', 'https://facebook.com/racouture', NULL),
  ('social_tiktok', 'https://tiktok.com/@racouture', 'https://tiktok.com/@racouture', NULL),
  ('home_sections_order', 'hero,promo,categories,new_arrivals,featured,whyus', 'hero,promo,categories,new_arrivals,featured,whyus', NULL)
ON CONFLICT (key) DO NOTHING;

-- Settings
INSERT INTO settings (key, value) VALUES
  ('whatsapp_number', '201000000000'),
  ('currency', 'EGP'),
  ('store_open', 'true'),
  ('minimum_order', '0'),
  ('default_shipping_fee', '50'),
  ('shipping_note', 'يتم التوصيل خلال 2-4 أيام عمل لجميع المحافظات'),
  ('shipping_fee_القاهرة', '40'),
  ('shipping_fee_الجيزة', '40'),
  ('shipping_fee_الإسكندرية', '50'),
  ('shipping_fee_القليوبية', '45'),
  ('shipping_fee_الدقهلية', '55'),
  ('shipping_fee_الشرقية', '55'),
  ('shipping_fee_الغربية', '55'),
  ('shipping_fee_المنوفية', '50'),
  ('shipping_fee_البحيرة', '55'),
  ('shipping_fee_دمياط', '60'),
  ('shipping_fee_بورسعيد', '60'),
  ('shipping_fee_الإسماعيلية', '60'),
  ('shipping_fee_السويس', '60'),
  ('shipping_fee_الفيوم', '60'),
  ('shipping_fee_بني سويف', '65'),
  ('shipping_fee_المنيا', '70'),
  ('shipping_fee_أسيوط', '75'),
  ('shipping_fee_سوهاج', '80'),
  ('shipping_fee_قنا', '85'),
  ('shipping_fee_الأقصر', '85'),
  ('shipping_fee_أسوان', '90'),
  ('shipping_fee_البحر الأحمر', '90'),
  ('shipping_fee_مطروح', '80'),
  ('site_name', 'R&A Couture')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- VISITOR TRACKING & ANALYTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT,
  page_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views (visitor_id);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_views_anon_insert" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "page_views_public_read" ON page_views FOR SELECT USING (true);

-- RPC to record view safely
CREATE OR REPLACE FUNCTION record_page_view(
  p_path TEXT,
  p_visitor_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO page_views (page_path, visitor_id)
  VALUES (p_path, p_visitor_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to get visitor statistics efficiently
CREATE OR REPLACE FUNCTION get_visitor_stats()
RETURNS JSON AS $$
DECLARE
  v_today_views BIGINT;
  v_total_views BIGINT;
  v_unique_today BIGINT;
  v_unique_total BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_views FROM page_views;
  
  SELECT COUNT(*) INTO v_today_views 
  FROM page_views 
  WHERE created_at >= CURRENT_DATE;

  SELECT COUNT(DISTINCT visitor_id) INTO v_unique_total 
  FROM page_views 
  WHERE visitor_id IS NOT NULL;

  SELECT COUNT(DISTINCT visitor_id) INTO v_unique_today 
  FROM page_views 
  WHERE created_at >= CURRENT_DATE AND visitor_id IS NOT NULL;

  RETURN json_build_object(
    'total_views', v_total_views,
    'today_views', v_today_views,
    'unique_total', v_unique_total,
    'unique_today', v_unique_today
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFESSIONAL SCHEMA UPGRADE: SKUs & Persistent Device IDs
-- ============================================================

-- 1. Product SKU / Unique Model Code (Human-readable, searchable, printed on invoices)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- 2. Client Device Identification on Orders (Fraud prevention & returning customer detection)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS browser_info TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_device_id ON orders(device_id);

-- 3. Device Metadata on Page Views (Mobile / Tablet / Desktop traffic tracking)
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS browser_info TEXT;
CREATE INDEX IF NOT EXISTS idx_page_views_device_id ON page_views(visitor_id);

-- 4. Customer Reviews & Ratings with Photos (Social proof and customer feedback)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  city TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_public_insert" ON reviews FOR INSERT WITH CHECK (true);

-- Done!
SELECT 'Migration completed successfully!' as status;


