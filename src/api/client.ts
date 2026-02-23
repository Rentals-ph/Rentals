import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getApiBaseUrl } from '../config/api'

// Get API base URL (respects USE_LOCAL_API env var to switch between local and remote)
const API_BASE_URL = getApiBaseUrl()

// Log the API URL being used (helpful for debugging)
if (typeof window !== 'undefined') {
  console.log('API Base URL:', API_BASE_URL)
}

/**
 * Create and configure the Axios instance
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

/**
 * Request interceptor for adding auth tokens, logging, etc.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // If FormData is being sent, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle network errors (backend not running, CORS, etc.)
    if (!error.response) {
      console.error('Network Error:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      })
      
      // Provide helpful error message with actual API URL being used
      const backendUrl = API_BASE_URL.startsWith('/') 
        ? 'http://127.0.0.1:8000' 
        : API_BASE_URL.replace('/api', '') || API_BASE_URL
      const networkError = new Error(
        `Unable to connect to the API server at ${backendUrl}. Error: ${error.message}`
      )
      return Promise.reject(networkError)
    }
    
    // Handle common HTTP errors
    if (error.response.status === 401) {
      // Handle unauthorized - clear token, redirect to login
      localStorage.removeItem('auth_token')
      // You can add redirect logic here if needed
    }

    if (error.response.status === 403) {
      const serverMessage =
        (error.response.data && typeof error.response.data === 'object' && (error.response.data as { message?: string }).message) ||
        error.response.statusText
      // Augment the original error so callers get the server message; avoid creating a new Error so stack trace stays in axios
      error.message = serverMessage
      if (process.env.NODE_ENV === 'development') {
        console.warn('API 403 Forbidden:', error.config?.url, serverMessage)
      }
      return Promise.reject(error)
    }
    
    // Build a plain, serializable snapshot so console always shows content (avoids {} from getters/late serialization)
    const msg = error?.message ?? (error instanceof Error ? error.message : String(error))
    const errorInfo: Record<string, unknown> = {
      message: msg,
      url: error?.config?.url ?? 'unknown',
      method: String(error?.config?.method ?? 'unknown').toUpperCase(),
      status: error?.response?.status ?? 'unknown',
      statusText: error?.response?.statusText ?? 'unknown',
    }
    try {
      if (error?.response?.data != null) {
        try {
          JSON.stringify(error.response.data)
          errorInfo.data = error.response.data
        } catch {
          errorInfo.data = '[Non-serializable data]'
        }
      } else {
        errorInfo.data = null
      }
    } catch {
      errorInfo.data = '[Non-serializable data]'
    }
    if (process.env.NODE_ENV === 'development') {
      try {
        console.error('API Error:', JSON.stringify(errorInfo, null, 2))
      } catch {
        console.error('API Error:', errorInfo.message ?? msg, errorInfo)
      }
    } else {
      if (errorInfo.message || errorInfo.status || errorInfo.data) {
        console.error('API Error:', errorInfo)
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient

