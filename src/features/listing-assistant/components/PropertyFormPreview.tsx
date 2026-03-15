/**
 * Property Form Preview Component
 * Live-updating form showing extracted property data
 */

import React, { useState, useEffect } from 'react'
import { FieldStatusBadge } from './FieldStatusBadge'
import { LocationPicker } from './LocationPicker'
import type {
  ExtractedPropertyData,
  DataWarning,
  FieldStatus,
  PropertyType,
  DescriptionTemplate,
} from '../types'
import {
  FIELD_LABELS,
  PROPERTY_TYPE_LABELS,
  FURNISHING_LABELS,
  LISTING_STATUS_LABELS,
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  DESCRIPTION_TEMPLATES,
  formatPrice,
  getFieldStatus,
} from '../types'

interface PropertyFormPreviewProps {
  data: ExtractedPropertyData
  skippedFields: string[]
  warnings: DataWarning[]
  formReady: boolean
  canGenerateDescription: boolean
  onGenerateDescription?: (template: DescriptionTemplate, agentContext: string) => void
  onSubmit?: () => void
  onDeleteImage?: (imageIndex: number) => void
  onLocationChange?: (lat: number, lng: number) => void
  isGeneratingDescription?: boolean
  isSubmitting?: boolean
}

interface FieldRowProps {
  field: keyof ExtractedPropertyData
  data: ExtractedPropertyData
  skippedFields: string[]
  warnings: DataWarning[]
  isRequired?: boolean
}

