'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface CreateListingData {
  // Category
  category: string
  
  // Details
  title: string
  description: string
  bedrooms: number
  bathrooms: number
  garage: number
  floorArea: number
  floorUnit: 'Square Meters' | 'Square Feet'
  lotArea: number
  
  // Location
  country: string
  state: string
  city: string
  street: string
  latitude: string
  longitude: string
  zoom: string
  
  // Property Images
  images: File[]
  videoUrl: string
  
  // Pricing
  listingType: 'for_rent' | 'for_sale'
  price: string
  priceType: 'Monthly' | 'Weekly' | 'Daily' | 'Yearly'
  
  // Attributes
  amenities: string[]
  furnishing?: string
}

interface CreateListingContextType {
  data: CreateListingData
  updateData: (updates: Partial<CreateListingData>) => void
  resetData: () => void
}

const defaultData: CreateListingData = {
  category: '',
  title: '',
  description: '',
  bedrooms: 0,
  bathrooms: 0,
  garage: 0,
  floorArea: 1,
  floorUnit: 'Square Meters',
  lotArea: 0,
  country: 'Philippines',
  state: '',
  city: '',
  street: '',
  latitude: '17.586030',
  longitude: '120.628619',
  zoom: '15',
  images: [],
  videoUrl: '',
  listingType: 'for_rent',
  price: '',
  priceType: 'Monthly',
  amenities: [],
  furnishing: undefined,
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

