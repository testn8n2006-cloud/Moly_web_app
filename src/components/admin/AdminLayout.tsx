import { useState, useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Settings, Tag,
  LogOut, Menu, Users, FileText, ChevronRight, Star, Bell
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/orders', label: 'الطلبيات', icon: ShoppingBag },
  { href: '/admin/reviews', label: 'التقييمات والآراء', icon: Star },
  { href: '/admin/social-proof', label: 'إشعارات الشراء', icon: Bell },
  { href: '/admin/coupons', label: 'كودات الخصم', icon: Tag },
  { href: '/admin/content', label: 'محتوى الموقع', icon: FileText },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
  { href: '/admin/admins', label: 'المشرفون', icon: Users },
]

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 min

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-logout on inactivity
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        await signOut()
        toast.error('تم تسجيل الخروج تلقائياً للحماية')
        navigate('/admin/login')
      }, INACTIVITY_TIMEOUT)
    }
    const events = ['mousemove', 'keydown', 'click', 'scroll']
    events.forEach(e => window.addEventListener(e, reset))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [signOut, navigate])

  async function handleLogout() {
    await signOut()
    navigate('/admin/login')
  }

  function isActive(href: string, exact = false) {
    return exact ? location.pathname === href : location.pathname.startsWith(href)
  }

  const Sidebar = (
    <div className="flex flex-col h-full bg-royal text-white">
      {/* Logo */}
      <div className="p-6 border-b border-white/20">
        <Link to="/admin" className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="R&A Couture"
            className="w-10 h-10 rounded-full object-cover shadow ring-2 ring-white/30"
          />
          <div>
            <p className="font-bold font-english tracking-wide">R&A Couture</p>
            <p className="text-blue-200 text-xs font-arabic">لوحة التحكم</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-arabic',
              isActive(item.href, item.exact)
                ? 'bg-white/20 text-white font-bold'
                : 'text-blue-100 hover:bg-white/10'
            )}
          >
            <item.icon size={18} />
            {item.label}
            {isActive(item.href, item.exact) && <ChevronRight size={14} className="mr-auto" />}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <Link to="/" target="_blank" className="flex items-center gap-2 px-4 py-2 text-blue-100 hover:text-white text-xs font-arabic mb-2">
          زيارة المتجر
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-blue-100 hover:bg-white/10 transition-colors text-sm font-arabic"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-arabic" dir="rtl">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 shadow-xl">
        {Sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex-shrink-0 shadow-xl">{Sidebar}</aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>
          <h1 className="font-bold text-gray-900 text-lg">
            {NAV_ITEMS.find(item => isActive(item.href, item.exact))?.label || 'Admin'}
          </h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <LogOut size={16} />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
