import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Cron job endpoint to verify all active subscriptions
 * This should be called daily to ensure subscription statuses are accurate
 *
 * Setup in Vercel:
 * - Add a Vercel Cron Job pointing to this endpoint
 * - Or use external cron service like cron-job.org
 */
export async function GET(req: NextRequest) {
  // Verify the request is from a trusted source (cron job)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin not initialized' },
      { status: 500 }
    )
  }

  try {
    console.log('[Subscription Verify] Starting verification check...')

    // Get all subscriptions from Firestore
    const subscriptionsSnapshot = await adminDb
      .collection('subscriptions')
      .where('status', 'in', ['active', 'trialing', 'past_due'])
      .get()

    const results = {
      checked: 0,
      updated: 0,
      errors: 0,
      expired: 0
    }

    // Check each subscription with Stripe
    for (const doc of subscriptionsSnapshot.docs) {
      results.checked++
      const subscriptionData = doc.data()
      const stripeSubscriptionId = subscriptionData.stripeSubscriptionId
      const companyId = subscriptionData.companyId

      try {
        // Fetch current status from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

        // Check if status has changed
        if (stripeSubscription.status !== subscriptionData.status) {
          console.log(`[Subscription Verify] Status changed for ${companyId}: ${subscriptionData.status} -> ${stripeSubscription.status}`)

          // Update in subscriptions collection
          await adminDb.collection('subscriptions').doc(stripeSubscriptionId).update({
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            updatedAt: FieldValue.serverTimestamp()
          })

          // Update in company document
          await adminDb.collection('companies').doc(companyId).update({
            'subscription.status': stripeSubscription.status,
            'subscription.currentPeriodStart': new Date(stripeSubscription.current_period_start * 1000),
            'subscription.currentPeriodEnd': new Date(stripeSubscription.current_period_end * 1000),
            'subscription.cancelAtPeriodEnd': stripeSubscription.cancel_at_period_end,
            'subscription.updatedAt': FieldValue.serverTimestamp()
          })

          results.updated++
        }

        // Check if subscription has expired but still marked as active
        const periodEnd = new Date(stripeSubscription.current_period_end * 1000)
        const now = new Date()

        if (periodEnd < now && stripeSubscription.status === 'active') {
          console.log(`[Subscription Verify] Expired subscription found: ${companyId}`)
          results.expired++
        }

      } catch (error) {
        console.error(`[Subscription Verify] Error checking subscription for company ${companyId}:`, error)
        results.errors++
      }
    }

    console.log('[Subscription Verify] Check completed:', results)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error) {
    console.error('[Subscription Verify] Fatal error:', error)
    return NextResponse.json(
      { error: 'Verification failed', details: error },
      { status: 500 }
    )
  }
}

