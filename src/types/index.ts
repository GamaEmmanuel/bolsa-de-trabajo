export type UUID = string

export type UserRole =
	| 'candidate'
	| 'recruiter'
	| 'supervisor'
	| 'company_admin'
	| 'super_admin'

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

export interface User {
	userId: UUID
	emailAddress: string
	passwordHash?: string
	roleId: number
	firstName?: string
	lastName?: string
	createdAt: string
	lastLogin?: string
	accountType?: 'personal' | 'enterprise'
	role?: 'candidate' | 'recruiter'
	emailPreferences?: EmailPreferences
}

export interface CandidateProfile {
	profileId: UUID
	userId: UUID
	workExperience: unknown
	education: unknown
	skills: string[]
	languages?: Record<string, string>
	desiredSalaryMx?: number
	preferences?: unknown
}

export type SubscriptionStatus =
	| 'active'
	| 'canceled'
	| 'past_due'
	| 'trialing'
	| 'incomplete'
	| 'incomplete_expired'
	| 'unpaid'
	| null

export interface Subscription {
	stripeCustomerId?: string
	stripeSubscriptionId?: string
	stripePriceId?: string
	status?: SubscriptionStatus
	currentPeriodStart?: any // Firestore Timestamp
	currentPeriodEnd?: any // Firestore Timestamp
	cancelAtPeriodEnd?: boolean
	createdAt?: any // Firestore Timestamp
	updatedAt?: any // Firestore Timestamp
}

export interface Company {
	companyId: UUID
	companyName: string
	rfc: string
	industry?: string
	websiteUrl?: string
	logoUrl?: string
	description?: string
	createdAt: string
	subscription?: Subscription
	credits?: number // AI credits
	emailPreferences?: EmailPreferences
	// Social Media URLs
	instagramUrl?: string
	facebookUrl?: string
	googleMapsUrl?: string
	youtubeUrl?: string
	tiktokUrl?: string
}

export type JobStatus =
	| 'draft'
	| 'pending_approval'
	| 'published'
	| 'expired'
	| 'filled'
	| 'archived'
export type JobTier = 'clasica' | 'destacada' | 'premium'

// Phase 1 & 2 Job Posting Fields
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance'
export type EmploymentType = 'remote' | 'hybrid' | 'on-site'
export type ExperienceLevel = '0-1' | '1-3' | '3-5' | '5-10' | '10+'
export type EducationLevel = 'high-school' | 'bachelor' | 'master' | 'phd' | 'no-requirement'
export type JobCategory = 'technology' | 'healthcare' | 'finance' | 'education' | 'marketing' | 'sales' | 'engineering' | 'design' | 'legal' | 'operations' | 'customer-service' | 'logistics' | 'construction' | 'hospitality' | 'retail' | 'human-resources' | 'media' | 'administration' | 'other'
export type JobLevel = 'entry' | 'mid-level' | 'senior' | 'lead' | 'executive'

// Phase 3 Job Posting Fields
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+'
export type Industry = 'technology' | 'healthcare' | 'finance' | 'education' | 'retail' | 'manufacturing' | 'consulting' | 'hospitality' | 'construction' | 'real-estate' | 'media' | 'non-profit' | 'government' | 'logistics' | 'other'
export type StartDate = 'immediate' | '1-2-weeks' | '1-month' | '2-months' | 'flexible'
export type UrgencyLevel = 'normal' | 'urgent' | 'critical'
export type ApplicationProcess = 'resume-only' | 'portfolio-required' | 'cover-letter-required' | 'video-interview' | 'technical-test'
export type InterviewRounds = '1' | '2' | '3' | '4+' | 'varies'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface JobPosting {
	jobId: UUID
	companyId: UUID
	createdByUserId: UUID
	jobTitle: string
	jobDescription: string
	requirements?: unknown
	salaryMin?: number
	salaryMax?: number
	isSalaryHidden?: boolean
	jobType?: JobType
	employmentType?: EmploymentType
	yearsOfExperience?: ExperienceLevel
	educationLevel?: EducationLevel
	requiredSkills?: string[]
	preferredSkills?: string[]
	jobCategory?: JobCategory
	jobLevel?: JobLevel
	location?: string
	locationId?: UUID
	categoryId?: UUID
	status: JobStatus
	postedDate?: string
	tier?: JobTier
	// Payment fields (pay-per-job model)
	paymentStatus?: PaymentStatus
	stripePaymentIntentId?: string
	stripeCheckoutSessionId?: string
	paidAt?: any // Firestore Timestamp
	// Phase 3 Fields
	applicationDeadline?: string
	startDate?: StartDate
	companySize?: CompanySize
	industry?: Industry
	urgencyLevel?: UrgencyLevel
	applicationProcess?: ApplicationProcess
	interviewRounds?: InterviewRounds
	applicationQuestions?: string[]
	requiredDocuments?: string[]
	internalNotes?: string
	externalJobBoards?: string[]
	benefits?: string[]
	companyCulture?: string[]
}

export type PipelineStatus =
	| 'applied'
	| 'reviewed'
	| 'interview'
	| 'assessments'
	| 'finalista'
	| 'rejected'
	| 'not_moving_forward'

export interface Application {
	applicationId: UUID
	candidateId: UUID
	jobId: UUID
	applicationDate: string
	pipelineStatus: PipelineStatus
	updatedAt?: string
	candidateName?: string
	companyId?: UUID
}

export interface Purchase {
	purchaseId: UUID
	companyId: UUID
	productId: UUID
	amount: number
	transactionDate: string
	paymentTxnId?: string
}

export type UserType = 'company' | 'candidate'

export interface MessageAttachment {
	name: string
	url: string
	type: string
	size: number
}

export interface Message {
	messageId: string
	conversationId: string
	senderId: string
	senderType: UserType
	senderName: string
	receiverId: string
	receiverType: UserType
	receiverName: string
	content: string
	attachments: MessageAttachment[]
	read: boolean
	timestamp: any // Firestore Timestamp
	createdAt: any // Firestore Timestamp
	deleted?: boolean
	deletedAt?: any // Firestore Timestamp
	deletedBy?: string
	edited?: boolean
	editedAt?: any // Firestore Timestamp
	originalContent?: string // Store original for history
}

export interface Conversation {
	conversationId: string
	companyId: string
	companyName: string
	companyLogoUrl?: string
	candidateId: string
	candidateName: string
	candidateProfileId?: string
	lastMessage: string
	lastMessageTimestamp: any // Firestore Timestamp
	lastMessageSenderId: string
	participants: string[]
	unreadCount: {
		[userId: string]: number
	}
	createdAt: any // Firestore Timestamp
	updatedAt: any // Firestore Timestamp
	archived?: boolean
	archivedBy?: string[] // Array of user IDs who archived this conversation
}
