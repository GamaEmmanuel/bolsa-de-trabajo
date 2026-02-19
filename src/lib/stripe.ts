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
  jobPriceId: process.env.STRIPE_PRICE_ID || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
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

// Helper function to create a one-time payment checkout session for a job posting
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata: Record<string, string>
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
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
  })
  return session
}

// Helper function to verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
