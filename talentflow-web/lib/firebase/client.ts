import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

let app: FirebaseApp
let db: Firestore

export function getFirebaseApp(): FirebaseApp {
	if (!getApps().length) {
		app = initializeApp({
			apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
			authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
			projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
			storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
			messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
			appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
			measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
		})
	} else if (!app) {
		app = getApps()[0]!
	}
	return app
}

export function getDb(): Firestore {
	if (!db) {
		const appInstance = getFirebaseApp()
		db = getFirestore(appInstance)
	}
	return db
}