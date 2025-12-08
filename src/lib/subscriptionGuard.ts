import { Company } from '@/types'
import { hasActiveSubscription, isPaymentCurrent } from './subscriptionUtils'

/**
 * Subscription benefits and limits
 */
export const SUBSCRIPTION_BENEFITS = {
  free: {
    maxJobPostings: 0, // Free tier cannot post jobs
    maxCandidatesPerJob: 0,
    canUseATS: false,
    canUseAI: false,
    canViewAnalytics: false,
    canContactCandidates: false,
  },
  subscribed: {
    maxJobPostings: -1, // -1 means unlimited
    maxCandidatesPerJob: 100,
    canUseATS: true,
    canUseAI: true,
    canViewAnalytics: true,
    canContactCandidates: true,
  }
}

/**
 * Check if company can create job postings
 */
export function canCreateJobPosting(company: Company): { allowed: boolean; reason?: string } {
  if (!hasActiveSubscription(company)) {
    return {
      allowed: false,
      reason: 'Necesitas una suscripción activa para publicar empleos. Por favor suscríbete para continuar.'
    }
  }

  // Additional check for payment status
  if (!isPaymentCurrent(company)) {
    return {
      allowed: false,
      reason: 'Tu pago mensual está vencido. Por favor actualiza tu método de pago para continuar.'
    }
  }

  return { allowed: true }
}

/**
 * Check if company can use ATS features
 */
export function canUseATS(company: Company): { allowed: boolean; reason?: string } {
  if (!hasActiveSubscription(company)) {
    return {
      allowed: false,
      reason: 'El sistema ATS requiere una suscripción activa.'
    }
  }
  return { allowed: true }
}

/**
 * Check if company can use AI features
 */
export function canUseAI(company: Company): { allowed: boolean; reason?: string } {
  if (!hasActiveSubscription(company)) {
    return {
      allowed: false,
      reason: 'Las funciones de IA requieren una suscripción activa.'
    }
  }

  const credits = company.credits || 0
  if (credits <= 0) {
    return {
      allowed: false,
      reason: 'No tienes créditos de IA disponibles. Los créditos se renuevan mensualmente con tu suscripción.'
    }
  }

  return { allowed: true }
}

/**
 * Check if company can contact candidates
 */
export function canContactCandidates(company: Company): { allowed: boolean; reason?: string } {
  if (!hasActiveSubscription(company)) {
    return {
      allowed: false,
      reason: 'Necesitas una suscripción activa para contactar candidatos.'
    }
  }
  return { allowed: true }
}

/**
 * Check if company can view analytics
 */
export function canViewAnalytics(company: Company): { allowed: boolean; reason?: string } {
  if (!hasActiveSubscription(company)) {
    return {
      allowed: false,
      reason: 'Las analíticas requieren una suscripción activa.'
    }
  }
  return { allowed: true }
}

/**
 * Get subscription upgrade message
 */
export function getUpgradeMessage(): string {
  return 'Actualiza tu suscripción para desbloquear todas las funciones.'
}

