'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Property } from '@/types'

const STORAGE_KEY = 'rental_ph_saved_properties'

export function useSavedProperties() {
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<number>>(new Set())
  const [savedProperties, setSavedProperties] = useState<Property[]>([])

  // Load saved properties from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Property[]
          const ids = new Set(parsed.map(p => p.id))
          setSavedPropertyIds(ids)
          setSavedProperties(parsed)
        } else {
          setSavedPropertyIds(new Set())
          setSavedProperties([])
        }
      } catch (error) {
        console.error('Error loading saved properties:', error)
      }
    }

    loadFromStorage()

    // Keep multiple tabs in sync
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        loadFromStorage()
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const isSaved = useCallback((propertyId: number): boolean => {
    return savedPropertyIds.has(propertyId)
  }, [savedPropertyIds])

  const saveProperty = useCallback((property: Property) => {
    setSavedProperties(prev => {
      // Check if already saved
      if (prev.some(p => p.id === property.id)) {
        return prev
      }
      const next = [...prev, property]
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        }
      } catch (error) {
        console.error('Error saving property to localStorage:', error)
      }
      return next
    })
    setSavedPropertyIds(prev => new Set([...prev, property.id]))
  }, [])

  const unsaveProperty = useCallback((propertyId: number) => {
    setSavedProperties(prev => {
      const next = prev.filter(p => p.id !== propertyId)
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        }
      } catch (error) {
        console.error('Error removing property from localStorage:', error)
      }
      return next
    })
    setSavedPropertyIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(propertyId)
      return newSet
    })
  }, [])

  const toggleSave = useCallback((property: Property) => {
    if (isSaved(property.id)) {
      unsaveProperty(property.id)
    } else {
      saveProperty(property)
    }
  }, [isSaved, saveProperty, unsaveProperty])

  return {
    savedPropertyIds,
    savedProperties,
    isSaved,
    saveProperty,
    unsaveProperty,
    toggleSave,
  }
}

