'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map, Marker } from 'leaflet'
import type { Property } from '@/types'

interface PropertiesMapProps {
  properties: Property[]
  agentId?: number | null // Optional: filter by agent ID for extra safety
  className?: string // Optional: additional CSS classes
}

export default function PropertiesMap({ properties, agentId, className }: PropertiesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markersRef = useRef<Marker[]>([])
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Filter properties: only show properties that belong to the specified agent (if provided)
  // and have valid coordinates
  const propertiesWithCoords = properties.filter((p) => {
    // First check if agentId filter is provided and property belongs to that agent
    if (agentId !== null && agentId !== undefined && p.agent_id !== agentId) {
      return false
    }
    // Then check if coordinates are valid
    return p.latitude && p.longitude && !isNaN(parseFloat(p.latitude)) && !isNaN(parseFloat(p.longitude))
  })

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

  // Initialize map and markers
  useEffect(() => {
    if (!mapContainerRef.current || !leafletLoaded || typeof window === 'undefined') return

    const L = (window as any).L
    if (!L) return

    // Initialize map
    if (!mapRef.current) {
      const defaultLat = 14.5995 // Manila, Philippines
      const defaultLng = 120.9842
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
      })

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
    }

    const map = mapRef.current

    // Clear existing markers
    if (map) {
      markersRef.current.forEach((marker) => {
        map.removeLayer(marker)
      })
    }
    markersRef.current = []

    // Add markers for each property
    propertiesWithCoords.forEach((property) => {
      const lat = parseFloat(property.latitude!)
      const lng = parseFloat(property.longitude!)

      // Skip invalid coordinates
      if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        return
      }

      // Determine marker color based on status
      let markerColor = '#2563EB' // Default blue for active
      if (!property.published_at) {
        markerColor = '#DC2626' // Red for hidden
      }

      // Create custom icon with colored marker
      const customIcon = L.divIcon({
        className: 'custom-property-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            position: relative;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: 14px;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              position: absolute;
              top: 0;
              left: 0;
            ">📍</div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      })

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px; padding: 8px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">
            ${property.title}
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280;">
            ${property.type || 'Property'}
          </p>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280;">
            ₱${property.price != null ? property.price.toLocaleString('en-US') : 'N/A'} ${property.price_type || 'Monthly'}
          </p>
          <p style="margin: 0; font-size: 11px; color: ${property.published_at ? '#10B981' : '#DC2626'};">
            ${property.published_at ? '● Active' : '● Hidden'}
          </p>
        </div>
      `
      marker.bindPopup(popupContent)

      markersRef.current.push(marker)
    })

    // Fit bounds if we have markers with valid coordinates
    if (map && markersRef.current.length > 0) {
      try {
        const validCoords = propertiesWithCoords
          .map((p) => {
            const lat = parseFloat(p.latitude!)
            const lng = parseFloat(p.longitude!)
            if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
              return null
            }
            return [lat, lng] as [number, number]
          })
          .filter((coord): coord is [number, number] => coord !== null)
        
        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords)
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] })
          }
        }
      } catch (err) {
        console.warn('Could not fit map bounds:', err)
      }
    }

    // Cleanup
    return () => {
      markersRef.current.forEach((marker) => {
        if (mapRef.current) {
          mapRef.current.removeLayer(marker)
        }
      })
      markersRef.current = []
    }
  }, [leafletLoaded, propertiesWithCoords])

  // Count properties by status
  const activeCount = properties.filter((p) => p.published_at).length
  const hiddenCount = properties.filter((p) => !p.published_at).length

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
      
      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontSize: '13px',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#111827' }}>Legend</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                backgroundColor: '#2563EB',
                border: '2px solid white',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            />
            <span style={{ color: '#374151' }}>Active ({activeCount})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                backgroundColor: '#DC2626',
                border: '2px solid white',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            />
            <span style={{ color: '#374151' }}>Hidden ({hiddenCount})</span>
          </div>
        </div>
      </div>
    </div>
  )
}

