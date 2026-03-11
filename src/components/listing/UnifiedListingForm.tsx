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
import { createThumbnail } from '@/utils/imageCompression'
import { philippinesProvinces, getCitiesByProvince } from '@/data/philippinesLocations'
import { listingAssistantApi } from '@/api/endpoints/listingAssistant'
import type { ListingAssistantMessage, DescriptionTemplate } from '@/types/listingAssistant'
import { DESCRIPTION_TEMPLATES } from '@/types/listingAssistant'
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiArrowRight,
  FiUploadCloud,
  FiPlayCircle,
  FiEdit,
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
      <div className="flex-shrink-0 flex items-center justify-between px-[18px] py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-900">
          <span className="inline-block w-[7px] h-[7px] rounded-full bg-blue-500 animate-pulse" />
          AI Co-Pilot
        </div>
        <button onClick={onClose} className="text-[16px] text-gray-400 hover:text-gray-900 leading-none transition-colors">
          ‹
        </button>
      </div>

      {/* Field completion status */}
      <div className="flex-shrink-0 px-[18px] py-3 border-b border-gray-200">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.6px] mb-2">Field Completion</div>
        {fieldStatuses.map(({ label, value, warn }) => {
          const isDone = !!value && !warn
          const isWarn = !!value && !!warn
          return (
            <div key={label} className="flex items-center justify-between py-[5px] border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDone ? 'bg-emerald-600' : isWarn ? 'bg-amber-500' : 'bg-gray-400'}`} />
                <span className="text-[12px] text-gray-400">{label}</span>
              </div>
              <span className={`text-[12px] font-medium max-w-[130px] overflow-hidden text-ellipsis whitespace-nowrap ${
                isWarn ? 'text-amber-500' : isDone ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {value || '—'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Sequential chat messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-[18px] py-3 flex flex-col gap-2.5">
        {messages.map((msg, i) => {
          const isLastMsg = i === messages.length - 1

          if (msg.role === 'system') {
            // System notifications for manual fills — green pill style
            return (
              <div key={msg.id} className="text-[11px] text-emerald-600 bg-emerald-600/10 border border-emerald-600/30 rounded-lg px-3 py-2 my-0.5">
                {msg.content}
              </div>
            )
          }

          return (
            <div key={msg.id}>
              {/* Bubble */}
              <div className={`flex gap-2 items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-[26px] h-[26px] bg-blue-600 rounded-md flex-shrink-0 flex items-center justify-center text-[12px] mt-[1px]">✦</div>
                )}
                <div className={`text-[12px] leading-relaxed px-3 py-2 rounded-lg max-w-[220px] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>

              {/* Quick-reply buttons — only on the last assistant message */}
              {msg.role === 'assistant' && isLastMsg && msg.buttons && msg.buttons.length > 0 && (
                <div className="ml-[34px] mt-2 flex flex-wrap gap-1.5">
                  {msg.buttons.map(btn => (
                    <button
                      key={btn.value}
                      onClick={() => sendMessage(btn.value)}
                      disabled={isLoading}
                      className="text-[11px] font-medium px-2.5 py-1 bg-gray-50 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-gray-900 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="w-[26px] h-[26px] bg-blue-600 rounded-md flex-shrink-0 flex items-center justify-center text-[12px]">✦</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg rounded-tl-none px-3 py-2 flex gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Text input */}
      <div className="flex-shrink-0 flex gap-2 px-[18px] py-3 border-t border-gray-200">
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput) } }}
          placeholder="Or type your answer…"
          className="flex-1 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-[6px] px-2.5 py-2 text-[12px] text-gray-900 placeholder-gray-400 outline-none transition-colors"
        />
        <button
          onClick={() => sendMessage(chatInput)}
          disabled={!chatInput.trim() || isLoading}
          className="w-[34px] h-[34px] flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-[6px] flex items-center justify-center text-white transition-colors"
        >
          <FiSend className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  )
}

// ─── Chat Full View ───────────────────────────────────────────────────────────

function ChatView({
  conversationId,
  onBulkFill,
}: {
  conversationId: string | null
  onBulkFill: ReturnType<typeof useListingConversation>['bulkFill']
}) {
  const [chatInput, setChatInput] = useState('')
  const [messages,  setMessages]  = useState<ListingAssistantMessage[]>([
    {
      role:      'assistant',
      content:   'Hi! Describe your property and I\'ll fill the listing form. E.g. "3BR condo in BGC, ₱45k/month, fully furnished, with parking"',
      timestamp: new Date().toISOString(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() || isLoading) return
    const text = chatInput.trim()
    setChatInput('')
    setMessages(p => [...p, { role: 'user', content: text, timestamp: new Date().toISOString() }])
    setIsLoading(true)
    try {
      const res = await listingAssistantApi.processMessage(text, conversationId)
      setMessages(p => [...p, { role: 'assistant', content: res.ai_response, timestamp: new Date().toISOString() }])
      if (res.extracted_data && Object.values(res.extracted_data).some(v => v != null)) {
        await onBulkFill(res.extracted_data)
        const filled = Object.entries(res.extracted_data).filter(([, v]) => v != null).map(([k]) => k)
        if (filled.length > 0)
          setMessages(p => [...p, {
            role: 'assistant',
            content: `✅ Filled: ${filled.join(', ')}. Switch to Form View to review.`,
            timestamp: new Date().toISOString(),
          }])
      }
    } catch (err: unknown) {
      setMessages(p => [...p, {
        role: 'assistant',
        content: '⚠️ ' + (err instanceof Error ? err.message : 'Something went wrong.'),
        timestamp: new Date().toISOString(),
      }])
    } finally { setIsLoading(false) }
  }, [chatInput, conversationId, isLoading, onBulkFill])

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-300 rounded-[10px] overflow-hidden flex flex-col" style={{ minHeight: 480 }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-300 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[14px]">✦</div>
        <div>
          <p className="text-[13px] font-semibold text-gray-900">AI Chat</p>
          <p className="text-[12px] text-gray-500">Describe your property, I'll fill the form</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-[26px] h-[26px] bg-blue-600 rounded-md flex-shrink-0 flex items-center justify-center text-white text-[12px] mt-[2px]">✦</div>
            )}
            <div className={`text-[13px] rounded-2xl px-4 py-2.5 max-w-[80%] ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-50 text-gray-900 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 items-start">
            <div className="w-[26px] h-[26px] bg-blue-600 rounded-md flex-shrink-0 flex items-center justify-center text-white text-[12px]">✦</div>
            <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-2.5 flex gap-1.5 items-center">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-shrink-0 p-4 border-t border-gray-300 flex gap-3">
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
          placeholder="Describe your property…"
          disabled={isLoading}
          className="flex-1 h-11 px-4 border border-gray-300 rounded-[10px] text-[13px] text-gray-900 bg-white outline-none focus:border-blue-600 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={!chatInput.trim() || isLoading}
          className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0 transition-colors"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </div>
    </div>
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
  const [viewMode,          setViewMode]          = useState<ViewMode>('form')
  const [coPilotOpen,       setCoPilotOpen]       = useState(true)
  const [expandedSections,  setExpandedSections]  = useState<Set<string>>(new Set(['category', 'details']))
  const [showSuccessModal,  setShowSuccessModal]  = useState(false)

  // ── AI Quick Fill state (independent from conversation) ───────────────────────
  const [pasteText,        setPasteText]        = useState('')
  const [isExtracting,     setIsExtracting]     = useState(false)
  const [extractError,     setExtractError]     = useState<string | null>(null)
  const [lastFilledFields, setLastFilledFields] = useState<string[]>([])

  // ── Image state ───────────────────────────────────────────────────────────────
  const [localThumbnails, setLocalThumbnails] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Location state ────────────────────────────────────────────────────────────
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [isGeocoding,     setIsGeocoding]     = useState(false)

  // ── AI generate description ───────────────────────────────────────────────────
  const [isGeneratingDesc,  setIsGeneratingDesc]  = useState(false)
  const [selectedTemplate,  setSelectedTemplate]  = useState<DescriptionTemplate>('narrative')

  // ── Computed ──────────────────────────────────────────────────────────────────
  const sectionDone = useMemo(() => ({
    category:   !!formData.category,
    details:    !!formData.title,
    location:   !!formData.state && !!formData.city,
    images:     formData.uploadedImages.length >= 5,
    pricing:    !!formData.price,
    attributes: formData.amenities.length > 0,
    review:     false,
  }), [formData])

  const completedCount    = Object.values(sectionDone).filter(Boolean).length
  const completionPercent = Math.round((completedCount / 7) * 100)

  const sectionPreview = useMemo(() => ({
    category:   formData.category,
    details:    formData.title,
    location:   [formData.city, formData.state].filter(Boolean).join(', '),
    images:     formData.uploadedImages.length > 0 ? `${formData.uploadedImages.length} photo(s)` : '',
    pricing:    formData.price ? (formData.listingType === 'for_sale' ? `₱ ${Number(formData.price).toLocaleString()} (For Sale)` : `₱ ${Number(formData.price).toLocaleString()} / ${formData.priceType}`) : '',
    attributes: formData.amenities.length > 0 ? formData.amenities.slice(0, 3).join(', ') : '',
    review:     '',
  }), [formData])

  const sectionHasAiFill = useCallback(
    (id: string) => SECTION_AI_FIELDS[id]?.some(f => recentlyFilledFields.includes(f)) ?? false,
    [recentlyFilledFields]
  )

  const toggleSection = (id: string) =>
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  const aiFilled = (key: string) =>
    recentlyFilledFields.includes(key) ? 'border-emerald-600 bg-emerald-50 text-emerald-600 font-medium' : ''

  // ── Province → cities ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (formData.state) {
      const cities = getCitiesByProvince(formData.state)
      setAvailableCities(cities)
      if (formData.city && !cities.includes(formData.city)) updateField('city', '')
    } else setAvailableCities([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.state])

  // ── Thumbnails ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const gen = async () => {
      const thumbs = await Promise.all(
        formData.images.map(f => createThumbnail(f, 200).catch(() => URL.createObjectURL(f)))
      )
      setLocalThumbnails(thumbs)
    }
    if (formData.images.length > 0) gen(); else setLocalThumbnails([])
  }, [formData.images])

  useEffect(() => {
    return () => localThumbnails.forEach(u => u.startsWith('blob:') && URL.revokeObjectURL(u))
  }, [localThumbnails])

  // ─────────────────────────────────────────────────────────────────────────────
  // AI QUICK FILL — completely separate from the conversational assistant.
  //
  // Uses processMessage(text, null) → creates a temporary independent extraction
  // with NO conversation context, then syncs the result into the main conversation
  // via updateData() so the CoPilot knows not to ask about already-filled fields.
  // ─────────────────────────────────────────────────────────────────────────────
  const handleQuickFill = async () => {
    if (!pasteText.trim()) return
    setIsExtracting(true)
    setExtractError(null)
    setLastFilledFields([])
    try {
      // ↓ null conversationId = standalone extraction, separate from AI chat flow
      const res = await listingAssistantApi.processMessage(pasteText.trim(), null)
      const nonNull = Object.entries(res.extracted_data).filter(([, v]) => v != null)

      if (nonNull.length > 0) {
        // Apply to form
        await bulkFill(res.extracted_data)
        setLastFilledFields(nonNull.map(([k]) => k))
        setPasteText('')

        // Sync to main conversation so the sequential assistant skips filled fields
        if (conversationId) {
          await listingAssistantApi.updateData(conversationId, res.extracted_data)
        }
      } else {
        setExtractError("Couldn't extract any fields. Try adding type, location, price, or bedrooms.")
      }
    } catch (err: unknown) {
      setExtractError(err instanceof Error ? err.message : 'Extraction failed. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

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

  // ── Street geocoding ──────────────────────────────────────────────────────────
  const handleStreetChange = async (value: string) => {
    updateField('street', value)
    if (value.trim().length > 10) {
      setIsGeocoding(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value + ', Philippines')}&limit=1`,
          { headers: { 'User-Agent': 'Rental.ph Property Listing' } }
        )
        const json = await res.json()
        if (json?.[0]) {
          const r = json[0]
          updateField('latitude', r.lat); updateField('longitude', r.lon); updateField('country', 'Philippines')
          const addr = r.display_name || ''
          const prov = philippinesProvinces.find(p => addr.includes(p.name))
          if (prov) {
            updateField('state', prov.name)
            const cityMatch = prov.cities.find((c: string) => addr.includes(c))
            if (cityMatch) updateField('city', cityMatch)
          }
        }
      } catch { /* ignore */ } finally { setIsGeocoding(false) }
    }
  }

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

  // ── Section header renderer ───────────────────────────────────────────────────
  const renderSectionHeader = (
    id: string, num: number, label: string, subtitle: string, extra?: React.ReactNode
  ) => {
    const isOpen  = expandedSections.has(id)
    const isDone  = sectionDone[id as keyof typeof sectionDone] ?? false
    const hasAi   = sectionHasAiFill(id)
    const preview = sectionPreview[id as keyof typeof sectionPreview] ?? ''

    return (
      <div
        className={`px-[18px] py-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50 transition-colors ${isOpen ? 'border-b border-gray-300' : ''}`}
        onClick={() => toggleSection(id)}
      >
        <div className="flex items-center gap-2.5">
          <SectionBadge num={num} isDone={isDone} isActive={isOpen && !isDone} />
          <div>
            <div className="text-[13px] font-semibold text-gray-900">{label}</div>
            {isOpen && <div className="text-[12px] text-gray-500">{subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {hasAi && <span className="text-[10px] text-emerald-600 font-semibold">✦ AI filled</span>}
          {extra}
          {!isOpen && preview && <span className="text-[12px] text-gray-500 italic">{preview}</span>}
          {isOpen ? <FiChevronUp className="text-gray-500 w-3.5 h-3.5 flex-shrink-0" />
                  : <FiChevronDown className="text-gray-500 w-3.5 h-3.5 flex-shrink-0" />}
        </div>
      </div>
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

        {/* ── Topbar ── */}
        <nav className="flex-shrink-0 bg-gray-50/95 border-b border-gray-200 h-14 px-8 flex items-center justify-between z-50 shadow-sm">
          <div className="flex items-center gap-1.5 text-[13px]">
            <button onClick={() => router.push(roleConfig.listingsPath)} className="text-gray-500 hover:text-blue-600 transition-colors">
              Listings
            </button>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium">New Listing</span>
          </div>

          <div className="flex bg-gray-50 border border-gray-300 rounded-[8px] p-[3px] gap-[2px]">
            {(['form', 'chat'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3.5 py-[5px] rounded-[6px] text-[12px] font-medium transition-all ${
                  viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {mode === 'form' ? <FiList className="w-3 h-3" /> : <FiMessageSquare className="w-3 h-3" />}
                {mode === 'form' ? 'Form View' : 'Chat View'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-gray-500 bg-gray-50 border border-gray-300 px-2.5 py-[3px] rounded-full">
              ● Draft saved
            </span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-[3px] rounded-full uppercase tracking-[0.5px]">
              {role}
            </span>
          </div>
        </nav>

        {/* ── Chat View ── */}
        {viewMode === 'chat' && (
          <div className="flex-1 min-h-0 overflow-y-auto p-8">
            <ChatView conversationId={conversationId} onBulkFill={bulkFill} />
          </div>
        )}

        {/* ── Form View ── */}
        {viewMode === 'form' && (
          <>
            {/* ─────────────────────────────────────────────────────────────────
              AI QUICK FILL BAR
              Functionally independent from the AI listing assistant conversation.
              Sends text to processMessage(text, null) — no conversationId —
              so it uses its own extraction context.
            ───────────────────────────────────────────────────────────────── */}
            <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-8 py-4 flex items-center gap-4 shadow-sm">
              <div className="w-8 h-8 rounded-[8px] bg-blue-600 flex items-center justify-center text-[15px] flex-shrink-0">✨</div>
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.6px] mb-1.5">AI Quick Fill</div>
                <div className="flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 rounded-[6px] overflow-hidden transition-colors">
                  <input
                    value={pasteText}
                    onChange={e => { setPasteText(e.target.value); setExtractError(null); setLastFilledFields([]) }}
                    onKeyDown={e => { if (e.key === 'Enter') handleQuickFill() }}
                    placeholder='Paste a description — "3BR condo in BGC, ₱45k/month, fully furnished with parking"'
                    className="flex-1 bg-transparent border-none outline-none px-3.5 py-[9px] text-[13px] text-gray-900 placeholder-gray-400"
                  />
                  <button
                    onClick={handleQuickFill}
                    disabled={!pasteText.trim() || isExtracting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-[9px] text-white text-[12px] font-semibold flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap transition-colors"
                  >
                    {isExtracting
                      ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Extracting…</>
                      : <><FiArrowRight className="w-3 h-3" /> Fill Form</>}
                  </button>
                </div>
                {extractError && <p className="mt-1 text-[11px] text-red-400">{extractError}</p>}
              </div>

              {lastFilledFields.length > 0 && (
                <div className="flex-shrink-0 min-w-[140px]">
                  <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-[0.6px] mb-1">✓ Fields filled</div>
                  <div className="flex flex-wrap gap-1">
                    {lastFilledFields.slice(0, 5).map(f => (
                      <span key={f} className="text-[11px] bg-emerald-600 text-white px-2 py-[2px] rounded-full font-medium">
                        ✓ {FIELD_LABELS[f] || f}
                      </span>
                    ))}
                    {lastFilledFields.length > 5 && (
                      <span className="text-[11px] bg-emerald-600 text-white px-2 py-[2px] rounded-full font-medium">
                        +{lastFilledFields.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2-col content */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

              {/* ── Form area ── */}
              <div className="flex-1 min-h-0 overflow-y-auto px-8 py-7">

                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-1 bg-gray-300 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${completionPercent}%`, background: 'linear-gradient(90deg, #2563eb, #3b82f2)' }}
                    />
                  </div>
                  <span className="text-[12px] text-gray-500 whitespace-nowrap">
                    {completedCount} of 7 sections · {completionPercent}% complete
                  </span>
                </div>

                {/* Error banner */}
                {hookError && (
                  <div className="mb-4 flex items-start justify-between gap-3 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                    <span>{hookError}</span>
                    <button onClick={clearError} className="text-red-400 hover:text-red-600 flex-shrink-0"><FiX className="w-4 h-4" /></button>
                  </div>
                )}

                {/* ── Accordion sections ── */}
                <div className="space-y-3">

                  {/* 1. Category */}
                  <div id="section-category" className="bg-white/95 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {renderSectionHeader('category', 1, 'Category', 'Property type')}
                    {expandedSections.has('category') && (
                      <div className="px-[18px] py-4">
                        <label className={FL}>Property Category</label>
                        <div className="relative max-w-xs">
                          <select className={`${FS} ${aiFilled('property_type')}`} value={formData.category} onChange={e => updateField('category', e.target.value)}>
                            <option value="">Select a category</option>
                            {(roleConfig.allowedCategories ?? CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Property Details */}
                  <div id="section-details" className="bg-white/95 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {renderSectionHeader('details', 2, 'Property Details', 'Title, description & specs')}
                    {expandedSections.has('details') && (
                      <div className="px-[18px] py-4 space-y-3">
                        <div>
                          <label className={FL}>Listing Title</label>
                          <input className={`${FI} ${aiFilled('property_name')}`} value={formData.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g. Fully Furnished 3BR Condo in BGC" />
                          {recentlyFilledFields.includes('property_name') && (
                            <div className="mt-1 text-[10px] text-emerald-600 font-semibold">✦ Suggested by AI</div>
                          )}
                        </div>

                        <div>
                          {/* Description header */}
                          <label className={FL}>Description</label>

                          {/* Template picker + Generate button */}
                          <div className="border border-gray-300 rounded-[8px] bg-gray-50 p-3 mb-2 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.5px]">✨ AI Generate · Style</span>
                              <button
                                type="button"
                                disabled={!formData.category || !formData.title || isGeneratingDesc}
                                onClick={() => handleGenerateDescription()}
                                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isGeneratingDesc
                                  ? <><span className="w-3 h-3 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
                                  : <>✨ Generate</>}
                              </button>
                            </div>

                            {/* 5 template pills — one row, scrollable if narrow */}
                            <div className="flex gap-1.5 flex-wrap">
                              {(Object.entries(DESCRIPTION_TEMPLATES) as [DescriptionTemplate, typeof DESCRIPTION_TEMPLATES[DescriptionTemplate]][]).map(([key, tmpl]) => {
                                const isSelected = selectedTemplate === key
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSelectedTemplate(key)}
                                    title={tmpl.description}
                                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
                                      isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                        : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                                    }`}
                                  >
                                    {tmpl.label}
                                  </button>
                                )
                              })}
                            </div>

                            {/* Selected template description */}
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                              {DESCRIPTION_TEMPLATES[selectedTemplate].description}
                            </p>
                          </div>

                          {/* Textarea */}
                          <textarea
                            className={`${FT} ${aiFilled('description')}`}
                            rows={5}
                            value={formData.description}
                            onChange={e => updateField('description', e.target.value)}
                            placeholder="Write a description or click ✨ Generate to create one with AI…"
                          />
                          {recentlyFilledFields.includes('description') && (
                            <div className="mt-1 text-[10px] text-emerald-600 font-semibold">✦ Generated by AI</div>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className={FL}>Bedrooms</label>
                            <input type="number" min={0} className={`${FI} ${aiFilled('bedrooms')}`} value={formData.bedrooms} onChange={e => updateField('bedrooms', Number(e.target.value))} />
                          </div>
                          <div>
                            <label className={FL}>Bathrooms</label>
                            <input type="number" min={0} className={`${FI} ${aiFilled('bathrooms')}`} value={formData.bathrooms} onChange={e => updateField('bathrooms', Number(e.target.value))} />
                          </div>
                          <div>
                            <label className={FL}>Garage</label>
                            <input type="number" min={0} className={FI} value={formData.garage} onChange={e => updateField('garage', Number(e.target.value))} />
                          </div>
                          <div>
                            <label className={FL}>Floor Area (sqm)</label>
                            <input type="number" min={0} className={`${FI} ${aiFilled('area_sqm')}`} value={formData.floorArea || ''} onChange={e => updateField('floorArea', Number(e.target.value))} placeholder="e.g. 75" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Location */}
                  <div id="section-location" className="bg-white/95 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {renderSectionHeader('location', 3, 'Location', 'Address & map')}
                    {expandedSections.has('location') && (
                      <div className="px-[18px] py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={FL}>State / Province</label>
                            <div className="relative">
                              <select className={`${FS} ${aiFilled('location')}`} value={formData.state} onChange={e => updateField('state', e.target.value)}>
                                <option value="">--Select--</option>
                                {philippinesProvinces.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                              </select>
                              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div>
                            <label className={FL}>City</label>
                            <div className="relative">
                              <select className={`${FS} ${aiFilled('location')}`} value={formData.city} onChange={e => updateField('city', e.target.value)} disabled={!formData.state}>
                                <option value="">--Select--</option>
                                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className={FL}>Street Address</label>
                          <input className={`${FI} ${aiFilled('address')}`} value={formData.street} onChange={e => handleStreetChange(e.target.value)} placeholder="Enter street address" />
                          {isGeocoding && <p className="mt-1 text-[11px] text-emerald-600">● Detecting location…</p>}
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

                  {/* 4. Property Images */}
                  <div id="section-images" className="bg-white/95 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {renderSectionHeader(
                      'images', 4, 'Property Images', 'Min. 5 images required',
                      <span className={`text-[12px] font-semibold ${formData.uploadedImages.length >= 5 ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {formData.uploadedImages.length} / 5 {formData.uploadedImages.length < 5 ? '⚠' : '✓'}
                      </span>
                    )}
                    {expandedSections.has('images') && (
                      <div className="px-[18px] py-4">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />

                        {formData.uploadedImages.length > 0 && (
                          <div className="grid grid-cols-5 gap-2 mb-3">
                            {formData.uploadedImages.map((img, i) => (
                              <div key={i} className="relative aspect-square rounded-[6px] overflow-hidden border border-gray-300">
                                <img src={img.url} alt={img.original_name} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeUploadedImage(i)}
                                  className="absolute top-1 right-1 w-5 h-5 bg-white/80 hover:bg-red-500 hover:text-white text-gray-600 rounded-full flex items-center justify-center transition-all">
                                  <FiX className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {formData.uploadedImages.length < 10 && (
                              <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="aspect-square rounded-[6px] border-[1.5px] border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-sm hover:border-blue-600 hover:text-blue-600 bg-gray-50 transition-all">
                                + Add
                              </button>
                            )}
                          </div>
                        )}

                        {formData.images.length > 0 && (
                          <div className="grid grid-cols-5 gap-2 mb-3 opacity-60">
                            {formData.images.map((img, i) => (
                              <div key={i} className="relative aspect-square rounded-[6px] overflow-hidden border border-gray-300">
                                <img src={localThumbnails[i] || URL.createObjectURL(img)} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        <div
                          className="border-[1.5px] border-dashed border-gray-400 rounded-[6px] p-4 flex items-center justify-center gap-2 text-[12px] text-gray-500 cursor-pointer hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 bg-gray-50 transition-all"
                          onDrop={handleDrop} onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                          onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}
                        >
                          {isUploadingImages
                            ? <><span className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" /> Uploading…</>
                            : <><FiUploadCloud className="w-4 h-4" /> Drag & drop images here or click to browse</>}
                        </div>

                        <div className="mt-3">
                          <label className={FL}>Video Link (Optional)</label>
                          <div className="flex">
                            <div className="flex items-center px-2.5 bg-gray-50 border border-gray-300 border-r-0 rounded-l-[6px]">
                              <FiPlayCircle className="text-gray-500 w-4 h-4" />
                            </div>
                            <input
                              className="flex-1 h-9 border border-gray-300 rounded-r-[6px] px-2.5 text-[13px] text-gray-900 bg-white outline-none focus:border-blue-600 transition-colors"
                              placeholder="YouTube / video link"
                              value={formData.videoUrl}
                              onChange={e => updateField('videoUrl', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5. Pricing */}
                  <div id="section-pricing" className="bg-white/95 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {renderSectionHeader('pricing', 5, 'Pricing', 'Rent amount & frequency')}
                    {expandedSections.has('pricing') && (
                      <div className="px-[18px] py-4">
                        {/* Listing Type toggle */}
                        <div>
                          <label className={FL}>Listing Type</label>
                          <div className="flex gap-2">
                            <button type="button"
                              onClick={() => updateField('listingType', 'for_rent')}
                              className={`flex-1 h-9 rounded-lg border-2 text-[12px] font-semibold transition-all ${formData.listingType === 'for_rent' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300'}`}>
                              For Rent
                            </button>
                            <button type="button"
                              onClick={() => updateField('listingType', 'for_sale')}
                              className={`flex-1 h-9 rounded-lg border-2 text-[12px] font-semibold transition-all ${formData.listingType === 'for_sale' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'}`}>
                              For Sale
                            </button>
                          </div>
                        </div>
                        <div className={`grid gap-3 ${formData.listingType === 'for_rent' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          <div>
                            <label className={FL}>{formData.listingType === 'for_sale' ? 'Selling Price (₱)' : 'Price (₱)'}</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-gray-500">₱</span>
                              <input type="text" className={`${FI} pl-6 ${aiFilled('price')}`} placeholder={formData.listingType === 'for_sale' ? 'e.g. 4500000' : 'e.g. 45000'} value={formData.price} onChange={e => updateField('price', e.target.value)} />
                            </div>
                          </div>
                          {formData.listingType === 'for_rent' && (
                            <div>
                              <label className={FL}>Price Type</label>
                              <div className="relative">
                                <select className={`${FS} ${aiFilled('price_type')}`} value={formData.priceType} onChange={e => updateField('priceType', e.target.value as 'Monthly' | 'Weekly' | 'Daily' | 'Yearly')}>
                                  <option value="Monthly">Monthly</option>
                                  <option value="Weekly">Weekly</option>
                                  <option value="Daily">Daily</option>
                                  <option value="Yearly">Yearly</option>
                                </select>
                                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-3.5 h-3.5" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 6. Amenities */}
                  <div id="section-attributes" className="bg-white/95 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {renderSectionHeader('attributes', 6, 'Amenities & Attributes', 'Features & facilities')}
                    {expandedSections.has('attributes') && (
                      <div className="px-[18px] py-4 space-y-3">

                        {/* Preset amenity pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {AMENITIES_LIST.map(a => (
                            <button key={a} type="button" onClick={() => handleAmenityToggle(a)}
                              className={`px-2.5 py-1 rounded-full border text-[11px] font-medium cursor-pointer transition-all ${
                                formData.amenities.includes(a)
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                              }`}>
                              {a}
                            </button>
                          ))}
                        </div>

                        {/* Custom amenities added by the user */}
                        {formData.amenities.filter(a => !AMENITIES_LIST.includes(a)).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.amenities
                              .filter(a => !AMENITIES_LIST.includes(a))
                              .map(a => (
                                <span
                                  key={a}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium bg-blue-50 border-blue-600 text-blue-600"
                                >
                                  {a}
                                  <button
                                    type="button"
                                    onClick={() => updateField('amenities', formData.amenities.filter(x => x !== a))}
                                    className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-blue-600 hover:text-white transition-colors leading-none"
                                    title={`Remove ${a}`}
                                  >
                                    <FiX className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Add custom amenity row */}
                        {showCustomAmenityInput ? (
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
                              placeholder="e.g. Rooftop access"
                              className="h-8 flex-1 max-w-[200px] border border-blue-600 focus:border-blue-600 rounded-full px-3 text-[12px] text-gray-900 outline-none bg-white"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomAmenity}
                              disabled={!customAmenityInput.trim()}
                              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-semibold rounded-full transition-colors"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowCustomAmenityInput(false); setCustomAmenityInput('') }}
                              className="h-8 px-3 border border-gray-300 text-gray-500 hover:text-gray-900 text-[11px] rounded-full transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomAmenityInput(true)
                              setTimeout(() => customAmenityRef.current?.focus(), 50)
                            }}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-blue-600 border border-dashed border-gray-400 hover:border-blue-600 px-2.5 py-1 rounded-full transition-all"
                          >
                            <span className="text-[14px] leading-none">+</span> Add other
                          </button>
                        )}

                      </div>
                    )}
                  </div>

                  {/* 7. Review & Publish */}
                  <div id="section-review" className="bg-white/95 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {renderSectionHeader(
                      'review', 7, 'Review & Publish', 'Final check before publishing',
                      (!sectionDone.category || !sectionDone.details || !sectionDone.pricing)
                        ? <span className="text-[12px] text-[#ADA69C]">Complete sections above first</span>
                        : null
                    )}
                    {expandedSections.has('review') && (
                      <div className="px-[18px] py-4">
                        {([
                          { label: 'Category',   value: formData.category || 'Not set', sid: 'category' },
                          { label: 'Title',      value: formData.title || 'Not set',    sid: 'details'  },
                          { label: 'Price',      value: formData.price ? (formData.listingType === 'for_sale' ? `₱ ${Number(formData.price).toLocaleString()} (For Sale)` : `₱ ${Number(formData.price).toLocaleString()} / ${formData.priceType}`) : 'Not set', sid: 'pricing' },
                          { label: 'Location',   value: [formData.city, formData.state].filter(Boolean).join(', ') || 'Not set', sid: 'location' },
                          { label: 'Bedrooms',   value: String(formData.bedrooms),  sid: 'details' },
                          { label: 'Bathrooms',  value: String(formData.bathrooms), sid: 'details' },
                          { label: 'Floor Area', value: formData.floorArea ? `${formData.floorArea} ${formData.floorUnit}` : 'Not set', sid: 'details' },
                        ]).map(({ label, value, sid }) => (
                          <div key={label} className="flex items-center justify-between py-2 border-b border-gray-300 last:border-0">
                            <span className="text-[12px] text-gray-500">{label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-medium text-gray-900 max-w-[200px] truncate">{value}</span>
                              <button type="button"
                                onClick={() => {
                                  if (!expandedSections.has(sid)) toggleSection(sid)
                                  setTimeout(() => document.getElementById(`section-${sid}`)?.scrollIntoView({ behavior: 'smooth' }), 100)
                                }}
                                className="flex items-center gap-1 text-[11px] text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors">
                                <FiEdit className="w-3 h-3" /> Edit
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>{/* /sections */}

                {/* Submit bar */}
                <div className="mt-3 flex items-center justify-between p-4 bg-white/95 border border-gray-200 rounded-xl shadow-sm">
                  <div className="text-[12px] text-gray-500">
                    {formData.uploadedImages.length < 5 ? (
                      <><strong className="text-gray-900">{5 - formData.uploadedImages.length} more image{5 - formData.uploadedImages.length !== 1 ? 's' : ''} needed</strong> to publish</>
                    ) : (
                      <strong className="text-emerald-600">Ready to publish!</strong>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => router.push(roleConfig.listingsPath)}
                      className="px-4 py-2 rounded-[6px] border border-blue-200 text-[13px] font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-300 bg-blue-50 transition-all">
                      Cancel
                    </button>
                    <button type="button" onClick={submit}
                      disabled={isSubmitting || !formData.price || !formData.category || !formData.title}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-[6px] transition-colors">
                      {isSubmitting
                        ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing…</>
                        : <>Publish Listing <FiArrowRight className="w-3.5 h-3.5" /></>}
                    </button>
                  </div>
                </div>

              </div>{/* /form area */}

              {/* ── AI Co-Pilot Panel ── */}
              {coPilotOpen ? (
                <div className="w-[340px] flex-shrink-0 bg-gray-50 flex flex-col min-h-0 overflow-hidden border-l border-gray-200 shadow-[ -4px_0_16px_rgba(0,0,0,0.06)]">
                  <CoPilotPanel
                    conversationId={conversationId}
                    formData={formData}
                    onBulkFill={bulkFill}
                    onClose={() => setCoPilotOpen(false)}
                    onGenerateDescription={handleGenerateDescription}
                  />
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

            </div>{/* /2-col */}
          </>
        )}

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
