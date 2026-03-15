'use client'

import { useState, useEffect } from 'react'
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).substring(7)
  const newToast: Toast = { ...toast, id }
  toasts = [...toasts, newToast]
  toastListeners.forEach(listener => listener(toasts))
  
  const duration = toast.duration || 3000
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
  
  return id
}

const removeToast = (id: string) => {
  toasts = toasts.filter(t => t.id !== id)
  toastListeners.forEach(listener => listener(toasts))
}

export const toast = {
  success: (message: string, duration?: number) => addToast({ message, type: 'success', duration }),
  error: (message: string, duration?: number) => addToast({ message, type: 'error', duration }),
  warning: (message: string, duration?: number) => addToast({ message, type: 'warning', duration }),
  info: (message: string, duration?: number) => addToast({ message, type: 'info', duration }),
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>(toasts)
  
  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToastList([...newToasts])
    }
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
    }
  }, [])
  
  return toastList
}

export function ToastContainer() {
  const toasts = useToast()
  
  if (toasts.length === 0) return null
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md
            ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : ''}
            ${toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' : ''}
          `}
        >
          {toast.type === 'success' && <FiCheck className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <FiX className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'warning' && <FiAlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <FiInfo className="w-5 h-5 flex-shrink-0" />}
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

