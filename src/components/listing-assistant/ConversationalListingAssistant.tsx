/**
 * Conversational Listing Assistant Component
 * Single-panel step-by-step conversational interface with button-driven flow
 */

import React, { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import 'leaflet/dist/leaflet.css'
import { MessageBubble, TypingIndicator } from './MessageBubble'
import { LocationPicker } from './LocationPicker'
import { InlineLocationMap } from './InlineLocationMap'
import { listingAssistantApi } from '../../api/endpoints/listingAssistant'
import type {
  ExtractedPropertyData,
  ListingAssistantMessage,
  DataWarning,
  UploadedImage,
} from '../../types/listingAssistant'
import {
  PROPERTY_TYPE_LABELS,
  FURNISHING_LABELS,
  LISTING_STATUS_LABELS,
  DESCRIPTION_TEMPLATES,
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  FIELD_LABELS,
  PropertyType,
  FurnishingStatus,
  ListingStatus,
  DescriptionTemplate,
} from '../../types/listingAssistant'

interface ConversationalListingAssistantProps {
  onListingSubmitted?: (propertyId: number) => void
  initialConversationId?: string
  onDataChange?: (data: ExtractedPropertyData) => void
}

type Step = 'property_name' | 'property_type' | 'location' | 'price' | 'price_type' | 'bedrooms' | 'bathrooms' | 'optional_fields' | 'images' | 'description' | 'review'

export function ConversationalListingAssistant({
  onListingSubmitted,
  initialConversationId,
  onDataChange,
}: ConversationalListingAssistantProps) {
  // State
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [messages, setMessages] = useState<ListingAssistantMessage[]>([])
  const [extractedData, setExtractedData] = useState<ExtractedPropertyData>({})
  const [skippedFields, setSkippedFields] = useState<string[]>([])
  const [warnings, setWarnings] = useState<DataWarning[]>([])
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [formReady, setFormReady] = useState(false)
  const [canGenerateDescription, setCanGenerateDescription] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step | null>(null)
  const [showPropertyCard, setShowPropertyCard] = useState(true)
  
  // UI State
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOptionalFields, setSelectedOptionalFields] = useState<string[]>([])
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [currentOptionalFieldIndex, setCurrentOptionalFieldIndex] = useState<number>(-1)
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null) // Track which field is showing custom input
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      if (initialConversationId) {
        try {
          const response = await listingAssistantApi.getConversation(initialConversationId)
          setConversationId(response.conversation_id)
          setMessages(response.messages || [])
          setExtractedData(response.extracted_data || {})
          setSkippedFields(response.skipped_fields || [])
          setMissingFields(response.missing_fields || [])
          setFormReady(response.form_ready)
          setCanGenerateDescription(response.can_generate_description)
          setCurrentStep((response.current_step as Step) || 'property_name')
        } catch (err: any) {
          console.error('Failed to load conversation:', err)
          // Fall back to starting a new conversation
          await startNewConversation()
        }
      } else {
        await startNewConversation()
      }
    }

    initConversation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId])

  // Start new conversation
  const startNewConversation = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await listingAssistantApi.startNewConversation()
      setConversationId(response.conversation_id)
      setMessages(response.messages || [])
      setExtractedData(response.extracted_data || {})
      setSkippedFields(response.skipped_fields || [])
      setMissingFields(response.missing_fields || [])
      setFormReady(response.form_ready)
      setCanGenerateDescription(response.can_generate_description)
      setCurrentStep((response.current_step as Step) || 'property_name')
    } catch (err: any) {
      console.error('Failed to start conversation:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to start conversation. Please check your connection and try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-save after each step
  const autoSave = useCallback(async () => {
    if (!conversationId) return
    
    try {
      await listingAssistantApi.autoSave(conversationId, currentStep || undefined, extractedData)
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }, [conversationId, currentStep, extractedData])

  // Auto-save when data changes
  useEffect(() => {
    if (conversationId && Object.keys(extractedData).length > 0) {
      const timer = setTimeout(() => {
        autoSave()
      }, 1000) // Debounce auto-save

      return () => clearTimeout(timer)
    }
  }, [extractedData, conversationId, autoSave])

  // Notify parent component of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(extractedData)
    }
  }, [extractedData, onDataChange])


  // Move to next optional field or images if done
  const moveToNextOptionalField = () => {
    const nextIndex = currentOptionalFieldIndex + 1
    if (nextIndex < selectedOptionalFields.length) {
      const nextField = selectedOptionalFields[nextIndex]
      const fieldLabel = FIELD_LABELS[nextField as keyof typeof FIELD_LABELS] || nextField
      setCurrentOptionalFieldIndex(nextIndex)
      
      const nextFieldMessage: ListingAssistantMessage = {
        role: 'assistant',
        content: `Great! Let's fill in ${fieldLabel}. ${getOptionalFieldPrompt(nextField)}`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, nextFieldMessage])
    } else {
      // All optional fields filled, move to images
      setCurrentOptionalFieldIndex(-1)
      setShowOptionalFields(false)
      setCurrentStep('images')
      handleNextStep('images')
    }
  }

  // Handle field selection via button
  const handleFieldSelection = async (field: string, value: string | number) => {
    if (!conversationId) return

    // Get display label for the value
    let displayValue = String(value)
    if (field === 'property_type') {
      displayValue = PROPERTY_TYPE_LABELS[value as PropertyType] || displayValue
    } else if (field === 'furnishing_status') {
      displayValue = FURNISHING_LABELS[value as FurnishingStatus] || displayValue
    } else if (field === 'status') {
      displayValue = LISTING_STATUS_LABELS[value as ListingStatus] || displayValue
    }

    // Add user message showing their selection
    const userMessage: ListingAssistantMessage = {
      role: 'user',
      content: displayValue,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    setIsLoading(true)
    setError(null)

    try {
      // Determine next step
      let nextStep: Step | undefined
      const stepOrder: Step[] = ['property_name', 'property_type', 'location', 'price', 'price_type', 'bedrooms', 'bathrooms']
      const currentIndex = stepOrder.indexOf(currentStep as Step)
      
      if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
        nextStep = stepOrder[currentIndex + 1]
      } else if (currentStep === 'bathrooms') {
        nextStep = 'optional_fields'
      }

      const response = await listingAssistantApi.setField(conversationId, field, value, nextStep)
      
      setExtractedData(response.extracted_data)
      setMissingFields(response.missing_fields)
      setFormReady(response.form_ready)
      setCurrentStep((response.current_step as Step) || null)
      
      // If this is an optional field being filled, don't show AI response or move step
      // The moveToNextOptionalField will handle it
      if (currentOptionalFieldIndex >= 0 && selectedOptionalFields.includes(field)) {
        // Don't add AI response or move step - moveToNextOptionalField will handle it
        setIsLoading(false)
        return
      }
      
      // Add AI response to messages
      const aiMessage: ListingAssistantMessage = {
        role: 'assistant',
        content: response.ai_response,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMessage])

      // Move to next step
      if (nextStep) {
        setTimeout(() => {
          handleNextStep(nextStep!)
        }, 500)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set field')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle next step
  const handleNextStep = (step: Step) => {
    setCurrentStep(step)
    
    let message = ''
    switch (step) {
      case 'property_name':
        message = "Let's start! What would you like to name this property listing?"
        break
      case 'property_type':
        message = "What type of property is this?"
        break
      case 'location':
        message = "Which city or area is this property located in?"
        break
      case 'price':
        message = "What's the asking price?"
        break
      case 'bedrooms':
        message = "How many bedrooms does it have?"
        break
      case 'bathrooms':
        message = "How many bathrooms?"
        break
      case 'optional_fields':
        message = "Great! All required fields are complete. Would you like to add more details to attract more buyers?"
        setShowOptionalFields(true)
        break
      case 'images':
        message = "Let's add some photos! Upload property images to showcase your listing."
        break
      case 'description':
        message = "Let's create a professional description. (Optional) Add any details about the property below, then choose a template style. You can switch templates anytime to see different styles."
        break
    }

    if (message) {
      const aiMessage: ListingAssistantMessage = {
        role: 'assistant',
        content: message,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMessage])
    }
  }

  // Handle custom input submission (for custom amenities, title types, etc.)
  const handleCustomInputSubmit = async () => {
    if (!inputValue.trim() || !conversationId || !showCustomInput) return

    const customValue = inputValue.trim()
    setInputValue('')
    setShowCustomInput(null)

    if (showCustomInput === 'amenities') {
      const currentAmenities = (extractedData.amenities || []) as string[]
      
      // Check if amenity already exists (case-insensitive)
      const alreadyExists = currentAmenities.some(a => a.toLowerCase() === customValue.toLowerCase())
      
      if (alreadyExists) {
        setError('This amenity is already added')
        return
      }
      
      const updatedAmenities = [...currentAmenities, customValue]
      
      setIsLoading(true)
      try {
        await listingAssistantApi.updateData(conversationId, { amenities: updatedAmenities })
        setExtractedData(prev => ({ ...prev, amenities: updatedAmenities }))
        
        // Don't add a user message - the button will appear automatically
        // Don't proceed to next field - wait for "Done" button
      } catch (err: any) {
        setError(err.message || 'Failed to add custom amenity')
      } finally {
        setIsLoading(false)
      }
    } else if (showCustomInput === 'title_type') {
      setIsLoading(true)
      try {
        await listingAssistantApi.setField(conversationId, 'title_type', customValue, undefined)
        setExtractedData(prev => ({ ...prev, title_type: customValue }))
        
        const userMessage: ListingAssistantMessage = {
          role: 'user',
          content: customValue,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, userMessage])
        
        // Move to next optional field
        moveToNextOptionalField()
      } catch (err: any) {
        setError(err.message || 'Failed to set title type')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle text input submission
  const handleTextSubmit = async () => {
    if (!inputValue.trim() || !conversationId) return

    // Check if user typed "Done, continue" or similar while in optional fields flow
    const inputLower = inputValue.trim().toLowerCase()
    if ((inputLower.includes('done') || inputLower.includes('continue') || inputLower.includes('skip')) && 
        currentOptionalFieldIndex >= 0 && selectedOptionalFields.length > 0) {
      // Skip current field and move to next
      moveToNextOptionalField()
      setInputValue('')
      return
    }

    const userMessage: ListingAssistantMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    const submittedValue = inputValue
    setInputValue('')

    setIsLoading(true)
    setError(null)

    try {
      // If we're in optional fields flow, use setField/updateData instead of processMessage
      // This prevents the AI from asking about already-filled required fields
      if (currentOptionalFieldIndex >= 0 && selectedOptionalFields.length > 0) {
        const currentField = selectedOptionalFields[currentOptionalFieldIndex]
        
        // Parse the value based on field type
        let parsedValue: string | number = submittedValue.trim()
        
        // Convert to number for numeric fields
        if (['parking_slots', 'hoa_fee', 'property_age', 'floor_level', 'area_sqm', 'lot_area_sqm'].includes(currentField)) {
          const numValue = parseFloat(parsedValue)
          if (!isNaN(numValue)) {
            parsedValue = numValue
          }
        }
        
        // Use setField for fields that support it, otherwise use updateData
        if (['parking_slots', 'hoa_fee', 'property_age', 'floor_level', 'area_sqm', 'lot_area_sqm', 'title_type', 'address'].includes(currentField)) {
          try {
            const response = await listingAssistantApi.setField(conversationId, currentField, parsedValue, undefined)
            setExtractedData(response.extracted_data)
            setMissingFields(response.missing_fields)
            setFormReady(response.form_ready)
            
            // Add user message
            const userMessage: ListingAssistantMessage = {
              role: 'user',
              content: submittedValue,
              timestamp: new Date().toISOString(),
            }
            setMessages(prev => [...prev, userMessage])
            
            // Move to next optional field
            moveToNextOptionalField()
            return
          } catch (err: any) {
            setError(err.message || 'Failed to save field')
            setIsLoading(false)
            return
          }
        } else {
          // For other optional fields, use updateData
          try {
            await listingAssistantApi.updateData(conversationId, { [currentField]: parsedValue })
            setExtractedData(prev => ({ ...prev, [currentField]: parsedValue }))
            
            // Add user message
            const userMessage: ListingAssistantMessage = {
              role: 'user',
              content: submittedValue,
              timestamp: new Date().toISOString(),
            }
            setMessages(prev => [...prev, userMessage])
            
            // Move to next optional field
            moveToNextOptionalField()
            return
          } catch (err: any) {
            setError(err.message || 'Failed to save field')
            setIsLoading(false)
            return
          }
        }
      }
      
      // Normal flow for required fields or when not in optional fields flow
      const response = await listingAssistantApi.processMessage(submittedValue, conversationId)
      
      setExtractedData(response.extracted_data)
      setMissingFields(response.missing_fields)
      setSkippedFields(response.skipped_fields)
      setFormReady(response.form_ready)
      setCanGenerateDescription(response.can_generate_description)
      
      // Update current step from response, or infer from missing fields
      let newStep = (response.current_step as Step) || null
      if (!newStep && response.missing_fields && response.missing_fields.length > 0) {
        const stepOrder: Step[] = ['property_name', 'property_type', 'location', 'price', 'price_type', 'bedrooms', 'bathrooms']
        const firstMissing = response.missing_fields[0]
        const stepIndex = REQUIRED_FIELDS.indexOf(firstMissing as any)
        if (stepIndex >= 0 && stepIndex < stepOrder.length) {
          newStep = stepOrder[stepIndex]
        }
      }
      setCurrentStep(newStep)
      
      setWarnings(response.warnings || [])

      const aiMessage: ListingAssistantMessage = {
        role: 'assistant',
        content: response.ai_response,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (err: any) {
      setError(err.message || 'Failed to process message')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get prompt for optional fields
  const getOptionalFieldPrompt = (field: string): string => {
    const prompts: Record<string, string> = {
      address: 'What is the full street address?',
      area_sqm: 'What is the floor area in square meters?',
      lot_area_sqm: 'What is the lot area in square meters?',
      parking_slots: 'How many parking slots are available?',
      amenities: 'What amenities does the property have? (e.g., pool, gym, security)',
      furnishing_status: 'What is the furnishing status?',
      hoa_fee: 'What is the monthly HOA fee?',
      property_age: 'How old is the property (in years)?',
      floor_level: 'What floor level is the property on?',
      title_type: 'What is the title type? (e.g., TCT, CCT)',
      status: 'What is the listing status?',
    }
    return prompts[field] || `Please provide ${FIELD_LABELS[field as keyof typeof FIELD_LABELS] || field}.`
  }

  // Get buttons for a specific message based on step (step-based, not text-based)
  const getButtonsForMessage = (message: ListingAssistantMessage, messageIndex: number): Array<{ label: string; value: string | number; onClick: () => void; variant?: 'default' | 'selected' | 'primary' | 'success' }> => {
    // Only show buttons for assistant messages
    if (message.role !== 'assistant') {
      return []
    }

    // Only show buttons for the latest message
    const isLatestMessage = messageIndex === messages.length - 1
    if (!isLatestMessage) {
      return []
    }

    // Don't show buttons if we're loading (waiting for response)
    if (isLoading) {
      return []
    }

    // Infer step from missing fields if currentStep is not set
    let stepToUse = currentStep
    if (!stepToUse && missingFields.length > 0) {
      const stepOrder: Step[] = ['property_name', 'property_type', 'location', 'price', 'price_type', 'bedrooms', 'bathrooms']
      const firstMissing = missingFields[0]
      const stepIndex = REQUIRED_FIELDS.indexOf(firstMissing as any)
      if (stepIndex >= 0 && stepIndex < stepOrder.length) {
        stepToUse = stepOrder[stepIndex]
      }
    }

    const buttons: Array<{ label: string; value: string | number; onClick: () => void; variant?: 'default' | 'selected' | 'primary' | 'success' }> = []

    // Check for optional fields flow FIRST (before any step checks)
    // This ensures buttons for specific optional fields show when we're asking about them
    if (currentOptionalFieldIndex >= 0 && selectedOptionalFields.length > 0) {
      const currentField = selectedOptionalFields[currentOptionalFieldIndex]
      
      // Furnishing Status
      if (currentField === 'furnishing_status') {
        Object.entries(FURNISHING_LABELS).forEach(([value, label]) => {
          buttons.push({
            label,
            value,
            onClick: async () => {
              if (!conversationId) return
              await handleFieldSelection('furnishing_status', value)
              moveToNextOptionalField()
            },
          })
        })
        return buttons
      }
      // Listing Status
      else if (currentField === 'status') {
        Object.entries(LISTING_STATUS_LABELS).forEach(([value, label]) => {
          buttons.push({
            label,
            value,
            onClick: async () => {
              if (!conversationId) return
              await handleFieldSelection('status', value)
              moveToNextOptionalField()
            },
          })
        })
        return buttons
      }
      // Price Type (optional)
      else if (currentField === 'price_type') {
        const priceTypeOptions = [
          { value: 'Monthly', label: 'Monthly' },
          { value: 'Weekly', label: 'Weekly' },
          { value: 'Daily', label: 'Daily' },
          { value: 'Yearly', label: 'Yearly' },
        ]
        priceTypeOptions.forEach(option => {
          buttons.push({
            label: option.label,
            value: option.value,
            onClick: async () => {
              if (!conversationId) return
              await handleFieldSelection('price_type', option.value)
              moveToNextOptionalField()
            },
          })
        })
        return buttons
      }
      // Parking Slots
      else if (currentField === 'parking_slots') {
        const parkingOptions = [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5+' },
        ]
        parkingOptions.forEach(option => {
          buttons.push({
            label: option.label,
            value: option.value,
            onClick: async () => {
              if (!conversationId) return
              await handleFieldSelection('parking_slots', parseInt(option.value))
              moveToNextOptionalField()
            },
          })
        })
        return buttons
      }
      // Amenities (multi-select)
      else if (currentField === 'amenities') {
        const commonAmenities = [
          'Swimming Pool',
          'Gym / Fitness Center',
          'Security',
          'Parking',
          'Elevator',
          'Garden',
          'Rooftop Garden',
          'Concierge',
          "Maid's Room",
          'Air Conditioning',
          'Wi-Fi Internet',
          'Pet-Friendly',
          'Balcony',
          'Laundry',
          '24/7 Security',
          'CCTV',
          'Fire Safety',
        ]
        
        const currentAmenities = (extractedData.amenities || []) as string[]
        
        // Get custom amenities (amenities that are not in the common list)
        const customAmenities = currentAmenities.filter(a => !commonAmenities.includes(a))
        
        // Combine common and custom amenities, with custom ones at the end
        const allAmenities = [...commonAmenities, ...customAmenities]
        
        allAmenities.forEach(amenity => {
          const isSelected = currentAmenities.includes(amenity)
          buttons.push({
            label: isSelected ? `✓ ${amenity}` : amenity,
            value: amenity,
            variant: isSelected ? 'selected' : 'default',
            onClick: async () => {
              if (!conversationId) return
              
              let updatedAmenities: string[]
              if (isSelected) {
                updatedAmenities = currentAmenities.filter(a => a !== amenity)
              } else {
                updatedAmenities = [...currentAmenities, amenity]
              }
              
              setIsLoading(true)
              try {
                await listingAssistantApi.updateData(conversationId, { amenities: updatedAmenities })
                setExtractedData(prev => ({ ...prev, amenities: updatedAmenities }))
              } catch (err: any) {
                setError(err.message || 'Failed to update amenities')
              } finally {
                setIsLoading(false)
              }
            },
          })
        })
        
        // Add "Add Custom" button to allow users to add amenities not in the list
        buttons.push({
          label: '+ Add Custom',
          value: 'custom',
          variant: 'default',
          onClick: () => {
            setShowCustomInput('amenities')
          },
        })
        
        // Add "Done" button when at least one amenity is selected
        if (currentAmenities.length > 0) {
          buttons.push({
            label: 'Done',
            value: 'done',
            variant: 'success',
            onClick: () => {
              moveToNextOptionalField()
            },
          })
        }
        return buttons
      }
      // Title Type - show common options + custom option
      else if (currentField === 'title_type') {
        const commonTitleTypes = ['TCT', 'CCT', 'Tax Declaration', 'Condominium Certificate of Title']
        commonTitleTypes.forEach(titleType => {
          buttons.push({
            label: titleType,
            value: titleType,
            onClick: async () => {
              if (!conversationId) return
              await handleFieldSelection('title_type', titleType)
              moveToNextOptionalField()
            },
          })
        })
        buttons.push({
          label: '+ Add Custom',
          value: 'custom',
          variant: 'default',
          onClick: () => {
            setShowCustomInput('title_type')
          },
        })
        return buttons
      }
      // For other optional fields without buttons (address, area_sqm, etc.), return empty array
      // User can type the value
      else {
        return []
      }
    }

    // Must have a step to show buttons
    if (!stepToUse) {
      return []
    }

    // Step 2: Property Type
    if (stepToUse === 'property_type') {
      Object.entries(PROPERTY_TYPE_LABELS).forEach(([value, label]) => {
        buttons.push({
          label,
          value,
          onClick: () => handleFieldSelection('property_type', value),
        })
      })
    }

    // Step 3: Location - no buttons (map will be shown instead)
    else if (stepToUse === 'location') {
      // No buttons - map will be rendered separately
      return []
    }

    // Step 5: Price Type (after price)
    else if (stepToUse === 'price_type') {
      const priceTypeOptions = [
        { value: 'Monthly', label: 'Monthly' },
        { value: 'Weekly', label: 'Weekly' },
        { value: 'Daily', label: 'Daily' },
        { value: 'Yearly', label: 'Yearly' },
      ]
      priceTypeOptions.forEach(option => {
        buttons.push({
          label: option.label,
          value: option.value,
          onClick: () => handleFieldSelection('price_type', option.value),
        })
      })
    }

    // Step 6: Bedrooms
    else if (stepToUse === 'bedrooms') {
      const bedroomOptions = [
        { value: '0', label: 'Studio' },
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5+' },
      ]
      bedroomOptions.forEach(option => {
        buttons.push({
          label: option.label,
          value: option.value,
          onClick: () => handleFieldSelection('bedrooms', option.value),
        })
      })
    }

    // Step 7: Bathrooms
    else if (stepToUse === 'bathrooms') {
      const bathroomOptions = [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4+' },
      ]
      bathroomOptions.forEach(option => {
        buttons.push({
          label: option.label,
          value: option.value,
          onClick: () => handleFieldSelection('bathrooms', option.value),
        })
      })
    }

    // After required fields: Yes/No for optional fields
    else if (stepToUse === 'optional_fields') {
      
      // Check if user already said yes
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()
      const userSaidYes = lastUserMessage?.content.toLowerCase().includes('yes') || showOptionalFields
      
      if (!userSaidYes) {
        // Show Yes/No buttons
        buttons.push(
          {
            label: 'Yes, add more details',
            value: 'yes',
            onClick: async () => {
              if (!conversationId) return
              setShowOptionalFields(true)
              const userMessage: ListingAssistantMessage = {
                role: 'user',
                content: 'Yes, add more details',
                timestamp: new Date().toISOString(),
              }
              setMessages(prev => [...prev, userMessage])
            },
          },
          {
            label: 'No, continue',
            value: 'no',
            onClick: async () => {
              if (!conversationId) return
              setShowOptionalFields(false)
              setCurrentStep('images')
              handleNextStep('images')
              const userMessage: ListingAssistantMessage = {
                role: 'user',
                content: 'No, continue',
                timestamp: new Date().toISOString(),
              }
              setMessages(prev => [...prev, userMessage])
            },
          }
        )
      } else {
        // Show optional field chips as toggleable buttons
        OPTIONAL_FIELDS.filter(f => f !== 'description' && f !== 'images' && f !== 'latitude' && f !== 'longitude').forEach(field => {
          const isSelected = selectedOptionalFields.includes(field)
          buttons.push({
            label: isSelected ? `✓ ${FIELD_LABELS[field as keyof typeof FIELD_LABELS]}` : FIELD_LABELS[field as keyof typeof FIELD_LABELS],
            value: field,
            variant: isSelected ? 'selected' : 'default',
            onClick: () => {
              if (selectedOptionalFields.includes(field)) {
                setSelectedOptionalFields(prev => prev.filter(f => f !== field))
              } else {
                setSelectedOptionalFields(prev => [...prev, field])
              }
            },
          })
        })
        
        buttons.push({
          label: 'Done, continue',
          value: 'done',
          variant: 'success',
          onClick: async () => {
            if (!conversationId) return
            
            const userMessage: ListingAssistantMessage = {
              role: 'user',
              content: 'Done, continue',
              timestamp: new Date().toISOString(),
            }
            setMessages(prev => [...prev, userMessage])
            
            // If user selected optional fields, ask about the first one
            // Otherwise, move to images
            if (selectedOptionalFields.length > 0) {
              // Ask about the first selected optional field
              const firstField = selectedOptionalFields[0]
              const fieldLabel = FIELD_LABELS[firstField as keyof typeof FIELD_LABELS] || firstField
              setCurrentOptionalFieldIndex(0)
              
              // Check if field has predefined options (show buttons)
              const hasButtons = ['furnishing_status', 'status', 'price_type'].includes(firstField)
              
              const aiMessage: ListingAssistantMessage = {
                role: 'assistant',
                content: `Great! Let's fill in ${fieldLabel}. ${getOptionalFieldPrompt(firstField)}`,
                timestamp: new Date().toISOString(),
              }
              setMessages(prev => [...prev, aiMessage])
              
              // Don't change step yet - let the user fill in the optional fields
            } else {
              // No optional fields selected, move to images
              setShowOptionalFields(false)
              setCurrentOptionalFieldIndex(-1)
              setCurrentStep('images')
              handleNextStep('images')
            }
          },
        })
      }
    }


    // Description Template selection
    else if (stepToUse === 'description') {
      // Show all template buttons, with current template marked as selected
      const currentTemplate = extractedData.description_template || 'narrative'
      
      Object.entries(DESCRIPTION_TEMPLATES).forEach(([value, template]) => {
        const isSelected = value === currentTemplate && extractedData.description
        buttons.push({
          label: isSelected ? `✓ ${template.label}` : template.label,
          value,
          variant: isSelected ? 'selected' : 'default',
          onClick: async () => {
            if (!conversationId) return
            
            const userMessage: ListingAssistantMessage = {
              role: 'user',
              content: template.label,
              timestamp: new Date().toISOString(),
            }
            setMessages(prev => [...prev, userMessage])
            
            setIsGeneratingDescription(true)
            setError(null)
            try {
              // Description input is optional - allow empty string
              const agentContext = inputValue.trim() || ''
              const response = await listingAssistantApi.generateDescription(
                conversationId,
                value as DescriptionTemplate,
                agentContext
              )
              
              if (!response.success) {
                throw new Error(response.error || 'Failed to generate description')
              }
              
              if (!response.description) {
                throw new Error('No description was generated')
              }
              
              setExtractedData(prev => ({
                ...prev,
                description: response.description,
                description_template: response.template,
                ai_generated_description: response.ai_generated_description || response.description,
              }))
              
              const aiMessage: ListingAssistantMessage = {
                role: 'assistant',
                content: `✓ Generated description using ${template.label} template:\n\n${response.description}\n\nYou can switch to a different template if you'd like a different style.`,
                timestamp: new Date().toISOString(),
              }
              setMessages(prev => [...prev, aiMessage])
              // Don't clear input value - user might want to add more context
              // Don't move to review step - stay on description so user can switch templates
            } catch (err: any) {
              // Extract error message from API response
              let errorMessage = 'Failed to generate description'
              
              if (err.response?.data) {
                // Backend returns { success: false, error: '...' } on 400
                errorMessage = err.response.data.error || err.response.data.message || errorMessage
              } else if (err.message) {
                errorMessage = err.message
              }
              
              setError(errorMessage)
              
              // Add error message to chat with helpful guidance
              const errorMessageBubble: ListingAssistantMessage = {
                role: 'assistant',
                content: `❌ ${errorMessage}\n\nPlease make sure you've filled in all required fields:\n- Property Type\n- Location\n- Price\n- Price Type (Monthly/Weekly/Daily/Yearly)\n- Bedrooms\n- Bathrooms\n\nOnce all required fields are complete, you can generate a description.`,
                timestamp: new Date().toISOString(),
              }
              setMessages(prev => [...prev, errorMessageBubble])
            } finally {
              setIsGeneratingDescription(false)
            }
          },
        })
      })
      
      // Add "Continue" button when description is generated
      if (extractedData.description) {
        buttons.push({
          label: 'Continue to Review',
          value: 'continue',
          variant: 'success',
          onClick: () => {
            setCurrentStep('review')
          },
        })
      }
    }

    return buttons
  }

  // Calculate progress
  const calculateProgress = (): number => {
    const filled = REQUIRED_FIELDS.filter(field => {
      const value = extractedData[field as keyof ExtractedPropertyData]
      return value !== null && value !== undefined && value !== ''
    }).length
    return Math.round((filled / REQUIRED_FIELDS.length) * 100)
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Property Summary Card - Collapsible */}
      {showPropertyCard && (
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Property Summary</h3>
            <button
              onClick={() => setShowPropertyCard(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full mb-2">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      )}

      {!showPropertyCard && (
        <button
          onClick={() => setShowPropertyCard(true)}
          className="absolute top-4 right-4 z-10 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
        >
          Show Summary
        </button>
      )}

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, idx) => {
          const isLatestMessage = idx === messages.length - 1
          const isLatestAssistantMessage = isLatestMessage && msg.role === 'assistant' && !isLoading
          
          // Only get buttons for the latest assistant message
          const buttons = isLatestAssistantMessage ? getButtonsForMessage(msg, idx) : []
          
          // Infer step for location map check
          let stepForMap = currentStep
          if (!stepForMap && missingFields.length > 0) {
            const stepOrder: Step[] = ['property_name', 'property_type', 'location', 'price', 'price_type', 'bedrooms', 'bathrooms']
            const firstMissing = missingFields[0]
            const stepIndex = REQUIRED_FIELDS.indexOf(firstMissing as any)
            if (stepIndex >= 0 && stepIndex < stepOrder.length) {
              stepForMap = stepOrder[stepIndex]
            }
          }
          const showLocationMap = stepForMap === 'location' && isLatestAssistantMessage
          
          return (
            <Fragment key={`msg-${idx}-${messages.length}`}>
              <MessageBubble
                message={msg}
                isLatest={isLatestMessage}
                buttons={buttons}
              />
              
              {/* Inline Location Map for Step 3 */}
              {showLocationMap && (
                <InlineLocationMap
                  onLocationConfirm={async (address, latitude, longitude) => {
                    if (!conversationId) return
                    
                    setIsLoading(true)
                    setError(null)
                    
                    try {
                      // Save coordinates first
                      await listingAssistantApi.saveMapCoordinates(conversationId, latitude, longitude)
                      
                      // Add user message with address
                      const userMessage: ListingAssistantMessage = {
                        role: 'user',
                        content: address,
                        timestamp: new Date().toISOString(),
                      }
                      setMessages(prev => [...prev, userMessage])
                      
                      // Update location field and move to next step
                      const response = await listingAssistantApi.setField(conversationId, 'location', address, 'price')
                      
                      // Update extracted data with both address and coordinates
                      setExtractedData({
                        ...response.extracted_data,
                        location: address,
                        address: address,
                        latitude: Number(latitude),
                        longitude: Number(longitude),
                      })
                      setMissingFields(response.missing_fields)
                      setFormReady(response.form_ready)
                      setCurrentStep((response.current_step as Step) || 'price')
                      
                      // Add AI response
                      const aiMessage: ListingAssistantMessage = {
                        role: 'assistant',
                        content: response.ai_response || `✓ Location set: ${address}`,
                        timestamp: new Date().toISOString(),
                      }
                      setMessages(prev => [...prev, aiMessage])
                      
                      // Move to next step
                      setTimeout(() => {
                        setCurrentStep('price')
                        handleNextStep('price')
                      }, 500)
                    } catch (err: any) {
                      setError(err.message || 'Failed to save location')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  initialLatitude={extractedData.latitude ? parseFloat(String(extractedData.latitude)) : null}
                  initialLongitude={extractedData.longitude ? parseFloat(String(extractedData.longitude)) : null}
                />
              )}
            </Fragment>
          )
        })}
        
        {isLoading && <TypingIndicator />}


        {/* Image Upload Step */}
        {currentStep === 'images' && !isLoading && (
          <div className="mt-4 space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                if (files.length === 0 || !conversationId) return

                setIsUploadingImages(true)
                try {
                  const response = await listingAssistantApi.uploadImages(conversationId, files)
                  setExtractedData(prev => ({ ...prev, images: response.images }))
                  
                  const aiMessage: ListingAssistantMessage = {
                    role: 'assistant',
                    content: `✓ Uploaded ${files.length} image(s). ${response.images.length} total images.`,
                    timestamp: new Date().toISOString(),
                  }
                  setMessages(prev => [...prev, aiMessage])
                } catch (err: any) {
                  setError(err.message || 'Failed to upload images')
                } finally {
                  setIsUploadingImages(false)
                }
              }}
              accept="image/*"
              multiple
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImages}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isUploadingImages ? 'Uploading...' : 'Upload Images'}
              </button>
              <button
                onClick={async () => {
                  if (!conversationId) return
                  
                  const userMessage: ListingAssistantMessage = {
                    role: 'user',
                    content: 'Skip images, continue',
                    timestamp: new Date().toISOString(),
                  }
                  setMessages(prev => [...prev, userMessage])
                  
                  setCurrentStep('description')
                  handleNextStep('description')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Skip, Continue
              </button>
            </div>
            {extractedData.images && extractedData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {extractedData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={img.url} alt={img.original_name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Description Step */}
        {currentStep === 'description' && !isLoading && (
          <div className="mt-4 space-y-4">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="(Optional) Briefly describe the property in your own words to help generate a better description..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            />
            {extractedData.description && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Generated Description:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{extractedData.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Template: {DESCRIPTION_TEMPLATES[extractedData.description_template as DescriptionTemplate]?.label || 'Narrative'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Review/Submit Step */}
        {currentStep === 'review' && formReady && (
          <div className="mt-4">
            <button
              onClick={async () => {
                if (!conversationId) return
                
                setIsSubmitting(true)
                try {
                  const response = await listingAssistantApi.submitListing(conversationId)
                  
                  const aiMessage: ListingAssistantMessage = {
                    role: 'assistant',
                    content: `✓ Listing submitted successfully! Property ID: ${response.property_id}`,
                    timestamp: new Date().toISOString(),
                  }
                  setMessages(prev => [...prev, aiMessage])
                  
                  if (onListingSubmitted && response.property_id !== undefined) {
                    onListingSubmitted(response.property_id)
                  }
                } catch (err: any) {
                  setError(err.message || 'Failed to submit listing')
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Listing'}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Custom Input for Optional Fields */}
      {showCustomInput && currentOptionalFieldIndex >= 0 && (
        <div className="bg-white border-t border-gray-200 p-4 border-blue-300">
          <div className="mb-2">
            <label className="text-sm font-medium text-gray-700">
              {showCustomInput === 'amenities' ? 'Add Custom Amenity' : 
               showCustomInput === 'title_type' ? 'Add Custom Title Type' :
               `Add Custom ${FIELD_LABELS[showCustomInput as keyof typeof FIELD_LABELS] || showCustomInput}`}
            </label>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCustomInputSubmit()
                  }
                }}
                placeholder={
                  showCustomInput === 'amenities' ? 'Enter custom amenity name...' :
                  showCustomInput === 'title_type' ? 'Enter custom title type...' :
                  'Enter custom value...'
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <button
              onClick={handleCustomInputSubmit}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowCustomInput(null)
                setInputValue('')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input Area - Hidden during location step (map is shown instead) */}
      {currentStep !== 'location' && !showCustomInput && (
        <div className="bg-white border-t border-gray-200 p-4">
          {error && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleTextSubmit()
                  }
                }}
                placeholder={
                  currentStep === 'property_name' ? 'Enter property name...' :
                  currentStep === 'price' ? 'Enter price...' :
                  currentOptionalFieldIndex >= 0 && selectedOptionalFields.length > 0 ? 
                    `Enter ${FIELD_LABELS[selectedOptionalFields[currentOptionalFieldIndex] as keyof typeof FIELD_LABELS] || selectedOptionalFields[currentOptionalFieldIndex]}...` :
                  'Type your message...'
                }
                rows={1}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-3 h-[42px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">Set Property Location</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <LocationPicker
                latitude={extractedData.latitude ? parseFloat(String(extractedData.latitude)) : null}
                longitude={extractedData.longitude ? parseFloat(String(extractedData.longitude)) : null}
                locationName={extractedData.location || extractedData.address || undefined}
                onLocationChange={async (lat, lng) => {
                  if (conversationId) {
                    try {
                      await listingAssistantApi.saveMapCoordinates(conversationId, lat, lng)
                      setExtractedData(prev => ({
                        ...prev,
                        latitude: Number(lat),
                        longitude: Number(lng),
                      }))
                    } catch (err: any) {
                      setError(err.message || 'Failed to save location')
                    }
                  }
                }}
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={async () => {
                    if (extractedData.latitude && extractedData.longitude) {
                      setShowLocationModal(false)
                      setCurrentStep('description')
                      handleNextStep('description')
                    } else {
                      setError('Please set a location on the map first')
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirm & Continue
                </button>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

