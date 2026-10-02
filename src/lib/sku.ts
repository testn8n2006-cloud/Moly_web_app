/**
 * Product SKU & Model Code Management
 * Ensures every product in the database has an elegant, human-readable,
 * and searchable model code (e.g. RA-W1042, RA-K2085, or custom RA-DRESS-01).
 * 
 * Includes clipboard copy utilities and deterministic fallbacks for products
 * without manual SKUs.
 */

import toast from 'react-hot-toast'

export const WOMEN_CATEGORY_ID = '00000000-0000-0000-0000-000000000001'
export const KIDS_CATEGORY_ID = '00000000-0000-0000-0000-000000000002'

interface SkuProductInput {
  id: string
  category_id?: string | null
  sku?: string | null
}

/**
 * Computes or retrieves the official product SKU/code
 */
export function getProductSku(product: SkuProductInput): string {
  // If explicitly assigned in DB, normalize and return
  if (product.sku && typeof product.sku === 'string' && product.sku.trim().length > 0) {
    return product.sku.trim().toUpperCase()
  }

  // Deterministic fallback based on category and product UUID
  let prefix = 'RA-'
  if (product.category_id === WOMEN_CATEGORY_ID) {
    prefix = 'RA-W'
  } else if (product.category_id === KIDS_CATEGORY_ID) {
    prefix = 'RA-K'
  }

  const idStr = product.id || ''
  let hash = 0
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0
  }

  const numberPart = 1000 + (hash % 9000)
  return `${prefix}${numberPart}`
}

/**
 * Copy SKU to clipboard with feedback toast
 */
export async function copyProductSku(sku: string, customText?: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(sku)
      toast.success(customText || `تم نسخ كود الموديل (${sku}) بنجاح ✓`)
      return true
    }
  } catch (err) {
    console.warn('Clipboard copy error:', err)
  }

  // Fallback for older browsers
  try {
    const textarea = document.createElement('textarea')
    textarea.value = sku
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (successful) {
      toast.success(customText || `تم نسخ كود الموديل (${sku}) بنجاح ✓`)
      return true
    }
  } catch {
    // ignore
  }

  toast.error('تعذر النسخ إلى الحافظة')
  return false
}

/**
 * Display formatted SKU with hash symbol
 */
export function formatProductSku(sku: string): string {
  if (!sku) return ''
  return sku.startsWith('#') ? sku : `#${sku}`
}
