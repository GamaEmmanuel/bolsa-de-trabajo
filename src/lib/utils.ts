/**
 * Format a number with commas for thousands separators
 * @param value - The number to format
 * @returns Formatted string with commas
 */
export function formatNumberWithCommas(value: number | string): string {
  if (!value && value !== 0) return ''

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return ''

  return numValue.toLocaleString('en-US')
}

/**
 * Parse a formatted number string back to a number
 * @param value - The formatted string (e.g., "1,000")
 * @returns The parsed number
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0

  // Remove commas and parse
  const cleanValue = value.replace(/,/g, '')
  const parsed = parseFloat(cleanValue)

  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format currency with proper thousands separators
 * @param value - The number to format
 * @param currency - The currency code (default: 'MXN')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string, currency: string = 'MXN'): string {
  if (!value && value !== 0) return ''

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return ''

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue)
}
