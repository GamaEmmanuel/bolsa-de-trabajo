import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeCandidateEmail, sendWelcomeCompanyEmail } from '@/lib/emailNotifications'

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const { userId, userEmail, userName, accountType, dashboardLink } = body

		if (!userEmail || !accountType) {
			return NextResponse.json(
				{ success: false, error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		let result
		if (accountType === 'personal') {
			result = await sendWelcomeCandidateEmail(
				{
					userEmail,
					userName: userName || 'Usuario',
					accountType: 'candidate',
					dashboardLink,
				},
				userId
			)
		} else {
			result = await sendWelcomeCompanyEmail(
				{
					userEmail,
					userName: userName || 'Empresa',
					accountType: 'company',
					dashboardLink,
				},
				userId
			)
		}

		return NextResponse.json({ success: true, result })
	} catch (error) {
		console.error('Error in welcome notification:', error)
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		)
	}
}

