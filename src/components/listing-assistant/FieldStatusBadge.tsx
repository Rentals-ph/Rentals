/**
 * Field Status Badge Component
 * Shows the status of a form field: filled, empty, skipped, or warning
 */

import React from 'react'
import type { FieldStatus } from '../../types/listingAssistant'

interface FieldStatusBadgeProps {
  status: FieldStatus
  size?: 'sm' | 'md'
  showLabel?: boolean
}

const statusConfig: Record<FieldStatus, { 
  color: string; 
  bgColor: string; 
  label: string;
  icon: string;
}> = {
  filled: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    label: 'Filled',
    icon: '✓',
  },
  empty: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    label: 'Missing',
    icon: '○',
  },
  skipped: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    label: 'Skipped',
    icon: '—',
  },
  warning: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    label: 'Review',
    icon: '!',
  },
}

export function FieldStatusBadge({ 
  status, 
  size = 'sm',
  showLabel = false 
}: FieldStatusBadgeProps) {
  const config = statusConfig[status]
  
  const sizeClasses = size === 'sm' 
    ? 'w-5 h-5 text-xs' 
    : 'w-6 h-6 text-sm'

  return (
    <div className="flex items-center gap-1.5">
      <span 
        className={`
          ${sizeClasses} 
          ${config.bgColor} 
          ${config.color} 
          rounded-full 
          flex items-center justify-center 
          font-medium
        `}
        title={config.label}
      >
        {config.icon}
      </span>
      {showLabel && (
        <span className={`text-xs ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  )
}

export default FieldStatusBadge
