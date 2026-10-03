import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Search, MessageCircle, Download, Eye, ChevronDown, Check,
  Sparkles, CheckCircle2, Truck, XCircle, Printer,
  MapPin, PackageCheck, AlertCircle, ArrowUpRight,
  Copy, Star, Smartphone, Monitor, Tablet,
  Trash2, Archive, ArchiveRestore
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order, OrderWithItems } from '@/lib/types'
import { getProductSku, formatProductSku } from '@/lib/sku'
import toast from 'react-hot-toast'

type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

interface StatusConfig {
  value: OrderStatus
  label: string
  shortLabel: string
  desc: string
  bg: string
  text: string
  border: string
  dot: string
  icon: typeof Sparkles
  nextAction?: {
    nextStatus: OrderStatus
    label: string
    icon: typeof Check
    btnClass: string
  }
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  new: {
    value: 'new',
    label: 'طلب جديد',
    shortLabel: 'جديد',
    desc: 'تم استلام الطلب وبانتظار المراجعة والتأكيد',
    bg: 'bg-blue-50 hover:bg-blue-100/80',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500 animate-pulse',
    icon: Sparkles,
    nextAction: {
      nextStatus: 'confirmed',
      label: 'تأكيد ✓',
      icon: Check,
      btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
  },
  confirmed: {
    value: 'confirmed',
    label: 'مؤكد وجارِ التجهيز',
    shortLabel: 'مؤكد',
    desc: 'تم التواصل والاتفاق، وجارِ تحضير الفستان للشحن',
    bg: 'bg-amber-50 hover:bg-amber-100/80',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: CheckCircle2,
    nextAction: {
      nextStatus: 'shipped',
      label: 'شحن 🚚',
      icon: Truck,
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  },
  shipped: {
    value: 'shipped',
    label: 'تم الشحن والتسليم للمندوب',
    shortLabel: 'مشحون',
    desc: 'خرج مع شركة الشحن أو المندوب وهو في الطريق للعميل',
    bg: 'bg-emerald-50 hover:bg-emerald-100/80',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: Truck,
    nextAction: {
      nextStatus: 'delivered',
      label: 'تم الاستلام ✨',
      icon: PackageCheck,
      btnClass: 'bg-teal-600 hover:bg-teal-700 text-white',
    },
  },
  delivered: {
    value: 'delivered',
    label: 'تم استلام العميل للطلب بنجاح',
    shortLabel: 'مستلم ✓',
    desc: 'استلم العميل الفستان وتأكد منه وتم تحصيل المبلغ بنجاح',
    bg: 'bg-teal-50 hover:bg-teal-100/80',
    text: 'text-teal-800',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
    icon: PackageCheck,
  },
  cancelled: {
    value: 'cancelled',
    label: 'طلب ملغي',
    shortLabel: 'ملغي',
    desc: 'تم إلغاء الطلب بناءً على رغبة العميل أو لعدم الرد',
    bg: 'bg-rose-50 hover:bg-rose-100/80',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    icon: XCircle,
  },
}

// Interactive Custom Status Badge with Dropdown
function StatusDropdown({
  currentStatus,
  onSelect,
  disabled = false,
}: {
  currentStatus: OrderStatus
  onSelect: (newStatus: OrderStatus) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.new
  const Icon = cfg.icon

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative inline-block text-right" ref={menuRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-arabic border transition-all duration-200 shadow-sm active:scale-95 ${cfg.bg} ${cfg.text} ${cfg.border}`}
      >
        <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
        <Icon size={13} className="flex-shrink-0" />
        <span>{cfg.shortLabel}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 opacity-60 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 animate-slide-up focus:outline-none">
          <div className="px-3 py-2 text-xs font-bold text-gray-400 font-arabic border-b border-gray-100 mb-1">
            تحديث حالة الطلب
          </div>
          <div className="space-y-1">
            {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(statusKey => {
              const item = STATUS_CONFIG[statusKey]
              const ItemIcon = item.icon
              const isSelected = item.value === currentStatus

              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => {
                    onSelect(statusKey)
                    setOpen(false)
                  }}
                  className={`w-full text-right px-3 py-2 rounded-xl flex items-start gap-2.5 transition-colors font-arabic ${
                    isSelected
                      ? `${item.bg} ${item.text} font-bold`
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <ItemIcon size={16} className={`mt-0.5 flex-shrink-0 ${isSelected ? item.text : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{item.label}</span>
                      {isSelected && <Check size={14} className={item.text} />}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-normal leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminOrders() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  // Query all orders
  const { data: allOrders, isLoading } = useQuery({
    queryKey: ['admin-orders-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as Order[]
    },
    staleTime: 1000 * 30,
  })

  // Helper to determine if order is archived
  function isOrderArchived(order: Order): boolean {
    return Boolean(
      (order as any).is_archived ||
      order.admin_notes?.includes('[مؤرشف]') ||
      order.admin_notes?.includes('[ARCHIVED]')
    )
  }

  // Active vs Archived split
  const nonArchivedOrders = (allOrders || []).filter(o => !isOrderArchived(o))
  const archivedOrders = (allOrders || []).filter(o => isOrderArchived(o))

  // Status counts for tabs
  const counts = {
    all: nonArchivedOrders.length,
    new: nonArchivedOrders.filter(o => o.status === 'new').length,
    confirmed: nonArchivedOrders.filter(o => o.status === 'confirmed').length,
    shipped: nonArchivedOrders.filter(o => o.status === 'shipped').length,
    delivered: nonArchivedOrders.filter(o => o.status === 'delivered').length,
    cancelled: nonArchivedOrders.filter(o => o.status === 'cancelled').length,
    archived: archivedOrders.length,
  }

  // Filter in memory for instant lightning-fast tab switching & search
  const filteredOrders = (allOrders || []).filter(order => {
    const isArchived = isOrderArchived(order)

    if (statusFilter === 'archived') {
      if (!isArchived) return false
    } else {
      if (isArchived) return false
      if (statusFilter && order.status !== statusFilter) return false
    }

    const term = search.trim().toLowerCase()
    const matchesSearch =
      !term ||
      order.order_number.toLowerCase().includes(term) ||
      order.customer_name.toLowerCase().includes(term) ||
      order.phone.includes(term) ||
      order.city.toLowerCase().includes(term) ||
      (order.device_id && order.device_id.toLowerCase().includes(term))
    return matchesSearch
  })

  async function openOrderDetail(order: Order) {
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
    setSelectedOrder({ ...order, order_items: (data || []) as OrderWithItems['order_items'] })
    setAdminNotes(order.admin_notes || '')
  }

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      toast.error(error.message)
      return
    }

    const cfg = STATUS_CONFIG[newStatus]
    toast.success(`تم تحديث حالة الطلب إلى: ${cfg.label}`)
    qc.invalidateQueries({ queryKey: ['admin-orders-list'] })

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : null))
    }
  }

  // Toggle Archive Status
  async function toggleArchive(order: Order) {
    setArchivingId(order.id)
    const currentlyArchived = isOrderArchived(order)
    const newArchived = !currentlyArchived

    try {
      // 1. Attempt updating is_archived column in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ is_archived: newArchived } as any)
        .eq('id', order.id)

      if (error) {
        // Fallback: tag in admin_notes if column not yet added in Supabase
        let updatedNotes = order.admin_notes || ''
        if (newArchived) {
          updatedNotes = `[مؤرشف] ${updatedNotes}`.trim()
        } else {
          updatedNotes = updatedNotes.replace('[مؤرشف]', '').replace('[ARCHIVED]', '').trim()
        }
        const { error: notesErr } = await supabase
          .from('orders')
          .update({ admin_notes: updatedNotes })
          .eq('id', order.id)

        if (notesErr) throw notesErr
      }

      toast.success(newArchived ? 'تم نقل الطلب إلى الأرشيف 📦' : 'تمت استعادة الطلب من الأرشيف ✓')
      qc.invalidateQueries({ queryKey: ['admin-orders-list'] })
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء أرشفة الطلب'
      toast.error(msg)
    } finally {
      setArchivingId(null)
    }
  }

  // Completely Delete Order
  async function confirmDeleteOrder() {
    if (!orderToDelete) return
    setDeleting(true)
    try {
      // 1. Delete associated order items first
      await supabase.from('order_items').delete().eq('order_id', orderToDelete.id)

      // 2. Delete the order record
      const { error } = await supabase.from('orders').delete().eq('id', orderToDelete.id)

      if (error) {
        toast.error(`تعذر حذف الطلب: ${error.message}`)
        return
      }

      toast.success(`تم حذف الطلب رقم ${orderToDelete.order_number} نهائياً 🗑️`)
      qc.invalidateQueries({ queryKey: ['admin-orders-list'] })
      if (selectedOrder?.id === orderToDelete.id) {
        setSelectedOrder(null)
      }
      setOrderToDelete(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حذف الطلب'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  async function saveNotes() {
    if (!selectedOrder) return
    setSavingNotes(true)
    await supabase.from('orders').update({ admin_notes: adminNotes }).eq('id', selectedOrder.id)
    toast.success('تم حفظ ملاحظات الطلب')
    setSavingNotes(false)
  }

  function sendCustomerStatusWhatsApp(order: Order, targetStatus?: OrderStatus) {
    const status = targetStatus || order.status
    const cleanPhone = order.phone.replace(/[^0-9]/g, '')
    const phoneFormatted = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone

    let msg = ''
    if (status === 'confirmed') {
      msg = `أهلاً بحضرتك أستاذة *${order.customer_name}* 🌸\n` +
            `نود إعلامك بأنه تم تأكيد طلبك رقم *${order.order_number}* من *R&A Couture* وجاري تجهيزه بكل حب وإتقان! 👗✨\n\n` +
            `إجمالي الطلب: *${formatPrice(order.total)}*\n` +
            `سنوافيكِ فور خروج الطلب للشحن إلى ${order.city}. شكراً لثقتك بنا 💙`
    } else if (status === 'shipped') {
      msg = `أهلاً بحضرتك أستاذة *${order.customer_name}* 🚚👗\n` +
            `نبشرك بأن طلبك رقم *${order.order_number}* من *R&A Couture* قد تم شحنه وهو في الطريق إليكِ الآن إلى ${order.city}.\n\n` +
            `💵 المبلغ المطلوب للدفع عند الاستلام: *${formatPrice(order.total)}*.\n` +
            `نتمنى أن ينال إعجابك وتتألقي به دائماً! ✨`
    } else if (status === 'delivered') {
      msg = `أهلاً بحضرتك أستاذة *${order.customer_name}* 💖✨\n` +
            `تم تأكيد استلام طلبك رقم *${order.order_number}* من *R&A Couture* بنجاح!\n` +
            `سعداء جداً بخدمتك ونتمنى أن ينال الفستان إعجابك وتتألقي به في أجمل مناسباتك.\n\n` +
            `نسعد بمشاركة رأيك وصورتكِ لتجربتك معنا 👗🌸`
    } else if (status === 'cancelled') {
      msg = `أهلاً بحضرتك أستاذة *${order.customer_name}* 🌸\n` +
            `بخصوص طلبك رقم *${order.order_number}*، نود إعلامك بأنه تم إلغاء الطلب بناءً على رغبتك.\n` +
            `نسعد دائماً بخدمتك ونتشرف بزيارتك لـ R&A Couture في أي وقت 💙`
    } else {
      msg = `أهلاً بحضرتك أستاذة *${order.customer_name}* 🌸\n` +
            `نتواصل معك من *R&A Couture* بخصوص طلبك رقم *${order.order_number}* بقيمة *${formatPrice(order.total)}*.\n` +
            `هل يمكننا تأكيد موعد وعنوان التوصيل لحضرتك؟`
    }

    const url = `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  function printInvoice(order: OrderWithItems) {
    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) {
      toast.error('يرجى السماح بالنوافذ المنبثقة لطباعة البوليصة')
      return
    }

    const itemsHtml = order.order_items.map(item => {
      const sku = item.product_id ? formatProductSku(getProductSku({ id: item.product_id, sku: (item.product as any)?.sku })) : ''
      return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: Cairo, sans-serif;">
          <strong style="color:#0f172a;">${item.product_name}</strong>
          ${sku ? `<span style="font-family:Poppins, sans-serif; color:#1E3A8A; font-weight:bold; font-size:11px; background:#eff6ff; border:1px solid #bfdbfe; padding:2px 6px; border-radius:4px; margin-right:6px;">${sku}</span>` : ''}
          ${item.size === 'مقاس خاص' ? `<span style="color:#b45309; background:#fef3c7; font-weight:bold; padding:2px 6px; border-radius:4px; font-size:12px; margin-right:6px;">✂️ تفصيل بمقاس خاص</span>` : (item.size ? `<span style="color:#64748b; font-size:12px; margin-right:6px;">المقاس: ${item.size}</span>` : '')}
          ${item.color ? `<span style="color:#64748b; font-size:12px; margin-right:6px;">اللون: ${item.color}</span>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight:bold;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left;">${item.unit_price} ج.م</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; font-weight:bold; color:#1E3A8A;">${(item.unit_price * item.quantity).toFixed(2)} ج.م</td>
      </tr>
    `}).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>بوليصة وفاتورة شحن - ${order.order_number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; margin: 30px; color: #1e293b; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #102048; padding-bottom: 15px; margin-bottom: 25px; }
          .brand-title { font-size: 26px; font-weight: 800; color: #102048; font-family: Poppins, sans-serif; letter-spacing: 1px; }
          .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #102048; color: white; padding: 10px; text-align: right; font-size: 13px; font-weight: 700; }
          .total-box { margin-top: 20px; text-align: left; font-size: 15px; border-top: 2px solid #e2e8f0; padding-top: 12px; }
          .cod-card { background: #ecfdf5; border: 2px dashed #059669; color: #065f46; padding: 14px; text-align: center; border-radius: 12px; font-size: 20px; font-weight: 800; margin-top: 25px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-title">R&A COUTURE</div>
            <div style="font-size: 13px; color: #64748b;">أزياء وتفصيل راقٍ - جمهورية مصر العربية</div>
          </div>
          <div style="text-align: left;">
            <div style="font-size: 20px; font-weight: 800; color: #102048;">بوليصة شحن وتوصيل</div>
            <div style="font-size: 13px; color: #475569; font-weight: bold;">رقم الطلب: ${order.order_number}</div>
            <div style="font-size: 12px; color: #94a3b8;">التاريخ: ${new Date(order.created_at).toLocaleDateString('ar-EG')}</div>
          </div>
        </div>

        <div class="box">
          <h3 style="margin-top:0; margin-bottom: 10px; font-size: 15px; color: #102048;">📍 بيانات العميل والتوصيل:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
            <div><strong>اسم العميل:</strong> ${order.customer_name}</div>
            <div><strong>رقم الهاتف:</strong> <span dir="ltr">${order.phone}</span></div>
            <div><strong>المحافظة / المدينة:</strong> ${order.city}</div>
            <div><strong>طريقة الدفع:</strong> دفع عند الاستلام (COD)</div>
            ${order.browser_info ? `<div><strong>جهاز العميل:</strong> ${order.browser_info}</div>` : ''}
            ${order.device_id ? `<div><strong>معرف الجهاز:</strong> <code style="font-size:11px;">${order.device_id.substring(0, 16)}...</code></div>` : ''}
            <div style="grid-column: span 2;"><strong>العنوان بالتفصيل:</strong> ${order.address}</div>
            ${order.notes ? `<div style="grid-column: span 2; color:#c2410c; background:#fff7ed; padding:6px 10px; border-radius:6px;"><strong>ملاحظات التوصيل:</strong> ${order.notes}</div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>المنتج والمواصفات</th>
              <th style="text-align:center;">الكمية</th>
              <th style="text-align:left;">السعر</th>
              <th style="text-align:left;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-box">
          <div>المجموع الفرعي: <strong>${order.subtotal} ج.م</strong></div>
          ${order.discount > 0 ? `<div style="color:#059669;">قيمة الخصم: <strong>-${order.discount} ج.م</strong></div>` : ''}
          <div>تكلفة التوصيل والشحن: <strong>${order.shipping_fee} ج.م</strong></div>
          <div style="font-size: 20px; font-weight: 800; color: #102048; margin-top: 8px;">
            المبلغ المطلوب تحصيله: ${order.total} ج.م
          </div>
        </div>

        <div class="cod-card">
          💵 المطلوب تحصيله نقداً من العميل: ${order.total} جنيه مصري
        </div>

        <div style="text-align: center; margin-top: 35px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          شكراً لتسوقكم معنا في R&A Couture ✨ | للتواصل والدعم عبر واتساب المتجر
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  function exportCSV() {
    if (!filteredOrders.length) return
    const rows = [
      ['رقم الطلب', 'العميل', 'الهاتف', 'المدينة', 'العنوان', 'الإجمالي', 'الحالة', 'التاريخ'],
      ...filteredOrders.map(o => [
        o.order_number,
        o.customer_name,
        o.phone,
        o.city,
        `"${o.address.replace(/"/g, '""')}"`,
        o.total,
        STATUS_CONFIG[o.status]?.label || o.status,
        o.created_at,
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `orders-ra-couture-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-arabic">إدارة الطلبيات</h1>
            <p className="text-gray-500 text-sm font-arabic">تتبع ومتابعة مراحل شحن وتوصيل طلبات العملاء</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2 font-arabic">
              <Download size={15} />
              تصدير إكسل / CSV
            </Button>
          </div>
        </div>

        {/* Status Filter Tabs (Shopify Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-arabic transition-all whitespace-nowrap flex items-center gap-2 ${
              statusFilter === ''
                ? 'bg-royal text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>جميع الطلبات</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === '' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('new')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-arabic transition-all whitespace-nowrap flex items-center gap-2 ${
              statusFilter === 'new'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>جديدة (تحتاج تأكيد)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === 'new' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {counts.new}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-arabic transition-all whitespace-nowrap flex items-center gap-2 ${
              statusFilter === 'confirmed'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <CheckCircle2 size={15} />
            <span>مؤكدة (قيد التجهيز)</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === 'confirmed' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {counts.confirmed}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('shipped')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-arabic transition-all whitespace-nowrap flex items-center gap-2 ${
              statusFilter === 'shipped'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <Truck size={15} />
            <span>تم الشحن</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === 'shipped' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {counts.shipped}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-arabic transition-all whitespace-nowrap flex items-center gap-2 ${
              statusFilter === 'delivered'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-teal-800 hover:bg-teal-50 border border-teal-200'
            }`}
          >
            <PackageCheck size={15} />
            <span>تم الاستلام ✓</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === 'delivered' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}`}>
              {counts.delivered}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-arabic transition-all whitespace-nowrap flex items-center gap-2 ${
              statusFilter === 'cancelled'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <XCircle size={15} />
            <span>ملغاة</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === 'cancelled' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {counts.cancelled}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-arabic transition-all whitespace-nowrap flex items-center gap-2 ${
              statusFilter === 'archived'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Archive size={15} />
            <span>الأرشيف</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === 'archived' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {counts.archived}
            </span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث برقم الطلب، اسم العميل، الهاتف، أو المدينة..."
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal shadow-sm transition-all"
          />
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-4 py-3.5 font-arabic text-gray-600 font-semibold">رقم الطلب</th>
                  <th className="text-right px-4 py-3.5 font-arabic text-gray-600 font-semibold">العميل</th>
                  <th className="text-right px-4 py-3.5 font-arabic text-gray-600 font-semibold">المحافظة / المدينة</th>
                  <th className="text-right px-4 py-3.5 font-arabic text-gray-600 font-semibold">الإجمالي</th>
                  <th className="text-right px-4 py-3.5 font-arabic text-gray-600 font-semibold">حالة الطلب (انقر للتغيير)</th>
                  <th className="text-right px-4 py-3.5 font-arabic text-gray-600 font-semibold">إجراء سريع</th>
                  <th className="text-right px-4 py-3.5 font-arabic text-gray-600 font-semibold">التاريخ</th>
                  <th className="text-center px-4 py-3.5 font-arabic text-gray-600 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new
                  const nextAction = cfg.nextAction

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Order Number */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => openOrderDetail(order)}
                          className="font-english font-bold text-royal hover:underline flex items-center gap-1 group"
                        >
                          <span>{order.order_number}</span>
                          <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      {/* Customer Info */}
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-arabic font-bold text-gray-900 leading-tight">{order.customer_name}</p>
                            {order.device_type === 'mobile' && (
                              <span className="text-[10px] bg-blue-50 text-royal px-1.5 py-0.5 rounded font-arabic border border-blue-100 flex items-center gap-0.5" title={order.browser_info || 'طلب عبر الهاتف'}>
                                <Smartphone size={10} />
                                <span>جوال</span>
                              </span>
                            )}
                            {order.device_type === 'tablet' && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-arabic border border-purple-100 flex items-center gap-0.5" title={order.browser_info || 'طلب عبر التابلت'}>
                                <Tablet size={10} />
                                <span>تابلت</span>
                              </span>
                            )}
                            {order.device_type === 'desktop' && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-arabic border border-slate-200 flex items-center gap-0.5" title={order.browser_info || 'طلب عبر الكمبيوتر'}>
                                <Monitor size={10} />
                                <span>كمبيوتر</span>
                              </span>
                            )}
                          </div>
                          <a
                            href={`tel:${order.phone}`}
                            className="font-english text-xs text-gray-500 hover:text-royal transition-colors inline-block mt-0.5"
                            dir="ltr"
                          >
                            {order.phone}
                          </a>
                        </div>
                      </td>

                      {/* City */}
                      <td className="px-4 py-3.5 font-arabic text-gray-700">
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2.5 py-1 rounded-md">
                          <MapPin size={12} className="text-gray-400" />
                          {order.city}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-gray-900 text-sm">
                          {formatPrice(order.total)}
                        </span>
                      </td>

                      {/* Status Dropdown Selector */}
                      <td className="px-4 py-3.5">
                        <StatusDropdown
                          currentStatus={order.status}
                          onSelect={newStatus => updateStatus(order.id, newStatus)}
                        />
                      </td>

                      {/* Quick Pipeline Advance Button */}
                      <td className="px-4 py-3.5">
                        {nextAction ? (
                          <button
                            onClick={() => updateStatus(order.id, nextAction.nextStatus)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-arabic shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1 ${nextAction.btnClass}`}
                            title={`تغيير الحالة إلى ${STATUS_CONFIG[nextAction.nextStatus].label}`}
                          >
                            <span>{nextAction.label}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-arabic">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-gray-500 text-xs font-arabic whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>

                      {/* Row Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openOrderDetail(order)}
                            className="p-1.5 rounded-lg hover:bg-royal/10 text-gray-500 hover:text-royal transition-colors"
                            title="عرض تفاصيل الطلب"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => sendCustomerStatusWhatsApp(order)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors"
                            title="إرسال إشعار للعميل عبر واتساب"
                          >
                            <MessageCircle size={16} />
                          </button>

                          <button
                            onClick={() => toggleArchive(order)}
                            disabled={archivingId === order.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isOrderArchived(order)
                                ? 'hover:bg-amber-50 text-amber-600 hover:text-amber-700'
                                : 'hover:bg-slate-100 text-gray-400 hover:text-slate-700'
                            }`}
                            title={isOrderArchived(order) ? 'استعادة من الأرشيف' : 'أرشفة الطلب'}
                          >
                            {isOrderArchived(order) ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                          </button>

                          <button
                            onClick={() => setOrderToDelete(order)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                            title="حذف الطلب نهائياً"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredOrders.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={28} className="text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-800 text-base font-arabic">لا توجد طلبيات تطابق الفلتر</h3>
              <p className="text-gray-400 text-xs font-arabic mt-1">جرب البحث بكلمات أخرى أو اختر تبويباً مختلفاً</p>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        <Modal
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`تفاصيل الطلب: ${selectedOrder?.order_number}`}
          size="lg"
        >
          {selectedOrder && (
            <div className="space-y-6">
              {/* Stepper Pipeline Visual */}
              {selectedOrder.status !== 'cancelled' ? (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 font-arabic mb-3">مرحلة تقدم الطلب:</p>
                  <div className="grid grid-cols-4 gap-2 text-center relative">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm text-xs font-bold">
                        <Check size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-800 font-arabic mt-1.5">استلام الطلب</span>
                      <span className="text-[10px] text-gray-400 font-arabic">جديد</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm text-xs font-bold transition-colors ${
                        selectedOrder.status !== 'new'
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? <Check size={16} /> : <PackageCheck size={16} />}
                      </div>
                      <span className="text-xs font-bold text-gray-800 font-arabic mt-1.5">التأكيد والتجهيز</span>
                      <span className="text-[10px] text-gray-400 font-arabic">
                        {selectedOrder.status === 'confirmed' ? 'جاري الآن' : (selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') ? 'مكتمل ✓' : 'قيد الانتظار'}
                      </span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm text-xs font-bold transition-colors ${
                        selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {selectedOrder.status === 'delivered' ? <Check size={16} /> : <Truck size={16} />}
                      </div>
                      <span className="text-xs font-bold text-gray-800 font-arabic mt-1.5">الشحن والتسليم</span>
                      <span className="text-[10px] text-gray-400 font-arabic">
                        {selectedOrder.status === 'delivered' ? 'مكتمل ✓' : selectedOrder.status === 'shipped' ? 'خرج للتوصيل' : 'بانتظار الشحن'}
                      </span>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm text-xs font-bold transition-colors ${
                        selectedOrder.status === 'delivered'
                          ? 'bg-teal-600 text-white ring-4 ring-teal-400/20'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Sparkles size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-800 font-arabic mt-1.5">تم الاستلام</span>
                      <span className="text-[10px] text-gray-400 font-arabic">
                        {selectedOrder.status === 'delivered' ? 'استلم العميل ✓' : 'بانتظار الاستلام'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 font-arabic">
                  <XCircle size={22} className="text-rose-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm">تم إلغاء هذا الطلب</p>
                    <p className="text-xs text-rose-600 mt-0.5">لن يتم شحنه أو تحصيله من العميل</p>
                  </div>
                </div>
              )}

              {/* Status Update Quick Selector Inside Modal */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-xs font-bold text-blue-900 font-arabic">تغيير حالة هذا الطلب الآن:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(statusKey => {
                    const item = STATUS_CONFIG[statusKey]
                    const isActive = selectedOrder.status === statusKey

                    return (
                      <button
                        key={statusKey}
                        onClick={() => updateStatus(selectedOrder.id, statusKey)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold font-arabic transition-all flex items-center gap-1 ${
                          isActive
                            ? `${item.bg} ${item.text} border ${item.border} ring-2 ring-current/20 shadow-sm`
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <item.icon size={13} />
                        <span>{item.shortLabel}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Customer & Shipping Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-sm">
                <div>
                  <span className="text-gray-400 text-xs font-arabic block mb-1">اسم العميل:</span>
                  <span className="font-bold text-gray-900 font-arabic text-base">{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-arabic block mb-1">رقم الهاتف للتواصل:</span>
                  <a href={`tel:${selectedOrder.phone}`} className="font-english font-bold text-royal text-base hover:underline" dir="ltr">
                    {selectedOrder.phone}
                  </a>
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-arabic block mb-1">المحافظة / المدينة:</span>
                  <span className="font-arabic font-medium text-gray-800">{selectedOrder.city}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs font-arabic block mb-1">تاريخ ووقت الطلب:</span>
                  <span className="font-arabic text-gray-800">{formatDate(selectedOrder.created_at)}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-400 text-xs font-arabic block mb-1">العنوان بالتفصيل:</span>
                  <p className="font-arabic text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">
                    {selectedOrder.address}
                  </p>
                </div>
                {selectedOrder.notes && (
                  <div className="sm:col-span-2">
                    <span className="text-amber-600 text-xs font-arabic font-bold block mb-1">ملاحظات العميل مع الطلب:</span>
                    <p className="font-arabic text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Client Device & Repeat Customer Intelligence */}
                <div className="sm:col-span-2 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 p-3.5 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-arabic">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-blue-950">بيانات جهاز العميل:</span>
                      <span className="font-semibold text-royal bg-white px-2.5 py-0.5 rounded-md border border-blue-200">
                        {selectedOrder.browser_info || (selectedOrder.device_type ? `جهاز ${selectedOrder.device_type}` : 'متصفح ويب')}
                      </span>
                    </div>
                    {selectedOrder.device_id && (
                      <div className="flex items-center gap-1.5 text-gray-500 font-english">
                        <span className="font-arabic text-[11px] text-gray-400">Device ID:</span>
                        <code className="bg-white/80 px-2 py-0.5 rounded border border-gray-200 text-[11px] text-gray-700">
                          {selectedOrder.device_id}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedOrder.device_id || '')
                            toast.success('تم نسخ معرف الجهاز')
                          }}
                          className="p-1 hover:bg-white rounded text-gray-400 hover:text-royal transition-colors"
                          title="نسخ معرف الجهاز"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Repeat Customer Detector */}
                  {(() => {
                    const previousOrdersCount = allOrders?.filter(o => 
                      (selectedOrder.device_id && o.device_id === selectedOrder.device_id) ||
                      (o.phone && o.phone === selectedOrder.phone)
                    ).length || 1

                    return previousOrdersCount > 1 ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold shadow-xs flex-shrink-0">
                        <Star size={13} className="text-amber-600 fill-amber-500" />
                        <span>عميل وفيّ (طلب رقم {previousOrdersCount})</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-gray-600 border border-gray-200 rounded-xl font-medium flex-shrink-0">
                        <span>أول طلب من هذا العميل / الجهاز</span>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="font-bold font-arabic text-gray-900 text-base mb-3">المنتجات المطلوبة</h3>
                <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {selectedOrder.order_items.map(item => {
                    const skuCode = item.product_id ? formatProductSku(getProductSku({ id: item.product_id, sku: (item.product as any)?.sku })) : ''
                    return (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-arabic font-bold text-gray-900 text-sm">{item.product_name}</p>
                          {skuCode && (
                            <span className="text-[11px] font-english font-bold text-royal bg-royal/5 px-2 py-0.5 rounded border border-royal/10">
                              {skuCode}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 text-xs text-gray-500 font-arabic mt-0.5">
                          {item.size === 'مقاس خاص' ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded">
                              ✂️ تفصيل بمقاس خاص (راجعي المقاسات بالملاحظات)
                            </span>
                          ) : (
                            item.size && <span className="bg-gray-100 px-2 py-0.5 rounded">المقاس: {item.size}</span>
                          )}
                          {item.color && <span className="bg-gray-100 px-2 py-0.5 rounded">اللون: {item.color}</span>}
                        </div>
                      </div>
                      <div className="text-left font-english">
                        <span className="text-xs text-gray-500">{item.quantity} × {formatPrice(item.unit_price)} = </span>
                        <span className="font-bold text-royal font-arabic">{formatPrice(item.quantity * item.unit_price)}</span>
                      </div>
                    </div>
                  )})}
                </div>

                {/* Financial Summary */}
                <div className="bg-gray-50 rounded-2xl p-4 mt-3 space-y-2 text-sm font-arabic">
                  <div className="flex justify-between text-gray-600">
                    <span>المجموع الفرعي:</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>الخصم ({selectedOrder.coupon_code || 'كوبون'}):</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>رسوم الشحن والتوصيل ({selectedOrder.city}):</span>
                    <span>{formatPrice(selectedOrder.shipping_fee)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>المبلغ المطلوب تحصيله (الدفع عند الاستلام):</span>
                    <span className="text-royal text-lg">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Admin Internal Notes */}
              <div>
                <h3 className="font-bold font-arabic text-gray-900 text-sm mb-2">ملاحظات الإدارة الداخلية (خاصة بك فقط)</h3>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="اكتب هنا أي تفاصيل خاصة (مثلاً: تم التأكيد مع العميل هاتفياً، مندوب فلان استلم الأوردر...)"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal/30 font-arabic text-sm h-20 resize-none"
                />
                <Button onClick={saveNotes} loading={savingNotes} size="sm" className="mt-2 font-arabic">
                  حفظ الملاحظات
                </Button>
              </div>

              {/* Action Buttons: WhatsApp & Print Invoice & Archive & Delete */}
              <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2.5">
                <Button
                  onClick={() => sendCustomerStatusWhatsApp(selectedOrder)}
                  className="flex-1 font-arabic bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[200px]"
                >
                  <MessageCircle size={18} />
                  <span>إرسال إشعار WhatsApp بحالة الطلب للعميل</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => printInvoice(selectedOrder)}
                  className="font-arabic gap-2"
                >
                  <Printer size={18} />
                  <span>طباعة البوليصة (PDF)</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => toggleArchive(selectedOrder)}
                  disabled={archivingId === selectedOrder.id}
                  className={`font-arabic gap-2 ${
                    isOrderArchived(selectedOrder)
                      ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isOrderArchived(selectedOrder) ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                  <span>{isOrderArchived(selectedOrder) ? 'استعادة من الأرشيف' : 'أرشفة الطلب'}</span>
                </Button>

                <Button
                  variant="danger"
                  onClick={() => setOrderToDelete(selectedOrder)}
                  className="font-arabic gap-2"
                >
                  <Trash2 size={18} />
                  <span>حذف الطلب نهائياً</span>
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={!!orderToDelete}
          onClose={() => setOrderToDelete(null)}
          title="تأكيد حذف الطلب نهائياً"
          size="sm"
        >
          {orderToDelete && (
            <div className="space-y-4 text-right font-arabic">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <Trash2 size={24} />
              </div>
              <p className="text-gray-800 text-sm leading-relaxed text-center">
                هل أنتِ متأكدة من حذف الطلب رقم <strong className="font-english text-rose-600">{orderToDelete.order_number}</strong> الخاص بالعميلة <strong>{orderToDelete.customer_name}</strong>؟
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 leading-normal">
                ⚠️ <strong>تنبيه:</strong> سيتم مسح هذا الطلب وجميع المنتجات المرتبطة به نهائياً من قاعدة البيانات، ولن تتمكني من استرجاعه لاحقاً.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="danger"
                  fullWidth
                  loading={deleting}
                  onClick={confirmDeleteOrder}
                  className="gap-1.5 font-bold"
                >
                  <Trash2 size={16} />
                  نعم، احذف نهائياً
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={deleting}
                  onClick={() => setOrderToDelete(null)}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  )
}
