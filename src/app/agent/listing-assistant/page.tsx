'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppSidebar from '../../../components/common/AppSidebar'
import AgentHeader from '../../../components/agent/AgentHeader'
import { ConversationalListingAssistant } from '../../../components/listing-assistant'
import VerticalPropertyCard from '../../../components/common/VerticalPropertyCard'
import type { ExtractedPropertyData } from '../../../types/listingAssistant'
import { PROPERTY_TYPE_LABELS } from '../../../types/listingAssistant'
import { formatPrice } from '../../../types/listingAssistant'

// Styles to make property card fill container in listing assistant
const propertyCardStyles = `
  .property-card-container article {
    height: 100% !important;
    max-height: 100% !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: unset !important;
  }
  .property-card-container article > div:first-child {
    max-height: 450px !important;
    height: 450px !important;
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
    // Show success and redirect after a delay
    setTimeout(() => {
      router.push(`/agent/listings?highlight=${propertyId}`)
    }, 3000)
  }

  const handleDataChange = (data: ExtractedPropertyData) => {
    setExtractedData(data)
  }

  // Format property data for VerticalPropertyCard
  const formatPropertyData = () => {
    const images = extractedData.images?.map(img => img.url) || []
    const firstImage = images[0] || undefined
    
    const price = extractedData.price 
      ? formatPrice(extractedData.price as number) + (extractedData.price_type ? `/${extractedData.price_type}` : '')
      : undefined

    const propertyType = extractedData.property_type
      ? PROPERTY_TYPE_LABELS[extractedData.property_type as keyof typeof PROPERTY_TYPE_LABELS] || String(extractedData.property_type)
      : undefined

    return {
      title: extractedData.property_name as string || 'New Property Listing',
      price: price || 'Price TBD',
      propertyType: propertyType || 'Property',
      location: extractedData.location as string || extractedData.address as string,
      bedrooms: extractedData.bedrooms as number,
      bathrooms: extractedData.bathrooms as number,
      parking: extractedData.parking_slots as number,
      propertySize: extractedData.area_sqm ? `${extractedData.area_sqm} sqm` : undefined,
      image: firstImage,
      images: images.length > 0 ? images : undefined,
      date: new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
    }
  }

  const propertyCardData = formatPropertyData()

  return (
    <div className="flex min-h-screen bg-gray-100 font-outfit">
      <style dangerouslySetInnerHTML={{ __html: propertyCardStyles }} />
      <AppSidebar />
      <main className="main-with-sidebar flex-1 p-8 min-h-screen lg:p-6 md:p-4">
        <AgentHeader 
          title="AI Listing Assistant" 
          subtitle="Create property listings with the help of AI" 
        />

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 mb-6 border border-indigo-200 sm:p-4">
          <div className="flex items-start gap-4 mb-4 lg:flex-col lg:items-start sm:flex-col sm:items-start">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] sm:w-10 sm:h-10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 m-0 mb-1">Create Your Listing Naturally</h2>
              <p className="text-sm text-gray-600 m-0 leading-relaxed">
                Just describe your property in natural language - the AI will extract all the details 
                and help you create a professional listing in minutes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap sm:flex-col sm:items-start">
            <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Try saying:</span>
            <div className="flex gap-2 flex-wrap sm:w-full sm:overflow-x-auto sm:flex-nowrap sm:pb-2">
              <span className="bg-white px-3 py-1.5 rounded-full text-xs text-indigo-600 border border-indigo-200 cursor-default sm:whitespace-nowrap sm:flex-shrink-0">"3BR house in QC, 7.5M"</span>
              <span className="bg-white px-3 py-1.5 rounded-full text-xs text-indigo-600 border border-indigo-200 cursor-default sm:whitespace-nowrap sm:flex-shrink-0">"Condo in BGC with pool and gym"</span>
              <span className="bg-white px-3 py-1.5 rounded-full text-xs text-indigo-600 border border-indigo-200 cursor-default sm:whitespace-nowrap sm:flex-shrink-0">"120sqm apartment for rent, 50k monthly"</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chat Interface */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 h-[calc(100vh-200px)] max-h-[800px] min-h-[500px] overflow-hidden lg:p-4">
            <ConversationalListingAssistant
              initialConversationId={conversationId || undefined}
              onListingSubmitted={handleListingSubmitted}
              onDataChange={handleDataChange}
            />
          </div>

          {/* Right Column - Property Card Preview */}
          <div className="lg:col-span-1 h-[calc(100vh-200px)] max-h-[800px] min-h-[500px] lg:sticky lg:top-8">
            <div className="h-full w-full property-card-container">
              <VerticalPropertyCard
                {...propertyCardData}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
