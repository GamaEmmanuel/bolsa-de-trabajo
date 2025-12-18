# Firebase Admin SDK Setup

This guide explains how to set up Firebase Admin SDK for your HR Portal application.

## ✅ Good News!

**The app now works without Firebase Admin SDK credentials!** We've updated the code to pass subscription data directly from the client, so you don't need to set up service account keys for basic functionality.

## What Works Without Setup:

- ✅ Stripe subscription portal management
- ✅ Email preferences (with default values)
- ✅ All user-facing features

## When You NEED Firebase Admin SDK:

You only need Firebase Admin SDK credentials if you plan to:
- Deploy to production (recommended for security)
- Use server-side Cloud Functions
- Perform batch operations on Firestore
- Need elevated permissions for specific features

## Setup Options (Optional)

### Option 1: Service Account Key (Recommended for Production)

1. **Generate a Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (`jobportal-4b561`)
   - Go to Project Settings (gear icon) → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely (DO NOT commit it to git)

2. **Add to Environment Variables:**

   **For Local Development (.env.local):**
   ```bash
   # Copy the entire JSON content and minify it to a single line
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"jobportal-4b561",...}'
   ```

   **For Vercel (Production):**
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add `FIREBASE_SERVICE_ACCOUNT` with the minified JSON content
   - Make sure it's available for Production, Preview, and Development environments

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

### Option 2: Firebase Emulators (For Local Development Only)

If you want to develop without setting up a service account:

1. **Install Firebase Tools:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Emulators:**
   ```bash
   firebase init emulators
   ```
   Select: Firestore, Authentication (if needed)

3. **Update firebase.json to include emulator configuration:**
   ```json
   {
     "emulators": {
       "firestore": {
         "port": 8080
       },
       "auth": {
         "port": 9099
       },
       "ui": {
         "enabled": true,
         "port": 4000
       }
     }
   }
   ```

4. **Start emulators:**
   ```bash
   firebase emulators:start
   ```

5. **Configure your app to use emulators** (in development only)

### Option 3: Default Credentials (Google Cloud environments)

If deploying to Google Cloud Platform or Cloud Run, the application will automatically use Application Default Credentials. No additional setup needed.

## Verification

After setup, you should see this message in your console when starting the app:
```
✅ Firebase Admin initialized with service account
```

Or one of these alternatives:
```
✅ Firebase Admin initialized with application default credentials
✅ Firebase Admin initialized with project ID: jobportal-4b561
```

## Troubleshooting

### Error: "Getting metadata from plugin failed with error: invalid_grant"

This means the service account credentials are invalid or expired:
1. Generate a new service account key
2. Update your environment variable
3. Restart your development server

### Error: "Database not initialized"

The Firebase Admin SDK couldn't initialize:
1. Check that `FIREBASE_SERVICE_ACCOUNT` is properly set
2. Ensure the JSON is valid (no extra spaces or line breaks)
3. Verify your Firebase project ID is correct

### Features affected without Admin SDK

Without proper Admin SDK setup, these features will have limited functionality:
- ✅ Email preferences (returns default values in dev mode)
- ❌ Stripe subscription portal (will show error message)
- ❌ Server-side Firestore operations requiring elevated permissions

## Security Notes

⚠️ **IMPORTANT:** Never commit your service account key to version control!

Add to `.gitignore`:
```
firebase-adminsdk-*.json
serviceAccountKey.json
```

The service account key grants full access to your Firebase project. Keep it secure and rotate it periodically.

## Environment Variables Summary

Required for production:
```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

Alternative (if using project ID only - limited functionality):
```bash
FIREBASE_PROJECT_ID=jobportal-4b561
```

## Testing

After setup, test these features:
1. Go to `/company/settings`
2. Click "Gestionar Suscripción" - should redirect to Stripe portal
3. Update email preferences - should save successfully

## Need Help?

If you continue to experience issues:
1. Check the console for Firebase Admin initialization messages
2. Verify all environment variables are set correctly
3. Ensure your Firebase project permissions are configured properly
