'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LocationMap } from '@/features/agents'
import { useCreateListing } from '@/features/listings'
import {
  FiChevronDown,
  FiArrowLeft,
  FiArrowRight,
  FiCheck
} from 'react-icons/fi'
import { philippinesProvinces, getCitiesByProvince } from '@/shared/data/locations'
import { ProgressRing } from '@/shared/components/ui'
// import '../AgentCreateListingCategory.css' // Converted to Tailwind

export default function AgentCreateListingLocation() {
  const router = useRouter()
  const { data, updateData } = useCreateListing()

  const stepLabels = [
    'Category',
    'Details',
    'Location',
    'Property Images',
    'Pricing',
    'Attributes',
    'Owner Info',
    'Publish'
  ]

  const [country, setCountry] = useState(data.country || 'Philippines')
  const [state, setState] = useState(data.state || '')
  const [city, setCity] = useState(data.city || '')
  const [street, setStreet] = useState(data.street || '')
  const [latitude, setLatitude] = useState(data.latitude || '')
  const [longitude, setLongitude] = useState(data.longitude || '')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [isGeocoding, setIsGeocoding] = useState(false)

  useEffect(() => {
    setCountry(data.country || 'Philippines')
    setState(data.state || '')
    setCity(data.city || '')
    setStreet(data.street || '')
    setLatitude(data.latitude || '')
    setLongitude(data.longitude || '')
  }, [data])

  // Update available cities when state changes
  useEffect(() => {
    if (state) {
      const cities = getCitiesByProvince(state)
      setAvailableCities(cities)
      // Reset city if it's not in the new list
      if (city && !cities.includes(city)) {
        setCity('')
      }
    } else {
      setAvailableCities([])
      setCity('')
    }
  }, [state, city])

  // Auto-geocode when street address is entered
  const handleStreetChange = async (value: string) => {
    setStreet(value)
    
    if (value.trim().length > 10) {
      setIsGeocoding(true)
      try {
        // Use OpenStreetMap Nominatim API for geocoding (free, no API key needed)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value + ', Philippines')}&limit=1`,
          {
            headers: {
              'User-Agent': 'Rental.ph Property Listing'
            }
          }
        )
        const data = await response.json()
        
        if (data && data.length > 0) {
          const result = data[0]
          const lat = parseFloat(result.lat)
          const lon = parseFloat(result.lon)
          
          setLatitude(lat.toString())
          setLongitude(lon.toString())
          
          // Try to extract state and city from address components
          const address = result.display_name || ''
          
          // Auto-populate country
          setCountry('Philippines')
          
          // Try to match province from the address
          const provinceMatch = philippinesProvinces.find(p => 
            address.includes(p.name)
          )
          if (provinceMatch) {
            setState(provinceMatch.name)
            // Try to match city
            const cityMatch = provinceMatch.cities.find(c => 
              address.includes(c)
            )
            if (cityMatch) {
              setCity(cityMatch)
            }
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error)
        // Silently fail - user can still manually enter location
      } finally {
        setIsGeocoding(false)
      }
    }
  }

  return (
    <>

        <div className="flex items-center gap-2 text-xl font-semibold text-gray-900 my-1.5 mx-0 mb-4"> {/* aclc-breadcrumb */}
          <span className="text-gray-900">Create Listing</span> {/* aclc-breadcrumb-strong */}
          <span className="text-gray-400 font-medium">&gt;</span> {/* aclc-breadcrumb-sep */}
          <span className="text-gray-400 font-semibold">Location</span> {/* aclc-breadcrumb-muted */}
        </div>

        <div className="flex items-center gap-4 p-5 mb-6 bg-white rounded-xl shadow-sm md:flex-col md:items-start"> {/* section-card aclc-stepper-card */}
          <div className="flex items-center gap-3 min-w-[220px]"> {/* aclc-stepper-left */}
            <ProgressRing percent={30} />
            <div className="text-sm font-semibold text-gray-600">Completion Status</div> {/* aclc-stepper-left-title */}
          </div>

          <div className="flex-1 grid grid-cols-4 items-start gap-0 md:w-full md:overflow-x-auto md:pb-1.5 md:justify-start"> {/* aclc-steps */}
            {stepLabels.map((label, idx) => {
              const step = idx + 1
              const isActive = step === 3
              const isDone = step < 3
              return (
                <div className="flex flex-col items-center min-w-0 flex-shrink-0" key={label}> {/* aclc-step */}
                  <div className="w-full flex items-center relative"> {/* aclc-step-top */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative z-10 ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}> {/* aclc-step-circle */}
                      {isDone ? <FiCheck className="text-lg" /> : step}
                    </div>
                    {step !== stepLabels.length && (
                      <div className={`h-1.5 rounded-full flex-1 ml-2 mr-2 min-w-0 ${step < 3 ? 'bg-blue-600' : 'bg-gray-200'}`} /> // aclc-step-line
                    )}
                  </div>
                  <div className={`mt-2 text-xs font-semibold text-center leading-tight ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</div> {/* aclc-step-label */}
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-7 pb-6 bg-white rounded-xl shadow-sm max-w-full"> {/* section-card aclc-form-card */}
          <h2 className="m-0 mb-4 text-3xl font-bold text-gray-900">Property Location</h2> {/* aclc-form-title */}

          <div className="grid grid-cols-3 gap-4 max-w-full mb-4 lg:grid-cols-1"> {/* acll-grid-3 */}
            <div>
              <label className="aclc-label" htmlFor="country">
                Country
              </label>
              <div className="aclc-select-wrap">
                <select
                  id="country"
                  className="aclc-select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="Philippines">Philippines</option>
                </select>
                <FiChevronDown className="aclc-select-caret" />
              </div>
            </div>

            <div>
              <label className="aclc-label" htmlFor="state">
                State/Province
              </label>
              <div className="aclc-select-wrap">
                <select
                  id="state"
                  className="aclc-select"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">--Select State/Province--</option>
                  {philippinesProvinces.map((province) => (
                    <option key={province.name} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="aclc-select-caret" />
              </div>
            </div>

            <div>
              <label className="aclc-label" htmlFor="city">
                City
              </label>
              <div className="aclc-select-wrap">
                <select
                  id="city"
                  className="aclc-select"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!state}
                >
                  <option value="">--Select City--</option>
                  {availableCities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="aclc-select-caret" />
              </div>
            </div>
          </div>

          <div className="w-full mt-0 mb-4"> {/* acll-street-section */}
            <label className="block text-sm font-semibold text-blue-600 mb-2" htmlFor="street"> {/* aclc-label */}
              Street Address
            </label>
            <input
              id="street"
              className="w-full h-11 px-3.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]" // acld-input
              placeholder="Enter street address, building name, etc. (Location will be auto-detected)"
              value={street}
              onChange={(e) => handleStreetChange(e.target.value)}
            />
            {isGeocoding && (
              <div className="mt-2 py-2 px-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm flex items-center gap-2 before:content-[''] before:w-3 before:h-3 before:border-2 before:border-green-800 before:border-t-transparent before:rounded-full before:animate-spin"> {/* acll-geocoding-indicator */}
                <span>Detecting location...</span>
              </div>
            )}
            <div className="mt-3 flex items-start gap-2.5 py-2.5 px-3 rounded-lg bg-blue-50 border border-blue-200"> {/* acll-info-banner */}
              <span className="w-5.5 h-5.5 rounded-full border border-blue-300 inline-flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">i</span> {/* acll-info-icon */}
              <p className="m-0 text-xs text-gray-600 leading-relaxed">
                If you don&apos;t want to pinpoint the exact location of the property, you may leave the
                street address blank and just select the country, state/province, and city to indicate
                the general area.
              </p> {/* acll-info-text */}
            </div>
          </div>

          <div className="mt-0"> {/* acll-map-section */}
            <LocationMap
              latitude={latitude || null}
              longitude={longitude || null}
              onLocationChange={(lat, lng) => {
                setLatitude(lat)
                setLongitude(lng)
              }}
            />
          </div>
          
          {/* Hidden inputs for coordinates (auto-assigned via map or geocoding) */}
          <input type="hidden" name="latitude" value={latitude} />
          <input type="hidden" name="longitude" value={longitude} />

          <div className="mt-5 flex justify-between gap-3 md:flex-col md:items-stretch"> {/* acld-footer-actions acll-footer-actions */}
            <button
              className="acld-prev-btn"
              onClick={() => router.push('/agent/create-listing/details')}
              type="button"
            >
              <FiArrowLeft />
              <span>Previous</span>
            </button>

            <button
              className="aclc-next-btn"
              onClick={() => {
                updateData({
                  country: country || 'Philippines',
                  state,
                  city,
                  street,
                  latitude: latitude || '',
                  longitude: longitude || '',
                })
                router.push('/agent/create-listing/property-images')
              }}
              type="button"
            >
              <span>Next</span>
              <FiArrowRight />
            </button>
          </div>
        </div>
    </>
  )
}

