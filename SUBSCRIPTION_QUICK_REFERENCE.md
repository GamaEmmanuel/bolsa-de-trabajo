# Subscription System - Quick Reference

## 🎯 How Monthly Payments Are Checked

### Automatic Checks (No Manual Work Needed!)

| Check Type | When | What Happens |
|------------|------|--------------|
| **Webhooks** | Real-time | Stripe sends payment result → Updates Firestore instantly |
| **Cron Job** | Daily 3 AM | Syncs all subscriptions with Stripe to catch missed webhooks |
| **Runtime** | Every feature use | Checks Firestore before allowing premium features |

## 💰 Subscription Price

**Plan:** Empresa
**Price:** $100 MXN/month
**Includes:** Unlimited job postings, 1000 AI credits/month, ATS, Analytics

## 📦 What Gets Stored in Firestore

### When Payment Succeeds Each Month:

```javascript
// subscriptions/{stripeSubscriptionId}
{
  companyId: "abc123",
  status: "active",              // ← Check this
  amount: 10000,                 // $100 MXN
  currentPeriodEnd: "2025-01-05" // ← And this
}

// companies/{companyId}
{
  subscription: {
    status: "active",
    currentPeriodEnd: "2025-01-05"
  },
  credits: 2000  // ← Gets +1000 each month
}
```

## 🔍 How to Check If Customer Paid

### In Code:
```typescript
import { hasActiveSubscription } from '@/lib/subscriptionUtils'

const isPaid = hasActiveSubscription(company)
// Returns true if:
// ✓ status is 'active'
// ✓ currentPeriodEnd is in the future
// ✓ Not past_due
```

### In Firestore Console:
1. Open `companies/{companyId}`
2. Check `subscription.status` → should be `"active"`
3. Check `subscription.currentPeriodEnd` → should be future date

### In Stripe Dashboard:
1. Go to Subscriptions
2. Search by company email
3. View payment history and status

## 🚨 Payment Failed? Here's What Happens:

| Day | Event | Status | Access |
|-----|-------|--------|--------|
| 31 | Payment fails | `past_due` | ⚠️ Grace period |
| 33 | Auto retry #1 | `past_due` | ⚠️ Still accessible |
| 35 | Auto retry #2 | `past_due` | ⚠️ Still accessible |
| 37 | Auto retry #3 | `past_due` | ⚠️ Last chance |
| 38 | All failed | `canceled` | ❌ Blocked |

**Stripe handles all retries automatically - you don't need to do anything!**

## 🛠️ Key Files

| File | Purpose |
|------|---------|
| `/src/app/api/stripe/webhook/route.ts` | Receives payment notifications from Stripe |
| `/src/app/api/subscriptions/verify/route.ts` | Daily cron job to sync with Stripe |
| `/src/lib/subscriptionUtils.ts` | Helper functions to check payment status |
| `/src/lib/subscriptionGuard.ts` | Protection for premium features |
| `vercel.json` | Cron job configuration (runs daily at 3 AM) |

## ⚙️ Required Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Cron Security
CRON_SECRET=random-secure-key
```

## 🧪 Quick Test

```bash
# 1. Subscribe with test card
Card: 4242 4242 4242 4242

# 2. Check Firestore
subscriptions/{id}.status = "active" ✓

# 3. Simulate next month (in Stripe Dashboard)
Click subscription → "Advance billing cycle"

# 4. Verify webhook received
Check: credits increased by 1000 ✓

# Done! ✅
```

## 📊 Monitor Subscription Health

### Dashboard Queries

**Active subscriptions:**
```javascript
db.collection('subscriptions')
  .where('status', '==', 'active')
  .get()
```

**Past due (need attention):**
```javascript
db.collection('subscriptions')
  .where('status', '==', 'past_due')
  .get()
```

**Monthly revenue:**
```javascript
db.collection('subscriptions')
  .where('status', '==', 'active')
  .get()
  .then(snap => snap.size * 100) // MXN
```

## ✅ What You Get

- ✅ Automatic monthly charging
- ✅ Real-time payment status updates
- ✅ Failed payment handling with retries
- ✅ Automatic credit awards
- ✅ Daily verification backup
- ✅ Access control based on payment status
- ✅ Subscription data in Firestore
- ✅ No manual intervention needed

## 🎓 For Your Team

**Tell your developers:**
"Use `hasActiveSubscription(company)` before premium features. The payment checking is fully automated via Stripe webhooks."

**Tell your finance team:**
"Stripe handles all billing automatically. Check the Stripe Dashboard for revenue and failed payments."

**Tell your support team:**
"If a customer says payment failed, check Stripe Dashboard → Subscriptions → Search by email. Stripe automatically retries failed payments for 7 days."

---

## The Bottom Line

**Q: How do we check if customer paid this month?**
**A:** You don't need to! Stripe automatically:
1. Charges the customer on their billing date
2. Sends webhook with payment result
3. Your system updates Firestore
4. Premium features check Firestore before allowing access

**It's 100% automated.** ✨

