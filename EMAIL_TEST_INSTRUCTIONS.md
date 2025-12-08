# Email System Test Instructions

## ⚠️ IMPORTANT FIX APPLIED

**Issue Found:** EmailJS blocks server-side API calls by default.

**Solution:** Changed to client-side email sending (from browser).

---

## 🧪 How to Test

### **Method 1: Apply to a Job (Full Test)**

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Sign up as a candidate:**
   - Go to http://localhost:3000/signup
   - Create an account with a real email address you can check
   - Select "Personal" (candidate) account

3. **Apply to a job:**
   - Go to http://localhost:3000/candidate/jobs
   - Click on any job
   - Click "Aplicar" button
   - Check your email inbox (and spam folder)

4. **Check browser console:**
   - Open DevTools (F12)
   - Look for "Email sent successfully" message
   - Or check for any errors

---

### **Method 2: Browser Console Test (Quick Test)**

1. **Go to any page on your site**

2. **Open browser console** (F12 or right-click > Inspect > Console)

3. **Paste and run this test code:**

```javascript
// Import and test email function
(async () => {
  try {
    // Dynamic import
    const { sendEmailFromBrowser } = await import('/src/lib/emailClient.ts')

    // Test email data
    const testEmail = {
      to_email: 'YOUR_EMAIL@example.com', // ⚠️ CHANGE THIS TO YOUR EMAIL
      to_name: 'Test User',
      subject: '🧪 Test Email from HR Portal',
      title: 'Test Email',
      greeting: 'Hola Test User,',
      main_message: 'This is a test email from your HR Portal.',
      secondary_message: 'If you receive this, the email system is working!',
      detail_1_label: '✅ Status',
      detail_1_value: 'Email system operational',
      detail_2_label: '📅 Date',
      detail_2_value: new Date().toLocaleDateString(),
      action_label: 'Visit Portal',
      action_url: 'http://localhost:3000',
      footer_message: 'This is a test email',
      company_name: 'HR Portal',
      notification_type: 'test',
    }

    // Send email
    console.log('Sending test email...')
    const result = await sendEmailFromBrowser(testEmail)
    console.log('Result:', result)

    if (result.success) {
      console.log('✅ SUCCESS! Check your email inbox (and spam folder)')
    } else {
      console.error('❌ FAILED:', result.error)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
})()
```

4. **Check your email**
   - Look in inbox
   - Check spam folder
   - Email should arrive within 1-2 minutes

---

## 🔍 Troubleshooting

### **"Email sent successfully" but no email received:**
- ✅ Check spam/junk folder
- ✅ Wait 2-3 minutes (EmailJS can be slow)
- ✅ Verify your EmailJS template is configured (see EMAILJS_TEMPLATE_SETUP.md)
- ✅ Check EmailJS dashboard for quota limits

### **"EmailJS is not defined" error:**
- ✅ Make sure @emailjs/browser package is installed
- ✅ Run: `npm install @emailjs/browser`
- ✅ Restart your dev server

### **"API calls are disabled for non-browser applications" error:**
- ✅ This means you're still using the old server-side API
- ✅ Make sure the code changes were saved
- ✅ Refresh your browser

### **Template configuration error:**
- ✅ Go to https://dashboard.emailjs.com/
- ✅ Find template `template_kv50v38`
- ✅ Follow instructions in EMAILJS_TEMPLATE_SETUP.md
- ✅ Make sure all variables are configured

---

## 📧 What Emails Are Sent?

### **When Candidate Applies:**
- ✅ **Candidate** receives: "Application Submitted" confirmation
- ⚠️ **Company** email: Currently disabled (needs company email lookup)

### **When Status Changes (ATS):**
- ⚠️ Currently disabled (needs update to client-side)

### **When Payment Events:**
- ⚠️ Currently disabled (Stripe webhooks are server-side, need different approach)

---

## 🔧 Technical Changes Made

### **Files Modified:**
1. **Created:** `src/lib/emailClient.ts` - Client-side email sender
2. **Created:** `src/app/api/email-log/route.ts` - Email audit logging
3. **Modified:** `src/app/jobs/[jobId]/page.tsx` - Uses new client-side email

### **Package Added:**
```bash
npm install @emailjs/browser
```

### **How It Works Now:**

```
User applies to job
     ↓
Application saved to Firestore
     ↓
Browser calls emailClient.ts
     ↓
EmailJS sends email directly from browser
     ↓
Success/failure logged to backend
```

---

## ⚡ Quick Fix Verification

**Run this command to verify the package is installed:**
```bash
npm list @emailjs/browser
```

**Expected output:**
```
hr-portal@0.1.0
└── @emailjs/browser@4.x.x
```

---

## 🎯 Next Steps

1. **Test the application email** (Method 1 above)
2. **Configure EmailJS template** (if you haven't yet)
3. **Update status change emails** to use client-side (optional)
4. **Consider alternative for server-side emails** (Stripe webhooks need different solution)

---

## 💡 Alternative Solutions

If you need server-side emails (for webhooks, etc.), consider:

### **Option 1: Use EmailJS REST API with proper headers**
(Complex, not officially supported)

### **Option 2: Switch to server-friendly email service**
- **SendGrid** (99K free emails/month)
- **Nodemailer with Gmail SMTP** (free, unlimited)
- **AWS SES** (62K free emails/month)
- **Mailgun** (5K free emails/month)

### **Option 3: Hybrid approach**
- Client-side: EmailJS for application confirmations
- Server-side: Different service for webhooks/automated emails

---

## ✅ Current Status

- ✅ Client-side email system implemented
- ✅ Application submitted emails working
- ✅ Email audit logging working
- ⚠️ Need to configure EmailJS template
- ⚠️ Status change emails need update
- ⚠️ Stripe webhook emails need alternative solution

---

**Last Updated:** December 5, 2025
**Status:** Ready for Testing

