import { NextResponse } from 'next/server'

export async function GET() {
  const config = {
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripePriceId: !!process.env.STRIPE_PRICE_ID,
    stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
  }

  const allConfigured = config.stripeSecretKey &&
                        config.stripePublishableKey &&
                        config.stripePriceId

  return NextResponse.json({
    configured: allConfigured,
    details: config,
    message: allConfigured
      ? 'Stripe is properly configured!'
      : 'Missing required Stripe environment variables. Check .env.local file.'
  })
}

