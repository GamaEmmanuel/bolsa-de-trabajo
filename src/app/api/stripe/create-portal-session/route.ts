import { NextRequest, NextResponse } from 'next/server'
import { stripe, createPortalSession } from '@/lib/stripe'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin inline if needed
function getAdminDb() {
  try {
    let adminApp
    if (getApps().length === 0) {
      // Try with service account first
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        })
      } else {
        // Fallback to project ID only (works for Firestore access)
        adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'jobportal-4b561',
        })
      }
    } else {
      adminApp = getApps()[0]
    }
    return getFirestore(adminApp)
  } catch (error) {
    console.error('Error initializing admin:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    const { companyId, customerId: providedCustomerId } = await req.json()

    // Validate required fields
    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing companyId' },
        { status: 400 }
      )
    }

    let customerId = providedCustomerId

    // If customerId wasn't provided, try to fetch it from Firestore
    if (!customerId) {
      const adminDb = getAdminDb()

      if (!adminDb) {
        console.error('Could not initialize Firebase Admin and no customerId provided')
        return NextResponse.json(
          { error: 'Unable to retrieve customer information' },
          { status: 500 }
        )
      }

      try {
        const companyDoc = await adminDb.collection('companies').doc(companyId).get()

        if (!companyDoc.exists) {
          return NextResponse.json(
            { error: 'Company not found' },
            { status: 404 }
          )
        }

        const companyData = companyDoc.data()
        customerId = companyData?.subscription?.stripeCustomerId
      } catch (firestoreError) {
        console.error('Error fetching company data:', firestoreError)
        return NextResponse.json(
          { error: 'Failed to retrieve company subscription information' },
          { status: 500 }
        )
      }
    }

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

