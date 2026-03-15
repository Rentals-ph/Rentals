'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { CreateListingData, ListingFormData } from './types'
import { DEFAULT_LISTING_FORM_DATA } from './types'

// Re-export for backward compatibility
export type { CreateListingData, ListingFormData } from './types'

interface CreateListingContextType {
  data: CreateListingData
  updateData: (updates: Partial<CreateListingData>) => void
  resetData: () => void
}

const defaultData: CreateListingData = {
  ...DEFAULT_LISTING_FORM_DATA,
  // Ensure uploadedImages is not included in context (it's conversation-specific)
  uploadedImages: [],
}

const CreateListingContext = createContext<CreateListingContextType | undefined>(undefined)

export function CreateListingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CreateListingData>(defaultData)

  const updateData = (updates: Partial<CreateListingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const resetData = () => {
    setData(defaultData)
  }

  return (
    <CreateListingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </CreateListingContext.Provider>
  )
}

export function useCreateListing() {
  const context = useContext(CreateListingContext)
  if (context === undefined) {
    throw new Error('useCreateListing must be used within a CreateListingProvider')
  }
  return context
}

