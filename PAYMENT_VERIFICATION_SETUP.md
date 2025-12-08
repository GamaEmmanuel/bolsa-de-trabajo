# Payment Verification Setup Guide

## ✅ What's Already Implemented

I've set up a complete 3-layer system to check monthly subscription payments:

### Layer 1: Real-Time Stripe Webhooks ⚡

**What:** Stripe automatically sends webhooks when payments happen
**When:** Instantly when payment succeeds/fails
**File:** `/src/app/api/stripe/webhook/route.ts`

**Events Handled:**
- ✅ `checkout.session.completed` - Initial subscription
- ✅ `invoice.paid` - **Monthly payment succeeded**
- ✅ `invoice.payment_failed` - Monthly payment failed
- ✅ `customer.subscription.updated` - Status changes
- ✅ `customer.subscription.deleted` - Subscription canceled

**What It Does:**
```typescript
// When monthly payment succeeds (Day 30, 60, 90...):
1. Receives invoice.paid webhook
2. Awards 1000 AI credits to company
3. Updates subscription.status = 'active'
4. Extends currentPeriodEnd to next month
5. Stores in both 'companies' and 'subscriptions' collections

// When monthly payment fails:
1. Receives invoice.payment_failed webhook
2. Updates subscription.status = 'past_due'
3. Customer notified by Stripe
4. Stripe automatically retries payment
```

### Layer 2: Daily Verification Cron Job 🕐

**What:** Automated daily check to sync with Stripe
**When:** Every day at 3 AM
**File:** `/src/app/api/subscriptions/verify/route.ts`

**What It Does:**
```typescript
1. Queries all subscriptions with status: active/trialing/past_due
2. For each subscription:
   - Fetches current status from Stripe API
   - Compares with Firestore data
   - Updates if status changed
   - Detects expired subscriptions
3. Logs results: {checked: X, updated: Y, errors: Z}
```

### Layer 3: Runtime Payment Verification 🔒

**What:** Checks subscription before each premium feature
**When:** Every time user tries to use a premium feature
**File:** `/src/lib/subscriptionUtils.ts`

**Functions:**
```typescript
hasActiveSubscription(company)
// Returns true only if:
// - status is 'active' or 'trialing'
// - currentPeriodEnd is in the future
// - Payment is not overdue

isPaymentCurrent(company)
// Returns true only if:
// - status is not 'past_due' or 'unpaid'
// - Billing period hasn't expired
```

## 🚀 Setup Instructions

### Step 1: Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Set URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid` ⭐ (Most important for monthly checks)
   - `invoice.payment_failed`
5. Copy "Signing secret" → Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 2: Set Up Cron Job

**Option A: Vercel Cron (Requires Pro Plan)**
- Cron config already in `vercel.json`
- Will run automatically at 3 AM daily
- View logs in Vercel Dashboard

**Option B: External Cron Service (Free)**

Use [cron-job.org](https://cron-job.org) or similar:
1. Create free account
2. Add new cron job:
   - URL: `https://your-domain.com/api/subscriptions/verify`
   - Schedule: Daily at 3 AM
   - Header: `Authorization: Bearer YOUR_CRON_SECRET`
3. Save and enable

### Step 3: Add Environment Variables

Add to your `.env.local`:
```bash
# Existing Stripe variables
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...  # Your $100 MXN price ID

# New: Cron job security
CRON_SECRET=generate-a-random-secure-key-here
```

Generate random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Create Stripe Product/Price

1. Go to Stripe Dashboard → Products
2. Create new product: "Empresa Plan - Meserea"
3. Add price: $100 MXN, Recurring monthly
4. Copy price ID (starts with `price_`)
5. Update `STRIPE_PRICE_ID` in environment variables

## 🧪 Testing the Complete Flow

### Test 1: Initial Subscription
```bash
1. Go to /company/subscription/checkout?plan=startup
2. Use test card: 4242 4242 4242 4242
3. Complete checkout
4. Verify in Firestore:
   - companies/{id}.subscription.status = 'active'
   - subscriptions/{sub_id} document created
   - companies/{id}.credits = 1000
```

### Test 2: Monthly Renewal (Successful)
```bash
# In Stripe Dashboard:
1. Find the test subscription
2. Click "..." → "Advance billing cycle"
3. Stripe will attempt payment
4. Verify invoice.paid webhook received
5. Check Firestore:
   - status still 'active'
   - credits increased by 1000
   - currentPeriodEnd extended by 30 days
```

### Test 3: Failed Payment
```bash
1. Update subscription card to failing test card: 4000 0000 0000 0341
2. Advance billing cycle in Stripe
3. Payment will fail
4. Verify invoice.payment_failed webhook received
5. Check Firestore:
   - status changed to 'past_due'
   - Stripe will retry automatically over next 7 days
```

### Test 4: Cron Verification
```bash
# Trigger manually
curl -X GET http://localhost:3000/api/subscriptions/verify \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "timestamp": "2024-12-05T...",
  "results": {
    "checked": 5,
    "updated": 0,
    "errors": 0,
    "expired": 0
  }
}
```

## 📊 How to Monitor in Production

### Daily Checks
1. **Vercel Dashboard** → Cron Logs (if using Vercel Cron)
2. **Stripe Dashboard** → Events → Filter by failed payments
3. **Firestore Console** → subscriptions collection → Check statuses

### Set Up Alerts
```javascript
// Add to webhook handler to send notifications
if (event.type === 'invoice.payment_failed') {
  // Send email/SMS to admin
  await sendAdminAlert(`Payment failed for company: ${companyId}`)
}
```

### Monthly Revenue Tracking
```javascript
// Query all active subscriptions
db.collection('subscriptions')
  .where('status', '==', 'active')
  .get()
  .then(snapshot => {
    const monthlyRevenue = snapshot.size * 100 // MXN
    console.log(`Monthly Recurring Revenue: $${monthlyRevenue} MXN`)
  })
```

## 🎯 Key Takeaways

1. **Stripe handles the charging** - Automatically bills customers every month
2. **Webhooks update Firestore** - Real-time sync when payments succeed/fail
3. **Cron job provides backup** - Daily check catches any missed updates
4. **Runtime checks enforce access** - Verify subscription before premium features
5. **Grace period exists** - 7 days for failed payments before cancellation

**You're all set!** The system automatically:
- Charges customers monthly ✅
- Stores payment data in Firestore ✅
- Awards credits ✅
- Blocks access if payment fails ✅
- Syncs status daily ✅

No manual intervention needed - it's fully automated! 🎉

