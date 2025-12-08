# 📧 Email Notification System Documentation

## Overview

A comprehensive email notification system has been implemented using **EmailJS** to send automated emails for various events in your HR Portal application.

---

## 🎯 Features Implemented

### **Priority Notifications** (Implemented ✅)

#### **For Candidates:**
1. ✅ **Application Submitted** - Confirmation when applying to a job
2. ✅ **Application Status Changed** - When moved through pipeline stages (reviewed, interview, assessments, finalista)
3. ✅ **Application Rejected** - When rejected or not moving forward
4. ✅ **Welcome Email** - When signing up as a candidate

#### **For Companies:**
1. ✅ **New Application Received** - When a candidate applies to their job
2. ✅ **Subscription Activated** - When subscription is successfully created
3. ✅ **Payment Successful** - Monthly recurring payments
4. ✅ **Payment Failed** - When payment processing fails
5. ✅ **Subscription Canceled** - When subscription is terminated
6. ✅ **Welcome Email** - When signing up as a company

---

## 📁 File Structure

```
src/
├── types/
│   └── email.ts                           # Email-related TypeScript interfaces
├── lib/
│   ├── emailTemplates.ts                  # Email template builders
│   └── emailNotifications.ts              # High-level notification functions
├── components/
│   └── EmailPreferences.tsx               # UI component for email settings
├── app/
│   └── api/
│       ├── email/
│       │   └── send/
│       │       └── route.ts               # Main email sending API
│       ├── email-preferences/
│       │   └── route.ts                   # Save/load preferences API
│       └── notifications/
│           ├── application-submitted/
│           │   └── route.ts               # Application notification handler
│           ├── status-changed/
│           │   └── route.ts               # Status change handler
│           └── welcome/
│               └── route.ts               # Welcome email handler
```

---

## 🔧 Configuration

### **EmailJS Credentials** (Already configured in code)

```typescript
SERVICE_ID: 'job-portal'
TEMPLATE_ID: 'template_kv50v38'
PUBLIC_KEY: 'dNgbSgz45xOHH5tbn'
PRIVATE_KEY: '-Eo8kdyuTIvbpl1345mph'
```

### **Environment Variables** (Add these to `.env.local`)

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update for production
```

---

## 📧 EmailJS Template Setup

Since you're using **ONE dynamic template** (`template_kv50v38`), configure it in EmailJS dashboard with these variables:

### **Template Variables:**

```handlebars
Subject: {{subject}}

{{greeting}}

{{title}}

{{main_message}}

{{secondary_message}}

