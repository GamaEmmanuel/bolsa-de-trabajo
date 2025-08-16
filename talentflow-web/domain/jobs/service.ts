import { getAdminDb } from '@/lib/firebase/admin'
import type { JobPosting } from '@/lib/firebase/types'

const COLLECTION = 'jobs'

export async function createJob(companyId: string, createdByUserId: string, payload: Omit<JobPosting, 'jobId' | 'companyId' | 'createdByUserId' | 'status' | 'postedDate'> & { status?: JobPosting['status'] }) {
	const db = getAdminDb()
	const ref = db.collection(COLLECTION).doc()
	const job: JobPosting = {
		jobId: ref.id,
		companyId,
		createdByUserId,
		jobTitle: payload.jobTitle,
		jobDescription: payload.jobDescription,
		requirements: payload.requirements,
		salaryMin: payload.salaryMin,
		salaryMax: payload.salaryMax,
		isSalaryHidden: payload.isSalaryHidden ?? false,
		jobType: payload.jobType,
		locationId: payload.locationId,
		categoryId: payload.categoryId,
		status: payload.status ?? 'draft',
		postedDate: new Date().toISOString(),
		tier: payload.tier ?? 'clasica',
	}
	await ref.set(job)
	return job
}

export async function getJob(jobId: string) {
	const db = getAdminDb()
	const snap = await db.collection(COLLECTION).doc(jobId).get()
	return snap.exists ? (snap.data() as JobPosting) : null
}

export async function updateJob(jobId: string, updates: Partial<JobPosting>) {
	const db = getAdminDb()
	await db.collection(COLLECTION).doc(jobId).set(updates, { merge: true })
	return getJob(jobId)
}

export async function deleteJob(jobId: string) {
	const db = getAdminDb()
	await db.collection(COLLECTION).doc(jobId).delete()
}

export async function listJobs({ companyId, status, limit = 20, q }: { companyId?: string; status?: JobPosting['status']; limit?: number; q?: string }) {
	const db = getAdminDb()
	let query: FirebaseFirestore.Query = db.collection(COLLECTION)
	if (companyId) query = query.where('companyId', '==', companyId)
	if (status) query = query.where('status', '==', status)
	if (q) query = query.where('jobTitle', '>=', q).where('jobTitle', '<=', q + '\uf8ff')
	query = query.orderBy('postedDate', 'desc').limit(limit)
	const snap = await query.get()
	return snap.docs.map(d => d.data() as JobPosting)
}