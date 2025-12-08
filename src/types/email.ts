// Email notification types and interfaces

export type NotificationType =
	| 'application_submitted'
	| 'application_status_changed'
	| 'application_rejected'
	| 'payment_failed'
	| 'payment_successful'
	| 'subscription_activated'
	| 'subscription_canceled'
	| 'subscription_expiring'
	| 'credits_awarded'
	| 'welcome_candidate'
	| 'welcome_company'
	| 'new_message'
	| 'job_published'
	| 'job_expiring'

export interface EmailPreferences {
	// Application notifications
	applicationSubmitted?: boolean
	applicationStatusChanged?: boolean
	applicationRejected?: boolean

	// Communication notifications
	newMessages?: boolean

	// Subscription/Payment notifications (companies only)
	paymentNotifications?: boolean
	subscriptionUpdates?: boolean
	creditsAwarded?: boolean

	// Job notifications (companies only)
	newApplications?: boolean
	jobStatusUpdates?: boolean

	// General
	weeklyDigest?: boolean
	marketingEmails?: boolean
}

export interface EmailTemplateData {
	// Recipient info
	to_email: string
	to_name: string

	// Email metadata
	subject: string
	notification_type: string

	// Dynamic content
	title: string
	greeting: string
	main_message: string
	secondary_message?: string
	action_label?: string
	action_url?: string

	// Additional details (shown as list)
	detail_1_label?: string
	detail_1_value?: string
	detail_2_label?: string
	detail_2_value?: string
	detail_3_label?: string
	detail_3_value?: string
	detail_4_label?: string
	detail_4_value?: string

	// Footer
	footer_message?: string
	company_name?: string
}

export interface SendEmailRequest {
	notificationType: NotificationType
	recipientEmail: string
	recipientName: string
	templateData: Partial<EmailTemplateData>
	userId?: string // To check email preferences
}

export interface SendEmailResponse {
	success: boolean
	messageId?: string
	error?: string
}

// Specific notification data interfaces
export interface ApplicationSubmittedData {
	candidateEmail: string
	candidateName: string
	jobTitle: string
	companyName: string
	applicationDate: string
	dashboardLink: string
}

export interface ApplicationStatusChangedData {
	candidateEmail: string
	candidateName: string
	jobTitle: string
	companyName: string
	oldStatus: string
	newStatus: string
	newStatusSpanish: string
	dashboardLink: string
}

export interface NewApplicationReceivedData {
	companyEmail: string
	companyName: string
	candidateName: string
	jobTitle: string
	applicationDate: string
	atsLink: string
}

export interface PaymentNotificationData {
	companyEmail: string
	companyName: string
	status: 'success' | 'failed'
	amount?: string
	currency?: string
	nextBillingDate?: string
	creditsAwarded?: number
	billingPortalLink: string
}

export interface SubscriptionNotificationData {
	companyEmail: string
	companyName: string
	status: 'activated' | 'canceled' | 'expiring'
	expirationDate?: string
	billingPortalLink: string
}

export interface WelcomeEmailData {
	userEmail: string
	userName: string
	accountType: 'candidate' | 'company'
	dashboardLink: string
}

export interface NewMessageData {
	recipientEmail: string
	recipientName: string
	senderName: string
	senderType: 'candidate' | 'company'
	messagePreview: string
	inboxLink: string
	unreadCount?: number
}

