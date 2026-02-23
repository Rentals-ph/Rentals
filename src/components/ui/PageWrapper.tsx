import { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

/**
 * Global page wrapper component that provides consistent horizontal padding
 * across all pages. Use fullWidth={true} to disable padding for specific pages.
 */
export const PageWrapper = ({ children, className = '', fullWidth = false }: PageWrapperProps) => {
  return (
    <div className={`${fullWidth ? '' : 'px-4 md:px-8 lg:px-16'} ${className}`}>
      {children}
    </div>
  )
}

