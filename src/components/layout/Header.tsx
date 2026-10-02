import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Heart, Menu, X, Globe, Search, Sun, Moon } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { SearchModal } from './SearchModal'
import { cn } from '@/lib/utils'

export function Header() {
  const { count: cartCount } = useCart()
  const { count: favCount } = useFavorites()
  const { lang, setLang, t } = useLanguage()
  const { isDark, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Keyboard shortcut Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  const navLinks = [
    { href: '/', label: t('الرئيسية', 'Home') },
    { href: '/women', label: t('نساء', 'Women') },
    { href: '/kids', label: t('أطفال', 'Kids') },
    { href: '/track-order', label: t('تتبع الطلب', 'Track Order') },
    { href: '/about', label: t('عننا', 'About') },
    { href: '/contact', label: t('اتصل بنا', 'Contact') },
  ]

  return (
    <header className={cn(
      'fixed top-0 inset-x-0 z-40 transition-all duration-300',
      scrolled 
        ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-slate-800' 
        : 'bg-white dark:bg-slate-950 border-b border-transparent dark:border-slate-900'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="R&A Couture"
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-full object-cover shadow-sm ring-2 ring-royal/20 dark:ring-blue-500/30"
            />
            <div>
              <p className="font-bold text-royal dark:text-blue-200 text-base sm:text-xl font-english leading-tight tracking-wide">R&A Couture</p>
              <p className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-arabic">أزياء وتفصيل راقٍ</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-sm font-medium transition-colors font-arabic',
                  location.pathname === link.href 
                    ? 'text-royal dark:text-blue-400 font-bold' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-royal dark:hover:text-blue-300'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-royal dark:hover:text-white hover:bg-royal/5 dark:hover:bg-slate-800 transition-all border border-gray-200/60 dark:border-slate-800"
              title={t('بحث (Ctrl+K)', 'Search (Ctrl+K)')}
              aria-label={t('بحث', 'Search')}
            >
              <Search size={18} className="text-gray-500 dark:text-gray-400" />
              <span className="hidden lg:inline text-xs text-gray-400 dark:text-gray-400 font-arabic">{t('بحث...', 'Search...')}</span>
              <kbd className="hidden xl:inline-flex items-center text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 font-sans">
                ⌘K
              </kbd>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? t('الوضع النهاري', 'Light Mode') : t('الوضع الليلي', 'Dark Mode')}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun size={20} className="text-amber-400" />
              ) : (
                <Moon size={20} className="text-royal" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang.code === 'ar' ? LANGUAGES.en : LANGUAGES.ar)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title="Switch language"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">{lang.code === 'ar' ? 'EN' : 'ع'}</span>
            </button>

            {/* Favorites */}
            <Link
              to="/favorites"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('المفضلة', 'Favorites')}
            >
              <Heart size={22} className="text-gray-600 dark:text-gray-300" />
              {favCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {favCount > 99 ? '99+' : favCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('السلة', 'Cart')}
            >
              <ShoppingBag size={22} className="text-gray-600 dark:text-gray-300" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-royal dark:bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-slate-800 py-4 animate-slide-up bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-4 py-3 rounded-xl text-sm font-medium font-arabic transition-colors',
                    location.pathname === link.href
                      ? 'bg-royal/10 dark:bg-blue-900/40 text-royal dark:text-blue-300 font-bold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-900'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Global Realtime Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
