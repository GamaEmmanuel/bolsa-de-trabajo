import { Company } from '@/types'

/**
 * Check if company can create job postings.
 * With pay-per-job model, all companies can create drafts freely.
 * Payment is required only when publishing.
 */
export function canCreateJobPosting(_company: Company): { allowed: boolean; reason?: string } {
  return { allowed: true }
}

/**
 * Check if company can use ATS features (always allowed)
 */
export function canUseATS(_company: Company): { allowed: boolean; reason?: string } {
  return { allowed: true }
}

/**
 * Check if company can use AI features (always allowed)
 */
export function canUseAI(_company: Company): { allowed: boolean; reason?: string } {
  return { allowed: true }
}

/**
 * Check if company can contact candidates (always allowed)
 */
export function canContactCandidates(_company: Company): { allowed: boolean; reason?: string } {
  return { allowed: true }
}

/**
 * Check if company can view analytics (always allowed)
 */
export function canViewAnalytics(_company: Company): { allowed: boolean; reason?: string } {
  return { allowed: true }
}
