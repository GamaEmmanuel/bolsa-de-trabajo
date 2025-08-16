import { getAdminDb } from '@/lib/firebase/admin'
import type { Application, PipelineStatus } from '@/lib/firebase/types'

const COLLECTION = 'applications'

export async function applyToJob(candidateId: string, jobId: string) {
	const db = getAdminDb()
	const ref = db.collection(COLLECTION).doc()
	const app: Application = {
		applicationId: ref.id,
		candidateId,
		jobId,
		applicationDate: new Date().toISOString(),
		pipelineStatus: 'applied',
	}
	await ref.set(app)
	return app
}

export async function listApplicationsForCandidate(candidateId: string) {
	const db = getAdminDb()
	const snap = await db.collection(COLLECTION).where('candidateId', '==', candidateId).orderBy('applicationDate', 'desc').get()
	return snap.docs.map(d => d.data() as Application)
}

export async function listApplicationsForJob(jobId: string) {
	const db = getAdminDb()
	const snap = await db.collection(COLLECTION).where('jobId', '==', jobId).get()
	return snap.docs.map(d => d.data() as Application)
}

export async function updateApplicationStatus(applicationId: string, status: PipelineStatus) {
	const db = getAdminDb()
	await db.collection(COLLECTION).doc(applicationId).set({ pipelineStatus: status, updatedAt: new Date().toISOString() }, { merge: true })
}