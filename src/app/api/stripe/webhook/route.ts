import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { adminDb, isAdminInitialized } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import {
	sendPaymentSuccessfulEmail,
	getCompanyEmail
} from '@/lib/emailNotifications'

// Disable body parsing for webhook
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  console.log('Received webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle checkout session completed (one-time payment for a job posting)
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  if (!adminDb) {
    console.error('Firebase Admin not initialized')
    return
  }

  const companyId = session.metadata?.companyId
  const jobPostingId = session.metadata?.jobPostingId
  const customerId = session.customer as string
  const paymentIntentId = session.payment_intent as string

  if (!companyId) {
    console.error('No companyId in session metadata')
    return
  }

  if (!jobPostingId) {
    console.error('No jobPostingId in session metadata')
    return
  }

  console.log('Payment completed for job:', jobPostingId, 'company:', companyId)

  // Update the job posting: mark as published and paid
  const jobRef = adminDb.collection('jobPostings').doc(jobPostingId)
  await jobRef.update({
    status: 'published',
    paymentStatus: 'paid',
    stripePaymentIntentId: paymentIntentId || null,
    stripeCheckoutSessionId: session.id,
    paidAt: FieldValue.serverTimestamp(),
    postedDate: new Date().toISOString().split('T')[0],
  })

  // Store stripeCustomerId on the company doc for future payments
  if (customerId) {
    const companyRef = adminDb.collection('companies').doc(companyId)
    await companyRef.set({
      stripeCustomerId: customerId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  }

  // Store payment record in a dedicated collection
  await adminDb.collection('payments').add({
    companyId,
    jobPostingId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId || null,
    stripeCustomerId: customerId,
    amount: session.amount_total,
    currency: session.currency,
    status: 'paid',
    createdAt: FieldValue.serverTimestamp(),
  })

  console.log('Job posting published after payment:', jobPostingId)

  // Send payment confirmation email
  try {
    const companyEmail = await getCompanyEmail(companyId)
    const companyDoc = await adminDb.collection('companies').doc(companyId).get()
    const companyName = companyDoc.exists ? companyDoc.data()?.companyName || 'Empresa' : 'Empresa'
    const jobDoc = await jobRef.get()
    const jobTitle = jobDoc.exists ? jobDoc.data()?.jobTitle || 'Empleo' : 'Empleo'

    if (companyEmail) {
      const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : '10.00'
      await sendPaymentSuccessfulEmail(
        {
          companyEmail,
          companyName,
          status: 'success',
          amount,
          currency: 'MXN',
          billingPortalLink: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/company/job-postings`
            : 'http://localhost:3000/company/job-postings',
        },
        companyId
      )
    }
  } catch (emailError) {
    console.error('Error sending payment confirmation email:', emailError)
  }
}
