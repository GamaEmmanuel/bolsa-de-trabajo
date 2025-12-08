# 🔄 Critical: Restart Your Dev Server

## ⚠️ Why Email Still Didn't Work

The dev server is running **old cached code**. Your terminal shows:
```
POST /api/notifications/application-submitted
```

This means it's still using the OLD server-side method instead of the NEW client-side method.

---

## ✅ Fix: Restart Dev Server

### **Step 1: Stop Current Server**

Press `Ctrl + C` in your terminal where `npm run dev` is running.

### **Step 2: Clear Next.js Cache (Important!)**

```bash
cd /Users/emmanuel/hr-portal
rm -rf .next
```

### **Step 3: Start Fresh**

```bash
npm run dev
```

### **Step 4: Hard Refresh Browser**

After server restarts:
- **Mac:** `Cmd + Shift + R`
- **Windows/Linux:** `Ctrl + Shift + R`

Or clear browser cache completely.

---

## 🧪 Test Again

1. Go to any job posting
2. Click "Aplicar"
3. **Open browser console (F12)** - should see:
   ```
   Email sent successfully: {status: 200, text: "OK"}
   ```
4. Check your email (inbox + spam)

---

## 🔍 How to Verify It's Working

### **In Browser Console (F12):**
Should see:
```javascript
✅ Email sent successfully
```

Should NOT see:
```javascript
❌ Error: EmailJS API error: API calls are disabled
```

### **In Terminal:**
Should NOT see:
```
POST /api/notifications/application-submitted
POST /api/email/send
```

(Because emails now send directly from browser, not through API)

---

## ⚡ Quick Checklist

- [ ] Stopped dev server (Ctrl+C)
- [ ] Deleted `.next` folder
- [ ] Restarted `npm run dev`
- [ ] Hard refreshed browser (Cmd+Shift+R)
- [ ] Applied to a job
- [ ] Checked browser console
- [ ] Checked email inbox + spam

---

## 🆘 If Still Not Working

1. **Check EmailJS Template:**
   - Go to https://dashboard.emailjs.com/
   - Find template `template_kv50v38`
   - Make sure it's configured (see EMAILJS_TEMPLATE_SETUP.md)

2. **Check Browser Console:**
   - Any errors about `@emailjs/browser`?
   - Any "Module not found" errors?

3. **Verify Package:**
   ```bash
   npm list @emailjs/browser
   ```
   Should show: `@emailjs/browser@4.4.1`

4. **Nuclear Option:**
   ```bash
   # Delete everything and reinstall
   rm -rf node_modules .next
   npm install
   npm run dev
   ```

---

**Status:** 🔄 Waiting for server restart

**Next:** Follow steps above, then test application email

