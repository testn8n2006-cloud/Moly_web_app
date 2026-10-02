import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface AdminGuardProps {
  children: ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin/login', { replace: true })
    }
  }, [isAdmin, loading, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-arabic text-sm">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return <>{children}</>
}