function FieldRow({ field, data, skippedFields, warnings, isRequired = false }: FieldRowProps) {
  const status = getFieldStatus(field, data, skippedFields, warnings)
  const value = data[field]
  const warning = warnings.find(w => w.field === field)
  
  // Format the display value
  const displayValue: string = (() => {
    if (status === 'skipped') return 'Skipped'
    if (value === null || value === undefined || value === '') return '—'
    
    // Handle different field types
    if (field === 'price') return formatPrice(value as number)
    if (field === 'hoa_fee') return formatPrice(value as number) + '/mo'
    if (field === 'area_sqm' || field === 'lot_area_sqm') return `${value} sqm`
    if (field === 'property_age') return `${value} years`
    if (field === 'property_type') return PROPERTY_TYPE_LABELS[value as PropertyType] || String(value)
    if (field === 'furnishing_status' && value) return FURNISHING_LABELS[value as keyof typeof FURNISHING_LABELS] || String(value)
    if (field === 'status' && value) return LISTING_STATUS_LABELS[value as keyof typeof LISTING_STATUS_LABELS] || String(value)
    if (field === 'amenities' && Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '—'
    }
    if (field === 'images' && Array.isArray(value)) {
      return value.length > 0 ? `${value.length} image(s)` : '—'
    }
    
    // Fallback for any other array types
    if (Array.isArray(value)) {
      return value.length > 0 ? value.map(v => String(v)).join(', ') : '—'
    }
    
    return String(value)
  })()

  return (
    <div 
      className={`
        flex items-start justify-between py-2.5 px-3 rounded-lg
        ${status === 'filled' ? 'bg-green-50' : ''}
        ${status === 'empty' && isRequired ? 'bg-yellow-50' : ''}
        ${status === 'skipped' ? 'bg-gray-50' : ''}
        ${status === 'warning' ? 'bg-orange-50' : ''}
        ${status === 'empty' && !isRequired ? 'hover:bg-gray-50' : ''}
        transition-colors
      `}
    >
      <div className="flex items-center gap-2">
        <FieldStatusBadge status={status} />
        <span className={`text-sm ${status === 'skipped' ? 'text-gray-400' : 'text-gray-600'}`}>
          {FIELD_LABELS[field]}
          {isRequired && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      </div>
      <div className="flex flex-col items-end max-w-[60%]">
        <span 
          className={`
            text-sm font-medium text-right
            ${status === 'filled' ? 'text-gray-800' : ''}
            ${status === 'empty' ? 'text-gray-400 italic' : ''}
            ${status === 'skipped' ? 'text-gray-400' : ''}
            ${status === 'warning' ? 'text-orange-700' : ''}
          `}
        >
          {displayValue}
        </span>
        {warning && (
          <span className="text-xs text-orange-600 mt-0.5">
            {warning.message}
          </span>
        )}
      </div>
    </div>
  )
}

export function PropertyFormPreview({
  data,
  skippedFields,
  warnings,
  formReady,
  canGenerateDescription,
  onGenerateDescription,
  onSubmit,
  onDeleteImage,
  onLocationChange,
  isGeneratingDescription = false,
  isSubmitting = false,
}: PropertyFormPreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DescriptionTemplate>('narrative')
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
  const [agentContext, setAgentContext] = useState('')

  // Sync selected template when data has an existing description (e.g. from assistant)
  useEffect(() => {
    const template = data.description_template
    if (template && template in DESCRIPTION_TEMPLATES) {
      setSelectedTemplate(template as DescriptionTemplate)
    }
  }, [data.description_template])

  // Calculate completion stats
  const filledRequired = REQUIRED_FIELDS.filter(f => {
    const status = getFieldStatus(f, data, skippedFields, warnings)
    return status === 'filled' || status === 'skipped'
  }).length
  
  const filledOptional = OPTIONAL_FIELDS.filter(f => {
    const status = getFieldStatus(f, data, skippedFields, warnings)
    return status === 'filled'
  }).length

  const completionPercent = Math.round((filledRequired / REQUIRED_FIELDS.length) * 100)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header with completion indicator */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Property Details</h3>
          <span 
            className={`
              text-xs font-medium px-2.5 py-1 rounded-full
              ${formReady 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
              }
            `}
          >
            {formReady ? 'Ready' : `${completionPercent}% Complete`}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              formReady ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{filledRequired}/{REQUIRED_FIELDS.length} required</span>
          <span>{filledOptional} optional filled</span>
        </div>
      </div>

      {/* Scrollable fields area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Required Fields Section */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Required Information
          </h4>
          <div className="space-y-1">
            {REQUIRED_FIELDS.map((field) => (
              <FieldRow
                key={field}
                field={field}
                data={data}
                skippedFields={skippedFields}
                warnings={warnings}
                isRequired
              />
            ))}
          </div>
        </div>

        {/* Optional Fields Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Optional Information
          </h4>
          <div className="space-y-1">
            {OPTIONAL_FIELDS.filter(f => f !== 'description').map((field) => (
              <FieldRow
                key={field}
                field={field}
                data={data}
                skippedFields={skippedFields}
                warnings={warnings}
              />
            ))}
          </div>
        </div>

        {/* Description Section - description first, then template switcher below */}
        {data.description && (
          <div className="mt-6 space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Property Description
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {data.description}
              </p>
            </div>
            {/* Template switcher below description so user doesn't have to scroll up */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Switch template</p>
              <div className="relative">
                <button
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  disabled={!canGenerateDescription || isGeneratingDescription}
                  className={`
                    w-full py-2 px-3 rounded-lg text-sm
                    flex items-center justify-between
                    border transition-all
                    ${canGenerateDescription && !isGeneratingDescription
                      ? 'border-gray-300 hover:border-purple-400 bg-white cursor-pointer'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="font-medium text-gray-700">
                    {DESCRIPTION_TEMPLATES[selectedTemplate].label}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTemplateDropdown && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-80 overflow-y-auto">
                    {(Object.keys(DESCRIPTION_TEMPLATES) as DescriptionTemplate[]).map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setSelectedTemplate(template)
                          setShowTemplateDropdown(false)
                          onGenerateDescription?.(template, agentContext)
                        }}
                        className={`
                          w-full text-left px-3 py-2 hover:bg-purple-50 transition-colors
                          ${selectedTemplate === template ? 'bg-purple-50' : ''}
                        `}
                      >
                        <span className="font-medium text-sm text-gray-800">
                          {DESCRIPTION_TEMPLATES[template].label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => onGenerateDescription?.(selectedTemplate, agentContext)}
                disabled={!canGenerateDescription || isGeneratingDescription}
                className="w-full py-2 px-3 rounded-lg text-sm font-medium border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGeneratingDescription ? 'Regenerating...' : 'Regenerate with selected template'}
              </button>
            </div>
          </div>
        )}

        {/* Images Section */}
        {data.images && data.images.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Property Images ({data.images.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {data.images.map((image, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.original_name || `Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Delete button overlay */}
                  <button
                    onClick={() => onDeleteImage?.(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* File name tooltip */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white truncate block">
                      {image.original_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Picker Section */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Property Location on Map
          </h4>
          <LocationPicker
            latitude={data.latitude}
            longitude={data.longitude}
            locationName={data.location || data.address}
            onLocationChange={(lat, lng) => onLocationChange?.(lat, lng)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        {/* Generate Description Section */}
        {!data.description && (
          <div className="space-y-2">
            {/* Template Selector */}
            <div className="relative">
              <button
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                disabled={!canGenerateDescription || isGeneratingDescription}
                className={`
                  w-full py-2 px-3 rounded-lg text-sm
                  flex items-center justify-between
                  border transition-all
                  ${canGenerateDescription && !isGeneratingDescription
                    ? 'border-gray-300 hover:border-purple-400 bg-white cursor-pointer'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Template:</span>
                  <span className="font-medium text-gray-700">
                    {DESCRIPTION_TEMPLATES[selectedTemplate].label}
                  </span>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu - Opens upward to avoid being clipped by container overflow */}
              {showTemplateDropdown && (
                <div className="absolute z-50 bottom-full mb-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-80 overflow-y-auto">
                  {(Object.keys(DESCRIPTION_TEMPLATES) as DescriptionTemplate[]).map((template) => (
                    <button
                      key={template}
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowTemplateDropdown(false)
                      }}
                      className={`
                        w-full text-left px-3 py-2 hover:bg-purple-50 transition-colors
                        ${selectedTemplate === template ? 'bg-purple-50' : ''}
                      `}
                    >
                      <div className="font-medium text-sm text-gray-800">
                        {DESCRIPTION_TEMPLATES[template].label}
                        {selectedTemplate === template && (
                          <span className="ml-2 text-purple-600">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {DESCRIPTION_TEMPLATES[template].description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Template Preview */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-xs font-medium text-gray-500 uppercase">Preview</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line line-clamp-4">
                {DESCRIPTION_TEMPLATES[selectedTemplate].preview}
              </p>
            </div>
            
            {/* Agent Context Input */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Agent Notes (Optional)</span>
              </label>
              <textarea
                value={agentContext}
                onChange={(e) => setAgentContext(e.target.value)}
                disabled={!canGenerateDescription || isGeneratingDescription}
                placeholder="Add any ideas to guide the AI, e.g., 'Emphasize proximity to schools', 'Highlight the modern kitchen', 'Mention pet-friendly policy'..."
                className={`
                  w-full px-3 py-2 rounded-lg text-sm resize-none
                  border transition-all
                  ${canGenerateDescription && !isGeneratingDescription
                    ? 'border-gray-300 hover:border-purple-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-white'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  }
                `}
                rows={2}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 text-right">{agentContext.length}/500</p>
            </div>
            
            {/* Generate Button */}
            <button
              onClick={() => onGenerateDescription?.(selectedTemplate, agentContext)}
              disabled={!canGenerateDescription || isGeneratingDescription}
              className={`
                w-full py-2.5 px-4 rounded-lg text-sm font-medium
                flex items-center justify-center gap-2
                transition-all
                ${canGenerateDescription && !isGeneratingDescription
                  ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isGeneratingDescription ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Generate AI Description
                </>
              )}
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={!formReady || isSubmitting}
          className={`
            w-full py-2.5 px-4 rounded-lg text-sm font-medium
            flex items-center justify-center gap-2
            transition-all
            ${formReady && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submit Listing
            </>
          )}
        </button>

        {!formReady && (
          <p className="text-xs text-center text-gray-500 mt-2">
            Complete all required fields to submit
          </p>
        )}
      </div>
    </div>
  )
}

export default PropertyFormPreview
