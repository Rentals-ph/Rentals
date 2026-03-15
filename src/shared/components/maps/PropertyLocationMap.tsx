'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map, Marker } from 'leaflet'
import type { Property } from '@/shared/types'

interface PropertyLocationMapProps {
  property: Property
}

export default function PropertyLocationMap({ property }: PropertyLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

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
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map and marker
  useEffect(() => {
    if (!mapContainerRef.current || !leafletLoaded || typeof window === 'undefined') return

    const L = (window as any).L
    if (!L) return

    // Check if property has valid coordinates
    const hasValidCoords = property.latitude && property.longitude && 
      !isNaN(parseFloat(property.latitude)) && !isNaN(parseFloat(property.longitude))

    if (!hasValidCoords) {
      // If no coordinates, show default location (Manila, Philippines)
      if (!mapRef.current) {
        const defaultLat = 14.5995
        const defaultLng = 120.9842
        const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        mapRef.current = map
      }
      return
    }

    const lat = parseFloat(property.latitude!)
    const lng = parseFloat(property.longitude!)

    // Initialize map
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([lat, lng], 15)

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
    } else {
      // Update map view if coordinates change
      mapRef.current.setView([lat, lng], 15)
    }

    const map = mapRef.current

    // Remove existing marker if any
    if (map && markerRef.current) {
      map.removeLayer(markerRef.current)
    }

    // Create custom blue marker icon
    const customIcon = L.divIcon({
      className: 'property-location-marker',
      html: `
        <div style="
          background-color: #2563EB;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            width: 16px;
            height: 16px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    })

    // Create marker
    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)

    // Create popup with property info
    const popupContent = `
      <div style="padding: 8px; min-width: 200px;">
        <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #111827;">
          ${(property.title || 'Property').replace(/"/g, '&quot;')}
        </h4>
        <p style="margin: 0; font-size: 12px; color: #6B7280;">
          ${(property.location || 'Location not specified').replace(/"/g, '&quot;')}
        </p>
      </div>
    `

    marker.bindPopup(popupContent)
    markerRef.current = marker

    // Cleanup
    return () => {
      if (markerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerRef.current)
      }
      markerRef.current = null
    }
  }, [leafletLoaded, property.latitude, property.longitude, property.title, property.location])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
    </div>
  )
}

