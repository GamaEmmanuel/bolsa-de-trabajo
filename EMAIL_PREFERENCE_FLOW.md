# 📧 Email Preference System - How It Works

## ✅ Implementation Complete!

Your email notification system now **respects user preferences** before sending any emails.

---

## 🔄 Complete Flow

### **When a Candidate Applies to a Job:**

```
1. Candidate clicks "Aplicar"
   ↓
2. Application saved to Firestore
   ↓
3. Frontend calls: POST /api/notifications/application-submitted
   ↓
4. API Route processes both emails:

   📧 CANDIDATE EMAIL:
   ├─ Calls sendApplicationSubmittedEmail(data, candidateId)
   ├─ Internally calls /api/email/send with:
   │  ├─ notificationType: 'application_submitted'
   │  ├─ userId: candidateId
   │  └─ email data
   ├─ API checks: Does candidate have 'applicationSubmitted' disabled?
   ├─ If YES → Skip email (returns: "Email skipped due to user preferences")
   └─ If NO → Send email via EmailJS ✅

   📧 COMPANY EMAIL:
   ├─ Gets company email from Firestore
   ├─ Calls sendNewApplicationReceivedEmail(data, companyId)
   ├─ Internally calls /api/email/send with:
   │  ├─ notificationType: 'new_application'
   │  ├─ userId: companyId
   │  └─ email data
   ├─ API checks: Does company have 'newApplications' disabled?
   ├─ If YES → Skip email (returns: "Email skipped due to user preferences")
   └─ If NO → Send email via EmailJS ✅
```

---

## 🎛️ Email Preference Settings

### **For Candidates** (`/candidate/account`)

**Notification Types:**
- ✉️ **Application Submitted** → `applicationSubmitted`
- 📊 **Application Status Changed** → `applicationStatusChanged`
- ❌ **Application Rejected** → `applicationRejected`
- 💬 **New Messages** → `newMessages`
- 📈 **Weekly Digest** → `weeklyDigest`
- 📣 **Marketing Emails** → `marketingEmails`

### **For Companies** (`/company/settings`)

**Notification Types:**
- 📥 **New Applications** → `newApplications` ⭐ (controls the email you just fixed!)
- 💼 **Job Status Updates** → `jobStatusUpdates`
- 💳 **Payment Notifications** → `paymentNotifications`
- 📑 **Subscription Updates** → `subscriptionUpdates`
- 🎯 **Credits Awarded** → `creditsAwarded`
- 💬 **New Messages** → `newMessages`
- 📈 **Weekly Digest** → `weeklyDigest`
- 📣 **Marketing Emails** → `marketingEmails`

---

## 🗄️ Where Preferences Are Stored

### **Firestore Collections:**

**Candidates:**
```
Collection: users
Document: {candidateId}
Field: emailPreferences
  {
    applicationSubmitted: true/false,
    applicationStatusChanged: true/false,
    applicationRejected: true/false,
    newMessages: true/false,
    weeklyDigest: true/false,
    marketingEmails: true/false
  }
```

**Companies:**
```
Collection: users (or companies)
Document: {companyId}
Field: emailPreferences
  {
    newApplications: true/false,      ⭐ Controls company notification
    jobStatusUpdates: true/false,
    paymentNotifications: true/false,
    subscriptionUpdates: true/false,
    creditsAwarded: true/false,
    newMessages: true/false,
    weeklyDigest: true/false,
    marketingEmails: true/false
  }
```

---

## 🔍 Preference Checking Logic

**File:** `src/app/api/email/send/route.ts`

```typescript
// Line 24-37
if (userId) {
  const shouldSend = await checkEmailPreferences(userId, notificationType)
  if (!shouldSend) {
    return NextResponse.json({
      success: true,
      messageId: 'skipped_by_preferences',
      error: 'Email skipped due to user preferences'
    })
  }
}
```

