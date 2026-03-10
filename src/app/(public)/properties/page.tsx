'use client'

import { useState, useEffect, Suspense, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import VerticalPropertyCard from '@/components/common/VerticalPropertyCard'
import HorizontalPropertyCard from '@/components/common/HorizontalPropertyCard'
import { VerticalPropertyCardSkeleton } from '@/components/common/VerticalPropertyCardSkeleton'
import { HorizontalPropertyCardSkeleton } from '@/components/common/HorizontalPropertyCardSkeleton'
import PublicPropertiesMap, { type PublicPropertiesMapHandle } from '@/components/common/PublicPropertiesMap'
import { EmptyState, EmptyStateAction } from '@/components/common'
// import './page.css' // Removed - converted to Tailwind
import PageHeader from '@/components/layout/PageHeader'
import { propertiesApi } from '@/api/endpoints/properties'
import type { Property } from '@/types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import PopularSearches from '@/components/home/PopularSearches'
import { usePublicSidebar } from '@/contexts/PublicSidebarContext'
import { FloatingPropertyChat } from '@/components/properties/FloatingPropertyChat'

function PropertiesContent() {
  const searchParams = useSearchParams()
  const sidebarContext = usePublicSidebar()
  const [localRightOpen, setLocalRightOpen] = useState(false)
  const isSidebarOpen = sidebarContext ? sidebarContext.openSidebar === 'right' : localRightOpen
  const setIsSidebarOpen = sidebarContext
    ? (open: boolean) => sidebarContext.setOpenSidebar(open ? 'right' : null)
    : setLocalRightOpen

  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedType, setSelectedType] = useState('All Types')
  const [minBaths, setMinBaths] = useState('')
  const [minBeds, setMinBeds] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [areaSize, setAreaSize] = useState('')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('newest')
  const [sortByPrice, setSortByPrice] = useState('')
  const [subCategory, setSubCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProperties, setTotalProperties] = useState(0)
  const [allPropertiesForCount, setAllPropertiesForCount] = useState<Property[]>([])
  const [appliedFilters, setAppliedFilters] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const itemsPerPage = 9
  const mapRef = useRef<PublicPropertiesMapHandle>(null)
  const [mapListSheetOpen, setMapListSheetOpen] = useState(false)
  const [chatResults, setChatResults] = useState<Property[] | null>(null)

  // Advance search sidebar width (match Navbar: 240 / 264)
  const ADVANCE_SEARCH_WIDTH = 240
  const ADVANCE_SEARCH_WIDTH_SM = 264

  // Initialize state from URL query parameters
  useEffect(() => {
    if (!searchParams) return
    
    const searchParam = searchParams.get('search')
    const typeParam = searchParams.get('type')
    const locationParam = searchParams.get('location')
    const minBedsParam = searchParams.get('minBeds')
    const minBathsParam = searchParams.get('minBaths')
    const priceMinParam = searchParams.get('priceMin')
    const priceMaxParam = searchParams.get('priceMax')

    if (searchParam) {
      setSearchQuery(searchParam)
    }
    if (typeParam) {
      setSelectedType(typeParam)
    }
    if (locationParam) {
      setSelectedLocation(locationParam)
    }
    if (minBedsParam) {
      setMinBeds(minBedsParam)
    }
    if (minBathsParam) {
      setMinBaths(minBathsParam)
    }
    if (priceMinParam) {
      setPriceMin(priceMinParam)
    }
    if (priceMaxParam) {
      setPriceMax(priceMaxParam)
    }
  }, [searchParams])

  const propertyTypes = ['All Types', 'Condominium', 'Apartment', 'Apartment / Condo', 'House', 'Bed Space', 'Commercial', 'Commercial Spaces', 'Office', 'Office Spaces', 'Studio', 'Townhouse', 'TownHouse', 'Warehouse', 'WareHouse', 'Dormitory', 'Farm Land']
  const locations = ['Metro Manila', 'Makati City', 'BGC', 'Quezon City', 'Mandaluyong', 'Pasig', 'Cebu City', 'Davao City', 'Lapulapu', 'Manila']
  const bathOptions = ['1', '2', '3', '4+']
  const bedOptions = ['1', '2', '3', '4+']

  // Fetch all properties for accurate category counts
  useEffect(() => {
    const fetchAllPropertiesForCount = async () => {
      try {
        // Fetch a large number of properties for accurate counting
        // Using per_page to get as many as possible
        const response = await propertiesApi.getAll({ per_page: 1000 })
        
        // The API might return paginated response or array
        if (Array.isArray(response)) {
          setAllPropertiesForCount(response)
        } else {
          // If it's a paginated response, extract the data
          const paginatedResponse = response as any
          if (paginatedResponse && 'data' in paginatedResponse) {
            setAllPropertiesForCount(paginatedResponse.data || [])
          } else {
            setAllPropertiesForCount([])
          }
        }
      } catch (err) {
        console.error('Error fetching properties for count:', err)
        // Fallback to empty array
        setAllPropertiesForCount([])
      }
    }

    fetchAllPropertiesForCount()
  }, [])

  const topSearches = [
    'Condominium For Rent In Cebu',
    'House & Lot For Rent In Lapulapu',
    'Studio For Rent In Makati',
    'Pet Friendly Unit In Manila'
  ]

  // Helper function to format price
  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString('en-US')}`
  }

  // Helper function to format price type
  const formatPriceType = (priceType: string | null | undefined): string | undefined => {
    if (!priceType) return undefined
    // Capitalize first letter and make rest lowercase for consistency
    return priceType.charAt(0).toUpperCase() + priceType.slice(1).toLowerCase()
  }

  // Helper function to format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Date not available'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Helper function to get rent manager role
  const getRentManagerRole = (isOfficial: boolean | undefined): string => {
    return isOfficial ? 'Rent Manager' : 'Property Specialist'
  }

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      // Determine if we're loading more (page > 1 for both modes)
      const isAppending = currentPage > 1
      
      if (!isAppending) {
        setLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)
      
      try {
        const params: {
          type?: string
          location?: string
          search?: string
          page?: number
        } = {
          page: currentPage,
        }

        // Add filters to API params
        if (selectedType && selectedType !== 'All Types') {
          params.type = selectedType
        }
        if (selectedLocation) {
          params.location = selectedLocation
        }
        if (searchQuery) {
          params.search = searchQuery
        }

        const response = await propertiesApi.getAll(params)
        
        // Handle paginated response
        if (response && typeof response === 'object' && 'data' in response) {
          const paginatedResponse = response as any
          const newProperties = paginatedResponse.data || []
          
          if (isAppending) {
            setProperties(prev => [...prev, ...newProperties])
          } else {
            setProperties(newProperties)
          }
          
          setTotalPages(paginatedResponse.last_page || 1)
          setTotalProperties(paginatedResponse.total || 0)
          setHasMore(currentPage < (paginatedResponse.last_page || 1))
        } else {
          // Handle array response
          const newProperties = Array.isArray(response) ? response : []
          if (isAppending) {
            setProperties(prev => [...prev, ...newProperties])
          } else {
            setProperties(newProperties)
          }
          setTotalPages(1)
          setTotalProperties(newProperties.length)
          setHasMore(false)
        }
      } catch (err: any) {
        console.error('Error fetching properties:', err)
        setError(err.message || 'Failed to load properties. Please try again later.')
        if (!isAppending) {
          setProperties([])
        }
      } finally {
        setLoading(false)
        setIsLoadingMore(false)
      }
    }

    fetchProperties()
  }, [selectedLocation, selectedType, searchQuery, currentPage, viewMode])

  // Client-side filtering for additional filters (bathrooms, bedrooms, price range)
  // Note: These filters could also be moved to the backend API for better performance
  const filteredProperties = properties.filter(property => {
    const bathMatch = !minBaths || property.bathrooms >= parseInt(minBaths)
    const bedMatch = !minBeds || property.bedrooms >= parseInt(minBeds)

    let priceMatch = true
    if (priceMin || priceMax) {
      const price = property.price
      if (priceMin) priceMatch = priceMatch && price >= parseInt(priceMin)
      if (priceMax) priceMatch = priceMatch && price <= parseInt(priceMax)
    }

    // Amenities filter: property must include all selected amenities
    const amenitiesMatch =
      selectedAmenities.length === 0 ||
      (property.amenities && selectedAmenities.every(selected =>
        property.amenities!.some(a => a && a.toLowerCase() === selected.toLowerCase())
      ))

    return bathMatch && bedMatch && priceMatch && amenitiesMatch
  })

  // Dynamically compute available amenities from currently filtered properties
  const availableAmenities = useMemo(() => {
    const amenitySet = new Set<string>()
    filteredProperties.forEach(property => {
      property.amenities?.forEach(rawAmenity => {
        const amenity = rawAmenity?.trim()
        if (amenity) {
          amenitySet.add(amenity)
        }
      })
    })
    return Array.from(amenitySet).sort((a, b) => a.localeCompare(b))
  }, [filteredProperties])

  // Calculate categories dynamically from all properties with filters applied
  // Use allPropertiesForCount which has all properties, then apply current filters
  // In map view, only count properties with valid coordinates
  const categories = useMemo(() => {
    // Get all property types except "All Types"
    const typesToCount = propertyTypes.filter(type => type !== 'All Types')
    
    // Start with all properties and apply the same filters as the main query
    let filtered = [...allPropertiesForCount]
    
    // Apply API-level filters (type, location, search) - same as what's sent to API
    if (selectedType && selectedType !== 'All Types') {
      filtered = filtered.filter(property => property.type === selectedType)
    }
    if (selectedLocation) {
      filtered = filtered.filter(property => {
        const location = property.location?.toLowerCase() || ''
        const city = property.city?.toLowerCase() || ''
        const state = property.state_province?.toLowerCase() || ''
        const searchLocation = selectedLocation.toLowerCase()
        return location.includes(searchLocation) || 
               city.includes(searchLocation) || 
               state.includes(searchLocation)
      })
    }
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      filtered = filtered.filter(property => {
        const title = property.title?.toLowerCase() || ''
        const description = property.description?.toLowerCase() || ''
        return title.includes(search) || description.includes(search)
      })
    }
    
    // Apply client-side filters (bathrooms, bedrooms, price, amenities)
    filtered = filtered.filter(property => {
      const bathMatch = !minBaths || property.bathrooms >= parseInt(minBaths)
      const bedMatch = !minBeds || property.bedrooms >= parseInt(minBeds)

      let priceMatch = true
      if (priceMin || priceMax) {
        const price = property.price
        if (priceMin) priceMatch = priceMatch && price >= parseInt(priceMin)
        if (priceMax) priceMatch = priceMatch && price <= parseInt(priceMax)
      }

      const amenitiesMatch =
        selectedAmenities.length === 0 ||
        (property.amenities && selectedAmenities.every(selected =>
          property.amenities!.some(a => a && a.toLowerCase() === selected.toLowerCase())
        ))

      return bathMatch && bedMatch && priceMatch && amenitiesMatch
    })
    
    // Count by type - use actual property types from database, not predefined list
    // First, get all unique property types from filtered properties
    const actualTypes = [...new Set(filtered.map(p => p.type).filter(Boolean))]
    
    // Count each actual type
    return actualTypes.map(type => {
      const count = filtered.filter(property => property.type === type).length
      return { name: type, count }
    }).filter(category => category.count > 0) // Only show categories with properties
      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
  }, [allPropertiesForCount, propertyTypes, viewMode, selectedType, selectedLocation, searchQuery, minBaths, minBeds, priceMin, priceMax])

  // Filter by subcategory first
  const subCategoryFiltered = filteredProperties.filter(property => {
    if (subCategory === 'all') return true
    if (subCategory === 'featured') {
      // Featured: properties published in the last 7 days with verified agents
      const isRecent = property.published_at ? 
        (Date.now() - new Date(property.published_at).getTime()) <= 7 * 24 * 60 * 60 * 1000 : false
      const isVerified = property.agent?.verified || property.rent_manager?.is_official
      return isRecent && isVerified
    }
    if (subCategory === 'top') {
      // Top rated - for future use, currently show all
      return true
    }
    if (subCategory === 'most-viewed') {
      // Most viewed - for future use, currently show all
      return true
    }
    return true
  })

  // When showing AI chat results, use them as the source; otherwise use filtered list
  const listSource = chatResults !== null ? chatResults : subCategoryFiltered

  // Client-side sorting
  const sortedProperties = [...listSource].sort((a, b) => {
    // Price sorting takes priority if selected
    if (sortByPrice === 'price-low') {
      return a.price - b.price
    } else if (sortByPrice === 'price-high') {
      return b.price - a.price
    }
    
    // Relevance/Date sorting
    if (sortBy === 'newest') {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
      return dateB - dateA
    } else if (sortBy === 'oldest') {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
      return dateA - dateB
    }
    return 0
  })

  // Properties ready for display (infinite scroll loads more as user scrolls)
  const paginatedProperties = sortedProperties

  // Reset to page 1 when filters change (that trigger API calls); clear chat results so list reflects filters
  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    setProperties([])
    setChatResults(null)
  }, [selectedLocation, selectedType, searchQuery])

  // Reset when switching view modes (to start infinite scroll from beginning)
  const prevViewMode = useRef(viewMode)
  useEffect(() => {
    if (prevViewMode.current !== viewMode) {
      setCurrentPage(1)
      setHasMore(true)
      setProperties([])
    }
    prevViewMode.current = viewMode
  }, [viewMode])

  // Close advance search on Escape
  useEffect(() => {
    if (!isSidebarOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isSidebarOpen])

  // Infinite scroll for both horizontal and vertical modes
  useEffect(() => {
    if (!hasMore || isLoadingMore || loading) return

    let timeoutId: NodeJS.Timeout
    const handleScroll = () => {
      // Debounce scroll events
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const windowHeight = window.innerHeight
        const documentHeight = document.documentElement.scrollHeight

        // Load more when user is 300px from bottom
        if (scrollTop + windowHeight >= documentHeight - 300) {
          if (currentPage < totalPages && hasMore) {
            setCurrentPage(prev => prev + 1)
          }
        }
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeoutId)
    }
  }, [hasMore, isLoadingMore, loading, currentPage, totalPages])

  // (Sticky search behavior removed – top search bar now handles its own positioning)

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedLocation) count++
    if (selectedType && selectedType !== 'All Types') count++
    if (minBaths) count++
    if (minBeds) count++
    if (priceMin) count++
    if (priceMax) count++
    return count
  }, [selectedLocation, selectedType, minBaths, minBeds, priceMin, priceMax])

  // Clear all filters and return to normal list (clears chat results if showing)
  const clearAllFilters = () => {
    setSelectedLocation('')
    setSelectedType('All Types')
    setMinBaths('')
    setMinBeds('')
    setPriceMin('')
    setPriceMax('')
    setSearchQuery('')
    setAppliedFilters(false)
    setCurrentPage(1)
    setChatResults(null)
  }

  const clearChatResults = () => {
    setChatResults(null)
  }

  // Apply filters (for desktop sidebar)
  const applyFilters = () => {
    setAppliedFilters(true)
    setCurrentPage(1)
  }

  // Remove individual filter
  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case 'location':
        setSelectedLocation('')
        break
      case 'type':
        setSelectedType('All Types')
        break
      case 'minBaths':
        setMinBaths('')
        break
      case 'minBeds':
        setMinBeds('')
        break
      case 'priceMin':
        setPriceMin('')
        break
      case 'priceMax':
        setPriceMax('')
        break
      case 'search':
        setSearchQuery('')
        break
    }
    setCurrentPage(1)
  }

  // Calculate results range
  const resultsStart = (currentPage - 1) * itemsPerPage + 1
  const resultsEnd = Math.min(currentPage * itemsPerPage, paginatedProperties.length)
  const totalFiltered = paginatedProperties.length

  return (
    <div className="properties-for-rent-page flex flex-col min-h-screen">
      {/* Search Filters: Mobile sidebar (right side) */}
      <aside
        className={`fixed top-0 right-0 h-screen h-[100dvh] w-[320px] sm:w-[360px] shadow-2xl z-[50] overflow-y-auto transition-transform duration-300 ease-in-out flex flex-col bg-white ${!isSidebarOpen ? 'pointer-events-none' : ''}`}
        style={{ transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)' }}
        onClick={(e) => e.stopPropagation()}
        aria-hidden={!isSidebarOpen}
        aria-label="Search Filters"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 bg-gray-800 border-b border-gray-700">
          <svg className="w-6 h-6 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <circle cx="4" cy="6" r="2" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <circle cx="4" cy="12" r="2" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="18" r="2" />
          </svg>
          <h2 className="text-white font-outfit text-base font-medium flex-1">Search Filters</h2>
          <button type="button" className="p-2 rounded-lg hover:bg-gray-700 text-white transition-colors" onClick={() => setIsSidebarOpen(false)} aria-label="Close filters">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6L18 18" /></svg>
          </button>
        </div>
        
        {/* Filter Content */}
        <div className="flex flex-col flex-1 py-4 px-4 overflow-y-auto bg-white">
          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Search</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Keywords"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* City and Type - Side by side */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">City</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                value={selectedLocation || 'All Cities'}
                onChange={(e) => setSelectedLocation(e.target.value === 'All Cities' ? '' : e.target.value)}
              >
                <option value="All Cities">All Cities</option>
                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Type</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          {/* Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Area</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Area Size"
              value={areaSize}
              onChange={(e) => setAreaSize(e.target.value)}
            />
          </div>

          {/* Beds and Baths - Side by side */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Beds</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                value={minBeds || '1'}
                onChange={(e) => setMinBeds(e.target.value === '1' ? '' : e.target.value)}
              >
                <option value="1">1</option>
                {bedOptions.filter(b => b !== '1').map(bed => <option key={bed} value={bed}>{bed}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Baths</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                value={minBaths || '1'}
                onChange={(e) => setMinBaths(e.target.value === '1' ? '' : e.target.value)}
              >
                <option value="1">1</option>
                {bathOptions.filter(b => b !== '1').map(bath => <option key={bath} value={bath}>{bath}</option>)}
              </select>
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Price</label>
            <div className="relative">
              <input
                type="range"
                min={0}
                max={200000}
                step={1000}
                value={Number(priceMin) || 0}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                style={{ background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((Number(priceMin) || 0) / 200000) * 100}%, #E5E7EB ${((Number(priceMin) || 0) / 200000) * 100}%, #E5E7EB 100%)` }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">${Number(priceMin) || 0}</span>
                <span className="text-xs text-gray-500">${Number(priceMax) || 200000}</span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Amenities</label>
            <div className="grid grid-cols-2 gap-2">
              {availableAmenities.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAmenities([...selectedAmenities, amenity])
                      } else {
                        setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              Search
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
              onClick={() => {
                clearAllFilters()
                setAreaSize('')
                setSelectedAmenities([])
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Reset Filters
            </button>
          </div>
        </div>
      </aside>

      {/* Content wrapper */}
      <div className="flex flex-col flex-1 min-w-0">

      {/* Hero Section with Map */}
      <section className="w-full h-[400px] sm:h-[450px] md:h-[500px] relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <PublicPropertiesMap
            ref={mapRef}
            properties={paginatedProperties.length > 0 ? paginatedProperties : properties}
          />
        </div>
        {/* Properties scroll container on the right */}
        <div className="absolute top-4 right-4 bottom-4 z-[100] w-full max-w-[320px] sm:max-w-[360px] hidden md:flex flex-col rounded-xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: 'rgba(31, 41, 55, 0.95)', backdropFilter: 'blur(10px)' }}
        >
          <div className="flex-shrink-0 px-4 py-3 border-b border-white/20 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                PROPERTIES ON MAP
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                {paginatedProperties.length > 0 ? paginatedProperties.length : properties.length} Listing{paginatedProperties.length !== 1 && properties.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {}}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {(paginatedProperties.length > 0 ? paginatedProperties : properties).map((prop) => {
              const mainImg = prop.image_url || prop.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
              const locationLine = [prop.street_address, prop.city, prop.state_province].filter(Boolean).join(', ') || prop.location || prop.city || '—'
              return (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => mapRef.current?.flyToProperty(prop)}
                  className="w-full text-left rounded-lg overflow-hidden flex gap-3 p-3 transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 bg-white/5"
                >
                  <div
                    className="flex-shrink-0 w-20 h-20 rounded-md bg-gray-700 bg-cover bg-center"
                    style={{ backgroundImage: `url(${mainImg})` }}
                  />
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="text-sm font-medium text-white line-clamp-2 mb-1">
                      {prop.title}
                    </p>
                    <p className="text-xs text-white/70 truncate mb-1">
                      {locationLine}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatPrice(prop.price)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <main className="properties-main-layout flex flex-col lg:flex-row gap-4 sm:gap-6 px-4 sm:px-6 md:px-10 lg:px-[150px] pb-4 sm:py-2 pt-6 sm:pt-8 max-w-[1920px] relative z-10">
        
        {/* Desktop Filters Sidebar - Left side */}
        <div className="properties-sidebar w-full lg:w-[320px] flex-shrink-0 hidden lg:block lg:order-1">
          <div className="flex items-center gap-3 px-4 py-4 rounded-t-lg border-b border-gray-200 bg-white">
              <svg className="w-6 h-6 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <circle cx="4" cy="6" r="2" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <circle cx="4" cy="12" r="2" />
                <line x1="4" y1="18" x2="20" y2="18" />
                <circle cx="4" cy="18" r="2" />
              </svg>
              <h2 className="text-gray-900 font-outfit text-base font-medium flex-1">Search Filters</h2>
            </div>
          <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
            {/* Header */}
            
            
            {/* Filter Content */}
            <div className="p-4">
              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Search</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Keywords"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* City and Type - Side by side */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">City</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                    value={selectedLocation || 'All Cities'}
                    onChange={(e) => setSelectedLocation(e.target.value === 'All Cities' ? '' : e.target.value)}
                  >
                    <option value="All Cities">All Cities</option>
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Type</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              {/* Area */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Area</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Area Size"
                  value={areaSize}
                  onChange={(e) => setAreaSize(e.target.value)}
                />
              </div>

              {/* Beds and Baths - Side by side */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Beds</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                    value={minBeds || '1'}
                    onChange={(e) => setMinBeds(e.target.value === '1' ? '' : e.target.value)}
                  >
                    <option value="1">1</option>
                    {bedOptions.filter(b => b !== '1').map(bed => <option key={bed} value={bed}>{bed}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Baths</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                    value={minBaths || '1'}
                    onChange={(e) => setMinBaths(e.target.value === '1' ? '' : e.target.value)}
                  >
                    <option value="1">1</option>
                    {bathOptions.filter(b => b !== '1').map(bath => <option key={bath} value={bath}>{bath}</option>)}
                  </select>
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Price</label>
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={200000}
                    step={1000}
                    value={Number(priceMin) || 0}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    style={{ background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((Number(priceMin) || 0) / 200000) * 100}%, #E5E7EB ${((Number(priceMin) || 0) / 200000) * 100}%, #E5E7EB 100%)` }}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">{formatPrice(Number(priceMin) || 0)}</span>
                    <span className="text-xs text-gray-500">{formatPrice(Number(priceMax) || 200000)}</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">Amenities</label>
                <div className="grid grid-cols-2 gap-2">
              {availableAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAmenities([...selectedAmenities, amenity])
                          } else {
                            setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    clearAllFilters()
                    setAreaSize('')
                    setSelectedAmenities([])
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
          
          {/* Desktop Back to Filters Button */}
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="hidden sticky top-5 lg:block w-full bg-blue-600 text-white px-4 py-3 flex items-center justify-center gap-2 font-medium text-sm hover:bg-blue-700 transition-colors shadow-lg mt-4 rounded-lg"
            aria-label="Back to Filters"
          >
            <span>Back to Filters</span>
            <svg className="w-5 h-5 relative top-1 left-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
        </div>
        
        <div className="properties-main-content flex-1 min-w-0 lg:order-2">
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y="6" />
                <circle cx="4" cy="6" r="2" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <circle cx="4" cy="12" r="2" />
                <line x1="4" y1="18" x2="20" y2="18" />
                <circle cx="4" cy="18" r="2" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {/* Sort and View Mode Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-outfit hidden xs:inline">Sort by</span>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                value={sortByPrice || sortBy}
                onChange={(e) => {
                  if (e.target.value === 'newest' || e.target.value === 'oldest') {
                    setSortBy(e.target.value)
                    setSortByPrice('')
                  } else {
                    setSortByPrice(e.target.value)
                    setSortBy('newest')
                  }
                }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <div className="flex rounded-lg border border-gray-200 p-1 bg-white">
                <button
                  className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'vertical' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600'}`}
                  onClick={() => setViewMode('vertical')}
                  aria-label="Grid view"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="5" height="5" rx="1"/>
                    <rect x="9" y="2" width="5" height="5" rx="1"/>
                    <rect x="2" y="9" width="5" height="5" rx="1"/>
                    <rect x="9" y="9" width="5" height="5" rx="1"/>
                  </svg>
                </button>
                <button
                  className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'horizontal' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600'}`}
                  onClick={() => setViewMode('horizontal')}
                  aria-label="List view"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="4" x2="14" y2="4"/>
                    <line x1="2" y1="8" x2="14" y2="8"/>
                    <line x1="2" y1="12" x2="14" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Banner when showing AI chat results */}
          {chatResults !== null && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rental-blue-200 bg-gradient-to-r from-rental-blue-50 to-white px-4 py-3">
              <p className="font-outfit text-sm text-gray-700">
                <span className="font-semibold text-rental-blue-700">Showing results from Rentals Assist</span>
                {' '}({chatResults.length} propert{chatResults.length === 1 ? 'y' : 'ies'})
              </p>
              <button
                type="button"
                onClick={clearChatResults}
                className="font-outfit text-sm font-medium text-rental-blue-600 hover:text-rental-blue-700 underline focus:outline-none focus:ring-2 focus:ring-rental-blue-500 rounded px-1"
              >
                Show all properties
              </button>
            </div>
          )}

          {/* Results Count, Categories, and Active Filters */}
          {!loading && paginatedProperties.length > 0 && (
            <div className="results-header mb-4 sm:mb-6">
              <div className="results-header-top flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                {/* Results for location */}
                <div className="results-count text-sm sm:text-base font-outfit">
                  <span className="text-gray-600">Results for : </span>
                  <span className="text-blue-600 font-medium">{selectedLocation || 'All Locations'}</span>
                </div>
                {/* Desktop Sort and View Controls */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-outfit hidden sm:inline">Sort by</span>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23205ED7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                    value={sortByPrice || sortBy}
                    onChange={(e) => {
                      if (e.target.value === 'newest' || e.target.value === 'oldest') {
                        setSortBy(e.target.value)
                        setSortByPrice('')
                      } else {
                        setSortByPrice(e.target.value)
                        setSortBy('newest')
                      }
                    }}
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <div className="flex rounded-lg border border-gray-200 p-1 bg-white">
                    <button
                      className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'vertical' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600'}`}
                      onClick={() => setViewMode('vertical')}
                      aria-label="Grid view"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="5" height="5" rx="1"/>
                        <rect x="9" y="2" width="5" height="5" rx="1"/>
                        <rect x="2" y="9" width="5" height="5" rx="1"/>
                        <rect x="9" y="9" width="5" height="5" rx="1"/>
                      </svg>
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'horizontal' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-600'}`}
                      onClick={() => setViewMode('horizontal')}
                      aria-label="List view"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="2" y1="4" x2="14" y2="4"/>
                        <line x1="2" y1="8" x2="14" y2="8"/>
                        <line x1="2" y1="12" x2="14" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Subcategory buttons hidden for now */}
                {false && (
                  <div className="subcategory-row flex items-center gap-2 flex-wrap rounded-lg border border-gray-200" role="group" aria-label="Filter by category">
                    <button
                      className={`subcategory-chip px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        subCategory === 'all' 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSubCategory('all')
                        setCurrentPage(1)
                      }}
                    >
                      All
                    </button>
                    <button
                      className={`subcategory-chip px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        subCategory === 'featured' 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSubCategory('featured')
                        setCurrentPage(1)
                      }}
                    >
                      Featured
                    </button>
                    <button
                      className={`subcategory-chip px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        subCategory === 'top' 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSubCategory('top')
                        setCurrentPage(1)
                      }}
                    >
                      Top
                    </button>
                    <button
                      className={`subcategory-chip px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        subCategory === 'most-viewed' 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSubCategory('most-viewed')
                        setCurrentPage(1)
                      }}
                    >
                      Most Viewed
                    </button>
                  </div>
                )}
                {activeFilterCount > 0 && (
                  <div className="active-filters flex items-center gap-2 flex-wrap w-full mt-2">
                    {selectedLocation && (
                      <span className="filter-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                        Location: {selectedLocation}
                        <button 
                          onClick={() => removeFilter('location')} 
                          aria-label="Remove location filter"
                          className="hover:text-blue-900 font-semibold"
                        >×</button>
                      </span>
                    )}
                    {selectedType && selectedType !== 'All Types' && (
                      <span className="filter-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                        Type: {selectedType}
                        <button 
                          onClick={() => removeFilter('type')} 
                          aria-label="Remove type filter"
                          className="hover:text-blue-900 font-semibold"
                        >×</button>
                      </span>
                    )}
                    {minBaths && (
                      <span className="filter-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                        Min Baths: {minBaths}+
                        <button 
                          onClick={() => removeFilter('minBaths')} 
                          aria-label="Remove baths filter"
                          className="hover:text-blue-900 font-semibold"
                        >×</button>
                      </span>
                    )}
                    {minBeds && (
                      <span className="filter-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                        Min Beds: {minBeds}+
                        <button 
                          onClick={() => removeFilter('minBeds')} 
                          aria-label="Remove beds filter"
                          className="hover:text-blue-900 font-semibold"
                        >×</button>
                      </span>
                    )}
                    {priceMin && (
                      <span className="filter-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                        Min Price: ₱{(Number(priceMin) || 0).toLocaleString('en-US')}
                        <button 
                          onClick={() => removeFilter('priceMin')} 
                          aria-label="Remove min price filter"
                          className="hover:text-blue-900 font-semibold"
                        >×</button>
                      </span>
                    )}
                    {priceMax && (
                      <span className="filter-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                        Max Price: ₱{(Number(priceMax) || 0).toLocaleString('en-US')}
                        <button 
                          onClick={() => removeFilter('priceMax')} 
                          aria-label="Remove max price filter"
                          className="hover:text-blue-900 font-semibold"
                        >×</button>
                      </span>
                    )}
                    {searchQuery && (
                      <span className="filter-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                        Search: {searchQuery}
                        <button 
                          onClick={() => removeFilter('search')} 
                          aria-label="Remove search filter"
                          className="hover:text-blue-900 font-semibold"
                        >×</button>
                      </span>
                    )}
                    <button 
                      className="clear-filters-link px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium underline" 
                      onClick={clearAllFilters}
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
              {/* Categories row hidden for now */}
              {false && (
                <div className="categories-row flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 flex-wrap sm:flex-nowrap scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      className={`category-chip flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 text-gray-700 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        selectedType === category.name 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600' 
                          : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedType(category.name)
                        setCurrentPage(1)
                      }}
                    >
                      {category.name} ({category.count})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="properties-content-wrapper">
            {loading ? (
              <div className={viewMode === 'horizontal'
                ? 'properties-list flex flex-col gap-4 sm:gap-6'
                : 'properties-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6'}>
                {Array.from({ length: viewMode === 'horizontal' ? 4 : 8 }).map((_, i) =>
                  viewMode === 'horizontal' ? (
                    <HorizontalPropertyCardSkeleton key={i} />
                  ) : (
                    <div key={i} className="w-full min-w-0 [&>article]:w-full [&>article]:min-w-0 [&>article]:max-w-full [&>article]:h-full">
                      <VerticalPropertyCardSkeleton />
                    </div>
                  )
                )}
              </div>
            ) : error ? (
              <EmptyState
                variant="error"
                title="Error loading properties"
                description={error}
                action={
                  <EmptyStateAction href="/properties" primary>
                    Try again
                  </EmptyStateAction>
                }
              />
            ) : paginatedProperties.length > 0 ? (
              <>
                    <div className={viewMode === 'horizontal' 
                      ? 'properties-list flex flex-col gap-4 sm:gap-6' 
                      : 'properties-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6'}>
                      {paginatedProperties.map(property => {
                        const propertySize = property.area 
                          ? `${property.area} sqft` 
                          : `${(property.bedrooms * 15 + property.bathrooms * 5)} sqft`
                        
                        const mainImage = property.image_url || property.image || ASSETS.PLACEHOLDER_PROPERTY_MAIN
                        const agentImage = property.agent
                          ? resolveAgentAvatar(
                              property.agent.id.toString()
                            )
                          : undefined

                        // Prefer created_at for "date listed", fallback to published_at
                        const listedDate = formatDate(property.created_at || property.published_at)

                        const cardProps = {
                          id: property.id,
                          propertyType: property.type,
                          date: listedDate,
                          dateListed: listedDate,
                          priceType: formatPriceType(property.price_type),
                          price: formatPrice(property.price),
                          title: property.title,
                          image: mainImage,
                          images: (property.images_url && property.images_url.length > 0)
                            ? [mainImage, ...(property.images_url || []).filter((u): u is string => !!u && u !== mainImage)]
                            : undefined,
                          rentManagerName: property.agent?.first_name && property.agent?.last_name
                            ? `${property.agent.first_name} ${property.agent.last_name}`
                            : property.agent?.full_name
                            || property.rent_manager?.name
                            || 'Rental.Ph Official',
                          rentManagerRole: property.agent
                            ? getRentManagerRole(property.agent.verified)
                            : getRentManagerRole(property.rent_manager?.is_official),
                          rentManagerImage: agentImage,
                          bedrooms: property.bedrooms,
                          bathrooms: property.bathrooms,
                          parking: 0, // Parking not in backend model, defaulting to 0
                          propertySize,
                          location: property.location,
                          city: property.city,
                          streetAddress: property.street_address,
                          stateProvince: property.state_province,
                        }

                        return viewMode === 'horizontal' ? (
                          <div key={property.id} className="w-full min-w-0 [&>article]:w-full [&>article]:min-w-0 [&>article]:max-w-full">
                            <HorizontalPropertyCard {...cardProps} />
                          </div>
                        ) : (
                          <div key={property.id} className="w-full min-w-0 [&>article]:w-full [&>article]:min-w-0 [&>article]:max-w-full [&>article]:h-full">
                            <VerticalPropertyCard {...cardProps} />
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Loading indicator for infinite scroll - both modes */}
                    {isLoadingMore && (
                      <div className="loading-more-indicator">
                        <p>Loading more properties...</p>
                      </div>
                    )}
                  </>
            ) : (
              <EmptyState
                variant="empty"
                title="No properties found"
                description="Try adjusting your filters, location, or search terms to see more listings."
                action={
                  <>
                    <EmptyStateAction href="/properties" primary={false}>
                      View all properties
                    </EmptyStateAction>
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base bg-rental-orange-500 text-white shadow-lg shadow-rental-orange-500/25 hover:bg-rental-orange-600 transition-all active:scale-[0.98]"
                    >
                      Adjust filters
                    </button>
                  </>
                }
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Mobile Sticky Back to Filters Button */}
      <button
        type="button"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setIsSidebarOpen(true)
        }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-blue-600 text-white px-4 py-3 flex items-center justify-center gap-2 font-medium text-sm hover:bg-blue-700 transition-colors shadow-lg"
        aria-label="Back to Filters"
      >
        <span>Back to Filters</span>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
      
      <PopularSearches />
      <Footer />

      <FloatingPropertyChat onPropertiesResult={setChatResults} />
      </div>
    </div>
  )
}

export default function PropertiesForRentPage() {
  return (
    <Suspense fallback={
      <div className="properties-for-rent-page">
        <PageHeader title="Properties for Rent" />
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        <Footer />
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  )
}

