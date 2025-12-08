# Subscription System Documentation

## Overview

The subscription system is now fully integrated with Firestore and Stripe. When a company subscribes:
1. Payment data is stored in **two** collections:
   - `companies/{companyId}` - embedded subscription object
   - `subscriptions/{stripeSubscriptionId}` - dedicated subscription document

2. Subscription status is checked before granting access to premium features

## Collections Structure

### `subscriptions` Collection
```typescript
{
  companyId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid',
  planId: 'startup',
  planName: 'Empresa',
  amount: 10000, // $100 MXN in centavos
  currency: 'mxn',
  currentPeriodStart: Timestamp,
  currentPeriodEnd: Timestamp,
  cancelAtPeriodEnd: boolean,
  canceledAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `companies` Collection (subscription object)
```typescript
{
  companyId: string,
  companyName: string,
  subscription: {
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
    status: SubscriptionStatus,
    currentPeriodStart: Timestamp,
    currentPeriodEnd: Timestamp,
    cancelAtPeriodEnd: boolean,
    createdAt: Timestamp,
    updatedAt: Timestamp
  },
  credits: number // AI credits
}
```

## How It Works

### 1. Payment Flow
- User clicks "Suscribirse Ahora" → redirects to Stripe Checkout
- Upon successful payment, Stripe sends webhook to `/api/stripe/webhook`
- Webhook handler stores data in **both** collections
- Company gets 1000 AI credits added

### 2. Subscription Checking

Use the utility functions from `/src/lib/subscriptionGuard.ts`:

```typescript
import { canCreateJobPosting, canUseAI, canContactCandidates } from '@/lib/subscriptionGuard'

// Check if company can create job postings
const { allowed, reason } = canCreateJobPosting(company)
if (!allowed) {
  alert(reason) // Shows user-friendly message
  return
}

// Check if company can use AI features
const canAI = canUseAI(company)
if (!canAI.allowed) {
  alert(canAI.reason)
  return
}
```

### 3. Benefits Based on Subscription

**Free (No Subscription):**
- ❌ Cannot create job postings
- ❌ Cannot use ATS
- ❌ Cannot use AI features
- ❌ Cannot contact candidates
- ❌ Cannot view analytics

**Subscribed ($100 MXN/month):**
- ✅ Unlimited job postings
- ✅ Full ATS access
- ✅ 1000 AI credits/month
- ✅ Contact candidates
- ✅ View analytics
- ✅ Up to 100 candidates per job

## Implementation Examples

### Protecting a Feature
```typescript
'use client'

import { canUseATS } from '@/lib/subscriptionGuard'
import { useCompany } from '@/hooks/useCompany'

export default function ATSPage() {
  const { company, loading } = useCompany()

  if (loading) return <LoadingState />

  const { allowed, reason } = canUseATS(company)

  if (!allowed) {
    return (
      <SubscriptionRequired
        message={reason}
        ctaLink="/company/subscription/checkout?plan=startup"
      />
    )
  }

  return <ATSContent />
}
```

### Checking Before Action
```typescript
const handleContactCandidate = () => {
  const { allowed, reason } = canContactCandidates(company)

  if (!allowed) {
    alert(reason)
    router.push('/company/subscription/checkout?plan=startup')
    return
  }

  // Proceed with contacting candidate
  openMessageDialog()
}
```

## Stripe Webhooks

The app handles these webhook events:
- `checkout.session.completed` - Initial subscription creation
- `customer.subscription.updated` - Subscription changes (renewal, plan change)
- `customer.subscription.deleted` - Subscription cancellation
- `invoice.paid` - Recurring payment success (awards credits)
- `invoice.payment_failed` - Payment failure (marks subscription as past_due)

## Testing

### Test in Development
1. Use Stripe test mode keys
2. Create test subscription at http://localhost:3000/company/subscription/checkout?plan=startup
3. Use test card: `4242 4242 4242 4242`
4. Check Firestore to verify data was stored
5. Try creating a job posting - should work with active subscription

### Test Subscription States
```bash
# Use Stripe CLI to trigger webhooks
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

## Price Configuration

Current price: **$100 MXN/month**

To change the price, update these files:
1. `/src/components/PricingSection.tsx` - Display price
2. `/src/components/FullPricingSection.tsx` - Display price
3. `/src/app/company/subscription/checkout/page.tsx` - Checkout price
4. Stripe Dashboard - Create new price and update `STRIPE_PRICE_ID` env var

## Firestore Security Rules

Don't forget to add rules for the subscriptions collection:

```javascript
match /subscriptions/{subscriptionId} {
  // Only allow reading your own company's subscription
  allow read: if isSignedIn() &&
    exists(/databases/$(database)/documents/companies/$(resource.data.companyId)/users/$(request.auth.uid));
  // No client writes - only server via webhooks
  allow write: if false;
}
```

## Troubleshooting

**Subscription not updating after payment:**
- Check webhook logs in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check server logs for errors

**Benefits not working:**
- Verify subscription status is 'active' or 'trialing'
- Check company document has subscription object
- Ensure `currentPeriodEnd` is in the future

**AI credits not awarded:**
- Check `invoice.paid` webhook is being received
- Verify credits field exists in company document
- Check STRIPE_CONFIG.creditsPerMonth value

