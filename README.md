# R&A Couture — Setup & Deployment Guide

> **Women's & Kids' fashion e-commerce** built with React + Vite + TypeScript + Tailwind CSS + Supabase.

---

## Architecture at a Glance

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend / DB | Supabase (Postgres, Auth, Storage, RLS) |
| State | React Query (@tanstack/react-query) |
| Routing | React Router v6 |
| Charts | Recharts |
| Fonts | Cairo / Tajawal (Arabic), Poppins (English) |

---

## Step 1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to your users (e.g. *Middle East*)
3. Save your **Database password** securely

---

## Step 2 — Run the SQL Migration

1. In your Supabase project → **SQL Editor → New query**
2. Open `supabase/migration.sql` from this project
3. Paste the **entire contents** and click **Run**
4. Verify you see: `Migration completed successfully!`

> **What it creates:** all tables, RLS policies, storage buckets, helper functions (`is_admin`, `validate_coupon`, `create_order`), and seed data (12 sample products, 2 coupons, site content, settings).

---

## Step 3 — Enable Anonymous Sign-Ins

1. Supabase Dashboard → **Authentication → Providers**
2. Scroll to **Anonymous Sign-ins** → toggle **ON**

> **⚠️ Security note:** Anonymous sign-ins are open to bots. For production, enable **Supabase CAPTCHA** (Authentication → Settings → Enable CAPTCHA) to prevent abuse.

---

## Step 4 — Create the First Admin User

**4a. Create the user in Supabase Auth:**
1. Dashboard → **Authentication → Users → Add user**
2. Enter your admin email & a strong password (min 12 chars recommended)
3. Copy the **User ID** (UUID) shown in the users table

**4b. Grant admin rights via SQL:**
```sql
-- Paste in SQL Editor
INSERT INTO admins (user_id) VALUES ('PASTE-YOUR-USER-ID-HERE');
```

**To add more admins later**, repeat 4a and 4b, or use the admin panel's **/admin/admins** page (which shows the SQL you need to run).

---

## Step 5 — Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Where to find these:** Supabase Dashboard → ⚙️ Settings → **API**
> - `VITE_SUPABASE_URL` = Project URL
> - `VITE_SUPABASE_ANON_KEY` = `anon` `public` key

> **❌ Never add `SUPABASE_SERVICE_ROLE_KEY` to the frontend.** The service role key bypasses all RLS and must only be used in secure server environments.

---

## Step 6 — Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Admin panel: [http://localhost:5173/admin](http://localhost:5173/admin)

---

## Step 7 — Configure Store Settings (Admin Panel)

After logging in to `/admin`, go to **الإعدادات** (Settings):

| Setting | Description |
|---|---|
| رقم واتساب | Your WhatsApp number with country code, no `+` (e.g. `966501234567`) |
| العملة | Currency code (`SAR`) |
| الحد الأدنى للطلب | Minimum order amount (set to `0` for none) |
| رسوم الشحن الافتراضية | Default shipping fee in SAR |
| رسوم الشحن حسب المدينة | Per-city override fees |
| حالة المتجر | Toggle to close/open the store |

---

## Step 8 — Deploy to Production

### Option A: Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

Add environment variables in Vercel dashboard → Project → Settings → Environment Variables.

### Option B: Netlify

```bash
npm run build
# Drag & drop the `dist/` folder to Netlify
```

Set env vars in Netlify → Site settings → Environment variables.

### Option C: Any Static Host

```bash
npm run build
# Upload the dist/ folder to your hosting
```

---

## Storage Buckets

Two buckets are created automatically by the migration:

| Bucket | Purpose | Max Size |
|---|---|---|
| `product-images` | Product photos | 5 MB (JPG/PNG/WebP) |
| `site-assets` | Logo, banners, about image | 5 MB (JPG/PNG/WebP/SVG) |

Images are **compressed client-side to WebP (max 1600px)** before upload.

---

## Key Features

### Storefront
- 🌐 Arabic-first RTL with EN/AR toggle
- 👤 Anonymous sessions (cart/favorites persist across visits)
- 🛒 Real-time cart with optimistic updates
- ❤️ Favorites synced to Supabase
- 🔍 Search, filter by type/size/price, sort, pagination
- 📱 WhatsApp checkout — order created server-side, totals never trusted from browser
- 🏷️ Coupon validation via secure RPC (no public coupon listing)
- 💬 Floating WhatsApp contact button

### Admin Panel (`/admin`)
- 🔐 Login with rate limiting (5 attempts → 5 min lockout) + auto-logout after 30 min inactivity
- 📊 Dashboard with stats cards + 30-day orders chart
- 📦 Products: search, bulk actions, image upload (WebP compressed), drag-reorder, duplicate
- 🛍️ Orders: status management, internal notes, CSV export, WhatsApp to customer
- 🏷️ Coupons: percent/fixed, expiry, usage limits
- 📝 Site content: hero, promo bar, about, shipping policy, social links — all editable
- ⚙️ Settings: store open/close, WhatsApp, shipping fees per city

---

## Security Notes

| Concern | Implementation |
|---|---|
| Anonymous auth | Uses `supabase.auth.signInAnonymously()` — admin rights require `is_admin()` check |
| Admin auth | `is_admin()` is SECURITY DEFINER — checks `admins` table, not just role |
| Order totals | Recalculated server-side in `create_order()` RPC — never trusted from browser |
| Coupon validation | Via `validate_coupon()` RPC — no public SELECT on coupons table |
| Storage | Only admins can upload/delete via storage RLS policies |
| Service role key | Never used or stored in frontend |
| RLS | Enabled on all tables with explicit policies |
| CAPTCHA | **Recommended** — enable in Supabase Auth settings to protect anonymous sign-ins |

---

## Project Structure

```
src/
├── components/
│   ├── admin/          # AdminGuard, AdminLayout
│   ├── layout/         # Header, Footer, PromoBar, WhatsAppButton
│   ├── products/       # ProductCard
│   └── ui/             # Button, Badge, Input, Modal, EmptyState, Skeleton, Toast
├── contexts/           # Auth, Cart, Favorites, Language
├── lib/                # supabase.ts, types.ts, database.types.ts, utils.ts
└── pages/
    ├── admin/          # Dashboard, Products, Orders, Coupons, Content, Settings, Admins
    └── *.tsx           # Home, Women, Kids, Product, Cart, Checkout, Favorites, etc.

supabase/
└── migration.sql       # Complete DB migration (run once in SQL Editor)
```

---

## Customization

- **Brand colors:** Royal Blue `#1E3A8A` — change in `tailwind.config.js` → `colors.royal`
- **WhatsApp number:** Admin Panel → الإعدادات
- **Hero image/text:** Admin Panel → محتوى الموقع
- **Product categories/types:** Admin Panel → المنتجات → Manage Categories

---

*Built with ❤️ for R&A Couture*
