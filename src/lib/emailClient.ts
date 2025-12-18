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

		// Clean template data - ONLY include fields that have values
		const cleanedData: any = {
			to_email: templateData.to_email || '',
			to_name: templateData.to_name || '',
			subject: templateData.subject || '',
			notification_type: templateData.notification_type || '',
			title: templateData.title || '',
			greeting: templateData.greeting || '',
			main_message: templateData.main_message || '',
			footer_message: templateData.footer_message || 'Gracias por usar HR Portal',
			company_name: templateData.company_name || 'HR Portal',
		}

		// Only add optional fields if they have values
		if (templateData.secondary_message) {
			cleanedData.secondary_message = templateData.secondary_message
		}
		if (templateData.action_label) {
			cleanedData.action_label = templateData.action_label
		}
		if (templateData.action_url) {
			cleanedData.action_url = templateData.action_url
		}
		if (templateData.detail_1_label) {
			cleanedData.detail_1_label = templateData.detail_1_label
			cleanedData.detail_1_value = templateData.detail_1_value || ''
		}
		if (templateData.detail_2_label) {
			cleanedData.detail_2_label = templateData.detail_2_label
			cleanedData.detail_2_value = templateData.detail_2_value || ''
		}
		if (templateData.detail_3_label) {
			cleanedData.detail_3_label = templateData.detail_3_label
			cleanedData.detail_3_value = templateData.detail_3_value || ''
		}
		if (templateData.detail_4_label) {
			cleanedData.detail_4_label = templateData.detail_4_label
			cleanedData.detail_4_value = templateData.detail_4_value || ''
		}

		console.log('📨 Full email data being sent to EmailJS:', cleanedData)

		const response = await emailjs.send(
			EMAILJS_SERVICE_ID,
			EMAILJS_TEMPLATE_ID,
			cleanedData,
			EMAILJS_PUBLIC_KEY
		)

		console.log('✅ Email sent successfully:', response)

		// Log to Firestore directly (client-side)
		try {
			const { db } = await import('./firebase')
			const { collection, addDoc } = await import('firebase/firestore')

			await addDoc(collection(db, 'emailLogs'), {
				status: 'sent',
				recipientEmail: templateData.to_email,
				recipientName: templateData.to_name,
				notificationType: templateData.notification_type,
				subject: templateData.subject,
				messageId: response.text || 'OK',
				sentAt: new Date(),
				timestamp: new Date().toISOString(),
			})
			console.log('📝 Email logged to Firestore')
		} catch (logError) {
			console.error('Failed to log email:', logError)
			// Don't fail the email send if logging fails
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

		// Log failure to Firestore directly (client-side)
		try {
			const { db } = await import('./firebase')
			const { collection, addDoc } = await import('firebase/firestore')

			await addDoc(collection(db, 'emailLogs'), {
				status: 'failed',
				recipientEmail: templateData.to_email,
				recipientName: templateData.to_name,
				notificationType: templateData.notification_type,
				subject: templateData.subject,
				error: (error as Error).message,
				sentAt: new Date(),
				timestamp: new Date().toISOString(),
			})
			console.log('📝 Email failure logged to Firestore')
		} catch (logError) {
			console.error('Failed to log email failure:', logError)
		}

		return { success: false, error: (error as Error).message }
	}
}

