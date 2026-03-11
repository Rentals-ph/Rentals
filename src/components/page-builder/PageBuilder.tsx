'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import AppSidebar from '@/components/common/AppSidebar'
import { pageBuilderApi } from '@/api'
import type { PageBuilderData } from '@/api'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface PageBuilderProps {
  userType: 'agent' | 'broker'
}

type PreviewMode = 'desktop' | 'tablet' | 'mobile'
type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'
type ToastType = 'success' | 'error' | 'info'

interface Element {
  id: string
  type: string
  props: Record<string, any>
}

interface Column {
  id: string
  width: number
  elements: Element[]
}

interface Section {
  id: string
  settings: {
    bg: string
    paddingY: string
    paddingX: string
  }
  columns: Column[]
}

interface Selected {
  type: 'section' | 'element'
  sectionId: string
  colId?: string
  elId?: string
}

interface DragSource {
  from: 'panel' | 'canvas'
  type?: string
  sectionId?: string
  colId?: string
  elId?: string
}

interface DragOver {
  sectionId: string
  colId: string
}

interface Toast {
  message: string
  type: ToastType
  id: number
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substr(2, 9)

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)

/** Build a /page/{slug} URL from the current origin */
const buildPageUrl = (slug: string) => {
  if (typeof window === 'undefined') return `/${slug}`
  return `${window.location.origin}/${slug}`
}

