'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Map, Marker, TileLayer } from 'leaflet'
import type { Property } from '@/types'
import { ASSETS } from '@/utils/assets'
import { resolvePropertyImage } from '@/utils/imageResolver'

interface PublicPropertiesMapProps {
  properties: Property[]
  onPropertyClick?: (property: Property) => void
}

export default function PublicPropertiesMap({ properties, onPropertyClick }: PublicPropertiesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const tileLayerRef = useRef<TileLayer | null>(null)
  const markersRef = useRef<Marker[]>([])
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const initializedRef = useRef(false)

  // Memoize filtered properties to prevent unnecessary recalculations
  const propertiesWithCoords = useMemo(() => {
    return properties.filter((p) => {
      return p.latitude && p.longitude && !isNaN(parseFloat(p.latitude)) && !isNaN(parseFloat(p.longitude))
    })
  }, [properties])

  // Helper function to create marker
  const createMarker = (property: Property, L: any, map: Map) => {
    const lat = parseFloat(property.latitude!)
    const lng = parseFloat(property.longitude!)

    // Create custom blue marker icon
    const customIcon = L.divIcon({
      className: 'custom-property-marker',
      html: `
        <div style="
          background-color: #2563EB;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    })

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)

    // Get property image
    let imageUrl = property.image_url
    if (!imageUrl && property.image_path) {
      imageUrl = resolvePropertyImage(property.image_path, property.id)
    }
    if (!imageUrl && property.image) {
      imageUrl = resolvePropertyImage(property.image, property.id)
    }
    if (!imageUrl) {
      imageUrl = ASSETS.PLACEHOLDER_PROPERTY_MAIN
    }

    // Create popup content with property details
    const popupContent = `
      <div style="
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 280px;
      ">
        <div style="
          width: 100%;
          height: 180px;
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
          background-color: #f3f4f6;
        "></div>
        <div style="padding: 16px;">
          <h4 style="
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            line-height: 1.3;
          ">${(property.title || 'Property').replace(/"/g, '&quot;')}</h4>
          <p style="
            margin: 0 0 12px 0;
            font-size: 14px;
            color: #2563EB;
            font-weight: 500;
          ">${(property.type || 'Property').replace(/"/g, '&quot;')}</p>
            <a 
              href="/property/${property.id}" 
              style="
              display: block;
              width: 100%;
              padding: 10px 16px;
              background-color: #2563EB;
              color: white;
              text-align: center;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              font-size: 14px;
              transition: background-color 0.2s;
            "
            onmouseover="this.style.backgroundColor='#1d4ed8'"
            onmouseout="this.style.backgroundColor='#2563EB'"
          >
            Details
          </a>
        </div>
      </div>
    `

    // Handle marker click
    marker.on('click', () => {
      setSelectedProperty(property)
      if (onPropertyClick) {
        onPropertyClick(property)
      }
    })

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'property-popup'
    })

    return marker
  }

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

    // Initialize map only once
    if (!mapRef.current && !initializedRef.current) {
      // Ensure container has dimensions
      if (mapContainerRef.current.offsetWidth === 0 || mapContainerRef.current.offsetHeight === 0) {
        // Wait for next frame if container isn't ready
        const timeoutId = setTimeout(() => {
          if (!mapContainerRef.current || mapRef.current || initializedRef.current) return
          
          const defaultLat = 14.5995 // Manila, Philippines
          const defaultLng = 120.9842

          const map = L.map(mapContainerRef.current!, {
            zoomControl: true,
            scrollWheelZoom: true,
          })

          // Calculate bounds if we have properties
          if (propertiesWithCoords.length > 0) {
            const bounds = L.latLngBounds(
              propertiesWithCoords.map((p) => [parseFloat(p.latitude!), parseFloat(p.longitude!)])
            )
            map.fitBounds(bounds, { padding: [50, 50] })
          } else {
            map.setView([defaultLat, defaultLng], 13)
          }

          // Add OpenStreetMap tile layer only once
          const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            minZoom: 1,
          }).addTo(map)

          tileLayerRef.current = tileLayer
          mapRef.current = map
          initializedRef.current = true

          // Invalidate size after a short delay to ensure proper rendering
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize()
            }
          }, 100)

          // Add markers for each property
          propertiesWithCoords.forEach((property) => {
            const marker = createMarker(property, L, map)
            markersRef.current.push(marker)
          })
        }, 100)

        return () => clearTimeout(timeoutId)
      }

      // Container is ready, initialize immediately
      const defaultLat = 14.5995 // Manila, Philippines
      const defaultLng = 120.9842

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      })

      // Calculate bounds if we have properties
      if (propertiesWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          propertiesWithCoords.map((p) => [parseFloat(p.latitude!), parseFloat(p.longitude!)])
        )
        map.fitBounds(bounds, { padding: [50, 50] })
      } else {
        map.setView([defaultLat, defaultLng], 13)
      }

      // Add OpenStreetMap tile layer only once
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 1,
      }).addTo(map)

      tileLayerRef.current = tileLayer
      mapRef.current = map
      initializedRef.current = true

      // Invalidate size after a short delay to ensure proper rendering
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }, 100)

      // Add markers for each property
      propertiesWithCoords.forEach((property) => {
        const marker = createMarker(property, L, map)
        markersRef.current.push(marker)
      })
    } else if (mapRef.current && initializedRef.current) {
      // Map already initialized, just update markers
      const map = mapRef.current

      // Clear existing markers
      markersRef.current.forEach((marker) => {
        map.removeLayer(marker)
      })
      markersRef.current = []

      // Add new markers
      propertiesWithCoords.forEach((property) => {
        const marker = createMarker(property, L, map)
        markersRef.current.push(marker)
      })

      // Update bounds if we have properties
      if (propertiesWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          propertiesWithCoords.map((p) => [parseFloat(p.latitude!), parseFloat(p.longitude!)])
        )
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }

    // Cleanup markers only (not the map)
    return () => {
      markersRef.current.forEach((marker) => {
        if (mapRef.current) {
          mapRef.current.removeLayer(marker)
        }
      })
      markersRef.current = []
    }
  }, [leafletLoaded, propertiesWithCoords, onPropertyClick])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        initializedRef.current = false
      }
      if (tileLayerRef.current) {
        tileLayerRef.current.remove()
        tileLayerRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
    </div>
  )
}
