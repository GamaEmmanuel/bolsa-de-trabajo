import { headers } from 'next/headers'
import { getAuth } from 'firebase-admin/auth'
import { getAdminDb } from '@/lib/firebase/admin'

export interface AuthContext {
	uid: string
	email?: string
	role?: 'candidate' | 'recruiter' | 'supervisor' | 'company_admin' | 'super_admin'
	companyId?: string
}

export async function requireAuth(request?: Request): Promise<AuthContext> {
	let authz: string | null = null
	if (request) {
		authz = request.headers.get('authorization') || request.headers.get('Authorization')
	} else {
		const h = await headers()
		authz = h.get('authorization') || h.get('Authorization')
	}
	if (!authz || !authz.toLowerCase().startsWith('bearer ')) {
		throw new Response('Unauthorized', { status: 401 })
	}
	const idToken = authz.split(' ')[1]
	const decoded = await getAuth().verifyIdToken(idToken)
	const uid = decoded.uid
	const db = getAdminDb()
	const userSnap = await db.collection('users').doc(uid).get()
	const data = userSnap.data() || {}
	return {
		uid,
		email: decoded.email,
		role: data.role,
		companyId: data.companyId,
	}
}