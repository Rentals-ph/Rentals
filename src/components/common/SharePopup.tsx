'use client'

import { useRef, useEffect } from 'react'

export type SharePlatform = 'facebook' | 'whatsapp' | 'gmail' | 'twitter' | 'email' | 'copy' | 'print'

export interface ShareOption {
  platform: SharePlatform
  label: string
  icon: React.ReactNode
}

interface SharePopupProps {
  isOpen: boolean
  onClose: () => void
  onShare: (platform: SharePlatform) => void
  options?: ShareOption[]
  position?: 'top' | 'bottom'
  align?: 'left' | 'right'
}

const defaultOptions: ShareOption[] = [
  {
    platform: 'facebook',
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="#1877F2" />
      </svg>
    ),
  },
  {
    platform: 'whatsapp',
    label: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2c-.151.504.335.99.839.839l3.032-.892A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="#25D366"/>
        <path d="M9.5 8.5c-.15-.35-.3-.36-.45-.36h-.4c-.15 0-.4.05-.6.3-.2.25-.75.75-.75 1.8s.75 2.1.85 2.25c.1.15 1.5 2.3 3.65 3.2.5.2.9.35 1.2.45.5.15.95.15 1.3.1.4-.05 1.25-.5 1.4-1s.15-1 .1-1.05c-.05-.1-.2-.15-.4-.25l-1.2-.6c-.2-.1-.35-.15-.5.15-.15.3-.6.75-.75.9-.15.15-.25.15-.45.05-.2-.1-.85-.3-1.6-1-.6-.55-1-1.2-1.1-1.4-.1-.2 0-.3.1-.4.1-.1.2-.25.3-.35.1-.1.15-.2.2-.3.05-.1.05-.2 0-.3-.05-.1-.5-1.2-.7-1.65z" fill="#FFFFFF"/>
      </svg>
    ),
  },
  {
    platform: 'gmail',
    label: 'Gmail',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" fill="#EA4335" />
        <path d="M22 6L12 13L2 6" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    platform: 'twitter',
    label: 'Twitter',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    ),
  },
  {
    platform: 'email',
    label: 'Email',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="14" rx="2"/>
        <path d="M3 7l9 6 9-6"/>
      </svg>
    ),
  },
  {
    platform: 'copy',
    label: 'Copy Link',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
    ),
  },
  {
    platform: 'print',
    label: 'Print',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
        <polyline points="6 9 6 2 18 2 18 9"/>
        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
    ),
  },
]

export default function SharePopup({
  isOpen,
  onClose,
  onShare,
  options = defaultOptions,
  position = 'top',
  align = 'right',
}: SharePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOptionClick = (platform: SharePlatform) => {
    onShare(platform)
    onClose()
  }

  return (
    <div
      ref={popupRef}
      className={`absolute z-[1000] flex min-w-[160px] flex-col gap-1 overflow-visible rounded-xl border border-gray-200 bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1)] md:min-w-[140px] md:gap-0.75 md:p-1.5 xs:min-w-[130px] xs:gap-0.5 xs:p-1.25 ${
        position === 'top' 
          ? `bottom-[calc(100%+8px)] before:absolute before:bottom-[-6px] before:h-3 before:w-3 before:rotate-45 before:border-b before:border-l before:border-gray-200 before:bg-white before:content-['']` 
          : `top-[calc(100%+8px)] before:absolute before:top-[-6px] before:h-3 before:w-3 before:rotate-45 before:border-l before:border-t before:border-gray-200 before:bg-white before:content-['']`
      } ${
        align === 'right' 
          ? 'right-0 before:right-3' 
          : 'left-0 before:left-3'
      }`}
    >
      {options.map((option) => (
        <button
          key={option.platform}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left font-outfit text-sm font-medium text-gray-700 transition-all hover:bg-gray-100 md:gap-2.5 md:px-2.5 md:py-2 md:text-xs xs:gap-2 xs:px-2.25 xs:py-1.75 xs:text-xs"
          onClick={(e) => {
            e.stopPropagation()
            handleOptionClick(option.platform)
          }}
        >
          <span className="h-5 w-5 flex-shrink-0 md:h-4.5 md:w-4.5 xs:h-4 xs:w-4">
            {option.icon}
          </span>
          <span className="flex-1">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

