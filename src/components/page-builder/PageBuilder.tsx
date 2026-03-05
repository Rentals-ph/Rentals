'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../../components/common/AppSidebar'
import AgentHeader from '../../components/agent/AgentHeader'
import { ASSETS } from '@/utils/assets'
import { pageBuilderApi, propertiesApi, testimonialsApi, apiClient } from '@/api'
import type { Property, Testimonial } from '@/types'
import { toast, ToastContainer } from '@/utils/toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  FiSettings,
  FiUpload,
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiGlobe,
  FiPlus,
  FiStar,
  FiHeart,
  FiLayout,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiChevronUp,
  FiChevronDown,
  FiTrash2,
  FiMove,
  FiCheck,
  FiX,
  FiExternalLink,
  FiCopy,
  FiMonitor,
  FiTablet,
  FiSmartphone,
  FiRotateCcw,
  FiRotateCw,
  FiHelpCircle,
  FiSave,
  FiHome,
  FiArrowLeft,
  FiBold,
  FiItalic,
  FiUnderline,
  FiLink,
  FiType,
  FiAlignCenter,
  FiAlignLeft,
  FiAlignRight,
  FiAlignJustify,
  FiList,
  FiImage,
  FiGrid,
  FiLayers,
  FiUser,
  FiCalendar,
  FiClock,
  FiMaximize,
  FiMinimize
} from 'react-icons/fi'

// Default layout sections for the property page (used by the Layout Manager)
const DEFAULT_LAYOUT_SECTIONS: { id: string; name: string; visible: boolean }[] = [
  { id: 'hero', name: 'Hero', visible: false },
  { id: 'propertyDescription', name: 'Property Description', visible: true },
  { id: 'propertyImages', name: 'Property Images', visible: true },
  { id: 'propertyDetails', name: 'Property Details', visible: true },
  { id: 'amenities', name: 'Amenities', visible: true },
  { id: 'contact', name: 'Contact Information', visible: true },
  { id: 'experience', name: 'Experience', visible: true },
  { id: 'featured', name: 'Featured Listings', visible: true },
  { id: 'testimonialsSection', name: 'Client Testimonials', visible: true },
  { id: 'readyToView', name: 'Ready To View', visible: true },
  { id: 'profileCard', name: 'Profile Card', visible: true }
]

// Merge persisted layout_sections with defaults so new sections
// always appear in the Layout Manager while preserving custom ones.
function mergeLayoutSections(
  existing?: Array<{ id: string; name: string; visible: boolean }>
): Array<{ id: string; name: string; visible: boolean }> {
  if (!existing || existing.length === 0) {
    return [...DEFAULT_LAYOUT_SECTIONS]
  }

  const existingMap = new Map(existing.map((s) => [s.id, s]))

  const merged: Array<{ id: string; name: string; visible: boolean }> = DEFAULT_LAYOUT_SECTIONS.map(
    (def) => {
      const override = existingMap.get(def.id)
      return override ? { ...def, ...override } : def
    }
  )

  existing.forEach((section) => {
    if (!DEFAULT_LAYOUT_SECTIONS.some((def) => def.id === section.id)) {
      merged.push(section)
    }
  })

  return merged
}

// Profile page layout: Hero Banner, Contact Info, Bio/About, Stats Bar, Active Listings, Client Reviews, Social Links
const DEFAULT_PROFILE_LAYOUT_SECTIONS: { id: string; name: string; visible: boolean }[] = [
  { id: 'profileHero', name: 'Hero Banner', visible: true },
  { id: 'profileContactInfo', name: 'Contact Info', visible: true },
  { id: 'profileBioAbout', name: 'Bio/About', visible: true },
  { id: 'profileStatsBar', name: 'Stats Bar', visible: true },
  { id: 'profileActiveListings', name: 'Active Listings', visible: true },
  { id: 'profileClientReviews', name: 'Client Reviews', visible: true },
  { id: 'profileSocialLinks', name: 'Social Links', visible: true }
]

function mergeProfileLayoutSections(
  existing?: Array<{ id: string; name: string; visible: boolean }>
): Array<{ id: string; name: string; visible: boolean }> {
  if (!existing || existing.length === 0) {
    return [...DEFAULT_PROFILE_LAYOUT_SECTIONS]
  }
  const existingMap = new Map(existing.map((s) => [s.id, s]))
  const merged = DEFAULT_PROFILE_LAYOUT_SECTIONS.map((def) => {
    const override = existingMap.get(def.id)
    return override ? { ...def, ...override } : def
  })
  existing.forEach((section) => {
    if (!DEFAULT_PROFILE_LAYOUT_SECTIONS.some((def) => def.id === section.id)) {
      merged.push(section)
    }
  })
  return merged
}

interface PageBuilderProps {
  userType: 'agent' | 'broker'
}

