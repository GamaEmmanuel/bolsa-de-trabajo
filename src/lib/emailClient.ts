// Client-side email service using EmailJS
import emailjs from '@emailjs/browser'
import { EmailTemplateData } from '@/types/email'

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'job-portal'
const EMAILJS_TEMPLATE_ID = 'template_kv50v38'
const EMAILJS_PUBLIC_KEY = 'dNgbSgz45xOHH5tbn'

// Initialize EmailJS automatically when module loads
if (typeof window !== 'undefined') {
	emailjs.init(EMAILJS_PUBLIC_KEY)
	console.log('📧 EmailJS initialized with public key')
}

// Initialize EmailJS (call this once in your app)
export function initEmailJS() {
	emailjs.init(EMAILJS_PUBLIC_KEY)
}

// Send email directly from browser
export async function sendEmailFromBrowser(templateData: EmailTemplateData) {
	try {
		console.log('📧 Attempting to send email with data:', {
			to: templateData.to_email,
			subject: templateData.subject,
			type: templateData.notification_type,
		})

		console.log('📋 EmailJS Config:', {
			serviceId: EMAILJS_SERVICE_ID,
			templateId: EMAILJS_TEMPLATE_ID,
			publicKey: EMAILJS_PUBLIC_KEY ? 'Set ✓' : 'Missing ✗',
		})

		const response = await emailjs.send(
			EMAILJS_SERVICE_ID,
			EMAILJS_TEMPLATE_ID,
			templateData as any,
			EMAILJS_PUBLIC_KEY
		)

		console.log('✅ Email sent successfully:', response)

		// Log to backend for audit trail
		try {
			await fetch('/api/email-log', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'sent',
					recipientEmail: templateData.to_email,
					notificationType: templateData.notification_type,
					messageId: response.text,
				}),
			})
		} catch (logError) {
			console.error('Failed to log email:', logError)
		}

		return { success: true, messageId: response.text }
	} catch (error) {
		console.error('❌ Email send failed:', error)
		console.error('❌ Error details:', {
			message: (error as any)?.message,
			text: (error as any)?.text,
			status: (error as any)?.status,
			name: (error as any)?.name,
		})

		// Log failure to backend
		try {
			await fetch('/api/email-log', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'failed',
					recipientEmail: templateData.to_email,
					notificationType: templateData.notification_type,
					error: (error as Error).message,
				}),
			})
		} catch (logError) {
			console.error('Failed to log email failure:', logError)
		}

		return { success: false, error: (error as Error).message }
	}
}

