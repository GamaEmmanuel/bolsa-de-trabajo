# Monthly Payment Flow Documentation

## How Monthly Subscription Payments Work

### 🔄 Automatic Payment Flow (Handled by Stripe)

Stripe automatically manages recurring payments. Here's what happens each month:

#### Day 0 - Initial Subscription
1. User subscribes via Stripe Checkout
2. `checkout.session.completed` webhook fires
3. System stores subscription in Firestore
4. Status: `active`, credits awarded: 1000

#### Day 30 - First Renewal Attempt
1. **Stripe automatically attempts to charge** the customer's card
2. Two possible outcomes:

   **✅ Payment Succeeds:**
   - `invoice.paid` webhook fires
   - System awards 1000 AI credits
   - Status remains: `active`
   - `currentPeriodEnd` extended to Day 60

   **❌ Payment Fails:**
   - `invoice.payment_failed` webhook fires
   - Status changes to: `past_due`
   - Customer receives email from Stripe
   - Stripe retries payment automatically (up to 4 attempts)

#### Days 31-37 - Retry Period (if payment failed)
- Stripe automatically retries payment every few days
- If any retry succeeds: `invoice.paid` fires, subscription reactivated
- If all retries fail: `customer.subscription.deleted` fires
- Status changes to: `canceled`

## 🛡️ Our Payment Verification System

We have **3 layers** of payment verification:

### Layer 1: Real-Time Webhook Updates
**File:** `/src/app/api/stripe/webhook/route.ts`

Stripe sends webhooks for every payment event:
```typescript
// Events we handle:
- checkout.session.completed    → Initial subscription
- invoice.paid                  → Successful monthly payment
- invoice.payment_failed        → Failed payment
- customer.subscription.updated → Status changes
- customer.subscription.deleted → Cancellation
```

**What we store:**
- Subscription status (`active`, `past_due`, `canceled`)
- Current billing period dates
- Payment history in both `companies` and `subscriptions` collections

### Layer 2: Automated Daily Verification
**File:** `/src/app/api/subscriptions/verify/route.ts`

Runs daily via Vercel Cron at 3 AM:
```typescript
// What it does:
1. Fetches all active subscriptions from Firestore
2. Cross-checks each with Stripe API
3. Updates any status mismatches
4. Detects expired subscriptions
5. Logs discrepancies
```

**Setup:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/subscriptions/verify",
    "schedule": "0 3 * * *"  // Daily at 3 AM
  }]
}
```

**Environment Variable Required:**
```bash
CRON_SECRET=your-secret-key-here
```

### Layer 3: Runtime Payment Check
**File:** `/src/lib/subscriptionUtils.ts`

Every time a user tries to use a premium feature:
```typescript
hasActiveSubscription(company)
// Checks:
// 1. Status is 'active' or 'trialing'
// 2. currentPeriodEnd is in the future
// 3. Not past_due or unpaid

isPaymentCurrent(company)
// Additional checks:
// 1. Status is not 'past_due' or 'unpaid'
// 2. Billing period hasn't expired
```

## 📊 Subscription Status Flow Chart

```
New User
   │
   ├─► [Subscribe] ──► Payment Success ──► status: 'active'
   │                                        credits: +1000
   │
   └─► [No Subscribe] ─► status: null ──► ❌ No premium features

Active Subscription (Day 30)
   │
   ├─► Payment Success ──► status: 'active' ──► ✅ Full access
   │                        credits: +1000        features renewed
   │
   └─► Payment Failed
        │
        ├─► status: 'past_due' ──► ⚠️ Grace period (7 days)
        │                           ⚠️ Limited access
        │                           🔄 Stripe retries
        │
        ├─► Retry Succeeds ──► status: 'active' ──► ✅ Back to normal
        │
        └─► All Retries Fail ──► status: 'canceled' ──► ❌ Access revoked
                                                         ❌ Must resubscribe
