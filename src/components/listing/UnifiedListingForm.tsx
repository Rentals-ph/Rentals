'use client'

/**
 * UnifiedListingForm — system palette (gray-100, white, blue, gray borders)
 *
 * Three distinct AI modes:
 *   1. AI Quick Fill (Paste & Fill bar)
 *      → Calls processMessage(text, NULL) — completely separate from the main
 *        conversation, pure one-shot extraction. Then syncs results to the main
 *        conversation via updateData() so the assistant won't re-ask filled fields.
 *
 *   2. AI Co-Pilot Panel (sequential conversation)
 *      → Uses the main conversationId. Starts from the first unanswered field,
 *        shows quick-reply button chips keyed to `current_step` from the backend,
 *        and auto-advances whenever the user fills a field manually in the form.
 *
 *   3. Chat View (full-screen chat mode)
 *      → Free-form chat, same conversation context.
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '@/components/common/AppSidebar'
import LocationMap from '@/components/agent/LocationMap'
import { useListingConversation } from '@/hooks/useListingConversation'
import type { ListingFormData } from '@/hooks/useListingConversation'
import { LISTING_ROLE_CONFIG } from '@/config/listingRoles'
import { philippinesProvinces, getCitiesByProvince } from '@/data/philippinesLocations'
import { listingAssistantApi } from '@/api/endpoints/listingAssistant'
import { getAsset } from '@/utils/assets'
import type { ListingAssistantMessage, DescriptionTemplate } from '@/types/listingAssistant'
import { DESCRIPTION_TEMPLATES } from '@/types/listingAssistant'
import {
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiUploadCloud,
  FiMessageSquare,
  FiX,
  FiSend,
  FiZap,
  FiList,
} from 'react-icons/fi'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Apartment / Condo', 'House', 'Townhouse', 'Studio',
  'Bedspace', 'Commercial', 'Office', 'Warehouse',
]

const AMENITIES_LIST = [
  'Air Conditioning', 'Breakfast', 'Kitchen', 'Parking',
  'Pool', 'Wi-Fi Internet', 'Pet-Friendly',
]

const FIELD_LABELS: Record<string, string> = {
  property_type: 'Type', property_name: 'Title', description: 'Desc',
  bedrooms: 'Beds', bathrooms: 'Baths', garage: 'Garage',
  price: 'Price', price_type: 'Price Type',
  location: 'Location', address: 'Address', area_sqm: 'Area',
  lot_area_sqm: 'Lot Area', amenities: 'Amenities',
}

const SECTION_AI_FIELDS: Record<string, string[]> = {
  category:   ['property_type'],
  details:    ['property_name', 'description', 'bedrooms', 'bathrooms', 'area_sqm', 'lot_area_sqm'],
  location:   ['location', 'address'],
  images:     [],
  pricing:    ['price', 'price_type'],
  attributes: ['amenities'],
  review:     [],
}

// ─── Sequential AI Chat constants ─────────────────────────────────────────────

/** Button options shown after each AI response, keyed by current_step from the backend */
const STEP_BUTTONS: Record<string, Array<{ label: string; value: string }>> = {
  property_type: [
    { label: '🏢 Condo',      value: 'condo' },
    { label: '🏠 House',      value: 'house' },
    { label: '🏘️ Townhouse',  value: 'townhouse' },
    { label: '🛏️ Studio',     value: 'studio' },
    { label: '🏗️ Bedspace',   value: 'bedspace' },
    { label: '🏢 Commercial', value: 'commercial' },
    { label: '🏢 Office',     value: 'office' },
    { label: '🏭 Warehouse',  value: 'warehouse' },
  ],
  bedrooms: [
    { label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' },
    { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6+', value: '6' },
  ],
  bathrooms: [
    { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '4', value: '4' }, { label: '5+', value: '5' },
  ],
  // price_type is also matched by resolveButtons() content-scan below
  price_type: [
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Weekly',  value: 'Weekly'  },
    { label: 'Daily',   value: 'Daily'   },
    { label: 'Yearly',  value: 'Yearly'  },
  ],
  parking_slots: [
    { label: 'None', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' },
    { label: '3+', value: '3' }, { label: 'Skip', value: 'skip' },
  ],
  furnishing_status: [
    { label: 'Unfurnished',     value: 'unfurnished'     },
    { label: 'Semi-Furnished',  value: 'semi_furnished'  },
    { label: 'Fully Furnished', value: 'fully_furnished' },
    { label: 'Skip', value: 'skip' },
  ],
  area_sqm: [{ label: 'Skip', value: 'skip' }],
  amenities: [
    { label: 'Air Conditioning', value: 'Air Conditioning' },
    { label: 'Parking',          value: 'Parking'          },
    { label: 'Pool',             value: 'Pool'             },
    { label: 'Wi-Fi Internet',   value: 'Wi-Fi Internet'   },
    { label: 'Kitchen',          value: 'Kitchen'          },
    { label: 'Pet-Friendly',     value: 'Pet-Friendly'     },
    { label: 'Breakfast',        value: 'Breakfast'        },
    { label: '✓ Done',           value: 'done'             },
  ],
  description: [
    { label: '✨ Generate description', value: '__generate_description__' },
    { label: 'Skip', value: 'skip' },
  ],
}

/**
 * Resolve which quick-reply buttons to show.
 *
 * Primary: use `current_step` returned by the backend.
 * Fallback: scan the AI response text for known keywords so buttons are
 * shown even when the backend doesn't set an explicit `current_step`.
 * This guarantees price-type (Monthly/Weekly/Daily/Yearly) buttons always
 * appear when the AI asks about payment frequency.
 */
function resolveButtons(
  currentStep: string | null,
  aiResponse: string,
): Array<{ label: string; value: string }> {
  // 1. Direct step-key match
  if (currentStep && STEP_BUTTONS[currentStep]) {
    return STEP_BUTTONS[currentStep]
  }

  // 2. Content-based fallback — scan the AI response text
  const lower = aiResponse.toLowerCase()

  if (
    lower.includes('monthly') || lower.includes('weekly') ||
    lower.includes('daily')   || lower.includes('yearly') ||
    lower.includes('price type') || lower.includes('per month') ||
    lower.includes('payment frequency') || lower.includes('how often')
  ) return STEP_BUTTONS['price_type']

  if (
    lower.includes('house') || lower.includes('condo') ||
    lower.includes('type of property') || lower.includes('property type') ||
    lower.includes('apartment') || lower.includes('townhouse')
  ) return STEP_BUTTONS['property_type']

  if (lower.includes('bedroom') || lower.includes('how many bed'))
    return STEP_BUTTONS['bedrooms']

  if (lower.includes('bathroom') || lower.includes('how many bath'))
    return STEP_BUTTONS['bathrooms']

  if (lower.includes('parking slot') || lower.includes('garage slot'))
    return STEP_BUTTONS['parking_slots']

  if (lower.includes('furnish'))
    return STEP_BUTTONS['furnishing_status']

  if (lower.includes('floor area') || lower.includes('sqm') || lower.includes('square meter'))
    return STEP_BUTTONS['area_sqm']

  if (
    lower.includes('amenities') || lower.includes('facilities') ||
    lower.includes('features') || lower.includes('air conditioning')
  ) return STEP_BUTTONS['amenities']

  if (lower.includes('description') || lower.includes('generate'))
    return STEP_BUTTONS['description']

  return []
}

/**
 * Maps formData fields → sequential step names + first-question text.
 * Used to detect manual fills and find the first unanswered question.
 */
const SEQUENTIAL_STEPS: Array<{
  step: string
  label: string
  question: string
  isFilled: (fd: ListingFormData) => boolean
}> = [
  {
    step:     'property_name',
    label:    'Property name',
    question: "What's the property name/title?",
    isFilled: fd => !!fd.title,
  },
  {
    step:     'property_type',
    label:    'Property type',
    question: 'What type of property is this?',
    isFilled: fd => !!fd.category,
  },
  {
    step:     'location',
    label:    'Location',
    question: 'Which city or area is this property located in?',
    isFilled: fd => !!fd.state || !!fd.city,
  },
  {
    step:     'price',
    label:    'Price',
    question: 'What is the monthly rent? (e.g. 45000)',
    isFilled: fd => !!fd.price,
  },
  {
    step:     'bedrooms',
    label:    'Bedrooms',
    question: 'How many bedrooms does it have?',
    isFilled: fd => fd.bedrooms > 0,
  },
  {
    step:     'bathrooms',
    label:    'Bathrooms',
    question: 'How many bathrooms?',
    isFilled: fd => fd.bathrooms > 0,
  },
  {
    step:     'area_sqm',
    label:    'Floor area',
    question: 'What is the floor area in sqm? (optional)',
    isFilled: fd => fd.floorArea > 0,
  },
]

/** Find the first step that still needs an answer */
const getFirstUnansweredStep = (fd: ListingFormData) =>
  SEQUENTIAL_STEPS.find(s => !s.isFilled(fd)) ?? null

/** Resolve user-facing display value for a step from formData */
const getFormValueForStep = (step: string, fd: ListingFormData): string | null => {
  switch (step) {
    case 'property_name':  return fd.title || null
    case 'property_type':  return fd.category || null
    case 'location':       return [fd.city, fd.state].filter(Boolean).join(', ') || null
    case 'price':          return fd.price ? `₱${Number(fd.price).toLocaleString()}` : null
    case 'bedrooms':       return fd.bedrooms > 0 ? String(fd.bedrooms) : null
    case 'bathrooms':      return fd.bathrooms > 0 ? String(fd.bathrooms) : null
    case 'area_sqm':       return fd.floorArea > 0 ? `${fd.floorArea} sqm` : null
    default:               return null
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'form' | 'chat'

/** Extended message type that can carry quick-reply button options */
interface SequentialMsg {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  buttons?: Array<{ label: string; value: string }>
  timestamp: string
}

export interface UnifiedListingFormProps {
  role: string
}

// ─── Shared field styles ──────────────────────────────────────────────────────

const FL = 'block text-[11px] font-semibold text-gray-500 uppercase tracking-[0.4px] mb-1.5'
const FI = 'w-full h-9 border border-gray-300 rounded-[6px] px-2.5 text-[13px] text-gray-900 bg-white outline-none focus:border-blue-600 transition-colors'
const FS = 'w-full h-9 border border-gray-300 rounded-[6px] px-2.5 pr-6 text-[13px] text-gray-900 bg-white outline-none appearance-none focus:border-blue-600 transition-colors'
const FT = 'w-full border border-gray-300 rounded-[6px] px-2.5 py-2 text-[13px] text-gray-900 bg-white outline-none resize-none focus:border-blue-600 transition-colors'

function HouseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Roof — V/caret shape stroked */}
      <path
        d="M2 12 L12 2 L22 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* House body — pentagon with peaked top matching the caret angle */}
      <path d="M3.5 22 L3.5 15 L12 6 L20.5 15 L20.5 22 Z" />
      {/* Door cutout */}
      <rect x="9.5" y="16.5" width="5" height="5.5" fill="#FFFFFF" />
    </svg>
  )
}

// ─── SectionBadge ─────────────────────────────────────────────────────────────

function SectionBadge({ num, isDone, isActive }: { num: number; isDone: boolean; isActive: boolean }) {
  const base = 'w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold'
  if (isDone)   return <div className={`${base} bg-emerald-600 border border-emerald-600`}><FiCheck className="w-2.5 h-2.5 text-white" /></div>
  if (isActive) return <div className={`${base} bg-blue-600 border border-blue-600 text-white`}>{num}</div>
  return             <div className={`${base} bg-gray-50 border border-gray-300 text-gray-500`}>{num}</div>
}

// ─── AI Co-Pilot Panel ────────────────────────────────────────────────────────

interface CoPilotPanelProps {
  conversationId: string | null
  formData:       ReturnType<typeof useListingConversation>['formData']
  onBulkFill:     ReturnType<typeof useListingConversation>['bulkFill']
  onClose:        () => void
  onGenerateDescription: () => void
}

function CoPilotPanel({
  conversationId,
  formData,
  onBulkFill,
  onClose,
  onGenerateDescription,
}: CoPilotPanelProps) {
  const [chatInput,    setChatInput]    = useState('')
  const [messages,     setMessages]     = useState<SequentialMsg[]>([])
  const [currentStep,  setCurrentStep]  = useState<string | null>(null)
  const [isLoading,    setIsLoading]    = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef    = useRef<HTMLDivElement>(null)
  const acknowledgedFields = useRef<Set<string>>(new Set())
  const prevFormDataRef   = useRef<ListingFormData>(formData)
  const aiLogo = getAsset('LOGO_AI') || '/assets/logos/rentals-ai-logo.png'

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Init: show first unanswered question ──────────────────────────────────────
  useEffect(() => {
    if (!conversationId || isInitialized) return
    setIsInitialized(true)

    const firstStep = getFirstUnansweredStep(formData)
    if (firstStep) {
      setCurrentStep(firstStep.step)
      setMessages([{
        id:        '0',
        role:      'assistant',
        content:   firstStep.question,
        buttons:   resolveButtons(firstStep.step, firstStep.question),
        timestamp: new Date().toISOString(),
      }])
    } else {
      // All key fields already filled
      setMessages([{
        id:        '0',
        role:      'assistant',
        content:   "All key fields are filled! You can ask me anything or use the form to adjust details.",
        timestamp: new Date().toISOString(),
      }])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // ── Watch formData for manual fills ──────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return
    const prev = prevFormDataRef.current
    const notifications: string[] = []

    for (const stepDef of SEQUENTIAL_STEPS) {
      const prevVal = getFormValueForStep(stepDef.step, prev)
      const currVal = getFormValueForStep(stepDef.step, formData)

      if (currVal && prevVal !== currVal && !acknowledgedFields.current.has(stepDef.step)) {
        acknowledgedFields.current.add(stepDef.step)
        notifications.push(`✓ ${stepDef.label} is already set to "${currVal}" from the form.`)

        // If the AI is currently asking about this field, auto-advance
        if (currentStep === stepDef.step) {
          advanceConversation(currVal)
        }
      }
    }

    if (notifications.length > 0) {
      setMessages(p => [...p, {
        id:        `sys-${Date.now()}`,
        role:      'system',
        content:   notifications.join('\n'),
        timestamp: new Date().toISOString(),
      }])
    }

    prevFormDataRef.current = formData
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, isInitialized, currentStep])

  /** Advance the conversation because the user manually filled the current field */
  const advanceConversation = useCallback(async (value: string) => {
    if (!conversationId) return
    setIsLoading(true)
    try {
      const res = await listingAssistantApi.processMessage(value, conversationId)
      const nextStep = res.current_step ?? null
      setCurrentStep(nextStep)
      setMessages(p => [...p, {
        id:        `a-${Date.now()}`,
        role:      'assistant',
        content:   res.ai_response,
        buttons:   resolveButtons(nextStep, res.ai_response),
        timestamp: new Date().toISOString(),
      }])
      if (res.extracted_data && Object.values(res.extracted_data).some(v => v != null)) {
        await onBulkFill(res.extracted_data)
      }
    } catch { /* silently ignore */ } finally { setIsLoading(false) }
  }, [conversationId, onBulkFill])

  /** Send a user message (from text input or quick-reply button) */
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || !conversationId || isLoading) return

    // Special action: generate description
    if (trimmed === '__generate_description__') {
      onGenerateDescription()
      setMessages(p => [...p, {
        id:        `u-${Date.now()}`,
        role:      'user',
        content:   '✨ Generate description',
        timestamp: new Date().toISOString(),
      }])
      return
    }

    setChatInput('')
    setMessages(p => [...p, {
      id:        `u-${Date.now()}`,
      role:      'user',
      content:   trimmed,
      timestamp: new Date().toISOString(),
    }])
    setIsLoading(true)
    try {
      const res = await listingAssistantApi.processMessage(trimmed, conversationId)
      const nextStep = res.current_step ?? null
      setCurrentStep(nextStep)
      setMessages(p => [...p, {
        id:        `a-${Date.now()}`,
        role:      'assistant',
        content:   res.ai_response,
        buttons:   resolveButtons(nextStep, res.ai_response),
        timestamp: new Date().toISOString(),
      }])
      if (res.extracted_data && Object.values(res.extracted_data).some(v => v != null)) {
        await onBulkFill(res.extracted_data)
      }
    } catch (err: unknown) {
      setMessages(p => [...p, {
        id:        `err-${Date.now()}`,
        role:      'assistant',
        content:   '⚠️ ' + (err instanceof Error ? err.message : 'Something went wrong.'),
        timestamp: new Date().toISOString(),
      }])
    } finally { setIsLoading(false) }
  }, [conversationId, isLoading, onBulkFill, onGenerateDescription])

  // Field completion status for the status panel
  const fieldStatuses: Array<{ label: string; value: string | null; warn?: boolean }> = [
    { label: 'Property Type', value: formData.category || null },
    { label: 'Title', value: formData.title ? formData.title.slice(0, 18) + (formData.title.length > 18 ? '…' : '') : null },
    { label: 'Location', value: [formData.city, formData.state].filter(Boolean).join(', ') || null },
    { label: 'Price', value: formData.price ? `₱${Number(formData.price).toLocaleString()}` : null },
    { label: 'Bedrooms', value: formData.bedrooms > 0 ? String(formData.bedrooms) : null },
    { label: 'Bathrooms', value: formData.bathrooms > 0 ? String(formData.bathrooms) : null },
    { label: 'Description', value: formData.description ? 'Set' : null, warn: !formData.description },
    { label: 'Images', value: `${formData.uploadedImages.length} / 5`, warn: formData.uploadedImages.length < 5 },
    { label: 'Floor Area', value: formData.floorArea > 0 ? `${formData.floorArea} ${formData.floorUnit}` : null },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={aiLogo}
            alt="Rentals Assist"
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
          />
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-gray-900 truncate">Rentals Assist</div>
            <div className="text-[12px] text-gray-500 truncate">AI Listing Assistant</div>
          </div>
        </div>
      </div>

      {/* Field completion status */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 bg-white">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.6px] mb-3">Field Completion</div>
        {fieldStatuses.map(({ label, value, warn }) => {
          const isDone = !!value && !warn
          const isWarn = !!value && !!warn
          return (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDone ? 'bg-emerald-600' : isWarn ? 'bg-amber-500' : 'bg-gray-300'}`} />
                <span className="text-[12px] text-gray-600">{label}</span>
              </div>
              <span className={`text-[12px] font-semibold max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap ${
                isWarn ? 'text-amber-600' : isDone ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {value || '—'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Sequential chat messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-white">
        {messages.map((msg, i) => {
          const isLastMsg = i === messages.length - 1

          if (msg.role === 'system') {
            // System notifications for manual fills — green pill style
            return (
              <div key={msg.id} className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-[10px] px-3 py-2">
                {msg.content}
              </div>
            )
          }

          return (
            <div key={msg.id}>
              {/* Bubble */}
              <div className={`flex gap-2 items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <img
                    src={aiLogo}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200 mt-[1px]"
                  />
                )}
                <div className={`text-[12px] leading-relaxed px-3 py-2 rounded-2xl max-w-[240px] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-md'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 rounded-tl-md'
                }`}>
                  {msg.content}
                </div>
              </div>

              {/* Quick-reply buttons — only on the last assistant message */}
              {msg.role === 'assistant' && isLastMsg && msg.buttons && msg.buttons.length > 0 && (
                <div className="ml-10 mt-2 flex flex-wrap gap-2">
                  {msg.buttons.map(btn => (
                    <button
                      key={btn.value}
                      onClick={() => sendMessage(btn.value)}
                      disabled={isLoading}
                      className="text-[12px] font-semibold px-3 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Loading dots */}
        {isLoading && (
          <div className="flex gap-2 items-start">
            <img src={aiLogo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200" />
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 flex gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Text input */}
      <div className="flex-shrink-0 flex gap-2 px-5 py-4 border-t border-gray-200 bg-white">
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput) } }}
          placeholder="Or type your answer…"
          className="flex-1 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-[10px] px-3 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 outline-none transition-colors"
        />
        <button
          onClick={() => sendMessage(chatInput)}
          disabled={!chatInput.trim() || isLoading}
          className="w-10 h-10 flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-[10px] flex items-center justify-center text-white transition-colors"
        >
          <FiSend className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UnifiedListingForm({ role }: UnifiedListingFormProps) {
  const router     = useRouter()
  const roleConfig = LISTING_ROLE_CONFIG[role] ?? LISTING_ROLE_CONFIG['agent']

  const {
    conversationId, isInitializing, formData, updateField, bulkFill,
    submit, uploadImages, removeUploadedImage, isSubmitting, isUploadingImages,
    error: hookError, clearError, recentlyFilledFields,
  } = useListingConversation(role, {
    onSubmitSuccess: () => setShowSuccessModal(true),
  })

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [coPilotOpen,       setCoPilotOpen]       = useState(true)
  const [expandedSections,  setExpandedSections]  = useState<Set<string>>(new Set(['property_details', 'property_location', 'property_images', 'amenities']))
  const [showSuccessModal,  setShowSuccessModal]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Location state ────────────────────────────────────────────────────────────
  const [availableCities, setAvailableCities] = useState<string[]>([])

  // ── AI generate description ───────────────────────────────────────────────────
  const [isGeneratingDesc,  setIsGeneratingDesc]  = useState(false)
  const [selectedTemplate,  setSelectedTemplate]  = useState<DescriptionTemplate>('narrative')

  const toggleSection = (id: string) =>
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  const aiFilled = (key: string) =>
    recentlyFilledFields.includes(key) ? 'border-emerald-600 bg-emerald-50 text-emerald-600 font-medium' : ''

  // Property Details styles to match provided design
  const PD_L = 'block text-[13px] font-semibold text-gray-500 mb-2'
  const PD_I = 'w-full h-11 border border-gray-300 rounded-[6px] px-3 text-[13px] text-gray-900 bg-white outline-none focus:border-blue-600 transition-colors'
  const PD_S = 'w-full h-11 border border-gray-300 rounded-[6px] px-3 pr-9 text-[13px] text-gray-900 bg-white outline-none appearance-none focus:border-blue-600 transition-colors'
  const PD_T = 'w-full border border-gray-300 rounded-[6px] px-3 py-3 text-[13px] text-gray-900 bg-white outline-none resize-none focus:border-blue-600 transition-colors'

  // ── Province → cities ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (formData.state) {
      const cities = getCitiesByProvince(formData.state)
      setAvailableCities(cities)
      if (formData.city && !cities.includes(formData.city)) updateField('city', '')
    } else setAvailableCities([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.state])

  // ── AI Generate Description ───────────────────────────────────────────────────
  const handleGenerateDescription = useCallback(async (template?: DescriptionTemplate) => {
    if (!conversationId) return
    setIsGeneratingDesc(true)
    try {
      const tpl = template ?? selectedTemplate
      const res = await listingAssistantApi.generateDescription(conversationId, tpl, '')
      if (res.success && res.description) updateField('description', res.description)
    } catch { /* ignore */ } finally { setIsGeneratingDesc(false) }
  }, [conversationId, selectedTemplate, updateField])

  // ── Image handling ────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) await uploadImages(files)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) await uploadImages(files)
  }

  const [customAmenityInput, setCustomAmenityInput] = useState('')
  const [showCustomAmenityInput, setShowCustomAmenityInput] = useState(false)
  const customAmenityRef = useRef<HTMLInputElement>(null)

  const handleAmenityToggle = (a: string) =>
    updateField('amenities', formData.amenities.includes(a)
      ? formData.amenities.filter(x => x !== a)
      : [...formData.amenities, a])

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenityInput.trim()
    if (!trimmed) return
    if (!formData.amenities.includes(trimmed)) {
      updateField('amenities', [...formData.amenities, trimmed])
    }
    setCustomAmenityInput('')
    setShowCustomAmenityInput(false)
  }

  const renderCardHeader = (
    id: string,
    label: string,
    right?: React.ReactNode,
  ) => {
    const isOpen = expandedSections.has(id)
    return (
      <div
        className={`px-6 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50 transition-colors ${isOpen ? 'border-b border-gray-200' : ''}`}
        onClick={() => toggleSection(id)}
      >
        <div className="text-[14px] font-semibold text-gray-900">{label}</div>
        <div className="flex items-center gap-3">
          {right}
          <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
    )
  }

  const handleUseCurrentLocation = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateField('latitude', String(pos.coords.latitude))
        updateField('longitude', String(pos.coords.longitude))
      },
      () => {
        // silent fail (permissions, etc.)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // ── Loading guard ─────────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-100">
        <AppSidebar />
        <main className="main-with-sidebar flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Setting up your listing session…</p>
          </div>
        </main>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <AppSidebar />
      <main className="main-with-sidebar flex-1 flex flex-col min-h-0 overflow-hidden">

        
        {/* 2-col content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Form area ── */}
          <div className="flex-1 min-h-0 overflow-y-auto px-8 py-7">

            {/* Error banner */}
            {hookError && (
              <div className="mb-4 flex items-start justify-between gap-3 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                <span>{hookError}</span>
                <button onClick={clearError} className="text-red-400 hover:text-red-600 flex-shrink-0"><FiX className="w-4 h-4" /></button>
              </div>
            )}

            <div className="space-y-4">
              {/* Property Details */}
              <div id="section-property_details" className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div
                  className={`px-6 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50 transition-colors ${
                    expandedSections.has('property_details') ? 'border-b border-gray-200' : ''
                  }`}
                  onClick={() => toggleSection('property_details')}
                >
                  <div className="flex items-center gap-3">
                    <HouseIcon className="w-5 h-5 text-blue-600" />
                    <div className="text-[14px] font-semibold text-gray-900">Property Details</div>
                  </div>
                  <FiChevronDown
                    className={`w-4 h-4 text-blue-600 transition-transform ${
                      expandedSections.has('property_details') ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {expandedSections.has('property_details') && (
                  <div className="px-6 py-5 space-y-5">
                    {/* Row 1: Property Name | Property Type (For Rent/Sale) | Type (House/Condo/etc) */}
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-4">
                        <label className={PD_L}>Property Name</label>
                        <input
                          className={`${PD_I} ${aiFilled('property_name')}`}
                          value={formData.title}
                          onChange={e => updateField('title', e.target.value)}
                          placeholder="Property Name"
                        />
                      </div>

                      <div className="col-span-4">
                        <label className={PD_L}>Property Type</label>
                        <div className="relative">
                          <select
                            className={PD_S}
                            value={formData.listingType}
                            onChange={e => updateField('listingType', e.target.value as ListingFormData['listingType'])}
                          >
                            <option value="for_rent">For Rent</option>
                            <option value="for_sale">For Sale</option>
                          </select>
                          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none w-4 h-4" />
                        </div>
                      </div>

                      <div className="col-span-4">
                        <label className={PD_L}>Type</label>
                        <div className="relative">
                          <select
                            className={`${PD_S} ${aiFilled('property_type')}`}
                            value={formData.category}
                            onChange={e => updateField('category', e.target.value)}
                          >
                            <option value="">Select</option>
                            {(roleConfig.allowedCategories ?? CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Property Price (wide) | Listing Type (Monthly/Weekly/Daily) */}
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-8">
                        <label className={PD_L}>Property Price</label>
                        <input
                          className={`${PD_I} ${aiFilled('price')}`}
                          value={formData.price}
                          onChange={e => updateField('price', e.target.value)}
                          placeholder="150,0000"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className={PD_L}>Listing Type</label>
                        {formData.listingType === 'for_rent' ? (
                          <div className="relative">
                            <select
                              className={`${PD_S} ${aiFilled('price_type')}`}
                              value={formData.priceType}
                              onChange={e => updateField('priceType', e.target.value as ListingFormData['priceType'])}
                            >
                              <option value="Monthly">Monthly</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Daily">Daily</option>
                              <option value="Yearly">Yearly</option>
                            </select>
                            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none w-4 h-4" />
                          </div>
                        ) : (
                          <div className="h-11 px-3 rounded-[6px] border border-gray-300 bg-gray-50 flex items-center text-[13px] text-gray-700">
                            For sale
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Bedrooms | Bathrooms | Garage | Floor Area */}
                    <div className="grid grid-cols-4 gap-6">
                      <div>
                        <label className={PD_L}>Bedrooms</label>
                        <input type="number" min={0} className={`${PD_I} ${aiFilled('bedrooms')}`} value={formData.bedrooms} onChange={e => updateField('bedrooms', Number(e.target.value))} placeholder="Property Name" />
                      </div>
                      <div>
                        <label className={PD_L}>Bathrooms</label>
                        <input type="number" min={0} className={`${PD_I} ${aiFilled('bathrooms')}`} value={formData.bathrooms} onChange={e => updateField('bathrooms', Number(e.target.value))} placeholder="Property Name" />
                      </div>
                      <div>
                        <label className={PD_L}>Garage</label>
                        <input type="number" min={0} className={PD_I} value={formData.garage} onChange={e => updateField('garage', Number(e.target.value))} placeholder="Property Name" />
                      </div>
                      <div>
                        <label className={PD_L}>Floor Area (SQM)</label>
                        <input type="number" min={0} className={`${PD_I} ${aiFilled('area_sqm')}`} value={formData.floorArea || ''} onChange={e => updateField('floorArea', Number(e.target.value))} placeholder="Property Name" />
                      </div>
                    </div>

                    <div>
                      <div className="text-[13px] font-semibold text-gray-500 tracking-[0.6px] uppercase mb-3">
                        Description
                      </div>
                      <div className="grid grid-cols-12 gap-6">
                        {/* Templates (match screenshot) */}
                        <div className="col-span-4 border border-gray-300 rounded-[6px] overflow-hidden bg-white">
                          <div className="bg-blue-600 text-white px-4 py-3 text-[13px] font-semibold">
                            Templates
                          </div>
                          <div className="divide-y divide-gray-200">
                            {(Object.entries(DESCRIPTION_TEMPLATES) as [DescriptionTemplate, typeof DESCRIPTION_TEMPLATES[DescriptionTemplate]][]).map(([key, tmpl]) => {
                              const isSelected = selectedTemplate === key
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => setSelectedTemplate(key)}
                                  className={`w-full text-left px-4 py-3 text-[13px] font-semibold transition-colors ${
                                    isSelected
                                      ? 'bg-gray-50 text-gray-900 border-l-4 border-blue-600'
                                      : 'bg-white text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  {tmpl.label}
                                </button>
                              )
                            })}
                          </div>
                          <div className="bg-blue-600 p-3">
                            <button
                              type="button"
                              onClick={() => handleGenerateDescription()}
                              disabled={!conversationId || isGeneratingDesc}
                              className="w-full h-11 rounded-[6px] bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold transition-colors"
                            >
                              {isGeneratingDesc ? 'Generating…' : 'Generate'}
                            </button>
                          </div>
                        </div>

                        {/* Description textarea */}
                        <div className="col-span-8">
                          <textarea
                            className={`${PD_T} ${aiFilled('description')}`}
                            rows={12}
                            value={formData.description}
                            onChange={e => updateField('description', e.target.value)}
                            placeholder="Lorem ipsum dolor sit amet..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Location */}
              <div id="section-property_location" className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {renderCardHeader('property_location', 'Property Location')}
                {expandedSections.has('property_location') && (
                  <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className={FL}>State/Province</label>
                        <div className="relative">
                          <select className={`${FS} ${aiFilled('location')}`} value={formData.state} onChange={e => updateField('state', e.target.value)}>
                            <option value="">Select</option>
                            {philippinesProvinces.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                          </select>
                          <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div>
                        <label className={FL}>City</label>
                        <div className="relative">
                          <select className={`${FS} ${aiFilled('location')}`} value={formData.city} onChange={e => updateField('city', e.target.value)} disabled={!formData.state}>
                            <option value="">Select</option>
                            {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div>
                        <label className={FL}>Latitude</label>
                        <input className={`${FI} ${aiFilled('latitude')}`} value={formData.latitude} onChange={e => updateField('latitude', e.target.value)} />
                      </div>
                      <div>
                        <label className={FL}>Longitude</label>
                        <input className={`${FI} ${aiFilled('longitude')}`} value={formData.longitude} onChange={e => updateField('longitude', e.target.value)} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-[0.5px]">
                        Set Property Location
                      </div>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-[8px] transition-colors"
                      >
                        Use Current Location
                      </button>
                    </div>

                    <LocationMap
                      latitude={formData.latitude || null}
                      longitude={formData.longitude || null}
                      onLocationChange={(lat, lng) => { updateField('latitude', lat); updateField('longitude', lng) }}
                      onAddressChange={addr => {
                        if (addr.country) updateField('country', addr.country)
                        if (addr.state)   updateField('state', addr.state)
                        if (addr.city)    updateField('city', addr.city)
                        if (addr.street)  updateField('street', addr.street)
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Property Images */}
              <div id="section-property_images" className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {renderCardHeader(
                  'property_images',
                  'Property Images',
                )}
                {expandedSections.has('property_images') && (
                  <div className="px-6 py-5 space-y-3">
                    <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-[0.5px]">
                      Upload files here (5 images required)
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
                    <div
                      className="border-[1.5px] border-dashed border-gray-300 rounded-[10px] py-12 flex flex-col items-center justify-center gap-2 text-[12px] text-gray-500 cursor-pointer hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 bg-gray-50 transition-all"
                      onDrop={handleDrop}
                      onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                    >
                      {isUploadingImages
                        ? <><span className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" /> Uploading…</>
                        : <><FiUploadCloud className="w-5 h-5" /> Drag & drop images here or click to upload</>}
                      <div className="text-[11px] text-gray-400">
                        {formData.uploadedImages.length} / 5 uploaded
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div id="section-amenities" className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {renderCardHeader(
                  'amenities',
                  'Amenities & Attributes',
                  !showCustomAmenityInput ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowCustomAmenityInput(true)
                        setTimeout(() => customAmenityRef.current?.focus(), 50)
                      }}
                      className="h-8 px-3 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-blue-700 text-[12px] font-semibold rounded-[8px] transition-colors"
                    >
                      + Add other
                    </button>
                  ) : null
                )}
                {expandedSections.has('amenities') && (
                  <div className="px-6 py-5 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES_LIST.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => handleAmenityToggle(a)}
                          className={`px-3 py-1.5 rounded-full border text-[12px] font-medium transition-all ${
                            formData.amenities.includes(a)
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>

                    {showCustomAmenityInput && (
                      <div className="flex items-center gap-2">
                        <input
                          ref={customAmenityRef}
                          autoFocus
                          type="text"
                          value={customAmenityInput}
                          onChange={e => setCustomAmenityInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleAddCustomAmenity() }
                            if (e.key === 'Escape') { setShowCustomAmenityInput(false); setCustomAmenityInput('') }
                          }}
                          placeholder="Type amenity..."
                          className="h-9 flex-1 max-w-[260px] border border-gray-300 focus:border-blue-600 rounded-[8px] px-3 text-[13px] text-gray-900 outline-none bg-white transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomAmenity}
                          disabled={!customAmenityInput.trim()}
                          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[12px] font-semibold rounded-[8px] transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowCustomAmenityInput(false); setCustomAmenityInput('') }}
                          className="h-9 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 text-[12px] font-semibold rounded-[8px] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-between mt-2 px-2">
                <button
                  type="button"
                  onClick={() => router.push(roleConfig.listingsPath)}
                  className="h-10 px-6 rounded-[8px] bg-gray-200 hover:bg-gray-300 text-gray-700 text-[12px] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={isSubmitting || !formData.title || !formData.category || !formData.price}
                  className="h-10 px-6 rounded-[8px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-semibold transition-colors"
                >
                  {isSubmitting ? 'Adding…' : 'Add Property'}
                </button>
              </div>
            </div>
          </div>

          {/* ── AI Co-Pilot Panel ── */}
          {coPilotOpen ? (
            <div className="w-[360px] flex-shrink-0 flex flex-col min-h-0 overflow-hidden border-l border-gray-200 bg-gray-100">
              <div className="p-4 min-h-0 flex flex-col">
                <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-0">
                  {/* Collapse handle (mirrors sidebar overflow button, but on left) */}
                  <button
                    type="button"
                    onClick={() => setCoPilotOpen(false)}
                    className="absolute -left-4 top-6 w-9 h-9 rounded-full text-gray-600 hover:text-gray-900 bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors z-20 flex items-center justify-center"
                    aria-label="Collapse listing assistant"
                    title="Collapse"
                  >
                    <FiChevronRight className="text-lg" />
                  </button>
                  <CoPilotPanel
                    conversationId={conversationId}
                    formData={formData}
                    onBulkFill={bulkFill}
                    onClose={() => setCoPilotOpen(false)}
                    onGenerateDescription={handleGenerateDescription}
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCoPilotOpen(true)}
              className="w-10 flex-shrink-0 bg-gray-50 border-l border-gray-200 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
              title="Open AI Co-Pilot"
            >
              <span className="inline-block w-[7px] h-[7px] rounded-full bg-blue-500 animate-pulse" />
              <span
                className="text-[10px] text-gray-400 font-semibold tracking-widest"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                AI CO-PILOT
              </span>
              <FiZap className="w-3.5 h-3.5 text-blue-500" />
            </button>
          )}

        </div>

      </main>

      {/* ── Success Modal ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

          {/* Card */}
          <div className="relative z-10 w-full max-w-[400px] bg-white rounded-[16px] shadow-2xl overflow-hidden">

            {/* Top accent strip */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #2563eb, #3b82f2)' }} />

            <div className="px-8 py-8 flex flex-col items-center text-center gap-2">
              {/* Check icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                <FiCheck className="w-8 h-8 text-emerald-600" />
              </div>

              <h2 className="text-[20px] font-bold text-gray-900">Listing Published!</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Your property listing is now live. What would you like to do next?
              </p>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  // Reload the page to reset the form for a new listing
                  window.location.href = `/${role}/create-listing`
                }}
                className="w-full flex items-center justify-center gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-[10px] transition-colors"
              >
                <span className="text-[16px] leading-none">+</span>
                Create Another Listing
              </button>

              <button
                type="button"
                onClick={() => router.push(roleConfig.listingsPath)}
                className="w-full flex items-center justify-center gap-2 h-11 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-blue-700 text-[13px] font-semibold rounded-[10px] transition-colors"
              >
                <FiList className="w-4 h-4 text-blue-700" />
                View My Listings
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
