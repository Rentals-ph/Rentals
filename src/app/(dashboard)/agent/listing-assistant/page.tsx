'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConversationalListingAssistant } from '@/components/listing-assistant'
import VerticalPropertyCard from '@/components/common/VerticalPropertyCard'
import type { ExtractedPropertyData } from '@/types/listingAssistant'
import { PROPERTY_TYPE_LABELS } from '@/types/listingAssistant'
import { formatPrice } from '@/types/listingAssistant'

/* Listing assistant only: cap image height so title, price, details stay visible */
const propertyCardStyles = `
  .property-card-container article {
    height: 100% !important;
    max-height: 100% !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: unset !important;
  }
  .property-card-container article > div:first-child {
    max-height: 200px !important;
    height: 200px !important;
    min-height: 200px !important;
    flex-shrink: 0 !important;
  }
  .property-card-container article > div:first-child img {
    object-fit: cover !important;
    height: 100% !important;
  }
`

export default function ListingAssistantPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedPropertyData>({})

  useEffect(() => {
    const id = searchParams.get('conversation')
    if (id) {
      setConversationId(id)
    }
  }, [searchParams])

  const handleListingSubmitted = (propertyId: number) => {
    router.push(`/agent/listings?highlight=${propertyId}`)
  }

  const handleDataChange = (data: ExtractedPropertyData) => {
    setExtractedData(data)
  }

  const formatPropertyData = () => {
    const images = extractedData.images?.map(img => img.url) || []
    const firstImage = images[0] || undefined
    const price = extractedData.price
      ? formatPrice(extractedData.price as number)
      : undefined
    const propertyType = extractedData.property_type
      ? PROPERTY_TYPE_LABELS[extractedData.property_type as keyof typeof PROPERTY_TYPE_LABELS] || String(extractedData.property_type)
      : undefined
    return {
      title: extractedData.property_name as string || 'Property Name',
      price: price || 'Price',
      priceType: extractedData.price_type || 'Price Type',
      propertyType: propertyType || 'Property',
      location: extractedData.location as string || extractedData.address as string || 'Location',
      bedrooms: typeof extractedData.bedrooms === 'number' ? extractedData.bedrooms : 0,
      bathrooms: typeof extractedData.bathrooms === 'number' ? extractedData.bathrooms : 0,
      parking: typeof extractedData.parking_slots === 'number' ? extractedData.parking_slots : 0,
      propertySize: extractedData.area_sqm ? `${extractedData.area_sqm} sqm` : '—',
      image: firstImage,
      images: images.length > 0 ? images : undefined,
    }
  }

  const propertyCardData = formatPropertyData()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: propertyCardStyles }} />

        {/* Hero chat-mode layout: single rounded container, two-column content; cap height so it doesn't dominate viewport */}
        <div className="flex flex-col flex-1 min-h-0 w-full max-w-7xl mx-auto max-h-[calc(100vh-8rem)]">
          <div className="flex flex-col h-full min-h-0 w-full bg-white/80 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 flex-1 min-h-0 min-w-0 p-3 sm:p-4 bg-gray-100/50 h-full">
              {/* Left: Chat panel (Hero chat-mode design) */}
              <div className="flex flex-col flex-[3] min-w-0 min-h-0 md:max-w-none bg-white rounded-xl sm:rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden order-1 flex-shrink-0">
                <ConversationalListingAssistant
                  initialConversationId={conversationId || undefined}
                  onListingSubmitted={handleListingSubmitted}
                  onDataChange={handleDataChange}
                />
              </div>
              {/* Right: Property card (Hero left-column style) */}
              <div className="flex flex-col flex-[3] min-w-0 min-h-0 bg-white rounded-xl sm:rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden order-2">
                <div className="flex-1 min-h-0 overflow-hidden p-4 property-card-container">
                  <VerticalPropertyCard {...propertyCardData} />
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  )
}
