import { NextRequest, NextResponse } from 'next/server'
import { stripe, createStripeCustomer, createCheckoutSession, STRIPE_CONFIG } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured')
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    if (!stripe) {
      console.error('Stripe failed to initialize')
      return NextResponse.json(
        { error: 'Stripe initialization failed' },
        { status: 500 }
      )
    }

    const { companyId, userId, email, companyName, customerId: existingCustomerId } = await req.json()

    // Validate required fields
    if (!companyId || !userId || !email || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use existing customer ID or create a new one
    let customerId = existingCustomerId

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await createStripeCustomer(email, companyName, companyId)
      customerId = customer.id
    }

    // Build URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/company/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/company/subscription/checkout?payment=canceled&plan=startup`

    // Create checkout session
    const session = await createCheckoutSession(
      customerId,
      STRIPE_CONFIG.priceId,
      successUrl,
      cancelUrl,
      {
        companyId,
        userId,
      }
    )

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)

    // Return detailed error message
    const errorMessage = error?.message || 'Failed to create checkout session'
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

