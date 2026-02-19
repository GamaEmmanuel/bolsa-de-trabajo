# 🚨 Quick Start: Critical Security Fixes

**Time Required:** ~30 minutes
**Priority:** DO THIS BEFORE LAUNCHING

---

## 🎯 What You Need to Do Right Now

### 1. Create Environment Variables File (5 minutes)

```bash
# Copy the example file
cp .env.example .env.local

# Open it in your editor
# Fill in all the values marked as "your-..."
```

**Required values:**
- All Firebase config (you already have these)
- Stripe keys (you already have these)
- **NEW:** EmailJS keys (see step 2)
- Gmail API keys (if using Gmail for emails)
- App URL (your production domain)

### 2. Rotate EmailJS Keys (10 minutes)

**Why?** Your EmailJS private key was exposed in the code.

**Steps:**

1. **Go to EmailJS Dashboard:**
   - Visit: https://dashboard.emailjs.com/
   - Log in with your account

2. **Create New Keys:**
   - Go to "Account" → "API Keys"
   - Click "Create New Private Key"
   - Copy the new private key
   - Note your Service ID and Template ID

3. **Update .env.local:**
   ```bash
   EMAILJS_SERVICE_ID=your-service-id
   EMAILJS_TEMPLATE_ID=your-template-id
   EMAILJS_PUBLIC_KEY=your-public-key
   EMAILJS_PRIVATE_KEY=your-NEW-private-key
   ```

4. **Delete Old Key:**
   - In EmailJS dashboard, delete the old private key
   - This prevents anyone from using the exposed key

### 3. Update Dependencies (5 minutes)

```bash
# Update all packages
npm update

# Fix security vulnerabilities
npm audit fix

# Check if Next.js updated
npm list next
```

### 4. Test Locally (5 minutes)

```bash
# Start the dev server
npm run dev

# Test these features:
# - Sign in/Sign up
# - Send an email (application notification)
# - Create a job posting
# - Make sure everything works
```

### 5. Deploy to Production (5 minutes)

**If using Vercel:**

1. Go to your Vercel dashboard
2. Go to Project Settings → Environment Variables
3. Add all variables from your `.env.local`:
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID`
   - `EMAILJS_PUBLIC_KEY`
   - `EMAILJS_PRIVATE_KEY`
   - All other required variables
4. Redeploy your app

**If using other hosting:**
- Add environment variables to your hosting platform
- Redeploy

---

## ✅ Verification Checklist

After completing the steps above, verify:

- [ ] `.env.local` file created with all values filled in
- [ ] Old EmailJS private key deleted from dashboard
- [ ] New EmailJS keys added to `.env.local`
- [ ] App runs locally without errors
- [ ] Email sending works locally
- [ ] All environment variables added to production
- [ ] App deployed to production
- [ ] Email sending works in production
- [ ] No errors in production logs

---

## 🔍 Quick Tests

### Test 1: Environment Variables
```bash
node scripts/validate-env.js
```
Should show all green checkmarks.

### Test 2: No Secrets in Code
```bash
grep -r "dNgbSgz45xOHH5tbn" src/
grep -r "Eo8kdyuTIvbpl1345mph" src/
```
Should return nothing (empty).

### Test 3: Email Sending
1. Sign up as a new user
2. Apply to a job
3. Check if you receive the email
4. Check if the company receives the email

---

## 🆘 Troubleshooting

### "Email not sending"
- Check `.env.local` has correct EmailJS keys
- Check EmailJS dashboard for error logs
- Check browser console for errors
- Verify the new keys are active

### "Environment variable not found"
- Make sure `.env.local` is in the root directory
- Restart your dev server after adding variables
- Check variable names match exactly (case-sensitive)

### "Still seeing old keys in code"
- Run: `git diff src/app/api/email/send/route.ts`
- Should show environment variables being used
- If not, the file wasn't saved properly

---

## 📞 Need Help?

1. **Check the logs:**
   ```bash
   # Local development
   npm run dev
   # Check terminal output

   # Production
   # Check Vercel logs or your hosting platform logs
   ```

2. **Review documentation:**
   - `PRE_LAUNCH_CHECKLIST.md` - Complete checklist
   - `SECURITY_FIXES_REQUIRED.md` - Detailed security guide
   - `.env.example` - All required variables

3. **Common issues:**
   - Forgot to restart dev server after adding env vars
   - Typo in environment variable names
   - Old keys still in EmailJS dashboard
   - Production env vars not deployed

---

## 🎯 After These Fixes

You'll have:
- ✅ No exposed secrets in code
- ✅ Secure environment variable management
- ✅ Updated dependencies
- ✅ Working email system

**Next steps:**
1. Review `PRE_LAUNCH_CHECKLIST.md` for additional improvements
2. Set up error monitoring (Sentry)
3. Add rate limiting to APIs
4. Enable Firebase App Check

---

## ⏱️ Timeline

- **Now:** Fix critical security issues (this guide) - 30 min
- **Today:** Review and fix high-priority items - 2-3 hours
- **This Week:** Complete all checklist items - 4-6 hours
- **Launch:** When all critical and high-priority items are done

---

**Remember:** It's better to spend an extra day securing your app than to launch with vulnerabilities! 🔒

**Good luck! You've got this! 💪**