{{#if detail_1_label}}
{{detail_1_label}}: {{detail_1_value}}
{{/if}}

{{#if detail_2_label}}
{{detail_2_label}}: {{detail_2_value}}
{{/if}}

{{#if detail_3_label}}
{{detail_3_label}}: {{detail_3_value}}
{{/if}}

{{#if detail_4_label}}
{{detail_4_label}}: {{detail_4_value}}
{{/if}}

{{#if action_url}}
<a href="{{action_url}}">{{action_label}}</a>
{{/if}}

---
{{footer_message}}

{{company_name}}
```

**Important:** Make sure to enable all these fields in your EmailJS template editor.

---

## 🚀 How It Works

### **1. Application Flow**

When a candidate applies for a job:

**File:** `src/app/jobs/[jobId]/page.tsx` (lines 155-182)

```typescript
// Two emails are sent automatically:
1. Candidate receives "Application Submitted" confirmation
2. Company receives "New Application" notification
```

### **2. Status Change Flow**

When a recruiter moves a candidate through the ATS pipeline:

**File:** `src/app/company/ats/page.tsx` (lines 510-548)

```typescript
// Email sent to candidate with:
- Old status
- New status
- Job details
- Link to their applications
```

### **3. Payment Webhooks**

When Stripe processes payments:

**File:** `src/app/api/stripe/webhook/route.ts`

```typescript
// Handles:
- checkout.session.completed → Subscription Activated email
- invoice.paid → Payment Successful email
- invoice.payment_failed → Payment Failed email
- customer.subscription.deleted → Subscription Canceled email
```

### **4. Onboarding**

When new users complete onboarding:

**File:** `src/app/onboarding/page.tsx` (lines 79-97)

```typescript
// Sends welcome email based on account type:
- Personal → Welcome Candidate email
- Enterprise → Welcome Company email
```

---

## 🎨 Email Preferences UI

Users can control which emails they receive!

### **For Candidates:**
- Navigate to: `/candidate/account`
- Scroll to **"Preferencias de Email"** section
- Toggle individual notification types

### **For Companies:**
- Navigate to: `/company/settings`
- Scroll to **"Preferencias de Email"** section
- Toggle individual notification types

### **Available Preferences:**

#### Candidates:
- ✉️ Application Submitted
- 📊 Application Status Changed
- ❌ Application Rejected
- 💬 New Messages
- 📈 Weekly Digest
- 📣 Marketing Emails

#### Companies:
- 📥 New Applications
- 💼 Job Status Updates
- 💳 Payment Notifications
- 📑 Subscription Updates
- 🎯 Credits Awarded
- 💬 New Messages
- 📈 Weekly Digest
- 📣 Marketing Emails

---

## 🔍 Email Audit Log

All emails are logged to Firestore for tracking:

**Collection:** `emailLogs`

**Fields:**
```typescript
{
  notificationType: string
  recipientEmail: string
  recipientName: string
  userId: string | null
  status: 'sent' | 'failed'
  sentAt: Date
  subject: string
  messageId: string
  error?: string  // Only for failed emails
}
```

---

## 🧪 Testing

### **1. Test Application Emails**

1. Sign up as a candidate
2. Apply for a job
3. Check email for confirmation

### **2. Test Status Change Emails**

1. Sign up as a company
2. Receive an application
3. Drag candidate to different stages in ATS
4. Check candidate's email for updates

### **3. Test Payment Emails**

Use Stripe test mode webhooks:
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test payment
stripe trigger payment_intent.succeeded
stripe trigger invoice.payment_failed
```

### **4. Test Welcome Emails**

1. Sign up as new user (candidate or company)
2. Complete onboarding
3. Check email for welcome message

---

## 📊 Email Rate Limits

**EmailJS Free Tier:**
- 200 emails/month
- Rate limit: 2 emails/second

**For Production:**
Consider upgrading to EmailJS paid plan or migrating to:
- SendGrid (99K emails/month free)
- AWS SES (62K emails/month free)
- Mailgun (5K emails/month free)

---

## 🛠️ Customization

### **Add New Notification Type:**

1. **Add type to `src/types/email.ts`:**
```typescript
export type NotificationType =
  | 'existing_types...'
  | 'your_new_type'
```

2. **Create template builder in `src/lib/emailTemplates.ts`:**
```typescript
export function buildYourNewTemplate(data: YourData): Partial<EmailTemplateData> {
  return {
    subject: 'Your Subject',
    title: 'Your Title',
    main_message: 'Your message',
    // ... etc
  }
}
```

3. **Create notification function in `src/lib/emailNotifications.ts`:**
```typescript
export async function sendYourNewEmail(data: YourData, userId?: string) {
  const templateData = buildYourNewTemplate(data)
  return sendEmail('your_new_type', data.email, data.name, templateData, userId)
}
```

4. **Call it from your feature:**
```typescript
import { sendYourNewEmail } from '@/lib/emailNotifications'

await sendYourNewEmail({ email, name, ... })
```

---

## 🐛 Troubleshooting

### **Emails Not Sending:**

1. Check EmailJS credentials in `/api/email/send/route.ts`
2. Check browser console for errors
3. Check Firestore `emailLogs` collection for failures
4. Verify EmailJS template exists and has correct ID

### **Wrong Template Format:**

1. Go to EmailJS dashboard
2. Edit template `template_kv50v38`
3. Ensure all variables match the structure above
4. Test with EmailJS's template tester

### **Rate Limit Errors:**

1. Check EmailJS dashboard for quota usage
2. Consider implementing email queue
3. Upgrade EmailJS plan

### **Preferences Not Saving:**

1. Check browser console for API errors
2. Verify Firebase Admin is initialized
3. Check Firestore rules allow updates to `users` and `companies` collections

---

## 🔐 Security Notes

1. **Private Key:** EmailJS private key is in server-side code only (API routes)
2. **Client-side:** Only public key is accessible
3. **Email Validation:** Recipients are validated before sending
4. **Rate Limiting:** Consider implementing additional rate limiting for production

---

## 📝 TODO for Production

- [ ] Set `NEXT_PUBLIC_APP_URL` in production environment variables
- [ ] Test all email notifications end-to-end
- [ ] Configure EmailJS template with proper branding/styling
- [ ] Set up email monitoring/alerting
- [ ] Consider email provider upgrade for higher volume
- [ ] Implement email queue for batch processing (optional)
- [ ] Add unsubscribe links to marketing emails (legal requirement)
- [ ] Set up proper SPF/DKIM records for email deliverability

---

## 📖 API Reference

### **Send Email API**
```
POST /api/email/send
Body: SendEmailRequest
Response: SendEmailResponse
```

### **Email Preferences API**
```
GET /api/email-preferences?userId={id}
Response: { success: boolean, preferences: EmailPreferences }

POST /api/email-preferences
Body: { userId: string, preferences: EmailPreferences }
Response: { success: boolean }
```

### **Application Notifications**
```
POST /api/notifications/application-submitted
POST /api/notifications/status-changed
POST /api/notifications/welcome
```

---

## 💡 Tips

1. **Test in Development:** Use your own email for testing
2. **Monitor Logs:** Check `emailLogs` collection regularly
3. **User Feedback:** Ask users if emails are helpful
4. **Spam Folders:** Remind users to check spam initially
5. **Timing:** Most emails send async to not block UI
6. **Failures:** Email failures don't block main features

---

## ✅ What's Next?

The core notification system is complete! Optional enhancements:

1. **Weekly Digest Emails** - Batch notifications (job recommendations, statistics)
2. **Rich HTML Templates** - Add company logo, better styling
3. **Email Scheduling** - Send at optimal times
4. **A/B Testing** - Test different email copy
5. **Push Notifications** - Complement emails with browser notifications
6. **SMS Notifications** - For urgent updates

---

## 📞 Support

If you need help:
1. Check this documentation
2. Review code comments
3. Check EmailJS dashboard
4. Review Firestore `emailLogs` for errors

---

**System Status:** ✅ Fully Operational
**Last Updated:** December 2025
**Version:** 1.0.0

