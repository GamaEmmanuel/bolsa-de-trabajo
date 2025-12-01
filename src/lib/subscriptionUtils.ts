import { Company, SubscriptionStatus } from '@/types'

/**
 * Check if a company has an active subscription
 */
export function hasActiveSubscription(company: Company): boolean {
  const status = company.subscription?.status
  return status === 'active' || status === 'trialing'
}

/**
 * Check if subscription is past due
 */
export function isSubscriptionPastDue(company: Company): boolean {
  return company.subscription?.status === 'past_due'
}

/**
 * Check if subscription is canceled or expired
 */
export function isSubscriptionCanceled(company: Company): boolean {
  const status = company.subscription?.status
  return status === 'canceled' || status === 'incomplete_expired'
}

/**
 * Get a human-readable subscription status message
 */
export function getSubscriptionStatusMessage(status?: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'Activa'
    case 'trialing':
      return 'Período de prueba'
    case 'past_due':
      return 'Pago pendiente'
    case 'canceled':
      return 'Cancelada'
    case 'incomplete':
      return 'Pago incompleto'
    case 'incomplete_expired':
      return 'Expirada'
    case 'unpaid':
      return 'Sin pagar'
    default:
      return 'Sin suscripción'
  }
}

/**
 * Get color class for subscription status
 */
export function getSubscriptionStatusColor(status?: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-100'
    case 'trialing':
      return 'text-blue-600 bg-blue-100'
    case 'past_due':
      return 'text-yellow-600 bg-yellow-100'
    case 'canceled':
    case 'incomplete_expired':
    case 'unpaid':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

/**
 * Check if company has enough credits
 */
export function hasEnoughCredits(company: Company, requiredCredits: number): boolean {
  const credits = company.credits || 0
  return credits >= requiredCredits
}

/**
 * Format date from Firestore Timestamp
 */
export function formatSubscriptionDate(timestamp: any): string {
  if (!timestamp) return 'N/A'

  try {
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (err) {
    return 'N/A'
  }
}

/**
 * Check if subscription requires action (payment failed, incomplete, etc.)
 */
export function subscriptionRequiresAction(company: Company): boolean {
  const status = company.subscription?.status
  return status === 'past_due' || status === 'incomplete' || status === 'unpaid'
}

