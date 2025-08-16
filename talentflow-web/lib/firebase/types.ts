export type UUID = string

export type UserRole = 'candidate' | 'recruiter' | 'supervisor' | 'company_admin' | 'super_admin'

export interface User {
	userId: UUID
	emailAddress: string
	passwordHash?: string
	roleId: number
	firstName?: string
	lastName?: string
	createdAt: string
	lastLogin?: string
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

export interface Company {
	companyId: UUID
	companyName: string
	rfc: string
	industry?: string
	websiteUrl?: string
	logoUrl?: string
	description?: string
	createdAt: string
}

export type JobStatus = 'draft' | 'published' | 'expired' | 'filled'
export type JobTier = 'clasica' | 'destacada' | 'premium'

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
	jobType?: string
	locationId?: UUID
	categoryId?: UUID
	status: JobStatus
	postedDate?: string
	tier?: JobTier
}

export type PipelineStatus = 'applied' | 'reviewed' | 'interview' | 'assessments' | 'offer' | 'hired' | 'rejected'

export interface Application {
	applicationId: UUID
	candidateId: UUID
	jobId: UUID
	applicationDate: string
	pipelineStatus: PipelineStatus
	updatedAt?: string
}

export interface Purchase {
	purchaseId: UUID
	companyId: UUID
	productId: UUID
	amount: number
	transactionDate: string
	paymentTxnId?: string
}