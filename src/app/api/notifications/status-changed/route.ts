import { NextRequest, NextResponse } from 'next/server'
import { sendApplicationStatusChangedEmail, sendApplicationRejectedEmail, getCandidateEmail, getCompanyEmail } from '@/lib/emailNotifications'
import { adminDb } from '@/lib/firebase-admin'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const {
			candidateId,
			candidateName,
			jobTitle,
			companyId,
			oldStatus,
			newStatus,
		} = body

		// Get candidate email
		const candidateEmail = await getCandidateEmail(candidateId)
		if (!candidateEmail) {
			return NextResponse.json(
				{ success: false, error: 'Candidate email not found' },
				{ status: 404 }
			)
		}

		// Get company name
		let companyName = 'La Empresa'
		if (adminDb) {
			try {
				const companyDoc = await adminDb.collection('companies').doc(companyId).get()
				if (companyDoc.exists) {
					const companyData = companyDoc.data()
					companyName = companyData?.companyName || companyName
				}
			} catch (error) {
				console.error('Error fetching company name:', error)
			}
		}

		// Send rejected email if status is rejected or not_moving_forward
		if (newStatus === 'rejected' || newStatus === 'not_moving_forward') {
			const result = await sendApplicationRejectedEmail(
				candidateEmail,
				candidateName || 'Candidato',
				candidateId,
				jobTitle,
				companyName
			)
			return NextResponse.json({ success: true, result })
		}

		// Send status changed email for other statuses
		const result = await sendApplicationStatusChangedEmail(
			{
				candidateEmail,
				candidateName: candidateName || 'Candidato',
				jobTitle,
				companyName,
				oldStatus,
				newStatus,
				newStatusSpanish: translateStatus(newStatus),
				dashboardLink: `${BASE_URL}/candidate/my-applications`,
			},
			candidateId
		)

		return NextResponse.json({ success: true, result })
	} catch (error) {
		console.error('Error in status-changed notification:', error)
		return NextResponse.json(
			{ success: false, error: (error as Error).message },
			{ status: 500 }
		)
	}
}

function translateStatus(status: string): string {
	const translations: Record<string, string> = {
		'applied': 'Aplicado',
		'reviewed': 'Revisado',
		'interview': 'Entrevista',
		'assessments': 'Evaluaciones',
		'finalista': 'Finalista',
		'offer': 'Oferta',
		'hired': 'Contratado',
		'rejected': 'Rechazado',
		'not_moving_forward': 'No Continúa',
	}
	return translations[status] || status
}

