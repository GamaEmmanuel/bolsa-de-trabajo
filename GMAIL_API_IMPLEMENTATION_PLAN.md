# 📧 Gmail API Implementation Plan

## 🎯 **Goal:**
Replace EmailJS with Gmail API to send all emails from `mesereamx@gmail.com`

---

## ⚙️ **OAuth Setup - What to Enter in Google Cloud Console:**

### **Authorized JavaScript origins:**
Add these URLs (where OAuth can be initiated FROM):
```
http://localhost:3000
http://localhost:8080
https://meserea.com
https://jobportal-4b561.web.app
```

**Why:** This allows the one-time authentication script to run locally

### **Authorized redirect URIs:**
Add these URLs (where Google redirects AFTER authentication):
```
http://localhost:3000/oauth2callback
http://localhost:8080/oauth2callback
https://meserea.com/oauth2callback
https://jobportal-4b561.web.app/oauth2callback
```

**Why:** Google needs to know where to send you back after you authorize

**Note:** After the one-time setup, you won't need these anymore - the refresh token handles everything!

---

## 📋 **Phase 1: Google Cloud Setup (30-45 minutes)**

### **Step 1: Enable Gmail API**
- [x] Go to: https://console.cloud.google.com/apis/library
- [x] Search: "Gmail API"
- [x] Click "Enable"

### **Step 2: Create OAuth Credentials**
- [x] Go to: https://console.cloud.google.com/apis/credentials
- [x] Click "Create Credentials" → "OAuth client ID"
- [x] Application type: "Web application"
- [x] Name: "HR Portal Gmail Sender"
- [x] Add Authorized JavaScript origins (see above)
- [x] Add Authorized redirect URIs (see above)
- [x] Click "Create"
- [x] Download credentials JSON

### **Step 3: Configure Consent Screen**
- [x] Go to: OAuth consent screen
- [x] User Type: "Internal" (if Google Workspace) or "External"
- [x] App name: "HR Portal"
- [x] User support email: mesereamx@gmail.com
- [x] Add scope: `https://www.googleapis.com/auth/gmail.send`
- [x] Save

---

## 📋 **Phase 2: One-Time Authentication (15 minutes)**

### **Step 1: Create Authentication Script**

Create file: `scripts/get-gmail-token.js`

**Purpose:** Get refresh token for mesereamx@gmail.com (ONE TIME)

**What it does:**
1. Opens browser
2. You sign in with mesereamx@gmail.com
3. Grant permission to send emails
4. Returns refresh token
5. You copy token to .env.local

**You run this ONCE** - refresh token lasts forever!

### **Step 2: Run Script**
```bash
node scripts/get-gmail-token.js
```

### **Step 3: Store Refresh Token**
Add to `.env.local`:
```bash
GMAIL_REFRESH_TOKEN=xxx
```

**Done!** Never need to authenticate again (unless you revoke it)

---

## 📋 **Phase 3: Install Dependencies (5 minutes)**

### **Main App:**
```bash
npm install googleapis
npm uninstall @emailjs/browser
```

### **Firebase Functions:**
```bash
cd functions
npm install googleapis
cd ..
```

---

## 📋 **Phase 4: Create Gmail Client (1-2 hours)**

### **New File: `src/lib/gmailClient.ts`**

**Responsibilities:**
- Initialize Gmail API client
- Refresh access token when needed
- Format emails as MIME/RFC 2822
- Send emails via Gmail API
- Handle errors

**Functions to create:**
```typescript
async function getAccessToken() // Refresh token if needed
async function createMimeMessage(to, subject, html, text) // Format email
async function sendGmailEmail(templateData) // Main function
```

**Lines of code:** ~150 lines

---

## 📋 **Phase 5: Update Email Templates (1 hour)**

### **Modify: `src/lib/emailTemplates.ts`**

**Current:** Returns `Partial<EmailTemplateData>` (for EmailJS)

**New:** Returns full HTML string

**Example Change:**

**Before (EmailJS):**
```typescript
return {
  subject: '✅ Aplicación enviada',
  title: '¡Aplicación Enviada!',
  greeting: 'Hola Emmanuel,',
  main_message: 'Tu aplicación...',
  // ...
}
```

