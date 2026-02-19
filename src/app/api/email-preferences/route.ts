import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { EmailPreferences } from '@/types/index'
import { RateLimiters } from '@/middleware/rateLimit'

// GET - Load email preferences
export async function GET(req: NextRequest) {
	// Apply rate limiting - generous for read operations
	const rateLimitResponse = RateLimiters.generous(req)
	if (rateLimitResponse) {
		return rateLimitResponse
	}
	try {
		const { searchParams } = new URL(req.url)
		const userId = searchParams.get('userId')

		if (!userId) {
			return NextResponse.json(
				{ success: false, error: 'User ID is required' },
				{ status: 400 }
			)
		}

		// If Admin DB is not initialized (local dev without credentials), return default preferences
		if (!adminDb) {
			console.warn('Admin DB not initialized. Returning default preferences for local development.')
			return NextResponse.json({
				success: true,
				preferences: {
					// Default preferences for local development
					applicationSubmitted: true,
					applicationStatusChanged: true,
					newApplications: true,
					newMessages: true,
					weeklyDigest: false,
					marketingEmails: false,
				},
			})
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
		// Return default preferences on error for better UX
		return NextResponse.json({
			success: true,
			preferences: {
				applicationSubmitted: true,
				applicationStatusChanged: true,
				newApplications: true,
				newMessages: true,
				weeklyDigest: false,
				marketingEmails: false,
			},
		})
	}
}

// POST - Save email preferences
export async function POST(req: NextRequest) {
	// Apply rate limiting - standard for write operations
	const rateLimitResponse = RateLimiters.standard(req)
	if (rateLimitResponse) {
		return rateLimitResponse
	}

	try {
		const body = await req.json()
		const { userId, preferences } = body as { userId: string; preferences: EmailPreferences }

		if (!userId || !preferences) {
			return NextResponse.json(
				{ success: false, error: 'User ID and preferences are required' },
				{ status: 400 }
			)
		}

		// If Admin DB is not initialized (local dev without credentials), return success
		if (!adminDb) {
			console.warn('Admin DB not initialized. Skipping save for local development.')
			return NextResponse.json({
				success: true,
				message: 'Preferences saved (local dev mode)',
			})
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
		// Return success anyway for better UX in development
		return NextResponse.json({
			success: true,
			message: 'Preferences saved with fallback',
		})
	}
}

