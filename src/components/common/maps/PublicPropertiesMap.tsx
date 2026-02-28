'use client'

import { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
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
  const fullViewMapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const tileLayerRef = useRef<TileLayer | null>(null)
  const markersRef = useRef<Marker[]>([])
  const markersByPropertyIdRef = useRef<Map<number, Marker>>(new Map())
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const initializedRef = useRef(false)
  const currentMapModeRef = useRef<'normal' | 'full'>(null as unknown as 'normal' | 'full')
  const [isFullView, setIsFullView] = useState(false)

  const exitFullView = () => setIsFullView(false)

  // Escape key and body scroll lock when full view is open
  useEffect(() => {
    if (!isFullView) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitFullView()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isFullView])

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
      // Recompute map size (e.g. after mobile bottom sheet closes) so flyTo uses correct dimensions
      mapRef.current.invalidateSize()
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

    // Improved popup card: cleaner layout, price, location (sizes tuned for desktop; mobile overrides in index.css)
    const popupContent = `
      <div class="property-map-popup" style="
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
        min-width: 260px;
        max-width: 320px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div class="property-map-popup-image" style="
          width: 100%;
          height: 160px;
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
          background-color: #f1f5f9;
        "></div>
        <div class="property-map-popup-body" style="padding: 14px 16px 16px;">
          <p class="property-map-popup-type" style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.02em;">${typeStr}</p>
          <h4 class="property-map-popup-title" style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #0f172a; line-height: 1.35;">${title}</h4>
          <p class="property-map-popup-location" style="margin: 0 0 10px 0; font-size: 13px; color: #64748b;">${locationStr || 'Location not specified'}</p>
          <p class="property-map-popup-price" style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #0f172a;">${priceStr}</p>
          <a 
            href="/property/${property.id}" 
            class="property-map-popup-link"
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
      minWidth: 260,
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

  // Initialize map and markers (re-runs when isFullView toggles to use the active container)
  useEffect(() => {
    const container = isFullView ? fullViewMapContainerRef.current : mapContainerRef.current
    if (!container || !leafletLoaded || typeof window === 'undefined') return

    const L = (window as any).L
    if (!L) return

    // If we have a map from the other mode, destroy it so we can create in the current container
    if (mapRef.current && currentMapModeRef.current !== (isFullView ? 'full' : 'normal')) {
      mapRef.current.remove()
      mapRef.current = null
      tileLayerRef.current = null
      initializedRef.current = false
      markersRef.current = []
      markersByPropertyIdRef.current.clear()
    }

    currentMapModeRef.current = isFullView ? 'full' : 'normal'

    // Initialize map only once per container
    if (!mapRef.current && !initializedRef.current) {
      // Ensure container has dimensions
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        // Wait for next frame if container isn't ready
        const timeoutId = setTimeout(() => {
          const target = isFullView ? fullViewMapContainerRef.current : mapContainerRef.current
          if (!target || mapRef.current || initializedRef.current) return
          
          const defaultLat = 14.5995 // Manila, Philippines
          const defaultLng = 120.9842

          const map = L.map(target, {
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

      const map = L.map(container, {
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

    // In full view, invalidate size so map fills the new container
    const invalidateTimer = isFullView && mapRef.current
      ? setTimeout(() => mapRef.current?.invalidateSize(), 150)
      : undefined

    // Cleanup markers only (not the map)
    return () => {
      if (invalidateTimer) clearTimeout(invalidateTimer)
      markersRef.current.forEach((marker) => {
        if (mapRef.current) {
          mapRef.current.removeLayer(marker)
        }
      })
      markersRef.current = []
      markersByPropertyIdRef.current.clear()
    }
  }, [leafletLoaded, propertiesWithCoords, onPropertyClick, isFullView])

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

  const mapContainerStyles = {
    width: '100%',
    height: '100%',
    minHeight: isFullView ? undefined : '600px',
    borderRadius: isFullView ? 0 : '8px',
    overflow: 'hidden' as const,
  }

  return (
    <>
      {/* Normal view: map + expand button */}
      {!isFullView && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }} className="public-properties-map-wrapper">
          <div ref={mapContainerRef} style={mapContainerStyles} />
          <button
            type="button"
            onClick={() => setIsFullView(true)}
            className="absolute top-3 right-3 z-[1000] flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-sm font-semibold text-slate-800 shadow-lg ring-1 ring-black/10 transition hover:bg-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Expand map to full view"
            title="Full view"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            <span className="hidden sm:inline">Full view</span>
          </button>
        </div>
      )}

      {/* Full view: overlay with map and close */}
      {isFullView &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex flex-col bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-label="Map full view"
          >
            <header className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-3 bg-slate-800/95 border-b border-white/10">
              <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                Map view — {propertiesWithCoords.length} propert{propertiesWithCoords.length === 1 ? 'y' : 'ies'}
              </h2>
              <button
                type="button"
                onClick={exitFullView}
                className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Exit full view"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span className="hidden sm:inline">Exit full view</span>
              </button>
            </header>
            <div
              ref={fullViewMapContainerRef}
              className="flex-1 min-h-0 w-full"
              style={{ minHeight: '300px' }}
            />
          </div>,
          document.body
        )}
    </>
  )
})

export default PublicPropertiesMap
