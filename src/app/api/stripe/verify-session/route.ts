import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      )
    }

    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', paymentStatus: session.payment_status },
        { status: 400 }
      )
    }

    const jobPostingId = session.metadata?.jobPostingId
    const companyId = session.metadata?.companyId
    const paymentIntentId = session.payment_intent as string

    if (!jobPostingId) {
      return NextResponse.json(
        { error: 'No jobPostingId in session metadata' },
        { status: 400 }
      )
    }

    const jobRef = adminDb.collection('jobPostings').doc(jobPostingId)
    const jobDoc = await jobRef.get()

    if (!jobDoc.exists) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      )
    }

    const jobData = jobDoc.data()

    if (jobData?.status === 'published' && jobData?.paymentStatus === 'paid') {
      return NextResponse.json({ status: 'already_published', jobPostingId })
    }

    await jobRef.update({
      status: 'published',
      paymentStatus: 'paid',
      stripePaymentIntentId: paymentIntentId || null,
      stripeCheckoutSessionId: session.id,
      paidAt: FieldValue.serverTimestamp(),
      postedDate: new Date().toISOString().split('T')[0],
    })

    if (companyId && session.customer) {
      const companyRef = adminDb.collection('companies').doc(companyId)
      await companyRef.set({
        stripeCustomerId: session.customer as string,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    }

    return NextResponse.json({ status: 'published', jobPostingId })
  } catch (error: any) {
    console.error('Error verifying session:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to verify session' },
      { status: 500 }
    )
  }
}
