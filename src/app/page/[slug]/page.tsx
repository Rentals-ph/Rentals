'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import { EmptyState, EmptyStateAction } from '@/shared/components/misc'
import { pageBuilderApi } from '@/api'
import type { PageBuilderData } from '@/api'
import { ASSETS } from '@/shared/utils/assets'
import {
  FiMail, FiPhone, FiMessageCircle, FiGlobe, FiStar, FiHeart,
} from 'react-icons/fi'

// ─── STYLE LOOKUP MAPS (mirrors PageBuilder.tsx) ──────────────────────────────
const PADDING_VALUES: Record<string, string> = {
  none: '0px', xs: '6px', sm: '10px', md: '16px', lg: '28px', xl: '48px',
}
const IMG_HEIGHT_VALUES: Record<string, string> = {
  auto: 'auto', xs: '64px', sm: '110px', md: '160px', lg: '240px', xl: '340px',
}
const IMG_RADIUS_VALUES: Record<string, string> = {
  none: '0px', sm: '4px', md: '8px', lg: '16px', xl: '24px', full: '9999px',
}
const GRID_GAP_VALUES: Record<string, string> = {
  xs: '4px', sm: '8px', md: '14px', lg: '22px', xl: '32px',
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PublicPageBuilderPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [pageData, setPageData] = useState<PageBuilderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactFormName, setContactFormName] = useState('')
  const [contactFormEmail, setContactFormEmail] = useState('')
  const [contactFormMessage, setContactFormMessage] = useState('')

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      try {
        setLoading(true); setError(null)
        const data = await pageBuilderApi.getBySlug(slug)
        setPageData(data)
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Page not found')
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactFormName || !contactFormEmail || !contactFormMessage) {
      alert('Please fill in all fields'); return
    }
    alert('Thank you for your inquiry! We will get back to you soon.')
    setContactFormName(''); setContactFormEmail(''); setContactFormMessage('')
  }

  const formatPropertyPrice = (property: any) => {
    if (!property) return ''
    return `₱${property.price != null ? property.price.toLocaleString('en-US') : ''}${property.price_type ? `/${property.price_type}` : '/mo'}`
  }

  const formatPropertyDate = (property: any) => {
    if (property?.published_at) {
      return new Date(property.published_at).toLocaleDateString('en-US', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      })
    }
    return 'Recently'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px', color: '#6B7280' }}>
        Loading page...
      </div>
    )
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-20">
          <div className="w-full max-w-2xl mx-auto">
            <EmptyState
              variant="notFound"
              title="Page not found"
              description={error || "The page you're looking for doesn't exist or isn't published."}
              action={
                <>
                  <EmptyStateAction href="/" primary>Go to homepage</EmptyStateAction>
                  <EmptyStateAction href="/properties" primary={false}>Browse properties</EmptyStateAction>
                </>
              }
            />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ─── EXTRACT DESIGN TOKENS ─────────────────────────────────────────────────
  const raw = pageData as any
  const gd = raw.global_design || {}

  const colorPrimary    = gd.colorPrimary    || '#2563EB'
  const colorBackground = gd.colorBackground || '#FFFFFF'
  const colorText       = gd.colorText       || '#111827'
  const colorAccent     = gd.colorAccent     || '#F97316'
  const fontHeading     = gd.fontHeading     || gd.fontFamily || 'Inter, system-ui, sans-serif'
  const fontBody        = gd.fontBody        || gd.fontFamily || 'Inter, system-ui, sans-serif'
  const borderRadius    = typeof gd.borderRadius === 'number' ? `${gd.borderRadius}px` : '12px'
  const buttonVariant   = gd.buttonVariant   || 'filled'

  const sectionVisibility: Record<string, boolean> = raw.section_visibility || pageData.section_visibility || {}
  const sectionStyles: Record<string, any>         = raw.section_styles     || pageData.section_styles     || {}

  // Check for new custom sections format (page_data.sections) first
  // Then fall back to unified_sections → layout_sections / profile_layout_sections (legacy)
  let sections: any[] = []
  
  // Try to get custom sections from page_data
  if (raw.page_data?.sections && Array.isArray(raw.page_data.sections)) {
    sections = raw.page_data.sections
  } else if (raw.unified_sections && Array.isArray(raw.unified_sections)) {
    // Check if unified_sections contain custom sections (type: 'custom' with JSON content)
    const customSections = raw.unified_sections
      .filter((s: any) => s.type === 'custom' && s.content)
      .map((s: any) => {
        try {
          return JSON.parse(s.content)
        } catch {
          return null
        }
      })
      .filter(Boolean)
    
    if (customSections.length > 0) {
      sections = customSections
    } else {
      sections = raw.unified_sections
    }
  } else {
    sections = pageData.layout_sections || pageData.profile_layout_sections || []
  }

  // ─── PER-SECTION STYLE HELPERS ─────────────────────────────────────────────
  const getSectionContainerStyle = (sectionId: string): React.CSSProperties => {
    const ss = sectionStyles[sectionId] || {}
    return {
      padding:         PADDING_VALUES[ss.paddingSize || 'md'],
      fontFamily:      ss.fontFamily || fontBody,
      fontSize:        ss.fontSize || undefined,
      color:           ss.textColor && ss.textColor !== '#1F2937' ? ss.textColor : colorText,
      backgroundColor: ss.backgroundColor && ss.backgroundColor !== 'transparent' ? ss.backgroundColor : undefined,
    }
  }

  const getImgStyle = (sectionId: string): React.CSSProperties => {
    const ss = sectionStyles[sectionId] || {}
    return {
      width:        '100%',
      objectFit:    (ss.imageFit as any) || 'cover',
      borderRadius: IMG_RADIUS_VALUES[ss.imageRadius || 'md'],
      ...(ss.imageAspectRatio && ss.imageAspectRatio !== 'auto'
        ? { aspectRatio: ss.imageAspectRatio, height: 'auto' }
        : { height: IMG_HEIGHT_VALUES[ss.imageHeight || 'md'] }),
    }
  }

  const getGridStyle = (sectionId: string, defaultCols = 1): React.CSSProperties => {
    const ss = sectionStyles[sectionId] || {}
    const cols = ss.columns && ss.columns > 1 ? ss.columns : defaultCols
    const gap  = GRID_GAP_VALUES[ss.columnGap || 'md'] || '14px'
    return { display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }
  }

  // ─── PRIMARY BUTTON STYLE ──────────────────────────────────────────────────
  const primaryBtn: React.CSSProperties =
    buttonVariant === 'outlined'
      ? { border: `2px solid ${colorPrimary}`, color: colorPrimary, background: 'transparent', padding: '10px 24px', borderRadius, fontWeight: 600, cursor: 'pointer' }
      : { background: colorPrimary, color: '#fff', border: 'none', padding: '10px 24px', borderRadius, fontWeight: 600, cursor: 'pointer' }

  // ─── CUSTOM ELEMENT RENDERER (for new page builder format) ─────────────────
  const renderCustomElement = (el: any) => {
    const p = el.props || {}
    const alignStyle: React.CSSProperties = {
      textAlign: p.align === 'center' ? 'center' : p.align === 'right' ? 'right' : 'left',
    }
    
    switch (el.type) {
      case 'heading': {
        const Tag = (p.tag || 'h2') as keyof JSX.IntrinsicElements
        return (
          <Tag style={{
            ...alignStyle,
            fontSize: `${p.fontSize || 32}px`,
            color: p.color || colorText,
            fontWeight: p.fontWeight || '700',
            letterSpacing: `${p.letterSpacing || 0}px`,
            lineHeight: 1.2,
            margin: '0 0 12px',
          }}>
            {p.text || ''}
          </Tag>
        )
      }
      case 'text':
        return (
          <p style={{
            ...alignStyle,
            fontSize: `${p.fontSize || 16}px`,
            color: p.color || colorText,
            lineHeight: p.lineHeight || 1.7,
            margin: '0 0 12px',
          }}>
            {p.text || ''}
          </p>
        )
      case 'image':
        return (
          <div style={alignStyle}>
            <img
              src={p.src || ''}
              alt={p.alt || ''}
              style={{
                borderRadius: `${p.borderRadius || 8}px`,
                width: `${p.width || 100}%`,
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                margin: '0 auto 12px',
              }}
            />
          </div>
        )
      case 'button':
        return (
          <div style={alignStyle}>
            <a
              href={p.href || '#'}
              style={{
                display: 'inline-block',
                background: p.bg || colorPrimary,
                color: p.color || '#fff',
                fontSize: `${p.fontSize || 15}px`,
                borderRadius: `${p.borderRadius || 8}px`,
                padding: `${p.paddingY || 12}px ${p.paddingX || 28}px`,
                textDecoration: 'none',
                fontWeight: 600,
                margin: '0 0 12px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {p.text || 'Click Me'}
            </a>
          </div>
        )
      case 'divider':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: p.align === 'center' ? 'center' : p.align === 'right' ? 'flex-end' : 'flex-start',
            margin: '12px 0',
          }}>
            <hr style={{
              borderStyle: p.style || 'solid',
              borderColor: p.color || '#e2e8f0',
              borderTopWidth: `${p.height || 1}px`,
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              width: `${p.width || 100}%`,
              margin: 0,
            }} />
          </div>
        )
      case 'spacer':
        return <div style={{ height: `${p.height || 40}px` }} />
      case 'video':
        return (
          <div style={{
            aspectRatio: p.aspectRatio || '16/9',
            width: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#000',
            margin: '0 0 12px',
          }}>
            <iframe
              src={p.url || ''}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              title="video"
            />
          </div>
        )
      case 'icon':
        return (
          <div style={{
            ...alignStyle,
            fontSize: `${p.size || 40}px`,
            color: p.color || colorPrimary,
            margin: '0 0 12px',
          }}>
            {p.icon || '★'}
          </div>
        )
      case 'html':
        return (
          <div
            dangerouslySetInnerHTML={{ __html: p.code || '' }}
            style={{ margin: '0 0 12px' }}
          />
        )
      case 'hero':
        return (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            background: p.bg || colorPrimary,
            color: p.color || '#fff',
            padding: `${p.paddingY || 80}px 32px`,
            textAlign: p.align || 'center',
            margin: '0 0 12px',
          }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 12px' }}>{p.title || ''}</h1>
            <p style={{ fontSize: '1.125rem', opacity: 0.8, margin: 0 }}>{p.subtitle || ''}</p>
          </div>
        )
      default:
        return null
    }
  }

  // ─── CUSTOM SECTION RENDERER (for new page builder format) ──────────────────
  const renderCustomSection = (section: any) => {
    const s = section.settings || {}
    return (
      <div
        key={section.id}
        style={{
          background: s.bg || colorBackground,
          padding: `${s.paddingY || 40}px ${s.paddingX || 20}px`,
          marginBottom: '24px',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          {section.columns?.map((col: any) => (
            <div key={col.id} style={{ flex: col.width || 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {col.elements?.map((el: any) => (
                  <div key={el.id}>
                    {renderCustomElement(el)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── SECTION RENDERER ──────────────────────────────────────────────────────
  const renderSection = (section: any) => {
    // Check if this is a custom section (new format with columns and elements)
    if (section.columns && Array.isArray(section.columns) && section.settings) {
      return renderCustomSection(section)
    }
    
    const ci   = pageData.contact_info || {}
    const ctnr = getSectionContainerStyle(section.id)

    switch (section.id) {

      // ── Profile Hero ──────────────────────────────────────────────────────
      case 'profileHero': {
        const heroImg = raw.profile_image || pageData.profile_image
        return (
          <div key={section.id} style={{ marginBottom: '32px' }}>
            <div style={{
              position: 'relative', width: '100%', minHeight: '240px', borderRadius,
              backgroundImage: heroImg ? `url(${heroImg})` : undefined,
              backgroundColor: heroImg ? undefined : colorPrimary,
              backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '32px 24px',
              }}>
                {(raw.profile_card_image || pageData.profile_card_image || raw.profile_image || pageData.profile_image) && (
                  <img
                    src={raw.profile_card_image || pageData.profile_card_image || raw.profile_image || pageData.profile_image || ASSETS.PLACEHOLDER_PROFILE}
                    alt="Profile"
                    style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.6)', marginBottom: 12 }}
                    onError={e => { (e.target as HTMLImageElement).src = ASSETS.PLACEHOLDER_PROFILE }}
                  />
                )}
                <h1 style={{ fontFamily: fontHeading, color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 6px' }}>
                  {raw.profile_card_name || pageData.profile_card_name || 'Agent Name'}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, margin: 0 }}>
                  {raw.profile_card_role || pageData.profile_card_role || ''}
                </p>
              </div>
            </div>
          </div>
        )
      }

      // ── Profile Contact Info ───────────────────────────────────────────────
      case 'profileContactInfo':
        return (
          <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || '#fff', borderRadius, border: '1px solid #E5E7EB', marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Contact</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {ci.email && (
                <a href={`mailto:${ci.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: colorText, fontSize: 14, textDecoration: 'none' }}>
                  <FiMail style={{ color: colorPrimary }} /> {ci.email}
                </a>
              )}
              {pageData.show_contact_number && ci.phone && (
                <a href={`tel:${ci.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: colorText, fontSize: 14, textDecoration: 'none' }}>
                  <FiPhone style={{ color: colorPrimary }} /> {ci.phone}
                </a>
              )}
              {ci.website && (
                <a href={ci.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: colorPrimary, fontSize: 14, textDecoration: 'none' }}>
                  <FiGlobe /> Website
                </a>
              )}
            </div>
          </div>
        )

      // ── Bio / About ───────────────────────────────────────────────────────
      case 'profileBioAbout': {
        const bioText = raw.bio || pageData.bio || raw.profile_card_bio || pageData.profile_card_bio
        return (
          <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || '#fff', borderRadius, border: '1px solid #E5E7EB', marginBottom: 24 }}>
            <h3 style={{ fontFamily: fontHeading, color: colorText, fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>About</h3>
            <p style={{ color: colorText, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {bioText || 'Bio will appear here.'}
            </p>
          </div>
        )
      }

      // ── Stats Bar ─────────────────────────────────────────────────────────
      case 'profileStatsBar': {
        const stats = raw.experience_stats || pageData.experience_stats || []
        if (!(raw.show_experience_stats || pageData.show_experience_stats) || !stats.length) return null
        return (
          <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || '#fff', borderRadius, border: '1px solid #E5E7EB', marginBottom: 24, ...getGridStyle(section.id, stats.length) }}>
            {stats.map((s: any, i: number) => (
              <div key={i} style={{ textAlign: 'center', padding: '8px 4px' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: colorPrimary, fontFamily: fontHeading }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )
      }

      // ── Active Listings ───────────────────────────────────────────────────
      case 'profileActiveListings': {
        const listings = raw.featured_listings || pageData.featured_listings || []
        if (!(raw.show_featured_listings || pageData.show_featured_listings) || !listings.length) return null
        return (
          <div key={section.id} style={{ ...ctnr, marginBottom: 32 }}>
            <h3 style={{ fontFamily: fontHeading, color: colorText, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Active Listings</h3>
            <div style={getGridStyle(section.id, 2)}>
              {listings.map((l: any) => (
                <div key={l.id} style={{ background: '#fff', borderRadius, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' }}>
                  <img src={l.image || ASSETS.PLACEHOLDER_PROPERTY} alt={l.title} style={getImgStyle(section.id)} />
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colorPrimary }}>{formatPropertyPrice(l)}</div>
                    <div style={{ fontSize: 12, color: colorText, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      // ── Client Reviews ────────────────────────────────────────────────────
      case 'profileClientReviews': {
        const testimonials = raw.testimonials || pageData.testimonials || []
        if (!(raw.show_testimonials || pageData.show_testimonials) || !testimonials.length) return null
        return (
          <div key={section.id} style={{ ...ctnr, marginBottom: 32 }}>
            <h3 style={{ fontFamily: fontHeading, color: colorText, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Client Reviews</h3>
            <div style={getGridStyle(section.id, 1)}>
              {testimonials.map((t: any) => (
                <div key={t.id} style={{ background: '#fff', borderRadius, border: '1px solid #E5E7EB', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <img src={t.avatar || ASSETS.PLACEHOLDER_PROFILE} alt={t.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = ASSETS.PLACEHOLDER_PROFILE }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: colorText }}>{t.name}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', margin: 0 }}>"{t.content}"</p>
                  {t.role && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>{t.role}</div>}
                </div>
              ))}
            </div>
          </div>
        )
      }

      // ── Social Links ──────────────────────────────────────────────────────
      case 'profileSocialLinks':
        return (
          <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || colorPrimary, borderRadius, display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
            {ci.email && (
              <a href={`mailto:${ci.email}`} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}>
                <FiMail />
              </a>
            )}
            {ci.phone && (
              <a href={`tel:${ci.phone}`} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}>
                <FiPhone />
              </a>
            )}
            {ci.website && (
              <a href={ci.website} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}>
                <FiGlobe />
              </a>
            )}
          </div>
        )

      // ── Property Hero ─────────────────────────────────────────────────────
      case 'hero': {
        const heroImg = raw.hero_image || pageData.hero_image
        const darkness = raw.overall_darkness ?? pageData.overall_darkness ?? 30
        return (
          <div key={section.id} style={{ marginBottom: 24 }}>
            <div style={{
              position: 'relative', width: '100%', height: 380, borderRadius,
              backgroundImage: heroImg ? `url(${heroImg})` : undefined,
              backgroundColor: heroImg ? undefined : colorPrimary,
              backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${darkness / 100})` }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 24px' }}>
                <h1 style={{ fontFamily: fontHeading, color: '#fff', fontSize: 36, fontWeight: 700, marginBottom: 8, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  {raw.main_heading || pageData.main_heading || 'Property Title'}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
                  {raw.tagline || pageData.tagline || ''}
                </p>
                {(raw.property_price || pageData.property_price) && (
                  <button style={{ ...primaryBtn, marginTop: 20, fontSize: 14 }}>
                    Starts at {raw.property_price || pageData.property_price}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      // ── Property Description ──────────────────────────────────────────────
      case 'propertyDescription':
        return (
          <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || '#fff', borderRadius, border: '1px solid #E5E7EB', marginBottom: 24 }}>
            <h2 style={{ fontFamily: fontHeading, color: colorText, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Property Overview</h2>
            <p style={{ color: colorText, fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {raw.property_description || pageData.property_description || ''}
            </p>
          </div>
        )

      // ── Property Images ───────────────────────────────────────────────────
      case 'propertyImages': {
        const imgs: string[] = raw.property_images || pageData.property_images || []
        if (!imgs.length) return null
        return (
          <div key={section.id} style={{ ...ctnr, marginBottom: 24 }}>
            <h2 style={{ fontFamily: fontHeading, color: colorText, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>What&apos;s Inside?</h2>
            <div style={getGridStyle(section.id, 3)}>
              {imgs.map((img, i) => (
                <img key={i} src={img} alt={`Interior ${i + 1}`} style={{ ...getImgStyle(section.id), borderRadius }} />
              ))}
            </div>
          </div>
        )
      }

      // ── Property Details ──────────────────────────────────────────────────
      case 'propertyDetails': {
        const bedrooms  = raw.property_bedrooms  ?? pageData.property_bedrooms  ?? 0
        const bathrooms = raw.property_bathrooms ?? pageData.property_bathrooms ?? 0
        const garage    = raw.property_garage    ?? pageData.property_garage    ?? 0
        const area      = raw.property_area      || pageData.property_area
        const price     = raw.property_price     || pageData.property_price
        return (
          <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || '#fff', borderRadius, border: '1px solid #E5E7EB', marginBottom: 24 }}>
            <h2 style={{ fontFamily: fontHeading, color: colorText, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Property Details</h2>
            <div style={getGridStyle(section.id, 2)}>
              {price && <div><span style={{ fontSize: 11, color: '#9CA3AF', display: 'block' }}>Price</span><p style={{ fontWeight: 700, color: colorPrimary, fontSize: 18, margin: '2px 0 0' }}>{price}</p></div>}
              {bedrooms > 0 && <div><span style={{ fontSize: 11, color: '#9CA3AF', display: 'block' }}>Bedrooms</span><p style={{ fontWeight: 600, color: colorText, fontSize: 16, margin: '2px 0 0' }}>{bedrooms}</p></div>}
              {bathrooms > 0 && <div><span style={{ fontSize: 11, color: '#9CA3AF', display: 'block' }}>Bathrooms</span><p style={{ fontWeight: 600, color: colorText, fontSize: 16, margin: '2px 0 0' }}>{bathrooms}</p></div>}
              {garage > 0 && <div><span style={{ fontSize: 11, color: '#9CA3AF', display: 'block' }}>Garage</span><p style={{ fontWeight: 600, color: colorText, fontSize: 16, margin: '2px 0 0' }}>{garage}</p></div>}
              {area && <div><span style={{ fontSize: 11, color: '#9CA3AF', display: 'block' }}>Area</span><p style={{ fontWeight: 600, color: colorText, fontSize: 16, margin: '2px 0 0' }}>{area}</p></div>}
            </div>
          </div>
        )
      }

      // ── Amenities ─────────────────────────────────────────────────────────
      case 'amenities': {
        const amenities: string[] = raw.property_amenities || pageData.property_amenities || []
        if (!amenities.length) return null
        return (
          <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || '#fff', borderRadius, border: '1px solid #E5E7EB', marginBottom: 24 }}>
            <h2 style={{ fontFamily: fontHeading, color: colorText, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Amenities</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {amenities.map((a, i) => (
                <span key={i} style={{ padding: '6px 14px', borderRadius: 9999, border: `2px solid ${colorPrimary}`, background: colorPrimary + '12', color: colorPrimary, fontSize: 13, fontWeight: 500 }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        )
      }

      // ── Contact Information ────────────────────────────────────────────────
      case 'contact': {
        const hasContact = ci.email || ci.phone || ci.website || (pageData.contact_info as any)?.address
        if (!hasContact) return null
        return (
          <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || '#fff', borderRadius, border: '1px solid #E5E7EB', marginBottom: 24 }}>
            <h2 style={{ fontFamily: fontHeading, color: colorText, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Contact Information</h2>
            <div style={getGridStyle(section.id, 1)}>
              {ci.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: colorPrimary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiPhone style={{ color: colorPrimary }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Phone</div>
                    <a href={`tel:${ci.phone}`} style={{ fontSize: 14, fontWeight: 500, color: colorText, textDecoration: 'none' }}>{ci.phone}</a>
                  </div>
                </div>
              )}
              {ci.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: colorPrimary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiMail style={{ color: colorPrimary }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Email</div>
                    <a href={`mailto:${ci.email}`} style={{ fontSize: 14, fontWeight: 500, color: colorText, textDecoration: 'none' }}>{ci.email}</a>
                  </div>
                </div>
              )}
              {ci.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: colorPrimary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiGlobe style={{ color: colorPrimary }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Website</div>
                    <a href={ci.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, color: colorPrimary, textDecoration: 'none' }}>Visit Website</a>
                  </div>
                </div>
              )}
              {(pageData.contact_info as any)?.address && (
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#6B7280' }}>
                  <div style={{ width: 40, flexShrink: 0 }} />
                  {(pageData.contact_info as any).address}
                </div>
              )}
            </div>
          </div>
        )
      }

      // ── Experience ────────────────────────────────────────────────────────
      case 'experience': {
        const heading = raw.experience_heading || pageData.experience_heading || 'Experience'
        const body    = raw.experience_body    || pageData.experience_body
        const stats   = raw.experience_stats   || pageData.experience_stats || []
        const showStats = (raw.show_experience_stats || pageData.show_experience_stats) && stats.length > 0
        return (
          <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || '#fff', borderRadius, border: '1px solid #E5E7EB', marginBottom: 24 }}>
            <h2 style={{ fontFamily: fontHeading, color: colorText, fontSize: 20, fontWeight: 700, marginBottom: body ? 8 : 16 }}>{heading}</h2>
            {body && <p style={{ fontSize: 14, color: colorText, lineHeight: 1.7, marginBottom: showStats ? 16 : 0 }}>{body}</p>}
            {showStats && (
              <div style={getGridStyle(section.id, stats.length)}>
                {stats.map((s: any, i: number) => (
                  <div key={i} style={{ textAlign: 'center', padding: '8px 4px' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: colorPrimary, fontFamily: fontHeading }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }

      // ── Featured Listings ─────────────────────────────────────────────────
      case 'featured': {
        const featured = raw.featured_listings || pageData.featured_listings || []
        if (!(raw.show_featured_listings || pageData.show_featured_listings) || !featured.length) return null
        return (
          <div key={section.id} style={{ ...ctnr, marginBottom: 32 }}>
            <h3 style={{ fontFamily: fontHeading, color: colorText, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Featured Listings</h3>
            <div style={getGridStyle(section.id, 2)}>
              {featured.map((l: any) => (
                <div key={l.id} style={{ background: '#fff', borderRadius, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: colorPrimary, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 4 }}>
                      <FiStar style={{ width: 10, height: 10 }} /> Featured
                    </div>
                    <img src={l.image || ASSETS.PLACEHOLDER_PROPERTY} alt={l.title} style={{ ...getImgStyle(section.id), display: 'block' }} />
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colorPrimary, marginBottom: 4 }}>{formatPropertyPrice(l)}</div>
                    <div style={{ fontSize: 13, color: colorText, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{l.type || l.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      // ── Testimonials ──────────────────────────────────────────────────────
      case 'testimonialsSection': {
        const testimonials = raw.testimonials || pageData.testimonials || []
        if (!(raw.show_testimonials || pageData.show_testimonials) || !testimonials.length) return null
        return (
          <div key={section.id} style={{ ...ctnr, marginBottom: 32 }}>
            <h3 style={{ fontFamily: fontHeading, color: colorText, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Client Testimonials</h3>
            <div style={getGridStyle(section.id, 1)}>
              {testimonials.map((t: any) => (
                <div key={t.id} style={{ background: '#fff', borderRadius, border: '1px solid #E5E7EB', padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <img src={t.avatar || ASSETS.PLACEHOLDER_PROFILE} alt={t.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = ASSETS.PLACEHOLDER_PROFILE }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: colorText }}>{t.name}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', margin: 0 }}>"{t.content}"</p>
                  {t.role && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>{t.role}</div>}
                </div>
              ))}
            </div>
          </div>
        )
      }

      // ── Ready To View ─────────────────────────────────────────────────────
      case 'readyToView': {
        const heading = raw.ready_to_view_heading || pageData.ready_to_view_heading || 'Ready To View?'
        const subtext = raw.ready_to_view_subtext || pageData.ready_to_view_subtext || 'Schedule a tour or ask any questions about the property.'
        const defaultMsg = raw.contact_form_message || pageData.contact_form_message || ''
        return (
          <div key={section.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32 }}>
            <div style={{ ...ctnr, background: ctnr.backgroundColor || colorPrimary, borderRadius, color: '#fff' }}>
              <h2 style={{ fontFamily: fontHeading, color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{heading}</h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 20 }}>{subtext}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ci.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.9)', fontSize: 14 }}><FiPhone /> {ci.phone}</div>}
                {ci.email && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.9)', fontSize: 14 }}><FiMail /> {ci.email}</div>}
              </div>
            </div>
            <div style={{ background: '#F9FAFB', borderRadius, padding: 24 }}>
              <h3 style={{ fontFamily: fontHeading, color: colorText, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                Contact {raw.profile_card_name || pageData.profile_card_name || 'Agent'}
              </h3>
              <form onSubmit={handleContactFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" placeholder="Your name" value={contactFormName} onChange={e => setContactFormName(e.target.value)} required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                <input type="email" placeholder="Your email" value={contactFormEmail} onChange={e => setContactFormEmail(e.target.value)} required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                <textarea placeholder={defaultMsg || 'Your message'} value={contactFormMessage} onChange={e => setContactFormMessage(e.target.value)} rows={4} required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                <button type="submit" style={{ ...primaryBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Send Inquiry <FiMessageCircle />
                </button>
              </form>
            </div>
          </div>
        )
      }

      // ── Profile Card ──────────────────────────────────────────────────────
      case 'profileCard': {
        const cardImg = raw.profile_card_image || pageData.profile_card_image || raw.profile_image || pageData.profile_image
        return (
          <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || colorPrimary, borderRadius, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <img src={cardImg || ASSETS.PLACEHOLDER_PROFILE} alt={raw.profile_card_name || 'Agent'} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).src = ASSETS.PLACEHOLDER_PROFILE }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: fontHeading }}>{raw.profile_card_name || pageData.profile_card_name || 'Agent Name'}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{raw.profile_card_role || pageData.profile_card_role || ''}</div>
              {(raw.profile_card_bio || pageData.profile_card_bio) && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>{raw.profile_card_bio || pageData.profile_card_bio}</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {ci.email && <a href={`mailto:${ci.email}`} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}><FiMail size={14} /></a>}
                {ci.phone && <a href={`tel:${ci.phone}`} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}><FiPhone size={14} /></a>}
                {ci.website && <a href={ci.website} target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}><FiGlobe size={14} /></a>}
              </div>
            </div>
          </div>
        )
      }

      // ── Custom Sections (image / video / text) ────────────────────────────
      default: {
        if (section.type === 'image' && section.content) {
          return (
            <div key={section.id} style={{ marginBottom: 24, borderRadius, overflow: 'hidden' }}>
              <img src={section.content} alt={section.name} style={{ ...getImgStyle(section.id), width: '100%', display: 'block', borderRadius }} />
            </div>
          )
        }
        if (section.type === 'video' && section.content) {
          const toEmbed = (url: string) => {
            const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
            if (yt) return `https://www.youtube.com/embed/${yt[1]}`
            const vm = url.match(/vimeo\.com\/(\d+)/)
            if (vm) return `https://player.vimeo.com/video/${vm[1]}`
            return url
          }
          return (
            <div key={section.id} style={{ marginBottom: 24, borderRadius, overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
              <iframe src={toEmbed(section.content)} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title={section.name} />
            </div>
          )
        }
        if (section.content || section.type === 'text' || section.type === 'custom') {
          return (
            <div key={section.id} style={{ ...ctnr, background: ctnr.backgroundColor || '#fff', borderRadius, border: '1px solid #E5E7EB', marginBottom: 24 }}>
              <h3 style={{ fontFamily: fontHeading, color: colorText, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{section.name}</h3>
              {section.content && <p style={{ fontSize: 14, color: colorText, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{section.content}</p>}
            </div>
          )
        }
        return null
      }
    }
  }

  // ─── RENDER PAGE ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: colorBackground, color: colorText, fontFamily: fontBody }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {sections.map((section: any) => {
          // Check visibility via both section.visible flag and sectionVisibility map
          // For custom sections, always show unless explicitly hidden
          const flagVisible = section.visible !== false
          const mapVisible  = section.id ? sectionVisibility[section.id] !== false : true
          if (!flagVisible || !mapVisible) return null
          return renderSection(section)
        })}
      </div>
      <Footer />
    </div>
  )
}
