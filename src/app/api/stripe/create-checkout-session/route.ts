import { NextRequest, NextResponse } from 'next/server'
import { stripe, createStripeCustomer, createCheckoutSession, STRIPE_CONFIG } from '@/lib/stripe'
import { RateLimiters } from '@/middleware/rateLimit'

export async function POST(req: NextRequest) {
  // Apply rate limiting - 5 requests per 5 minutes for payment operations
  const rateLimitResponse = RateLimiters.payment(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }
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

    if (!STRIPE_CONFIG.jobPriceId) {
      console.error('STRIPE_PRICE_ID is not configured')
      return NextResponse.json(
        { error: 'Stripe Price ID is not configured. Please add STRIPE_PRICE_ID to your environment variables.' },
        { status: 500 }
      )
    }

    const { companyId, userId, email, companyName, customerId: existingCustomerId, jobPostingId } = await req.json()

    // Validate required fields
    if (!companyId || !userId || !email || !companyName || !jobPostingId) {
      return NextResponse.json(
        { error: 'Missing required fields (companyId, userId, email, companyName, jobPostingId)' },
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

    // Build URLs using the request origin so Stripe redirects back to the correct host
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const baseUrl = origin.replace(/\/$/, '')
    const successUrl = `${baseUrl}/company/job-postings?paid=${jobPostingId}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/company/job-postings/new?payment=canceled`

    // Create one-time payment checkout session for this job posting
    const session = await createCheckoutSession(
      customerId,
      STRIPE_CONFIG.jobPriceId,
      successUrl,
      cancelUrl,
      {
        companyId,
        userId,
        jobPostingId,
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
