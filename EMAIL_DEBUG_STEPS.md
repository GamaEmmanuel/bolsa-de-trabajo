# 🔍 Email Debug Steps

## Current Issue: Email Send Failed

The email is attempting to send but failing with an empty error `{}`. This usually means one of these issues:

---

## ⚡ Quick Test (Do This First!)

### **Step 1: Refresh Browser**
Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)

### **Step 2: Open Console Before Applying**
Press `F12` → Console tab → Keep it open

### **Step 3: Apply to Job**
Click "Aplicar" and watch the console output

### **Step 4: Look for These New Debug Messages:**

**✅ You should see:**
```
📧 EmailJS initialized with public key
📧 Attempting to send email with data: {to: "email@example.com", ...}
📋 EmailJS Config: {serviceId: "job-portal", templateId: "template_kv50v38", publicKey: "Set ✓"}
```

**Then either:**
```
✅ Email sent successfully: {status: 200, text: "OK"}
```

**OR you'll see detailed error:**
```
❌ Email send failed: ...
❌ Error details: {message: "...", text: "...", status: ..., name: "..."}
```

---

## 🔍 Common Error Messages & Solutions

### **Error: "The service ID is incorrect"**
**Problem:** Service ID `job-portal` doesn't exist in your EmailJS account

**Solution:**
1. Go to https://dashboard.emailjs.com/admin
2. Click "Email Services"
3. Check your service name - it should be exactly `job-portal`
4. If different, update `EMAILJS_SERVICE_ID` in `src/lib/emailClient.ts`

---

### **Error: "The template ID is incorrect"**
**Problem:** Template `template_kv50v38` doesn't exist or is deleted

**Solution:**
1. Go to https://dashboard.emailjs.com/admin/templates
2. Look for template ID: `template_kv50v38`
3. If missing, create it following `EMAILJS_TEMPLATE_SETUP.md`
4. If different ID, update `EMAILJS_TEMPLATE_ID` in `src/lib/emailClient.ts`

---

### **Error: "The public key is incorrect"**
**Problem:** Public key doesn't match your account

**Solution:**
1. Go to https://dashboard.emailjs.com/admin/account
2. Find your **Public Key** (not private key!)
3. Copy it
4. Update `EMAILJS_PUBLIC_KEY` in `src/lib/emailClient.ts`

---

### **Error: "Monthly quota exceeded"**
**Problem:** You've sent more than 200 emails this month (free tier limit)

**Solution:**
1. Go to https://dashboard.emailjs.com/admin
2. Check "Emails Sent" counter
3. Either wait until next month or upgrade plan
4. Or switch to different email service

---

### **Error: "Template variables missing"**
**Problem:** EmailJS template expects variables that weren't provided

**Solution:**
1. Check `EMAILJS_TEMPLATE_SETUP.md` for required variables
2. Make sure your template has all the `{{variable}}` placeholders
3. Verify template is saved properly

---

### **Error: "CORS error" or "Network error"**
**Problem:** Browser blocking request

**Solution:**
1. Check if you're on `localhost:3000` (should work)
2. Try disabling browser extensions
3. Try in incognito/private mode
4. Check EmailJS dashboard → Settings → Security

---

## 🧪 Manual Test in Console

If errors continue, test EmailJS directly in browser console:

```javascript
// Copy/paste this in browser console (F12)
(async () => {
  const emailjs = (await import('@emailjs/browser')).default

  // Initialize
  emailjs.init('dNgbSgz45xOHH5tbn')

  // Test send
  try {
    const result = await emailjs.send(
      'job-portal',              // Service ID
      'template_kv50v38',         // Template ID
      {
        to_email: 'YOUR_EMAIL@example.com',  // CHANGE THIS!
        to_name: 'Test User',
        subject: 'Test Email',
        title: 'Test',
        greeting: 'Hello Test',
        main_message: 'This is a test',
        footer_message: 'Test footer',
        company_name: 'HR Portal',
      },
      'dNgbSgz45xOHH5tbn'        // Public key
    )
    console.log('✅ Success!', result)
  } catch (error) {
    console.error('❌ Failed:', error)
  }
})()
```

---

## 📊 Verify EmailJS Account Settings

1. **Go to EmailJS Dashboard:**
   https://dashboard.emailjs.com/admin

2. **Check Email Services:**
   - Click "Email Services"
   - Should have a service named `job-portal`
   - Should be connected (green checkmark)
   - If not, click "Add New Service" and connect your email

3. **Check Email Templates:**
   - Click "Email Templates"
   - Should have template `template_kv50v38`
   - Click "Edit" to verify it has content
   - Make sure Subject is `{{subject}}`

4. **Check Account Status:**
   - Click "Account" tab
   - Check "Emails Sent" counter (max 200/month free)
   - Verify account is active (not suspended)

5. **Check Public Key:**
   - In "Account" tab
   - Find "Public Key" section
   - Should be: `dNgbSgz45xOHH5tbn`
   - If different, update in code

---

## 🎯 Step-by-Step Debug Process

1. ✅ Refresh browser
2. ✅ Open console (F12)
3. ✅ Apply to job
4. ✅ Copy ALL console output
5. ✅ Check EmailJS dashboard for error logs
6. ✅ Try manual test (see above)
7. ✅ Report back with:
   - Full console output
   - EmailJS dashboard status
   - Manual test result

---

## 🆘 Last Resort: Simple HTML Test

Create a test file: `test-email.html`

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
    <script>
        emailjs.init('dNgbSgz45xOHH5tbn');
    </script>
</head>
<body>
    <h1>EmailJS Test</h1>
    <button onclick="testEmail()">Send Test Email</button>
    <div id="result"></div>

    <script>
        async function testEmail() {
            const result = document.getElementById('result');
            result.textContent = 'Sending...';

            try {
                const response = await emailjs.send(
                    'job-portal',
                    'template_kv50v38',
                    {
                        to_email: 'YOUR_EMAIL@example.com',
                        to_name: 'Test',
                        subject: 'Test',
                        title: 'Test',
                        greeting: 'Test',
                        main_message: 'Test message',
                        footer_message: 'Test',
                        company_name: 'Test',
                    }
                );
                result.textContent = 'SUCCESS: ' + JSON.stringify(response);
            } catch (error) {
                result.textContent = 'ERROR: ' + JSON.stringify(error);
            }
        }
    </script>
</body>
</html>
```

Open this file in browser and click the button. If this works, issue is in our Next.js integration.

---

**Next Action:** Try again and report the FULL console output including the new debug messages!

