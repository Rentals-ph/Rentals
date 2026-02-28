/**
 * API Configuration
 * 
 * To switch between local and remote backend:
 * - Default: Uses local backend when host is localhost or a private/LAN IP (e.g. 192.168.x.x)
 * - Set USE_LOCAL_API=false to use Railway backend
 * - In production (Vercel / public hostname): Always uses Railway backend
 * - Or override with NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL
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
  
  // In browser: treat localhost and private/LAN IPs (e.g. 192.168.1.48) as local
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const isLocalHost = typeof window !== 'undefined' && isLocalOrPrivateHost(hostname)
  
  // Production only when not local and (NODE_ENV production or Vercel)
  const isProduction = process.env.NODE_ENV === 'production'
  const isProductionHost = typeof window !== 'undefined' && !isLocalOrPrivateHost(hostname)
  
  // Use Railway only for real production (public hostname or Vercel)
  if ((isProduction && !isLocalHost) || (isProductionHost && (isProduction || process.env.VERCEL))) {
    return `${RAILWAY_API_URL}/api`
  }
  
  // Use Railway if explicitly set to false, otherwise default to local
  if (useRemoteApi) {
    return `${RAILWAY_API_URL}/api`
  }
  
  // Local: same host as the app when on LAN IP so other devices can reach the backend
  if (typeof window !== 'undefined' && hostname && isLocalOrPrivateHost(hostname) && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8000/api`
  }
  
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