**After (Gmail API):**
```typescript
return {
  subject: '✅ Aplicación enviada',
  html: `
    <!DOCTYPE html>
    <html>
    <body>
      <h1>¡Aplicación Enviada!</h1>
      <p>Hola Emmanuel,</p>
      <p>Tu aplicación...</p>
    </body>
    </html>
  `,
  text: 'Hola Emmanuel, Tu aplicación...' // Plain text version
}
```

**Changes needed:** 8 template functions × ~30 lines each = ~240 lines

---

## 📋 **Phase 6: Update Application Flow (30 minutes)**

### **Modify: `src/app/jobs/[jobId]/page.tsx`**

**Current:** Calls `sendEmailFromBrowser()` (EmailJS)

**New:** Calls `sendGmailEmail()` (Gmail API)

**Change:**
```typescript
// Before
import { sendEmailFromBrowser } from '@/lib/emailClient'

// After
import { sendGmailEmail } from '@/lib/gmailClient'

// Replace function call
sendEmailFromBrowser(data) → sendGmailEmail(data)
```

**Lines changed:** ~20 lines

---

## 📋 **Phase 7: Add Server-Side Support (1 hour)**

### **Modify: `functions/src/index.ts`**

**Add Gmail sending to Firebase Function:**

```typescript
import { google } from 'googleapis';

// Add Gmail configuration
const GMAIL_CONFIG = {
  clientId: functions.config().gmail?.client_id,
  clientSecret: functions.config().gmail?.client_secret,
  refreshToken: functions.config().gmail?.refresh_token,
  userEmail: functions.config().gmail?.user_email,
};

// Add Gmail sending function
async function sendViaGmail(templateData) {
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CONFIG.clientId,
    GMAIL_CONFIG.clientSecret
  );

  oauth2Client.setCredentials({
    refresh_token: GMAIL_CONFIG.refreshToken
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Create and send email...
}
```

**Lines to add:** ~100 lines

---

## 📋 **Phase 8: Environment Variables (15 minutes)**

### **Development (.env.local):**
```bash
GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxx
GMAIL_REFRESH_TOKEN=xxx
GMAIL_USER_EMAIL=mesereamx@gmail.com
NEXT_PUBLIC_APP_URL=https://meserea.com
```

### **Production (Firebase Functions):**
```bash
firebase functions:config:set gmail.client_id="xxx"
firebase functions:config:set gmail.client_secret="xxx"
firebase functions:config:set gmail.refresh_token="xxx"
firebase functions:config:set gmail.user_email="mesereamx@gmail.com"
```

---

## 📋 **Phase 9: Testing (2 hours)**

### **Local Testing:**
- [ ] Test candidate application email
- [ ] Test company notification email
- [ ] Test with preferences enabled
- [ ] Test with preferences disabled
- [ ] Check email deliverability
- [ ] Verify HTML renders correctly
- [ ] Test all 8 notification types

### **Production Testing:**
- [ ] Deploy to Firebase
- [ ] Test from meserea.com
- [ ] Verify preferences work
- [ ] Check spam folder
- [ ] Test multiple emails
- [ ] Monitor rate limits

---

## 📋 **Phase 10: Cleanup (30 minutes)**

### **Remove EmailJS:**
- [ ] Delete unused EmailJS code
- [ ] Remove EmailJS credentials from code
- [ ] Uninstall @emailjs/browser
- [ ] Update documentation
- [ ] Delete EmailJS account (optional)

---

## 📂 **Files Roadmap:**

### **New Files to Create:**
1. `scripts/get-gmail-token.js` - One-time OAuth setup (~50 lines)
2. `src/lib/gmailClient.ts` - Gmail API client (~200 lines)
3. `src/lib/mimeFormatter.ts` - Email MIME formatting (~100 lines)

### **Files to Modify:**
1. `src/lib/emailTemplates.ts` - Return HTML strings (~300 lines modified)
2. `src/app/jobs/[jobId]/page.tsx` - Use Gmail client (~20 lines)
3. `functions/src/index.ts` - Add Gmail support (~100 lines)
4. `package.json` - Update dependencies (2 lines)
5. `functions/package.json` - Update dependencies (2 lines)

