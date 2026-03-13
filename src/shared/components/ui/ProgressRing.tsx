'use client'

import { useMemo } from 'react'

interface ProgressRingProps {
  percent: number
}

/**
 * Progress Ring Component
 * Reusable circular progress indicator
 */
export default function ProgressRing({ percent }: ProgressRingProps) {
  const { radius, stroke, normalizedRadius, circumference, strokeDashoffset } = useMemo(() => {
    const r = 26
    const s = 6
    const nr = r - s / 2
    const c = nr * 2 * Math.PI
    const offset = c - (percent / 100) * c
    return {
      radius: r,
      stroke: s,
      normalizedRadius: nr,
      circumference: c,
      strokeDashoffset: offset
    }
  }, [percent])

  return (
    <div className="relative w-13 h-13 flex-shrink-0">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#2563EB"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-250 ease-in"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
        {percent}%
      </div>
    </div>
  )
}


