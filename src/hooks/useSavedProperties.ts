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

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Property[]
        const ids = new Set(parsed.map(p => p.id))
        setSavedPropertyIds(ids)
        setSavedProperties(parsed)
      }
    } catch (error) {
      console.error('Error loading saved properties:', error)
    }
  }, [])

  // Save properties to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProperties))
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event('savedPropertiesChanged'))
    } catch (error) {
      console.error('Error saving properties to localStorage:', error)
    }
  }, [savedProperties])

  const isSaved = useCallback((propertyId: number): boolean => {
    return savedPropertyIds.has(propertyId)
  }, [savedPropertyIds])

  const saveProperty = useCallback((property: Property) => {
    setSavedProperties(prev => {
      // Check if already saved
      if (prev.some(p => p.id === property.id)) {
        return prev
      }
      return [...prev, property]
    })
    setSavedPropertyIds(prev => new Set([...prev, property.id]))
  }, [])

  const unsaveProperty = useCallback((propertyId: number) => {
    setSavedProperties(prev => prev.filter(p => p.id !== propertyId))
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

