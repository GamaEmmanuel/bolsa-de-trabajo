import { useState } from 'react'
import { useAuth } from './authContext'

interface CheckoutSessionData {
  companyId: string
  userId: string
  email: string
  companyName: string
  customerId?: string
  jobPostingId: string
}

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const createCheckoutSession = async (data: CheckoutSessionData) => {
    if (!user) {
      setError('Debes iniciar sesión para realizar el pago')
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
        throw new Error(errorData.error || 'Error al crear la sesión de pago')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      }

      return url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error'
      setError(errorMessage)
      console.error('Checkout error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createCheckoutSession,
    loading,
    error,
  }
}
