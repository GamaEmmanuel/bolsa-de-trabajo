import { initializeApp, getApps, cert, App, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let adminApp: App | undefined

// Initialize Firebase Admin
function initAdmin() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  try {
    // Method 1: Service account from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      })
      console.log('✅ Firebase Admin initialized with service account')
      return adminApp
    }

    // Method 2: Application Default Credentials (works in Firebase/GCP environments)
    try {
      adminApp = initializeApp({
        credential: applicationDefault(),
      })
      console.log('✅ Firebase Admin initialized with application default credentials')
      return adminApp
    } catch (adcError) {
      console.log('Application default credentials not available:', adcError)
    }

    // Method 3: Just project ID (limited functionality)
    const projectId = process.env.FIREBASE_PROJECT_ID ||
                     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
                     process.env.GCLOUD_PROJECT ||
                     'jobportal-4b561'

    adminApp = initializeApp({
      projectId: projectId,
    })
    console.log('✅ Firebase Admin initialized with project ID:', projectId)
    return adminApp

  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error)
    console.error('Available env vars:', {
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasPublicProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
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

