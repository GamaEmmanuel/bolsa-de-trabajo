// High-level notification functions to send emails
import {
	NotificationType,
	SendEmailRequest,
	SendEmailResponse,
	ApplicationSubmittedData,
	ApplicationStatusChangedData,
	NewApplicationReceivedData,
	PaymentNotificationData,
	SubscriptionNotificationData,
	WelcomeEmailData,
	NewMessageData,
} from '@/types/email'

import {
	buildApplicationSubmittedTemplate,
	buildApplicationStatusChangedTemplate,
	buildApplicationRejectedTemplate,
	buildNewApplicationReceivedTemplate,
	buildPaymentSuccessfulTemplate,
	buildPaymentFailedTemplate,
	buildSubscriptionActivatedTemplate,
	buildSubscriptionCanceledTemplate,
	buildWelcomeCandidateTemplate,
	buildWelcomeCompanyTemplate,
	buildNewMessageTemplate,
} from './emailTemplates'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Generic email sender
async function sendEmail(
	notificationType: NotificationType,
	recipientEmail: string,
	recipientName: string,
	templateData: any,
	userId?: string
): Promise<SendEmailResponse> {
	try {
		const request: SendEmailRequest = {
			notificationType,
			recipientEmail,
			recipientName,
			templateData,
			userId,
		}

		const response = await fetch(`${BASE_URL}/api/email/send`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(request),
		})

		const result: SendEmailResponse = await response.json()
		return result
	} catch (error) {
		console.error('Error sending email:', error)
		return {
			success: false,
			error: (error as Error).message,
		}
	}
}

// 1. APPLICATION SUBMITTED
export async function sendApplicationSubmittedEmail(data: ApplicationSubmittedData, candidateId?: string) {
	const templateData = buildApplicationSubmittedTemplate(data)
	return sendEmail(
		'application_submitted',
		data.candidateEmail,
		data.candidateName,
		templateData,
		candidateId
	)
}

// 2. APPLICATION STATUS CHANGED
export async function sendApplicationStatusChangedEmail(data: ApplicationStatusChangedData, candidateId?: string) {
	// Don't send email if status is just 'applied' (that's the initial state)
	if (data.newStatus === 'applied') return { success: true, messageId: 'skipped' }

	const templateData = buildApplicationStatusChangedTemplate(data)
	return sendEmail(
		'application_status_changed',
		data.candidateEmail,
		data.candidateName,
		templateData,
		candidateId
	)
}

// 3. APPLICATION REJECTED
export async function sendApplicationRejectedEmail(
	candidateEmail: string,
	candidateName: string,
	candidateId: string,
	jobTitle: string,
	companyName: string
) {
	const templateData = buildApplicationRejectedTemplate(
		candidateEmail,
		candidateName,
		jobTitle,
		companyName,
		`${BASE_URL}/candidate/my-applications`
	)
	return sendEmail(
		'application_rejected',
		candidateEmail,
		candidateName,
		templateData,
		candidateId
	)
}

// 4. NEW APPLICATION RECEIVED (to company)
export async function sendNewApplicationReceivedEmail(data: NewApplicationReceivedData, companyId?: string) {
	const templateData = buildNewApplicationReceivedTemplate(data)
	return sendEmail(
		'new_application',
		data.companyEmail,
		data.companyName,
		templateData,
		companyId
	)
}

// 5. PAYMENT SUCCESSFUL
export async function sendPaymentSuccessfulEmail(data: PaymentNotificationData, companyId?: string) {
	const templateData = buildPaymentSuccessfulTemplate(data)
	return sendEmail(
		'payment_successful',
		data.companyEmail,
		data.companyName,
		templateData,
		companyId
	)
}

// 6. PAYMENT FAILED
export async function sendPaymentFailedEmail(data: PaymentNotificationData, companyId?: string) {
	const templateData = buildPaymentFailedTemplate(data)
	return sendEmail(
		'payment_failed',
		data.companyEmail,
		data.companyName,
		templateData,
		companyId
	)
}

// 7. SUBSCRIPTION ACTIVATED
export async function sendSubscriptionActivatedEmail(data: SubscriptionNotificationData, companyId?: string) {
	const templateData = buildSubscriptionActivatedTemplate(data)
	return sendEmail(
		'subscription_activated',
		data.companyEmail,
		data.companyName,
		templateData,
		companyId
	)
}

// 8. SUBSCRIPTION CANCELED
export async function sendSubscriptionCanceledEmail(data: SubscriptionNotificationData, companyId?: string) {
	const templateData = buildSubscriptionCanceledTemplate(data)
	return sendEmail(
		'subscription_canceled',
		data.companyEmail,
		data.companyName,
		templateData,
		companyId
	)
}

// 9. WELCOME CANDIDATE
export async function sendWelcomeCandidateEmail(data: WelcomeEmailData, userId?: string) {
	const templateData = buildWelcomeCandidateTemplate(data)
	return sendEmail(
		'welcome_candidate',
		data.userEmail,
		data.userName,
		templateData,
		userId
	)
}

// 10. WELCOME COMPANY
export async function sendWelcomeCompanyEmail(data: WelcomeEmailData, companyId?: string) {
	const templateData = buildWelcomeCompanyTemplate(data)
	return sendEmail(
		'welcome_company',
		data.userEmail,
		data.userName,
		templateData,
		companyId
	)
}

// 11. NEW MESSAGE
export async function sendNewMessageEmail(data: NewMessageData, recipientId?: string) {
	const templateData = buildNewMessageTemplate(data)
	return sendEmail(
		'new_message',
		data.recipientEmail,
		data.recipientName,
		templateData,
		recipientId
	)
}

// Helper: Get company email from Firestore
export async function getCompanyEmail(companyId: string): Promise<string | null> {
	try {
		// This will be called from server-side code, so we need to import firebase-admin
		const { adminDb } = await import('./firebase-admin')

		if (!adminDb) return null

		const companyDoc = await adminDb.collection('companies').doc(companyId).get()
		if (!companyDoc.exists) return null

		const companyData = companyDoc.data()

		// Try to get email from company document or associated user
		if (companyData?.email) return companyData.email

		// Get from user document (companyId is usually the user's uid)
		const userDoc = await adminDb.collection('users').doc(companyId).get()
		if (!userDoc.exists) return null

		const userData = userDoc.data()
		return userData?.email || null

	} catch (error) {
		console.error('Error getting company email:', error)
		return null
	}
}

// Helper: Get candidate email from Firestore
export async function getCandidateEmail(candidateId: string): Promise<string | null> {
	try {
		const { adminDb } = await import('./firebase-admin')

		if (!adminDb) return null

		const userDoc = await adminDb.collection('users').doc(candidateId).get()
		if (!userDoc.exists) return null

		const userData = userDoc.data()
		return userData?.email || null

	} catch (error) {
		console.error('Error getting candidate email:', error)
		return null
	}
}

