function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Property attribute labels - when most items match these, treat as single-property details (compact) */
const PROPERTY_LABELS = new Set([
  'location', 'price', 'type', 'bedrooms', 'bathrooms', 'amenities', 'furnishing',
  'area', 'parking', 'description', 'size', 'features', 'available', 'status',
])

function isPropertyDetailsList(items: string[]): boolean {
  if (items.length < 3) return false
  let labelValueCount = 0
  for (const item of items) {
    const colonIdx = item.indexOf(':')
    if (colonIdx > 0 && colonIdx < item.length - 1) {
      const label = item.slice(0, colonIdx).trim().toLowerCase()
      if (PROPERTY_LABELS.has(label)) labelValueCount++
    }
  }
  return labelValueCount >= 2
}

/**
 * Format AI chat message for display: paragraphs, bold, asterisk bullets, numbered lists.
 * Property-specific details get a compact card layout; other lists keep the bullet style.
 */
export function formatAIMessage(text: string): string {
  if (!text) return ''

  let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  const blocks = formatted.split(/\n\s*\n/).filter((p) => p.trim())

  return blocks
    .map((block) => {
      const trimmed = block.trim()
      const asteriskParts = trimmed.split(/\s*\*\s+/).map((s) => s.trim()).filter(Boolean)
      const hasAsteriskBullets = asteriskParts.length >= 2 || (asteriskParts.length === 1 && /^\s*\*/.test(trimmed))

      if (hasAsteriskBullets && asteriskParts.length >= 1) {
        const possibleIntro = asteriskParts[0]
        const looksLikeIntro =
          possibleIntro.length < 80 &&
          !possibleIntro.includes('₱') &&
          !possibleIntro.includes('(') &&
          (possibleIntro.endsWith(':') || possibleIntro.toLowerCase().includes('here') || possibleIntro.toLowerCase().includes('they are'))

        let introHtml = ''
        let items: string[] = asteriskParts

        if (looksLikeIntro && asteriskParts.length > 1) {
          introHtml = `<p class="ai-message-p">${possibleIntro}</p>`
          items = asteriskParts.slice(1)
        }

        if (items.length === 0) {
          return `<p class="ai-message-p">${trimmed}</p>`
        }

        /* Property-specific details: compact card layout */
        if (isPropertyDetailsList(items)) {
          const [titleItem, ...attrItems] = items
          const title = escapeHtml(titleItem.replace(/\n/g, ' '))
          const rows = attrItems.map((item) => {
            const colonIdx = item.indexOf(':')
            if (colonIdx > 0 && colonIdx < item.length - 1) {
              const label = escapeHtml(item.slice(0, colonIdx).trim())
              const value = escapeHtml(item.slice(colonIdx + 1).trim().replace(/\n/g, ' '))
              return `<div class="ai-property-detail-row"><span class="ai-property-label">${label}:</span> <span class="ai-property-value">${value}</span></div>`
            }
            return `<div class="ai-property-detail-row">${escapeHtml(item.replace(/\n/g, ' '))}</div>`
          }).join('')
          return `${introHtml}<div class="ai-message-property-details"><div class="ai-property-title">${title}</div><div class="ai-property-rows">${rows}</div></div>`
        }

        /* General enumeration: bullet list */
        const listHtml = items
          .map((item) => `<div class="ai-message-enum-item">${item.replace(/\n/g, ' ')}</div>`)
          .join('')
        return `${introHtml}<div class="ai-message-enum-list">${listHtml}</div>`
      }

      const lines = trimmed.split(/\n/).map((l) => l.trim()).filter(Boolean)
      const numberedLines = lines.filter((line) => /^\d+\.\s/.test(line))

      if (numberedLines.length >= 2 || (numberedLines.length === 1 && lines.length === 1)) {
        const listItems: string[] = []
        let currentItem = ''

        for (const line of lines) {
          if (/^\d+\.\s/.test(line)) {
            if (currentItem) listItems.push(currentItem)
            currentItem = line.replace(/^\d+\.\s/, '')
          } else if (currentItem) {
            currentItem += ' ' + line
          } else if (listItems.length === 0) {
            return `<p class="ai-message-p">${trimmed}</p>`
          }
        }
        if (currentItem) listItems.push(currentItem)
        if (listItems.length > 0) {
          return `<ul class="ai-message-list">${listItems.map((item) => `<li>${item.trim()}</li>`).join('')}</ul>`
        }
      }

      return `<p class="ai-message-p">${trimmed.replace(/\n/g, ' ')}</p>`
    })
    .join('')
}
