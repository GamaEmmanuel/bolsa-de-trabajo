import { NextRequest, NextResponse } from 'next/server'
import { SendEmailRequest, SendEmailResponse, EmailTemplateData } from '@/types/email'
import { adminDb } from '@/lib/firebase-admin'

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'job-portal'
const EMAILJS_TEMPLATE_ID = 'template_kv50v38'
const EMAILJS_PUBLIC_KEY = 'dNgbSgz45xOHH5tbn'
const EMAILJS_PRIVATE_KEY = '-Eo8kdyuTIvbpl1345mph'

export async function POST(req: NextRequest) {
	try {
		const body: SendEmailRequest = await req.json()
		const { notificationType, recipientEmail, recipientName, templateData, userId } = body

		// Validate required fields
		if (!recipientEmail || !notificationType) {
			return NextResponse.json(
				{ success: false, error: 'Missing required fields' } as SendEmailResponse,
				{ status: 400 }
			)
		}

		// Check user's email preferences if userId provided
		if (userId) {
			const shouldSend = await checkEmailPreferences(userId, notificationType)
			if (!shouldSend) {
				return NextResponse.json(
					{
						success: true,
						messageId: 'skipped_by_preferences',
						error: 'Email skipped due to user preferences'
					} as SendEmailResponse,
					{ status: 200 }
				)
			}
		}

		// Prepare final template data
		const finalTemplateData: EmailTemplateData = {
			to_email: recipientEmail,
			to_name: recipientName || 'Usuario',
			notification_type: notificationType,
			subject: templateData.subject || 'Notificación de HR Portal',
			title: templateData.title || 'Notificación',
			greeting: templateData.greeting || `Hola ${recipientName || 'Usuario'},`,
			main_message: templateData.main_message || '',
			secondary_message: templateData.secondary_message,
			action_label: templateData.action_label,
			action_url: templateData.action_url,
			detail_1_label: templateData.detail_1_label,
			detail_1_value: templateData.detail_1_value,
			detail_2_label: templateData.detail_2_label,
			detail_2_value: templateData.detail_2_value,
			detail_3_label: templateData.detail_3_label,
			detail_3_value: templateData.detail_3_value,
			detail_4_label: templateData.detail_4_label,
			detail_4_value: templateData.detail_4_value,
			footer_message: templateData.footer_message || 'Gracias por usar HR Portal',
			company_name: 'HR Portal',
		}

		// Send email via EmailJS REST API
		const emailJSResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				service_id: EMAILJS_SERVICE_ID,
				template_id: EMAILJS_TEMPLATE_ID,
				user_id: EMAILJS_PUBLIC_KEY,
				accessToken: EMAILJS_PRIVATE_KEY,
				template_params: finalTemplateData,
			}),
		})

		if (!emailJSResponse.ok) {
			const errorText = await emailJSResponse.text()
			console.error('EmailJS error:', errorText)
			throw new Error(`EmailJS API error: ${errorText}`)
		}

		const responseText = await emailJSResponse.text()

		// Log email sent to Firestore for audit trail
		if (adminDb) {
			try {
				await adminDb.collection('emailLogs').add({
					notificationType,
					recipientEmail,
					recipientName,
					userId: userId || null,
					status: 'sent',
					sentAt: new Date(),
					subject: finalTemplateData.subject,
					messageId: responseText || 'unknown',
				})
			} catch (logError) {
				console.error('Error logging email:', logError)
				// Don't fail the request if logging fails
			}
		}

		return NextResponse.json({
			success: true,
			messageId: responseText || 'sent',
		} as SendEmailResponse)

	} catch (error) {
		console.error('Error sending email:', error)

		// Log failed email attempt
		if (adminDb) {
			try {
				const body = await req.json()
				await adminDb.collection('emailLogs').add({
					notificationType: body.notificationType,
					recipientEmail: body.recipientEmail,
					status: 'failed',
					error: (error as Error).message,
					sentAt: new Date(),
				})
			} catch (logError) {
				console.error('Error logging failed email:', logError)
			}
		}

		return NextResponse.json(
			{
				success: false,
				error: (error as Error).message || 'Failed to send email'
			} as SendEmailResponse,
			{ status: 500 }
		)
	}
}

// Helper function to check email preferences
async function checkEmailPreferences(userId: string, notificationType: string): Promise<boolean> {
	if (!adminDb) return true // Default to sending if DB not available

	try {
		// Check user document for email preferences
		const userDoc = await adminDb.collection('users').doc(userId).get()

		if (!userDoc.exists) {
			// Check company document
			const companyDoc = await adminDb.collection('companies').doc(userId).get()
			if (!companyDoc.exists) return true // Default to sending

			const companyData = companyDoc.data()
			const preferences = companyData?.emailPreferences
			return checkPreferenceForNotificationType(preferences, notificationType)
		}

		const userData = userDoc.data()
		const preferences = userData?.emailPreferences
		return checkPreferenceForNotificationType(preferences, notificationType)

	} catch (error) {
		console.error('Error checking email preferences:', error)
		return true // Default to sending on error
	}
}

// Map notification types to preference fields
function checkPreferenceForNotificationType(preferences: any, notificationType: string): boolean {
	// If no preferences set, default to sending all emails
	if (!preferences) return true

	const typeMap: Record<string, keyof any> = {
		'application_submitted': 'applicationSubmitted',
		'application_status_changed': 'applicationStatusChanged',
		'application_rejected': 'applicationRejected',
		'new_message': 'newMessages',
		'payment_failed': 'paymentNotifications',
		'payment_successful': 'paymentNotifications',
		'subscription_activated': 'subscriptionUpdates',
		'subscription_canceled': 'subscriptionUpdates',
		'subscription_expiring': 'subscriptionUpdates',
		'credits_awarded': 'creditsAwarded',
		'new_application': 'newApplications',
		'job_published': 'jobStatusUpdates',
		'job_expiring': 'jobStatusUpdates',
		'welcome_candidate': 'applicationSubmitted', // Welcome emails always sent
		'welcome_company': 'subscriptionUpdates', // Welcome emails always sent
	}

	const preferenceKey = typeMap[notificationType]

	// Always send welcome emails
	if (notificationType.includes('welcome')) return true

	// If preference key not found, default to sending
	if (!preferenceKey) return true

	// Check specific preference (default to true if not set)
	return preferences[preferenceKey] !== false
}

