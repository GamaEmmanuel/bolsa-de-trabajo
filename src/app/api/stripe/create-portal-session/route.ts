import { NextRequest, NextResponse } from 'next/server'
import { stripe, createPortalSession } from '@/lib/stripe'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { app } from '@/lib/firebase'

const db = getFirestore(app)

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    const { companyId } = await req.json()

    // Validate required fields
    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing companyId' },
        { status: 400 }
      )
    }

    // Get company document
    const companyRef = doc(db, 'companies', companyId)
    const companyDoc = await getDoc(companyRef)

    if (!companyDoc.exists()) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const companyData = companyDoc.data()
    const customerId = companyData.subscription?.stripeCustomerId

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this company' },
        { status: 400 }
      )
    }

    // Build return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/company/settings`

    // Create portal session
    const session = await createPortalSession(customerId, returnUrl)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating portal session:', error)

    const errorMessage = error?.message || 'Failed to create portal session'
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

