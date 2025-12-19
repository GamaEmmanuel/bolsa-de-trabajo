# 🔐 Get Gmail Refresh Token - Instructions

## ✅ **Implementation Complete!**

All code is ready. Now you just need to get the refresh token from Google.

---

## 📋 **Step-by-Step Instructions:**

### **Step 1: Stop Your Dev Server**

If `npm run dev` is running, stop it (Ctrl+C)

**Why:** The OAuth script needs port 3000

---

### **Step 2: Run the OAuth Setup Script**

```bash
node scripts/get-gmail-token.js
```

---

### **Step 3: What Will Happen:**

1. **Script starts** and shows:
   ```
   🔐 Gmail API OAuth Setup
   📋 Step 1: Authorize this app by visiting this URL:

   https://accounts.google.com/o/oauth2/auth?...

   🌐 Local server started on http://localhost:3000
   🔄 Opening browser for authentication...
   ```

2. **Browser opens automatically** (or copy the URL manually)

3. **Google sign-in page appears:**
   - Sign in with: **mesereamx@gmail.com**
   - Click "Continue"

4. **Permission screen:**
   - Shows: "HR Portal wants to send emails on your behalf"
   - Click "Allow"

5. **Redirected to success page:**
   - Shows: "✅ Gmail API Setup Complete!"

6. **Check your terminal:**
   - Will show the refresh token
   - Will show the exact lines to add to .env.local

---

### **Step 4: Copy the Refresh Token**

Terminal will show:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 SAVE THIS REFRESH TOKEN:

1//0gXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Add this to your .env.local file:

GMAIL_CLIENT_ID="YOUR_CLIENT_ID_FROM_GOOGLE_CLOUD"
GMAIL_CLIENT_SECRET="YOUR_CLIENT_SECRET_FROM_GOOGLE_CLOUD"
GMAIL_REFRESH_TOKEN="YOUR_REFRESH_TOKEN_FROM_OAUTH_FLOW"
GMAIL_USER_EMAIL="your-email@gmail.com"

✅ Setup complete! You can close this window.
```

---

### **Step 5: Add to .env.local**

Open `.env.local` and add the 4 lines shown in the terminal:

```bash
GMAIL_CLIENT_ID="..."
GMAIL_CLIENT_SECRET="..."
GMAIL_REFRESH_TOKEN="..."
GMAIL_USER_EMAIL="mesereamx@gmail.com"
NEXT_PUBLIC_APP_URL=https://meserea.com
```

**Save the file!**

---

### **Step 6: Test Locally**

```bash
# Start dev server
npm run dev

# Go to your app
# Apply to a job
# Check console for:
✅ Email sent successfully via Gmail
```

---

## ⚠️ **Troubleshooting:**

### **Error: "Port 3000 is already in use"**

**Solution:** Stop your dev server first:
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Then run the script again
node scripts/get-gmail-token.js
```

### **Error: "Access blocked: This app's request is invalid"**

**Solution:** Check OAuth consent screen:
1. Go to Google Cloud Console
2. OAuth consent screen
3. Make sure status is "Published" or "Testing"
4. Add mesereamx@gmail.com as test user (if in Testing mode)

### **Error: "redirect_uri_mismatch"**

**Solution:** Check authorized redirect URIs:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Make sure `http://localhost:3000/oauth2callback` is listed
4. Save and try again

---

## 🎯 **After You Get the Token:**

1. ✅ Add to `.env.local`
2. ✅ Restart dev server
3. ✅ Test email sending
4. ✅ Deploy to production (add env vars to Firebase Functions)

---

## 📝 **For Production Deployment:**

After testing locally, set the same variables in Firebase Functions:

```bash
firebase functions:config:set gmail.client_id="..."
firebase functions:config:set gmail.client_secret="..."
firebase functions:config:set gmail.refresh_token="..."
firebase functions:config:set gmail.user_email="mesereamx@gmail.com"

# Then deploy
firebase deploy --only functions
```

---

## ✅ **Ready to Go!**

**Run this command now:**
```bash
node scripts/get-gmail-token.js
```

Follow the prompts, sign in with mesereamx@gmail.com, and copy the refresh token!

---

**Status:** Waiting for you to run the script and get the refresh token! 🚀

