import { JobPosting } from '@/types'

/**
 * Check if a job posting has been paid for
 */
export function isJobPaid(job: JobPosting): boolean {
  return job.paymentStatus === 'paid'
}

/**
 * Check if a job posting is pending payment
 */
export function isJobPendingPayment(job: JobPosting): boolean {
  return job.status === 'draft' && (!job.paymentStatus || job.paymentStatus === 'pending')
}

/**
 * Get a human-readable payment status message
 */
export function getPaymentStatusMessage(paymentStatus?: string): string {
  switch (paymentStatus) {
    case 'paid':
      return 'Pagado'
    case 'pending':
      return 'Pendiente de pago'
    case 'failed':
      return 'Pago fallido'
    case 'refunded':
      return 'Reembolsado'
    default:
      return 'Sin pago'
  }
}

/**
 * Get color class for payment status
 */
export function getPaymentStatusColor(paymentStatus?: string): string {
  switch (paymentStatus) {
    case 'paid':
      return 'text-green-600 bg-green-100'
    case 'pending':
      return 'text-yellow-600 bg-yellow-100'
    case 'failed':
      return 'text-red-600 bg-red-100'
    case 'refunded':
      return 'text-gray-600 bg-gray-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}
