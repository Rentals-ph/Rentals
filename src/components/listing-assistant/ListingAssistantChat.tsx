/**
 * Listing Assistant Chat Component
 * Main chat interface for AI-powered property listing
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import { MessageBubble, TypingIndicator, WelcomeMessage } from './MessageBubble'
import { PropertyFormPreview } from './PropertyFormPreview'
import { LocationPicker } from './LocationPicker'
import { listingAssistantApi } from '../../api/endpoints/listingAssistant'
import type {
  ExtractedPropertyData,
  ListingAssistantMessage,
  DataWarning,
  ProcessMessageResponse,
  UploadedImage,
  DescriptionTemplate,
} from '../../types/listingAssistant'

interface ListingAssistantChatProps {
  onListingSubmitted?: (propertyId: number) => void
  initialConversationId?: string
}

export function ListingAssistantChat({
  onListingSubmitted,
  initialConversationId,
}: ListingAssistantChatProps) {
  // State
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [messages, setMessages] = useState<ListingAssistantMessage[]>([])
  const [extractedData, setExtractedData] = useState<ExtractedPropertyData>({})
  const [skippedFields, setSkippedFields] = useState<string[]>([])
  const [warnings, setWarnings] = useState<DataWarning[]>([])
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [formReady, setFormReady] = useState(false)
  const [canGenerateDescription, setCanGenerateDescription] = useState(false)
  
  // UI State
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      if (initialConversationId) {
        try {
          const response = await listingAssistantApi.getConversation(initialConversationId)
          setConversationId(response.conversation_id)
          setMessages(response.messages)
          setExtractedData(response.extracted_data)
          setSkippedFields(response.skipped_fields)
          setMissingFields(response.missing_fields)
          setFormReady(response.form_ready)
          setCanGenerateDescription(response.can_generate_description)
        } catch {
          // Start new conversation if loading fails
          await startNewConversation()
        }
      } else {
        await startNewConversation()
      }
    }

    initConversation()
  }, [initialConversationId])

  // Start new conversation
  const startNewConversation = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await listingAssistantApi.startNewConversation()
      setConversationId(response.conversation_id)
      setMessages(response.messages)
      setExtractedData(response.extracted_data)
      setSkippedFields(response.skipped_fields || [])
      setMissingFields(response.missing_fields)
      setFormReady(response.form_ready)
      setCanGenerateDescription(response.can_generate_description)
    } catch (err) {
      setError('Failed to start conversation. Please try again.')
      console.error('Start conversation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Core send logic so we can reuse for quick-reply buttons
  const sendMessage = async (raw: string) => {
    const message = raw.trim()
    if (!message || isLoading) return

    if (raw === inputValue) {
      setInputValue('')
    }
    setIsLoading(true)
    setError(null)

    // Optimistically add user message
    const userMessage: ListingAssistantMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response: ProcessMessageResponse = await listingAssistantApi.processMessage(
        message,
        conversationId
      )

      // Update all state from response
      setConversationId(response.conversation_id)
      setExtractedData(response.extracted_data)
      setSkippedFields(response.skipped_fields)
      setMissingFields(response.missing_fields)
      setFormReady(response.form_ready)
      setCanGenerateDescription(response.can_generate_description)
      setWarnings(response.warnings || [])

      // Add AI response
      const aiMessage: ListingAssistantMessage = {
        role: 'assistant',
        content: response.ai_response,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (err) {
      setError('Failed to send message. Please try again.')
      console.error('Send message error:', err)
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sending from textarea / Enter key
  const handleSendMessage = async () => {
    await sendMessage(inputValue)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Generate description
  const handleGenerateDescription = async (template: DescriptionTemplate = 'narrative', agentContext: string = '') => {
    if (!conversationId || isGeneratingDescription) return

    setIsGeneratingDescription(true)
    setError(null)

    try {
      const response = await listingAssistantApi.generateDescription(conversationId, template, agentContext)
      
      if (response.success && response.description) {
        setExtractedData(prev => ({
          ...prev,
          description: response.description,
        }))

        // Add system message about description
        const templateLabel = template.charAt(0).toUpperCase() + template.slice(1)
        const aiMessage: ListingAssistantMessage = {
          role: 'assistant',
          content: `I've generated a ${templateLabel} style description for your property:\n\n"${response.description}"\n\nFeel free to edit it or let me know if you'd like a different style!`,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        setError(response.error || 'Failed to generate description')
      }
    } catch (err) {
      setError('Failed to generate description. Please try again.')
      console.error('Generate description error:', err)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  // Submit listing
  const handleSubmitListing = async () => {
    if (!conversationId || !formReady || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await listingAssistantApi.submitListing(conversationId)
      
      if (response.success && response.property_id) {
        // Add success message
        const aiMessage: ListingAssistantMessage = {
          role: 'assistant',
          content: `🎉 Congratulations! Your listing has been submitted successfully!\n\nYour property "${extractedData.property_name}" is now live. You can view and manage it from your listings dashboard.`,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, aiMessage])

        // Callback to parent
        onListingSubmitted?.(response.property_id)
      } else {
        setError(response.error || 'Failed to submit listing')
        if (response.missing_fields) {
          setMissingFields(response.missing_fields)
        }
      }
    } catch (err) {
      setError('Failed to submit listing. Please try again.')
      console.error('Submit listing error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset conversation
  const handleReset = async () => {
    if (!conversationId) return
    
    if (!window.confirm('Are you sure you want to start over? All entered data will be cleared.')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await listingAssistantApi.resetConversation(conversationId)
      setMessages(response.messages)
      setExtractedData(response.extracted_data)
      setSkippedFields(response.skipped_fields || [])
      setMissingFields(response.missing_fields)
      setFormReady(response.form_ready)
      setCanGenerateDescription(response.can_generate_description)
      setWarnings([])
    } catch (err) {
      setError('Failed to reset conversation')
      console.error('Reset error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !conversationId) return

    // Validate files (10MB per file, allow many images per property)
    const validFiles: File[] = []
    const maxSizePerFile = 10 * 1024 * 1024 // 10MB per image
    const maxFilesPerBatch = 30
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']

    for (let i = 0; i < Math.min(files.length, maxFilesPerBatch); i++) {
      const file = files[i]
      if (!allowedTypes.includes(file.type)) {
        setError(`${file.name}: Invalid file type. Only JPEG, PNG, GIF, WebP allowed.`)
        continue
      }
      if (file.size > maxSizePerFile) {
        setError(`${file.name}: File too large. Maximum size is 10MB per image.`)
        continue
      }
      validFiles.push(file)
    }
    if (files.length > maxFilesPerBatch) {
      setError(`Only the first ${maxFilesPerBatch} images were added. You can add more in another batch.`)
    }

    if (validFiles.length === 0) return

    setIsUploadingImages(true)
    setError(null)

    try {
      const response = await listingAssistantApi.uploadImages(conversationId, validFiles)
      
      if (response.success) {
        setExtractedData(prev => ({
          ...prev,
          images: response.images,
        }))

        // Add system message about upload
        const aiMessage: ListingAssistantMessage = {
          role: 'assistant',
          content: `${response.images.length} image(s) uploaded successfully! These will be included with your listing.`,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (err) {
      setError('Failed to upload images. Please try again.')
      console.error('Image upload error:', err)
    } finally {
      setIsUploadingImages(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle image delete
  const handleDeleteImage = async (imageIndex: number) => {
    if (!conversationId) return

    try {
      const response = await listingAssistantApi.deleteImage(conversationId, imageIndex)
      
      if (response.success) {
        setExtractedData(prev => ({
          ...prev,
          images: response.images,
        }))
      }
    } catch (err) {
      setError('Failed to delete image')
      console.error('Delete image error:', err)
    }
  }

  // Handle location change from map picker
  const handleLocationChange = async (lat: number, lng: number): Promise<string> => {
    if (!conversationId) return ''

    try {
      // Reverse geocode to get location and street address
      let locationName = ''
      let streetAddress = ''
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
          { headers: { 'User-Agent': 'RentalPH-PropertyListing/1.0' } }
        )
        const geoData = await geoResponse.json()

        const address = geoData.address || {}

        // Construct a human-friendly street address (house no. + road + local area)
        const streetParts = [
          address.house_number,
          address.road || address.residential || address.footway,
          address.suburb || address.neighbourhood || address.village,
        ].filter(Boolean)
        streetAddress =
          streetParts.join(', ') ||
          geoData.display_name?.split(',').slice(0, 3).join(', ').trim() ||
          ''

        // Construct a broader location (city + state/region) for the "Location" field
        const locationParts = [
          address.city || address.town || address.municipality || address.village,
          address.state || address.region,
        ].filter(Boolean)

        locationName =
          locationParts.slice(0, 2).join(', ') ||
          geoData.display_name?.split(',').slice(0, 2).join(', ').trim() ||
          ''
      } catch (geoErr) {
        console.warn('Reverse geocoding failed:', geoErr)
      }

      const updatePayload: Partial<ExtractedPropertyData> = {
        latitude: lat,
        longitude: lng,
      }

      // Only update location if we got a valid geocoded name
      if (locationName) {
        updatePayload.location = locationName
      }
      // Keep the "Full Address" field in sync with the pinned map location
      if (streetAddress) {
        updatePayload.address = streetAddress
      }

      const response = await listingAssistantApi.updateData(conversationId, updatePayload)

      if (response.success) {
        setExtractedData(prev => ({
          ...prev,
          ...updatePayload,
        }))
      }

      // Prefer showing the full street address if available, otherwise fall back to broader location
      return streetAddress || locationName
    } catch (err) {
      setError('Failed to update location')
      console.error('Location update error:', err)
      return ''
    }
  }

  // Handle location change from modal (closes modal and adds chat message)
  const handleLocationChangeFromModal = async (lat: number, lng: number) => {
    const locationName = await handleLocationChange(lat, lng)
    setShowLocationModal(false)
    
    // Use location name from geocoding or fall back to coordinates
    const locationDisplay = locationName || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    
    // Add a system message about the location
    const aiMessage: ListingAssistantMessage = {
      role: 'assistant',
      content: `📍 Location pinned on map!\n\nLocation: ${locationDisplay}\nCoordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n\nYou can adjust the location anytime by clicking the map button or using the location picker in the Property Details panel.`,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, aiMessage])
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Chat Section */}
      <div className="flex-1 flex flex-col bg-gray-50 rounded-xl overflow-hidden">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Listing Assistant</h2>
              <p className="text-xs text-gray-500">AI-powered property listing</p>
            </div>
          </div>
          
          <button
            onClick={handleReset}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Start over"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !isLoading && <WelcomeMessage />}
          
          {messages.map((msg, idx) => {
            const isLatest = idx === messages.length - 1
            let buttons:
              | {
                  label: string
                  value: string | number
                  onClick: () => void
                  variant?: 'default' | 'selected' | 'primary' | 'success'
                }[]
              | undefined

            if (msg.role === 'assistant' && isLatest) {
              const content = msg.content || ''

              // Quick-select buttons for property type
              if (/what\s+type\s+of\s+property\s+is\s+this/i.test(content)) {
                const typeOptions = [
                  { value: 'house', label: 'House' },
                  { value: 'condo', label: 'Condo' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'townhouse', label: 'Townhouse' },
                  { value: 'studio', label: 'Studio' },
                  { value: 'lot', label: 'Lot' },
                  { value: 'commercial', label: 'Commercial' },
                  { value: 'bedspace', label: 'Bedspace' },
                  { value: 'warehouse', label: 'Warehouse' },
                  { value: 'office', label: 'Office' },
                ]
                buttons = typeOptions.map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                  variant: opt.value === 'house' ? 'primary' : 'default',
                  onClick: () => {
                    // Send the selected type as a simple message; backend AI maps it to property_type
                    sendMessage(opt.value)
                  },
                }))
              }

              // Quick-select buttons for price type
              else if (
                /price\s+(type|is this price monthly|monthly,\s*weekly,\s*daily,\s*or\s*yearly)/i.test(
                  content
                )
              ) {
                const options = ['Monthly', 'Weekly', 'Daily', 'Yearly']
                buttons = options.map((label) => ({
                  label,
                  value: label,
                  variant: label === 'Monthly' ? 'primary' : 'default',
                  onClick: () => {
                    // Send the choice immediately as a message
                    sendMessage(label)
                  },
                }))
              }
            }

            return (
              <MessageBubble
                key={idx}
                message={msg}
                isLatest={isLatest}
                buttons={buttons}
              />
            )
          })}
          
          {isLoading && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
            multiple
            className="hidden"
          />
          
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Describe your property... (e.g., '3 bedroom house in QC, 7.5M')"
                rows={1}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>
            
            {/* Image upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!conversationId || isUploadingImages}
              className={`
                p-3 rounded-xl transition-all
                ${conversationId && !isUploadingImages
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }
              `}
              title="Upload images"
            >
              {isUploadingImages ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            {/* Location/Map button */}
            <button
              onClick={() => setShowLocationModal(true)}
              disabled={!conversationId}
              className={`
                p-3 rounded-xl transition-all
                ${conversationId
                  ? extractedData.latitude && extractedData.longitude
                    ? 'bg-green-100 hover:bg-green-200 text-green-600 cursor-pointer'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }
              `}
              title={extractedData.latitude ? 'Location set - Click to update' : 'Set property location on map'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={`
                p-3 rounded-xl transition-all
                ${inputValue.trim() && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          {/* Quick suggestions */}
          <div className="mt-2 flex flex-wrap gap-2">
            {missingFields.slice(0, 3).map((field) => (
              <button
                key={field}
                onClick={() => {
                  const suggestions: Record<string, string> = {
                    property_name: "The property name is ",
                    property_type: "It's a ",
                    location: "Located in ",
                    price: "The price is ",
                    bedrooms: "It has  bedrooms",
                    bathrooms: "It has  bathrooms",
                  }
                  setInputValue(suggestions[field] || '')
                  inputRef.current?.focus()
                }}
                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
              >
                + Add {field.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Preview Section */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <PropertyFormPreview
          data={extractedData}
          skippedFields={skippedFields}
          warnings={warnings}
          formReady={formReady}
          canGenerateDescription={canGenerateDescription}
          onGenerateDescription={handleGenerateDescription}
          onSubmit={handleSubmitListing}
          onDeleteImage={handleDeleteImage}
          onLocationChange={handleLocationChange}
          isGeneratingDescription={isGeneratingDescription}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Location Picker Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="font-semibold text-gray-800">Set Property Location</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Search for an address, use your current location, or click directly on the map to pinpoint where the property is located.
              </p>
              <LocationPickerModal
                latitude={extractedData.latitude}
                longitude={extractedData.longitude}
                locationName={extractedData.location || extractedData.address}
                onLocationChange={handleLocationChangeFromModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Location Picker Modal Component
 * Full-featured map picker for the modal
 */
function LocationPickerModal({
  latitude,
  longitude,
  locationName,
  onLocationChange,
}: {
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
  onLocationChange: (lat: number, lng: number) => void
}) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<any>(null)
  const markerRef = React.useRef<any>(null)
  const [leafletLoaded, setLeafletLoaded] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchError, setSearchError] = React.useState<string | null>(null)

  const defaultLat = latitude ?? 14.5995
  const defaultLng = longitude ?? 120.9842
  const hasLocation = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined

  // Load Leaflet
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const loadLeaflet = async () => {
      try {
        const L = (await import('leaflet')).default
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })
        ;(window as any).L = L
        setLeafletLoaded(true)
      } catch (err) {
        console.error('Failed to load Leaflet:', err)
      }
    }
    loadLeaflet()
  }, [])

  // Initialize map
  React.useEffect(() => {
    if (!mapContainerRef.current || !leafletLoaded) return

    const L = (window as any).L
    if (!L || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: hasLocation ? 15 : 12,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    // Click handler
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng
      updateMarker(lat, lng)
      onLocationChange(lat, lng)
    })

    // Initial marker
    if (hasLocation) {
      updateMarker(latitude!, longitude!)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [leafletLoaded])

  const updateMarker = (lat: number, lng: number) => {
    const L = (window as any).L
    if (!L || !mapRef.current) return

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current)
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onLocationChange(pos.lat, pos.lng)
      })
      markerRef.current = marker
    }
    mapRef.current.setView([lat, lng], mapRef.current.getZoom() < 14 ? 15 : mapRef.current.getZoom())
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setSearchError(null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=ph&limit=1`,
        { headers: { 'User-Agent': 'RentalPH-PropertyListing/1.0' } }
      )
      const results = await response.json()

      if (results.length > 0) {
        const { lat, lon } = results[0]
        updateMarker(parseFloat(lat), parseFloat(lon))
        onLocationChange(parseFloat(lat), parseFloat(lon))
      } else {
        setSearchError('Location not found. Try a different search.')
      }
    } catch {
      setSearchError('Failed to search. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation not supported')
      return
    }
    setIsSearching(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateMarker(pos.coords.latitude, pos.coords.longitude)
        onLocationChange(pos.coords.latitude, pos.coords.longitude)
        setIsSearching(false)
      },
      () => {
        setSearchError('Unable to get location. Check permissions.')
        setIsSearching(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={locationName ? `Search near "${locationName}"` : 'Search address or place...'}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSearching}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {isSearching ? '...' : 'Search'}
        </button>
        <button
          onClick={handleUseCurrentLocation}
          disabled={isSearching}
          className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
          title="Use my current location"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2M2 12h2m16 0h2m-9-7a5 5 0 110 10 5 5 0 010-10z" />
          </svg>
        </button>
      </div>
      
      {searchError && <p className="text-xs text-red-600 mb-2">{searchError}</p>}
      <p className="text-xs text-gray-500 mb-2">Click on the map or drag the marker to set location</p>
      
      {/* Map */}
      <div ref={mapContainerRef} style={{ height: '350px', width: '100%', borderRadius: '8px' }} />
      
      {hasLocation && (
        <p className="mt-2 text-sm text-green-600 font-medium">
          ✓ Location set: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
        </p>
      )}
    </div>
  )
}

export default ListingAssistantChat
