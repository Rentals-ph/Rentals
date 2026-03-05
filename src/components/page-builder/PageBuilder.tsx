'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '../../components/common/AppSidebar'
import AgentHeader from '../../components/agent/AgentHeader'
import { ASSETS } from '@/utils/assets'
import { pageBuilderApi, propertiesApi, testimonialsApi, apiClient } from '@/api'
import type { Property, Testimonial } from '@/types'
import Testimonials from '@/components/home/Testimonials'
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
  FiHome
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
  const [selectedTheme, setSelectedTheme] = useState('modernMinimal')
  const [isThemeModified, setIsThemeModified] = useState(false)
  const [showBio, setShowBio] = useState(true)
  const [showContactNumber, setShowContactNumber] = useState(true)
  const [showExperienceStats, setShowExperienceStats] = useState(false)
  const [showFeaturedListings, setShowFeaturedListings] = useState(true)
  const [showTestimonials, setShowTestimonials] = useState(true)
  const [bio, setBio] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [leftSidebarTab, setLeftSidebarTab] = useState('content')
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
    shadow: 'none',
    // Theme token fields
    colorPrimary: '#205ED7',
    colorBackground: '#FFFFFF',
    colorText: '#111827',
    colorAccent: '#F97316',
    fontHeading: 'Outfit, system-ui, sans-serif',
    fontBody: 'Inter, system-ui, sans-serif',
    fontSizeBase: 16,
    borderRadius: 16,
    spacingScale: 'normal',
    buttonVariant: 'filled',
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
  const [openContentSectionId, setOpenContentSectionId] = useState<string | null>(null)
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
    if (activeTab === 'profile' && leftSidebarTab === 'design') setLeftSidebarTab('content')
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
        className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${
          !section.visible ? 'opacity-50' : ''
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
      ? `₱${property.price.toLocaleString('en-US')}${
          property.price_type ? `/${property.price_type}` : '/mo'
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
    // Prefer theme/global setting; fall back to legacy preset mapping
    if (typeof (globalDesign as any).borderRadius === 'number') {
      return `${(globalDesign as any).borderRadius}px`
    }
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

  type ThemeId =
    | 'modernMinimal'
    | 'luxuryDark'
    | 'coastalLight'
    | 'boldUrban'
    | 'classicEstate'
    | 'midnightLuxury'

  interface Theme {
    id: ThemeId
    name: string
    vibe: string
    tokens: {
      colorPrimary: string
      colorBackground: string
      colorText: string
      colorAccent: string
      fontHeading: string
      fontBody: string
      fontSizeBase: number
      borderRadius: number
      spacingScale: 'compact' | 'normal' | 'relaxed'
      buttonVariant: 'filled' | 'outlined' | 'ghost'
    }
  }

  const BUILT_IN_THEMES: Theme[] = [
    {
      id: 'modernMinimal',
      name: 'Modern Minimal',
      vibe: 'Clean, white, single accent',
      tokens: {
        colorPrimary: '#2563EB',
        colorBackground: '#FFFFFF',
        colorText: '#111827',
        colorAccent: '#F97316',
        fontHeading: 'Outfit, system-ui, sans-serif',
        fontBody: 'Inter, system-ui, sans-serif',
        fontSizeBase: 16,
        borderRadius: 12,
        spacingScale: 'normal',
        buttonVariant: 'filled',
      },
    },
    {
      id: 'luxuryDark',
      name: 'Luxury Dark',
      vibe: 'Dark, gold, high-end',
      tokens: {
        colorPrimary: '#FACC15',
        colorBackground: '#020617',
        colorText: '#F9FAFB',
        colorAccent: '#EAB308',
        fontHeading: 'Playfair Display, ui-serif, Georgia, serif',
        fontBody: 'Inter, system-ui, sans-serif',
        fontSizeBase: 17,
        borderRadius: 16,
        spacingScale: 'relaxed',
        buttonVariant: 'filled',
      },
    },
    {
      id: 'coastalLight',
      name: 'Coastal Light',
      vibe: 'Airy, soft, coastal',
      tokens: {
        colorPrimary: '#0EA5E9',
        colorBackground: '#F9FAFB',
        colorText: '#0F172A',
        colorAccent: '#FBBF24',
        fontHeading: 'Outfit, system-ui, sans-serif',
        fontBody: 'Inter, system-ui, sans-serif',
        fontSizeBase: 16,
        borderRadius: 18,
        spacingScale: 'relaxed',
        buttonVariant: 'filled',
      },
    },
    {
      id: 'boldUrban',
      name: 'Bold Urban',
      vibe: 'High contrast, strong type',
      tokens: {
        colorPrimary: '#EF4444',
        colorBackground: '#F3F4F6',
        colorText: '#111827',
        colorAccent: '#3B82F6',
        fontHeading: 'Poppins, system-ui, sans-serif',
        fontBody: 'Inter, system-ui, sans-serif',
        fontSizeBase: 15,
        borderRadius: 8,
        spacingScale: 'compact',
        buttonVariant: 'filled',
      },
    },
    {
      id: 'classicEstate',
      name: 'Classic Estate',
      vibe: 'Traditional, premium, calm',
      tokens: {
        colorPrimary: '#0F766E',
        colorBackground: '#FEFCE8',
        colorText: '#1F2937',
        colorAccent: '#1D4ED8',
        fontHeading: 'Cormorant Garamond, ui-serif, Georgia, serif',
        fontBody: 'Inter, system-ui, sans-serif',
        fontSizeBase: 16,
        borderRadius: 14,
        spacingScale: 'normal',
        buttonVariant: 'outlined',
      },
    },
    {
      id: 'midnightLuxury',
      name: 'Midnight Luxury',
      vibe: 'Deep navy, gold highlights',
      tokens: {
        colorPrimary: '#715A5A',
        colorBackground: '#D3DAD9',
        colorText: '#44444E',
        colorAccent: '#44444E',
        fontHeading: 'Playfair Display, ui-serif, Georgia, serif',
        fontBody: 'Inter, system-ui, sans-serif',
        fontSizeBase: 17,
        borderRadius: 18,
        spacingScale: 'relaxed',
        buttonVariant: 'filled',
      },
    },
  ]

  const applyTheme = (theme: Theme) => {
    setSelectedTheme(theme.id)
    setIsThemeModified(false)

    // Map primary color to closest existing brand color for legacy styles
    const primary = theme.tokens.colorPrimary.toLowerCase()
    let brandId: string = 'blue'
    if (primary === '#ffffff') brandId = 'white'
    else if (primary === '#1f2937' || primary === '#020617') brandId = 'dark'
    else if (primary === '#f97316' || primary === '#fbbf24') brandId = 'orange'
    else brandId = 'blue'

    setSelectedBrandColor(brandId)

    // Map border radius to existing presets for legacy helpers
    let radiusPreset: 'sharp' | 'regular' | 'soft' = 'soft'
    if (theme.tokens.borderRadius <= 4) radiusPreset = 'sharp'
    else if (theme.tokens.borderRadius <= 12) radiusPreset = 'regular'
    else radiusPreset = 'soft'
    setSelectedCornerRadius(radiusPreset)

    setGlobalDesign((prev) => ({
      ...prev,
      fontFamily: theme.tokens.fontBody,
      fontSize: `${theme.tokens.fontSizeBase}px`,
      spacing: theme.tokens.spacingScale,
      colorPrimary: theme.tokens.colorPrimary,
      colorBackground: theme.tokens.colorBackground,
      colorText: theme.tokens.colorText,
      colorAccent: theme.tokens.colorAccent,
      fontHeading: theme.tokens.fontHeading,
      fontBody: theme.tokens.fontBody,
      fontSizeBase: theme.tokens.fontSizeBase,
      borderRadius: theme.tokens.borderRadius,
      spacingScale: theme.tokens.spacingScale,
      buttonVariant: theme.tokens.buttonVariant,
    }))

    setHasUnsavedChanges(true)
    addToHistory()
  }

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
    <div className="flex min-h-screen bg-gray-100 font-outfit"> {/* agent-dashboard */}
      <AppSidebar/>

      <main className="main-with-sidebar flex-1 min-h-screen"> {/* agent-main */}
        <div className="p-8 lg:py-6 md:py-4 md:pt-15">
          {userType === 'agent' ? (
            <AgentHeader 
              title={activeTab === 'profile' ? "Page Builder > Profile" : "Page Builder > Property"} 
              subtitle={activeTab === 'profile' ? "Customize your public profile page" : "Customize your property page"} 
            />
          ) : (
            <header className="mb-4 w-full">
              <div className="flex flex-col gap-1 w-full min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 m-0 mb-1 md:text-xl break-words">
                  {activeTab === 'profile' ? 'Page Builder > Profile' : 'Page Builder > Property'}
                </h1>
                <p className="text-sm text-gray-400 m-0 break-words">
                  {activeTab === 'profile' ? 'Customize your public profile page' : 'Customize your property page'}
                </p>
              </div>
            </header>
          )}
          
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              {/* Undo/Redo */}
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100"
                title="Undo (Ctrl+Z)"
              >
                <FiRotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100"
                title="Redo (Ctrl+Shift+Z)"
              >
                <FiRotateCw className="w-5 h-5" />
              </button>
              
              {/* Auto-save Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
                {autoSaveStatus === 'saved' && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Saved</span>
                  </>
                )}
                {autoSaveStatus === 'saving' && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-xs text-gray-600">Saving...</span>
                  </>
                )}
                {autoSaveStatus === 'unsaved' && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-gray-600">Unsaved changes</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">Save failed</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Show Preview - opens preview modal */}
              <button
                onClick={() => setShowFullPreview(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Toggle Preview (Ctrl+P)"
              >
                <FiEye className="w-4 h-4" />
                <span>Show Preview</span>
              </button>
              
              {/* Keyboard Shortcuts */}
              <button
                onClick={() => setShowShortcutsModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                title="Keyboard Shortcuts"
              >
                <FiHelpCircle className="w-5 h-5" />
              </button>
              
              {/* Full Preview - open whole page in new tab */}
              <button 
                className="inline-flex items-center gap-2 py-2 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg border-0 cursor-pointer transition-all duration-200 shadow-sm hover:bg-blue-700"
                onClick={() => {
                  const url = pageUrl || (pageSlug && typeof window !== 'undefined' ? `${window.location.origin}/page/${pageSlug}` : null)
                  if (url) {
                    window.open(url, '_blank', 'noopener,noreferrer')
                  } else {
                    toast.info('Save your page first to preview it in a new tab.')
                  }
                }}
                title="Open full page in new tab"
              >
                <FiExternalLink className="w-4 h-4" />
                <span>Full Preview</span>
              </button>
            </div>
          </div>
          
          {/* Loading Spinner */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {!isLoading && (

          <div className="grid grid-cols-[1fr_1fr] gap-6 lg:grid-cols-[1fr_2fr]"> {/* page-builder-container */}
          {/* Left Column - Customization */}
          <div className="flex flex-col gap-6"> {/* page-builder-left */}
            {activeTab === 'profile' ? (
              <>
                {/* Profile mode tabs: Content | Section */}
                <div className="bg-white rounded-2xl p-2 shadow-sm">
                  <div className="flex border-b border-gray-200">
                    <button
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        leftSidebarTab === 'content' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setLeftSidebarTab('content')}
                    >
                      Content
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        leftSidebarTab === 'section' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setLeftSidebarTab('section')}
                    >
                      Section
                    </button>
                  </div>
                </div>

                {leftSidebarTab === 'content' && (
                <>
                <div className="bg-white rounded-2xl p-6 shadow-sm"> {/* customize-section */}
                  <div className="flex items-start gap-4"> {/* customize-header */}
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"> {/* customize-icon-wrapper */}
                      <FiLayout className="text-xl" /> {/* customize-icon */}
                    </div>
                    <div className="flex-1"> {/* customize-content */}
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Customize your very own public page</h2> {/* customize-title */}
                      <p className="text-sm text-gray-600">Showcase your public page to anyone.</p> {/* customize-subtitle */}
                    </div>
                  </div>
                </div>

                {/* Profile Card Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Profile Card</h3>
                  <div className="flex flex-col gap-4">
                    <div className="relative w-20 h-20 mx-auto group">
                      <img 
                        src={profileCardImage || profileImage || ASSETS.PLACEHOLDER_PROFILE} 
                        alt="Profile Card" 
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <input
                          type="file"
                          ref={profileCardImageInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageInputChange(e, 'profileCard')}
                        />
                        <button 
                          className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors"
                          onClick={() => profileCardImageInputRef.current?.click()}
                        >
                          <FiUpload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your name"
                        value={profileCardName}
                        onChange={(e) => setProfileCardName(e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Property Agent"
                        value={profileCardRole}
                        onChange={(e) => setProfileCardRole(e.target.value)}
                      />
                    </div>
                    <textarea
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
                      placeholder="Your bio (uses Profile bio if empty)..."
                      value={profileCardBio}
                      onChange={(e) => setProfileCardBio(e.target.value)}
                    />
                  </div>
                </div>

                {/* Information Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Information</h3>
                  <div className="flex flex-col gap-4">
                    

                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-between flex-1 mr-4">
                        <span className="text-sm font-medium text-gray-900">Contact Number</span>
                        <span 
                          className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                          onClick={() => handleContactIconClick('phone')}
                        >
                          Edit
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showContactNumber}
                          onChange={(e) => setShowContactNumber(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center relative hover:bg-blue-200 transition-colors"
                        onClick={() => handleContactIconClick('email')}
                        title={contactInfo.email || 'Add Email'}
                      >
                        <FiMail className="w-5 h-5" />
                        <FiPlus className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full p-0.5" />
                      </button>
                      <button 
                        className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center relative hover:bg-blue-200 transition-colors"
                        onClick={() => handleContactIconClick('phone')}
                        title={contactInfo.phone || 'Add Phone'}
                      >
                        <FiPhone className="w-5 h-5" />
                        <FiPlus className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full p-0.5" />
                      </button>
                      <button 
                        className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center relative hover:bg-blue-200 transition-colors"
                        onClick={() => handleContactIconClick('message')}
                        title={contactInfo.message || 'Add Message'}
                      >
                        <FiMessageCircle className="w-5 h-5" />
                        <FiPlus className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full p-0.5" />
                      </button>
                      <button 
                        className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center relative hover:bg-blue-200 transition-colors"
                        onClick={() => handleContactIconClick('website')}
                        title={contactInfo.website || 'Add Website'}
                      >
                        <FiGlobe className="w-5 h-5" />
                        <FiPlus className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full p-0.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-between flex-1 mr-4">
                        <span className="text-sm font-medium text-gray-900">Experience Stats</span>
                        <span 
                          className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                          onClick={handleAddExperienceStat}
                        >
                          Add
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showExperienceStats}
                          onChange={(e) => setShowExperienceStats(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-between flex-1 mr-4">
                        <span className="text-sm font-medium text-gray-900">Featured Listings</span>
                        <span 
                          className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                          onClick={handleAddFeaturedListing}
                        >
                          {featuredListings.length > 0 ? 'Edit' : 'Add'}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showFeaturedListings}
                          onChange={(e) => setShowFeaturedListings(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      {featuredListings.length > 0 && (
                        <div className="ml-2 text-xs text-gray-500">
                          {featuredListings.length} listing{featuredListings.length !== 1 ? 's' : ''} selected
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-between flex-1 mr-4">
                        <span className="text-sm font-medium text-gray-900">Client Testimonials</span>
                        <span 
                          className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                          onClick={handleAddTestimonial}
                        >
                          {testimonials.length > 0 ? 'Edit' : 'Add'}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showTestimonials}
                          onChange={(e) => setShowTestimonials(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      {testimonials.length > 0 && (
                        <div className="ml-2 text-xs text-gray-500">
                          {testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''} added
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save and Publish Buttons for Profile Mode */}
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
                        className={`w-full px-4 py-2.5 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isPublished 
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
              </>
                )}
                {leftSidebarTab === 'section' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Layout Manager</h2>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Drag to reorder blocks. Toggle visibility with the eye icon.</p>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProfileDragEnd}>
                        <SortableContext items={profileLayoutSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                          <div className="flex flex-col gap-2">
                            {profileLayoutSections.map((section) => (
                              <div key={section.id}>
                                <SortableProfileSectionItem section={section} />
                              </div>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Property Mode Tabs */}
                <div className="bg-white rounded-2xl p-2 shadow-sm">
                  <div className="flex border-b border-gray-200">
                    <button
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        leftSidebarTab === 'content' 
                          ? 'border-blue-600 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setLeftSidebarTab('content')}
                    >
                      Content
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        leftSidebarTab === 'section' 
                          ? 'border-blue-600 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setLeftSidebarTab('section')}
                    >
                      Section
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        leftSidebarTab === 'design' 
                          ? 'border-blue-600 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setLeftSidebarTab('design')}
                    >
                      Design
                    </button>
                  </div>
                </div>
                

                {/* Content Tab - dynamic, section-driven */}
                {leftSidebarTab === 'content' && (
                  <div className="flex flex-col gap-4">
                    {layoutSections.map((section) => {
                      const isVisible =
                        (sectionVisibility as any)[section.id] ?? section.visible ?? true
                      const isOpen = openContentSectionId === section.id

                      const handleToggleOpen = () => {
                        setOpenContentSectionId((prev) =>
                          prev === section.id ? null : section.id
                        )
                      }

                      const commonHeader = (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={handleToggleOpen}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h3 className="text-sm font-semibold text-gray-800">
                                  {section.name}
                                </h3>
                                {!isVisible && (
                                  <p className="text-xs text-gray-500">
                                    Hidden in layout – still editable
                                  </p>
                                )}
                              </div>
                              <FiChevronDown
                                className={`w-4 h-4 text-gray-500 transition-transform ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </button>
                          <button
                            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                            onClick={() => toggleSectionVisibility(section.id)}
                            aria-label="Toggle visibility"
                          >
                            {isVisible ? (
                              <FiEye className="w-5 h-5" />
                            ) : (
                              <FiEyeOff className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      )

                      const panelBody = (() => {
                        switch (section.id) {
                          case 'hero':
                            return (
                              <div className="mt-4 flex flex-col gap-4">
                                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                                  {heroImage ? (
                                    <img
                                      src={heroImage}
                                      alt="Hero"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      No image
                                    </div>
                                  )}
                                </div>
                                <input
                                  type="file"
                                  ref={heroImageInputRef}
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageInputChange(e, 'hero')}
                                />
                                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                  <button
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg border-0 cursor-pointer transition-colors hover:bg-blue-700 flex-1"
                                    onClick={() => heroImageInputRef.current?.click()}
                                  >
                                    <FiUpload className="w-4 h-4" />
                                    Upload Custom Photo
                                  </button>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 flex-1"
                                    onClick={() => setShowPropertyImportModal(true)}
                                  >
                                    <FiHome className="w-4 h-4" />
                                    Use Existing Listing
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-2">
                                    <label className="text-xs font-medium text-gray-700">
                                      Main Heading
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Azure Residences"
                                      value={mainHeading}
                                      onChange={(e) => setMainHeading(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2 mb-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Tagline
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Luxury living redefined with..."
                                    value={tagline}
                                    onChange={(e) => setTagline(e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Overall Darkness
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={overallDarkness}
                                      onChange={(e) =>
                                        setOverallDarkness(Number(e.target.value))
                                      }
                                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                                      {overallDarkness}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )

                          case 'propertyDescription':
                            return (
                              <div className="mt-4">
                                <label className="text-xs font-medium text-gray-700 mb-2 block">
                                  Property Overview
                                </label>
                                <textarea
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                  value={propertyDescription}
                                  onChange={(e) =>
                                    setPropertyDescription(e.target.value)
                                  }
                                  rows={4}
                                  placeholder="Describe what it feels like to live in this property, highlight key features, and paint a story for the buyer or renter."
                                />
                              </div>
                            )

                          case 'propertyImages':
                            return (
                              <div className="mt-4">
                                <div className="grid grid-cols-3 gap-3">
                                  {propertyImages.map((image, index) => (
                                    <div
                                      key={index}
                                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                                    >
                                      <img
                                        src={image}
                                        alt={`Property ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500/90 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                        onClick={() => handleRemovePropertyImage(index)}
                                        aria-label="Remove image"
                                      >
                                        <FiX className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  <input
                                    type="file"
                                    ref={propertyImageInputRef}
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageInputChange(e, 'property')}
                                  />
                                  <button
                                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                                    onClick={() => propertyImageInputRef.current?.click()}
                                  >
                                    <FiPlus className="w-5 h-5" />
                                    <span className="text-xs font-medium">ADD</span>
                                  </button>
                                </div>
                              </div>
                            )

                          case 'propertyDetails':
                            return (
                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2 col-span-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Price
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="₱50,000 /mo"
                                    value={propertyPrice}
                                    onChange={(e) => setPropertyPrice(e.target.value)}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Bedrooms
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0"
                                    value={propertyBedrooms || ''}
                                    onChange={(e) =>
                                      setPropertyBedrooms(
                                        parseInt(e.target.value, 10) || 0
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Bathrooms
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0"
                                    value={propertyBathrooms || ''}
                                    onChange={(e) =>
                                      setPropertyBathrooms(
                                        parseInt(e.target.value, 10) || 0
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Garage
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0"
                                    value={propertyGarage || ''}
                                    onChange={(e) =>
                                      setPropertyGarage(
                                        parseInt(e.target.value, 10) || 0
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2 col-span-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Area (e.g. 120 sqm)
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="120 sqm"
                                    value={propertyArea}
                                    onChange={(e) => setPropertyArea(e.target.value)}
                                  />
                                </div>
                              </div>
                            )

                          case 'amenities':
                            return (
                              <div className="mt-4">
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {propertyAmenities.map((amenity, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-full"
                                    >
                                      {amenity}
                                      <button
                                        type="button"
                                        className="p-0.5 rounded-full hover:bg-gray-300 transition-colors"
                                        onClick={() =>
                                          setPropertyAmenities(
                                            propertyAmenities.filter((_, i) => i !== index)
                                          )
                                        }
                                        aria-label={`Remove ${amenity}`}
                                      >
                                        <FiX className="w-3.5 h-3.5" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Add amenity (e.g. Pool, Wi-Fi)"
                                    value={newAmenityInput}
                                    onChange={(e) => setNewAmenityInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault()
                                        const v = (e.target as HTMLInputElement).value.trim()
                                        if (v) {
                                          setPropertyAmenities([
                                            ...propertyAmenities,
                                            v,
                                          ])
                                          setNewAmenityInput('')
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => {
                                      const v = newAmenityInput.trim()
                                      if (v) {
                                        setPropertyAmenities([
                                          ...propertyAmenities,
                                          v,
                                        ])
                                        setNewAmenityInput('')
                                      }
                                    }}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            )

                          case 'contact':
                            return (
                              <div className="mt-4 grid grid-cols-1 gap-3">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Contact Name
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Your name or team"
                                    value={(contactInfo as any).name || ''}
                                    onChange={(e) =>
                                      setContactInfo((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Phone
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="+63 900 000 0000"
                                    value={contactInfo.phone}
                                    onChange={(e) =>
                                      setContactInfo((prev) => ({
                                        ...prev,
                                        phone: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="you@example.com"
                                    value={contactInfo.email}
                                    onChange={(e) =>
                                      setContactInfo((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Address
                                  </label>
                                  <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                    rows={2}
                                    placeholder="Building, street, city"
                                    value={(contactInfo as any).address || ''}
                                    onChange={(e) =>
                                      setContactInfo((prev) => ({
                                        ...prev,
                                        address: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                            )

                          case 'experience':
                            return (
                              <div className="mt-4 space-y-3">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Experience Heading
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Experience"
                                    value={(globalDesign as any).experienceHeading || ''}
                                    onChange={(e) =>
                                      setGlobalDesign((prev) => ({
                                        ...prev,
                                        experienceHeading: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Experience Body
                                  </label>
                                  <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                    rows={3}
                                    placeholder="Summarize your track record, years in the market, and why clients trust you."
                                    value={(globalDesign as any).experienceBody || ''}
                                    onChange={(e) =>
                                      setGlobalDesign((prev) => ({
                                        ...prev,
                                        experienceBody: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">
                                      Experience stats
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Edit the individual stats in the profile builder.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    onClick={handleAddExperienceStat}
                                  >
                                    Manage Stats
                                  </button>
                                </div>
                              </div>
                            )

                          case 'featured':
                            return (
                              <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">
                                      Featured Listings
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Choose which properties to highlight.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    onClick={handleAddFeaturedListing}
                                  >
                                    {featuredListings.length > 0 ? 'Edit' : 'Add'}
                                  </button>
                                </div>
                                {featuredListings.length > 0 && (
                                  <p className="text-xs text-gray-500">
                                    {featuredListings.length} listing
                                    {featuredListings.length !== 1 ? 's' : ''} selected
                                  </p>
                                )}
                              </div>
                            )

                          case 'testimonialsSection':
                            return (
                              <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">
                                      Client Testimonials
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Pick which testimonials to feature.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    onClick={handleAddTestimonial}
                                  >
                                    {testimonials.length > 0 ? 'Edit' : 'Add'}
                                  </button>
                                </div>
                                {testimonials.length > 0 && (
                                  <p className="text-xs text-gray-500">
                                    {testimonials.length} testimonial
                                    {testimonials.length !== 1 ? 's' : ''} selected
                                  </p>
                                )}
                              </div>
                            )

                          case 'readyToView':
                            return (
                              <div className="mt-4 space-y-3">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    CTA Heading
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ready To View?"
                                    value={(globalDesign as any).readyToViewHeading || ''}
                                    onChange={(e) =>
                                      setGlobalDesign((prev) => ({
                                        ...prev,
                                        readyToViewHeading: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Subtext
                                  </label>
                                  <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                    rows={2}
                                    placeholder="Schedule a tour or ask any questions about the property."
                                    value={(globalDesign as any).readyToViewSubtext || ''}
                                    onChange={(e) =>
                                      setGlobalDesign((prev) => ({
                                        ...prev,
                                        readyToViewSubtext: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    Default Form Message
                                  </label>
                                  <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                    rows={3}
                                    placeholder="Hi, I'm interested in this property. Can you tell me more?"
                                    value={contactFormMessage}
                                    onChange={(e) =>
                                      setContactFormMessage(e.target.value)
                                    }
                                  />
                                </div>
                              </div>
                            )

                          case 'profileCard':
                            return (
                              <div className="mt-4 flex flex-col gap-4">
                                <div className="relative w-20 h-20 mx-auto group">
                                  <img
                                    src={
                                      profileCardImage ||
                                      profileImage ||
                                      ASSETS.PLACEHOLDER_PROFILE
                                    }
                                    alt="Profile Card"
                                    className="w-full h-full rounded-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <input
                                      type="file"
                                      ref={profileCardImageInputRef}
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) =>
                                        handleImageInputChange(e, 'profileCard')
                                      }
                                    />
                                    <button
                                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors"
                                      onClick={() =>
                                        profileCardImageInputRef.current?.click()
                                      }
                                    >
                                      <FiUpload className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Your name"
                                    value={profileCardName}
                                    onChange={(e) => setProfileCardName(e.target.value)}
                                  />
                                  <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Property Agent"
                                    value={profileCardRole}
                                    onChange={(e) => setProfileCardRole(e.target.value)}
                                  />
                                </div>
                                <textarea
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
                                  placeholder="Your bio (uses Profile bio if empty)..."
                                  value={profileCardBio}
                                  onChange={(e) => setProfileCardBio(e.target.value)}
                                />
                              </div>
                            )

                          default:
                            return null
                        }
                      })()

                      return (
                        <div
                          key={section.id}
                          className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-opacity ${
                            isVisible ? '' : 'opacity-60'
                          }`}
                        >
                          {commonHeader}
                          {isOpen && panelBody && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              {panelBody}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Section Tab */}
                {leftSidebarTab === 'section' && (
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
                )}

                {/* Design Tab - Theme templates */}
                {leftSidebarTab === 'design' && (
                  <div className="flex flex-col gap-6">
                    {/* Theme Picker */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            Theme
                          </h3>
                          <p className="text-xs text-gray-500">
                            Choose a starting look for your page, then fine-tune below.
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {BUILT_IN_THEMES.map((theme) => {
                          const isSelected = selectedTheme === theme.id
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => applyTheme(theme)}
                              className={`w-full rounded-xl border text-left p-3 transition-all ${
                                isSelected
                                  ? 'border-blue-600 ring-2 ring-blue-200 bg-blue-50/50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-800">
                                  {theme.name}
                                </span>
                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                    <FiCheck className="w-3 h-3" />
                                    {isThemeModified ? 'Modified' : 'Active'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 mb-3 line-clamp-2">
                                {theme.vibe}
                              </p>
                              {/* Color strip preview */}
                              <div className="flex h-2 overflow-hidden rounded-full">
                                <div
                                  className="flex-1"
                                  style={{ backgroundColor: theme.tokens.colorBackground }}
                                />
                                <div
                                  className="flex-1"
                                  style={{ backgroundColor: theme.tokens.colorPrimary }}
                                />
                                <div
                                  className="flex-1"
                                  style={{ backgroundColor: theme.tokens.colorAccent }}
                                />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Customize */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                        Customize
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Colors */}
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'colorPrimary', label: 'Primary color' },
                            { key: 'colorBackground', label: 'Background' },
                            { key: 'colorText', label: 'Text' },
                            { key: 'colorAccent', label: 'Accent' },
                          ].map((token) => (
                            <div key={token.key} className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium text-gray-700">
                                {token.label}
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  className="w-9 h-9 border border-gray-300 rounded cursor-pointer flex-shrink-0"
                                  value={(globalDesign as any)[token.key]}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    setIsThemeModified(true)
                                    setGlobalDesign((prev) => ({
                                      ...prev,
                                      [token.key]: value,
                                    }))
                                  }}
                                />
                                <input
                                  type="text"
                                  className="flex-1 px-2.5 py-1 text-xs border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  value={(globalDesign as any)[token.key]}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    setIsThemeModified(true)
                                    setGlobalDesign((prev) => ({
                                      ...prev,
                                      [token.key]: value,
                                    }))
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Typography */}
                        <div className="grid grid-cols-1 gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Heading font
                              </label>
                              <select
                                value={globalDesign.fontHeading}
                                onChange={(e) => {
                                  setIsThemeModified(true)
                                  setGlobalDesign((prev) => ({
                                    ...prev,
                                    fontHeading: e.target.value,
                                  }))
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="Outfit, system-ui, sans-serif">Outfit</option>
                                <option value="Poppins, system-ui, sans-serif">Poppins</option>
                                <option value="Montserrat, system-ui, sans-serif">
                                  Montserrat
                                </option>
                                <option value="Playfair Display, ui-serif, Georgia, serif">
                                  Playfair Display
                                </option>
                                <option value="Cormorant Garamond, ui-serif, Georgia, serif">
                                  Cormorant Garamond
                                </option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Body font
                              </label>
                              <select
                                value={globalDesign.fontBody}
                                onChange={(e) => {
                                  setIsThemeModified(true)
                                  setGlobalDesign((prev) => ({
                                    ...prev,
                                    fontBody: e.target.value,
                                    fontFamily: e.target.value,
                                  }))
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="Inter, system-ui, sans-serif">Inter</option>
                                <option value="Roboto, system-ui, sans-serif">Roboto</option>
                                <option value="Open Sans, system-ui, sans-serif">
                                  Open Sans
                                </option>
                                <option value="Lato, system-ui, sans-serif">Lato</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Base font size
                              </label>
                              <input
                                type="number"
                                min={12}
                                max={22}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={globalDesign.fontSizeBase}
                                onChange={(e) => {
                                  const value = Number(e.target.value) || 16
                                  setIsThemeModified(true)
                                  setGlobalDesign((prev) => ({
                                    ...prev,
                                    fontSizeBase: value,
                                    fontSize: `${value}px`,
                                  }))
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Spacing
                              </label>
                              <select
                                value={globalDesign.spacingScale}
                                onChange={(e) => {
                                  setIsThemeModified(true)
                                  setGlobalDesign((prev) => ({
                                    ...prev,
                                    spacingScale: e.target.value,
                                    spacing: e.target.value,
                                  }))
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="compact">Compact</option>
                                <option value="normal">Normal</option>
                                <option value="relaxed">Relaxed</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Corners & Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Global corner radius
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={32}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={globalDesign.borderRadius}
                              onChange={(e) => {
                                const value = Number(e.target.value) || 0
                                setIsThemeModified(true)
                                setGlobalDesign((prev) => ({
                                  ...prev,
                                  borderRadius: value,
                                }))
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Button style
                            </label>
                            <select
                              value={globalDesign.buttonVariant}
                              onChange={(e) => {
                                setIsThemeModified(true)
                                setGlobalDesign((prev) => ({
                                  ...prev,
                                  buttonVariant: e.target.value as
                                    | 'filled'
                                    | 'outlined'
                                    | 'ghost',
                                }))
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="filled">Filled</option>
                              <option value="outlined">Outlined</option>
                              <option value="ghost">Ghost</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
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
                        className={`w-full px-4 py-2.5 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          isPublished 
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
              </>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'profile' 
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    Profile
                  </button>
                  <button
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'property' 
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('property')}
                  >
                    Property
                  </button>
                </div>
              </div>

              <div
                className="bg-gray-50 min-h-[1600px] overflow-y-auto p-6"
                style={{
                  backgroundColor: (globalDesign as any).colorBackground || '#F9FAFB',
                  color: (globalDesign as any).colorText || '#111827',
                  fontFamily: (globalDesign as any).fontBody || globalDesign.fontFamily,
                }}
              >
                {activeTab === 'profile' && (
                  <div className="bg-white rounded-2xl p-6">
                    {profileLayoutSections.map((section) => {
                      if (!section.visible) return null
                      switch (section.id) {
                        case 'profileHero':
                          return (
                            <div key={section.id} className="mb-6">
                              <div
                                className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-gray-200"
                                style={{
                                  backgroundImage: (profileCardImage || profileImage) ? `url(${profileCardImage || profileImage})` : 'none',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center'
                                }}
                              >
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
                                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{profileCardName || 'Your Name'}</h1>
                                  <p className="text-sm sm:text-base text-white/90">{profileCardRole || (profileCardBio || bio)?.slice(0, 80) || 'Your tagline'}</p>
                                </div>
                              </div>
                            </div>
                          )
                        case 'profileContactInfo':
                          return (
                            <div key={section.id} className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Contact</h4>
                              <div className="flex flex-wrap gap-3">
                                {contactInfo.email && (
                                  <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                                    <FiMail className="w-4 h-4" />
                                    <span className="truncate max-w-[200px]">{contactInfo.email}</span>
                                  </a>
                                )}
                                {showContactNumber && contactInfo.phone && (
                                  <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                                    <FiPhone className="w-4 h-4" />
                                    <span>{contactInfo.phone}</span>
                                  </a>
                                )}
                                {contactInfo.website && (
                                  <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                                    <FiGlobe className="w-4 h-4" />
                                    <span>Website</span>
                                  </a>
                                )}
                                {!contactInfo.email && !contactInfo.phone && !contactInfo.website && (
                                  <p className="text-sm text-gray-500 italic">Add contact info in Content</p>
                                )}
                              </div>
                            </div>
                          )
                        case 'profileBioAbout':
                          return (
                            <div key={section.id} className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                              <h3 className="text-lg font-bold text-gray-900 mb-2">About</h3>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{(profileCardBio || bio) || 'Your bio will appear here.'}</p>
                            </div>
                          )
                        case 'profileStatsBar':
                          return (
                            <div key={section.id} className="mb-6">
                              {showExperienceStats && experienceStats.length > 0 ? (
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                  <div className="flex flex-wrap gap-6 sm:gap-8 justify-center">
                                    {experienceStats.map((stat, index) => (
                                      <div key={index} className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                                        <div className="text-xs text-gray-600 uppercase tracking-wide">{stat.label}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-50 rounded-xl p-6 border border-dashed border-gray-200 text-center text-sm text-gray-500">Stats bar — add experience stats in Content</div>
                              )}
                            </div>
                          )
                        case 'profileActiveListings':
                          return (
                            <div key={section.id} className="mb-6">
                              {showFeaturedListings && featuredListings.length > 0 ? (
                                <>
                                  <h3 className="text-xl font-bold text-gray-900 mb-4">Active Listings</h3>
                                  <div className="flex gap-4 overflow-x-auto pb-2">
                                    {featuredListings.map((listing) => (
                                      <div key={listing.id} className="flex-shrink-0 w-72 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                        <div className="relative">
                                          <div className="w-full h-48 bg-gray-200">
                                            <img src={listing.image || ASSETS.PLACEHOLDER_PROPERTY} alt={listing.title} className="w-full h-full object-cover" />
                                          </div>
                                        </div>
                                        <div className="p-4">
                                          <div className="text-lg font-bold text-blue-600 mb-1">{formatPropertyPrice(listing)}</div>
                                          <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{listing.title}</div>
                                          <div className="text-xs text-gray-500">{listing.type}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="bg-gray-50 rounded-xl p-6 border border-dashed border-gray-200">
                                  <h3 className="text-lg font-bold text-gray-900 mb-2">Active Listings</h3>
                                  <p className="text-sm text-gray-500">Add featured listings in Content.</p>
                                </div>
                              )}
                            </div>
                          )
                        case 'profileClientReviews':
                          return (
                            <div key={section.id} className="mb-6">
                              {showTestimonials && testimonials.length > 0 ? (
                                <>
                                  <h3 className="text-xl font-bold text-gray-900 mb-4">Client Reviews</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {testimonials.map((testimonial) => (
                                      <div key={testimonial.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                            <img src={testimonial.avatar || ASSETS.PLACEHOLDER_PROFILE} alt={testimonial.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                          </div>
                                          <div className="text-sm font-semibold text-gray-900">{testimonial.name}</div>
                                        </div>
                                        <p className="text-sm text-gray-700 italic">"{testimonial.content}"</p>
                                        {testimonial.role && <div className="text-xs text-gray-500 mt-1">{testimonial.role}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="bg-gray-50 rounded-xl p-6 border border-dashed border-gray-200">
                                  <h3 className="text-lg font-bold text-gray-900 mb-2">Client Reviews</h3>
                                  <p className="text-sm text-gray-500">Add testimonials in Content.</p>
                                </div>
                              )}
                            </div>
                          )
                        case 'profileSocialLinks':
                          return (
                            <div key={section.id} className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Connect</h4>
                              <div className="flex flex-wrap gap-3">
                                {contactInfo.website && (
                                  <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm">
                                    <FiGlobe className="w-4 h-4" />
                                    <span>Website</span>
                                  </a>
                                )}
                                {contactInfo.email && (
                                  <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm">
                                    <FiMail className="w-4 h-4" />
                                    <span>Email</span>
                                  </a>
                                )}
                                {!contactInfo.website && !contactInfo.email && (
                                  <p className="text-sm text-gray-500 italic">Add website or email in Content to show links.</p>
                                )}
                              </div>
                            </div>
                          )
                        default:
                          return null
                      }
                    })}
                  </div>
                )}

                {activeTab === 'property' && (
                  <div
                    className="bg-white rounded-2xl p-6 px-4 sm:px-6 md:px-10"
                    style={{
                      backgroundColor: (globalDesign as any).colorBackground || '#FFFFFF',
                      color: (globalDesign as any).colorText || '#111827',
                      fontFamily: (globalDesign as any).fontBody || globalDesign.fontFamily,
                    }}
                  >
                    {/* Render sections in the order specified by layoutSections */}
                    {layoutSections.map((section) => {
                      if (!section.visible) return null
                      
                      switch (section.id) {
                        case 'hero':
                          return (
                            <div key={section.id} className="mb-6">
                              <div
                                className="relative w-full h-96 rounded-2xl overflow-hidden"
                                style={{
                                  backgroundImage: heroImage ? `url(${heroImage})` : 'none',
                                  backgroundColor: heroImage
                                    ? 'transparent'
                                    : (globalDesign as any).colorPrimary || '#E5E7EB',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  filter: `brightness(${100 - overallDarkness}%)`,
                                  borderRadius: getCornerRadiusClass(),
                                }}
                              >
                                <div
                                  className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                                  style={{
                                    background:
                                      'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.65))',
                                  }}
                                >
                                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{mainHeading || 'Property Title'}</h1>
                                  <p className="text-lg md:text-xl text-white/90 mb-6">{tagline || 'Property tagline will appear here...'}</p>
                                  <button
                                    className="px-6 py-3 font-semibold rounded-xl transition-colors"
                                    style={{
                                      backgroundColor:
                                        (globalDesign as any).colorPrimary || '#2563EB',
                                      color: '#FFFFFF',
                                    }}
                                  >
                                    Starts at {propertyPrice || 'Price'} /mo
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        
                        case 'propertyDescription':
                          return (
                            <div key={section.id} className="mb-6 sm:mb-8">
                              <h2
                                className="text-lg sm:text-xl font-bold mb-3 sm:mb-4"
                                style={{
                                  color: (globalDesign as any).colorText || '#111827',
                                  fontFamily:
                                    (globalDesign as any).fontHeading ||
                                    (globalDesign as any).fontBody ||
                                    globalDesign.fontFamily,
                                }}
                              >
                                Property Overview
                              </h2>
                              <p
                                className="text-base sm:text-xl leading-relaxed m-0 whitespace-pre-wrap"
                                style={{
                                  color: (globalDesign as any).colorText || '#4B5563',
                                  fontFamily:
                                    (globalDesign as any).fontBody || globalDesign.fontFamily,
                                  fontSize: `${
                                    (globalDesign as any).fontSizeBase || 16
                                  }px`,
                                }}
                              >
                                {propertyDescription || 'Property description will appear here...'}
                              </p>
                            </div>
                          )
                        
                        case 'propertyImages':
                          return (
                            <div key={section.id} className="mb-6">
                              <h2 className="text-2xl font-bold text-gray-900 mb-4">What's Inside?</h2>
                              <div className="grid grid-cols-3 gap-4">
                                {propertyImages.length > 0 ? (
                                  propertyImages.map((image, index) => (
                                    <div 
                                      key={index} 
                                      className="aspect-square rounded-lg overflow-hidden bg-gray-200"
                                      style={{ borderRadius: getCornerRadiusClass() }}
                                    >
                                      <img src={image} alt={`Interior ${index + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-500 italic col-span-3">Property images will appear here...</p>
                                )}
                              </div>
                            </div>
                          )
                        
                        case 'propertyDetails':
                          return (
                            <div key={section.id} className="mb-6 sm:mb-8">
                              <h2
                                className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4"
                                style={{
                                  color: (globalDesign as any).colorText || '#111827',
                                  fontFamily:
                                    (globalDesign as any).fontHeading ||
                                    (globalDesign as any).fontBody ||
                                    globalDesign.fontFamily,
                                }}
                              >
                                Property Details
                              </h2>
                              <div
                                className="flex flex-wrap gap-4 sm:gap-6 md:gap-10 text-base sm:text-xl"
                                style={{
                                  fontFamily:
                                    (globalDesign as any).fontBody || globalDesign.fontFamily,
                                  fontSize: `${
                                    ((globalDesign as any).fontSizeBase || 16) * 0.95
                                  }px`,
                                }}
                              >
                                <div className="flex items-center gap-2 text-gray-700">
                                  <svg className="w-6 h-6 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                  </svg>
                                  <span>{propertyBedrooms} Bedrooms</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <svg className="w-6 h-6 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 17h14v-5H5v5zM5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  <span>{propertyGarage} Garage</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <svg className="w-6 h-6 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
                                    <path d="M12 4v2M8 4v1M16 4v1" />
                                  </svg>
                                  <span>{propertyBathrooms} Bathrooms</span>
                                </div>
                                {propertyArea && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <span className="font-medium">{propertyArea}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        
                        case 'amenities':
                          return (
                            <div key={section.id} className="mb-6">
                              <h2 className="text-2xl font-bold text-gray-900 mb-3">Amenities</h2>
                              <div className="flex flex-wrap gap-2">
                                {propertyAmenities.length > 0 ? (
                                  propertyAmenities.map((amenity, index) => (
                                    <span key={index} className="rounded-full border-2 border-orange-500 px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700">
                                      {amenity}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-gray-500 italic">Add amenities in the left panel.</p>
                                )}
                              </div>
                            </div>
                          )
                        
                        case 'profileCard':
                          return (
                            <div 
                              key={section.id}
                              className="p-6 mb-6 text-white"
                              style={{
                                backgroundColor:
                                  (globalDesign as any).colorPrimary || '#3B82F6',
                                borderRadius: getCornerRadiusClass(),
                              }}
                            >
                              <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                  <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
                                    <img src={profileImage || profileCardImage || ASSETS.PLACEHOLDER_PROFILE} alt={profileCardName || 'Agent'} className="w-full h-full object-cover" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-white mb-1">{profileCardName || 'Your Name'}</h3>
                                  <p className="text-sm text-white/80 mb-3">{profileCardRole || 'Property Agent'}</p>
                                  <p className="text-sm text-white/90 mb-4">{bio || profileCardBio || 'Your bio from Profile page'}</p>
                                  <div className="flex items-center gap-3">
                                    {contactInfo.email && (
                                      <a href={`mailto:${contactInfo.email}`} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors flex items-center justify-center">
                                        <FiMail className="w-4 h-4" />
                                      </a>
                                    )}
                                    {contactInfo.phone && (
                                      <a href={`tel:${contactInfo.phone}`} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors flex items-center justify-center">
                                        <FiPhone className="w-4 h-4" />
                                      </a>
                                    )}
                                    {contactInfo.message && (
                                      <a href={contactInfo.message} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors flex items-center justify-center" target="_blank" rel="noopener noreferrer">
                                        <FiMessageCircle className="w-4 h-4" />
                                      </a>
                                    )}
                                    {contactInfo.website && (
                                      <a href={contactInfo.website} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors flex items-center justify-center" target="_blank" rel="noopener noreferrer">
                                        <FiGlobe className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        
                        default:
                          return null
                      }
                    })}

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          )}
        </div>
      </main>
      
      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit {editingContactType === 'email' ? 'Email' : editingContactType === 'phone' ? 'Phone' : editingContactType === 'message' ? 'Message' : 'Website'}</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowContactModal(false)}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <input
                type={editingContactType === 'email' ? 'email' : 'text'}
                placeholder={`Enter ${editingContactType === 'email' ? 'email address' : editingContactType === 'phone' ? 'phone number' : editingContactType === 'message' ? 'message' : 'website URL'}`}
                value={contactInfo[editingContactType as keyof typeof contactInfo] || ''}
                onChange={(e) => setContactInfo(prev => ({ ...prev, [editingContactType!]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <button 
                className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                onClick={handleContactSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Experience Stats Modal (temporarily simplified to avoid build errors) */}
      {showExperienceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowExperienceModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Experience Stats</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowExperienceModal(false)}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-sm text-gray-600">
              Editing of experience stats in this modal is temporarily disabled while the builder is being refactored. Existing stats will still appear in your preview.
            </div>
          </div>
        </div>
      )}
      
      {/* Property Import Modal */}
      {showPropertyImportModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPropertyImportModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Use Existing Listing</h3>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPropertyImportModal(false)}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {loadingProperties ? (
                <p className="text-gray-500 text-center py-5">Loading properties...</p>
              ) : availableProperties.length === 0 ? (
                <p className="text-gray-500 text-center py-5">
                  No properties available. Please create properties first.
                </p>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    Choose one of your existing listings to pre-fill this property page.
                    You can always tweak the content afterwards.
                  </p>
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                    {availableProperties.map((property) => {
                      const imageSrc =
                        property.image_url ||
                        property.image ||
                        (property.images_url && property.images_url.length > 0
                          ? property.images_url[0]
                          : ASSETS.PLACEHOLDER_PROPERTY)
                      const locationLabel =
                        property.location ||
                        property.city ||
                        property.state_province ||
                        property.country ||
                        ''
                      const priceLabel = property.price
                        ? `₱${property.price.toLocaleString('en-US')}${
                            property.price_type ? `/${property.price_type}` : '/mo'
                          }`
                        : ''

                      return (
                        <div
                          key={property.id}
                          className="flex gap-3 items-center border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:bg-gray-50 transition-colors"
                        >
                          <img
                            src={imageSrc}
                            alt={property.title}
                            className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1">{property.title}</div>
                            {locationLabel && (
                              <div className="text-xs text-gray-500">{locationLabel}</div>
                            )}
                            {priceLabel && (
                              <div className="text-xs text-blue-600 mt-1">{priceLabel}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => handleImportPropertyToPage(property)}
                          >
                            Use this listing
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Featured Listings Modal */}
      {showFeaturedListingsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFeaturedListingsModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">{editingListingIndex !== null ? 'Edit' : 'Add'} Featured Listing</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowFeaturedListingsModal(false)}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {loadingProperties ? (
                <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>Loading properties...</p>
              ) : availableProperties.length === 0 ? (
                <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>No properties available. Please create properties first.</p>
              ) : (
                <>
                  <p style={{ color: '#6B7280', marginBottom: '16px' }}>
                    Select a property to feature on your page:
                  </p>
                  <div style={{ display: 'grid', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                    {availableProperties.map((property) => (
                      <div
                        key={property.id}
                        onClick={() => handleSelectFeaturedListing(property)}
                        style={{
                          padding: '12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3B82F6'
                          e.currentTarget.style.background = '#F3F4F6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E5E7EB'
                          e.currentTarget.style.background = 'white'
                        }}
                      >
                        <img 
                          src={property.image || ASSETS.PLACEHOLDER_PROPERTY} 
                          alt={property.title}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{property.title}</div>
                          <div style={{ fontSize: '14px', color: '#6B7280' }}>{property.location}</div>
                          <div style={{ fontSize: '14px', color: '#3B82F6', marginTop: '4px' }}>
                            ₱{property.price.toLocaleString('en-US')}{property.price_type ? `/${property.price_type}` : '/mo'}
                          </div>
                        </div>
                        {featuredListings.some(l => l.id === property.id) && (
                          <FiCheck style={{ color: '#10B981', fontSize: '20px' }} />
                        )}
                      </div>
                    ))}
                  </div>
                  {featuredListings.length > 0 && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                      <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Selected Listings:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {featuredListings.map((listing, index) => (
                          <div
                            key={listing.id}
                            style={{
                              padding: '10px',
                              background: '#F3F4F6',
                              borderRadius: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ fontSize: '14px' }}>{listing.title}</span>
                            <button
                              onClick={() => handleRemoveFeaturedListing(index)}
                              style={{
                                padding: '4px 8px',
                                background: '#EF4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button 
                      className="px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => setShowFeaturedListingsModal(false)}
                      style={{ flex: 1 }}
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Testimonials Modal (temporarily simplified to avoid build errors) */}
      {showTestimonialsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTestimonialsModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Client Testimonials</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowTestimonialsModal(false)}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {testimonials.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Existing testimonials are shown below. Editing via this modal is temporarily disabled while the builder is being refactored.
                  </p>
                  <div className="space-y-2">
                    {testimonials.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        <div className="font-semibold text-sm">{testimonial.name}</div>
                        {testimonial.role && (
                          <div className="text-xs text-gray-500">{testimonial.role}</div>
                        )}
                        <div className="text-xs text-gray-700 italic mt-1">
                          "{testimonial.content}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  You don&apos;t have any testimonials yet. Add testimonials from your main profile or testimonials management screen.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page URL Modal */}
      {/* Toast Container */}
      <ToastContainer />
      
      {/* Add New Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddSectionModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Section</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowAddSectionModal(false)}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Enter section title"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section Type</label>
                <select
                  value={newSectionType}
                  onChange={(e) => setNewSectionType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="custom">Custom Content</option>
                  <option value="text">Text Block</option>
                  <option value="image">Image Block</option>
                  <option value="video">Video Block</option>
                </select>
              </div>
              {(newSectionType === 'custom' || newSectionType === 'text') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={newSectionContent}
                    onChange={(e) => setNewSectionContent(e.target.value)}
                    placeholder="Enter section content"
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    setShowAddSectionModal(false)
                    setNewSectionTitle('')
                    setNewSectionContent('')
                    setNewSectionType('custom')
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={addNewSection}
                  disabled={!newSectionTitle.trim()}
                >
                  Add Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcutsModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Save</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+S</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Undo</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+Z</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Redo</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+Shift+Z</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Toggle Preview</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+P</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Close Modal/Panel</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showPageUrlModal && pageUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPageUrlModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Your Page is Live! 🎉</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowPageUrlModal(false)}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p style={{ color: '#6B7280', marginBottom: '16px' }}>
                Your page has been published and is now accessible via the link below. Share it across multiple platforms!
              </p>
              <div style={{ 
                padding: '16px', 
                background: '#F3F4F6', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ marginBottom: '8px', fontWeight: '600', color: '#111827', fontSize: '14px' }}>
                  Page URL:
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  alignItems: 'center',
                  wordBreak: 'break-all'
                }}>
                  <a 
                    href={pageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#3B82F6', 
                      textDecoration: 'none',
                      flex: 1,
                      fontSize: '14px'
                    }}
                  >
                    {pageUrl}
                  </a>
                  <button
                    onClick={handleCopyUrl}
                    style={{
                      padding: '8px 16px',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="save-changes-button"
                  onClick={() => {
                    setShowPageUrlModal(false)
                    window.open(pageUrl, '_blank')
                  }}
                  style={{ flex: 1 }}
                >
                  <FiExternalLink style={{ marginRight: '8px' }} />
                  Open Page
                </button>
                <button 
                  className="save-changes-button"
                  onClick={() => setShowPageUrlModal(false)}
                  style={{ flex: 1, background: '#F3F4F6', color: '#111827' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
