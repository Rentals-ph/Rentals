'use client'

import { useState, useEffect, Suspense, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import VerticalPropertyCard from '../../components/common/VerticalPropertyCard'
import HorizontalPropertyCard from '../../components/common/HorizontalPropertyCard'
import PublicPropertiesMap from '../../components/common/PublicPropertiesMap'
// import './page.css' // Removed - converted to Tailwind
import PageHeader from '../../components/layout/PageHeader'
import { propertiesApi } from '../../api/endpoints/properties'
import type { Property } from '../../types'
import { ASSETS } from '@/utils/assets'
import { resolveAgentAvatar } from '@/utils/imageResolver'
import PopularSearches from '@/components/home/PopularSearches'

function PropertiesContent() {
  const searchParams = useSearchParams()
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedType, setSelectedType] = useState('All Types')
  const [minBaths, setMinBaths] = useState('')
  const [minBeds, setMinBeds] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [sortByPrice, setSortByPrice] = useState('')
  const [subCategory, setSubCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical' | 'map'>('vertical')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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
    return `₱${price.toLocaleString('en-US')}/Monthly`
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

    return bathMatch && bedMatch && priceMatch
  })

  // Calculate categories dynamically from all properties with filters applied
  // Use allPropertiesForCount which has all properties, then apply current filters
  // In map view, only count properties with valid coordinates
  const categories = useMemo(() => {
    // Get all property types except "All Types"
    const typesToCount = propertyTypes.filter(type => type !== 'All Types')
    
    // Start with all properties and apply the same filters as the main query
    let filtered = [...allPropertiesForCount]
    
    // In map view, only include properties with valid coordinates
    if (viewMode === 'map') {
      filtered = filtered.filter(property => {
        return property.latitude && property.longitude && 
               !isNaN(parseFloat(property.latitude)) && 
               !isNaN(parseFloat(property.longitude))
      })
    }
    
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
    
    // Apply client-side filters (bathrooms, bedrooms, price)
    filtered = filtered.filter(property => {
      const bathMatch = !minBaths || property.bathrooms >= parseInt(minBaths)
      const bedMatch = !minBeds || property.bedrooms >= parseInt(minBeds)

      let priceMatch = true
      if (priceMin || priceMax) {
        const price = property.price
        if (priceMin) priceMatch = priceMatch && price >= parseInt(priceMin)
        if (priceMax) priceMatch = priceMatch && price <= parseInt(priceMax)
      }

      return bathMatch && bedMatch && priceMatch
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

  // Client-side sorting
  const sortedProperties = [...subCategoryFiltered].sort((a, b) => {
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

  // Reset to page 1 when filters change (that trigger API calls)
  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
    setProperties([])
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

  // Clear all filters
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
    <div className="properties-for-rent-page">
      <Navbar />
      
        <div className="top-search-bar-container sticky top-0 z-30 bg-white p-3 sm:pt-5 px-4 sm:px-6 md:px-10 lg:px-[150px]">
             <div className="top-search-bar flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full border-b border-gray-200 pb-3 sm:pb-5"
             style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#E5E7EB'}}
             >
              <div className="search-input-container flex-1 w-full sm:min-w-[200px] relative">
                <svg className="search-icon absolute left-3 sm:left-4 top-3 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 pointer-events-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  className="main-search-input w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="top-search-bar-controls h-full flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <select
                  className="sort-dropdown-btn sort-by-relevance px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none min-w-0 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10"
                  style={{ 
                    paddingRight: '2.5rem',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.75rem center'
                  }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <select
                  className="sort-dropdown-btn sort-by-price px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs sm:text-sm font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none min-w-0 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10"
                  style={{ 
                    paddingRight: '2.5rem',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.75rem center'
                  }}
                  value={sortByPrice}
                  onChange={(e) => setSortByPrice(e.target.value)}
                >
                  <option value="">Sort by Price</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <div className="rounded-lg"
                style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#E5E7EB' }}>
                <button
                  className={`hamburger-menu-btn px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none ${
                    viewMode === 'horizontal' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label="List View"
                  onClick={() => setViewMode('horizontal')}
                >
                  <span className="hidden sm:inline">List view</span>
                  <span className="sm:hidden">List</span>
                </button>
                <button
                  className={`grid-view-btn px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none ${
                    viewMode === 'vertical' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label="Grid View"
                  onClick={() => setViewMode('vertical')}
                >
                  <span className="hidden sm:inline">Grid view</span>
                  <span className="sm:hidden">Grid</span>
                </button>
                <button
                  className={`map-view-btn px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none ${
                    viewMode === 'map' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label="Map View"
                  onClick={() => setViewMode('map')}
                >
                  <span className="hidden sm:inline">Map view</span>
                  <span className="sm:hidden">Map</span>
                </button>
                </div>
                <button
                  className="filter-toggle-btn px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-all duration-200 md:hidden w-full sm:w-auto"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  aria-label="Toggle filters"
                >
                  Filters
                </button>
              </div>
            </div>
          </div>

      {/* (Secondary sticky search bar removed – top search bar is now sticky instead) */}
      <main className="properties-main-layout flex flex-col lg:flex-row gap-4 sm:gap-6 mx-auto px-4 sm:px-6 md:px-10 lg:px-[150px] pb-4 sm:py-6 max-w-[1920px]">
        {/* Dropdown Filter Menu - Mobile */}
        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className={`fixed top-0 left-0 h-full w-full max-w-sm bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="flex items-center justify-end p-4 sm:p-6 border-b border-gray-200">
    
                <button 
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Close filters"
                >
                  <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-y-auto h-[calc(100%-80px)] p-4 sm:p-6">
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-gray-900 font-outfit mb-4">Advance Search</h2>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <select
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10"
                      style={{ 
                        paddingRight: '2.5rem',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center'
                      }}
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <option value="">Location</option>
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Property Type</label>
                    <select
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10"
                      style={{ 
                        paddingRight: '2.5rem',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center'
                      }}
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      {propertyTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Min. Baths</label>
                    <select
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10"
                      style={{ 
                        paddingRight: '2.5rem',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center'
                      }}
                      value={minBaths}
                      onChange={(e) => setMinBaths(e.target.value)}
                    >
                      <option value="">Min. Baths</option>
                      {bathOptions.map(bath => (
                        <option key={bath} value={bath}>{bath}+</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Min. Beds</label>
                    <select
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10"
                      style={{ 
                        paddingRight: '2.5rem',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center'
                      }}
                      value={minBeds}
                      onChange={(e) => setMinBeds(e.target.value)}
                    >
                      <option value="">Min. Beds</option>
                      {bedOptions.map(bed => (
                        <option key={bed} value={bed}>{bed}+</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Price Range</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="number"
                          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Min"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                          min="0"
                        />
                        <span className="text-sm text-gray-500 font-medium flex-shrink-0 whitespace-nowrap">To</span>
                        <input
                          type="number"
                          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Max"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="1000"
                          value={priceMin || 0}
                          onChange={(e) => setPriceMin(e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          aria-label="Minimum price"
                        />
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="1000"
                          value={priceMax || 200000}
                          onChange={(e) => setPriceMax(e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          aria-label="Maximum price"
                        />
                      </div>
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      className="w-full mt-4 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        clearAllFilters()
                        setIsSidebarOpen(false)
                      }}
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Desktop Floating Filter Panel */}
        {isSidebarOpen && (
          <div className="hidden md:block fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)}>
            <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 font-outfit">Advance Search</h2>
                <button 
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Close filters"
                >
                  <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-y-auto h-[calc(100%-80px)] p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10"
                      style={{ 
                        paddingRight: '2.5rem',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center'
                      }}
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <option value="">Location</option>
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Property Type</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10"
                      style={{ 
                        paddingRight: '2.5rem',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center'
                      }}
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      {propertyTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Min. Baths</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10"
                      style={{ 
                        paddingRight: '2.5rem',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center'
                      }}
                      value={minBaths}
                      onChange={(e) => setMinBaths(e.target.value)}
                    >
                      <option value="">Min. Baths</option>
                      {bathOptions.map(bath => (
                        <option key={bath} value={bath}>{bath}+</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Min. Beds</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10"
                      style={{ 
                        paddingRight: '2.5rem',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center'
                      }}
                      value={minBeds}
                      onChange={(e) => setMinBeds(e.target.value)}
                    >
                      <option value="">Min. Beds</option>
                      {bedOptions.map(bed => (
                        <option key={bed} value={bed}>{bed}+</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Price Range</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="number"
                          className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Min"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                          min="0"
                        />
                        <span className="text-sm text-gray-500 font-medium flex-shrink-0 whitespace-nowrap">To</span>
                        <input
                          type="number"
                          className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Max"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="1000"
                          value={priceMin || 0}
                          onChange={(e) => setPriceMin(e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          aria-label="Minimum price"
                        />
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="1000"
                          value={priceMax || 200000}
                          onChange={(e) => setPriceMax(e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          aria-label="Maximum price"
                        />
                      </div>
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      className="w-full mt-4 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        clearAllFilters()
                        setIsSidebarOpen(false)
                      }}
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="properties-sidebar w-[280px] flex-shrink-0 hidden lg:block md:hidden">
          <div className="advance-search-section bg-white rounded-xl border border-gray-200 pr-5 mb-6 shadow-sm w-full">
            <h2 className="section-title text-lg font-semibold text-gray-900 mb-4 font-outfit">Advance Search</h2>
            <div className="filter-group mb-4">
              <select
                className="filter-select w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">Location</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="filter-group mb-4">
              <select
                className="filter-select w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {propertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group mb-4">
              <select
                className="filter-select w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={minBaths}
                onChange={(e) => setMinBaths(e.target.value)}
              >
                <option value="">Min. Baths</option>
                {bathOptions.map(bath => (
                  <option key={bath} value={bath}>{bath}+</option>
                ))}
              </select>
            </div>

            <div className="filter-group mb-4">
              <select
                className="filter-select w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={minBeds}
                onChange={(e) => setMinBeds(e.target.value)}
              >
                <option value="">Min. Beds</option>
                {bedOptions.map(bed => (
                  <option key={bed} value={bed}>{bed}+</option>
                ))}
              </select>
            </div>

            <div className="filter-group price-range-group mb-4 w-full">
              <label className="price-range-label block text-sm font-medium text-gray-700 mb-2 font-outfit">Price Range</label>
              <div className="price-range-inputs-container w-full">
                <div className="price-range-inputs flex flex-col gap-2 mb-3">
                  <input
                    type="number"
                    className="price-input flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    min="0"
                  />
                  <div className="price-range-separator text-gray-500 text-sm font-medium">
                    <span>To</span>
                  </div>
                  <input
                    type="number"
                    className="price-input flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="price-range-sliders flex flex-col gap-2">
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="1000"
                    value={priceMin || 0}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="price-range-slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label="Minimum price"
                  />
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="1000"
                    value={priceMax || 200000}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="price-range-slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label="Maximum price"
                  />
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                className="clear-filters-btn w-full px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors duration-200"
                onClick={clearAllFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>

          <div className="top-searches-section bg-white rounded-xl border border-gray-200 pr-5 shadow-sm">
            <h2 className="section-title text-lg font-semibold text-gray-900 mb-4 font-outfit">Top Searches</h2>
            <ul className="top-searches-list flex flex-col gap-2">
              {topSearches.map((search, index) => (
                <li key={index} className="search-item flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 cursor-pointer transition-colors duration-200">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="flex-1">{search}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="properties-main-content flex-1 min-w-0">

          {/* Results Count, Categories, and Active Filters */}
          {!loading && paginatedProperties.length > 0 && (
            <div className="results-header mb-6">
              <div className="results-header-top flex items-center justify-between gap-4 mb-4 flex-wrap">
                <div className="results-count text-base text-gray-700 font-outfit">
                  <strong className="font-semibold text-gray-900">{totalProperties}</strong> properties available
                </div>
                <div className="subcategory-row flex items-center gap-2 flex-wrap rounded-lg" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#E5E7EB' }}>
                  <button
                    className={`subcategory-chip px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                    className={`subcategory-chip px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                    className={`subcategory-chip px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                    className={`subcategory-chip px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                        Min Price: ₱{parseInt(priceMin).toLocaleString()}
                        <button 
                          onClick={() => removeFilter('priceMin')} 
                          aria-label="Remove min price filter"
                          className="hover:text-blue-900 font-semibold"
                        >×</button>
                      </span>
                    )}
                    {priceMax && (
                      <span className="filter-chip inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                        Max Price: ₱{parseInt(priceMax).toLocaleString()}
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
              <div className="categories-row flex items-center gap-5 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    className={`category-chip px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedType === category.name 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                    style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#E5E7EB' }}
                    onClick={() => {
                      setSelectedType(category.name)
                      setCurrentPage(1)
                    }}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="properties-content-wrapper">
            {loading ? (
              <div className="no-results">
                <h3 className="no-results-title">Loading Properties...</h3>
                <p className="no-results-text">Please wait while we fetch the latest properties</p>
              </div>
            ) : error ? (
              <div className="no-results">
                <h3 className="no-results-title">Error Loading Properties</h3>
                <p className="no-results-text">{error}</p>
              </div>
            ) : paginatedProperties.length > 0 ? (
              <>
                {viewMode === 'map' ? (
                  <div className="properties-map-container w-full h-[calc(100vh-300px)] min-h-[600px] rounded-lg overflow-hidden border border-gray-200">
                    <PublicPropertiesMap 
                      properties={paginatedProperties}
                    />
                  </div>
                ) : (
                  <>
                    <div className={viewMode === 'horizontal' 
                      ? 'properties-list flex flex-col gap-4 sm:gap-6' 
                      : 'properties-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'}>
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
                        const cardProps = {
                          id: property.id,
                          propertyType: property.type,
                          date: formatDate(property.published_at),
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
                        }

                        return viewMode === 'horizontal' ? (
                          <HorizontalPropertyCard key={property.id} {...cardProps} />
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
                )}
              </>
            ) : (
              <div className="no-results">
                <h3 className="no-results-title">No Properties Found</h3>
                <p className="no-results-text">
                  Try adjusting your filters to see more properties
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <PopularSearches />
      <Footer />
    </div>
  )
}

export default function PropertiesForRentPage() {
  return (
    <Suspense fallback={
      <div className="properties-for-rent-page">
        <Navbar />
        <PageHeader title="Properties for Rent" />
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        <Footer />
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  )
}

