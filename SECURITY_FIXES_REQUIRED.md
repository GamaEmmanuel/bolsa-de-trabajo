# 🚨 CRITICAL SECURITY FIXES REQUIRED

**Date:** December 20, 2025
**Priority:** IMMEDIATE ACTION REQUIRED

---

## ⚠️ EXPOSED SECRETS - ACTION REQUIRED NOW

### 1. EmailJS API Keys Exposed in Source Code

**Location:** `src/app/api/email/send/route.ts`

**What was exposed:**
- Service ID: `job-portal`
- Template ID: `template_kv50v38`
- Public Key: `dNgbSgz45xOHH5tbn`
- Private Key: `-Eo8kdyuTIvbpl1345mph`

**Risk Level:** 🔴 CRITICAL

**Immediate Actions Required:**

#### Step 1: Rotate the Keys (Do This First!)
1. Log into EmailJS Dashboard: https://dashboard.emailjs.com/
2. Go to Account → API Keys
3. **Delete or regenerate** the exposed private key
4. Create a new private key
5. Update your local `.env.local` file with new keys

#### Step 2: Update Environment Variables
1. Create/update `.env.local` file:
   ```bash
   EMAILJS_SERVICE_ID=your-new-service-id
   EMAILJS_TEMPLATE_ID=your-new-template-id
   EMAILJS_PUBLIC_KEY=your-new-public-key
   EMAILJS_PRIVATE_KEY=your-new-private-key
   ```

2. Update production environment (Vercel/hosting platform):
   - Add the same environment variables to your hosting platform
   - Redeploy the application

#### Step 3: Code Changes (Already Done)
✅ Updated `src/app/api/email/send/route.ts` to use environment variables

#### Step 4: Verify
```bash
# Make sure the old keys are not in the code
grep -r "dNgbSgz45xOHH5tbn" src/
grep -r "Eo8kdyuTIvbpl1345mph" src/

# Should return no results
```

---

## 🔒 Additional Security Measures Needed

### 2. Add Rate Limiting to Email API

**Why:** Prevent abuse and spam

**Implementation:**

Create a new file: `src/middleware/rateLimit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const rateLimit = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  req: NextRequest,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()

  const userLimit = rateLimit.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (userLimit.count >= maxRequests) {
    return false
  }

  userLimit.count++
  return true
}
```

Then update `src/app/api/email/send/route.ts`:

```typescript
import { checkRateLimit } from '@/middleware/rateLimit'

export async function POST(req: NextRequest) {
  // Add rate limiting
  if (!checkRateLimit(req, 10, 60000)) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  // ... rest of the code
}
```

### 3. Add Authentication to API Routes

**Why:** Ensure only authenticated users can send emails

**Update:** `src/app/api/email/send/route.ts`

```typescript
import { adminAuth } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  // Verify authentication
  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const token = authHeader.split('Bearer ')[1]

  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Verify userId matches the request
    const body = await req.json()
    if (body.userId && body.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Continue with email sending...
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    )
  }
}
```

### 4. Enable Firebase App Check

**Why:** Prevent unauthorized access to Firebase services

**Steps:**

1. Go to Firebase Console → App Check
2. Enable App Check for your project
3. Register your web app
4. Add reCAPTCHA v3 or similar
5. Update your code:

```typescript
// src/lib/firebase.ts
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// After initializing Firebase
if (typeof window !== 'undefined') {
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
    isTokenAutoRefreshEnabled: true
  });
}
```

---

## 📋 Quick Action Checklist

Complete these tasks in order:

- [ ] **Rotate EmailJS keys** (5 minutes)
- [ ] **Update .env.local** with new keys (2 minutes)
- [ ] **Update production environment variables** (5 minutes)
- [ ] **Verify code changes** (2 minutes)
- [ ] **Test email sending** with new keys (5 minutes)
- [ ] **Run npm audit fix** (5 minutes)
- [ ] **Update Next.js** to latest version (10 minutes)
- [ ] **Add rate limiting** to email API (30 minutes)
- [ ] **Add authentication** to API routes (1 hour)
- [ ] **Enable Firebase App Check** (30 minutes)
- [ ] **Set up error monitoring** (1 hour)
- [ ] **Deploy and test** (30 minutes)

**Total Time:** ~4 hours

---

## 🔍 How to Check if You're Secure

Run these checks:

```bash
# 1. No secrets in code
git grep -i "api.*key" src/
git grep -i "secret" src/

# 2. Environment variables set
node -e "console.log(process.env.EMAILJS_PRIVATE_KEY ? '✅ Set' : '❌ Missing')"

# 3. Dependencies up to date
npm audit
npm outdated

# 4. TypeScript errors
npm run build

# 5. Test email sending
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 📞 If You Need Help

1. **EmailJS Issues:** https://www.emailjs.com/docs/
2. **Firebase Security:** https://firebase.google.com/docs/rules
3. **Next.js Security:** https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

---

## ⚠️ Important Notes

1. **Never commit secrets** to git
2. **Always use environment variables** for sensitive data
3. **Rotate keys immediately** if exposed
4. **Test thoroughly** after making changes
5. **Monitor logs** for suspicious activity

---

**Status After Fixes:**
- ✅ Code updated to use environment variables
- ⏳ Waiting for you to rotate keys
- ⏳ Waiting for production deployment
- ⏳ Waiting for additional security measures

**Don't launch until all items are checked!** 🚨

