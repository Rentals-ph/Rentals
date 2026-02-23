/**
 * API Configuration
 * 
 * To switch between local and remote backend:
 * - Default: Uses local backend (http://localhost:8000) when running locally
 * - Set USE_LOCAL_API=false to use Railway backend
 * - In production (Vercel): Always uses Railway backend
 * - Or override with NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL
 */

const RAILWAY_API_URL = 'https://rentalsbackend-production.up.railway.app'
const LOCAL_API_URL = 'http://localhost:8000'

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
  
  // Check if we're in production (Vercel deployment)
  // Check NODE_ENV first (available in both server and client)
  const isProduction = process.env.NODE_ENV === 'production'
  
  // In browser, also check hostname (not localhost = production)
  const isProductionHost = typeof window !== 'undefined' 
    ? window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    : false
  
  // In production (Vercel), always use Railway
  if (isProduction || isProductionHost || process.env.VERCEL) {
    return `${RAILWAY_API_URL}/api`
  }
  
  // Use Railway if explicitly set to false, otherwise default to local
  if (useRemoteApi) {
    return `${RAILWAY_API_URL}/api`
  }
  
  // Default to local backend for development
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

