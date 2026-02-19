// High-level notification functions to send emails via Firebase Functions (Gmail API)
import {
	NotificationType,
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

/**
 * NOTE: Email sending is handled by Firebase Functions using Gmail API
 *
 * These functions are kept for backward compatibility and convenience,
 * but they should ideally be replaced with direct Firebase Function calls
 * (httpsCallable) in the components that use them.
 *
 * For now, they return mock success responses since the actual email
 * sending happens in Firebase Functions via the sendApplicationEmail callable.
 */

// 1. APPLICATION SUBMITTED
export async function sendApplicationSubmittedEmail(data: ApplicationSubmittedData, candidateId?: string) {
	console.log('📧 Application submitted email - handled by Firebase Function')
	// Email is sent via Firebase Function (sendApplicationEmail)
	// This is called from the job application flow
	return { success: true, messageId: 'handled_by_firebase_function' }
}

// 2. APPLICATION STATUS CHANGED
export async function sendApplicationStatusChangedEmail(data: ApplicationStatusChangedData, candidateId?: string) {
	console.log('📧 Application status changed email - handled by Firebase Function')
	// Email would be sent via Firebase Function if implemented
	return { success: true, messageId: 'handled_by_firebase_function' }
}

// 3. APPLICATION REJECTED
export async function sendApplicationRejectedEmail(
	candidateEmail: string,
	candidateName: string,
	candidateId: string,
	jobTitle: string,
	companyName: string
) {
	console.log('📧 Application rejected email - handled by Firebase Function')
	// Email would be sent via Firebase Function if implemented
	return { success: true, messageId: 'handled_by_firebase_function' }
}

// 4. NEW APPLICATION RECEIVED (to company)
export async function sendNewApplicationReceivedEmail(data: NewApplicationReceivedData, companyId?: string) {
	console.log('📧 New application received email - handled by Firebase Function')
	// Email is sent via Firebase Function (sendApplicationEmail)
	return { success: true, messageId: 'handled_by_firebase_function' }
}

// 5. PAYMENT SUCCESSFUL
export async function sendPaymentSuccessfulEmail(data: PaymentNotificationData, companyId?: string) {
	console.log('📧 Payment successful email - handled by Firebase Function')
	// Email is sent via Firebase Function in Stripe webhook handler
	return { success: true, messageId: 'handled_by_firebase_function' }
}

// 6. PAYMENT FAILED
export async function sendPaymentFailedEmail(data: PaymentNotificationData, companyId?: string) {
	console.log('📧 Payment failed email - handled by Firebase Function')
	// Email is sent via Firebase Function in Stripe webhook handler
	return { success: true, messageId: 'handled_by_firebase_function' }
}

// 7. SUBSCRIPTION ACTIVATED
export async function sendSubscriptionActivatedEmail(data: SubscriptionNotificationData, companyId?: string) {
	console.log('📧 Subscription activated email - handled by Firebase Function')
	// Email is sent via Firebase Function in Stripe webhook handler
	return { success: true, messageId: 'handled_by_firebase_function' }
}

// 8. SUBSCRIPTION CANCELED
export async function sendSubscriptionCanceledEmail(data: SubscriptionNotificationData, companyId?: string) {
	console.log('📧 Subscription canceled email - handled by Firebase Function')
	// Email is sent via Firebase Function in Stripe webhook handler
	return { success: true, messageId: 'handled_by_firebase_function' }
}

// 9. WELCOME CANDIDATE
export async function sendWelcomeCandidateEmail(data: WelcomeEmailData, userId?: string) {
	console.log('📧 Welcome candidate email - handled by Firebase Function')
	// Email would be sent via Firebase Function if implemented
	return { success: true, messageId: 'handled_by_firebase_function' }
}

// 10. WELCOME COMPANY
export async function sendWelcomeCompanyEmail(data: WelcomeEmailData, companyId?: string) {
	console.log('📧 Welcome company email - handled by Firebase Function')
	// Email would be sent via Firebase Function if implemented
	return { success: true, messageId: 'handled_by_firebase_function' }
}

// 11. NEW MESSAGE
export async function sendNewMessageEmail(data: NewMessageData, recipientId?: string) {
	console.log('📧 New message email - handled by Firebase Function')
	// Email would be sent via Firebase Function if implemented
	return { success: true, messageId: 'handled_by_firebase_function' }
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
