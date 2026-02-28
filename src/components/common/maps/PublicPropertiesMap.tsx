'use client'

import { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap, Marker, TileLayer } from 'leaflet'
import type { Property } from '@/types'
import { ASSETS } from '@/utils/assets'
import { resolvePropertyImage } from '@/utils/imageResolver'

function formatPrice(price: number): string {
  return `₱${price.toLocaleString('en-US')}`
}

export interface PublicPropertiesMapHandle {
  flyToProperty: (property: Property) => void
}

interface PublicPropertiesMapProps {
  properties: Property[]
  onPropertyClick?: (property: Property) => void
}

const PublicPropertiesMap = forwardRef<PublicPropertiesMapHandle, PublicPropertiesMapProps>(function PublicPropertiesMap(
  { properties, onPropertyClick },
  ref
) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const tileLayerRef = useRef<TileLayer | null>(null)
  const markersRef = useRef<Marker[]>([])
  const markersByPropertyIdRef = useRef<Map<number, Marker>>(new Map())
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const initializedRef = useRef(false)

  // Memoize filtered properties to prevent unnecessary recalculations
  const propertiesWithCoords = useMemo(() => {
    return properties.filter((p) => {
      return p.latitude && p.longitude && !isNaN(parseFloat(p.latitude)) && !isNaN(parseFloat(p.longitude))
    })
  }, [properties])

  useImperativeHandle(ref, () => ({
    flyToProperty(property: Property) {
      const lat = property.latitude && property.longitude
        ? parseFloat(property.latitude)
        : null
      const lng = property.latitude && property.longitude
        ? parseFloat(property.longitude)
        : null
      if (!mapRef.current || lat == null || lng == null) return
      mapRef.current.flyTo([lat, lng], 15, { duration: 0.6 })
      const marker = markersByPropertyIdRef.current.get(property.id)
      if (marker) {
        setTimeout(() => marker.openPopup(), 400)
      }
    },
  }), [])

  // Helper function to create marker
  const createMarker = (property: Property, L: any, map: LeafletMap) => {
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

    const title = (property.title || 'Property').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    const typeStr = (property.type || 'Property').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    const locationStr = (property.location || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    const priceStr = formatPrice(property.price ?? 0)

    // Improved popup card: cleaner layout, price, location
    const popupContent = `
      <div class="property-map-popup" style="
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
        min-width: 300px;
        max-width: 320px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="
          width: 100%;
          height: 160px;
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
          background-color: #f1f5f9;
        "></div>
        <div style="padding: 14px 16px 16px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.02em;">${typeStr}</p>
          <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #0f172a; line-height: 1.35;">${title}</h4>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b;">${locationStr || 'Location not specified'}</p>
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #0f172a;">${priceStr}</p>
          <a 
            href="/property/${property.id}" 
            style="
              display: block;
              width: 100%;
              padding: 10px 14px;
              background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              text-align: center;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 13px;
              box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
            "
            onmouseover="this.style.opacity='0.92'"
            onmouseout="this.style.opacity='1'"
          >
            View details
          </a>
        </div>
      </div>
    `

    marker.on('click', () => {
      if (onPropertyClick) {
        onPropertyClick(property)
      }
    })

    marker.bindPopup(popupContent, {
      maxWidth: 340,
      className: 'property-map-popup-wrapper',
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
            markersByPropertyIdRef.current.set(property.id, marker)
          })
        }, 100)

        return () => {
          clearTimeout(timeoutId)
          markersByPropertyIdRef.current.clear()
        }
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
        markersByPropertyIdRef.current.set(property.id, marker)
      })
    } else if (mapRef.current && initializedRef.current) {
      // Map already initialized, just update markers
      const map = mapRef.current

      // Clear existing markers
      markersRef.current.forEach((marker) => {
        map.removeLayer(marker)
      })
      markersRef.current = []
      markersByPropertyIdRef.current.clear()

      // Add new markers
      propertiesWithCoords.forEach((property) => {
        const marker = createMarker(property, L, map)
        markersRef.current.push(marker)
        markersByPropertyIdRef.current.set(property.id, marker)
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
      markersByPropertyIdRef.current.clear()
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
})

export default PublicPropertiesMap
