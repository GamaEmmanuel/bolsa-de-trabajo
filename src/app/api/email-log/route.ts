import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// Log email sends to Firestore for audit trail
export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const { status, recipientEmail, notificationType, messageId, error } = body

		if (!adminDb) {
			return NextResponse.json({ success: false })
		}

		await adminDb.collection('emailLogs').add({
			status: status || 'sent',
			recipientEmail: recipientEmail || 'unknown',
			notificationType: notificationType || 'unknown',
			messageId: messageId || null,
			error: error || null,
			sentAt: new Date(),
			timestamp: new Date().toISOString(),
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error logging email:', error)
		return NextResponse.json({ success: false }, { status: 500 })
	}
}

