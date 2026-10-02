import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingBag, Package, AlertTriangle, TrendingUp, Users, Eye, Globe,
  type LucideIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { formatPrice, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { format, subDays, eachDayOfInterval } from 'date-fns'

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle
}: {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
  subtitle?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500 font-arabic">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1 font-arabic">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [chartMode, setChartMode] = useState<'visits' | 'orders'>('visits')

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [orders, products, newOrders, outOfStock] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('in_stock', false).eq('is_visible', true),
      ])

      // Query UNIQUE visitors safely (1 person = 1 visit, no refresh duplicates)
      let totalVisits = 0
      let todayVisits = 0
      try {
        const { data: rpcData, error } = await supabase.rpc('get_visitor_stats')
        if (!error && rpcData && typeof rpcData === 'object') {
          const statsObj = rpcData as { unique_total?: number; unique_today?: number }
          totalVisits = Number(statsObj.unique_total || 0)
          todayVisits = Number(statsObj.unique_today || 0)
        } else {
          // Fallback: fetch distinct visitor_ids
          const { data: views } = await supabase
            .from('page_views')
            .select('visitor_id, created_at')
            .limit(5000)

          if (views && views.length > 0) {
            const allVisitors = new Set(views.map(v => v.visitor_id).filter(Boolean))
            const todayVisitors = new Set(
              views
                .filter(v => new Date(v.created_at) >= todayStart)
                .map(v => v.visitor_id)
                .filter(Boolean)
            )
            totalVisits = allVisitors.size
            todayVisits = todayVisitors.size
          }
        }
      } catch (err) {
        console.warn('Page views query failed:', err)
      }

      return {
        totalOrders: orders.count || 0,
        totalProducts: products.count || 0,
        newOrders: newOrders.count || 0,
        outOfStock: outOfStock.count || 0,
        totalVisits,
        todayVisits,
      }
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // Refresh stats every minute
  })

  const { data: chartData } = useQuery({
    queryKey: ['dashboard-analytics-chart'],
    queryFn: async () => {
      const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() })
      const startDate = subDays(new Date(), 30).toISOString()

      const ordersCountByDay: Record<string, number> = {}
      const visitsCountByDay: Record<string, number> = {}

      for (const day of days) {
        const k = format(day, 'MM/dd')
        ordersCountByDay[k] = 0
        visitsCountByDay[k] = 0
      }

      // Fetch orders
      try {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('created_at')
          .gte('created_at', startDate)

        for (const order of ordersData || []) {
          const key = format(new Date(order.created_at), 'MM/dd')
          if (key in ordersCountByDay) ordersCountByDay[key]++
        }
      } catch (err) {
        console.warn('Orders chart query failed:', err)
      }

      // Fetch visits - Count UNIQUE visitors per day
      try {
        const { data: visitsData } = await supabase
          .from('page_views')
          .select('visitor_id, created_at')
          .gte('created_at', startDate)

        const uniqueByDay: Record<string, Set<string>> = {}
        for (const day of days) {
          uniqueByDay[format(day, 'MM/dd')] = new Set()
        }

        for (const v of visitsData || []) {
          const key = format(new Date(v.created_at), 'MM/dd')
          if (key in uniqueByDay && v.visitor_id) {
            uniqueByDay[key].add(v.visitor_id)
          }
        }

        for (const k of Object.keys(uniqueByDay)) {
          visitsCountByDay[k] = uniqueByDay[k].size
        }
      } catch (err) {
        console.warn('Visits chart query failed:', err)
      }

      return Object.keys(visitsCountByDay).map(date => ({
        date,
        orders: ordersCountByDay[date] || 0,
        visits: visitsCountByDay[date] || 0,
      }))
    },
    staleTime: 1000 * 60,
  })

  // Top visited pages
  const { data: topPages } = useQuery({
    queryKey: ['top-pages'],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('page_views')
          .select('page_path')
          .limit(500)

        if (!data || data.length === 0) return []

        const counts: Record<string, number> = {}
        for (const item of data) {
          counts[item.page_path] = (counts[item.page_path] || 0) + 1
        }

        const pathNames: Record<string, string> = {
          '/': 'الصفحة الرئيسية',
          '/women': 'قسم النساء',
          '/kids': 'قسم الأطفال',
          '/cart': 'سلة المشتريات',
          '/checkout': 'إتمام الطلب',
          '/favorites': 'المفضلة',
          '/about': 'من نحن',
          '/contact': 'اتصل بنا',
          '/shipping': 'الشحن والإرجاع',
          '/size-guide': 'دليل المقاسات',
        }

        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([path, count]) => ({
            path,
            name: pathNames[path] || (path.startsWith('/product/') ? 'صفحة منتج' : path),
            count,
          }))
      } catch {
        return []
      }
    },
    staleTime: 1000 * 60 * 2,
  })

  const { data: latestOrders } = useQuery({
    queryKey: ['latest-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      return data || []
    },
    staleTime: 1000 * 60,
  })

  const statusColors: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    new: 'info', confirmed: 'warning', shipped: 'success', delivered: 'success', cancelled: 'danger'
  }
  const statusLabels: Record<string, string> = {
    new: 'جديد', confirmed: 'مؤكد', shipped: 'مشحون', delivered: 'تم الاستلام ✓', cancelled: 'ملغي'
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-arabic">لوحة التحكم</h1>
            <p className="text-gray-500 text-sm font-arabic">نظرة عامة على أداء المتجر وحركة الزوار</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>متتبع الزوار الفعلي (1 لكل جهاز/يوم)</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="زوار اليوم"
            value={stats?.todayVisits?.toLocaleString('ar-EG') || 0}
            icon={Users}
            color="bg-sky-500"
            subtitle="أشخاص مختلفين اليوم"
          />
          <StatCard
            title="إجمالي الزوار"
            value={stats?.totalVisits?.toLocaleString('ar-EG') || 0}
            icon={Eye}
            color="bg-indigo-600"
            subtitle="أجهزة فريدة بدون تكرار"
          />
          <StatCard
            title="طلبيات جديدة"
            value={stats?.newOrders || 0}
            icon={TrendingUp}
            color="bg-blue-500"
            subtitle="تحتاج معالجة"
          />
          <StatCard
            title="إجمالي الطلبيات"
            value={stats?.totalOrders || 0}
            icon={ShoppingBag}
            color="bg-green-600"
            subtitle="كل الطلبات"
          />
          <StatCard
            title="المنتجات"
            value={stats?.totalProducts || 0}
            icon={Package}
            color="bg-purple-600"
            subtitle="في الكتالوج"
          />
          <StatCard
            title="نفد المخزون"
            value={stats?.outOfStock || 0}
            icon={AlertTriangle}
            color="bg-red-500"
            subtitle="تحتاج تجديد"
          />
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg font-arabic">
                {chartMode === 'visits' ? 'الزوار الفعليين - آخر 30 يوماً' : 'الطلبيات - آخر 30 يوماً'}
              </h2>
              <p className="text-gray-400 text-xs font-arabic">
                {chartMode === 'visits' ? 'عدد الأشخاص الفريدين يومياً (بدون تكرار الريفرش)' : 'تتبع نمو الطلبيات المستلمة'}
              </p>
            </div>
            
            {/* Toggle Switch */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setChartMode('visits')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium font-arabic transition-all ${
                  chartMode === 'visits'
                    ? 'bg-royal text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                الزوار
              </button>
              <button
                onClick={() => setChartMode('orders')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium font-arabic transition-all ${
                  chartMode === 'orders'
                    ? 'bg-royal text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                الطلبيات
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData || []}>
              <defs>
                <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  border: '1px solid #e2e8f0',
                  fontFamily: 'Cairo, sans-serif',
                }}
                formatter={(value: number) => [
                  value,
                  chartMode === 'visits' ? 'زائر فعلي' : 'طلب'
                ]}
                labelFormatter={(label) => `التاريخ: ${label}`}
              />
              <Area
                type="monotone"
                dataKey={chartMode === 'visits' ? 'visits' : 'orders'}
                stroke={chartMode === 'visits' ? '#1E3A8A' : '#16A34A'}
                fill={chartMode === 'visits' ? 'url(#visitsGradient)' : 'url(#ordersGradient)'}
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 2-Column Section: Latest Orders & Top Visited Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Orders (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 font-arabic">آخر الطلبيات</h2>
              <Link to="/admin/orders" className="text-sm text-royal hover:underline font-arabic">
                عرض الكل
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">رقم الطلب</th>
                    <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">العميل</th>
                    <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">الإجمالي</th>
                    <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">الحالة</th>
                    <th className="text-right px-4 py-3 font-arabic text-gray-600 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {latestOrders?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400 font-arabic">
                        لا توجد طلبات بعد
                      </td>
                    </tr>
                  ) : (
                    latestOrders?.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-english font-medium text-royal">
                          <Link to={`/admin/orders?id=${order.id}`}>{order.order_number}</Link>
                        </td>
                        <td className="px-4 py-3 font-arabic">{order.customer_name}</td>
                        <td className="px-4 py-3 font-bold">{formatPrice(order.total)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusColors[order.status] || 'default'}>
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Visited Pages (1 Col) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <Globe size={18} className="text-royal" />
                <h2 className="font-bold text-gray-900 font-arabic text-base">الصفحات الأكثر زيارة</h2>
              </div>
              <div className="space-y-3">
                {topPages && topPages.length > 0 ? (
                  topPages.map((page, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <div className="truncate pl-2">
                        <p className="font-medium text-gray-800 font-arabic truncate">{page.name}</p>
                        <p className="text-xs text-gray-400 font-mono truncate" dir="ltr">{page.path}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-royal/10 text-royal font-bold rounded-lg text-xs font-english flex-shrink-0">
                        {page.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8 font-arabic">
                    سيظهر نشاط الزوار هنا بعد بدء التصفح
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-400 font-arabic">يتم التحديث المباشر لحركة التصفح</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

