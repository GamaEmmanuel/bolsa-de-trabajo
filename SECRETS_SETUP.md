# 🔐 Secrets Setup Guide

## Overview

This project uses environment variables and configuration files to manage sensitive credentials. **NEVER commit actual secrets to version control.**

---

## 📁 Files You Need to Configure

### 1. **gmail_api_secrets.json** (Local Development)

**Purpose:** OAuth credentials for Gmail API

**Setup:**
1. Copy the example file:
   ```bash
   cp gmail_api_secrets.example.json gmail_api_secrets.json
   ```

2. Get your credentials from [Google Cloud Console](https://console.cloud.google.com/):
   - Go to "APIs & Services" → "Credentials"
   - Create OAuth 2.0 Client ID (or use existing)
   - Download the JSON file

3. Replace the placeholders in `gmail_api_secrets.json`:
   ```json
   {
     "web": {
       "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
       "client_secret": "YOUR_ACTUAL_CLIENT_SECRET",
       "project_id": "your-project-id"
     }
   }
   ```

**Note:** This file is in `.gitignore` and will NOT be committed.

---

### 2. **.env.local** (Local Development)

**Purpose:** Environment variables for Next.js app

**Setup:**
1. Create the file in project root:
   ```bash
   touch .env.local
   ```

2. Add your Gmail API credentials:
   ```bash
   GMAIL_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
   GMAIL_CLIENT_SECRET="YOUR_CLIENT_SECRET"
   GMAIL_REFRESH_TOKEN="YOUR_REFRESH_TOKEN"
   GMAIL_USER_EMAIL="your-email@gmail.com"
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

**Getting the Refresh Token:**
- Run: `node scripts/get-gmail-token.js`
- Follow the OAuth flow
- Copy the token from terminal output

**Note:** This file is in `.gitignore` and will NOT be committed.

---

### 3. **Firebase Service Account** (Already Configured)

**File:** `jobportal-4b561-firebase-adminsdk-*.json`

**Status:** ✅ Already in `.gitignore`

**Note:** Never commit Firebase Admin SDK keys.

---

## 🚀 Production Deployment

### Firebase Functions Configuration

Set environment variables in Firebase:

```bash
# Gmail API
firebase functions:config:set gmail.client_id="YOUR_CLIENT_ID"
firebase functions:config:set gmail.client_secret="YOUR_CLIENT_SECRET"
firebase functions:config:set gmail.refresh_token="YOUR_REFRESH_TOKEN"
firebase functions:config:set gmail.user_email="your-email@gmail.com"

# Deploy
firebase deploy --only functions
```

---

## ✅ Verify Setup

Check that these files are NOT tracked by git:

```bash
git status
```

Should NOT show:
- ❌ `gmail_api_secrets.json`
- ❌ `.env.local`
- ❌ `*-firebase-adminsdk-*.json`
- ❌ `TEST_GMAIL_EMAIL.md`

Should show (these are safe to commit):
- ✅ `gmail_api_secrets.example.json`
- ✅ `SECRETS_SETUP.md`
- ✅ `.gitignore`

---

## 🔒 Security Best Practices

1. **Never commit secrets** to version control
2. **Use example files** with placeholders
3. **Rotate credentials** if accidentally exposed
4. **Use environment variables** in production
5. **Add sensitive files** to `.gitignore`

---

## 🆘 If You Accidentally Committed Secrets

1. **Immediately rotate the credentials** in Google Cloud Console
2. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch gmail_api_secrets.json" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (be careful!):
   ```bash
   git push origin --force --all
   ```

---

## 📚 Related Documentation

- [GET_GMAIL_TOKEN_INSTRUCTIONS.md](./GET_GMAIL_TOKEN_INSTRUCTIONS.md) - How to get OAuth refresh token
- [GMAIL_API_IMPLEMENTATION_PLAN.md](./GMAIL_API_IMPLEMENTATION_PLAN.md) - Gmail API implementation details
- [Google Cloud Console](https://console.cloud.google.com/) - Manage credentials

---

**Need help?** Check the documentation or contact the project maintainer.

