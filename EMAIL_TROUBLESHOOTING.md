# 🔧 Email System Troubleshooting

## ⚠️ Issue Fixed: Emails Not Being Sent

### **Problem:**
After switching to server-side API route, no emails were being sent to candidates or companies.

### **Root Cause:**
The server-side API route requires Firebase Admin to be properly initialized with service account credentials, which wasn't configured.

### **Solution:**
Reverted to **client-side email sending** (which works reliably) with the addition of company emails.

---

## ✅ Current Working Setup

### **How It Works Now:**

```
1. Candidate applies to job
   ↓
2. Application saved to Firestore
   ↓
3. CLIENT-SIDE emails sent directly via EmailJS:

   📧 Candidate Email:
   ├─ Uses: sendEmailFromBrowser()
   ├─ Template: buildApplicationSubmittedTemplate()
   └─ Sends: "✅ Aplicación enviada" confirmation

   📧 Company Email:
   ├─ Fetches company email from Firestore (users collection)
   ├─ Uses: sendEmailFromBrowser()
   ├─ Template: buildNewApplicationReceivedTemplate()
   └─ Sends: "📥 Nueva Aplicación Recibida" notification
```

---

## 🧪 Testing Steps

### **Open Browser Console First!**
Press `F12` or `Cmd+Option+I` to open DevTools

### **Apply to a Job:**

1. Navigate to any job posting
2. Click "Aplicar"
3. Watch the console output

### **Expected Console Output:**

```
📧 Sending candidate email to: candidate@example.com
📧 EmailJS initialized with public key
📧 Attempting to send email with data: {...}
✅ Email sent successfully
✅ Candidate email sent successfully

📧 Sending company email to: company@example.com
📧 Attempting to send email with data: {...}
✅ Email sent successfully
✅ Company email sent successfully
```

### **If You See Errors:**

#### **Error: "Company email not found in user document"**
```
⚠️ Company email not found in user document
```

**Solution:**
- The company user document doesn't have an email field
- Check Firestore: `users/{companyId}` → should have `email` field
- Make sure company signed up with an email address

#### **Error: "Company user document not found"**
```
⚠️ Company user document not found for companyId: xyz123
```

**Solution:**
- The job's `companyId` doesn't match any user in Firestore
- Check the job document in `jobPostings` collection
- Verify the `companyId` field matches a user ID

#### **Error: "EmailJS error: The service ID is incorrect"**
```
❌ Email send failed: The service ID is incorrect
```

**Solution:**
- Check EmailJS dashboard: https://dashboard.emailjs.com/
- Verify service ID is exactly: `job-portal`
- Update in `src/lib/emailClient.ts` if different

#### **Error: "EmailJS error: The template ID is incorrect"**
```
❌ Email send failed: The template ID is incorrect
```

**Solution:**
- Check EmailJS dashboard templates
- Verify template ID is: `template_kv50v38`
- Make sure template is not deleted

#### **Error: "EmailJS error: Monthly quota exceeded"**
```
❌ Email send failed: Monthly quota exceeded
```

**Solution:**
- You've sent more than 200 emails this month (free tier)
- Upgrade EmailJS plan or wait until next month
- Consider switching to SendGrid or AWS SES

---

## 🔍 Debugging Checklist

### **1. Check EmailJS Configuration**

```bash
# In browser console after page loads:
console.log('EmailJS initialized:', window.emailjs !== undefined)
```

### **2. Verify Environment Variables**

```bash
# Check .env.local exists:
cat .env.local

# Should contain:
NEXT_PUBLIC_APP_URL=https://meserea.com
```

### **3. Check Firestore Data**

**Job Document:**
```
Collection: jobPostings
Document: {jobId}
Required fields:
  - jobTitle: "Chef de Cocina"
  - companyId: "abc123xyz" ← Must match a user ID
  - companyName: "Restaurant XYZ"
```

**Company User Document:**
```
Collection: users
Document: {companyId}
Required fields:
  - email: "company@example.com" ← REQUIRED for company emails!
  - (other user fields...)
```

### **4. Test EmailJS Directly**

Open browser console and run:
```javascript
emailjs.send(
  'job-portal',
  'template_kv50v38',
  {
    to_email: 'test@example.com',
    to_name: 'Test User',
    subject: 'Test Email',
    title: 'Testing',
    greeting: 'Hello!',
    main_message: 'This is a test',
    company_name: 'HR Portal'
  },
  'dNgbSgz45xOHH5tbn'
)
.then(() => console.log('✅ Test email sent'))
.catch(err => console.error('❌ Test failed:', err))
```

---

## 📊 Email Logs

All emails are logged to Firestore for debugging:

**Collection:** `emailLogs`

**Check Recent Logs:**
```javascript
// In Firestore console, query:
emailLogs
  .orderBy('sentAt', 'desc')
  .limit(10)
```

**Look For:**
- `status: 'sent'` - Email sent successfully ✅
- `status: 'failed'` - Email failed, check `error` field ❌

---

## ⚙️ Email Preferences (Future Enhancement)

**Note:** Email preferences are currently **NOT checked** in the client-side approach.

**To Enable Preference Checking:**

You would need to:
1. Fetch user preferences from Firestore before sending
2. Check the relevant preference field
3. Skip email if disabled

**Example:**
```typescript
// Before sending candidate email:
const userDoc = await getDoc(doc(db, 'users', user.uid))
const prefs = userDoc.data()?.emailPreferences
if (prefs?.applicationSubmitted === false) {
  console.log('⏭️ Skipping email - user preference disabled')
  return
}
```

For now, all emails are sent without preference checking (simpler, more reliable).

---

## 🚀 Production Considerations

### **Before Going Live:**

1. ✅ Test with real email addresses
2. ✅ Verify EmailJS quota (200 emails/month free tier)
3. ⚠️ Consider upgrading EmailJS or switching to:
   - SendGrid (99K free emails/month)
   - AWS SES (62K free emails/month)
   - Mailgun (5K free emails/month)
4. ✅ Set up proper error monitoring
5. ✅ Add email preference checking if required for compliance

### **Scaling Up:**

If you need more than 200 emails/month:

**Option 1: Upgrade EmailJS**
- $15/month for 5,000 emails
- Simple, no code changes needed

**Option 2: Switch to SendGrid**
- Free tier: 100 emails/day (3K/month)
- Requires code changes but more reliable
- Better deliverability

**Option 3: AWS SES**
- $0.10 per 1,000 emails after free tier
- Most cost-effective at scale
- Requires AWS account setup

---

## 📞 Need Help?

**Check These Files:**
- `src/lib/emailClient.ts` - Client-side email sending
- `src/lib/emailTemplates.ts` - Email template builders
- `src/app/jobs/[jobId]/page.tsx` - Application flow
- `EMAIL_DEBUG_STEPS.md` - Detailed debugging guide

**Common Issues:**
1. Emails not sending → Check console for EmailJS errors
2. Company not receiving → Check Firestore for company email
3. Rate limited → Check EmailJS quota
4. Wrong content → Check EmailJS template configuration

---

## ✅ Success Criteria

**You know it's working when:**
- ✅ Candidate receives email within 30 seconds
- ✅ Company receives email within 30 seconds
- ✅ Console shows "✅ Email sent successfully" for both
- ✅ EmailJS dashboard shows sent emails
- ✅ Firestore `emailLogs` collection has new entries

---

**Last Updated:** After fixing the server-side API issue by reverting to reliable client-side sending.

