import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Truck,
  RefreshCw,
  Shield,
  Star,
  Scissors,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Eye,
  Award
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductGridSkeleton, Skeleton } from '@/components/ui/SkeletonLoader'

function HeroSection({ waNumber }: { waNumber: string }) {
  const { t, isRTL } = useLanguage()
  const { data: content, isLoading } = useQuery({
    queryKey: ['hero-content'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_content')
        .select('*')
        .in('key', ['hero_title', 'hero_subtitle', 'hero_button_text', 'hero_button_link'])
      return Object.fromEntries((data || []).map(r => [r.key, r]))
    },
    staleTime: 1000 * 60 * 5,
  })

  const waBespokeUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent('مرحباً R&A Couture، أرغب في الاستفسار عن تفصيل مخصص / فستان لمناسبة خاصة ✨')}`
    : '#'

  return (
    <section
      className="relative min-h-[75vh] sm:min-h-[82vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c1836] via-royal to-[#0f172a]"
      style={{
        backgroundImage: content?.hero_title?.image_url ? `url(${content.hero_title.image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Luxury Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1836]/85 via-royal/80 to-[#0c1836]/90 backdrop-blur-[1px]" />

      <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-5xl mx-auto py-16 sm:py-24">
        {/* Luxury Top Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-arabic font-medium mb-6 text-amber-200 shadow-sm animate-fade-in">
          <Sparkles size={15} className="text-amber-300 animate-pulse" />
          <span>{t('أتيليه الخياطة الراقية والتفصيل المخصص في مصر', 'Haute Couture & Bespoke Tailoring in Egypt')}</span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-80 mx-auto bg-white/20" />
            <Skeleton className="h-6 w-96 mx-auto bg-white/20" />
            <Skeleton className="h-12 w-40 mx-auto bg-white/20" />
          </div>
        ) : (
          <>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-5 font-arabic leading-[1.25] tracking-tight">
              {t(
                content?.hero_title?.value_ar || 'أزياء راقية وتفصيل فخم لكل لحظة استثنائية',
                content?.hero_title?.value_en || 'High-End Couture & Tailoring For Every Moment'
              )}
            </h1>
            <p className="text-base sm:text-xl text-blue-100/90 mb-10 font-arabic max-w-2xl mx-auto leading-relaxed">
              {t(
                content?.hero_subtitle?.value_ar || 'تصاميم فساتين سهرة وعبايات وأزياء أطفال منفذة بأرقى الخامات مع حق المعاينة قبل الدفع.',
                content?.hero_subtitle?.value_en || 'Luxury evening dresses, abayas & kids fashion crafted with premium fabrics. Inspection on delivery.'
              )}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={content?.hero_button_link?.value_ar || '/women'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white text-royal px-8 py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-amber-50 hover:text-royal-dark transition-all duration-300 hover:scale-105 shadow-xl font-arabic group"
              >
                <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                {t(content?.hero_button_text?.value_ar || 'تسوقي التشكيلة الفاخرة', content?.hero_button_text?.value_en || 'Shop Luxury Collection')}
                {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </Link>

              {waNumber && (
                <a
                  href={waBespokeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white px-7 py-4 rounded-2xl font-bold text-base sm:text-lg backdrop-blur-sm border border-emerald-400/30 transition-all duration-300 hover:scale-105 shadow-xl font-arabic"
                >
                  <MessageCircle size={20} />
                  <span>{t('طلب تفصيل مخصص عبر واتساب', 'Bespoke Order via WhatsApp')}</span>
                </a>
              )}
            </div>
          </>
        )}
      </div>

      {/* Decorative wave divider */}
      <div className="absolute bottom-0 inset-x-0">
        <svg viewBox="0 0 1440 60" className="w-full fill-white preserve-3d">
          <path d="M0,32 C360,64 1080,0 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  )
}

function TrustBadgesBar() {
  const { t } = useLanguage()
  const badges = [
    {
      icon: Eye,
      titleAr: 'معاينة وفحص قبل الدفع',
      titleEn: 'Inspect Before Payment',
      descAr: 'افحصي الخامة والمقاس مع المندوب قبل السداد',
      descEn: 'Check fabric & fit before paying COD',
    },
    {
      icon: Scissors,
      titleAr: 'تفصيل وخياطة راقية',
      titleEn: 'Haute Couture Tailoring',
      descAr: 'باترون متقن وتشطيب أتيليه يدوي فخم',
      descEn: 'Master pattern & handmade finish',
    },
    {
      icon: Award,
      titleAr: 'أقمشة مستوردة فاخرة',
      titleEn: 'Imported Luxury Fabrics',
      descAr: 'ساتان كريب، شيفون وحرير تركي وإيطالي',
      descEn: 'Crepe, satin, chiffon & Italian silk',
    },
    {
      icon: Truck,
      titleAr: 'توصيل لكافة المحافظات',
      titleEn: 'All Egypt Delivery',
      descAr: 'شحن سريع للقاهرة وجميع محافظات مصر',
      descEn: 'Fast shipping to all governorates',
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-100">
        {badges.map((b, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-gray-50/80 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-royal/5 border border-royal/10 flex items-center justify-center flex-shrink-0 text-royal">
              <b.icon size={22} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm font-arabic mb-0.5 leading-snug">
                {t(b.titleAr, b.titleEn)}
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 font-arabic leading-relaxed line-clamp-2">
                {t(b.descAr, b.descEn)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CategoryCards() {
  const { t } = useLanguage()
  const { data: content } = useQuery({
    queryKey: ['category-cards-content'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_content')
        .select('*')
        .in('key', ['category_women_card', 'category_kids_card'])
      return Object.fromEntries((data || []).map(r => [r.key, r]))
    },
    staleTime: 1000 * 60 * 5,
  })

  const womenImg =
    content?.category_women_card?.image_url ||
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000'
  const kidsImg =
    content?.category_kids_card?.image_url ||
    'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1000'

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-royal bg-royal/5 px-3 py-1 rounded-full font-arabic">
          {t('التشكيلات المختارة', 'Curated Collections')}
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 font-arabic">
          {t('تسوقي حسب الفئة', 'Shop by Category')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-arabic text-sm sm:text-base">
          {t('تصاميم كوتور راقية مخصصة للسيدات وأميراتنا الصغيرات', 'Luxury couture designs crafted for women & young princesses')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Women Card */}
        <Link
          to="/women"
          className="group relative h-80 sm:h-[420px] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 bg-slate-900"
        >
          <img
            src={womenImg}
            alt="Women Couture"
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1836]/90 via-[#0c1836]/30 to-transparent" />
          <div className="absolute top-5 right-5">
            <span className="bg-amber-400 text-royal-dark text-xs font-extrabold px-3 py-1 rounded-full shadow-md font-arabic">
              {t('فساتين & عبايات', 'Dresses & Abayas')}
            </span>
          </div>
          <div className="absolute bottom-6 sm:bottom-8 inset-x-0 px-6 text-white text-center">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 font-arabic">{t('تشكيلة النساء', "Women's Collection")}</h3>
            <p className="text-blue-100 text-xs sm:text-sm font-arabic mb-4 max-w-sm mx-auto">
              {t('فساتين سهرة راقية، عبايات كلاسيكية، وأطقم خروج أنيقة', 'Evening dresses, classic abayas, and elegant outing sets')}
            </p>
            <span className="inline-flex items-center gap-2 bg-white/20 hover:bg-white text-white hover:text-royal backdrop-blur-md px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold font-arabic transition-all border border-white/40">
              {t('اكتشفي التشكيلة', 'Explore Collection')}
            </span>
          </div>
        </Link>

        {/* Kids Card */}
        <Link
          to="/kids"
          className="group relative h-80 sm:h-[420px] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 bg-slate-900"
        >
          <img
            src={kidsImg}
            alt="Kids Couture"
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1000'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1836]/90 via-[#0c1836]/30 to-transparent" />
          <div className="absolute top-5 right-5">
            <span className="bg-pink-400 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md font-arabic">
              {t('أميرات الصغار', 'Little Princesses')}
            </span>
          </div>
          <div className="absolute bottom-6 sm:bottom-8 inset-x-0 px-6 text-white text-center">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 font-arabic">{t('تشكيلة الأطفال', "Kids' Collection")}</h3>
            <p className="text-blue-100 text-xs sm:text-sm font-arabic mb-4 max-w-sm mx-auto">
              {t('فساتين أميرات ساحرة وأطقم راقية للمناسبات والأعياد', 'Magical princess dresses and chic sets for occasions')}
            </p>
            <span className="inline-flex items-center gap-2 bg-white/20 hover:bg-white text-white hover:text-royal backdrop-blur-md px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold font-arabic transition-all border border-white/40">
              {t('اكتشفي التشكيلة', 'Explore Collection')}
            </span>
          </div>
        </Link>
      </div>
    </section>
  )
}

function NewArrivals() {
  const { t, isRTL } = useLanguage()
  const { data: products, isLoading } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(4)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5,
  })

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto bg-gradient-to-b from-gray-50/80 to-white rounded-3xl border border-gray-100/60 my-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-arabic">
            ✨ {t('أحدث الإضافات', 'Just Arrived')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 font-arabic">
            {t('وصل حديثاً إلى الأتيليه', 'New Atelier Arrivals')}
          </h2>
          <p className="text-gray-500 mt-1 font-arabic text-sm">
            {t('أحدث صيحات الموضة والتفصيل اليدوي لهذا الموسم', 'The newest fashion trends and couture for this season')}
          </p>
        </div>
        <Link
          to="/women"
          className="inline-flex items-center gap-1.5 text-royal font-bold hover:underline font-arabic text-sm"
        >
          <span>{t('عرض جميع المنتجات', 'View All Products')}</span>
          {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </Link>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products?.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}

function AtelierStorySection({ waNumber }: { waNumber: string }) {
  const { t } = useLanguage()
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent('مرحباً أتيليه R&A، أود الاستفسار عن تفاصيل خامات وتفصيل موديلاتكم 🧵')}`
    : '#'

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-[#0c1836] via-royal-dark to-[#102048] rounded-3xl p-6 sm:p-12 md:p-16 text-white shadow-2xl relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-royal-light/20 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-arabic font-bold">
              <Scissors size={14} />
              <span>{t('سر الإتقان والتميز', 'Master Tailoring & Heritage')}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold font-arabic leading-tight">
              {t('سحر الخياطة الراقية والأناقة المتقنة في أتيليه R&A', 'Haute Couture Craftsmanship at R&A Atelier')}
            </h2>

            <p className="text-blue-100 text-sm sm:text-base leading-relaxed font-arabic">
              {t(
                'نؤمن بأن كل فستان يحمل قصة خاصة تليق بجمالك. في أتيليه R&A Couture، ندمج بين أحدث خطوط الموضة العالمية ودقة الباترون المحترف. ننتقي أقمشتنا بعناية من أفضل مصانع الحرير والكريب والساتان، وتمر كل قطعة بعدة مراحل فحص يدوية حتى تصلك بتشطيب لا تشوبه شائبة.',
                'We believe every dress tells a unique story. At R&A Couture, we fuse high fashion elegance with master pattern precision. Every piece undergoes rigorous manual inspection before luxury delivery.'
              )}
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-amber-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-arabic font-medium">{t('أقمشة فاخرة غير شفافة ومريحة', 'Premium opaque, breathable fabrics')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-amber-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-arabic font-medium">{t('قصات باترون تبرز القوام بأناقة', 'Flattering couture pattern cuts')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-amber-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-arabic font-medium">{t('فحص ومعاينة حرة مع المندوب', 'Free inspection with delivery courier')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-amber-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-arabic font-medium">{t('تغليف هدايا فاخر ومعطر', 'Luxury fragrant gift packaging')}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-royal font-extrabold px-6 py-3 rounded-xl text-sm font-arabic transition-all shadow-lg hover:scale-105"
              >
                <MessageCircle size={18} />
                <span>{t('تحدثي مع خبيرة الأزياء والتفصيل', 'Talk with Couture Consultant')}</span>
              </a>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl text-sm font-arabic transition-colors border border-white/20"
              >
                <span>{t('عن أتيليه R&A', 'About R&A Atelier')}</span>
              </Link>
            </div>
          </div>

          {/* Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/15 aspect-[4/5] max-w-md mx-auto">
              <img
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800"
                alt="Atelier Craftsmanship"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1836]/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 inset-x-5 bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
                <p className="text-xs font-extrabold font-arabic text-amber-200">R&A Haute Couture</p>
                <p className="text-[11px] text-white/90 font-arabic mt-0.5">
                  {t('كل غرزة صُممت بعناية لتليق بإطلالتكِ الملكية', 'Every stitch handcrafted for your royal presence')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturedProducts() {
  const { t, isRTL } = useLanguage()
  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_visible', true)
        .limit(8)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5,
  })

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-xs font-bold text-royal bg-royal/5 px-3 py-1 rounded-full font-arabic">
            💎 {t('الأكثر طلباً', 'Best Sellers')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 font-arabic">
            {t('المنتجات الأكثر تميزاً وإقبالاً', 'Featured Signature Pieces')}
          </h2>
          <p className="text-gray-500 mt-1 font-arabic text-sm">
            {t('اختيارات عميلاتنا المفضلة لمناسبات الخطوبة، الأفراح والسهرات', 'Customer favorites for engagements, weddings and galas')}
          </p>
        </div>
        <Link
          to="/women"
          className="inline-flex items-center gap-1.5 text-royal font-bold hover:underline font-arabic text-sm"
        >
          <span>{t('عرض كل التشكيلة', 'View Entire Collection')}</span>
          {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </Link>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products?.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}

function TestimonialsSection() {
  const { t } = useLanguage()
  const reviews = [
    {
      name: 'د. ندى الشريف',
      city: 'القاهرة - التجمع الخامس',
      date: 'منذ أسبوع',
      rating: 5,
      comment: 'أجمل فستان سهرة استلمته على الإطلاق! القماش فخم جداً وخامته ثقيلة ومحترمة، والخياطة أنظف من الصور بكتير. والأهم إن المندوب استنى لحد ما عاينت الفستان واطمنت للمقاس.',
      product: 'فستان سهرة أزرق ملكي',
    },
    {
      name: 'أ. منى عبد الرحمن',
      city: 'الإسكندرية - سموحة',
      date: 'منذ أسبوعين',
      rating: 5,
      comment: 'تفصيل فستان بنتي كان مظبوط بالملي زي ما طلبته، والتطريز رقيق جداً وغير مزعج للطفلة. شكراً لذوقكم في التعامل وسرعة الشحن في أقل من 3 أيام.',
      product: 'فستان أميرة للأطفال',
    },
    {
      name: 'ريم خالد',
      city: 'المنصورة - حي الجامعة',
      date: 'منذ 3 أسابيع',
      rating: 5,
      comment: 'خدمة راقية وتواصل محترم جداً على الواتساب. ساعدوني في اختيار المقاس المناسب بناءً على طولي ووزني، والعباية طلعت أنيقة جداً وفخمة في اللبس.',
      product: 'عباية كلاسيكية فاخرة',
    },
  ]

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto bg-gray-50/70 rounded-3xl border border-gray-100 my-8">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-arabic">
          ⭐ {t('تجارب حقيقية', 'Verified Experiences')}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 font-arabic">
          {t('آراء عميلاتنا المتميزات', 'Customer Testimonials')}
        </h2>
        <p className="text-gray-500 mt-1 font-arabic text-sm">
          {t('ثقة عميلاتنا هي فخرنا وأساس تميزنا في عالم الأزياء', 'Our clients trust is our proudest achievement')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((r, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Stars */}
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {Array.from({ length: r.rating }).map((_, idx) => (
                  <Star key={idx} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed font-arabic mb-4 italic">
                "{r.comment}"
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 text-sm font-arabic">{r.name}</h4>
                <p className="text-xs text-gray-400 font-arabic">{r.city}</p>
              </div>
              <span className="text-[11px] text-royal font-bold bg-royal/5 px-2.5 py-1 rounded-lg font-arabic">
                {r.product}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function BespokeConsultationBanner({ waNumber }: { waNumber: string }) {
  const { t } = useLanguage()
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent('مرحباً مصممي R&A، أرغب في استشارة لتفصيل فستان بمقاساتي الخاصة لمناسبة قريبة 💎')}`
    : '#'

  return (
    <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-royal-dark via-royal to-royal-light rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-2xl text-center md:text-start">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-arabic font-bold text-amber-300">
            <Sparkles size={14} />
            <span>{t('خدمة الـ Haute Couture المخصصة', 'VIP Bespoke Haute Couture')}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold font-arabic">
            {t('عندك مناسبة خاصة أو تصميم مميز في خيالك؟', 'Have a Special Occasion or Custom Design in Mind?')}
          </h3>
          <p className="text-blue-100 text-sm font-arabic leading-relaxed">
            {t(
              'مصممات وخياطات أتيليه R&A على أتم استعداد لتنفيذ فستان أحلامك أو تعديل مقاسات أي موديل ليناسبك تماماً. تواصلي معنا الآن للاستشارة وتحديد موعد التفصيل.',
              'Our master tailors are ready to craft your dream dress to your exact measurements. Chat with us now.'
            )}
          </p>
        </div>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold px-8 py-4 rounded-2xl text-base font-arabic transition-all shadow-xl hover:scale-105"
        >
          <MessageCircle size={22} fill="white" />
          <span>{t('استشيري مصممينا عبر واتساب', 'Consult Our Designers on WhatsApp')}</span>
        </a>
      </div>
    </section>
  )
}

function WhyUsSection() {
  const { t } = useLanguage()
  const features = [
    {
      icon: Truck,
      titleAr: 'شحن سريع لجميع المحافظات',
      titleEn: 'Fast Shipping to All Egypt',
      descAr: 'توصيل لباب بيتك في القاهرة والإسكندرية وجميع مدن مصر خلال 2-4 أيام عمل',
      descEn: 'Delivery to your door across Cairo, Alexandria & all Egypt in 2-4 days',
    },
    {
      icon: Shield,
      titleAr: 'ضمان الجودة وحق المعاينة',
      titleEn: 'Quality Guarantee & Inspection',
      descAr: 'يحق لكِ فحص المنتج والتأكد من جودته ومقاسه مع المندوب قبل دفع ثمن الطلب',
      descEn: 'Full right to inspect fabric & fit with courier before payment',
    },
    {
      icon: RefreshCw,
      titleAr: 'استبدال واسترجاع سلس',
      titleEn: 'Easy Exchanges & Returns',
      descAr: 'إمكانية استبدال المقاس أو الموديل خلال 7 أيام بكل سهولة ومرونة',
      descEn: 'Easy size or style exchange within 7 days',
    },
    {
      icon: Star,
      titleAr: 'تصاميم كوتور حصرية',
      titleEn: 'Exclusive Couture Designs',
      descAr: 'تشكيلات فريدة بأعداد محدودة لضمان تميزكِ التام في كل مناسبة',
      descEn: 'Limited edition pieces ensuring your unique distinguished look',
    },
  ]

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-arabic">
          {t('لماذا تختارين R&A Couture؟', 'Why Choose R&A Couture?')}
        </h2>
        <p className="text-gray-500 mt-2 font-arabic text-sm">
          {t('تجربة تسوق فاخرة تضمن لكِ أعلى معايير الجودة والأمان', 'A luxury shopping experience ensuring highest standards')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-royal/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-royal">
              <f.icon size={28} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 font-arabic text-base">{t(f.titleAr, f.titleEn)}</h3>
            <p className="text-gray-500 text-xs sm:text-sm font-arabic leading-relaxed">{t(f.descAr, f.descEn)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function HomePage() {
  const { data: waNumber } = useQuery({
    queryKey: ['whatsapp-number'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_number').single()
      return data?.value || ''
    },
    staleTime: 1000 * 60 * 30,
  })

  return (
    <div className="space-y-4">
      <HeroSection waNumber={waNumber || ''} />
      <TrustBadgesBar />
      <CategoryCards />
      <NewArrivals />
      <AtelierStorySection waNumber={waNumber || ''} />
      <FeaturedProducts />
      <TestimonialsSection />
      <BespokeConsultationBanner waNumber={waNumber || ''} />
      <WhyUsSection />
    </div>
  )
}
