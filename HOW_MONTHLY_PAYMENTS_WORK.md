# How Monthly Payment Checking Works - Simple Explanation

## 🎯 The Short Answer

**Stripe handles everything automatically.** You don't need to manually check if customers paid each month.

Here's what happens:

## 📅 Monthly Payment Timeline

### Day 1 (Initial Subscription)
```
Customer subscribes → Pays $100 MXN
                   ↓
           Stripe sends webhook
                   ↓
      Your system stores in Firestore:
      ✅ subscription.status = 'active'
      ✅ subscription.currentPeriodEnd = Day 31
      ✅ credits = 1000
```

### Day 31 (First Monthly Payment)
```
Stripe AUTOMATICALLY charges card → $100 MXN
                ↓
        Payment Succeeds?
                ↓
    ┌───────────┴───────────┐
    ↓                       ↓
   YES                     NO
    ↓                       ↓
invoice.paid          invoice.payment_failed
    ↓                       ↓
Your webhook              Your webhook
receives it              receives it
    ↓                       ↓
Updates Firestore:       Updates Firestore:
✅ status = 'active'      ⚠️ status = 'past_due'
✅ +1000 credits          ⚠️ No credits
✅ periodEnd = Day 61     ⚠️ Customer notified
    ↓                       ↓
Customer keeps           Stripe retries
access                   for 7 days
```

### If Payment Fails - Automatic Retry
```
Day 31: Payment fails → status: 'past_due'
                     ↓
Day 33: Stripe retries automatically
Day 35: Stripe retries again
Day 37: Stripe final retry
                     ↓
           ┌─────────┴─────────┐
           ↓                   ↓
    Payment Succeeds      All Retries Fail
           ↓                   ↓
    Status: 'active'      Status: 'canceled'
    ✅ Access restored     ❌ Access blocked
```

## 🔐 How We Check Payment Status

### Method 1: Real-Time (Webhooks)
**When:** Instantly when Stripe processes payment
**How:** Stripe sends webhook to your server
**Where:** `/src/app/api/stripe/webhook/route.ts`

```
Stripe charges card
      ↓
Sends webhook to your server
      ↓
Updates Firestore immediately
      ↓
User's subscription status updated in real-time
```

### Method 2: Daily Verification (Cron Job)
**When:** Every day at 3 AM
**How:** Your server queries Stripe API
**Where:** `/src/app/api/subscriptions/verify/route.ts`

```
Every day at 3 AM:
      ↓
Fetch all active subscriptions from Firestore
      ↓
For each subscription, ask Stripe: "What's the real status?"
      ↓
If status different → Update Firestore
      ↓
Catches any missed webhooks or sync issues
```

### Method 3: Runtime Check (Every Feature Use)
**When:** Every time user tries to use a premium feature
**How:** Check Firestore subscription data
**Where:** `/src/lib/subscriptionUtils.ts`

```
User clicks "Create Job Posting"
      ↓
Check: hasActiveSubscription(company)?
      ↓
Check: subscription.status === 'active'?
Check: subscription.currentPeriodEnd > today?
Check: Payment not past_due?
      ↓
If all checks pass → ✅ Allow
If any check fails → ❌ Block + Show upgrade prompt
```

## 💡 Key Points

### You DON'T Need To:
- ❌ Manually charge customers each month (Stripe does it)
- ❌ Write code to check if payment date arrived (Stripe tracks it)
- ❌ Send payment reminders (Stripe does it)
- ❌ Manually update subscription status (Webhooks do it)

### The System AUTOMATICALLY:
- ✅ Charges customers on their billing date
- ✅ Updates Firestore when payment succeeds/fails
- ✅ Awards 1000 credits each month
- ✅ Handles failed payments and retries
- ✅ Cancels subscription if all retries fail
- ✅ Blocks access immediately if payment fails (optional)
- ✅ Verifies all subscriptions daily to catch issues

## 📊 Where Payment Data is Stored