const toEmbedUrl = (url: string): string => {
  try {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`
    const vm = url.match(/vimeo\.com\/(\d+)/)
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  } catch {}
  return url
}

// ─── WIDGET REGISTRY ─────────────────────────────────────────────────────────

const WIDGET_TYPES = [
  { type: 'heading', label: 'Heading', icon: 'H1' },
  { type: 'text', label: 'Text', icon: '¶' },
  { type: 'image', label: 'Image', icon: '🖼' },
  { type: 'button', label: 'Button', icon: '⬡' },
  { type: 'divider', label: 'Divider', icon: '─' },
  { type: 'spacer', label: 'Spacer', icon: '↕' },
  { type: 'video', label: 'Video', icon: '▶' },
  { type: 'icon', label: 'Icon', icon: '★' },
  { type: 'html', label: 'HTML', icon: '</>' },
  { type: 'hero', label: 'Hero', icon: '⬛' },
]

const COLUMN_LAYOUTS = [
  { label: '1 Col', cols: [100] },
  { label: '2 Col', cols: [50, 50] },
  { label: '3 Col', cols: [33, 33, 34] },
  { label: '1/3+2/3', cols: [33, 67] },
  { label: '2/3+1/3', cols: [67, 33] },
  { label: '4 Col', cols: [25, 25, 25, 25] },
]

const BUILT_IN_THEMES = [
  { id: 'modern', name: 'Modern Minimal', bg: '#ffffff', primary: '#6366f1', text: '#1a1a2e' },
  { id: 'dark', name: 'Luxury Dark', bg: '#020617', primary: '#facc15', text: '#f9fafb' },
  { id: 'coastal', name: 'Coastal Light', bg: '#f0f9ff', primary: '#0ea5e9', text: '#0f172a' },
  { id: 'urban', name: 'Bold Urban', bg: '#f3f4f6', primary: '#ef4444', text: '#111827' },
  { id: 'estate', name: 'Classic Estate', bg: '#fefce8', primary: '#0f766e', text: '#1f2937' },
]

// ─── PAGE TEMPLATES ───────────────────────────────────────────────────────────

interface PageTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  category: 'profile' | 'property' | 'landing'
  buildSections: () => Section[]
}

const TEMPLATE_CATEGORIES = [
  { id: 'profile', label: 'Agent Profile' },
  { id: 'property', label: 'Property Listing' },
  { id: 'landing', label: 'Landing Page' },
]

const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'agent-profile',
    name: 'Agent Profile',
    description: 'Full-featured agent profile with hero, about, credentials, listings, and contact sections.',
    thumbnail: '👤',
    category: 'profile',
    buildSections: () => [
      {
        id: generateId(),
        settings: { bg: '#1a1a2e', paddingY: '80', paddingX: '20' },
        columns: [{ id: generateId(), width: 100, elements: [
          { id: generateId(), type: 'hero', props: { title: 'Your Name', subtitle: 'Licensed Real Estate Agent · Your City', bg: '#1a1a2e', color: '#ffffff', align: 'center', paddingY: '80' } },
        ] }],
      },
      {
        id: generateId(),
        settings: { bg: '#ffffff', paddingY: '60', paddingX: '40' },
        columns: [
          { id: generateId(), width: 40, elements: [
            { id: generateId(), type: 'image', props: { src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=80', alt: 'Agent photo', borderRadius: '12', width: '100' } },
          ] },
          { id: generateId(), width: 60, elements: [
            { id: generateId(), type: 'heading', props: { text: 'About Me', tag: 'h2', align: 'left', fontSize: '28', fontWeight: '700', color: '#1a1a2e', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'With over 10 years of experience in the real estate market, I specialize in helping families find their dream homes. My approach combines deep market knowledge with personalized service to ensure every client finds the perfect property.', align: 'left', fontSize: '16', color: '#555555', lineHeight: '1.8' } },
            { id: generateId(), type: 'button', props: { text: 'Contact Me', align: 'left', bg: '#6366f1', color: '#ffffff', fontSize: '15', borderRadius: '8', paddingX: '28', paddingY: '12', href: '#contact' } },
          ] },
        ],
      },
      {
        id: generateId(),
        settings: { bg: '#f8fafc', paddingY: '50', paddingX: '40' },
        columns: [
          { id: generateId(), width: 33, elements: [
            { id: generateId(), type: 'icon', props: { icon: '🏆', size: '40', color: '#6366f1', align: 'center' } },
            { id: generateId(), type: 'heading', props: { text: '150+', tag: 'h3', align: 'center', fontSize: '32', fontWeight: '800', color: '#1a1a2e', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Properties Sold', align: 'center', fontSize: '14', color: '#666666', lineHeight: '1.5' } },
          ] },
          { id: generateId(), width: 33, elements: [
            { id: generateId(), type: 'icon', props: { icon: '⭐', size: '40', color: '#6366f1', align: 'center' } },
            { id: generateId(), type: 'heading', props: { text: '4.9/5', tag: 'h3', align: 'center', fontSize: '32', fontWeight: '800', color: '#1a1a2e', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Client Rating', align: 'center', fontSize: '14', color: '#666666', lineHeight: '1.5' } },
          ] },
          { id: generateId(), width: 34, elements: [
            { id: generateId(), type: 'icon', props: { icon: '📋', size: '40', color: '#6366f1', align: 'center' } },
            { id: generateId(), type: 'heading', props: { text: '10+ Yrs', tag: 'h3', align: 'center', fontSize: '32', fontWeight: '800', color: '#1a1a2e', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Industry Experience', align: 'center', fontSize: '14', color: '#666666', lineHeight: '1.5' } },
          ] },
        ],
      },
      {
        id: generateId(),
        settings: { bg: '#ffffff', paddingY: '50', paddingX: '40' },
        columns: [{ id: generateId(), width: 100, elements: [
          { id: generateId(), type: 'heading', props: { text: 'Get In Touch', tag: 'h2', align: 'center', fontSize: '28', fontWeight: '700', color: '#1a1a2e', letterSpacing: '0' } },
          { id: generateId(), type: 'text', props: { text: 'Ready to find your dream home? Let\'s start the conversation.', align: 'center', fontSize: '16', color: '#555555', lineHeight: '1.7' } },
          { id: generateId(), type: 'divider', props: { style: 'solid', color: '#e2e8f0', height: '1', width: '30', align: 'center' } },
          { id: generateId(), type: 'text', props: { text: '📧 agent@example.com  ·  📞 (555) 123-4567  ·  📍 Your City, State', align: 'center', fontSize: '14', color: '#666666', lineHeight: '1.8' } },
          { id: generateId(), type: 'button', props: { text: 'Schedule a Call', align: 'center', bg: '#6366f1', color: '#ffffff', fontSize: '15', borderRadius: '8', paddingX: '32', paddingY: '14', href: '#' } },
        ] }],
      },
    ],
  },
  {
    id: 'agent-minimal',
    name: 'Minimal Profile',
    description: 'Clean, single-column agent bio with a focus on simplicity.',
    thumbnail: '✨',
    category: 'profile',
    buildSections: () => [
      {
        id: generateId(),
        settings: { bg: '#ffffff', paddingY: '60', paddingX: '40' },
        columns: [{ id: generateId(), width: 100, elements: [
          { id: generateId(), type: 'image', props: { src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80', alt: 'Profile photo', borderRadius: '50', width: '20' } },
          { id: generateId(), type: 'spacer', props: { height: '16' } },
          { id: generateId(), type: 'heading', props: { text: 'Your Name', tag: 'h1', align: 'center', fontSize: '36', fontWeight: '700', color: '#111827', letterSpacing: '-1' } },
          { id: generateId(), type: 'text', props: { text: 'Licensed Real Estate Agent · Helping families find home since 2014', align: 'center', fontSize: '16', color: '#6b7280', lineHeight: '1.6' } },
          { id: generateId(), type: 'divider', props: { style: 'solid', color: '#e5e7eb', height: '1', width: '20', align: 'center' } },
          { id: generateId(), type: 'text', props: { text: 'I believe in building lasting relationships with my clients. My deep knowledge of the local market, combined with a passion for matching people with their perfect property, has helped hundreds of families achieve their real estate goals.', align: 'center', fontSize: '15', color: '#374151', lineHeight: '1.8' } },
          { id: generateId(), type: 'spacer', props: { height: '24' } },
          { id: generateId(), type: 'button', props: { text: 'Get In Touch →', align: 'center', bg: '#111827', color: '#ffffff', fontSize: '14', borderRadius: '50', paddingX: '32', paddingY: '14', href: '#' } },
        ] }],
      },
    ],
  },
  {
    id: 'property-listing',
    name: 'Property Showcase',
    description: 'Feature a property with gallery, details, amenities, and agent contact card.',
    thumbnail: '🏠',
    category: 'property',
    buildSections: () => [
      {
        id: generateId(),
        settings: { bg: '#ffffff', paddingY: '0', paddingX: '0' },
        columns: [{ id: generateId(), width: 100, elements: [
          { id: generateId(), type: 'image', props: { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', alt: 'Property hero', borderRadius: '0', width: '100' } },
        ] }],
      },
      {
        id: generateId(),
        settings: { bg: '#ffffff', paddingY: '40', paddingX: '40' },
        columns: [
          { id: generateId(), width: 65, elements: [
            { id: generateId(), type: 'heading', props: { text: 'Modern Villa with Ocean View', tag: 'h1', align: 'left', fontSize: '32', fontWeight: '700', color: '#111827', letterSpacing: '-0.5' } },
            { id: generateId(), type: 'text', props: { text: '📍 123 Beachfront Drive, Coastal City, CA 90210', align: 'left', fontSize: '15', color: '#6b7280', lineHeight: '1.5' } },
          ] },
          { id: generateId(), width: 35, elements: [
            { id: generateId(), type: 'heading', props: { text: '$1,250,000', tag: 'h2', align: 'right', fontSize: '28', fontWeight: '800', color: '#059669', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Listed 3 days ago', align: 'right', fontSize: '13', color: '#9ca3af', lineHeight: '1.5' } },
          ] },
        ],
      },
      {
        id: generateId(),
        settings: { bg: '#f9fafb', paddingY: '30', paddingX: '40' },
        columns: [
          { id: generateId(), width: 25, elements: [
            { id: generateId(), type: 'icon', props: { icon: '🛏', size: '28', color: '#6366f1', align: 'center' } },
            { id: generateId(), type: 'heading', props: { text: '4', tag: 'h3', align: 'center', fontSize: '24', fontWeight: '700', color: '#111827', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Bedrooms', align: 'center', fontSize: '13', color: '#6b7280', lineHeight: '1.4' } },
          ] },
          { id: generateId(), width: 25, elements: [
            { id: generateId(), type: 'icon', props: { icon: '🚿', size: '28', color: '#6366f1', align: 'center' } },
            { id: generateId(), type: 'heading', props: { text: '3', tag: 'h3', align: 'center', fontSize: '24', fontWeight: '700', color: '#111827', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Bathrooms', align: 'center', fontSize: '13', color: '#6b7280', lineHeight: '1.4' } },
          ] },
          { id: generateId(), width: 25, elements: [
            { id: generateId(), type: 'icon', props: { icon: '📐', size: '28', color: '#6366f1', align: 'center' } },
            { id: generateId(), type: 'heading', props: { text: '2,800', tag: 'h3', align: 'center', fontSize: '24', fontWeight: '700', color: '#111827', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Sq. Ft.', align: 'center', fontSize: '13', color: '#6b7280', lineHeight: '1.4' } },
          ] },
          { id: generateId(), width: 25, elements: [
            { id: generateId(), type: 'icon', props: { icon: '🚗', size: '28', color: '#6366f1', align: 'center' } },
            { id: generateId(), type: 'heading', props: { text: '2', tag: 'h3', align: 'center', fontSize: '24', fontWeight: '700', color: '#111827', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Garage', align: 'center', fontSize: '13', color: '#6b7280', lineHeight: '1.4' } },
          ] },
        ],
      },
      {
        id: generateId(),
        settings: { bg: '#ffffff', paddingY: '40', paddingX: '40' },
        columns: [{ id: generateId(), width: 100, elements: [
          { id: generateId(), type: 'heading', props: { text: 'About This Property', tag: 'h2', align: 'left', fontSize: '24', fontWeight: '700', color: '#111827', letterSpacing: '0' } },
          { id: generateId(), type: 'text', props: { text: 'Experience luxury coastal living in this stunning modern villa. Featuring floor-to-ceiling windows that frame breathtaking ocean views, an open-concept living area perfect for entertaining, and a gourmet kitchen with top-of-the-line appliances. The master suite offers a private balcony overlooking the water, while the landscaped grounds include an infinity pool and outdoor dining area.', align: 'left', fontSize: '15', color: '#374151', lineHeight: '1.8' } },
        ] }],
      },
      {
        id: generateId(),
        settings: { bg: '#f9fafb', paddingY: '40', paddingX: '40' },
        columns: [
          { id: generateId(), width: 50, elements: [
            { id: generateId(), type: 'heading', props: { text: 'Amenities', tag: 'h3', align: 'left', fontSize: '20', fontWeight: '700', color: '#111827', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: '✓ Central Air Conditioning\n✓ Hardwood Floors\n✓ Smart Home System\n✓ Infinity Pool\n✓ Ocean View Balcony\n✓ Wine Cellar', align: 'left', fontSize: '14', color: '#374151', lineHeight: '2.0' } },
          ] },
          { id: generateId(), width: 50, elements: [
            { id: generateId(), type: 'heading', props: { text: 'Nearby', tag: 'h3', align: 'left', fontSize: '20', fontWeight: '700', color: '#111827', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: '✓ Beach — 0.2 miles\n✓ Marina — 1.5 miles\n✓ Shopping Center — 2 miles\n✓ Airport — 15 miles\n✓ Schools — 1 mile\n✓ Hospital — 3 miles', align: 'left', fontSize: '14', color: '#374151', lineHeight: '2.0' } },
          ] },
        ],
      },
      {
        id: generateId(),
        settings: { bg: '#1a1a2e', paddingY: '50', paddingX: '40' },
        columns: [
          { id: generateId(), width: 60, elements: [
            { id: generateId(), type: 'heading', props: { text: 'Interested in this property?', tag: 'h2', align: 'left', fontSize: '24', fontWeight: '700', color: '#ffffff', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Contact the listing agent to schedule a viewing or request more details.', align: 'left', fontSize: '15', color: '#94a3b8', lineHeight: '1.7' } },
          ] },
          { id: generateId(), width: 40, elements: [
            { id: generateId(), type: 'spacer', props: { height: '12' } },
            { id: generateId(), type: 'button', props: { text: 'Schedule Viewing', align: 'center', bg: '#6366f1', color: '#ffffff', fontSize: '15', borderRadius: '8', paddingX: '28', paddingY: '14', href: '#' } },
            { id: generateId(), type: 'spacer', props: { height: '8' } },
            { id: generateId(), type: 'button', props: { text: 'Call Agent', align: 'center', bg: 'transparent', color: '#ffffff', fontSize: '14', borderRadius: '8', paddingX: '28', paddingY: '12', href: 'tel:' } },
          ] },
        ],
      },
    ],
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'A conversion-focused landing page with hero, features grid, and call-to-action.',
    thumbnail: '🚀',
    category: 'landing',
    buildSections: () => [
      {
        id: generateId(),
        settings: { bg: '#0f172a', paddingY: '100', paddingX: '40' },
        columns: [{ id: generateId(), width: 100, elements: [
          { id: generateId(), type: 'heading', props: { text: 'Find Your Dream Home', tag: 'h1', align: 'center', fontSize: '48', fontWeight: '800', color: '#ffffff', letterSpacing: '-1' } },
          { id: generateId(), type: 'text', props: { text: 'Browse premium listings and connect with top-rated agents in your area.', align: 'center', fontSize: '18', color: '#94a3b8', lineHeight: '1.6' } },
          { id: generateId(), type: 'spacer', props: { height: '24' } },
          { id: generateId(), type: 'button', props: { text: 'Browse Listings', align: 'center', bg: '#6366f1', color: '#ffffff', fontSize: '16', borderRadius: '12', paddingX: '36', paddingY: '16', href: '#' } },
        ] }],
      },
      {
        id: generateId(),
        settings: { bg: '#ffffff', paddingY: '60', paddingX: '40' },
        columns: [
          { id: generateId(), width: 33, elements: [
            { id: generateId(), type: 'icon', props: { icon: '🔍', size: '36', color: '#6366f1', align: 'center' } },
            { id: generateId(), type: 'heading', props: { text: 'Smart Search', tag: 'h3', align: 'center', fontSize: '20', fontWeight: '700', color: '#111827', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Find properties that match your criteria with our AI-powered search engine.', align: 'center', fontSize: '14', color: '#6b7280', lineHeight: '1.7' } },
          ] },
          { id: generateId(), width: 33, elements: [
            { id: generateId(), type: 'icon', props: { icon: '🤝', size: '36', color: '#6366f1', align: 'center' } },
            { id: generateId(), type: 'heading', props: { text: 'Expert Agents', tag: 'h3', align: 'center', fontSize: '20', fontWeight: '700', color: '#111827', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Connect with verified, experienced agents who know your local market inside out.', align: 'center', fontSize: '14', color: '#6b7280', lineHeight: '1.7' } },
          ] },
          { id: generateId(), width: 34, elements: [
            { id: generateId(), type: 'icon', props: { icon: '🔒', size: '36', color: '#6366f1', align: 'center' } },
            { id: generateId(), type: 'heading', props: { text: 'Secure Process', tag: 'h3', align: 'center', fontSize: '20', fontWeight: '700', color: '#111827', letterSpacing: '0' } },
            { id: generateId(), type: 'text', props: { text: 'Every transaction is backed by our secure platform with verified listings and agents.', align: 'center', fontSize: '14', color: '#6b7280', lineHeight: '1.7' } },
          ] },
        ],
      },
      {
        id: generateId(),
        settings: { bg: '#f8fafc', paddingY: '60', paddingX: '40' },
        columns: [{ id: generateId(), width: 100, elements: [
          { id: generateId(), type: 'heading', props: { text: 'Ready to Get Started?', tag: 'h2', align: 'center', fontSize: '32', fontWeight: '700', color: '#111827', letterSpacing: '-0.5' } },
          { id: generateId(), type: 'text', props: { text: 'Join thousands of homebuyers and sellers who found their perfect match.', align: 'center', fontSize: '16', color: '#6b7280', lineHeight: '1.6' } },
          { id: generateId(), type: 'spacer', props: { height: '20' } },
          { id: generateId(), type: 'button', props: { text: 'Create Free Account', align: 'center', bg: '#6366f1', color: '#ffffff', fontSize: '16', borderRadius: '12', paddingX: '36', paddingY: '16', href: '#' } },
        ] }],
      },
    ],
  },
]

// ─── ELEMENT DEFAULTS ─────────────────────────────────────────────────────────

const defaultProps = (type: string): Record<string, any> => {
  switch (type) {
    case 'heading':
      return { text: 'Your Heading Here', tag: 'h2', align: 'left', fontSize: '32', fontWeight: '700', color: '#1a1a2e', letterSpacing: '0' }
    case 'text':
      return { text: 'Add your description here. Click to edit this text and make it your own.', align: 'left', fontSize: '16', color: '#555', lineHeight: '1.7' }
    case 'image':
      return { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', alt: 'Image', borderRadius: '8', width: '100' }
    case 'button':
      return { text: 'Click Me', align: 'left', bg: '#6366f1', color: '#fff', fontSize: '15', borderRadius: '8', paddingX: '28', paddingY: '12', href: '#' }
    case 'divider':
      return { style: 'solid', color: '#e2e8f0', height: '1', width: '100', align: 'center' }
    case 'spacer':
      return { height: '40' }
    case 'video':
      return { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', aspectRatio: '16/9' }
    case 'icon':
      return { icon: '★', size: '40', color: '#6366f1', align: 'center' }
    case 'html':
      return { code: "<p style='background:#f1f5f9;padding:16px;border-radius:8px'>Custom HTML block</p>" }
    case 'hero':
      return { title: 'Big Bold Headline', subtitle: 'Your compelling subheadline goes here', bg: '#1a1a2e', color: '#fff', align: 'center', paddingY: '80' }
    default:
      return {}
  }
}

const createElement = (type: string): Element => ({ id: generateId(), type, props: defaultProps(type) })
const createColumn = (width: number): Column => ({ id: generateId(), width, elements: [] })
const createSection = (cols: number[] = [100]): Section => ({
  id: generateId(),
  settings: { bg: '#ffffff', paddingY: '40', paddingX: '20' },
  columns: cols.map(createColumn),
})

// ─── TOAST ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  const colors = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-rental-blue-600'
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-white text-sm font-medium ${colors}`}
      style={{ animation: 'slideUp 0.2s ease' }}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      {message}
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState<Toast | null>(null)
  const show = useCallback((message: string, type: ToastType = 'info') => setToast({ message, type, id: Date.now() }), [])
  const ToastEl = toast ? <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null
  return { show, ToastEl }
}

