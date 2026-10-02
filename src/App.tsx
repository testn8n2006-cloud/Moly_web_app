import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { ToastProvider } from '@/components/ui/Toast'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { PromoBar } from '@/components/layout/PromoBar'
import { VisitorTracker } from '@/components/layout/VisitorTracker'
import { SocialProofPopup } from '@/components/layout/SocialProofPopup'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { Suspense, lazy } from 'react'

// Lazy load pages
const HomePage = lazy(() => import('@/pages/HomePage'))
const WomenPage = lazy(() => import('@/pages/WomenPage'))
const KidsPage = lazy(() => import('@/pages/KidsPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const ThankYouPage = lazy(() => import('@/pages/ThankYouPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const ShippingPage = lazy(() => import('@/pages/ShippingPage'))
const SizeGuidePage = lazy(() => import('@/pages/SizeGuidePage'))
const OrderTrackPage = lazy(() => import('@/pages/OrderTrackPage'))
// Admin pages
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'))
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'))
const AdminContent = lazy(() => import('@/pages/admin/AdminContent'))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'))
const AdminCoupons = lazy(() => import('@/pages/admin/AdminCoupons'))
const AdminAdmins = lazy(() => import('@/pages/admin/AdminAdmins'))
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews'))
const AdminSocialProof = lazy(() => import('@/pages/admin/AdminSocialProof'))

function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PromoBar />
      <Header />
      <main className="flex-1 pt-16 sm:pt-20">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
      <SocialProofPopup />
    </div>
  )
}

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 border-4 border-royal border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <ToastProvider />
                <VisitorTracker />
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Storefront */}
                  <Route path="/" element={
                    <StorefrontLayout><HomePage /></StorefrontLayout>
                  } />
                  <Route path="/women" element={
                    <StorefrontLayout><WomenPage /></StorefrontLayout>
                  } />
                  <Route path="/kids" element={
                    <StorefrontLayout><KidsPage /></StorefrontLayout>
                  } />
                  <Route path="/product/:id" element={
                    <StorefrontLayout><ProductDetailPage /></StorefrontLayout>
                  } />
                  <Route path="/favorites" element={
                    <StorefrontLayout><FavoritesPage /></StorefrontLayout>
                  } />
                  <Route path="/cart" element={
                    <StorefrontLayout><CartPage /></StorefrontLayout>
                  } />
                  <Route path="/checkout" element={
                    <StorefrontLayout><CheckoutPage /></StorefrontLayout>
                  } />
                  <Route path="/thank-you" element={
                    <StorefrontLayout><ThankYouPage /></StorefrontLayout>
                  } />
                  <Route path="/about" element={
                    <StorefrontLayout><AboutPage /></StorefrontLayout>
                  } />
                  <Route path="/contact" element={
                    <StorefrontLayout><ContactPage /></StorefrontLayout>
                  } />
                  <Route path="/shipping" element={
                    <StorefrontLayout><ShippingPage /></StorefrontLayout>
                  } />
                  <Route path="/size-guide" element={
                    <StorefrontLayout><SizeGuidePage /></StorefrontLayout>
                  } />
                  <Route path="/track-order" element={
                    <StorefrontLayout><OrderTrackPage /></StorefrontLayout>
                  } />
                  {/* Admin */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                  <Route path="/admin/products" element={<AdminGuard><AdminProducts /></AdminGuard>} />
                  <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
                  <Route path="/admin/content" element={<AdminGuard><AdminContent /></AdminGuard>} />
                  <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />
                  <Route path="/admin/coupons" element={<AdminGuard><AdminCoupons /></AdminGuard>} />
                  <Route path="/admin/admins" element={<AdminGuard><AdminAdmins /></AdminGuard>} />
                  <Route path="/admin/reviews" element={<AdminGuard><AdminReviews /></AdminGuard>} />
                  <Route path="/admin/social-proof" element={<AdminGuard><AdminSocialProof /></AdminGuard>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </BrowserRouter>
  )
}
