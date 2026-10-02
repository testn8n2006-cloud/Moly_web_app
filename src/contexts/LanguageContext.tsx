import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Language } from '@/lib/types'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (ar: string, en: string) => string
  isRTL: boolean
}

export const LANGUAGES: Record<'ar' | 'en', Language> = {
  ar: { code: 'ar', dir: 'rtl', label: 'العربية' },
  en: { code: 'en', dir: 'ltr', label: 'English' },
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('ra-couture-lang')
    return saved === 'en' ? LANGUAGES.en : LANGUAGES.ar
  })

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('ra-couture-lang', newLang.code)
    document.documentElement.lang = newLang.code
    document.documentElement.dir = newLang.dir
  }

  useEffect(() => {
    document.documentElement.lang = lang.code
    document.documentElement.dir = lang.dir
  }, [lang])

  const t = (ar: string, en: string) => lang.code === 'ar' ? ar : en

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang.dir === 'rtl' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