export default function PageBuilder({ userType }: PageBuilderProps) {
  const [selectedTheme, setSelectedTheme] = useState('white')
  const [showBio, setShowBio] = useState(true)
  const [showContactNumber, setShowContactNumber] = useState(true)
  const [showExperienceStats, setShowExperienceStats] = useState(false)
  const [showFeaturedListings, setShowFeaturedListings] = useState(true)
  const [showTestimonials, setShowTestimonials] = useState(true)
  const [bio, setBio] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [leftSidebarTab, setLeftSidebarTab] = useState<'library' | 'settings'>('library')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Blog / Page Meta States
  const [internalTitle, setInternalTitle] = useState('')
  const [summaryAbstract, setSummaryAbstract] = useState('')
  const [urlSlug, setUrlSlug] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('Philippines')
  const [authorName, setAuthorName] = useState('HOMESPH NEWS')
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0])
  const [publishTime, setPublishTime] = useState('02:30 PM')
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([])
  const [lastSavedTime, setLastSavedTime] = useState('just now')
  const [showFullPreview, setShowFullPreview] = useState(false)

  // Profile image state
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const profileImageInputRef = useRef<HTMLInputElement>(null)

  // Contact information states
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    message: '',
    website: ''
  })
  const [showContactModal, setShowContactModal] = useState(false)
  const [editingContactType, setEditingContactType] = useState<string | null>(null)

  // Experience stats state
  const [experienceStats, setExperienceStats] = useState<Array<{ label: string; value: string }>>([])
  const [showExperienceModal, setShowExperienceModal] = useState(false)
  const [editingStatIndex, setEditingStatIndex] = useState<number | null>(null)

  // Featured listings edit state
  const [showFeaturedListingsModal, setShowFeaturedListingsModal] = useState(false)
  const [editingListingIndex, setEditingListingIndex] = useState<number | null>(null)
  const [showPropertyImportModal, setShowPropertyImportModal] = useState(false)

  // Testimonials edit state
  const [showTestimonialsModal, setShowTestimonialsModal] = useState(false)
  const [editingTestimonialIndex, setEditingTestimonialIndex] = useState<number | null>(null)

  // File input refs
  const heroImageInputRef = useRef<HTMLInputElement>(null)
  const profileCardImageInputRef = useRef<HTMLInputElement>(null)
  const propertyImageInputRef = useRef<HTMLInputElement>(null)

  // Drag and drop state
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null)

  // Property mode states
  const [heroImage, setHeroImage] = useState('')
  const [mainHeading, setMainHeading] = useState('')
  const [tagline, setTagline] = useState('')
  const [overallDarkness, setOverallDarkness] = useState(30)
  const [propertyDescription, setPropertyDescription] = useState('')
  const [propertyImages, setPropertyImages] = useState<string[]>([])
  const [profileCardName, setProfileCardName] = useState('')
  const [profileCardRole, setProfileCardRole] = useState('')
  const [profileCardBio, setProfileCardBio] = useState('')
  const [profileCardImage, setProfileCardImage] = useState('')

  // Additional property preview states
  const [propertyPrice, setPropertyPrice] = useState('')
  const [propertyBedrooms, setPropertyBedrooms] = useState(0)
  const [propertyBathrooms, setPropertyBathrooms] = useState(0)
  const [propertyGarage, setPropertyGarage] = useState(0)
  const [propertyArea, setPropertyArea] = useState('')
  const [propertyAmenities, setPropertyAmenities] = useState<string[]>([])
  const [newAmenityInput, setNewAmenityInput] = useState('')
  const [contactFormName, setContactFormName] = useState('')
  const [contactFormEmail, setContactFormEmail] = useState('')
  const [contactFormMessage, setContactFormMessage] = useState('')

  // Section visibility states
  const [sectionVisibility, setSectionVisibility] = useState({
    hero: false,
    propertyDescription: true,
    propertyImages: true,
    propertyDetails: true,
    amenities: true,
    contact: true,
    experience: true,
    featured: true,
    testimonialsSection: true,
    readyToView: true,
    profileCard: true
  })

  // Layout sections order (property page)
  const [layoutSections, setLayoutSections] = useState(mergeLayoutSections())

  // Profile layout sections order (profile page): Hero Banner, Contact Info, Bio/About, Stats Bar, Active Listings, Client Reviews, Social Links
  const [profileLayoutSections, setProfileLayoutSections] = useState(mergeProfileLayoutSections())

  // Design states
  const [selectedBrandColor, setSelectedBrandColor] = useState('white')
  const [selectedCornerRadius, setSelectedCornerRadius] = useState('soft')

  // Global design settings
  const [globalDesign, setGlobalDesign] = useState({
    fontFamily: 'Inter',
    fontSize: '16px',
    spacing: 'normal',
    borderStyle: 'none',
    shadow: 'none'
  })

  // Section-level styling (layout template, font, colors, background)
  const [sectionStyles, setSectionStyles] = useState<Record<string, {
    layoutTemplate: string
    fontFamily: string
    fontSize: string
    textColor: string
    backgroundColor: string
    padding: string
    borderStyle: string
    borderColor: string
    shadow: string
  }>>({})

  // Section renaming state
  const [editingSectionName, setEditingSectionName] = useState<string | null>(null)
  const [newSectionName, setNewSectionName] = useState('')

  // Add new section state
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [newSectionType, setNewSectionType] = useState('custom')
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionContent, setNewSectionContent] = useState('')

  // Page builder data state
  const [pageBuilderId, setPageBuilderId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [pageUrl, setPageUrl] = useState<string | null>(null)
  const [pageSlug, setPageSlug] = useState<string | null>(null)
  const [showPageUrlModal, setShowPageUrlModal] = useState(false)

  // Featured listings and testimonials state
  const [featuredListings, setFeaturedListings] = useState<Property[]>([])
  const [availableProperties, setAvailableProperties] = useState<Property[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [availableTestimonials, setAvailableTestimonials] = useState<Testimonial[]>([])
  const [loadingProperties, setLoadingProperties] = useState(false)
  const [loadingTestimonials, setLoadingTestimonials] = useState(false)

  // New features state
  const router = useRouter()
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved')
  const [openSectionId, setOpenSectionId] = useState<string | null>(null)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<Record<string, number>>({})

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load available properties and testimonials
  useEffect(() => {
    const loadAvailableData = async () => {
      try {
        setLoadingProperties(true)
        setLoadingTestimonials(true)

        // Get current user ID from auth (you may need to adjust this based on your auth setup)
        // For now, we'll get all properties and filter client-side
        const properties = await propertiesApi.getAll()
        const propertiesArray = Array.isArray(properties) ? properties : (properties as any).data || []
        setAvailableProperties(propertiesArray)

        const testimonialsData = await testimonialsApi.getAll()
        setAvailableTestimonials(testimonialsData)
      } catch (error) {
        console.error('Error loading available data:', error)
      } finally {
        setLoadingProperties(false)
        setLoadingTestimonials(false)
      }
    }

    loadAvailableData()
  }, [])

  // Helper function to capture current state for history
  const captureState = useCallback(() => {
    return {
      selectedTheme,
      showBio,
      showContactNumber,
      showExperienceStats,
      showFeaturedListings,
      showTestimonials,
      bio,
      profileImage,
      contactInfo,
      experienceStats,
      featuredListings,
      testimonials,
      heroImage,
      mainHeading,
      tagline,
      overallDarkness,
      propertyDescription,
      propertyImages,
      propertyPrice,
      profileCardName,
      profileCardRole,
      profileCardBio,
      profileCardImage,
      sectionVisibility,
      layoutSections,
      profileLayoutSections,
      selectedBrandColor,
      selectedCornerRadius,
      globalDesign,
      sectionStyles,
    }
  }, [
    selectedTheme, showBio, showContactNumber, showExperienceStats, showFeaturedListings, showTestimonials,
    bio, profileImage, contactInfo, experienceStats, featuredListings, testimonials,
    heroImage, mainHeading, tagline, overallDarkness, propertyDescription, propertyImages, propertyPrice,
    propertyBedrooms, propertyBathrooms, propertyGarage, propertyArea, propertyAmenities,
    profileCardName, profileCardRole, profileCardBio, profileCardImage,
    sectionVisibility, layoutSections, profileLayoutSections, selectedBrandColor, selectedCornerRadius, globalDesign, sectionStyles
  ])

  // Helper function to restore state from history
  const restoreState = useCallback((state: any) => {
    if (state.selectedTheme !== undefined) setSelectedTheme(state.selectedTheme)
    if (state.showBio !== undefined) setShowBio(state.showBio)
    if (state.showContactNumber !== undefined) setShowContactNumber(state.showContactNumber)
    if (state.showExperienceStats !== undefined) setShowExperienceStats(state.showExperienceStats)
    if (state.showFeaturedListings !== undefined) setShowFeaturedListings(state.showFeaturedListings)
    if (state.showTestimonials !== undefined) setShowTestimonials(state.showTestimonials)
    if (state.bio !== undefined) setBio(state.bio)
    if (state.profileImage !== undefined) setProfileImage(state.profileImage)
    if (state.contactInfo !== undefined) setContactInfo(state.contactInfo)
    if (state.experienceStats !== undefined) setExperienceStats(state.experienceStats)
    if (state.featuredListings !== undefined) setFeaturedListings(state.featuredListings)
    if (state.testimonials !== undefined) setTestimonials(state.testimonials)
    if (state.heroImage !== undefined) setHeroImage(state.heroImage)
    if (state.mainHeading !== undefined) setMainHeading(state.mainHeading)
    if (state.tagline !== undefined) setTagline(state.tagline)
    if (state.overallDarkness !== undefined) setOverallDarkness(state.overallDarkness)
    if (state.propertyDescription !== undefined) setPropertyDescription(state.propertyDescription)
    if (state.propertyImages !== undefined) setPropertyImages(state.propertyImages)
    if (state.propertyPrice !== undefined) setPropertyPrice(state.propertyPrice)
    if (state.propertyBedrooms !== undefined) setPropertyBedrooms(state.propertyBedrooms)
    if (state.propertyBathrooms !== undefined) setPropertyBathrooms(state.propertyBathrooms)
    if (state.propertyGarage !== undefined) setPropertyGarage(state.propertyGarage)
    if (state.propertyArea !== undefined) setPropertyArea(state.propertyArea)
    if (state.propertyAmenities !== undefined) setPropertyAmenities(state.propertyAmenities)
    if (state.profileCardName !== undefined) setProfileCardName(state.profileCardName)
    if (state.profileCardRole !== undefined) setProfileCardRole(state.profileCardRole)
    if (state.profileCardBio !== undefined) setProfileCardBio(state.profileCardBio)
    if (state.profileCardImage !== undefined) setProfileCardImage(state.profileCardImage)
    if (state.sectionVisibility !== undefined) setSectionVisibility(state.sectionVisibility)
    if (state.layoutSections !== undefined) setLayoutSections(mergeLayoutSections(state.layoutSections))
    if (state.profileLayoutSections !== undefined) setProfileLayoutSections(mergeProfileLayoutSections(state.profileLayoutSections))
    if (state.globalDesign !== undefined) setGlobalDesign(state.globalDesign)
    if (state.sectionStyles !== undefined) setSectionStyles(state.sectionStyles)
    if (state.selectedBrandColor !== undefined) setSelectedBrandColor(state.selectedBrandColor)
    if (state.selectedCornerRadius !== undefined) setSelectedCornerRadius(state.selectedCornerRadius)
  }, [])

  // Add to history
  const addToHistory = useCallback(() => {
    const currentState = captureState()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(currentState)
    // Limit to 50 states
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setHistoryIndex(newHistory.length - 1)
    }
    setHistory(newHistory)
  }, [captureState, history, historyIndex])

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      restoreState(prevState)
      setHistoryIndex(historyIndex - 1)
    }
  }, [history, historyIndex, restoreState])

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      restoreState(nextState)
      setHistoryIndex(historyIndex + 1)
    }
  }, [history, historyIndex, restoreState])

  // When switching to profile, ensure we don't stay on Design tab (profile has no Design)
  useEffect(() => {
    if (activeTab === 'profile' && leftSidebarTab === 'library') setLeftSidebarTab('settings')
  }, [activeTab, leftSidebarTab])

  // Load page builder data on mount
  useEffect(() => {
    const loadPageBuilder = async () => {
      try {
        setIsLoading(true)
        const pageBuilders = await pageBuilderApi.getAll(userType, activeTab as 'profile' | 'property')

        // Also load profile page builder data to sync with property page
        const profilePageBuilders = await pageBuilderApi.getAll(userType, 'profile')
        const profilePageData = profilePageBuilders.length > 0 ? profilePageBuilders[0] : null

        if (pageBuilders.length > 0) {
          const pageData = pageBuilders[0]
          setPageBuilderId(pageData.id || null)
          setIsPublished(pageData.is_published || false)
          setPageUrl(pageData.page_url || null)
          setPageSlug(pageData.page_slug || null)

          // Load by slug if available to get the most up-to-date data
          let dataToUse = pageData
          if (pageData.page_slug) {
            try {
              const slugData = await pageBuilderApi.getBySlugForEdit(pageData.page_slug)
              // Use slug data if available, otherwise use pageData
              if (slugData) {
                dataToUse = slugData
              }
            } catch (error) {
              console.error('Error loading by slug:', error)
            }
          }

          // Load profile data
          if (activeTab === 'profile' && dataToUse.page_type === 'profile') {
            if (dataToUse.selected_theme) setSelectedTheme(dataToUse.selected_theme)
            if (dataToUse.bio !== undefined) setBio(dataToUse.bio || '')
            if (dataToUse.show_bio !== undefined) setShowBio(dataToUse.show_bio)
            if (dataToUse.show_contact_number !== undefined) setShowContactNumber(dataToUse.show_contact_number)
            if (dataToUse.show_experience_stats !== undefined) setShowExperienceStats(dataToUse.show_experience_stats)
            if (dataToUse.show_featured_listings !== undefined) setShowFeaturedListings(dataToUse.show_featured_listings)
            if (dataToUse.show_testimonials !== undefined) setShowTestimonials(dataToUse.show_testimonials)
            if (dataToUse.profile_image) setProfileImage(dataToUse.profile_image)
            if (dataToUse.contact_info) {
              setContactInfo({
                email: dataToUse.contact_info.email || '',
                phone: dataToUse.contact_info.phone || '',
                message: dataToUse.contact_info.message || '',
                website: dataToUse.contact_info.website || ''
              })
            }
            if (dataToUse.experience_stats) setExperienceStats(dataToUse.experience_stats || [])
            if (dataToUse.featured_listings) setFeaturedListings(dataToUse.featured_listings as Property[] || [])
            if (dataToUse.testimonials) setTestimonials(dataToUse.testimonials as Testimonial[] || [])
            // Load profile card fields - always load if they exist, even if empty
            if (dataToUse.profile_card_name !== undefined) setProfileCardName(dataToUse.profile_card_name || '')
            if (dataToUse.profile_card_role !== undefined) setProfileCardRole(dataToUse.profile_card_role || '')
            if (dataToUse.profile_card_bio !== undefined) setProfileCardBio(dataToUse.profile_card_bio || '')
            if (dataToUse.profile_card_image !== undefined) setProfileCardImage(dataToUse.profile_card_image || '')
          }

          // Load property data
          if (activeTab === 'property' && dataToUse.page_type === 'property') {
            if (dataToUse.hero_image) setHeroImage(dataToUse.hero_image)
            if (dataToUse.main_heading) setMainHeading(dataToUse.main_heading)
            if (dataToUse.tagline) setTagline(dataToUse.tagline)
            if (dataToUse.overall_darkness !== undefined) setOverallDarkness(dataToUse.overall_darkness)
            if (dataToUse.property_description) setPropertyDescription(dataToUse.property_description)
            if (dataToUse.property_images) setPropertyImages(dataToUse.property_images)
            if (dataToUse.property_price) setPropertyPrice(dataToUse.property_price)
            if ((dataToUse as any).property_bedrooms !== undefined) setPropertyBedrooms((dataToUse as any).property_bedrooms)
            if ((dataToUse as any).property_bathrooms !== undefined) setPropertyBathrooms((dataToUse as any).property_bathrooms)
            if ((dataToUse as any).property_garage !== undefined) setPropertyGarage((dataToUse as any).property_garage)
            if ((dataToUse as any).property_area !== undefined) setPropertyArea((dataToUse as any).property_area)
            if ((dataToUse as any).property_amenities) setPropertyAmenities((dataToUse as any).property_amenities)

            // Load contact info, experience stats, featured listings, and testimonials for property pages
            if (dataToUse.contact_info) {
              setContactInfo({
                email: dataToUse.contact_info.email || '',
                phone: dataToUse.contact_info.phone || '',
                message: dataToUse.contact_info.message || '',
                website: dataToUse.contact_info.website || ''
              })
            }
            if (dataToUse.show_contact_number !== undefined) setShowContactNumber(dataToUse.show_contact_number)
            if (dataToUse.show_experience_stats !== undefined) setShowExperienceStats(dataToUse.show_experience_stats)
            if (dataToUse.show_featured_listings !== undefined) setShowFeaturedListings(dataToUse.show_featured_listings)
            if (dataToUse.show_testimonials !== undefined) setShowTestimonials(dataToUse.show_testimonials)
            if (dataToUse.experience_stats) setExperienceStats(dataToUse.experience_stats || [])
            if (dataToUse.featured_listings) setFeaturedListings((dataToUse.featured_listings as Property[]) || [])
            if (dataToUse.testimonials) setTestimonials((dataToUse.testimonials as Testimonial[]) || [])

            // Load profile card fields
            if (dataToUse.profile_card_name !== undefined) setProfileCardName(dataToUse.profile_card_name || '')
            if (dataToUse.profile_card_role !== undefined) setProfileCardRole(dataToUse.profile_card_role || '')
            if (dataToUse.profile_card_bio !== undefined) setProfileCardBio(dataToUse.profile_card_bio || '')
            if (dataToUse.profile_card_image !== undefined) setProfileCardImage(dataToUse.profile_card_image || '')

            if (dataToUse.section_visibility) {
              setSectionVisibility({
                hero: dataToUse.section_visibility.hero ?? false,
                propertyDescription: dataToUse.section_visibility.propertyDescription ?? true,
                propertyImages: dataToUse.section_visibility.propertyImages ?? true,
                propertyDetails: (dataToUse.section_visibility as any).propertyDetails ?? true,
                amenities: (dataToUse.section_visibility as any).amenities ?? true,
                contact: (dataToUse.section_visibility as any).contact ?? true,
                experience: (dataToUse.section_visibility as any).experience ?? true,
                featured: (dataToUse.section_visibility as any).featured ?? true,
                testimonialsSection: (dataToUse.section_visibility as any).testimonialsSection ?? true,
                readyToView: (dataToUse.section_visibility as any).readyToView ?? true,
                profileCard: dataToUse.section_visibility.profileCard ?? true
              })
            }
            if (dataToUse.layout_sections) setLayoutSections(mergeLayoutSections(dataToUse.layout_sections))
            if ((dataToUse as any).profile_layout_sections) setProfileLayoutSections(mergeProfileLayoutSections((dataToUse as any).profile_layout_sections))
            if ((dataToUse as any).global_design) setGlobalDesign((dataToUse as any).global_design)
            if ((dataToUse as any).section_styles) setSectionStyles((dataToUse as any).section_styles)
            if (dataToUse.selected_brand_color) setSelectedBrandColor(dataToUse.selected_brand_color)
            if (dataToUse.selected_corner_radius) setSelectedCornerRadius(dataToUse.selected_corner_radius)

            // Sync profile card with profile page builder data (only if property page data doesn't have it)
            if (profilePageData) {
              // Use profile image for profile card image only if property page doesn't have one
              if (!dataToUse.profile_card_image && profilePageData.profile_image) {
                setProfileCardImage(profilePageData.profile_image)
              }
              // Use bio for profile card bio only if property page doesn't have one
              if (!dataToUse.profile_card_bio && profilePageData.bio) {
                setProfileCardBio(profilePageData.bio)
              }
              // Don't overwrite contact info, listings, or testimonials from property page - they should be saved separately
            }
          }
        } else {
          // If no page exists for this tab, still load profile data for profile card (property mode)
          if (activeTab === 'property' && profilePageData) {
            if (profilePageData.profile_image) {
              setProfileCardImage(profilePageData.profile_image)
            }
            if (profilePageData.bio) {
              setProfileCardBio(profilePageData.bio)
            }
            if (profilePageData.contact_info) {
              const contactInfo = profilePageData.contact_info
              setContactInfo(prev => ({
                ...prev,
                email: contactInfo.email || prev.email,
                phone: contactInfo.phone || prev.phone
              }))
            }
          }
        }
      } catch (error) {
        console.error('Error loading page builder:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPageBuilder()
  }, [activeTab])

  // Auto-fill profile card details from stored profile info when empty
  useEffect(() => {
    if (activeTab !== 'property') return
    if (profileCardName) return

    try {
      if (typeof window === 'undefined') return
      const storedName =
        localStorage.getItem('user_name') || localStorage.getItem('agent_name')

      if (storedName && !profileCardName) {
        setProfileCardName(storedName)
      }
    } catch (error) {
      console.error('Error auto-filling profile card from profile:', error)
    }
  }, [activeTab, profileCardName])

  // Helper to collect all page data
  const collectPageData = useCallback(() => {
    return {
      // Profile mode fields
      selected_theme: selectedTheme,
      bio: bio,
      show_bio: showBio,
      show_contact_number: showContactNumber,
      show_experience_stats: showExperienceStats,
      show_featured_listings: showFeaturedListings,
      show_testimonials: showTestimonials,
      profile_image: profileImage,
      contact_info: contactInfo,
      experience_stats: experienceStats,
      featured_listings: featuredListings,
      testimonials: testimonials,

      // Property mode fields
      hero_image: heroImage,
      main_heading: mainHeading,
      tagline: tagline,
      overall_darkness: overallDarkness,
      property_description: propertyDescription,
      property_images: propertyImages,
      property_price: propertyPrice,
      property_bedrooms: propertyBedrooms,
      property_bathrooms: propertyBathrooms,
      property_garage: propertyGarage,
      property_area: propertyArea,
      property_amenities: propertyAmenities,
      contact_phone: contactInfo.phone,
      contact_email: contactInfo.email,

      // Profile card fields
      profile_card_name: profileCardName,
      profile_card_role: profileCardRole,
      profile_card_bio: profileCardBio,
      profile_card_image: profileCardImage,

      // Layout and design fields
      section_visibility: sectionVisibility,
      layout_sections: layoutSections,
      profile_layout_sections: profileLayoutSections,
      selected_brand_color: selectedBrandColor,
      selected_corner_radius: selectedCornerRadius,
      global_design: globalDesign,
      section_styles: sectionStyles,
    }
  }, [
    selectedTheme, bio, showBio, showContactNumber, showExperienceStats, showFeaturedListings, showTestimonials,
    profileImage, contactInfo, experienceStats, featuredListings, testimonials,
    heroImage, mainHeading, tagline, overallDarkness, propertyDescription, propertyImages, propertyPrice,
    propertyBedrooms, propertyBathrooms, propertyGarage, propertyArea, propertyAmenities,
    profileCardName, profileCardRole, profileCardBio, profileCardImage,
    sectionVisibility, layoutSections, profileLayoutSections, selectedBrandColor, selectedCornerRadius, globalDesign, sectionStyles
  ])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges || isSaving) return

    const interval = setInterval(async () => {
      if (hasUnsavedChanges && !isSaving) {
        try {
          setAutoSaveStatus('saving')
          const pageData = collectPageData()
          const savePayload = {
            user_type: userType,
            page_type: activeTab as 'profile' | 'property',
            page_data: pageData,
            page_slug: pageSlug || undefined,
          }
          await pageBuilderApi.save(savePayload)
          setAutoSaveStatus('saved')
          setHasUnsavedChanges(false)
        } catch (error: any) {
          console.error('Auto-save failed:', error)
          setAutoSaveStatus('error')
        }
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [hasUnsavedChanges, isSaving, collectPageData, userType, activeTab, pageSlug])

  // Image upload handler
  const handleImageUpload = async (file: File, type: 'profile' | 'hero' | 'profileCard' | 'property', fieldId?: string) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    const uploadId = fieldId || type
    setUploadingImages(prev => ({ ...prev, [uploadId]: 0 }))

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use apiClient for proper authentication and base URL
      const response = await apiClient.post('/upload', formData)

      if (!response.data.success) {
        const errorMsg = response.data.message || 'Upload failed'
        const errors = response.data.errors
        const fullError = errors ? `${errorMsg}: ${JSON.stringify(errors)}` : errorMsg
        throw new Error(fullError)
      }

      const imageUrl = response.data.url || response.data.path

      // Update the appropriate state
      switch (type) {
        case 'profile':
          setProfileImage(imageUrl)
          break
        case 'hero':
          setHeroImage(imageUrl)
          break
        case 'profileCard':
          setProfileCardImage(imageUrl)
          break
        case 'property':
          setPropertyImages(prev => [...prev, imageUrl])
          break
      }

      setHasUnsavedChanges(true)
      addToHistory()
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      console.error('Error response:', error.response?.data)

      // Extract detailed error message
      let errorMessage = 'Unknown error'
      if (error.response?.data) {
        const data = error.response.data
        if (data.message) {
          errorMessage = data.message
        } else if (data.errors) {
          // Format validation errors
          const errorList = Object.entries(data.errors)
            .map(([field, messages]: [string, any]) => {
              const msgList = Array.isArray(messages) ? messages.join(', ') : messages
              return `${field}: ${msgList}`
            })
            .join('; ')
          errorMessage = errorList || 'Validation failed'
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error('Failed to upload image: ' + errorMessage)
    } finally {
      setUploadingImages(prev => {
        const newState = { ...prev }
        delete newState[uploadId]
        return newState
      })
    }
  }

  // Handle drag and drop for images
  const handleImageDrop = (e: React.DragEvent, type: 'profile' | 'hero' | 'profileCard' | 'property', fieldId?: string) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleImageUpload(file, type, fieldId)
    }
  }

  // Handle drag over for images
  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveChanges()
      }
      // Ctrl+Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      // Ctrl+Shift+Z or Ctrl+Y to redo
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z') || e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
      // Ctrl+P to toggle preview modal
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setShowFullPreview((prev) => !prev)
      }
      // Escape to close modals/panels
      if (e.key === 'Escape') {
        setShowFullPreview(false)
        setShowShortcutsModal(false)
        setOpenSectionId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Intercept Next.js router navigation
  useEffect(() => {
    const handleRouteChange = () => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?')
        if (!confirmed) {
          router.back()
        }
      }
    }

    // Note: Next.js 13+ App Router doesn't have router events like Pages Router
    // We'll handle this in the component that triggers navigation
  }, [hasUnsavedChanges, router])

  const brandColors = [
    { id: 'white', color: '#FFFFFF' },
    { id: 'dark', color: '#1F2937' },
    { id: 'orange', color: '#F97316' },
    { id: 'blue', color: '#3B82F6' }
  ]

  const cornerRadiusOptions = [
    { id: 'sharp', name: 'Sharp' },
    { id: 'regular', name: 'Regular' },
    { id: 'soft', name: 'Soft' }
  ]

  const toggleSectionVisibility = (sectionId: string) => {
    setSectionVisibility(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId as keyof typeof prev]
    }))
    setLayoutSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, visible: !section.visible }
        : section
    ))
  }

  // Drag and drop handler for sections
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setLayoutSections((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        setHasUnsavedChanges(true)
        addToHistory()
        return newItems
      })
    }
  }

  // Profile layout: drag end and visibility toggle
  const handleProfileDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setProfileLayoutSections((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        setHasUnsavedChanges(true)
        addToHistory()
        return newItems
      })
    }
  }

  const toggleProfileSectionVisibility = (sectionId: string) => {
    setProfileLayoutSections(prev => prev.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s))
    setHasUnsavedChanges(true)
    addToHistory()
  }

  // Duplicate section
  const duplicateSection = (sectionId: string) => {
    const section = layoutSections.find(s => s.id === sectionId)
    if (section) {
      const newId = `${sectionId}-copy-${Date.now()}`
      const newSection = { ...section, id: newId }
      const index = layoutSections.findIndex(s => s.id === sectionId)
      const newSections = [...layoutSections]
      newSections.splice(index + 1, 0, newSection)
      setLayoutSections(newSections)
      setSectionVisibility(prev => ({
        ...prev,
        [newId]: section.visible
      }))
      setHasUnsavedChanges(true)
      addToHistory()
    }
  }

  const deleteSection = (sectionId: string) => {
    setLayoutSections(prev => prev.filter(section => section.id !== sectionId))
    setSectionVisibility(prev => {
      const newVisibility = { ...prev }
      delete newVisibility[sectionId as keyof typeof prev]
      return newVisibility
    })
    setSectionStyles(prev => {
      const newStyles = { ...prev }
      delete newStyles[sectionId]
      return newStyles
    })
    setHasUnsavedChanges(true)
    addToHistory()
  }

  // Rename section
  const renameSection = (sectionId: string, newName: string) => {
    if (!newName.trim()) return
    setLayoutSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, name: newName.trim() } : section
    ))
    setEditingSectionName(null)
    setNewSectionName('')
    setHasUnsavedChanges(true)
    addToHistory()
  }

  // Get default section style
  const getDefaultSectionStyle = () => ({
    layoutTemplate: 'default',
    fontFamily: globalDesign.fontFamily,
    fontSize: globalDesign.fontSize,
    textColor: '#1F2937',
    backgroundColor: 'transparent',
    padding: 'normal',
    borderStyle: 'none',
    borderColor: '#E5E7EB',
    shadow: 'none'
  })

  // Update section style
  const updateSectionStyle = (sectionId: string, styleUpdates: Partial<typeof sectionStyles[string]>) => {
    setSectionStyles(prev => ({
      ...prev,
      [sectionId]: {
        ...getDefaultSectionStyle(),
        ...prev[sectionId],
        ...styleUpdates
      }
    }))
    setHasUnsavedChanges(true)
    addToHistory()
  }

  // Add new section
  const addNewSection = () => {
    if (!newSectionTitle.trim()) return

    const newId = `custom-${Date.now()}`
    const newSection = {
      id: newId,
      name: newSectionTitle.trim(),
      visible: true,
      type: newSectionType,
      content: newSectionContent
    }

    setLayoutSections(prev => [...prev, newSection])
    setSectionVisibility(prev => ({ ...prev, [newId]: true }))
    setSectionStyles(prev => ({
      ...prev,
      [newId]: getDefaultSectionStyle()
    }))

    setShowAddSectionModal(false)
    setNewSectionTitle('')
    setNewSectionContent('')
    setNewSectionType('custom')
    setHasUnsavedChanges(true)
    addToHistory()
  }

  // Get section style for rendering
  const getSectionStyle = (sectionId: string) => {
    const style = sectionStyles[sectionId] || getDefaultSectionStyle()
    return {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      color: style.textColor,
      backgroundColor: style.backgroundColor,
      padding: style.padding === 'small' ? '0.5rem' : style.padding === 'large' ? '2rem' : '1rem',
      borderStyle: style.borderStyle,
      borderColor: style.borderColor,
      boxShadow: style.shadow === 'small' ? '0 1px 2px rgba(0,0,0,0.05)' :
        style.shadow === 'medium' ? '0 4px 6px rgba(0,0,0,0.1)' :
          style.shadow === 'large' ? '0 10px 15px rgba(0,0,0,0.15)' : 'none'
    }
  }

  // Sortable section item component
  function SortableSectionItem({ section, index }: { section: { id: string; name: string; visible: boolean }, index: number }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: section.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${!section.visible ? 'opacity-50' : ''
          }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <FiMove className="w-5 h-5" />
        </div>
        {editingSectionName === section.id ? (
          <input
            type="text"
            value={newSectionName || section.name}
            onChange={(e) => setNewSectionName(e.target.value)}
            onBlur={() => {
              if (newSectionName.trim()) {
                renameSection(section.id, newSectionName)
              } else {
                setEditingSectionName(null)
                setNewSectionName('')
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (newSectionName.trim()) {
                  renameSection(section.id, newSectionName)
                }
              } else if (e.key === 'Escape') {
                setEditingSectionName(null)
                setNewSectionName('')
              }
            }}
            className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={() => {
              setEditingSectionName(section.id)
              setNewSectionName(section.name)
            }}
            title="Click to rename"
          >
            {section.name}
          </span>
        )}
        <div className="flex items-center gap-2">
          <button
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            onClick={() => {
              setOpenSectionId(openSectionId === section.id ? null : section.id)
            }}
            aria-label="Section settings"
            title="Section settings"
          >
            <FiSettings className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            onClick={() => {
              toggleSectionVisibility(section.id)
              setHasUnsavedChanges(true)
              addToHistory()
            }}
            aria-label="Toggle visibility"
          >
            {section.visible ? (
              <FiEye className="w-4 h-4" />
            ) : (
              <FiEyeOff className="w-4 h-4" />
            )}
          </button>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            onClick={() => duplicateSection(section.id)}
            aria-label="Duplicate section"
            title="Duplicate section"
          >
            <FiCopy className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-red-500 hover:text-red-700 transition-colors"
            onClick={() => deleteSection(section.id)}
            aria-label="Delete section"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Profile layout: sortable item (reorder + visibility only)
  function SortableProfileSectionItem({ section }: { section: { id: string; name: string; visible: boolean } }) {
    const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: section.id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${!section.visible ? 'opacity-50' : ''}`}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
          <FiMove className="w-5 h-5" />
        </div>
        <span className="flex-1 text-sm font-medium text-gray-900">{section.name}</span>
        <button
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => { toggleProfileSectionVisibility(section.id); setHasUnsavedChanges(true); addToHistory() }}
          aria-label="Toggle visibility"
        >
          {section.visible ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
        </button>
      </div>
    )
  }

  // Legacy file upload handler (for backward compatibility)
  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'hero' | 'profileCard' | 'property', fieldId?: string) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, type, fieldId)
    }
  }

  // Contact management
  const handleContactIconClick = (type: 'email' | 'phone' | 'message' | 'website') => {
    setEditingContactType(type)
    setShowContactModal(true)
  }

  const handleContactSave = () => {
    setShowContactModal(false)
    setEditingContactType(null)
  }

  // Experience stats management
  const handleAddExperienceStat = () => {
    setEditingStatIndex(null)
    setShowExperienceModal(true)
  }

  const handleSaveExperienceStat = (label: string, value: string) => {
    if (editingStatIndex !== null) {
      const updated = [...experienceStats]
      updated[editingStatIndex] = { label, value }
      setExperienceStats(updated)
    } else {
      setExperienceStats([...experienceStats, { label, value }])
    }
    setShowExperienceModal(false)
    setEditingStatIndex(null)
  }

  const handleDeleteExperienceStat = (index: number) => {
    setExperienceStats(prev => prev.filter((_, i) => i !== index))
  }

  // Featured listings management
  const handleAddFeaturedListing = () => {
    setEditingListingIndex(null)
    setShowFeaturedListingsModal(true)
  }

  const handleEditFeaturedListing = (index: number) => {
    setEditingListingIndex(index)
    setShowFeaturedListingsModal(true)
  }

  const handleSelectFeaturedListing = (property: Property) => {
    if (editingListingIndex !== null) {
      const updated = [...featuredListings]
      updated[editingListingIndex] = property
      setFeaturedListings(updated)
    } else {
      setFeaturedListings([...featuredListings, property])
    }
    setShowFeaturedListingsModal(false)
    setEditingListingIndex(null)
  }

  const handleImportPropertyToPage = (property: Property) => {
    const mainImage =
      property.image_url ||
      property.image ||
      (property.images_url && property.images_url.length > 0 ? property.images_url[0] : undefined) ||
      (property.images && property.images.length > 0 ? property.images[0] : undefined) ||
      ''

    setHeroImage(mainImage || '')
    setMainHeading(property.title || '')

    const locationParts = [
      property.location,
      property.city,
      property.state_province,
      property.country,
    ].filter(Boolean) as string[]
    if (locationParts.length > 0) {
      setTagline(locationParts.join(' • '))
    }

    const priceLabel = property.price
      ? `₱${property.price.toLocaleString('en-US')}${property.price_type ? `/${property.price_type}` : '/mo'
      }`
      : ''
    if (priceLabel) {
      setPropertyPrice(priceLabel)
    }

    if (property.description) {
      setPropertyDescription(property.description)
    }

    const galleryImages =
      (property.images_url && property.images_url.length > 0
        ? property.images_url
        : property.images && property.images.length > 0
          ? property.images
          : mainImage
            ? [mainImage]
            : []) || []

    setPropertyImages(galleryImages)

    setHasUnsavedChanges(true)
    addToHistory()
    setShowPropertyImportModal(false)
  }

  const handleRemoveFeaturedListing = (index: number) => {
    setFeaturedListings(prev => prev.filter((_, i) => i !== index))
  }

  // Testimonials management
  const handleAddTestimonial = () => {
    setEditingTestimonialIndex(null)
    setShowTestimonialsModal(true)
  }

  const handleEditTestimonial = (index: number) => {
    setEditingTestimonialIndex(index)
    setShowTestimonialsModal(true)
  }

  const handleSaveTestimonial = (testimonial: Testimonial) => {
    if (editingTestimonialIndex !== null) {
      const updated = [...testimonials]
      updated[editingTestimonialIndex] = testimonial
      setTestimonials(updated)
    } else {
      setTestimonials([...testimonials, testimonial])
    }
    setShowTestimonialsModal(false)
    setEditingTestimonialIndex(null)
  }

  const handleDeleteTestimonial = (index: number) => {
    setTestimonials(prev => prev.filter((_, i) => i !== index))
  }

  // Contact form submission
  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // In a real app, this would send to a contact/inquiry API
      // For now, we'll just show an alert
      if (!contactFormName || !contactFormEmail || !contactFormMessage) {
        alert('Please fill in all fields')
        return
      }

      // TODO: Implement actual API call to submit inquiry
      console.log('Contact form submission:', {
        name: contactFormName,
        email: contactFormEmail,
        message: contactFormMessage,
        pageId: pageBuilderId,
        pageType: activeTab
      })

      alert('Thank you for your inquiry! We will get back to you soon.')
      setContactFormName('')
      setContactFormEmail('')
      setContactFormMessage('')
    } catch (error) {
      console.error('Error submitting contact form:', error)
      alert('Failed to send inquiry. Please try again.')
    }
  }

  // Remove property image
  const handleRemovePropertyImage = (index: number) => {
    setPropertyImages(prev => prev.filter((_, i) => i !== index))
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedSectionIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetIndex: number) => {
    if (draggedSectionIndex === null) return

    const newSections = [...layoutSections]
    const [draggedItem] = newSections.splice(draggedSectionIndex, 1)
    newSections.splice(targetIndex, 0, draggedItem)
    setLayoutSections(newSections)
    setDraggedSectionIndex(null)
  }

  // Save changes handler - sends all page customization as a single page_data object
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true)
      setAutoSaveStatus('saving')

      const pageData = collectPageData()

      // Send to backend with page_data structure
      const savePayload = {
        user_type: userType,
        page_type: activeTab as 'profile' | 'property',
        page_data: pageData,
        page_slug: pageSlug || undefined,
      }

      const savedData = await pageBuilderApi.save(savePayload)
      setPageBuilderId(savedData.id || null)

      // Update page URL and slug if available
      if (savedData.page_url) {
        setPageUrl(savedData.page_url)
      }
      if (savedData.page_slug) {
        setPageSlug(savedData.page_slug)
      }
      setIsPublished(savedData.is_published || false)
      setHasUnsavedChanges(false)
      setAutoSaveStatus('saved')

      toast.success('Changes saved successfully!')
    } catch (error: any) {
      console.error('Error saving page builder:', error)
      setAutoSaveStatus('error')
      toast.error('Failed to save changes: ' + (error.response?.data?.message || error.message))
    } finally {
      setIsSaving(false)
    }
  }

  // Publish handler
  const handlePublish = async () => {
    // Save first if there are unsaved changes
    if (hasUnsavedChanges) {
      await handleSaveChanges()
    }

    if (!pageSlug) {
      toast.error('Please save your page first before publishing.')
      return
    }

    try {
      setIsPublishing(true)
      const publishedData = await pageBuilderApi.publishBySlug(pageSlug)

      setIsPublished(publishedData.is_published || false)
      if (publishedData.page_url) {
        setPageUrl(publishedData.page_url)
      }
      if (publishedData.page_slug) {
        setPageSlug(publishedData.page_slug)
      }

      if (publishedData.is_published) {
        setShowPageUrlModal(true)
        toast.success('Page published successfully! Your page is now live and shareable.')
      } else {
        toast.success('Page unpublished successfully.')
      }
    } catch (error: any) {
      console.error('Error publishing page:', error)
      toast.error('Failed to publish page: ' + (error.response?.data?.message || error.message))
    } finally {
      setIsPublishing(false)
    }
  }

  // Copy page URL to clipboard
  const handleCopyUrl = () => {
    if (pageUrl) {
      navigator.clipboard.writeText(pageUrl)
      alert('Page URL copied to clipboard!')
    }
  }

  // Apply design settings to preview
  const getCornerRadiusClass = () => {
    switch (selectedCornerRadius) {
      case 'sharp': return '0px'
      case 'regular': return '8px'
      case 'soft': return '16px'
      default: return '16px'
    }
  }

  const getBrandColorClass = () => {
    return selectedBrandColor
  }

  const themes = [
    { id: 'white', name: 'White', color: '#FFFFFF' },
    { id: 'dark', name: 'Dark', color: '#1F2937' },
    { id: 'orange', name: 'Orange', color: '#F97316' },
    { id: 'blue', name: 'Blue', color: '#3B82F6' }
  ]

  // Helper function to format property price
  const formatPropertyPrice = (property: Property) => {
    return `₱${property.price.toLocaleString('en-US')}${property.price_type ? `/${property.price_type}` : '/mo'}`
  }

  // Helper function to format property date
  const formatPropertyDate = (property: Property) => {
    if (property.published_at) {
      const date = new Date(property.published_at)
      return date.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    }
    return 'Recently'
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f6] font-inter text-[#111827]">
      {/* Top Bar */}
      <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-[100]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-gray-900 leading-none mb-1">Create New Blog</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              <span className="text-[11px] text-gray-500 italic">Draft - Last saved {lastSavedTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFullPreview(true)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium text-gray-700"
          >
            <FiEye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-4 py-1.5 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium text-gray-700"
          >
            Save as Draft
          </button>
          <button
            onClick={handlePublish}
            className="px-6 py-1.5 bg-[#d90429] hover:bg-[#b00421] text-white rounded-md transition-colors text-sm font-bold"
          >
            Publish
          </button>
        </div>
      </header>

      {/* Formatting Toolbar */}
      <div className="h-[50px] bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-[60px] z-[90]">
        <div className="flex items-center">
          <div className="flex items-center gap-1 pr-4 border-r border-gray-200 mr-4">
            <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"><FiRotateCcw className="w-4 h-4" /></button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"><FiRotateCw className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-1 pr-4 border-r border-gray-200 mr-4">
            <button className={`p-1.5 rounded transition-colors ${!sidebarCollapsed ? 'bg-gray-100 text-[#d90429]' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}><FiLayout className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><FiMonitor className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><FiTablet className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><FiSmartphone className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-2 pr-4 border-r border-gray-200 mr-4">
            <div className="relative">
              <select className="bg-gray-100 px-3 py-1 rounded text-xs font-semibold outline-none appearance-none cursor-pointer pr-6">
                <option>Inter</option>
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex items-center gap-1 ml-4 text-gray-500">
              <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">-</button>
              <input type="text" value="18" readOnly className="w-8 text-center text-xs font-bold bg-transparent outline-none text-gray-900" />
              <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">+</button>
            </div>
          </div>

          <div className="flex items-center gap-1 pr-4 border-r border-gray-200 mr-4 text-gray-500">
            <button className="p-1.5 hover:bg-gray-100 rounded"><FiBold className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><FiItalic className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><FiUnderline className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><FiType className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><FiLink className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-1 pr-4 border-r border-gray-200 mr-4 text-gray-500">
            <button className="p-1.5 bg-[#d9042915] text-[#d90429] rounded"><FiAlignLeft className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><FiAlignCenter className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><FiAlignRight className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded"><FiAlignJustify className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-1 text-gray-500">
            <button className="p-1.5 hover:bg-gray-100 rounded"><FiList className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded text-[10px] font-bold text-gray-600">
            <button className="p-0.5 hover:text-black">-</button>
            <span>100%</span>
            <button className="p-0.5 hover:text-black">+</button>
          </div>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-[320px] opacity-100'
            }`}
        >
          {/* Sidebar Tabs */}
          <div className="flex border-b border-gray-100 p-1">
            <button
              onClick={() => setLeftSidebarTab('library')}
              className={`flex-1 py-2 text-[10px] font-bold tracking-widest transition-all rounded ${leftSidebarTab === 'library'
                  ? 'bg-gray-100 text-[#d90429]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              LIBRARY
            </button>
            <button
              onClick={() => setLeftSidebarTab('settings')}
              className={`flex-1 py-2 text-[10px] font-bold tracking-widest transition-all rounded ${leftSidebarTab === 'settings'
                  ? 'bg-gray-100 text-[#d90429]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              SETTINGS
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {leftSidebarTab === 'library' ? (
              <div className="space-y-6">
                {/* Standard Blocks */}
                <section>
                  <h3 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Standard Blocks</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-lg hover:border-[#d90429] hover:bg-red-50/30 transition-all group">
                      <FiType className="w-5 h-5 text-gray-400 group-hover:text-[#d90429]" />
                      <span className="text-[10px] font-medium text-gray-600">Text</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-lg hover:border-[#d90429] hover:bg-red-50/30 transition-all group">
                      <FiImage className="w-5 h-5 text-gray-400 group-hover:text-[#d90429]" />
                      <span className="text-[10px] font-medium text-gray-600">Media</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-lg hover:border-[#d90429] hover:bg-red-50/30 transition-all group">
                      <FiList className="w-5 h-5 text-gray-400 group-hover:text-[#d90429]" />
                      <span className="text-[10px] font-medium text-gray-600">List</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-lg hover:border-[#d90429] hover:bg-red-50/30 transition-all group">
                      <FiLayers className="w-5 h-5 text-gray-400 group-hover:text-[#d90429]" />
                      <span className="text-[10px] font-medium text-gray-600">Button</span>
                    </button>
                  </div>
                </section>

                {/* Layout Blocks */}
                <section>
                  <h3 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Layout Blocks</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowAddSectionModal(true)}
                      className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-lg hover:border-[#d90429] hover:bg-red-50/30 transition-all group"
                    >
                      <FiLayout className="w-5 h-5 text-gray-400 group-hover:text-[#d90429]" />
                      <span className="text-[10px] font-medium text-gray-600">Section</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-lg hover:border-[#d90429] hover:bg-red-50/30 transition-all group">
                      <FiGrid className="w-5 h-5 text-gray-400 group-hover:text-[#d90429]" />
                      <span className="text-[10px] font-medium text-gray-600">Grid</span>
                    </button>
                  </div>
                </section>

                {/* Active Modules Toggle (Existing Sections) */}
                <section>
                  <h3 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Page Modules</h3>
                  <div className="space-y-1">
                    {Object.keys(sectionVisibility).map((key) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group">
                        <span className="text-xs text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <button
                          onClick={() => toggleSectionVisibility(key as any)}
                          className={`p-1 rounded transition-colors ${sectionVisibility[key as keyof typeof sectionVisibility] ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {sectionVisibility[key as keyof typeof sectionVisibility] ? <FiCheck className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Meta Details */}
                <section>
                  <h3 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Meta Details</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500">INTERNAL TITLE</label>
                      <input
                        type="text"
                        value={internalTitle}
                        onChange={(e) => setInternalTitle(e.target.value)}
                        placeholder="e.g. Summer Promotion 2026"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-[#d90429] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500">SUMMARY ABSTRACT</label>
                      <textarea
                        value={summaryAbstract}
                        onChange={(e) => setSummaryAbstract(e.target.value)}
                        placeholder="Brief summary for SEO..."
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-[#d90429] transition-colors resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500">URL SLUG</label>
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                        <span className="text-xs text-gray-400">/blog/</span>
                        <input
                          type="text"
                          value={urlSlug}
                          onChange={(e) => setUrlSlug(e.target.value)}
                          placeholder="summer-promo"
                          className="flex-1 bg-transparent text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Publishing Config */}
                <section>
                  <h3 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Publishing</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500">DATE</label>
                        <input
                          type="date"
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-[11px] outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500">TIME</label>
                        <input
                          type="time"
                          value={publishTime}
                          onChange={(e) => setPublishTime(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-[11px] outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500">TARGET PLATFORMS</label>
                      <div className="flex flex-wrap gap-2">
                        {['Facebook', 'LinkedIn', 'Website'].map(platform => (
                          <button
                            key={platform}
                            onClick={() => {
                              setTargetPlatforms(prev =>
                                prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
                              )
                            }}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${targetPlatforms.includes(platform)
                              ? 'bg-[#d90429] text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                          >
                            {platform}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto bg-[#f8f9fa] custom-scrollbar p-12 flex justify-center items-start">
          <div className="w-full max-w-[850px] bg-white shadow-2xl rounded-sm min-h-[1000px] flex flex-col">
            {/* Post Header */}
            <header className="p-12 border-b border-gray-100">
              <input
                type="text"
                value={mainHeading}
                onChange={(e) => setMainHeading(e.target.value)}
                placeholder="Post Title Goes Here..."
                className="w-full text-4xl font-extrabold text-gray-900 border-none outline-none placeholder:text-gray-200 mb-4"
              />
              <div className="flex items-center gap-6 text-xs text-gray-400 font-medium">
                <div className="flex items-center gap-2">
                  <FiUser className="w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Author"
                    className="bg-transparent border-none outline-none w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-3.5 h-3.5" />
                  <span>{publishDate || 'March 04, 2025'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="w-3.5 h-3.5" />
                  <span>5 min read</span>
                </div>
              </div>
            </header>

            {/* Editable Content Canvas */}
            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
              <div className="space-y-12">
                {activeTab === 'profile' ? (
                  profileLayoutSections.map((section, index) => (
                    <div key={section.id} className="relative group/section">
                      <p className="text-gray-400 text-center py-8 bg-gray-50 border border-dashed border-gray-100 rounded">
                        Profile Section: {section.name}
                      </p>
                    </div>
                  ))
                ) : (
                  layoutSections.map((section, index) => (
                    <div key={section.id} className="relative group/section">
                      <p className="text-gray-400 text-center py-8 bg-gray-50 border border-dashed border-gray-100 rounded">
                        Property Section: {section.name}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Section Tab */}
      {false && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Layout Manager</h2>
                <button
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  onClick={() => setShowAddSectionModal(true)}
                >
                  <FiPlus className="w-4 h-4" />
                  Add Section
                </button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={layoutSections.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2">
                    {layoutSections.map((section, index) => (
                      <div key={section.id}>
                        <SortableSectionItem section={section} index={index} />
                        {/* Section Styling Panel */}
                        {openSectionId === section.id && (
                          <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Section Styling</h4>
                            <div className="space-y-4">
                              {/* Layout Template */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Layout Template</label>
                                <select
                                  value={sectionStyles[section.id]?.layoutTemplate || 'default'}
                                  onChange={(e) => updateSectionStyle(section.id, { layoutTemplate: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="default">Default</option>
                                  <option value="centered">Centered</option>
                                  <option value="wide">Wide</option>
                                  <option value="narrow">Narrow</option>
                                  <option value="split">Split</option>
                                </select>
                              </div>

                              {/* Font Family */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Font Family</label>
                                <select
                                  value={sectionStyles[section.id]?.fontFamily || globalDesign.fontFamily}
                                  onChange={(e) => updateSectionStyle(section.id, { fontFamily: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="Inter">Inter</option>
                                  <option value="Roboto">Roboto</option>
                                  <option value="Open Sans">Open Sans</option>
                                  <option value="Lato">Lato</option>
                                  <option value="Montserrat">Montserrat</option>
                                  <option value="Poppins">Poppins</option>
                                </select>
                              </div>

                              {/* Font Size */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Font Size</label>
                                <select
                                  value={sectionStyles[section.id]?.fontSize || globalDesign.fontSize}
                                  onChange={(e) => updateSectionStyle(section.id, { fontSize: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="12px">12px</option>
                                  <option value="14px">14px</option>
                                  <option value="16px">16px</option>
                                  <option value="18px">18px</option>
                                  <option value="20px">20px</option>
                                  <option value="24px">24px</option>
                                </select>
                              </div>

                              {/* Text Color */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Text Color</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={sectionStyles[section.id]?.textColor || '#1F2937'}
                                    onChange={(e) => updateSectionStyle(section.id, { textColor: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={sectionStyles[section.id]?.textColor || '#1F2937'}
                                    onChange={(e) => updateSectionStyle(section.id, { textColor: e.target.value })}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="#1F2937"
                                  />
                                </div>
                              </div>

                              {/* Background Color */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Background Color</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={sectionStyles[section.id]?.backgroundColor || '#FFFFFF'}
                                    onChange={(e) => updateSectionStyle(section.id, { backgroundColor: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={sectionStyles[section.id]?.backgroundColor || '#FFFFFF'}
                                    onChange={(e) => updateSectionStyle(section.id, { backgroundColor: e.target.value })}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="#FFFFFF or transparent"
                                  />
                                </div>
                              </div>

                              {/* Padding */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Padding</label>
                                <select
                                  value={sectionStyles[section.id]?.padding || 'normal'}
                                  onChange={(e) => updateSectionStyle(section.id, { padding: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="small">Small</option>
                                  <option value="normal">Normal</option>
                                  <option value="large">Large</option>
                                </select>
                              </div>

                              {/* Border Style */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Border Style</label>
                                <select
                                  value={sectionStyles[section.id]?.borderStyle || 'none'}
                                  onChange={(e) => updateSectionStyle(section.id, { borderStyle: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="none">None</option>
                                  <option value="solid">Solid</option>
                                  <option value="dashed">Dashed</option>
                                  <option value="dotted">Dotted</option>
                                </select>
                              </div>

                              {/* Shadow */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Shadow</label>
                                <select
                                  value={sectionStyles[section.id]?.shadow || 'none'}
                                  onChange={(e) => updateSectionStyle(section.id, { shadow: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="none">None</option>
                                  <option value="small">Small</option>
                                  <option value="medium">Medium</option>
                                  <option value="large">Large</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )
      }

      {/* Design Tab */}
      {false && (
          <div className="flex flex-col gap-6">
            {/* Brand Color */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Brand Color</h3>
              <div className="flex items-center gap-4">
                {brandColors.map((color) => (
                  <button
                    key={color.id}
                    className={`w-16 h-16 rounded-full border-2 transition-all flex items-center justify-center ${selectedBrandColor === color.id
                      ? 'border-blue-600 ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400'
                      } ${color.id === 'white' ? 'border-gray-300' : ''}`}
                    style={{ backgroundColor: color.color }}
                    onClick={() => setSelectedBrandColor(color.id)}
                    aria-label={color.id}
                  >
                    {selectedBrandColor === color.id && (
                      <FiCheck className="w-6 h-6 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Radius */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Corner Radius</h3>
              <div className="flex gap-3">
                {cornerRadiusOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedCornerRadius === option.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    onClick={() => setSelectedCornerRadius(option.id)}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Font Family</h3>
              <select
                value={globalDesign.fontFamily}
                onChange={(e) => setGlobalDesign(prev => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Font Size</h3>
              <select
                value={globalDesign.fontSize}
                onChange={(e) => setGlobalDesign(prev => ({ ...prev, fontSize: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
              </select>
            </div>

            {/* Spacing */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Spacing</h3>
              <select
                value={globalDesign.spacing}
                onChange={(e) => setGlobalDesign(prev => ({ ...prev, spacing: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
                <option value="loose">Loose</option>
              </select>
            </div>

            {/* Border Style */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Border Style</h3>
              <select
                value={globalDesign.borderStyle}
                onChange={(e) => setGlobalDesign(prev => ({ ...prev, borderStyle: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>

            {/* Shadow */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Shadow</h3>
              <select
                value={globalDesign.shadow}
                onChange={(e) => setGlobalDesign(prev => ({ ...prev, shadow: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        )
      }

      {/* Save and Publish Buttons for Property Mode */}
      <div className="mt-6 flex flex-col gap-3 p-5 border-t border-gray-200 bg-white rounded-b-2xl">
        <button
          className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSaveChanges}
          disabled={isSaving || isLoading}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>

        {pageBuilderId && (
          <>
            <button
              className={`w-full px-4 py-2.5 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isPublished
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              onClick={handlePublish}
              disabled={isPublishing || isLoading}
            >
              {isPublishing ? 'Publishing...' : isPublished ? 'Unpublish Page' : 'Publish Page'}
            </button>

            {isPublished && pageUrl && (
              <div className="p-3 bg-gray-100 rounded-lg text-sm">
                <div className="mb-2 font-semibold text-gray-900">
                  Your Page URL:
                </div>
                <div className="flex gap-2 items-center break-all">
                  <a
                    href={pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 flex-1 break-all"
                  >
                    {pageUrl}
                  </a>
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Testimonial Form Component
function TestimonialForm({
  testimonial,
  availableTestimonials,
  onSave,
  onCancel
}: {
  testimonial: Testimonial | null
  availableTestimonials: Testimonial[]
  onSave: (testimonial: Testimonial) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(testimonial?.name || '')
  const [role, setRole] = useState(testimonial?.role || '')
  const [content, setContent] = useState(testimonial?.content || '')
  const [avatar, setAvatar] = useState(testimonial?.avatar || '')
  const [useExisting, setUseExisting] = useState(false)
  const [selectedTestimonialId, setSelectedTestimonialId] = useState<number | null>(null)

  const handleUseExisting = () => {
    if (selectedTestimonialId) {
      const selected = availableTestimonials.find(t => t.id === selectedTestimonialId)
      if (selected) {
        onSave(selected)
      }
    }
  }

  const handleSaveCustom = () => {
    if (!name || !content) {
      alert('Please fill in name and content')
      return
    }

    const newTestimonial: Testimonial = {
      id: testimonial?.id || Date.now(),
      name,
      role: role || '',
      content,
      avatar: avatar || null
    }
    onSave(newTestimonial)
  }

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <input
            type="checkbox"
            checked={useExisting}
            onChange={(e) => setUseExisting(e.target.checked)}
          />
          <span>Use existing testimonial</span>
        </label>
      </div>

      {useExisting ? (
        <>
          <select
            value={selectedTestimonialId || ''}
            onChange={(e) => setSelectedTestimonialId(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              marginBottom: '16px'
            }}
          >
            <option value="">Select a testimonial</option>
            {availableTestimonials.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} - {t.role}
              </option>
            ))}
          </select>
          {selectedTestimonialId && (
            <div style={{
              padding: '12px',
              background: '#F3F4F6',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              {(() => {
                const selected = availableTestimonials.find(t => t.id === selectedTestimonialId)
                return selected ? (
                  <>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{selected.name}</div>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>{selected.role}</div>
                    <div style={{ fontSize: '14px', fontStyle: 'italic' }}>"{selected.content}"</div>
                  </>
                ) : null
              })()}
            </div>
          )}
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Client Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '12px' }}
          />
          <input
            type="text"
            placeholder="Client Role (e.g., Lessee, Property Owner)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '12px' }}
          />
          <textarea
            placeholder="Testimonial content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '12px' }}
          />
          <input
            type="text"
            placeholder="Avatar URL (optional)"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px' }}
          />
        </>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          className="save-changes-button"
          onClick={useExisting ? handleUseExisting : handleSaveCustom}
          style={{ flex: 1 }}
          disabled={useExisting ? !selectedTestimonialId : (!name || !content)}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '14px 32px',
            background: '#F3F4F6',
            color: '#111827',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </>
  )
}

// Experience Stat Form Component
function ExperienceStatForm({
  stat,
  onSave,
  onCancel
}: {
  stat: { label: string; value: string } | null
  onSave: (label: string, value: string) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(stat?.label || '')
  const [value, setValue] = useState(stat?.value || '')

  return (
    <>
      <input
        type="text"
        placeholder="Label (e.g., Years of Experience)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '12px' }}
      />
      <input
        type="text"
        placeholder="Value (e.g., 5)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px' }}
      />
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          className="save-changes-button"
          onClick={() => onSave(label, value)}
          style={{ flex: 1 }}
          disabled={!label || !value}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '14px 32px',
            background: '#F3F4F6',
            color: '#111827',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </>
  )
}