// ─── PUBLISH MODAL ────────────────────────────────────────────────────────────

function PublishModal({
  isPublished,
  pageUrl,
  onPublish,
  onUnpublish,
  onCopy,
  onClose,
}: {
  isPublished: boolean
  pageUrl: string
  onPublish: () => void
  onUnpublish: () => void
  onCopy: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">
            {isPublished ? '🎉 Your Page is Live!' : 'Publish Your Page'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-lg leading-none">✕</button>
        </div>
        <div className="p-5">
          {isPublished ? (
            <>
              <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-emerald-700 text-xs font-medium">Published and visible to the public</p>
              </div>
              <p className="text-gray-600 text-xs mb-3">Share your page URL:</p>
              <div className="flex gap-2 mb-5">
                <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-rental-blue-600 truncate font-mono">{pageUrl}</div>
                <button onClick={onCopy} className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors shrink-0">Copy</button>
                <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-rental-blue-600 text-white text-xs rounded-lg hover:bg-rental-blue-700 transition-colors shrink-0">Open ↗</a>
              </div>
              <div className="flex gap-2">
                <button onClick={onUnpublish} className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors border border-gray-300">Unpublish</button>
                <button onClick={onClose} className="flex-1 py-2 bg-rental-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-rental-blue-700 transition-colors">Done</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                <p className="text-gray-600 text-xs font-medium">Draft — not yet visible to the public</p>
              </div>
              <p className="text-gray-600 text-sm mb-5">Publishing will make your page publicly accessible via a unique URL.</p>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors border border-gray-300">Cancel</button>
                <button onClick={onPublish} className="flex-1 py-2 bg-rental-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-rental-blue-700 transition-colors">Publish Page</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ATOM COMPONENTS ─────────────────────────────────────────────────────────

const FL = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">{children}</label>
)
const TI = ({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input type={type} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm px-2.5 py-1.5 rounded focus:outline-none focus:border-rental-blue-500 transition-colors" />
)
const TA = ({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <textarea value={value ?? ''} placeholder={placeholder} rows={rows} onChange={(e) => onChange(e.target.value)}
    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm px-2.5 py-1.5 rounded focus:outline-none focus:border-rental-blue-500 resize-none" />
)
const SEL = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}
    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm px-2.5 py-1.5 rounded focus:outline-none focus:border-rental-blue-500">
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)

function PillPicker({ options, value, onChange }: { options: Array<{ value: string; label: string }>; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${value === o.value ? 'border-rental-blue-500 bg-rental-blue-50 text-rental-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── PROPERTY EDITORS ────────────────────────────────────────────────────────

const PropGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-3"><FL>{label}</FL>{children}</div>
)
const PropColor = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="mb-3">
    <FL>{label}</FL>
    <div className="flex items-center gap-1.5">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-gray-300 bg-transparent shrink-0" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-xs px-2 py-1.5 rounded focus:outline-none focus:border-rental-blue-500" />
    </div>
  </div>
)
const PropSlider = ({ label, value, onChange, min = 0, max = 100 }: { label: string; value: string; onChange: (v: string) => void; min?: number; max?: number }) => (
  <div className="mb-3">
    <div className="flex justify-between mb-1">
      <FL>{label}</FL>
      <span className="text-xs text-rental-blue-600 mt-0.5">{value}px</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(e.target.value)} className="w-full accent-rental-blue-600" />
  </div>
)

const ALIGN_OPTS = [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]

function ElementProperties({ element, onChange }: { element: Element; onChange: (el: Element) => void }) {
  const p = element.props
  const set = (key: string) => (val: any) => onChange({ ...element, props: { ...p, [key]: val } })
  switch (element.type) {
    case 'heading':
      return (
        <div>
          <PropGroup label="Text"><TI value={p.text} onChange={set('text')} /></PropGroup>
          <PropGroup label="Tag"><SEL value={p.tag} onChange={set('tag')} options={['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(v => ({ value: v, label: v.toUpperCase() }))} /></PropGroup>
          <PropGroup label="Align"><PillPicker options={ALIGN_OPTS} value={p.align} onChange={set('align')} /></PropGroup>
          <PropSlider label="Font Size" value={p.fontSize} onChange={set('fontSize')} min={12} max={96} />
          <PropGroup label="Weight"><SEL value={p.fontWeight} onChange={set('fontWeight')} options={['400', '500', '600', '700', '800', '900'].map(v => ({ value: v, label: v }))} /></PropGroup>
          <PropColor label="Color" value={p.color} onChange={set('color')} />
          <PropSlider label="Letter Spacing" value={p.letterSpacing} onChange={set('letterSpacing')} min={-2} max={20} />
        </div>
      )
    case 'text':
      return (
        <div>
          <PropGroup label="Text"><TA value={p.text} onChange={set('text')} /></PropGroup>
          <PropGroup label="Align"><PillPicker options={ALIGN_OPTS} value={p.align} onChange={set('align')} /></PropGroup>
          <PropSlider label="Font Size" value={p.fontSize} onChange={set('fontSize')} min={10} max={36} />
          <PropColor label="Color" value={p.color} onChange={set('color')} />
          <PropGroup label="Line Height"><TI value={p.lineHeight} onChange={set('lineHeight')} /></PropGroup>
        </div>
      )
    case 'image':
      return (
        <div>
          <PropGroup label="Image URL"><TI value={p.src} onChange={set('src')} /></PropGroup>
          <PropGroup label="Alt Text"><TI value={p.alt} onChange={set('alt')} /></PropGroup>
          <PropSlider label="Width %" value={p.width} onChange={set('width')} min={10} max={100} />
          <PropSlider label="Border Radius" value={p.borderRadius} onChange={set('borderRadius')} min={0} max={50} />
        </div>
      )
    case 'button':
      return (
        <div>
          <PropGroup label="Text"><TI value={p.text} onChange={set('text')} /></PropGroup>
          <PropGroup label="Link (href)"><TI value={p.href} onChange={set('href')} /></PropGroup>
          <PropGroup label="Align"><PillPicker options={ALIGN_OPTS} value={p.align} onChange={set('align')} /></PropGroup>
          <PropColor label="Background" value={p.bg} onChange={set('bg')} />
          <PropColor label="Text Color" value={p.color} onChange={set('color')} />
          <PropSlider label="Font Size" value={p.fontSize} onChange={set('fontSize')} min={10} max={32} />
          <PropSlider label="Border Radius" value={p.borderRadius} onChange={set('borderRadius')} min={0} max={50} />
          <PropSlider label="Padding X" value={p.paddingX} onChange={set('paddingX')} min={0} max={80} />
          <PropSlider label="Padding Y" value={p.paddingY} onChange={set('paddingY')} min={0} max={40} />
        </div>
      )
    case 'divider':
      return (
        <div>
          <PropGroup label="Style"><SEL value={p.style} onChange={set('style')} options={['solid', 'dashed', 'dotted'].map(v => ({ value: v, label: v }))} /></PropGroup>
          <PropColor label="Color" value={p.color} onChange={set('color')} />
          <PropSlider label="Thickness" value={p.height} onChange={set('height')} min={1} max={10} />
          <PropSlider label="Width %" value={p.width} onChange={set('width')} min={10} max={100} />
          <PropGroup label="Align"><PillPicker options={ALIGN_OPTS} value={p.align} onChange={set('align')} /></PropGroup>
        </div>
      )
    case 'spacer':
      return <PropSlider label="Height" value={p.height} onChange={set('height')} min={8} max={300} />
    case 'video':
      return (
        <div>
          <PropGroup label="YouTube / Vimeo URL"><TI value={p.url} onChange={(v) => set('url')(toEmbedUrl(v))} placeholder="https://youtube.com/..." /></PropGroup>
          <PropGroup label="Aspect Ratio"><SEL value={p.aspectRatio} onChange={set('aspectRatio')} options={[{ value: '16/9', label: '16:9' }, { value: '4/3', label: '4:3' }, { value: '1/1', label: '1:1' }]} /></PropGroup>
        </div>
      )
    case 'icon':
      return (
        <div>
          <PropGroup label="Icon (emoji/symbol)"><TI value={p.icon} onChange={set('icon')} /></PropGroup>
          <PropSlider label="Size" value={p.size} onChange={set('size')} min={16} max={128} />
          <PropColor label="Color" value={p.color} onChange={set('color')} />
          <PropGroup label="Align"><PillPicker options={ALIGN_OPTS} value={p.align} onChange={set('align')} /></PropGroup>
        </div>
      )
    case 'html':
      return <PropGroup label="HTML Code"><TA value={p.code} onChange={set('code')} rows={6} /></PropGroup>
    case 'hero':
      return (
        <div>
          <PropGroup label="Title"><TI value={p.title} onChange={set('title')} /></PropGroup>
          <PropGroup label="Subtitle"><TI value={p.subtitle} onChange={set('subtitle')} /></PropGroup>
          <PropColor label="Background" value={p.bg} onChange={set('bg')} />
          <PropColor label="Text Color" value={p.color} onChange={set('color')} />
          <PropGroup label="Align"><PillPicker options={ALIGN_OPTS} value={p.align} onChange={set('align')} /></PropGroup>
          <PropSlider label="Padding Y" value={p.paddingY} onChange={set('paddingY')} min={20} max={200} />
        </div>
      )
    default:
      return <p className="text-gray-500 text-sm">No properties available.</p>
  }
}

function SectionProperties({ section, onChange }: { section: Section; onChange: (s: Section) => void }) {
  const s = section.settings
  const set = (key: string) => (val: string) => onChange({ ...section, settings: { ...s, [key]: val } })
  return (
    <div>
      <PropColor label="Background" value={s.bg} onChange={set('bg')} />
      <PropSlider label="Padding Y" value={s.paddingY} onChange={set('paddingY')} min={0} max={160} />
      <PropSlider label="Padding X" value={s.paddingX} onChange={set('paddingX')} min={0} max={100} />
    </div>
  )
}

// ─── ELEMENT RENDERER ────────────────────────────────────────────────────────

function renderElement(el: Element, isSelected: boolean, onClick: () => void, onDelete: () => void) {
  const p = el.props
  const alignClass = p.align === 'center' ? 'text-center' : p.align === 'right' ? 'text-right' : 'text-left'
  const wrap = (children: React.ReactNode) => (
    <div key={el.id} onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`group relative rounded transition-all duration-150 cursor-pointer ${isSelected ? 'ring-2 ring-rental-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-rental-blue-300'}`}>
      {isSelected && (
        <div className="absolute -top-7 left-0 flex gap-1 z-10">
          <span className="bg-rental-blue-600 text-white text-xs px-2 py-0.5 rounded font-mono">{el.type}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded hover:bg-red-600">✕</button>
        </div>
      )}
      {children}
    </div>
  )
  switch (el.type) {
    case 'heading': {
      const Tag = (p.tag || 'h2') as keyof JSX.IntrinsicElements
      return wrap(<Tag className={alignClass} style={{ fontSize: `${p.fontSize}px`, color: p.color, fontWeight: p.fontWeight, letterSpacing: `${p.letterSpacing}px`, lineHeight: 1.2 }}>{p.text}</Tag>)
    }
    case 'text':
      return wrap(<p className={alignClass} style={{ fontSize: `${p.fontSize}px`, color: p.color, lineHeight: p.lineHeight }}>{p.text}</p>)
    case 'image':
      return wrap(<div className={alignClass}><img src={p.src} alt={p.alt} className="inline-block object-cover" style={{ borderRadius: `${p.borderRadius}px`, width: `${p.width}%` }} /></div>)
    case 'button':
      return wrap(<div className={alignClass}><a href={p.href} className="inline-block font-semibold transition-opacity hover:opacity-80" style={{ background: p.bg, color: p.color, fontSize: `${p.fontSize}px`, borderRadius: `${p.borderRadius}px`, padding: `${p.paddingY}px ${p.paddingX}px` }} onClick={e => e.preventDefault()}>{p.text}</a></div>)
    case 'divider':
      return wrap(<div className="flex items-center" style={{ justifyContent: p.align === 'center' ? 'center' : p.align === 'right' ? 'flex-end' : 'flex-start' }}><hr style={{ borderStyle: p.style, borderColor: p.color, borderTopWidth: `${p.height}px`, width: `${p.width}%` }} /></div>)
    case 'spacer':
      return wrap(<div style={{ height: `${p.height}px` }} />)
    case 'video':
      return wrap(<div style={{ aspectRatio: p.aspectRatio }} className="w-full rounded overflow-hidden bg-black"><iframe src={p.url} className="w-full h-full" allowFullScreen title="video" /></div>)
    case 'icon':
      return wrap(<div className={alignClass} style={{ fontSize: `${p.size}px`, color: p.color }}>{p.icon}</div>)
    case 'html':
      return wrap(<div dangerouslySetInnerHTML={{ __html: p.code }} />)
    case 'hero':
      return wrap(<div className="w-full flex flex-col items-center justify-center rounded-lg" style={{ background: p.bg, color: p.color, padding: `${p.paddingY}px 32px`, textAlign: p.align }}><h1 className="text-4xl font-black mb-3">{p.title}</h1><p className="text-lg opacity-80">{p.subtitle}</p></div>)
    default:
      return wrap(<div className="p-2 text-sm text-gray-400">Unknown widget</div>)
  }
}

// ─── SECTION BLOCK ────────────────────────────────────────────────────────────

function SectionBlock({
  section,
  si,
  total,
  selected,
  setSelected,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  dragOver,
  setDragOver,
  onDropOnColumn,
  onElementDragStart,
  onDeleteElement,
}: {
  section: Section
  si: number
  total: number
  selected: Selected | null
  setSelected: (s: Selected) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  dragOver: DragOver | null
  setDragOver: (d: DragOver | null) => void
  onDropOnColumn: (sectionId: string, colId: string) => void
  onElementDragStart: (sectionId: string, colId: string, elId: string) => void
  onDeleteElement: (sectionId: string, colId: string, elId: string) => void
}) {
  const isSelected = selected?.sectionId === section.id && !selected?.elId
  const s = section.settings
  return (
    <div className={`relative mb-3 rounded-xl overflow-hidden transition-all duration-150 group/section ${isSelected ? 'ring-2 ring-rental-blue-500' : 'hover:ring-1 hover:ring-gray-300'}`}
      style={{ background: s.bg, padding: `${s.paddingY}px ${s.paddingX}px` }}
      onClick={(e) => { e.stopPropagation(); setSelected({ type: 'section', sectionId: section.id }) }}>

      {/* Section toolbar */}
      <div className={`absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white/95 backdrop-blur rounded-lg px-1.5 py-1 z-10 transition-opacity border border-gray-200 shadow-sm ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/section:opacity-100'}`}>
        <span className="text-rental-blue-600 text-xs font-bold px-1">§{si + 1}</span>
        <div className="w-px h-3 bg-gray-300" />
        <button onClick={(e) => { e.stopPropagation(); onMoveUp(section.id) }} disabled={si === 0} className="px-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 text-xs">↑</button>
        <button onClick={(e) => { e.stopPropagation(); onMoveDown(section.id) }} disabled={si === total - 1} className="px-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 text-xs">↓</button>
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(section.id) }} className="px-1 text-gray-500 hover:text-gray-900 text-xs">⧉</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(section.id) }} className="px-1 text-red-500 hover:text-red-600 text-xs">✕</button>
      </div>

      <div className="flex gap-3">
        {section.columns.map((col) => {
          const isTarget = dragOver?.sectionId === section.id && dragOver?.colId === col.id
          return (
            <div key={col.id} style={{ flex: col.width }}
              onDragOver={(e) => { e.preventDefault(); setDragOver({ sectionId: section.id, colId: col.id }) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); onDropOnColumn(section.id, col.id) }}
              className={`relative min-h-16 rounded-lg transition-all duration-150 ${isTarget ? 'bg-rental-blue-50 ring-2 ring-rental-blue-400 ring-dashed' : 'bg-white/10'}`}>
              {col.elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-400 text-xs font-medium">Drop widget here</p>
                </div>
              )}
              <div className="p-2 flex flex-col gap-2">
                {col.elements.map((el) => (
                  <div key={el.id} draggable onDragStart={(e) => { e.stopPropagation(); onElementDragStart(section.id, col.id, el.id) }}>
                    {renderElement(el, selected?.elId === el.id, () => setSelected({ type: 'element', sectionId: section.id, colId: col.id, elId: el.id }), () => onDeleteElement(section.id, col.id, el.id))}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAIN PAGE BUILDER ────────────────────────────────────────────────────────

export default function PageBuilder({ userType }: PageBuilderProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [selected, setSelected] = useState<Selected | null>(null)
  const [preview, setPreview] = useState<PreviewMode>('desktop')
  const [activeTab, setActiveTab] = useState('widgets')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateCategory, setTemplateCategory] = useState<string>('all')
  const [dragSource, setDragSource] = useState<DragSource | null>(null)
  const [dragOver, setDragOver] = useState<DragOver | null>(null)
  const [showLayoutPicker, setShowLayoutPicker] = useState(false)
  const [history, setHistory] = useState<Section[][]>([])
  const [histIdx, setHistIdx] = useState(0)

  // ── Save / Publish state ──────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [isPublished, setIsPublished] = useState(false)
  const [pageUrl, setPageUrl] = useState('')
  const [pageSlug, setPageSlug] = useState<string | null>(null)
  const [pageBuilderId, setPageBuilderId] = useState<number | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { show: showToast, ToastEl } = useToast()

  // ── My Pages state ────────────────────────────────────────────────────────
  const [showMyPagesModal, setShowMyPagesModal] = useState(false)
  const [savedPages, setSavedPages] = useState<PageBuilderData[]>([])
  const [loadingPages, setLoadingPages] = useState(false)
  const [pageName, setPageName] = useState('Untitled Page')
  const [renamingPageId, setRenamingPageId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingPageId, setDeletingPageId] = useState<number | null>(null)
  const [publishingPageId, setPublishingPageId] = useState<number | null>(null)

  // Mark unsaved whenever sections change after initial load
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (initialized) setSaveStatus('unsaved')
  }, [sections, initialized])

  // ── Load from API on mount ─────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        setIsLoading(true)
        const pages = await pageBuilderApi.getAll(userType, 'profile')
        if (pages && pages.length > 0) {
          const pageData = pages[0]
          setPageBuilderId(pageData.id || null)
          setIsPublished(pageData.is_published || false)
          setPageUrl(pageData.page_url || '')
          setPageSlug(pageData.page_slug || null)
          
          // Load page name
          setPageName((pageData as any).page_data?.name || pageData.page_slug || 'Untitled Page')

          // Load sections from page_data if available
          // Convert unified_sections format to internal Section format
          if (pageData.unified_sections && pageData.unified_sections.length > 0) {
            // For now, we'll store sections in a custom format in page_data
            // You may need to adjust this based on your data structure
            const savedSections = (pageData as any).page_data?.sections || []
            if (savedSections.length > 0) {
              setSections(savedSections)
              setHistory([savedSections])
              setHistIdx(0)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load page:', error)
        showToast('Failed to load page data', 'error')
      } finally {
        setIsLoading(false)
        setInitialized(true)
      }
    })()
  }, [userType, showToast])

  // ── My Pages CRUD ─────────────────────────────────────────────────────────

  const loadAllPages = useCallback(async () => {
    try {
      setLoadingPages(true)
      const pages = await pageBuilderApi.getAll(userType)
      setSavedPages(pages || [])
    } catch (error) {
      console.error('Failed to load pages:', error)
      showToast('Failed to load pages', 'error')
    } finally {
      setLoadingPages(false)
    }
  }, [userType, showToast])

  const handleLoadPage = useCallback(async (page: PageBuilderData) => {
    try {
      setPageBuilderId(page.id || null)
      setIsPublished(page.is_published || false)
      setPageUrl(page.page_url || '')
      setPageSlug(page.page_slug || null)
      setPageName((page as any).page_data?.name || page.page_slug || 'Untitled Page')

      const savedSections = (page as any).page_data?.sections || []
      setSections(savedSections)
      setHistory([savedSections])
      setHistIdx(0)
      setSelected(null)
      setSaveStatus('saved')
      setInitialized(false)
      setTimeout(() => setInitialized(true), 100)

      setShowMyPagesModal(false)
      showToast('Page loaded!', 'success')
    } catch (error: any) {
      showToast('Failed to load page: ' + (error.message || 'Unknown error'), 'error')
    }
  }, [showToast])

  const handleNewPage = useCallback(() => {
    setSections([])
    setHistory([[]])
    setHistIdx(0)
    setSelected(null)
    setPageBuilderId(null)
    setPageSlug(null)
    setPageUrl('')
    setIsPublished(false)
    setPageName('Untitled Page')
    setSaveStatus('saved')
    setInitialized(false)
    setTimeout(() => setInitialized(true), 100)
    setShowMyPagesModal(false)
    showToast('New page created', 'info')
  }, [showToast])

  const handleDeletePage = useCallback(async (id: number) => {
    try {
      await pageBuilderApi.delete(id)
      setSavedPages(prev => prev.filter(p => p.id !== id))
      // If we deleted the currently loaded page, reset to new
      if (pageBuilderId === id) {
        handleNewPage()
      }
      setDeletingPageId(null)
      showToast('Page deleted', 'success')
    } catch (error: any) {
      showToast('Delete failed: ' + (error.response?.data?.message || error.message || 'Unknown error'), 'error')
    }
  }, [pageBuilderId, handleNewPage, showToast])

  const handleTogglePublishPage = useCallback(async (page: PageBuilderData) => {
    if (!page.id) return
    try {
      setPublishingPageId(page.id)
      const result = await pageBuilderApi.publish(page.id, !page.is_published)
      // Update in savedPages list
      setSavedPages(prev => prev.map(p => p.id === page.id ? { ...p, is_published: result.is_published, page_url: result.page_url } : p))
      // If this is the currently loaded page, update local state too
      if (pageBuilderId === page.id) {
        setIsPublished(result.is_published || false)
        if (result.page_url) setPageUrl(result.page_url)
      }
      showToast(result.is_published ? 'Page published!' : 'Page unpublished', result.is_published ? 'success' : 'info')
    } catch (error: any) {
      showToast('Publish failed: ' + (error.response?.data?.message || error.message || 'Unknown error'), 'error')
    } finally {
      setPublishingPageId(null)
    }
  }, [pageBuilderId, showToast])

  const handleDuplicatePage = useCallback(async (page: PageBuilderData) => {
    try {
      const existingPageData = (page as any).page_data || {}
      const existingName = existingPageData.name || page.page_slug || 'Untitled Page'

      const copySlug = existingName !== 'Untitled Page'
        ? `page/${slugify(existingName)}-copy`
        : undefined

      const saved = await pageBuilderApi.save({
        user_type: userType,
        page_type: (page.page_type as 'profile' | 'property') || 'profile',
        page_data: { ...page, name: `${existingName} (Copy)`, page_data: { ...existingPageData, name: `${existingName} (Copy)` } } as any,
        page_slug: copySlug,
      })

      setSavedPages(prev => [...prev, saved])
      showToast('Page duplicated!', 'success')
    } catch (error: any) {
      showToast('Duplicate failed: ' + (error.response?.data?.message || error.message || 'Unknown error'), 'error')
    }
  }, [userType, showToast])

  const handleRenamePage = useCallback(async (id: number, newName: string) => {
    if (!newName.trim()) return
    try {
      const page = savedPages.find(p => p.id === id)
      if (!page) return
      const existingPageData = (page as any).page_data || {}
      const newSlug = `page/${slugify(newName.trim())}`
      const result = await pageBuilderApi.update(id, {
        page_data: { ...existingPageData, name: newName.trim() } as any,
        page_slug: newSlug,
      })
      setSavedPages(prev => prev.map(p => p.id === id ? { ...p, page_slug: result.page_slug || newSlug, page_url: result.page_url || buildPageUrl(newSlug), page_data: { ...existingPageData, name: newName.trim() } } as any : p))
      if (pageBuilderId === id) {
        setPageName(newName.trim())
        setPageSlug(result.page_slug || newSlug)
        setPageUrl(result.page_url || buildPageUrl(newSlug))
      }
      setRenamingPageId(null)
      showToast('Page renamed', 'success')
    } catch (error: any) {
      showToast('Rename failed: ' + (error.response?.data?.message || error.message || 'Unknown error'), 'error')
    }
  }, [savedPages, pageBuilderId, showToast])

  // ── History ───────────────────────────────────────────────────────────────

  const pushHistory = useCallback((next: Section[]) => {
    setHistory((h) => {
      const trimmed = [...h.slice(0, histIdx + 1), next]
      setHistIdx(trimmed.length - 1)
      return trimmed.slice(-50) // Keep last 50 history entries
    })
  }, [histIdx])

  const undo = () => {
    if (histIdx > 0) {
      setSections(history[histIdx - 1])
      setHistIdx((i) => i - 1)
    }
  }
  const redo = () => {
    if (histIdx < history.length - 1) {
      setSections(history[histIdx + 1])
      setHistIdx((i) => i + 1)
    }
  }

  const update = useCallback((fn: (prev: Section[]) => Section[]) => {
    setSections((prev) => {
      const next = fn(prev)
      pushHistory(next)
      return next
    })
  }, [pushHistory])

  // ── Save ──────────────────────────────────────────────────────────────────

  const buildPagePayload = useCallback(() => {
    const pageData: Partial<PageBuilderData> = {
      unified_sections: sections.map(s => ({
        id: s.id,
        name: `Section ${s.id}`,
        visible: true,
        type: 'custom',
        content: JSON.stringify(s),
      })),
    }
    return {
      ...pageData,
      page_data: { sections },
      name: pageName,
    } as any
  }, [sections, pageName])

  const handleSave = useCallback(async () => {
    if (!initialized) return
    try {
      setSaveStatus('saving')

      const payload = buildPagePayload()

      // Derive slug from the page title
      const derivedSlug = pageName && pageName !== 'Untitled Page'
        ? `page/${slugify(pageName)}`
        : pageSlug || undefined

      let saved: PageBuilderData
      if (pageBuilderId) {
        // Update existing page
        saved = await pageBuilderApi.update(pageBuilderId, {
          page_data: payload,
          page_slug: derivedSlug,
        })
      } else {
        // Create new page
        saved = await pageBuilderApi.save({
          user_type: userType,
          page_type: 'profile',
          page_data: payload,
          page_slug: derivedSlug,
        })
      }

      setPageBuilderId(saved.id || null)
      const slug = saved.page_slug || derivedSlug
      if (slug) setPageSlug(slug)
      setPageUrl(saved.page_url || (slug ? buildPageUrl(slug) : ''))
      setIsPublished(saved.is_published || false)
      setSaveStatus('saved')
      showToast('Changes saved!', 'success')
      return saved
    } catch (error: any) {
      setSaveStatus('error')
      showToast('Save failed: ' + (error.response?.data?.message || error.message || 'Unknown error'), 'error')
      return null
    }
  }, [sections, userType, pageSlug, pageBuilderId, pageName, initialized, showToast, buildPagePayload])

  const handleSaveAsNew = useCallback(async () => {
    if (!initialized) return
    try {
      setSaveStatus('saving')
      const payload = buildPagePayload()
      payload.name = `${pageName} (Copy)`
      payload.page_data = { ...payload.page_data, name: `${pageName} (Copy)` }

      // Derive slug from page name, append -copy
      const derivedSlug = pageName && pageName !== 'Untitled Page'
        ? `page/${slugify(pageName)}-copy`
        : undefined

      const saved = await pageBuilderApi.save({
        user_type: userType,
        page_type: 'profile',
        page_data: payload,
        page_slug: derivedSlug,
      })

      setPageBuilderId(saved.id || null)
      const slug = saved.page_slug || derivedSlug
      if (slug) setPageSlug(slug)
      setPageUrl(saved.page_url || (slug ? buildPageUrl(slug) : ''))
      setIsPublished(saved.is_published || false)
      setPageName(`${pageName} (Copy)`)
      setSaveStatus('saved')
      showToast('Saved as new page!', 'success')
    } catch (error: any) {
      setSaveStatus('error')
      showToast('Save failed: ' + (error.response?.data?.message || error.message || 'Unknown error'), 'error')
    }
  }, [sections, userType, pageName, initialized, showToast, buildPagePayload])

  // Keyboard shortcut: Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    let id = pageBuilderId

    // Save first if no ID yet (new page)
    if (!id) {
      const saved = await handleSave()
      if (!saved?.id) {
        showToast('Please save your page first before publishing.', 'error')
        return
      }
      id = saved.id
    }

    try {
      const result = await pageBuilderApi.publish(id, true)
      setIsPublished(result.is_published || false)
      const slug = result.page_slug || pageSlug
      if (slug) setPageSlug(slug)
      setPageUrl(result.page_url || (slug ? buildPageUrl(slug) : ''))
      showToast('Page published!', 'success')
      setShowPublishModal(true)
    } catch (error: any) {
      showToast('Publish failed: ' + (error.response?.data?.message || error.message || 'Unknown error'), 'error')
    }
  }

  const handleUnpublish = async () => {
    if (!pageBuilderId) return
    try {
      const result = await pageBuilderApi.publish(pageBuilderId, false)
      setIsPublished(result.is_published || false)
      setShowPublishModal(false)
      showToast('Page unpublished.', 'info')
    } catch (error: any) {
      showToast('Unpublish failed: ' + (error.response?.data?.message || error.message || 'Unknown error'), 'error')
    }
  }

  const handleCopyUrl = () => {
    if (pageUrl) {
      navigator.clipboard.writeText(pageUrl).then(() => showToast('URL copied!', 'success'))
    }
  }

  // ── Section Operations ────────────────────────────────────────────────────

  const addSection = (cols: number[]) => {
    update((p) => [...p, createSection(cols)])
    setShowLayoutPicker(false)
  }
  const deleteSection = (id: string) => {
    update((p) => p.filter((s) => s.id !== id))
    setSelected(null)
  }
  const moveSectionUp = (id: string) => update((p) => {
    const i = p.findIndex(s => s.id === id)
    if (i < 1) return p
    const a = [...p]
    ;[a[i - 1], a[i]] = [a[i], a[i - 1]]
    return a
  })
  const moveSectionDown = (id: string) => update((p) => {
    const i = p.findIndex(s => s.id === id)
    if (i >= p.length - 1) return p
    const a = [...p]
    ;[a[i], a[i + 1]] = [a[i + 1], a[i]]
    return a
  })
  const updateSection = (upd: Section) => update((p) => p.map((s) => s.id === upd.id ? upd : s))

  const duplicateSection = (id: string) => update((prev) => {
    const idx = prev.findIndex((s) => s.id === id)
    const copy = JSON.parse(JSON.stringify(prev[idx]))
    copy.id = generateId()
    copy.columns = copy.columns.map((c: Column) => ({ ...c, id: generateId(), elements: c.elements.map((e: Element) => ({ ...e, id: generateId() })) }))
    const next = [...prev]
    next.splice(idx + 1, 0, copy)
    return next
  })

  // ── Element Operations ────────────────────────────────────────────────────

  const addElement = (sectionId: string, colId: string, type: string) => {
    const el = createElement(type)
    update((p) => p.map((s) => s.id !== sectionId ? s : { ...s, columns: s.columns.map(c => c.id !== colId ? c : { ...c, elements: [...c.elements, el] }) }))
    setSelected({ type: 'element', sectionId, colId, elId: el.id })
  }
  const updateElement = (sectionId: string, colId: string, upd: Element) =>
    update((p) => p.map((s) => s.id !== sectionId ? s : { ...s, columns: s.columns.map(c => c.id !== colId ? c : { ...c, elements: c.elements.map(e => e.id === upd.id ? upd : e) }) }))
  const deleteElement = (sectionId: string, colId: string, elId: string) => {
    update((p) => p.map((s) => s.id !== sectionId ? s : { ...s, columns: s.columns.map(c => c.id !== colId ? c : { ...c, elements: c.elements.filter(e => e.id !== elId) }) }))
    setSelected(null)
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  const handleWidgetDragStart = (type: string) => setDragSource({ from: 'panel', type })
  const handleElementDragStart = (sectionId: string, colId: string, elId: string) => setDragSource({ from: 'canvas', sectionId, colId, elId })

  const handleDropOnColumn = (sectionId: string, colId: string) => {
    if (!dragSource) return
    if (dragSource.from === 'panel') {
      addElement(sectionId, colId, dragSource.type!)
    } else if (dragSource.from === 'canvas') {
      if (dragSource.sectionId === sectionId && dragSource.colId === colId) return
      update((prev) => {
        let el: Element | undefined
        const next = prev.map((s) => {
          if (s.id !== dragSource.sectionId) return s
          return {
            ...s,
            columns: s.columns.map(c => {
              if (c.id !== dragSource.colId) return c
              el = c.elements.find(e => e.id === dragSource.elId)
              return { ...c, elements: c.elements.filter(e => e.id !== dragSource.elId) }
            }),
          }
        })
        return next.map((s) => s.id !== sectionId ? s : { ...s, columns: s.columns.map(c => c.id !== colId ? c : { ...c, elements: [...c.elements, el!] }) })
      })
    }
    setDragSource(null)
    setDragOver(null)
  }

  // ── Themes ────────────────────────────────────────────────────────────────

  const applyTheme = (theme: typeof BUILT_IN_THEMES[0]) =>
    update((p) => p.map((s) => ({ ...s, settings: { ...s.settings, bg: theme.bg } })))

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedSection = selected ? sections.find(s => s.id === selected.sectionId) : null
  const selectedCol = selectedSection?.columns?.find(c => c.id === selected?.colId) ?? null
  const selectedElement = selectedCol?.elements?.find(e => e.id === selected?.elId) ?? null
  const previewMaxWidth = preview === 'desktop' ? '100%' : preview === 'tablet' ? '768px' : '375px'

  const saveStatusLabel = useMemo(() => {
    const labels: Record<SaveStatus, string> = { saved: 'Saved', saving: 'Saving…', unsaved: 'Unsaved changes', error: 'Save failed' }
    return labels[saveStatus]
  }, [saveStatus])
  const saveStatusDot = useMemo(() => {
    const dots: Record<SaveStatus, string> = { saved: 'bg-emerald-500', saving: 'bg-rental-blue-500 animate-pulse', unsaved: 'bg-yellow-500', error: 'bg-red-500' }
    return dots[saveStatus]
  }, [saveStatus])

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-gray-900 text-lg">Loading page builder...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-outfit">

      {/* ── App Sidebar ── */}
      <AppSidebar />

      <div className="main-with-sidebar flex flex-col flex-1 overflow-hidden">

        {/* ── Top Toolbar ── */}
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 z-20 shrink-0 shadow-sm">
          {/* Left: branding + undo/redo + status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="text-gray-900 font-bold text-sm tracking-tight">PageCraft</span>
              <span className="text-gray-500 text-xs">/</span>
              <input
                type="text"
                value={pageName}
                onChange={(e) => { setPageName(e.target.value); setSaveStatus('unsaved') }}
                className="text-gray-700 text-xs bg-transparent border-none outline-none focus:text-gray-900 max-w-32 truncate hover:bg-gray-50 px-1 py-0.5 rounded transition-colors"
                title="Click to rename page"
              />
            </div>
            <div className="w-px h-5 bg-gray-300" />
            <button onClick={undo} disabled={histIdx === 0} className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm" title="Undo (Ctrl+Z)">↩</button>
            <button onClick={redo} disabled={histIdx >= history.length - 1} className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm" title="Redo">↪</button>
            <div className="w-px h-5 bg-gray-300" />
            {/* Save status pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${saveStatusDot}`} />
              {saveStatusLabel}
            </div>
          </div>

          {/* Centre: preview toggles */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
            {[['desktop', '🖥', 'Desktop'], ['tablet', '📱', 'Tablet'], ['mobile', '📲', 'Mobile']].map(([mode, icon, label]) => (
              <button key={mode} onClick={() => setPreview(mode as PreviewMode)} title={label}
                className={`px-2.5 py-1 rounded text-sm transition-all ${preview === mode ? 'bg-rental-blue-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                {icon}
              </button>
            ))}
          </div>

          {/* Right: My Pages + Templates buttons */}
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowMyPagesModal(true); loadAllPages() }}
              className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold">
              <span>📄</span> My Pages
            </button>
            <button onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-rental-blue-50 text-rental-blue-700 border border-rental-blue-200 rounded-lg hover:bg-rental-blue-100 transition-colors text-sm font-semibold">
              <span>⬡</span> Templates
            </button>
          </div>
        </header>

        {/* ── Main Area ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left Panel ── */}
          <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden shadow-sm">
            <div className="flex border-b border-gray-200">
              {[['widgets', 'Widgets'], ['layers', 'Layers'], ['themes', 'Themes']].map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors ${activeTab === tab ? 'text-rental-blue-600 border-b-2 border-rental-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">

              {activeTab === 'widgets' && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-widest">Drag to canvas</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {WIDGET_TYPES.map((w) => (
                      <div key={w.type} draggable onDragStart={() => handleWidgetDragStart(w.type)}
                        className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-gray-50 border border-gray-200 cursor-grab hover:bg-gray-100 hover:border-rental-blue-500/50 transition-all group select-none">
                        <span className="text-xl leading-none">{w.icon}</span>
                        <span className="text-xs text-gray-600 group-hover:text-gray-900">{w.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'layers' && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-widest">Page Structure</p>
                  {sections.map((s, si) => (
                    <div key={s.id} className="mb-1">
                      <button onClick={() => setSelected({ type: 'section', sectionId: s.id })}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left transition-colors ${selected?.sectionId === s.id && !selected?.elId ? 'bg-rental-blue-50 text-rental-blue-700 border border-rental-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <span>⬛</span> Section {si + 1}
                      </button>
                      {s.columns.map((c, ci) => (
                        <div key={c.id} className="ml-3">
                          <div className="text-xs text-gray-500 px-2 py-0.5">Col {ci + 1} ({c.width}%)</div>
                          {c.elements.map((el) => (
                            <button key={el.id} onClick={() => setSelected({ type: 'element', sectionId: s.id, colId: c.id, elId: el.id })}
                              className={`w-full flex items-center gap-1.5 px-3 py-1 rounded text-xs text-left transition-colors ${selected?.elId === el.id ? 'bg-rental-blue-50 text-rental-blue-700 border border-rental-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                              <span className="opacity-60">{WIDGET_TYPES.find(w => w.type === el.type)?.icon}</span>
                              {el.type}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'themes' && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-widest">Color Themes</p>
                  <div className="flex flex-col gap-2">
                    {BUILT_IN_THEMES.map((t) => (
                      <button key={t.id} onClick={() => applyTheme(t)}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 hover:border-rental-blue-500 bg-white hover:bg-gray-50 transition-all text-left">
                        <div className="flex gap-1 shrink-0">
                          <div className="w-4 h-4 rounded-full border border-gray-300" style={{ background: t.bg }} />
                          <div className="w-4 h-4 rounded-full" style={{ background: t.primary }} />
                        </div>
                        <p className="text-xs font-semibold text-gray-900">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* ── Sidebar bottom: publish status + save ── */}
            <div className="border-t border-gray-200 p-3 flex flex-col gap-2 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPublished ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {isPublished ? 'Live & Published' : 'Draft — not published'}
              </div>
              {isPublished && pageUrl && (
                <div className="flex gap-1">
                  <a href={pageUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-xs text-rental-blue-600 bg-rental-blue-50 border border-rental-blue-200 rounded-lg truncate hover:bg-rental-blue-100 transition-colors">
                    {pageUrl.replace('https://', '').substring(0, 28)}…
                  </a>
                  <button onClick={handleCopyUrl} className="px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs border border-gray-300 transition-colors">⧉</button>
                </div>
              )}
              <div className="flex gap-1.5">
                <button onClick={handleSave} disabled={saveStatus === 'saving'}
                  className="flex-1 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors border border-gray-300">
                  {saveStatus === 'saving' ? 'Saving…' : 'Save'}
                </button>
                {pageBuilderId && (
                  <button onClick={handleSaveAsNew} disabled={saveStatus === 'saving'}
                    className="py-1.5 px-2.5 text-xs font-semibold text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors border border-gray-300" title="Save as new page">
                    +
                  </button>
                )}
              </div>
              <button onClick={() => setShowPublishModal(true)}
                className={`w-full py-1.5 text-xs font-semibold rounded-lg transition-colors ${isPublished ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rental-blue-600 hover:bg-rental-blue-700 text-white'}`}>
                {isPublished ? 'Manage Publishing' : 'Publish Page'}
              </button>
            </div>
          </aside>

          {/* ── Canvas ── */}
          <main className="flex-1 overflow-auto bg-gray-100 p-6" onClick={() => setSelected(null)}>
            <div className="mx-auto transition-all duration-300" style={{ maxWidth: previewMaxWidth }}>

              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                  <div className="text-5xl mb-3">⬡</div>
                  <p className="text-base font-medium mb-2">No sections yet</p>
                  <p className="text-sm text-gray-500">Click "Add Section" below to get started</p>
                </div>
              ) : (
                sections.map((section, si) => (
                  <SectionBlock key={section.id} section={section} si={si} total={sections.length}
                    selected={selected} setSelected={setSelected}
                    onDelete={deleteSection} onDuplicate={duplicateSection}
                    onMoveUp={moveSectionUp} onMoveDown={moveSectionDown}
                    dragOver={dragOver} setDragOver={setDragOver}
                    onDropOnColumn={handleDropOnColumn}
                    onElementDragStart={handleElementDragStart}
                    onDeleteElement={deleteElement}
                  />
                ))
              )}

              {/* Add Section */}
              <div className="mt-4">
                {showLayoutPicker ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
                    <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-widest text-center">Choose Column Layout</p>
                    <div className="grid grid-cols-3 gap-2">
                      {COLUMN_LAYOUTS.map((layout) => (
                        <button key={layout.label} onClick={() => addSection(layout.cols)}
                          className="p-2 rounded-lg border border-gray-200 hover:border-rental-blue-500 hover:bg-gray-50 transition-all group">
                          <div className="flex gap-0.5 h-8 mb-1">
                            {layout.cols.map((w, i) => <div key={i} className="bg-gray-300 group-hover:bg-rental-blue-500/50 rounded transition-colors" style={{ flex: w }} />)}
                          </div>
                          <span className="text-xs text-gray-600">{layout.label}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowLayoutPicker(false)} className="mt-3 w-full py-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setShowLayoutPicker(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-rental-blue-500 hover:text-rental-blue-600 transition-all text-sm font-medium flex items-center justify-center gap-2 bg-white">
                    <span className="text-lg">+</span> Add Section
                  </button>
                )}
              </div>

            </div>
          </main>

          {/* ── Right Properties Panel ── */}
          <aside className="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                {selectedElement ? `Edit: ${selectedElement.type}` : selectedSection && selected?.type === 'section' ? 'Section Settings' : 'Properties'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {selectedElement ? (
                <ElementProperties element={selectedElement} onChange={(upd) => updateElement(selected!.sectionId, selected!.colId!, upd)} />
              ) : selectedSection && selected?.type === 'section' ? (
                <SectionProperties section={selectedSection} onChange={updateSection} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center pt-10">
                  <div className="text-4xl mb-3 opacity-30">⬡</div>
                  <p className="text-gray-500 text-sm">Select an element or section to edit its properties</p>
                </div>
              )}
            </div>

            {/* Bottom: save shortcut hint */}
            <div className="border-t border-gray-200 px-4 py-2.5 shrink-0">
              <p className="text-xs text-gray-500 text-center">Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600 font-mono text-[10px]">Ctrl+S</kbd> to save</p>
            </div>
          </aside>

        </div>
      </div>

      {/* ── My Pages Modal ── */}
      {showMyPagesModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setShowMyPagesModal(false); setDeletingPageId(null); setRenamingPageId(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">My Pages</h3>
                <p className="text-xs text-gray-500 mt-0.5">Manage all your pages — each can be published independently.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleNewPage}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rental-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-rental-blue-700 transition-colors">
                  <span>+</span> New Page
                </button>
                <button onClick={() => { setShowMyPagesModal(false); setDeletingPageId(null); setRenamingPageId(null) }} className="text-gray-400 hover:text-gray-900 text-lg leading-none p-1">✕</button>
              </div>
            </div>

            {/* Stats bar */}
            {savedPages.length > 0 && (
              <div className="flex items-center gap-4 px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 shrink-0">
                <span>{savedPages.length} total page{savedPages.length !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span className="text-emerald-600 font-medium">{savedPages.filter(p => p.is_published).length} published</span>
                <span>·</span>
                <span>{savedPages.filter(p => !p.is_published).length} draft{savedPages.filter(p => !p.is_published).length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Page list */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingPages ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-gray-500 text-sm">Loading pages...</div>
                </div>
              ) : savedPages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-4xl mb-3 opacity-30">📄</div>
                  <p className="text-gray-500 text-sm font-medium mb-1">No saved pages yet</p>
                  <p className="text-gray-400 text-xs mb-4">Create a new page or apply a template to get started</p>
                  <button onClick={handleNewPage}
                    className="px-4 py-2 bg-rental-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-rental-blue-700 transition-colors">
                    + Create Your First Page
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {savedPages.map((page) => {
                    const name = (page as any).page_data?.name || page.page_slug || 'Untitled Page'
                    const isActive = pageBuilderId === page.id
                    const updatedAt = page.updated_at ? new Date(page.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''
                    const isTogglingPublish = publishingPageId === page.id
                    return (
                      <div key={page.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          isActive ? 'border-rental-blue-300 bg-rental-blue-50/50' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}>
                        {/* Left icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          page.is_published ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className="text-lg">{page.is_published ? '🌐' : '📄'}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {renamingPageId === page.id ? (
                            <div className="flex items-center gap-1.5">
                              <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRenamePage(page.id!, renameValue); if (e.key === 'Escape') setRenamingPageId(null) }}
                                className="flex-1 text-sm font-semibold text-gray-900 bg-white border border-rental-blue-400 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-rental-blue-400"
                                autoFocus />
                              <button onClick={() => handleRenamePage(page.id!, renameValue)}
                                className="text-xs text-rental-blue-600 hover:text-rental-blue-800 font-semibold px-1">Save</button>
                              <button onClick={() => setRenamingPageId(null)}
                                className="text-xs text-gray-500 hover:text-gray-700 px-1">Cancel</button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                                {isActive && <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-rental-blue-100 text-rental-blue-700">Current</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-gray-500 capitalize">{page.page_type || 'profile'}</p>
                                {updatedAt && <><span className="text-gray-300">·</span><p className="text-xs text-gray-400">{updatedAt}</p></>}
                                {page.is_published && (page.page_url || page.page_slug) && (
                                  <>
                                    <span className="text-gray-300">·</span>
                                    <a href={page.page_url || buildPageUrl(page.page_slug!)} target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-rental-blue-500 hover:text-rental-blue-700 truncate max-w-36" onClick={(e) => e.stopPropagation()}>
                                      ↗ View live
                                    </a>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        {renamingPageId !== page.id && (
                          <div className="flex items-center gap-1 shrink-0">
                            {deletingPageId === page.id ? (
                              <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                                <span className="text-xs text-red-600 font-medium">Delete?</span>
                                <button onClick={() => handleDeletePage(page.id!)} className="text-xs text-red-700 font-bold hover:text-red-900 px-1">Yes</button>
                                <button onClick={() => setDeletingPageId(null)} className="text-xs text-gray-500 hover:text-gray-700 px-1">No</button>
                              </div>
                            ) : (
                              <>
                                {/* Publish / Unpublish toggle */}
                                <button
                                  onClick={() => handleTogglePublishPage(page)}
                                  disabled={isTogglingPublish}
                                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                                    page.is_published
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                                  } ${isTogglingPublish ? 'opacity-50' : ''}`}
                                  title={page.is_published ? 'Unpublish this page' : 'Publish this page'}>
                                  {isTogglingPublish ? '…' : page.is_published ? '✓ Live' : 'Publish'}
                                </button>
                                {/* Open */}
                                <button onClick={() => handleLoadPage(page)}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                    isActive ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-rental-blue-600 text-white hover:bg-rental-blue-700'
                                  }`}
                                  disabled={isActive}>
                                  {isActive ? 'Loaded' : 'Open'}
                                </button>
                                {/* More actions */}
                                <button onClick={() => handleDuplicatePage(page)}
                                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Duplicate">
                                  <span className="text-xs">⧉</span>
                                </button>
                                <button onClick={() => { setRenamingPageId(page.id!); setRenameValue(name) }}
                                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Rename">
                                  <span className="text-xs">✏️</span>
                                </button>
                                <button onClick={() => setDeletingPageId(page.id!)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                  <span className="text-xs">🗑️</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
              <p className="text-xs text-gray-400">{savedPages.length} page{savedPages.length !== 1 ? 's' : ''} · {savedPages.filter(p => p.is_published).length} published</p>
              <button onClick={() => loadAllPages()} className="text-xs text-rental-blue-600 hover:text-rental-blue-800 font-medium transition-colors">
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Template Modal ── */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Choose a Template</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pick a starting point for your page — you can customize everything after.</p>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-900 text-lg leading-none p-1">✕</button>
            </div>

            {/* Category filters */}
            <div className="flex items-center gap-1.5 px-6 py-3 border-b border-gray-100 shrink-0">
              <button onClick={() => setTemplateCategory('all')}
                className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${templateCategory === 'all' ? 'border-rental-blue-500 bg-rental-blue-50 text-rental-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'}`}>
                All
              </button>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setTemplateCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${templateCategory === cat.id ? 'border-rental-blue-500 bg-rental-blue-50 text-rental-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'}`}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Template grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                {PAGE_TEMPLATES
                  .filter(t => templateCategory === 'all' || t.category === templateCategory)
                  .map((template) => (
                  <button key={template.id}
                    onClick={() => {
                      const newSections = template.buildSections()
                      update(() => newSections)
                      setSelected(null)
                      setShowTemplateModal(false)
                      showToast(`Applied "${template.name}" template`, 'success')
                    }}
                    className="text-left p-4 rounded-xl border border-gray-200 hover:border-rental-blue-500 hover:shadow-lg bg-white transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl leading-none">{template.thumbnail}</span>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-rental-blue-700 transition-colors">{template.name}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{template.description}</p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600 capitalize">{template.category}</span>
                    </div>
                  </button>
                ))}
              </div>
              {sections.length > 0 && (
                <p className="text-[11px] text-gray-400 text-center mt-4">Applying a template will replace your current page sections</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Publish Modal ── */}
      {showPublishModal && (
        <PublishModal
          isPublished={isPublished}
          pageUrl={pageUrl}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onCopy={handleCopyUrl}
          onClose={() => setShowPublishModal(false)}
        />
      )}

      {/* ── Toast ── */}
      {ToastEl}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}

