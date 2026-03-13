'use client'

import { FiCheck } from 'react-icons/fi'
import type { ReactNode } from 'react'
import { ProgressRing } from '@/shared/components/ui'

export interface CreateListingStepLayoutProps {
  /** Labels for each step in the progress stepper */
  stepLabels: string[]
  /** Current step index (0-based) */
  currentStepIndex: number
  /** Name of current step for breadcrumb (e.g. "Basic Information") */
  breadcrumbStepName: string
  /** Optional: base path for "Create Listing" breadcrumb link (e.g. /agent/create-listing). If not set, breadcrumb is text only. */
  createListingPath?: string
  children: ReactNode
}

export function CreateListingStepLayout({
  stepLabels,
  currentStepIndex,
  breadcrumbStepName,
  createListingPath,
  children,
}: CreateListingStepLayoutProps) {
  const percent = stepLabels.length > 0
    ? Math.round(((currentStepIndex + 1) / stepLabels.length) * 100)
    : 0

  return (
    <>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
          {createListingPath ? (
            <a href={createListingPath} className="text-gray-900 hover:text-blue-600 no-underline">
              Create Listing
            </a>
          ) : (
            <span className="text-gray-900">Create Listing</span>
          )}
          <span className="text-gray-400 font-medium">&gt;</span>
          <span className="text-gray-400 font-semibold">{breadcrumbStepName}</span>
        </div>

        {/* Progress Stepper Card */}
        <div className="flex items-center gap-4 p-6 mb-6 bg-white rounded-xl shadow-sm border border-gray-100 md:flex-col md:items-start">
          <div className="flex items-center gap-3 min-w-[220px]">
            <ProgressRing percent={percent} />
            <div className="text-sm font-semibold text-gray-600">Completion Status</div>
          </div>

          <div className="flex-1 grid items-start gap-0 md:w-full md:overflow-x-auto md:pb-1.5 md:justify-start w-full" style={{ gridTemplateColumns: `repeat(${stepLabels.length}, minmax(0, 1fr))` }}>
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = step === currentStepIndex + 1
              const isDone = step < currentStepIndex + 1
              return (
                <div className="flex flex-col items-center min-w-0 flex-shrink-0" key={label}>
                  <div className="w-full flex items-center relative">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-10 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {isDone ? <FiCheck className="text-lg" /> : step}
                    </div>
                    {idx !== stepLabels.length - 1 && (
                      <div className={`h-1.5 rounded-full flex-1 ml-2 mr-2 min-w-0 ${isDone ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className={`mt-2 text-xs font-semibold text-center leading-tight ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {children}
    </>
  )
}