### Firestore (Your Database)
```javascript
// subscriptions/{subscriptionId}
{
  companyId: "company_123",
  status: "active",
  amount: 10000,  // $100 MXN in centavos
  currentPeriodEnd: Timestamp("2025-01-05"),  // ← Check this!
  updatedAt: Timestamp("2024-12-05")
}

// companies/{companyId}
{
  companyName: "Restaurant ABC",
  subscription: {
    status: "active",
    currentPeriodEnd: Timestamp("2025-01-05")  // ← And this!
  },
  credits: 1000  // ← Awarded each successful payment
}
```

### How to Check if Payment is Current

**Option 1: Check status**
```typescript
if (company.subscription.status === 'active') {
  // Payment is current ✅
}
```

**Option 2: Check period end date**
```typescript
const periodEnd = company.subscription.currentPeriodEnd
if (periodEnd > new Date()) {
  // Payment is current ✅
}
```

**Option 3: Use our utility (Recommended)**
```typescript
import { hasActiveSubscription } from '@/lib/subscriptionUtils'

if (hasActiveSubscription(company)) {
  // Payment is current ✅
  // This checks BOTH status AND period end date
}
```

## 🚨 What If Payment Fails?

### Stripe's Automatic Handling (Smart Retries)

**Day 31:** Payment fails
- Status → `past_due`
- Customer gets email: "Payment failed, please update card"
- You can choose: still allow access or block

**Day 33:** First retry
- Stripe tries again automatically
- No action needed from you

**Day 35:** Second retry
- Stripe tries again
- Customer gets reminder email

**Day 37:** Third retry
- Final attempt
- If fails → Subscription canceled
- Status → `canceled`
- Access blocked

**Your webhook receives ALL these events automatically**

## ✅ What You Need to Monitor

### Daily:
1. Check Stripe Dashboard → Failed payments
2. Check your cron job logs (runs at 3 AM)
3. Monitor `past_due` subscriptions

### Weekly:
1. Review canceled subscriptions
2. Check if any subscriptions need manual intervention
3. Verify webhook delivery rate (should be ~100%)

### Monthly:
1. Review total active subscriptions
2. Calculate Monthly Recurring Revenue (MRR)
3. Check credit usage vs allocation

## 🎬 Quick Test

Want to verify it works? Here's a 2-minute test:

```bash
# 1. Create test subscription (use test mode)
Visit: /company/subscription/checkout?plan=startup
Card: 4242 4242 4242 4242

# 2. Verify stored in Firestore
Check: subscriptions collection has new document
Check: companies/{id}.subscription.status = 'active'

# 3. Simulate next month payment
In Stripe Dashboard:
- Find subscription
- Click "..." → "Advance billing cycle"
- Watch webhook fire → invoice.paid

# 4. Verify credits awarded
Check: companies/{id}.credits increased by 1000

# 5. Test failed payment
Update card to: 4000 0000 0000 0341 (always fails)
Advance billing cycle again
Watch webhook fire → invoice.payment_failed
Check: subscription.status = 'past_due'
```

## 📞 Need Help?

If monthly payments aren't working:

1. **Check webhook logs** in Stripe Dashboard
2. **Verify environment variables:**
   - `STRIPE_SECRET_KEY` ✓
   - `STRIPE_WEBHOOK_SECRET` ✓
   - `STRIPE_PRICE_ID` ✓
3. **Run manual verification:**
   ```bash
   curl -X GET https://your-app.com/api/subscriptions/verify \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
4. **Check Firestore** for subscription document

## 🎉 Summary

**You're all set!** The system automatically:

1. ✅ **Charges customers** every month (Stripe)
2. ✅ **Receives payment notifications** (Webhooks)
3. ✅ **Updates Firestore** with payment status
4. ✅ **Awards credits** on successful payment
5. ✅ **Handles failures** with automatic retries
6. ✅ **Verifies daily** that everything is in sync
7. ✅ **Blocks access** if subscription canceled

**Zero manual intervention needed!** 🚀

The only thing you need to do is:
- Monitor the Stripe Dashboard occasionally
- Check the daily cron job logs
- Handle support requests from customers with payment issues

