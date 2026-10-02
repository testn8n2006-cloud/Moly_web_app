import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, ensureAnonymousSession } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAdmin().finally(() => setLoading(false))
      } else {
        ensureAnonymousSession()
          .then(() => supabase.auth.getSession())
          .then(({ data: { session: s } }) => {
            setSession(s)
            setUser(s?.user ?? null)
          })
          .catch((err) => {
            console.warn('Anonymous session initialization warning:', err)
          })
          .finally(() => {
            setLoading(false)
          })
        return
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) checkAdmin()
      else setIsAdmin(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkAdmin() {
    try {
      const { data, error } = await supabase.rpc('is_admin')
      if (!error) setIsAdmin(data === true)
      else setIsAdmin(false)
    } catch {
      setIsAdmin(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) await checkAdmin()
    return { error: error as Error | null }
  }

  async function signOut() {
    setIsAdmin(false)
    await supabase.auth.signOut()
    await ensureAnonymousSession()
  }

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
