/**
 * Inline Location Map Component
 * Embedded map for selecting property location in chat flow
 */

'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { Map, Marker, LeafletMouseEvent } from 'leaflet'

interface InlineLocationMapProps {
  onLocationConfirm: (address: string, latitude: number, longitude: number) => void
  initialLatitude?: number | null
  initialLongitude?: number | null
}

export function InlineLocationMap({
  onLocationConfirm,
  initialLatitude,
  initialLongitude,
}: InlineLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [selectedLat, setSelectedLat] = useState<number | null>(initialLatitude || null)
  const [selectedLng, setSelectedLng] = useState<number | null>(initialLongitude || null)
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Default to Philippines center
  const defaultLat = 14.5995
  const defaultLng = 120.9842

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

  // Get user's current location
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        // Silently fail - use default location
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !leafletLoaded) return

    const L = (window as any).L
    if (!L) return

    // Use user location if available, otherwise default
    const centerLat = userLocation?.lat || initialLatitude || defaultLat
    const centerLng = userLocation?.lng || initialLongitude || defaultLng

    // Initialize map if not already done
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: initialLatitude && initialLongitude ? 15 : 12,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map

      // Add click handler to place marker
      map.on('click', (e: LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        updateMarker(lat, lng)
        reverseGeocode(lat, lng)
      })
    }

    // Update or create marker if we have initial location
    if (initialLatitude && initialLongitude) {
      updateMarker(initialLatitude, initialLongitude)
      reverseGeocode(initialLatitude, initialLongitude)
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [leafletLoaded, userLocation, initialLatitude, initialLongitude])

  // Update marker position
  const updateMarker = useCallback((lat: number, lng: number) => {
    const L = (window as any).L
    if (!L || !mapRef.current) return

    setSelectedLat(lat)
    setSelectedLng(lng)

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const marker = L.marker([lat, lng], {
        draggable: true,
      }).addTo(mapRef.current)

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        setSelectedLat(pos.lat)
        setSelectedLng(pos.lng)
        reverseGeocode(pos.lat, pos.lng)
      })

      markerRef.current = marker
    }

    mapRef.current.setView([lat, lng], mapRef.current.getZoom() < 14 ? 15 : mapRef.current.getZoom())
  }, [])

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true)
    setResolvedAddress(null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Rental.ph Listing Assistant',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()
      
      // Build address string from response
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setResolvedAddress(address)
    } catch (err) {
      console.error('Reverse geocoding failed:', err)
      setResolvedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    } finally {
      setIsGeocoding(false)
    }
  }, [])

  const handleConfirm = () => {
    if (selectedLat && selectedLng && resolvedAddress) {
      onLocationConfirm(resolvedAddress, selectedLat, selectedLng)
    }
  }

  return (
    <div className="mt-3 w-full">
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <p className="text-xs text-gray-600 mb-2">Click on the map to drop a pin at the property location</p>
        
        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="w-full h-96 rounded-lg overflow-hidden border border-gray-300"
          style={{ minHeight: '384px' }}
        />
        
        {/* Resolved Address */}
        {isGeocoding && (
          <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Resolving address...
          </div>
        )}
        
        {resolvedAddress && !isGeocoding && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 mb-1">📍 Location:</p>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
              {resolvedAddress}
            </p>
          </div>
        )}
        
        {/* Confirm Button */}
        {selectedLat && selectedLng && resolvedAddress && (
          <button
            onClick={handleConfirm}
            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Confirm Location
          </button>
        )}
      </div>
    </div>
  )
}

