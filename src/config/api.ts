/**
 * API Configuration
 *
 * - localhost:3000 or 192.168.x.x:3000 → API at localhost:8000 (backend usually bound to 127.0.0.1)
 * - Set NEXT_PUBLIC_API_BASE_URL=http://YOUR_IP:8000/api to use LAN IP for API (e.g. other devices)
 *   and run your backend on 0.0.0.0:8000 so it accepts connections on that IP
 * - Set USE_LOCAL_API=false to use Railway backend
 * - Production (public hostname): Uses Railway backend
 */

const RAILWAY_API_URL = 'https://rentalsbackend-production.up.railway.app'
const LOCAL_API_URL = 'http://localhost:8000'

/** True if hostname is local or a private/LAN address (not public production). */
function isLocalOrPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return true
  if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) return true
  // 172.16.0.0–172.31.255.255
  if (hostname.startsWith('172.')) {
    const second = parseInt(hostname.split('.')[1] ?? '', 10)
    if (second >= 16 && second <= 31) return true
  }
  return false
}

// Check if we should use remote API (Railway)
// If USE_LOCAL_API is explicitly set to false, use Railway
// Otherwise, default to local for development
const useRemoteApi = process.env.USE_LOCAL_API === 'false' || process.env.USE_LOCAL_API === '0'

// Determine API base URL
// Priority: 1. Explicit env var, 2. Production detection, 3. USE_LOCAL_API flag, 4. Default to local
export const getApiBaseUrl = (): string => {
  // If explicitly set, use it
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }
  
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // In browser we have window; on server (SSR) we don't, so hostname is empty
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const isInBrowser = typeof window !== 'undefined'
  const isProduction = process.env.NODE_ENV === 'production'
  // Only treat as "production host" when we're in the browser on a public hostname (not local/LAN)
  const isProductionHost = isInBrowser && hostname && !isLocalOrPrivateHost(hostname)
  
  // Use Railway only when we're in the browser on a production host (e.g. rentals.ph or Vercel)
  // On the server (SSR) we never use Railway by hostname — so 192.168.1.48:3000 SSR uses local backend
  if (isProductionHost && (isProduction || process.env.VERCEL)) {
    return `${RAILWAY_API_URL}/api`
  }
  
  // Use Railway if explicitly set via env
  if (useRemoteApi) {
    return `${RAILWAY_API_URL}/api`
  }
  
  // Local development (localhost or LAN IP like 192.168.1.48:3000): use localhost:8000 so the
  // backend only needs to listen on 127.0.0.1. For other-device testing, set
  // NEXT_PUBLIC_API_BASE_URL=http://YOUR_IP:8000/api and run backend on 0.0.0.0:8000.
  return `${LOCAL_API_URL}/api`
}

// For Vite proxy configuration
export const getProxyTarget = (): string => {
  if (process.env.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL
  }
  
  if (useRemoteApi) {
    return RAILWAY_API_URL
  }
  
  return LOCAL_API_URL
}

// Export constants for reference
export const API_URLS = {
  LOCAL: `${LOCAL_API_URL}/api`,
  RAILWAY: `${RAILWAY_API_URL}/api`,
} as const

