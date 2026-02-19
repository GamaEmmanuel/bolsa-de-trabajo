import { NextRequest, NextResponse } from 'next/server'
import { sendApplicationSubmittedEmail, sendNewApplicationReceivedEmail, getCompanyEmail } from '@/lib/emailNotifications'
import { RateLimiters } from '@/middleware/rateLimit'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
	// Apply rate limiting - email rate limit (3 per minute)
	const rateLimitResponse = RateLimiters.email(req)
	if (rateLimitResponse) {
		return rateLimitResponse
	}
	try {
		const body = await req.json()
		const {
			candidateId,
			candidateEmail,
			candidateName,
			jobId,
			jobTitle,
			companyId,
			companyName,
			applicationDate,
		} = body

		// Send email to candidate
		const candidateEmailResult = await sendApplicationSubmittedEmail(
			{
				candidateEmail,
				candidateName,
				jobTitle,
				companyName,
				applicationDate,
				dashboardLink: `${BASE_URL}/candidate/my-applications`,
			},
			candidateId
		)

		// Get company email and send notification
		const companyEmail = await getCompanyEmail(companyId)
		let companyEmailResult = { success: false, error: 'No company email found' }

		if (companyEmail) {
			companyEmailResult = await sendNewApplicationReceivedEmail(
				{
					companyEmail,
					companyName,
					candidateName,
					jobTitle,
					applicationDate,
					atsLink: `${BASE_URL}/company/ats`,
				},
				companyId
			)
		}

		return NextResponse.json({
			success: true,
			candidateEmail: candidateEmailResult,
			companyEmail: companyEmailResult,
		})
	} catch (error) {
		console.error('Error in application-submitted notification:', error)
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		)
	}
}

