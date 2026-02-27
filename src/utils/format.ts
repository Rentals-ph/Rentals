/**
 * Format a number as Philippine Peso with thousands separators (commas).
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '—'
  return `₱${Number(price).toLocaleString('en-US')}`
}

/**
 * Format a number with thousands separators (no currency symbol).
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return '—'
  return Number(num).toLocaleString('en-US')
}
