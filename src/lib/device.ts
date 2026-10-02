/**
 * Device Fingerprinting & Client Identification Service
 * Generates and maintains a persistent, unique Client Device ID (dev_...)
 * across browser sessions, tabs, and visits.
 * 
 * Also detects device type (Mobile / Tablet / Desktop), operating system,
 * and browser for analytics, customer service, and fraud prevention.
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface DeviceInfo {
  deviceId: string
  deviceType: DeviceType
  deviceTypeNameAr: string
  deviceTypeNameEn: string
  os: string
  browser: string
  screenResolution: string
  language: string
  summaryAr: string
  summaryEn: string
}

const STORAGE_KEY = 'ra_client_device_id'
const COOKIE_NAME = 'ra_client_device_id'

/**
 * Generate a high-entropy UUIDv4 string
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // fallback if restricted context
    }
  }

  // RFC4122 compliant fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Helper to get a cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'))
  return match ? decodeURIComponent(match[3]) : null
}

/**
 * Helper to set a persistent cookie (1 year duration)
 */
function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 365 // 1 year in seconds
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

/**
 * Get or create the unique, persistent Client Device ID
 * Guaranteed format: `dev_[uuid]`
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'dev_server_' + generateUUID()
  }

  // 1. Try localStorage
  let id: string | null = null
  try {
    id = localStorage.getItem(STORAGE_KEY)
  } catch {
    // LocalStorage might be disabled in private mode
  }

  // 2. Try cookie fallback
  if (!id) {
    id = getCookie(COOKIE_NAME)
  }

  // 3. Validate format, or create new
  if (!id || !id.startsWith('dev_')) {
    id = `dev_${generateUUID()}`
  }

  // 4. Ensure synced in both localStorage and cookie
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Ignore storage quota or security errors
  }
  setCookie(COOKIE_NAME, id)

  return id
}

/**
 * Detect client device details (Type, OS, Browser, Screen)
 */
export function getDeviceInfo(): DeviceInfo {
  const deviceId = getDeviceId()

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceId,
      deviceType: 'desktop',
      deviceTypeNameAr: 'كمبيوتر',
      deviceTypeNameEn: 'Desktop',
      os: 'Unknown',
      browser: 'Unknown',
      screenResolution: '0x0',
      language: 'ar',
      summaryAr: '💻 كمبيوتر',
      summaryEn: '💻 Desktop',
    }
  }

  const ua = navigator.userAgent || ''
  const platform = navigator.platform || ''
  const maxTouchPoints = navigator.maxTouchPoints || 0

  // 1. Detect Device Type
  let deviceType: DeviceType = 'desktop'

  const isTablet =
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua) ||
    (platform === 'MacIntel' && maxTouchPoints > 1) // iPadOS detection

  const isMobile =
    !isTablet &&
    /(mobi|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop)/i.test(ua)

  if (isTablet) {
    deviceType = 'tablet'
  } else if (isMobile) {
    deviceType = 'mobile'
  } else {
    deviceType = 'desktop'
  }

  // 2. Detect Operating System
  let os = 'غير محدد'
  if (/iphone/i.test(ua)) os = 'iPhone iOS'
  else if (/ipad/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)) os = 'iPadOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/windows/i.test(ua)) os = 'Windows'
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS'
  else if (/linux/i.test(ua)) os = 'Linux'

  // 3. Detect Browser
  let browser = 'متصفح'
  if (/edg/i.test(ua)) browser = 'Edge'
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet'
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua)) browser = 'Safari'
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox'
  else if (/opr|opera/i.test(ua)) browser = 'Opera'

  // 4. Screen resolution & language
  const screenResolution = `${window.screen?.width || 0}x${window.screen?.height || 0}`
  const language = navigator.language || 'ar'

  // 5. Friendly summaries
  let deviceTypeNameAr = 'كمبيوتر'
  let deviceTypeNameEn = 'Desktop'
  let icon = '💻'

  if (deviceType === 'mobile') {
    deviceTypeNameAr = 'جوال'
    deviceTypeNameEn = 'Mobile'
    icon = '📱'
  } else if (deviceType === 'tablet') {
    deviceTypeNameAr = 'تابلت'
    deviceTypeNameEn = 'Tablet'
    icon = '📟'
  }

  const summaryAr = `${icon} ${deviceTypeNameAr} (${os} - ${browser})`
  const summaryEn = `${icon} ${deviceTypeNameEn} (${os} - ${browser})`

  return {
    deviceId,
    deviceType,
    deviceTypeNameAr,
    deviceTypeNameEn,
    os,
    browser,
    screenResolution,
    language,
    summaryAr,
    summaryEn,
  }
}
