/**
 * Location Picker Component
 * Interactive map for selecting property location
 */

'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { Map, Marker, LeafletMouseEvent } from 'leaflet'

interface LocationPickerProps {
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
  onLocationChange: (lat: number, lng: number) => void
  disabled?: boolean
}

export function LocationPicker({
  latitude,
  longitude,
  locationName,
  onLocationChange,
  disabled = false,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Default to Manila, Philippines
  const defaultLat = latitude ?? 14.5995
  const defaultLng = longitude ?? 120.9842
  const hasLocation = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadLeaflet = async () => {
      try {
        const L = (await import('leaflet')).default

        // Fix for default marker icon
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        ;(window as any).L = L
        setLeafletLoaded(true)
      } catch (err) {
        console.error('Failed to load Leaflet:', err)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map when expanded
  useEffect(() => {
    if (!isExpanded || !mapContainerRef.current || !leafletLoaded) return

    const L = (window as any).L
    if (!L) return

    // Initialize map if not already done
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: hasLocation ? 15 : 12,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map

      // Add click handler to place marker
      if (!disabled) {
        map.on('click', (e: LeafletMouseEvent) => {
          const { lat, lng } = e.latlng
          updateMarker(lat, lng)
          onLocationChange(lat, lng)
        })
      }
    }

    // Update or create marker
    if (hasLocation) {
      updateMarker(latitude!, longitude!)
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [isExpanded, leafletLoaded, hasLocation, disabled])

  // Update marker position
  const updateMarker = useCallback((lat: number, lng: number) => {
    const L = (window as any).L
    if (!L || !mapRef.current) return

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const marker = L.marker([lat, lng], {
        draggable: !disabled,
      }).addTo(mapRef.current)

      if (!disabled) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onLocationChange(pos.lat, pos.lng)
        })
      }

      markerRef.current = marker
    }

    mapRef.current.setView([lat, lng], mapRef.current.getZoom() < 14 ? 15 : mapRef.current.getZoom())
  }, [disabled, onLocationChange])

  // Search for location using Nominatim (OpenStreetMap)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchError(null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=ph&limit=1`,
        {
          headers: {
            'User-Agent': 'RentalPH-PropertyListing/1.0',
          },
        }
      )

      const results = await response.json()

      if (results.length > 0) {
        const { lat, lon } = results[0]
        const parsedLat = parseFloat(lat)
        const parsedLng = parseFloat(lon)
        
        updateMarker(parsedLat, parsedLng)
        onLocationChange(parsedLat, parsedLng)
        
        if (mapRef.current) {
          mapRef.current.setView([parsedLat, parsedLng], 16)
        }
      } else {
        setSearchError('Location not found. Try a different search.')
      }
    } catch (err) {
      console.error('Search error:', err)
      setSearchError('Failed to search location. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Use current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser')
      return
    }

    setIsSearching(true)
    setSearchError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        updateMarker(lat, lng)
        onLocationChange(lat, lng)
        setIsSearching(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setSearchError('Unable to get your location. Please check permissions.')
        setIsSearching(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasLocation ? 'bg-green-100' : 'bg-gray-100'}`}>
            <svg className={`w-4 h-4 ${hasLocation ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">
              {hasLocation ? 'Location Set' : 'Set Property Location'}
            </div>
            <div className="text-xs text-gray-500">
              {hasLocation
                ? `${latitude!.toFixed(6)}, ${longitude!.toFixed(6)}`
                : 'Click to open map and pinpoint location'
              }
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded map area */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Search bar */}
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={locationName ? `Search near "${locationName}"` : 'Search address or place...'}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={disabled || isSearching}
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={disabled || isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? '...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={disabled || isSearching}
                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                title="Use my current location"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2M2 12h2m16 0h2m-9-7a5 5 0 110 10 5 5 0 010-10zm0 3a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </button>
            </div>
            {searchError && (
              <p className="mt-2 text-xs text-red-600">{searchError}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Click on the map to place a marker, or drag the marker to adjust position
            </p>
          </div>

          {/* Map container */}
          <div
            ref={mapContainerRef}
            style={{ height: '300px', width: '100%' }}
          />
        </div>
      )}
    </div>
  )
}

export default LocationPicker
