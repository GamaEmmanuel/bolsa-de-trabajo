# 🔍 Production Email Debug Guide

## ❓ Why Emails Work in Dev but Not Production

Common reasons:

### **1. EmailJS Domain Restrictions** ⭐ (Most Common)

EmailJS might block your production domain by default.

**Check This:**
1. Go to: https://dashboard.emailjs.com/admin/account
2. Look for "Allowed Origins" or "Allowed Domains"
3. Make sure `meserea.com` and `jobportal-4b561.web.app` are allowed
4. If not, add them!

**Default Behavior:**
- ✅ `localhost` is always allowed
- ❌ Production domains must be explicitly added

---

### **2. Browser Console Errors**

**Action Required:** Check browser console in production!

1. Go to: https://meserea.com (or your production URL)
2. Open Console: `F12` or `Cmd+Option+I`
3. Apply to a job
4. Look for errors

**Common Errors:**

#### **"Access to XMLHttpRequest blocked by CORS"**
```
Access to XMLHttpRequest at 'https://api.emailjs.com/api/v1.0/email/send'
from origin 'https://meserea.com' has been blocked by CORS policy
```

**Solution:** Add meserea.com to EmailJS allowed origins

#### **"Service ID is incorrect" / "Template ID is incorrect"**
```
EmailJS error: The service ID is incorrect
```

**Solution:** Verify IDs in EmailJS dashboard match your code

#### **"Public key is incorrect"**
```
EmailJS error: The public key is incorrect
```

**Solution:** Check public key in dashboard matches code

#### **"Monthly quota exceeded"**
```
EmailJS error: Monthly quota exceeded
```

**Solution:** Upgrade EmailJS plan or wait for reset

---

### **3. EmailJS Configuration in Dashboard**

**Check These Settings:**

1. **Go to:** https://dashboard.emailjs.com/admin

2. **Check Service:**
   - Click "Email Services"
   - Verify service ID: `job-portal`
   - Status should be: Active ✅

3. **Check Template:**
   - Click "Email Templates"
   - Find: `template_kv50v38`
   - Status should be: Active ✅

4. **Check Account:**
   - Click "Account"
   - Check "Allowed Origins"
   - Add: `https://meserea.com`
   - Add: `https://jobportal-4b561.web.app`

---

### **4. Build/Bundle Issues**

**Check if emailjs library is loaded:**

In production console, type:
```javascript
window.emailjs
```

**Should return:** `Object` with emailjs methods

**If undefined:**
- EmailJS library didn't load
- Check for build errors
- Verify `@emailjs/browser` is in dependencies

---

### **5. Environment Variables**

Check if `NEXT_PUBLIC_APP_URL` is set correctly:

In production console:
```javascript
window.location.origin
```

Should return: `https://meserea.com`

---

## 🧪 **Debugging Steps:**

### **Step 1: Check Production Console**

Go to production site and open console. Look for:

**Good Signs:**
```
📧 EmailJS initialized with public key
📧 Attempting to send email with data: {...}
✅ Email sent successfully
```

**Bad Signs:**
```
❌ Email send failed: ...
CORS error
Access blocked
```

### **Step 2: Test EmailJS Directly in Production**

Open production console and run:
```javascript
emailjs.send(
  'job-portal',
  'template_kv50v38',
  {
    to_email: 'test@example.com',
    to_name: 'Test',
    subject: 'Test',
    title: 'Test',
    greeting: 'Hello',
    main_message: 'Testing',
    company_name: 'HR Portal'
  },
  'dNgbSgz45xOHH5tbn'
)
.then(response => console.log('✅ Test worked:', response))
.catch(error => console.error('❌ Test failed:', error))
```

This will tell you exactly what's wrong!

---

## 📋 **Checklist:**

- [ ] Check EmailJS dashboard for allowed origins
- [ ] Add `meserea.com` to allowed origins
- [ ] Add `jobportal-4b561.web.app` to allowed origins
- [ ] Verify service ID is active
- [ ] Verify template ID is active
- [ ] Check quota (not exceeded)
- [ ] Test emailjs directly in production console
- [ ] Check browser console for specific errors

---

## 🎯 **Most Likely Fix:**

**Go to EmailJS Dashboard → Account → Allowed Origins**

Add:
- `https://meserea.com`
- `https://jobportal-4b561.web.app`
- `http://localhost:3000` (if not already there)

Save and test again!

---

## 📞 **Next Steps:**

1. **Check production browser console** - What error do you see?
2. **Share the exact error message**
3. **Check EmailJS allowed origins**
4. **Test emailjs directly** in production console

**Let me know what error you see in the production console!**

