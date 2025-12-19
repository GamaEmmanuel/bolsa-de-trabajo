# 🧪 Test Gmail Email Sending

## ✅ Setup Complete!

Your Gmail API credentials are now configured. Let's test!

---

## 🧪 **Testing Steps:**

### **Step 1: Start Dev Server**

```bash
npm run dev
```

### **Step 2: Open Browser Console**

- Press `F12` or `Cmd+Option+I`
- Go to "Console" tab

### **Step 3: Apply to a Job**

1. Navigate to any job posting
2. Click "Aplicar"

### **Step 4: Check Console Output**

**You should see:**
```
📧 Sending email notifications via Gmail API...
📧 Attempting to send email via Gmail API: {to: 'candidate@example.com', ...}
✅ Email sent successfully via Gmail: message_id_here
📝 Email logged to Firestore
✅ Candidate email sent successfully

📧 Attempting to send email via Gmail API: {to: 'company@example.com', ...}
✅ Email sent successfully via Gmail: message_id_here
📝 Email logged to Firestore
✅ Company email sent successfully
```

### **Step 5: Check Emails**

**Candidate inbox:**
- ✅ Should receive email from: **Meserea <mesereamx@gmail.com>**
- ✅ Subject: "✅ Aplicación enviada - [Job Title]"
- ✅ Clean HTML design

**Company inbox:**
- ✅ Should receive email from: **Meserea <mesereamx@gmail.com>**
- ✅ Subject: "📥 Nueva Aplicación Recibida - [Job Title]"
- ✅ Clean HTML design

---

## ✅ **Success Indicators:**

- ✅ Console shows "Email sent successfully via Gmail"
- ✅ Emails arrive within 5-10 seconds
- ✅ From address is: mesereamx@gmail.com
- ✅ No "undefined" or corrupted text
- ✅ Buttons work and link to meserea.com
- ✅ No errors in console

---

## ⚠️ **Troubleshooting:**

### **Error: "Gmail API not configured"**

**Check:** `.env.local` has all 4 Gmail variables

**Solution:** Make sure you restarted dev server after adding credentials

### **Error: "invalid_grant"**

**Cause:** Refresh token expired or invalid

**Solution:** Run `node scripts/get-gmail-token.js` again

### **Error: "insufficient permission"**

**Cause:** Gmail API not enabled or wrong scope

**Solution:**
1. Go to: https://console.cloud.google.com/apis/library
2. Search: "Gmail API"
3. Click "Enable"

### **Emails Go to Spam**

**Normal for new sending accounts!**

**Solutions:**
- Recipients mark as "Not Spam"
- Set up SPF/DKIM records (advanced)
- Use for a few weeks to build reputation

---

## 🎯 **Expected Results:**

### **Console:**
```javascript
📧 Sending email notifications via Gmail API...
📧 Sending candidate email to: candidate@example.com
📧 Attempting to send email via Gmail API
✅ Email sent successfully via Gmail: 18d9f2a3b4c5d6e7
📝 Email logged to Firestore
✅ Candidate email sent successfully
```

### **Email:**
```
From: Meserea <mesereamx@gmail.com>
To: candidate@example.com
Subject: ✅ Aplicación enviada - Chef de Cocina

[Beautiful HTML email with gradient header]
```

---

## 📊 **Test Preference Checking:**

### **Test 1: Disable Candidate Preferences**

1. Sign in as candidate
2. Go to: `/candidate/account`
3. Scroll to: "Preferencias de Email"
4. **Uncheck:** "Application Submitted"
5. Apply to a job
6. **Expected:** Console shows "⏭️ Candidate email skipped - user preferences disabled"
7. **Expected:** No email received ✅

### **Test 2: Disable Company Preferences**

1. Sign in as company
2. Go to: `/company/settings`
3. Scroll to: "Preferencias de Email"
4. **Uncheck:** "Nuevas Aplicaciones"
5. Have someone apply to your job
6. **Expected:** Console shows "⏭️ Company email skipped - user preferences disabled"
7. **Expected:** Company doesn't receive email ✅

---

## ✅ **If Everything Works:**

You're done! 🎉

**What you have:**
- ✅ Emails from mesereamx@gmail.com
- ✅ 500 emails/day quota
- ✅ No domain restrictions
- ✅ Preference checking working
- ✅ Beautiful HTML emails
- ✅ Works in production

---

## 🚀 **Deploy to Production:**

Once tested locally, add credentials to Firebase Functions:

```bash
firebase functions:config:set gmail.client_id="679742411599-caomjvhg5jkkbe2d01t83f2l8qlkfjc0.apps.googleusercontent.com"
firebase functions:config:set gmail.client_secret="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"
firebase functions:config:set gmail.refresh_token="1//06KqrUQ4_cF8uCgYIARAAGAYSNwF-L9Irt5NUtVleEh0gdaDcOg3afnRNH9JcmpOZTHWFZeJA6VFyaTFLcndddOpFgcZ58kswgSE"
firebase functions:config:set gmail.user_email="mesereamx@gmail.com"

firebase deploy --only functions
```

---

**Start your dev server and test now!** 🚀

```bash
npm run dev
```

Then apply to a job and check the console + your email inbox!

