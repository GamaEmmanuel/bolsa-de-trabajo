import { useState } from 'react'
import { useAuth } from './authContext'

interface CheckoutSessionData {
  companyId: string
  userId: string
  email: string
  companyName: string
  customerId?: string
}

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const createCheckoutSession = async (data: CheckoutSessionData) => {
    if (!user) {
      setError('You must be logged in to subscribe')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      }

      return url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Checkout error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const createPortalSession = async (companyId: string) => {
    if (!user) {
      setError('You must be logged in to manage subscription')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create portal session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Customer Portal
      if (url) {
        window.location.href = url
      }

      return url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Portal error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createCheckoutSession,
    createPortalSession,
    loading,
    error,
  }
}

