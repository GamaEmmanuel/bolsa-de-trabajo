import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { getFirebaseApp } from '@/lib/firebase/client'

export function getClientAuth() {
	const app = getFirebaseApp()
	return getAuth(app)
}

export async function signInWithGoogle() {
	const auth = getClientAuth()
	const provider = new GoogleAuthProvider()
	const result = await signInWithPopup(auth, provider)
	return result.user
}

export async function signOutUser() {
	const auth = getClientAuth()
	await signOut(auth)
}

export async function getIdToken(forceRefresh = false) {
	const auth = getClientAuth()
	const user = auth.currentUser
	if (!user) return null
	return user.getIdToken(forceRefresh)
}