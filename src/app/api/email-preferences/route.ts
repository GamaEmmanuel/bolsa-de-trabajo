import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { EmailPreferences } from '@/types/index'

// GET - Load email preferences
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const userId = searchParams.get('userId')

		if (!userId) {
			return NextResponse.json(
				{ success: false, error: 'User ID is required' },
				{ status: 400 }
			)
		}

		if (!adminDb) {
			return NextResponse.json(
				{ success: false, error: 'Database not initialized' },
				{ status: 500 }
			)
		}

		// Try to get from users collection first
		let userDoc = await adminDb.collection('users').doc(userId).get()

		if (userDoc.exists) {
			const userData = userDoc.data()
			return NextResponse.json({
				success: true,
				preferences: userData?.emailPreferences || null,
			})
		}

		// If not found, try companies collection
		const companyDoc = await adminDb.collection('companies').doc(userId).get()
		if (companyDoc.exists) {
			const companyData = companyDoc.data()
			return NextResponse.json({
				success: true,
				preferences: companyData?.emailPreferences || null,
			})
		}

		return NextResponse.json({
			success: true,
			preferences: null,
		})
	} catch (error) {
		console.error('Error loading email preferences:', error)
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		)
	}
}

// POST - Save email preferences
export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const { userId, preferences } = body as { userId: string; preferences: EmailPreferences }

		if (!userId || !preferences) {
			return NextResponse.json(
				{ success: false, error: 'User ID and preferences are required' },
				{ status: 400 }
			)
		}

		if (!adminDb) {
			return NextResponse.json(
				{ success: false, error: 'Database not initialized' },
				{ status: 500 }
			)
		}

		// Try to update users collection first
		let userDoc = await adminDb.collection('users').doc(userId).get()

		if (userDoc.exists) {
			await adminDb.collection('users').doc(userId).update({
				emailPreferences: preferences,
				updatedAt: new Date().toISOString(),
			})
			return NextResponse.json({ success: true })
		}

		// If not found, try companies collection
		const companyDoc = await adminDb.collection('companies').doc(userId).get()
		if (companyDoc.exists) {
			await adminDb.collection('companies').doc(userId).update({
				emailPreferences: preferences,
				updatedAt: new Date().toISOString(),
			})
			return NextResponse.json({ success: true })
		}

		// If neither exists, create in users collection
		await adminDb.collection('users').doc(userId).set({
			emailPreferences: preferences,
			updatedAt: new Date().toISOString(),
		}, { merge: true })

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error saving email preferences:', error)
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		)
	}
}

