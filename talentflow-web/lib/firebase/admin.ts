import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let cachedDb: Firestore | null = null

export function getAdminDb(): Firestore {
	if (cachedDb) return cachedDb

	const projectId = process.env.FIREBASE_PROJECT_ID
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
	let privateKey = process.env.FIREBASE_PRIVATE_KEY

	if (privateKey && !privateKey.startsWith('-----BEGIN')) {
		privateKey = privateKey.replace(/\\n/g, '\n')
	}

	if (!getApps().length) {
		if (clientEmail && privateKey) {
			initializeApp({
				credential: cert({ projectId, clientEmail, privateKey: privateKey as string }),
				projectId,
			})
		} else {
			initializeApp({
				credential: applicationDefault(),
				projectId,
			})
		}
	}

	cachedDb = getFirestore()
	return cachedDb
}