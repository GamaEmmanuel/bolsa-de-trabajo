export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

export async function GET() {
	const now = new Date().toISOString()
	const db = getAdminDb()
	const ref = db.collection('system').doc('heartbeat')
	await ref.set({ updatedAt: now }, { merge: true })
	const snap = await ref.get()
	return NextResponse.json({ ok: true, data: snap.data() ?? null })
}