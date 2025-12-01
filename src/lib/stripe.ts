import Stripe from 'stripe'

// Initialize Stripe with the secret key (with fallback for build time)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  : null as any // Will be checked at runtime

// Stripe configuration constants
export const STRIPE_CONFIG = {
  priceId: process.env.STRIPE_PRICE_ID || 'price_1SYxb1DUi8OxbbECX57Ob6rJ',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  creditsPerMonth: 1000, // AI credits awarded per successful payment
}

// Helper function to create a Stripe customer
export async function createStripeCustomer(email: string, name: string, companyId: string) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      companyId,
    },
  })
  return customer
}

// Helper function to create a checkout session
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata: Record<string, string>
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
  })
  return session
}

// Helper function to create a customer portal session
export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session
}

// Helper function to retrieve a subscription
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

// Helper function to cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId)
}

// Helper function to verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

