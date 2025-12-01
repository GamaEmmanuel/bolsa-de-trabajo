import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let adminApp: App | undefined

// Initialize Firebase Admin
function initAdmin() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  // For development/local testing, use application default credentials
  // For production, set GOOGLE_APPLICATION_CREDENTIALS env var or use service account
  try {
    // Try to initialize with service account if FIREBASE_SERVICE_ACCOUNT is set
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      })
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Initialize with project ID (works in Firebase hosting and Cloud Functions)
      adminApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
    } else {
      console.warn('Firebase Admin not initialized: Missing credentials')
      return null
    }

    return adminApp
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error)
    return null
  }
}

// Initialize admin app
const app = initAdmin()

// Export admin Firestore instance
export const adminDb = app ? getFirestore(app) : null

// Helper to check if admin is initialized
export function isAdminInitialized(): boolean {
  return adminDb !== null
}