### **Files to Delete:**
1. `src/lib/emailClient.ts` - EmailJS client (replaced)
2. `EMAILJS_TEMPLATE_SETUP.md` - No longer needed
3. Various EmailJS documentation files

**Total Changes:** ~900 lines

---

## ⏱️ **Time Breakdown:**

| Phase | Task | Time |
|-------|------|------|
| 1 | Google Cloud Setup | 45 min |
| 2 | One-Time Authentication | 15 min |
| 3 | Install Dependencies | 5 min |
| 4 | Create Gmail Client | 2 hours |
| 5 | Update Templates | 1 hour |
| 6 | Update Application Flow | 30 min |
| 7 | Server-Side Support | 1 hour |
| 8 | Environment Variables | 15 min |
| 9 | Testing | 2 hours |
| 10 | Cleanup | 30 min |
| **TOTAL** | | **8-9 hours** |

**Can be done in:** 1-2 days

---

## 🔑 **Key Advantages After Migration:**

### **✅ What You Gain:**
1. **No Domain Restrictions** - Works from any domain
2. **500 emails/day** - vs 200/month with EmailJS
3. **Professional From Address** - mesereamx@gmail.com
4. **Server-Side Works** - Firebase Functions can send
5. **Better Deliverability** - Gmail is trusted
6. **True Security** - Preferences checked server-side
7. **No CORS Issues** - Gmail API has no browser restrictions

### **What You Keep:**
- ✅ Same email content and design
- ✅ Same user preferences system
- ✅ Same triggering logic
- ✅ Same Firestore logging
- ✅ Same UI components

---

## 📝 **Implementation Checklist:**

### **Pre-Implementation:**
- [x] Decide to use Gmail API
- [ ] Create Google Cloud Project (or use existing)
- [ ] Enable Gmail API
- [ ] Create OAuth credentials
- [ ] Answer OAuth questions (see above)
- [ ] Download credentials

### **Phase 1: Authentication Setup**
- [ ] Create get-gmail-token.js script
- [ ] Run script and authenticate mesereamx@gmail.com
- [ ] Store refresh token in .env.local
- [ ] Test token works

### **Phase 2: Code Implementation**
- [ ] Install googleapis package
- [ ] Create gmailClient.ts
- [ ] Create mimeFormatter.ts
- [ ] Update emailTemplates.ts
- [ ] Update jobs/[jobId]/page.tsx
- [ ] Update Firebase Functions

### **Phase 3: Testing**
- [ ] Test locally (all email types)
- [ ] Test with preferences
- [ ] Deploy to Firebase
- [ ] Test in production
- [ ] Verify deliverability

### **Phase 4: Cleanup**
- [ ] Remove EmailJS code
- [ ] Uninstall @emailjs/browser
- [ ] Update documentation
- [ ] Celebrate! 🎉

---

## 💰 **Cost Analysis:**

### **Gmail API:**
- **Free:** 500 emails/day (15,000/month)
- **Quota:** Per Google Cloud Project
- **Overage:** Contact Google (very high limits)

### **vs EmailJS:**
- **Free:** 200 emails/month
- **Paid:** $15/month for 5,000 emails

**Savings:** $180/year if you need more than 200/month!

---

## 🎯 **Success Criteria:**

After implementation, you should have:
- ✅ Emails sending from mesereamx@gmail.com
- ✅ Working in both dev and production
- ✅ Server-side preference checking
- ✅ 500 emails/day quota
- ✅ No domain restrictions
- ✅ Professional deliverability

---

## 📞 **Ready to Start?**

**Current Step:** OAuth Credential Setup in Google Cloud Console

**What to Enter:**

**Authorized JavaScript origins:**
```
http://localhost:3000
https://meserea.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/oauth2callback
```

**Then:** Download the credentials and we'll start implementing!

---

## 🗺️ **Next Steps After You Create Credentials:**

1. Download credentials JSON
2. I'll create the get-gmail-token.js script
3. You run it and get refresh token
4. We implement Gmail client
5. Update all email sending code
6. Test and deploy!

---

**Status:** Ready to begin once you have OAuth credentials!

Let me know when you've created the credentials and downloaded them!

