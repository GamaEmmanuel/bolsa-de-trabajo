import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { adminDb, isAdminInitialized } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

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

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
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

// Handle checkout session completed
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  if (!adminDb) {
    console.error('Firebase Admin not initialized')
    return
  }

  const companyId = session.metadata?.companyId
  const customerId = session.customer as string

  if (!companyId) {
    console.error('No companyId in session metadata')
    return
  }

  console.log('Checkout completed for company:', companyId)

  // Get the subscription
  const subscriptionId = session.subscription as string
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Update company document
  const companyRef = adminDb.collection('companies').doc(companyId)
  await companyRef.set({
    subscription: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    credits: FieldValue.increment(STRIPE_CONFIG.creditsPerMonth),
  }, { merge: true })

  console.log('Company subscription created:', companyId)
}

// Handle subscription update
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  if (!adminDb) {
    console.error('Firebase Admin not initialized')
    return
  }

  const companyId = subscription.metadata?.companyId

  if (!companyId) {
    console.error('No companyId in subscription metadata')
    return
  }

  console.log('Subscription updated for company:', companyId)

  const companyRef = adminDb.collection('companies').doc(companyId)
  await companyRef.set({
    subscription: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: FieldValue.serverTimestamp(),
    },
  }, { merge: true })

  console.log('Company subscription updated:', companyId)
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!adminDb) {
    console.error('Firebase Admin not initialized')
    return
  }

  const companyId = subscription.metadata?.companyId

  if (!companyId) {
    console.error('No companyId in subscription metadata')
    return
  }

  console.log('Subscription deleted for company:', companyId)

  const companyRef = adminDb.collection('companies').doc(companyId)
  await companyRef.set({
    subscription: {
      status: 'canceled',
      cancelAtPeriodEnd: false,
      updatedAt: FieldValue.serverTimestamp(),
    },
  }, { merge: true })

  console.log('Company subscription canceled:', companyId)
}

// Handle invoice paid (recurring payments)
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!adminDb) {
    console.error('Firebase Admin not initialized')
    return
  }

  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    console.log('Invoice not related to subscription')
    return
  }

  // Get subscription to get company ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const companyId = subscription.metadata?.companyId

  if (!companyId) {
    console.error('No companyId in subscription metadata')
    return
  }

  console.log('Invoice paid for company:', companyId)

  // Award monthly credits
  const companyRef = adminDb.collection('companies').doc(companyId)
  await companyRef.set({
    subscription: {
      status: 'active',
      updatedAt: FieldValue.serverTimestamp(),
    },
    credits: FieldValue.increment(STRIPE_CONFIG.creditsPerMonth),
  }, { merge: true })

  console.log('Credits awarded to company:', companyId, STRIPE_CONFIG.creditsPerMonth)
}

// Handle invoice payment failed
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!adminDb) {
    console.error('Firebase Admin not initialized')
    return
  }

  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    console.log('Invoice not related to subscription')
    return
  }

  // Get subscription to get company ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const companyId = subscription.metadata?.companyId

  if (!companyId) {
    console.error('No companyId in subscription metadata')
    return
  }

  console.log('Invoice payment failed for company:', companyId)

  // Update subscription status
  const companyRef = adminDb.collection('companies').doc(companyId)
  await companyRef.set({
    subscription: {
      status: 'past_due',
      updatedAt: FieldValue.serverTimestamp(),
    },
  }, { merge: true })

  console.log('Company subscription marked as past_due:', companyId)

  // TODO: Send email notification to company admin
}

