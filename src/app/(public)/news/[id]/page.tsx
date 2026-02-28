'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { newsApi } from '@/api'
import type { News } from '@/api/endpoints/news'
import { ASSETS } from '@/utils/assets'

export default function NewsDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [news, setNews] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const id = parseInt(params.id as string)
        if (isNaN(id)) {
          router.push('/news')
          return
        }
        const data = await newsApi.getById(id)
        setNews(data)
      } catch (error) {
        console.error('Error fetching news:', error)
        router.push('/news')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchNews()
    }
  }, [params.id, router])

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'January 15, 2026'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getImageUrl = (image: string | null): string => {
    if (!image) return ASSETS.PLACEHOLDER_PROPERTY_MAIN
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }
    if (image.startsWith('storage/') || image.startsWith('/storage/')) {
      return `/api/${image.startsWith('/') ? image.slice(1) : image}`
    }
    return image
  }

  // Parse content into sections with headings
  const parseContent = (content: string) => {
    if (!content) return []
    
    // Try to detect headings (lines that are short, all caps, or start with #)
    const lines = content.split('\n').filter(l => l.trim())
    const sections: Array<{ type: 'heading' | 'paragraph'; content: string }> = []
    let currentParagraph = ''
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        if (currentParagraph) {
          sections.push({ type: 'paragraph', content: currentParagraph })
          currentParagraph = ''
        }
        continue
      }
      
      // Check if line is likely a heading
      const isHeading = trimmed.startsWith('#') || 
                       (trimmed.length < 100 && 
                        trimmed.split(' ').length < 15 &&
                        (trimmed === trimmed.toUpperCase() || trimmed.split(' ').every(w => w[0] === w[0]?.toUpperCase())))
      
      if (isHeading) {
        if (currentParagraph) {
          sections.push({ type: 'paragraph', content: currentParagraph })
          currentParagraph = ''
        }
        sections.push({ type: 'heading', content: trimmed.replace(/^#+\s*/, '') })
      } else {
        if (currentParagraph) {
          currentParagraph += ' ' + trimmed
        } else {
          currentParagraph = trimmed
        }
      }
    }
    
    if (currentParagraph) {
      sections.push({ type: 'paragraph', content: currentParagraph })
    }
    
    return sections.length > 0 ? sections : [{ type: 'paragraph', content: content }]
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-[150px] py-20">
          <p className="text-gray-600">Loading article...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!news) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-[150px] py-20">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Article not found</p>
            <Link href="/news" className="text-blue-600 hover:underline">
              Back to News
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const contentSections = parseContent(news.content)
  const summary = news.excerpt || 'In a stunning buzzer-beater finish, the league\'s lowest-ranked squad defied all odds to clinch the national title. Relive the heart-pounding final play that silenced the doubters and made sporting history.'

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      <Navbar />

      {/* Header Section with NEWS and Category */}
      <section className="w-full bg-white py-6 sm:py-8">
        <div className="px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <div className="flex flex-col gap-2">
            {/* NEWS Header with black square, NE in black, WS in red, and red bar */}
            <div className="flex items-center">
              {/* Black Square */}
              <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-black flex-shrink-0"></div>
              {/* NE in black */}
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-black font-outfit uppercase ml-2 sm:ml-3">
                NE
              </span>
              {/* WS in red */}
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-red-600 font-outfit uppercase">
                WS
              </span>
              {/* Red bar extending from WS */}
              <div className="flex-1 h-1 sm:h-1.5 md:h-2 bg-red-600 ml-2 sm:ml-3"></div>
            </div>
            
            {/* Category Label */}
            <div className="mt-1">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 font-outfit uppercase">
                {news.category || 'SPORTS'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image Section with Overlay */}
      <section className="w-full relative">
        <div className="px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <div className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] overflow-hidden rounded-lg">
            {/* Hero Image - Full width background */}
            <div className="absolute inset-0">
              <img 
                src={getImageUrl(news.image)} 
                alt={news.title} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Dark Gray Overlay on Right Side */}
            <div className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 md:w-[45%] bg-gray-800/90 flex flex-col justify-end p-6 sm:p-8 md:p-10">
              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white font-outfit mb-4 sm:mb-6 leading-tight">
                {news.title}
              </h1>
              
              {/* Summary Text */}
              <p className="text-sm sm:text-base md:text-lg text-white font-outfit mb-6 sm:mb-8 leading-relaxed">
                {summary}
              </p>
              
              {/* Footer Information and Social Icons */}
              <div className="flex items-center justify-between">
                <div className="text-xs sm:text-sm text-white font-outfit">
                  BBCTV News • {formatDate(news.published_at)}
                </div>
                
                {/* Social Media Icons */}
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Share Icon */}
                  <button 
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                    aria-label="Share"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" fill="currentColor"/>
                    </svg>
                  </button>
                  
                  {/* Facebook Icon */}
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                    aria-label="Share on Facebook"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  
                  {/* WhatsApp Icon */}
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(news.title + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                    aria-label="Share on WhatsApp"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Article Body */}
      <section className="w-full bg-white pt-8 sm:pt-12">
        <div className="px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <article className="mx-auto">
            {/* Main Title (repeats from hero) */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black font-outfit mb-6 sm:mb-8">
              {news.title}
            </h2>

            {/* Article Content Sections */}
            <div className="space-y-6 sm:space-y-8">
              {contentSections.map((section, index) => {
                if (section.type === 'heading') {
                  return (
                    <div key={index}>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-black font-outfit mb-4 sm:mb-6">
                        {section.content}
                      </h3>
                    </div>
                  )
                } else {
                  return (
                    <p key={index} className="text-base sm:text-lg text-black font-outfit leading-relaxed">
                      {section.content}
                    </p>
                  )
                }
              })}
            </div>

            {/* Author and Date Footer */}
            <div className="mt-4 sm:mt-8  border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm sm:text-base text-gray-600 font-outfit">
                  <span className="font-semibold">Author:</span> {news.author || 'BBCTV News'}
                </div>
                <div className="text-sm sm:text-base text-gray-600 font-outfit">
                  {formatDate(news.published_at)}
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
      {/* 2x2 Grid Description Section */}
      <section className="w-full bg-white py-3 sm:py-4 mb-10">
        <div className="px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 h-[auto] sm:h-[auto] md:h-[auto] overflow-hidden">
            {/* Row 1, Column 1 */}
            <div className="text-left">
              <p className="text-base sm:text-lg text-black font-outfit leading-relaxed">
                {contentSections.length > 0 && contentSections[0].type === 'paragraph' 
                  ? contentSections[0].content 
                  : 'CITY CORE ARENA – In a finale that will be etched into the archives of sporting history, the Cebu Blue Fins, the lowest-seeded team in the league, pulled off an improbable 98-97 victory over the reigning champions, the Metro Titans, with a buzzer-beater shot that silenced the arena before erupting into pandemonium.'}
              </p>
            </div>

            {/* Row 1, Column 2 */}
            <div className="text-left">
              {contentSections.find(s => s.type === 'heading' && s.content.includes('Momentum')) ? (
                <>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black font-outfit mb-3 sm:mb-4">
                    {contentSections.find(s => s.type === 'heading' && s.content.includes('Momentum'))?.content || 'The Momentum Shift'}
                  </h3>
                  <p className="text-base sm:text-lg text-black font-outfit leading-relaxed">
                    {(() => {
                      const momentumIndex = contentSections.findIndex(s => s.type === 'heading' && s.content.includes('Momentum'))
                      return momentumIndex >= 0 && contentSections[momentumIndex + 1]?.type === 'paragraph'
                        ? contentSections[momentumIndex + 1].content
                        : 'It was veteran guard Leo "The Anchor" Reyes who initiated the shift. With back-to-back three-pointers, he sparked a 12-0 run that brought the Fins within striking distance. The Titans, who had dominated the first three quarters, suddenly found themselves on the defensive, their lead evaporating with each passing second.'
                    })()}
                  </p>
                </>
              ) : (
                <p className="text-base sm:text-lg text-black font-outfit leading-relaxed">
                  It was veteran guard Leo "The Anchor" Reyes who initiated the shift. With back-to-back three-pointers, he sparked a 12-0 run that brought the Fins within striking distance.
                </p>
              )}
            </div>

            {/* Row 2, Column 1 */}
            <div className="text-left">
              {contentSections.find(s => s.type === 'heading' && (s.content.includes('Shot') || s.content.includes('League'))) ? (
                <>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black font-outfit mb-3 sm:mb-4">
                    {contentSections.find(s => s.type === 'heading' && (s.content.includes('Shot') || s.content.includes('League')))?.content || 'The Shot Heard \'Round the League'}
                  </h3>
                  <p className="text-base sm:text-lg text-black font-outfit leading-relaxed">
                    {(() => {
                      const shotIndex = contentSections.findIndex(s => s.type === 'heading' && (s.content.includes('Shot') || s.content.includes('League')))
                      return shotIndex >= 0 && contentSections[shotIndex + 1]?.type === 'paragraph'
                        ? contentSections[shotIndex + 1].content
                        : 'With 14 seconds left and trailing by one, Reyes received the inbound pass. He faked left, then delivered a no-look pass to rookie Julian Cruz, who was positioned beyond the arc. As the backboard lights flashed, Cruz released a high-arching shot that seemed to hang in the air for an eternity.'
                    })()}
                  </p>
                </>
              ) : (
                <p className="text-base sm:text-lg text-black font-outfit leading-relaxed">
                  With 14 seconds left and trailing by one, Reyes received the inbound pass. He faked left, then delivered a no-look pass to rookie Julian Cruz, who was positioned beyond the arc.
                </p>
              )}
            </div>

            {/* Row 2, Column 2 */}
            <div className="text-left">
              {contentSections.find(s => s.type === 'heading' && (s.content.includes('Victory') || s.content.includes('Dreamers'))) ? (
                <>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black font-outfit mb-3 sm:mb-4">
                    {contentSections.find(s => s.type === 'heading' && (s.content.includes('Victory') || s.content.includes('Dreamers')))?.content || 'A Victory for the Dreamers'}
                  </h3>
                  <p className="text-base sm:text-lg text-black font-outfit leading-relaxed">
                    {(() => {
                      const victoryIndex = contentSections.findIndex(s => s.type === 'heading' && (s.content.includes('Victory') || s.content.includes('Dreamers')))
                      return victoryIndex >= 0 && contentSections[victoryIndex + 1]?.type === 'paragraph'
                        ? contentSections[victoryIndex + 1].content
                        : 'Coach Marco Sison, his voice cracking with emotion, said it best: "We didn\'t have the best record, but we had the biggest heart. Tonight, we played for every underdog who was ever told they couldn\'t." This victory marks the first time in league history that a last-place seed has won the championship.'
                    })()}
                  </p>
                </>
              ) : (
                <p className="text-base sm:text-lg text-black font-outfit leading-relaxed">
                  Coach Marco Sison, his voice cracking with emotion, said it best: "We didn't have the best record, but we had the biggest heart. Tonight, we played for every underdog who was ever told they couldn't."
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      

      <Footer />
    </div>
  )
}

