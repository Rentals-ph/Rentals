'use client'

import { useEffect, useRef, useState } from 'react'
import { FiMapPin, FiNavigation } from 'react-icons/fi'
import type { Map, Marker, LeafletMouseEvent } from 'leaflet'
// @ts-ignore - CSS import
import 'leaflet/dist/leaflet.css'

interface AddressDetails {
  country?: string
  state?: string
  city?: string
  street?: string
}

interface LocationMapProps {
  latitude: string | null
  longitude: string | null
  onLocationChange: (lat: string, lng: string) => void
  onAddressChange?: (address: AddressDetails) => void
}

export default function LocationMap({ latitude, longitude, onLocationChange, onAddressChange }: LocationMapProps) {
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
  const lastCoordsRef = useRef<{ lat: string | null; lng: string | null }>({ lat: null, lng: null })

  // Reverse geocoding function to get address from coordinates
  const reverseGeocode = useRef(async (lat: number, lng: number) => {
    if (!onAddressChange) return

    setIsReverseGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Rental.ph Property Listing'
          }
        }
      )
      const data = await response.json()
      
      if (data && data.address) {
        const address = data.address
        const addressDetails: AddressDetails = {
          country: address.country || 'Philippines',
          state: address.state || address.province || address.region || '',
          city: address.city || address.town || address.municipality || address.village || '',
          street: address.road || address.street || address.address29 || '',
        }
        onAddressChange(addressDetails)
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      // Silently fail - coordinates are still saved
    } finally {
      setIsReverseGeocoding(false)
    }
  })

  // Update the ref when onAddressChange changes
  useEffect(() => {
    reverseGeocode.current = async (lat: number, lng: number) => {
      if (!onAddressChange) return

      setIsReverseGeocoding(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Rental.ph Property Listing'
            }
          }
        )
        const data = await response.json()
        
        if (data && data.address) {
          const address = data.address
          const addressDetails: AddressDetails = {
            country: address.country || 'Philippines',
            state: address.state || address.province || address.region || '',
            city: address.city || address.town || address.municipality || address.village || '',
            street: address.road || address.street || address.address29 || '',
          }
          onAddressChange(addressDetails)
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error)
        // Silently fail - coordinates are still saved
      } finally {
        setIsReverseGeocoding(false)
      }
    }
  }, [onAddressChange])

  // Dynamically load Leaflet (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadLeaflet = async () => {
      try {
        const L = (await import('leaflet')).default
        // CSS is imported at the top of the file

        // Fix for default marker icon in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Store Leaflet in window for use in other effects
        ;(window as any).L = L
        setLeafletLoaded(true)
      } catch (err) {
        console.error('Failed to load Leaflet:', err)
        setError('Failed to load map library')
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !leafletLoaded || typeof window === 'undefined') return

    const L = (window as any).L
    if (!L) return

    // Default center (Manila, Philippines)
    const defaultLat = 14.5995
    const defaultLng = 120.9842

    // Use provided coordinates or default
    const initialLat = latitude ? parseFloat(latitude) : defaultLat
    const initialLng = longitude ? parseFloat(longitude) : defaultLng

    // Initialize map
    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13)

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    // Add initial marker if coordinates exist
    if (latitude && longitude) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng], {
          draggable: true,
        }).addTo(map)

        markerRef.current = marker

        // Update location when marker is dragged
        marker.on('dragend', () => {
          const position = marker.getLatLng()
          const dragLat = position.lat.toString()
          const dragLng = position.lng.toString()
          // Only update if coordinates actually changed
          if (lastCoordsRef.current.lat !== dragLat || lastCoordsRef.current.lng !== dragLng) {
            lastCoordsRef.current = { lat: dragLat, lng: dragLng }
            onLocationChange(dragLat, dragLng)
            reverseGeocode.current(position.lat, position.lng)
          }
        })
        
        // Store initial coordinates
        if (latitude && longitude) {
          lastCoordsRef.current = { lat: latitude, lng: longitude }
        }
      }
    }

    // Handle map clicks to set location
    map.on('click', (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng

      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
      }

      // Add new marker
      const marker = L.marker([lat, lng], {
        draggable: true,
      }).addTo(map)

      markerRef.current = marker

      // Update location
      const newLat = lat.toString()
      const newLng = lng.toString()
      // Only update if coordinates actually changed
      if (lastCoordsRef.current.lat !== newLat || lastCoordsRef.current.lng !== newLng) {
        lastCoordsRef.current = { lat: newLat, lng: newLng }
        onLocationChange(newLat, newLng)
        reverseGeocode.current(lat, lng)
      }

      // Update location when marker is dragged
      marker.on('dragend', () => {
        const position = marker.getLatLng()
        const dragLat = position.lat.toString()
        const dragLng = position.lng.toString()
        // Only update if coordinates actually changed
        if (lastCoordsRef.current.lat !== dragLat || lastCoordsRef.current.lng !== dragLng) {
          lastCoordsRef.current = { lat: dragLat, lng: dragLng }
          onLocationChange(dragLat, dragLng)
          reverseGeocode.current(position.lat, position.lng)
        }
      })
    })

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      if (markerRef.current) {
        markerRef.current = null
      }
    }
  }, [leafletLoaded]) // Only re-run when leaflet loads

  // Update map view when coordinates change externally
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || typeof window === 'undefined') return

    const L = (window as any).L
    if (!L) return

    // Check if coordinates actually changed
    if (latitude === lastCoordsRef.current.lat && longitude === lastCoordsRef.current.lng) {
      return
    }

    lastCoordsRef.current = { lat: latitude, lng: longitude }

    if (latitude && longitude) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)

      if (!isNaN(lat) && !isNaN(lng)) {
        // Update map view only if marker exists, otherwise it's handled in the initialization effect
        if (markerRef.current) {
          const currentPos = markerRef.current.getLatLng()
          // Only update if the position actually changed (avoid unnecessary updates)
          if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
            mapRef.current.setView([lat, lng], mapRef.current.getZoom())
            markerRef.current.setLatLng([lat, lng])
            // Only reverse geocode if coordinates changed significantly
            reverseGeocode.current(lat, lng)
          }
        }
      }
    }
  }, [latitude, longitude, leafletLoaded])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        onLocationChange(lat.toString(), lng.toString())
        reverseGeocode.current(lat, lng)
        setIsLoading(false)
      },
      (err) => {
        setError('Unable to retrieve your location. Please allow location access or click on the map.')
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="location-map-container">
      <div className="location-map-header">
     
       
      </div>

      {error && (
        <div className="location-map-error">
          {error}
        </div>
      )}

      {isReverseGeocoding && (
        <div className="location-map-info" style={{ marginTop: '8px', marginBottom: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#3B82F6' }}>
            Retrieving address information...
          </p>
        </div>
      )}

      <div className="location-map-info">
        {(latitude && longitude) && (
          <div className="location-map-coordinates">
            
          </div>
        )}
      </div>

      <div
        ref={mapContainerRef}
        className="location-map"
        style={{ height: '400px', width: '100%', borderRadius: '8px', zIndex: 0 }}
      />
    </div>
  )
}

