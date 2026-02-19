import { NextRequest, NextResponse } from 'next/server'

// Portal sessions are no longer needed - subscription model has been deprecated.
// All payments are now handled as one-time per-job payments via /api/stripe/create-checkout-session.
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Subscription management is no longer available. Payments are per job posting.' },
    { status: 410 }
  )
}

