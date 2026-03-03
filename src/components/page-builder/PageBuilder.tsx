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
  FiHome
} from 'react-icons/fi'

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
  const [contactFormName, setContactFormName] = useState('')
  const [contactFormEmail, setContactFormEmail] = useState('')
  const [contactFormMessage, setContactFormMessage] = useState('')
  
  // Section visibility states
  const [sectionVisibility, setSectionVisibility] = useState({
    hero: false,
    propertyDescription: true,
    propertyImages: true,
    profileCard: true
  })
  
  // Layout sections order
  const [layoutSections, setLayoutSections] = useState([
    { id: 'hero', name: 'Hero', visible: false },
    { id: 'propertyDescription', name: 'Property Description', visible: true },
    { id: 'propertyImages', name: 'Property Images', visible: true },
    { id: 'profileCard', name: 'Profile Card', visible: true }
  ])
  
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
      selectedBrandColor,
      selectedCornerRadius,
      globalDesign,
      sectionStyles,
    }
  }, [
    selectedTheme, showBio, showContactNumber, showExperienceStats, showFeaturedListings, showTestimonials,
    bio, profileImage, contactInfo, experienceStats, featuredListings, testimonials,
    heroImage, mainHeading, tagline, overallDarkness, propertyDescription, propertyImages, propertyPrice,
    profileCardName, profileCardRole, profileCardBio, profileCardImage,
    sectionVisibility, layoutSections, selectedBrandColor, selectedCornerRadius, globalDesign, sectionStyles
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
    if (state.profileCardName !== undefined) setProfileCardName(state.profileCardName)
    if (state.profileCardRole !== undefined) setProfileCardRole(state.profileCardRole)
    if (state.profileCardBio !== undefined) setProfileCardBio(state.profileCardBio)
    if (state.profileCardImage !== undefined) setProfileCardImage(state.profileCardImage)
    if (state.sectionVisibility !== undefined) setSectionVisibility(state.sectionVisibility)
    if (state.layoutSections !== undefined) setLayoutSections(state.layoutSections)
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
                profileCard: dataToUse.section_visibility.profileCard ?? true
              })
            }
            if (dataToUse.layout_sections) setLayoutSections(dataToUse.layout_sections)
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
      selected_brand_color: selectedBrandColor,
      selected_corner_radius: selectedCornerRadius,
      global_design: globalDesign,
      section_styles: sectionStyles,
    }
  }, [
    selectedTheme, bio, showBio, showContactNumber, showExperienceStats, showFeaturedListings, showTestimonials,
    profileImage, contactInfo, experienceStats, featuredListings, testimonials,
    heroImage, mainHeading, tagline, overallDarkness, propertyDescription, propertyImages, propertyPrice,
    profileCardName, profileCardRole, profileCardBio, profileCardImage,
    sectionVisibility, layoutSections, selectedBrandColor, selectedCornerRadius, globalDesign, sectionStyles
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
                

                {/* Content Tab */}
                {leftSidebarTab === 'content' && (
                  <div className="flex flex-col gap-6">
                    {/* Hero Settings */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Hero Settings</h3>
                        <button 
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          onClick={() => toggleSectionVisibility('hero')}
                          aria-label="Toggle visibility"
                        >
                          {sectionVisibility.hero ? (
                            <FiEye className="w-5 h-5" />
                          ) : (
                            <FiEyeOff className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                          {heroImage ? (
                            <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
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
                        <button 
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg border-0 cursor-pointer transition-colors hover:bg-blue-700"
                          onClick={() => heroImageInputRef.current?.click()}
                        >
                          <FiUpload className="w-4 h-4" />
                          Upload Custom Photo
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                          onClick={() => setShowPropertyImportModal(true)}
                        >
                          <FiHome className="w-4 h-4" />
                          Use Existing Listing
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-medium text-gray-700">Main Heading</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Azure Residences"
                            value={mainHeading}
                            onChange={(e) => setMainHeading(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-medium text-gray-700">Price</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="P1,200"
                            value={propertyPrice}
                            onChange={(e) => setPropertyPrice(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 mb-4">
                        <label className="text-xs font-medium text-gray-700">Tagline</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Luxury Living redefined with..."
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-gray-700">Overall Darkness</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={overallDarkness}
                            onChange={(e) => setOverallDarkness(Number(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <span className="text-sm font-medium text-gray-700 w-12 text-right">{overallDarkness}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Property Description */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Property Description</h3>
                        <button 
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          onClick={() => toggleSectionVisibility('propertyDescription')}
                          aria-label="Toggle visibility"
                        >
                          {sectionVisibility.propertyDescription ? (
                            <FiEye className="w-5 h-5" />
                          ) : (
                            <FiEyeOff className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                        value={propertyDescription}
                        onChange={(e) => setPropertyDescription(e.target.value)}
                        rows={4}
                        placeholder="Experience luxury living in the heart of the city. This stunning loft features floor-to-ceiling windows, premium appliances, and breathtaking views."
                      />
                    </div>

                    {/* Property Images */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Property Images</h3>
                        <button 
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          onClick={() => toggleSectionVisibility('propertyImages')}
                          aria-label="Toggle visibility"
                        >
                          {sectionVisibility.propertyImages ? (
                            <FiEye className="w-5 h-5" />
                          ) : (
                            <FiEyeOff className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {propertyImages.map((image, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img src={image} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
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

                {/* Design Tab */}
                {leftSidebarTab === 'design' && (
                  <div className="flex flex-col gap-6">
                    {/* Brand Color */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Brand Color</h3>
                      <div className="flex items-center gap-4">
                        {brandColors.map((color) => (
                          <button
                            key={color.id}
                            className={`w-16 h-16 rounded-full border-2 transition-all flex items-center justify-center ${
                              selectedBrandColor === color.id 
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
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              selectedCornerRadius === option.id 
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

              <div className="bg-gray-50 min-h-[1600px] overflow-y-auto p-6">
                {activeTab === 'profile' && (
                  <div className="bg-white rounded-2xl p-6">
                    {/* Profile Card Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Profile Image and Basic Info */}
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-shrink-0">
                          <div className="relative w-20 h-20 mb-3">
                            <img 
                              src={profileCardImage || profileImage || ASSETS.PLACEHOLDER_PROFILE} 
                              alt={profileCardName || 'Profile'}
                              className="w-full h-full rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{profileCardName || 'Your Name'}</h3>
                          {profileCardRole && <p className="text-sm text-gray-600 mb-2">{profileCardRole}</p>}
                        </div>

                        {/* Bio and Details */}
                        <div className="flex-1 min-w-0">
                          {profileCardBio && (
                            <p className="text-sm text-gray-700 mb-4">{profileCardBio}</p>
                          )}
                          
                          {/* Contact Information */}
                          {showContactNumber && (contactInfo.email || contactInfo.phone || contactInfo.website) && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Contact</h4>
                              <div className="flex flex-wrap gap-3">
                                {contactInfo.email && (
                                  <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 transition-colors">
                                    <FiMail className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[200px]">{contactInfo.email}</span>
                                  </a>
                                )}
                                {contactInfo.phone && (
                                  <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 transition-colors">
                                    <FiPhone className="w-3.5 h-3.5" />
                                    <span>{contactInfo.phone}</span>
                                  </a>
                                )}
                                {contactInfo.website && (
                                  <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 transition-colors">
                                    <FiGlobe className="w-3.5 h-3.5" />
                                    <span>Website</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Experience Stats */}
                          {showExperienceStats && experienceStats.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Experience</h4>
                              <div className="flex flex-wrap gap-4">
                                {experienceStats.map((stat, index) => (
                                  <div key={index} className="text-center">
                                    <div className="text-lg font-bold text-blue-600">{stat.value}</div>
                                    <div className="text-xs text-gray-600">{stat.label}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {showFeaturedListings && featuredListings.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Featured Listings</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {featuredListings.map((listing) => (
                            <div key={listing.id} className="flex-shrink-0 w-72 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                              <div className="relative">
                                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                                  <FiStar className="w-3 h-3 fill-current" />
                                  <span>Featured</span>
                                </div>
                                <div className="w-full h-48 bg-gray-200">
                                  <img src={listing.image || ASSETS.PLACEHOLDER_PROPERTY} alt={listing.title} className="w-full h-full object-cover" />
                                </div>
                                <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors shadow-sm" aria-label="Favorite">
                                  <FiHeart className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-lg font-bold text-blue-600">{formatPropertyPrice(listing)}</div>
                                </div>
                                <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{listing.title}</div>
                                <div className="text-xs text-gray-500 mb-3">{listing.type}</div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div>{formatPropertyDate(listing)}</div>
                                  <div className="flex items-center gap-1">
                                    <span>1</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {showTestimonials && testimonials.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Client Testimonials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {testimonials.map((testimonial) => (
                            <div key={testimonial.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                  <img 
                                    src={testimonial.avatar || ASSETS.PLACEHOLDER_PROFILE} 
                                    alt={testimonial.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm hidden">
                                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                </div>
                                <div className="text-sm font-semibold text-gray-900">{testimonial.name}</div>
                              </div>
                              <p className="text-sm text-gray-700 italic mb-2">"{testimonial.content}"</p>
                              {testimonial.role && (
                                <div className="text-xs text-gray-500">
                                  {testimonial.role}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'property' && (
                  <div className="bg-white rounded-2xl p-6 px-4 sm:px-6 md:px-10">
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
                                  backgroundColor: heroImage ? 'transparent' : '#E5E7EB',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  filter: `brightness(${100 - overallDarkness}%)`
                                }}
                              >
                                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center px-6">
                                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{mainHeading || 'Property Title'}</h1>
                                  <p className="text-lg md:text-xl text-white/90 mb-6">{tagline || 'Property tagline will appear here...'}</p>
                                  <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                                    Starts at {propertyPrice || 'Price'} /mo
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        
                        case 'propertyDescription':
                          return (
                            <div key={section.id} className="mb-6">
                              <h2 className="text-2xl font-bold text-gray-900 mb-3">About</h2>
                              <p className="text-gray-700 leading-relaxed">{propertyDescription || 'Property description will appear here...'}</p>
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
                        
                        case 'profileCard':
                          return (
                            <div 
                              key={section.id}
                              className="p-6 mb-6 text-white"
                              style={{
                                backgroundColor: selectedBrandColor === 'white' ? '#3B82F6' : 
                                               selectedBrandColor === 'dark' ? '#1F2937' :
                                               selectedBrandColor === 'orange' ? '#F97316' :
                                               selectedBrandColor === 'blue' ? '#3B82F6' : '#3B82F6',
                                borderRadius: getCornerRadiusClass()
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

                    {/* Contact Information Section */}
                    {showContactNumber && (contactInfo.email || contactInfo.phone || contactInfo.website || contactInfo.message) && (
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {contactInfo.phone && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <FiPhone className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Phone</div>
                                  <a href={`tel:${contactInfo.phone}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                    {contactInfo.phone}
                                  </a>
                                </div>
                              </div>
                            )}
                            {contactInfo.email && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <FiMail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Email</div>
                                  <a href={`mailto:${contactInfo.email}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                    {contactInfo.email}
                                  </a>
                                </div>
                              </div>
                            )}
                            {contactInfo.website && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <FiGlobe className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Website</div>
                                  <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                    Visit Website
                                  </a>
                                </div>
                              </div>
                            )}
                            {contactInfo.message && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <FiMessageCircle className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Message</div>
                                  <a href={contactInfo.message} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                    Send Message
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Experience Stats Section */}
                    {showExperienceStats && experienceStats.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {experienceStats.map((stat, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
                              <div className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</div>
                              <div className="text-sm text-gray-600">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Featured Listings Section */}
                    {showFeaturedListings && featuredListings.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Listings</h2>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {featuredListings.map((listing) => (
                            <div key={listing.id} className="flex-shrink-0 w-72 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                              <div className="relative">
                                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                                  <FiStar className="w-3 h-3 fill-current" />
                                  <span>Featured</span>
                                </div>
                                <div className="w-full h-48 bg-gray-200">
                                  <img src={listing.image || ASSETS.PLACEHOLDER_PROPERTY} alt={listing.title} className="w-full h-full object-cover" />
                                </div>
                                <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors shadow-sm" aria-label="Favorite">
                                  <FiHeart className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-lg font-bold text-blue-600">{formatPropertyPrice(listing)}</div>
                                </div>
                                <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{listing.title}</div>
                                <div className="text-xs text-gray-500 mb-3">{listing.type}</div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div>{formatPropertyDate(listing)}</div>
                                  <div className="flex items-center gap-1">
                                    <span>1</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Client Testimonials Section */}
                    {showTestimonials && testimonials.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Testimonials</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {testimonials.map((testimonial) => (
                            <div key={testimonial.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                  <img 
                                    src={testimonial.avatar || ASSETS.PLACEHOLDER_PROFILE} 
                                    alt={testimonial.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm hidden">
                                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                </div>
                                <div className="text-sm font-semibold text-gray-900">{testimonial.name}</div>
                              </div>
                              <p className="text-sm text-gray-700 italic mb-2">"{testimonial.content}"</p>
                              {testimonial.role && (
                                <div className="text-xs text-gray-500">
                                  {testimonial.role}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ready To View? Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready To View?</h2>
                        <p className="text-gray-600 mb-4">Schedule a tour or ask any questions about the property.</p>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 text-gray-700">
                            <FiPhone className="w-5 h-5 text-gray-500" />
                            <span>{contactInfo.phone || 'Phone number'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-700">
                            <FiMail className="w-5 h-5 text-gray-500" />
                            <span>{contactInfo.email || 'Email address'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact {profileCardName || 'Agent'}</h3>
                        <div className="flex flex-col gap-3">
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your name"
                            value={contactFormName}
                            onChange={(e) => setContactFormName(e.target.value)}
                          />
                          <input
                            type="email"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your email"
                            value={contactFormEmail}
                            onChange={(e) => setContactFormEmail(e.target.value)}
                          />
                          <textarea
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                            placeholder="Your message"
                            value={contactFormMessage}
                            onChange={(e) => setContactFormMessage(e.target.value)}
                            rows={4}
                          />
                          <button 
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={handleContactFormSubmit}
                            type="submit"
                          >
                            <span>Send Inquiry</span>
                            <FiMessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
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
      
      {/* Experience Stats Modal */}
      {showExperienceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowExperienceModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{editingStatIndex !== null ? 'Edit' : 'Add'} Experience Stat</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowExperienceModal(false)}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ExperienceStatForm
                stat={editingStatIndex !== null ? experienceStats[editingStatIndex] : null}
                onSave={handleSaveExperienceStat}
                onCancel={() => setShowExperienceModal(false)}
              />
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
      
      {/* Testimonials Modal */}
      {showTestimonialsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTestimonialsModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">{editingTestimonialIndex !== null ? 'Edit' : 'Add'} Testimonial</h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setShowTestimonialsModal(false)}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {testimonials.length > 0 && (
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Current Testimonials:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {testimonials.map((testimonial, index) => (
                      <div
                        key={testimonial.id}
                        style={{
                          padding: '12px',
                          background: '#F3F4F6',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{testimonial.name}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>{testimonial.role}</div>
                          <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>
                            "{testimonial.content.substring(0, 50)}..."
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setEditingTestimonialIndex(index)
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#3B82F6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTestimonial(index)}
                            style={{
                              padding: '6px 12px',
                              background: '#EF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <TestimonialForm
                testimonial={editingTestimonialIndex !== null ? testimonials[editingTestimonialIndex] : null}
                availableTestimonials={availableTestimonials}
                onSave={handleSaveTestimonial}
                onCancel={() => {
                  setShowTestimonialsModal(false)
                  setEditingTestimonialIndex(null)
                }}
              />
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

      {/* Full Page Preview Modal */}
      {showFullPreview && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowFullPreview(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {activeTab === 'profile' ? 'Profile Page Preview' : 'Property Page Preview'}
              </h2>
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowFullPreview(false)}
                aria-label="Close preview"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {activeTab === 'profile' ? (
                <div className="full-preview-page">
                  {/* Profile Preview */}
                  <div className="full-preview-profile-section">
                    <div className="full-preview-profile-header">
                      <div className="full-preview-profile-image-wrapper">
                        <img 
                          src={profileImage || ASSETS.PLACEHOLDER_PROFILE} 
                          alt="Profile"
                          className="full-preview-profile-image"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="full-preview-profile-fallback">JA</div>
                      </div>
                      <div className="full-preview-profile-info">
                        <h2 className="full-preview-name">{profileCardName || 'Your Name'}</h2>
                        {showBio && <p className="full-preview-tagline">{bio || 'Your bio will appear here...'}</p>}
                        {showContactNumber && (
                          <div className="full-preview-contact-icons">
                            {contactInfo.email && (
                              <button className="full-preview-contact-icon" title={contactInfo.email}>
                                <FiMail />
                              </button>
                            )}
                            {contactInfo.phone && (
                              <button className="full-preview-contact-icon" title={contactInfo.phone}>
                                <FiPhone />
                              </button>
                            )}
                            {contactInfo.message && (
                              <button className="full-preview-contact-icon" title={contactInfo.message}>
                                <FiMessageCircle />
                              </button>
                            )}
                            {contactInfo.website && (
                              <button className="full-preview-contact-icon" title={contactInfo.website}>
                                <FiGlobe />
                              </button>
                            )}
                          </div>
                        )}
                        {showExperienceStats && experienceStats.length > 0 && (
                          <div className="full-preview-experience-stats">
                            {experienceStats.map((stat, index) => (
                              <div key={index} className="full-preview-stat-item">
                                <div className="full-preview-stat-value">{stat.value}</div>
                                <div className="full-preview-stat-label">{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {showFeaturedListings && featuredListings.length > 0 && (
                    <div className="full-preview-featured-section">
                      <h3 className="full-preview-section-title">Featured Listings</h3>
                      <div className="full-preview-listings-grid">
                        {featuredListings.map((listing) => (
                          <div key={listing.id} className="full-preview-listing-card">
                            <div className="full-preview-listing-badge">
                              <FiStar className="full-preview-star-icon" />
                              <span>Featured</span>
                            </div>
                            <div className="full-preview-listing-image-wrapper">
                              <img src={listing.image || ASSETS.PLACEHOLDER_PROPERTY} alt={listing.title} />
                            </div>
                            <div className="full-preview-listing-info">
                              <div className="full-preview-listing-info-header">
                                <div className="full-preview-listing-price">{formatPropertyPrice(listing)}</div>
                                <button className="full-preview-listing-heart" aria-label="Favorite">
                                  <FiHeart />
                                </button>
                              </div>
                              <div className="full-preview-listing-title">{listing.title}</div>
                              <div className="full-preview-listing-category">{listing.type}</div>
                              <div className="full-preview-listing-info-footer">
                                <div className="full-preview-listing-date">{formatPropertyDate(listing)}</div>
                                <div className="full-preview-listing-view-count">
                                  <span>1</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showTestimonials && testimonials.length > 0 && (
                    <div className="full-preview-testimonials-section">
                      <h3 className="full-preview-section-title">Client Testimonials</h3>
                      <div className="full-preview-testimonials-grid">
                        {testimonials.map((testimonial) => (
                          <div key={testimonial.id} className="full-preview-testimonial-card">
                            <div className="full-preview-testimonial-header">
                              <img 
                                src={testimonial.avatar || ASSETS.PLACEHOLDER_PROFILE} 
                                alt={testimonial.name}
                                className="full-preview-testimonial-avatar"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              <div className="full-preview-testimonial-avatar-fallback">
                                {testimonial.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="full-preview-testimonial-name">{testimonial.name}</div>
                            </div>
                            <p className="full-preview-testimonial-quote">"{testimonial.content}"</p>
                            {testimonial.role && (
                              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                                {testimonial.role}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 px-4 sm:px-6 md:px-10">
                  {/* Property Preview */}
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
                                backgroundColor: heroImage ? 'transparent' : '#E5E7EB',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: `brightness(${100 - overallDarkness}%)`
                              }}
                            >
                              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center px-6">
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{mainHeading || 'Property Title'}</h1>
                                <p className="text-lg md:text-xl text-white/90 mb-6">{tagline || 'Property tagline will appear here...'}</p>
                                <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                                  Starts at {propertyPrice || 'Price'} /mo
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      
                      case 'propertyDescription':
                        return (
                          <div key={section.id} className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">About</h2>
                            <p className="text-gray-700 leading-relaxed">{propertyDescription || 'Property description will appear here...'}</p>
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
                      
                      case 'profileCard':
                        return (
                          <div 
                            key={section.id}
                            className="p-6 mb-6 text-white"
                            style={{
                              backgroundColor: selectedBrandColor === 'white' ? '#3B82F6' : 
                                             selectedBrandColor === 'dark' ? '#1F2937' :
                                             selectedBrandColor === 'orange' ? '#F97316' :
                                             selectedBrandColor === 'blue' ? '#3B82F6' : '#3B82F6',
                              borderRadius: getCornerRadiusClass()
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

                  {/* Contact Information Section */}
                  {showContactNumber && (contactInfo.email || contactInfo.phone || contactInfo.website || contactInfo.message) && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
                      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {contactInfo.phone && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <FiPhone className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Phone</div>
                                <a href={`tel:${contactInfo.phone}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                  {contactInfo.phone}
                                </a>
                              </div>
                            </div>
                          )}
                          {contactInfo.email && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <FiMail className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Email</div>
                                <a href={`mailto:${contactInfo.email}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                  {contactInfo.email}
                                </a>
                              </div>
                            </div>
                          )}
                          {contactInfo.website && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <FiGlobe className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Website</div>
                                <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                  Visit Website
                                </a>
                              </div>
                            </div>
                          )}
                          {contactInfo.message && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <FiMessageCircle className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Message</div>
                                <a href={contactInfo.message} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                  Send Message
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Experience Stats Section */}
                  {showExperienceStats && experienceStats.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {experienceStats.map((stat, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Featured Listings Section */}
                  {showFeaturedListings && featuredListings.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Listings</h2>
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {featuredListings.map((listing) => (
                          <div key={listing.id} className="flex-shrink-0 w-72 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                            <div className="relative">
                              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                                <FiStar className="w-3 h-3 fill-current" />
                                <span>Featured</span>
                              </div>
                              <div className="w-full h-48 bg-gray-200">
                                <img src={listing.image || ASSETS.PLACEHOLDER_PROPERTY} alt={listing.title} className="w-full h-full object-cover" />
                              </div>
                              <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors shadow-sm" aria-label="Favorite">
                                <FiHeart className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-lg font-bold text-blue-600">{formatPropertyPrice(listing)}</div>
                              </div>
                              <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{listing.title}</div>
                              <div className="text-xs text-gray-500 mb-3">{listing.type}</div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div>{formatPropertyDate(listing)}</div>
                                <div className="flex items-center gap-1">
                                  <span>1</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Client Testimonials Section */}
                  {showTestimonials && testimonials.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Testimonials</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testimonials.map((testimonial) => (
                          <div key={testimonial.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <img 
                                  src={testimonial.avatar || ASSETS.PLACEHOLDER_PROFILE} 
                                  alt={testimonial.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm hidden">
                                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-gray-900">{testimonial.name}</div>
                            </div>
                            <p className="text-sm text-gray-700 italic mb-2">"{testimonial.content}"</p>
                            {testimonial.role && (
                              <div className="text-xs text-gray-500">
                                {testimonial.role}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ready To View? Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready To View?</h2>
                      <p className="text-gray-600 mb-4">Schedule a tour or ask any questions about the property.</p>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-gray-700">
                          <FiPhone className="w-5 h-5 text-gray-500" />
                          <span>{contactInfo.phone || 'Phone number'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                          <FiMail className="w-5 h-5 text-gray-500" />
                          <span>{contactInfo.email || 'Email address'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact {profileCardName || 'Agent'}</h3>
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your name"
                          value={contactFormName}
                          onChange={(e) => setContactFormName(e.target.value)}
                        />
                        <input
                          type="email"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your email"
                          value={contactFormEmail}
                          onChange={(e) => setContactFormEmail(e.target.value)}
                        />
                        <textarea
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                          placeholder="Your message"
                          value={contactFormMessage}
                          onChange={(e) => setContactFormMessage(e.target.value)}
                          rows={4}
                        />
                        <button 
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                          onClick={handleContactFormSubmit}
                          type="submit"
                        >
                          <span>Send Inquiry</span>
                          <FiMessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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

