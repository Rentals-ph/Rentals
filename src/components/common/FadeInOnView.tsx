'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

interface FadeInOnViewProps {
  children: ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
  delayMs?: number
}

function FadeInOnView({ children, className = '', as = 'div', delayMs = 0 }: FadeInOnViewProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      {
        threshold: 0.15,
      },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const Component = as as any

  return (
    <Component
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Component>
  )
}

export default FadeInOnView

