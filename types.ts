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
	// Social Media URLs
	instagramUrl?: string
	facebookUrl?: string
	googleMapsUrl?: string
	youtubeUrl?: string
	tiktokUrl?: string
}

export type JobStatus = 'draft' | 'pending_approval' | 'published' | 'expired' | 'filled'
export type JobTier = 'clasica' | 'destacada' | 'premium'

// Phase 1 & 2 Job Posting Fields
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance'
export type EmploymentType = 'remote' | 'hybrid' | 'on-site'
export type ExperienceLevel = '0-1' | '1-3' | '3-5' | '5-10' | '10+'
export type EducationLevel = 'high-school' | 'bachelor' | 'master' | 'phd' | 'no-requirement'
export type JobCategory = 'chef' | 'kitchen' | 'server' | 'bartender' | 'hostess' | 'cleaning' | 'barista' | 'cashier' | 'supervisor' | 'receptionist' | 'housekeeper' | 'valet' | 'dishwasher' | 'pastry' | 'sommelier' | 'maintenance' | 'security' | 'delivery' | 'banquets' | 'administration' | 'other'
export type JobLevel = 'entry' | 'mid-level' | 'senior' | 'lead' | 'executive'

// Phase 3 Job Posting Fields
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+'
export type Industry = 'technology' | 'healthcare' | 'finance' | 'education' | 'retail' | 'manufacturing' | 'consulting' | 'non-profit' | 'government' | 'other'
export type StartDate = 'immediate' | '1-2-weeks' | '1-month' | '2-months' | 'flexible'
export type UrgencyLevel = 'normal' | 'urgent' | 'critical'
export type ApplicationProcess = 'resume-only' | 'portfolio-required' | 'cover-letter-required' | 'video-interview' | 'technical-test'
export type InterviewRounds = '1' | '2' | '3' | '4+' | 'varies'

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

export type PipelineStatus = 'applied' | 'reviewed' | 'interview' | 'assessments' | 'finalista' | 'rejected' | 'not_moving_forward'

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
