import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const { signIn, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)

  useEffect(() => {
    if (!loading && isAdmin) navigate('/admin', { replace: true })
  }, [isAdmin, loading, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (lockedUntil && new Date() < lockedUntil) {
      const remainSecs = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)
      toast.error(`تم تجاوز عدد المحاولات. حاول بعد ${remainSecs} ثانية`)
      return
    }
    setSubmitting(true)
    const { error } = await signIn(email, password)
    if (error) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 5) {
        const lockTime = new Date(Date.now() + 5 * 60 * 1000)
        setLockedUntil(lockTime)
        toast.error('تم إغلاق الحساب مؤقتاً لمدة 5 دقائق')
      } else {
        toast.error('بيانات الدخول غير صحيحة')
      }
    } else {
      setAttempts(0)
      setLockedUntil(null)
    }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-royal border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <img
            src="/logo.jpg"
            alt="R&A Couture"
            className="w-20 h-20 rounded-full object-cover mx-auto mb-3 shadow-md ring-4 ring-royal/10"
          />
          <h1 className="text-2xl font-bold text-royal font-english tracking-wide">R&A Couture</h1>
          <p className="text-gray-500 text-sm font-arabic mt-1">لوحة تحكم المشرف</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              required
              className="w-full pr-9 pl-4 py-3 border border-gray-200 rounded-xl font-arabic focus:outline-none focus:ring-2 focus:ring-royal/40"
              dir="ltr"
            />
          </div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              required
              className="w-full pr-4 pl-10 py-3 border border-gray-200 rounded-xl font-arabic focus:outline-none focus:ring-2 focus:ring-royal/40"
              dir="ltr"
            />
            <button type="button" onClick={() => setShowPass(s => !s)} className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Button type="submit" fullWidth loading={submitting} className="font-arabic py-3">
            دخول
          </Button>
        </form>

        {attempts > 0 && attempts < 5 && (
          <p className="text-amber-600 text-xs text-center mt-3 font-arabic">
            {5 - attempts} محاولات متبقية قبل القفل المؤقت
          </p>
        )}
      </div>
    </div>
  )
}
