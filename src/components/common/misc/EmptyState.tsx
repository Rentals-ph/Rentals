'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

export type EmptyStateVariant = 'empty' | 'error' | 'notFound'

export interface EmptyStateProps {
  variant?: EmptyStateVariant
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

const defaultIcons: Record<EmptyStateVariant, ReactNode> = {
  empty: (
    <svg className="w-full h-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M28 36h24M28 44h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="24" y="28" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" />
    </svg>
  ),
  error: (
    <svg className="w-full h-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M40 28v20M40 52v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="40" cy="54" r="2.5" fill="currentColor" />
    </svg>
  ),
  notFound: (
    <svg className="w-full h-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M32 32L48 48M48 32L32 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
    </svg>
  ),
}

export default function EmptyState({
  variant = 'empty',
  title,
  description,
  icon,
  action,
  className = '',
  compact = false,
}: EmptyStateProps) {
  const iconEl = icon ?? defaultIcons[variant]
  const isError = variant === 'error'
  const isNotFound = variant === 'notFound'

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-rental-blue-200/50 bg-gradient-to-br from-rental-blue-50/80 via-white to-rental-orange-50/30 font-outfit ${compact ? 'py-8 px-6' : 'py-12 sm:py-16 px-6 sm:px-10'} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-rental-blue-500/10 blur-2xl" />
        <div className="absolute bottom-0 -left-6 w-24 h-24 rounded-full bg-rental-orange-500/15 blur-xl" />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
        <div
          className={`flex-shrink-0 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 ${
            isError
              ? 'bg-red-50 text-red-500 w-20 h-20 sm:w-24 sm:h-24'
              : isNotFound
                ? 'bg-rental-orange-50 text-rental-orange-500 w-20 h-20 sm:w-24 sm:h-24'
                : 'bg-rental-blue-50 text-rental-blue-500 w-20 h-20 sm:w-24 sm:h-24'
          }`}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12">{iconEl}</div>
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1.5 sm:mb-2">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4 sm:mb-6">
          {description}
        </p>
        {action && <div className="flex flex-wrap justify-center gap-3">{action}</div>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rental-orange-500 via-rental-blue-500 to-rental-orange-500 opacity-60" aria-hidden />
    </div>
  )
}

export function EmptyStateAction({
  href,
  children,
  primary = true,
}: {
  href: string
  children: ReactNode
  primary?: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all hover:opacity-90 active:scale-[0.98]'
  const styles = primary
    ? 'bg-rental-orange-500 text-white shadow-lg shadow-rental-orange-500/25 hover:bg-rental-orange-600'
    : 'bg-white text-rental-blue-600 border-2 border-rental-blue-200 hover:bg-rental-blue-50'
  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  )
}