```

## 💳 Payment Failure Handling

### What Happens When Payment Fails?

**Immediate (Day 30):**
1. `invoice.payment_failed` webhook received
2. Status updated to `past_due`
3. Company can still access features (grace period)
4. System logs the failure

**Day 31-37 (Retry Period):**
- Stripe automatically retries charging the card
- Customer receives email notifications
- Features remain accessible during retries
- `isPaymentCurrent()` returns `false` - you can choose to block or allow

**Day 37 (Final Failure):**
- Subscription canceled if all retries fail
- `customer.subscription.deleted` webhook
- Status: `canceled`
- ❌ All premium features blocked

### Grace Period Configuration

You can configure grace period behavior in `subscriptionGuard.ts`:

```typescript
// Option 1: Strict - Block immediately when past_due
export function canCreateJobPosting(company: Company) {
  if (!isPaymentCurrent(company)) {
    return {
      allowed: false,
      reason: 'Pago vencido'
    }
  }
  return { allowed: true }
}

// Option 2: Lenient - Allow during past_due (Stripe handles it)
export function canCreateJobPosting(company: Company) {
  // Only block if completely canceled, not past_due
  if (company.subscription?.status === 'canceled') {
    return { allowed: false, reason: 'Suscripción cancelada' }
  }
  return { allowed: true }
}
```

## 🔧 Testing Monthly Payments

### Test Successful Payment
```bash
# Using Stripe CLI
stripe trigger invoice.payment_succeeded

# Or in Stripe Dashboard:
1. Go to Subscriptions
2. Click on test subscription
3. Click "..." menu > "Update subscription"
4. Click "Advance billing cycle" to simulate next month
```

### Test Failed Payment
```bash
# Using Stripe CLI
stripe trigger invoice.payment_failed

# Or use test card that always fails:
# Card: 4000 0000 0000 0341
```

### Test the Cron Job Manually
```bash
curl -X GET https://your-app.vercel.app/api/subscriptions/verify \
  -H "Authorization: Bearer your-cron-secret"
```

## 📈 Monitoring Subscriptions

### Check Subscription Status
```typescript
// In any component
import { hasActiveSubscription, isPaymentCurrent } from '@/lib/subscriptionUtils'

const isActive = hasActiveSubscription(company)
const isPaid = isPaymentCurrent(company)

console.log('Active:', isActive)       // true/false
console.log('Payment current:', isPaid) // true/false
console.log('Status:', company.subscription?.status) // 'active', 'past_due', etc.
```

### View in Firestore
```javascript
// Check companies collection
companies/{companyId}/subscription
{
  status: 'active',
  currentPeriodStart: Timestamp,
  currentPeriodEnd: Timestamp,  // ← Check if in future
  stripeSubscriptionId: 'sub_xxx'
}

// Check subscriptions collection
subscriptions/{stripeSubscriptionId}
{
  companyId: 'company_xxx',
  status: 'active',
  amount: 10000,  // $100 MXN
  currentPeriodEnd: Timestamp
}
```

### View in Stripe Dashboard
1. Go to Stripe Dashboard → Subscriptions
2. Find subscription by customer email or company ID
3. View payment history, upcoming invoice, retry schedule

## 🚨 Common Issues & Solutions

### Issue: Webhook not received
**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Stripe Dashboard → Webhooks → Check endpoint health
- Ensure webhook URL is publicly accessible

### Issue: Subscription shows active but user can't access features
**Solution:**
```typescript
// Check all conditions:
1. subscription.status === 'active' ✓
2. subscription.currentPeriodEnd > now ✓
3. Webhook received and Firestore updated ✓

// If status is stale, run manual sync:
curl -X GET /api/subscriptions/verify -H "Authorization: Bearer CRON_SECRET"
```

### Issue: Payment succeeded but credits not awarded
**Solution:**
- Check `invoice.paid` webhook logs
- Verify `STRIPE_CONFIG.creditsPerMonth` value
- Manually award credits:
```javascript
// In Firebase Console
companies/{companyId}.credits += 1000
```

## 📝 Summary

**Monthly payments are handled automatically by:**

1. ✅ **Stripe** - Charges card every month, sends webhooks
2. ✅ **Webhooks** - Update Firestore in real-time with payment results
3. ✅ **Cron Job** - Daily verification at 3 AM to catch any issues
4. ✅ **Runtime Checks** - Verify subscription before each premium feature use

**You don't need to manually check payments** - the system handles it automatically. Just ensure:
- Webhook endpoint is configured in Stripe
- `STRIPE_WEBHOOK_SECRET` is set
- Vercel Cron is enabled (Enterprise plan) or use external cron service
- `CRON_SECRET` environment variable is set

The system will automatically:
- Award credits each month
- Block access if payment fails
- Handle retries and cancellations
- Keep Firestore in sync with Stripe