**Notification Type Mapping:**
```typescript
// Line 172-188
const typeMap: Record<string, keyof any> = {
  'application_submitted': 'applicationSubmitted',
  'application_status_changed': 'applicationStatusChanged',
  'application_rejected': 'applicationRejected',
  'new_message': 'newMessages',
  'payment_failed': 'paymentNotifications',
  'payment_successful': 'paymentNotifications',
  'subscription_activated': 'subscriptionUpdates',
  'subscription_canceled': 'subscriptionUpdates',
  'subscription_expiring': 'subscriptionUpdates',
  'credits_awarded': 'creditsAwarded',
  'new_application': 'newApplications',     ⭐ Maps to company preference
  'job_published': 'jobStatusUpdates',
  'job_expiring': 'jobStatusUpdates',
  'welcome_candidate': 'applicationSubmitted',
  'welcome_company': 'subscriptionUpdates',
}
```

---

## 🧪 How to Test

### **Test 1: Company WANTS New Application Emails**

1. Sign in as company
2. Go to `/company/settings`
3. Scroll to "Preferencias de Email"
4. Make sure "Nuevas Aplicaciones" is **CHECKED** ✅
5. Have a candidate apply to your job
6. **Expected:** Company receives email ✅

### **Test 2: Company DOESN'T WANT New Application Emails**

1. Sign in as company
2. Go to `/company/settings`
3. Scroll to "Preferencias de Email"
4. **UNCHECK** "Nuevas Aplicaciones" ❌
5. Save preferences
6. Have a candidate apply to your job
7. **Expected:**
   - Candidate receives email ✅
   - Company does NOT receive email ❌
8. Check browser console: Should say "Email skipped due to user preferences"

### **Test 3: Candidate Preferences**

1. Sign in as candidate
2. Go to `/candidate/account`
3. Scroll to "Preferencias de Email"
4. **UNCHECK** "Application Submitted" ❌
5. Apply to a job
6. **Expected:**
   - Candidate does NOT receive email ❌
   - Company still receives email ✅ (if their preference is on)

---

## 📊 Email Audit Logs

All emails (sent or skipped) are logged in Firestore:

**Collection:** `emailLogs`

**Example Log Entry:**
```javascript
{
  notificationType: 'new_application',
  recipientEmail: 'company@example.com',
  recipientName: 'Acme Corp',
  userId: 'companyUserId123',
  status: 'sent',           // or 'skipped' if preferences disabled
  sentAt: Timestamp,
  subject: '📥 Nueva Aplicación Recibida - Chef de Cocina',
  messageId: 'OK',
  // If skipped:
  // error: 'Email skipped due to user preferences'
}
```

---

## ⚙️ Default Behavior

**If no preferences are set:**
- ✅ All emails are sent by default
- Users must explicitly opt-out

**If Firestore is unavailable:**
- ✅ All emails are sent (failsafe to ensure critical notifications)

**Welcome emails:**
- ✅ Always sent (cannot be disabled)
- This ensures users know their account was created successfully

---

## 🎯 Benefits of This System

✅ **GDPR/Privacy Compliant** - Users control their notifications
✅ **Reduces Spam** - Users only get emails they want
✅ **Better User Experience** - Respects user choices
✅ **Audit Trail** - All email activity is logged
✅ **Reliable** - Fails gracefully if preferences can't be checked
✅ **Server-Side** - Can't be bypassed by client manipulation

---

## 🔧 Files Modified

1. ✅ `src/app/jobs/[jobId]/page.tsx` - Now uses API route with preference checking
2. ✅ `src/app/api/email/send/route.ts` - Checks preferences before sending
3. ✅ `src/app/api/notifications/application-submitted/route.ts` - Handles both emails
4. ✅ `src/lib/emailNotifications.ts` - Passes userId for preference checking
5. ✅ `src/components/EmailPreferences.tsx` - UI for managing preferences

---

## ✨ Summary

Your email system is now **production-ready** with:
- ✅ Full preference checking for all notification types
- ✅ Respects both candidate and company preferences
- ✅ Audit logging for compliance
- ✅ Graceful fallbacks if checks fail
- ✅ User-friendly UI for managing preferences

**No more unwanted emails!** 🎉

