'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	useDroppable,
} from '@dnd-kit/core'
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Application, PipelineStatus, JobPosting } from '../../../../types'
import { db, auth } from '../../../lib/firebase'
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

// Helper function to get application count for a job
const getApplicationCount = (applications: Application[], jobId: string) => {
	return applications.filter(app => app.jobId === jobId).length
}

// Define the columns for the Kanban board
const columns: PipelineStatus[] = [
	'applied',
	'reviewed',
	'interview',
	'offer',
	'hired',
	'not_moving_forward',
]

// Applicant Card Component
const ApplicantCard = ({ app }: { app: Application }) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: app.applicationId })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`bg-card p-4 mb-4 rounded-lg border border-border shadow-sm cursor-grab ${
				isDragging ? 'cursor-grabbing' : 'hover:shadow-md'
			} transition-shadow`}
		>
			<p className="font-semibold text-foreground">
				{app.candidateName || `Candidate ${app.candidateId.slice(0, 8)}`}
			</p>
			<p className="text-sm text-muted-foreground">
				Applied on {app.applicationDate}
			</p>
		</div>
	)
}

// Pipeline Column Component
const PipelineColumn = ({
	status,
	applicants,
}: {
	status: PipelineStatus
	applicants: Application[]
}) => {
	const { setNodeRef, isOver } = useDroppable({
		id: status,
	})

	return (
		<div
			ref={setNodeRef}
			className={`p-4 rounded-lg border transition-colors ${
				status === 'not_moving_forward'
					? 'bg-red-50 border-red-200'
					: 'bg-secondary border-border'
			} ${
				isOver
					? 'border-primary bg-primary/5'
					: ''
			}`}
		>
			<h2 className={`text-lg font-semibold mb-4 capitalize ${
				status === 'not_moving_forward'
					? 'text-red-700'
					: 'text-foreground'
			}`}>
				{status === 'not_moving_forward' ? 'Not Moving Forward' : status} ({applicants.length})
			</h2>
			<SortableContext
				items={applicants.map(a => a.applicationId)}
				strategy={verticalListSortingStrategy}
			>
				<div className="min-h-[200px]">
					{applicants.map(app => (
						<ApplicantCard key={app.applicationId} app={app} />
					))}
				</div>
			</SortableContext>
		</div>
	)
}

const AtsPage = () => {
	const [applicants, setApplicants] = useState<Application[]>([])
	const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState(auth.currentUser)

	const selectedJob = useMemo(() => {
		return jobPostings.find(job => job.jobId === selectedJobId)
	}, [jobPostings, selectedJobId])

	const filteredApplicants = useMemo(() => {
		if (!selectedJobId) return []

		return applicants.filter(app =>
			app.jobId === selectedJobId &&
			(app.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			 app.candidateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
			 searchTerm === '')
		)
	}, [applicants, searchTerm, selectedJobId])

	// Fetch data from Firestore
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			if (!currentUser) {
				setLoading(false)
				return
			}

			// Fetch job postings created by the current user
			const jobsQuery = query(
				collection(db, 'jobPostings'),
				where('createdByUserId', '==', currentUser.uid),
				orderBy('postedDate', 'desc')
			)

			const unsubscribeJobs = onSnapshot(jobsQuery,
				(querySnapshot) => {
					const jobsData: JobPosting[] = []
					console.log('Fetched job postings for user:', currentUser.uid)
					querySnapshot.forEach(doc => {
						const jobData = { jobId: doc.id, ...doc.data() } as JobPosting
						console.log('Job posting found:', {
							jobId: jobData.jobId,
							jobTitle: jobData.jobTitle,
							companyId: jobData.companyId,
							createdByUserId: jobData.createdByUserId
						})
						jobsData.push(jobData)
					})
					setJobPostings(jobsData)

					// Fetch applications for these job postings
					const jobIds = jobsData.map(job => job.jobId)
					console.log('Job IDs to fetch applications for:', jobIds)
					fetchApplicationsForJobs(jobIds)
				},
				(error) => {
					console.error('Error fetching job postings:', error)
				}
			)

			// We'll fetch applications after we have the job postings
			// This will be handled in the jobs query callback
			let unsubscribeApplications: (() => void) | null = null

			// Function to fetch applications for specific job IDs
			const fetchApplicationsForJobs = (jobIds: string[]) => {
				if (unsubscribeApplications) {
					unsubscribeApplications()
				}

				if (jobIds.length === 0) {
					setApplicants([])
					setLoading(false)
					return
				}

				// Create a query for applications where companyId matches the current user
				// We'll filter by jobId in the client-side code to avoid Firestore 'in' query limitations
				const applicationsQuery = query(
					collection(db, 'applications'),
					where('companyId', '==', currentUser.uid)
				)

				unsubscribeApplications = onSnapshot(applicationsQuery,
					(querySnapshot) => {
						const applicationsData: Application[] = []
						console.log('Fetched applications for company:', currentUser.uid)
						console.log('Available job IDs:', jobIds)
						querySnapshot.forEach(doc => {
							const appData = { applicationId: doc.id, ...doc.data() } as Application
							console.log('Application found:', {
								applicationId: appData.applicationId,
								jobId: appData.jobId,
								companyId: appData.companyId,
								candidateId: appData.candidateId
							})
							// Filter applications that belong to the current user's job postings
							if (jobIds.includes(appData.jobId)) {
								applicationsData.push(appData)
								console.log('Application added to results:', appData.jobId)
							} else {
								console.log('Application filtered out - jobId not in user jobs:', appData.jobId)
							}
						})
						console.log('Final applications count:', applicationsData.length)
						setApplicants(applicationsData)
						setLoading(false)
					},
					(error) => {
						console.error('Error fetching applications:', error)
						setLoading(false)
					}
				)
			}

			// Cleanup functions
			return () => {
				unsubscribeJobs()
				if (unsubscribeApplications) {
					unsubscribeApplications()
				}
			}
		})

		return () => unsubscribeAuth()
	}, [])

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event
		if (!over) return

		const activeId = active.id
		const activeApplicant = applicants.find(app => app.applicationId === activeId)

		// Check if we're dropping over a column (droppable) or over another card (sortable)
		const overId = over.id
		let newStatus: PipelineStatus

		// If dropping over a column directly
		if (columns.includes(overId as PipelineStatus)) {
			newStatus = overId as PipelineStatus
		} else {
			// If dropping over another card, find which column that card belongs to
			const overApplicant = applicants.find(app => app.applicationId === overId)
			if (overApplicant) {
				newStatus = overApplicant.pipelineStatus
			} else {
				return
			}
		}

		if (activeApplicant && activeApplicant.pipelineStatus !== newStatus) {
			try {
				// Update in Firestore
				const applicationRef = doc(db, 'applications', String(activeId))
				await updateDoc(applicationRef, {
					pipelineStatus: newStatus,
					updatedAt: new Date().toISOString()
				})

				// Update local state (this will be overridden by the real-time listener)
				setApplicants(prev =>
					prev.map(app =>
						app.applicationId === activeId
							? { ...app, pipelineStatus: newStatus }
							: app
					)
				)
			} catch (error) {
				console.error('Error updating application status:', error)
			}
		}
	}

	return (
		<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-2">Candidates</h1>
				<p className="text-muted-foreground">Manage your candidate pipeline and application tracking</p>
			</div>

			{/* Job Selection */}
			<div className="bg-card p-6 rounded-lg border border-border mb-8">
				<h2 className="text-xl font-semibold text-foreground mb-4">Select Job Posting</h2>
				{loading ? (
					<div className="text-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
						<p className="text-muted-foreground">Loading job postings...</p>
					</div>
				) : jobPostings.length === 0 ? (
					<div className="text-center py-8">
						<svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
						</svg>
						<h3 className="text-lg font-medium mb-2">No Job Postings Found</h3>
						<p className="text-muted-foreground mb-4">Create your first job posting to start receiving applications.</p>
						<a
							href="/company/job-postings/new"
							className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
						>
							Create Job Posting
						</a>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{jobPostings.map(job => (
							<div
								key={job.jobId}
								onClick={() => setSelectedJobId(job.jobId)}
								className={`p-4 border rounded-lg cursor-pointer transition-colors ${
									selectedJobId === job.jobId
										? 'border-primary bg-primary/10'
										: 'border-border hover:border-primary/50'
								}`}
							>
								<h3 className="font-semibold text-foreground">{job.jobTitle}</h3>
								<p className="text-sm text-muted-foreground mt-1">
									Posted: {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'N/A'}
								</p>
								<div className="flex items-center justify-between mt-2">
									<span className="text-sm text-muted-foreground">
										{getApplicationCount(applicants, job.jobId)} applications
									</span>
									<span className={`px-2 py-1 text-xs rounded-full ${
										job.status === 'published'
											? 'bg-green-100 text-green-800'
											: 'bg-gray-100 text-gray-800'
									}`}>
										{job.status}
									</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Kanban Board - Only show when job is selected */}
			{selectedJobId ? (
				<div className="bg-card p-6 rounded-lg border border-border">
					<div className="flex justify-between items-center mb-6">
						<div>
							<h2 className="text-xl font-semibold text-foreground">
								{selectedJob?.jobTitle} - Candidate Pipeline
							</h2>
							<p className="text-sm text-muted-foreground">
								{filteredApplicants.length} candidate{filteredApplicants.length !== 1 ? 's' : ''}
							</p>
						</div>
						<input
							type="text"
							placeholder="Search candidates..."
							className="w-1/4 px-3 py-2 bg-input border border-border rounded-md"
							onChange={e => setSearchTerm(e.target.value)}
						/>
					</div>
					{loading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
							<p className="text-muted-foreground">Loading applications...</p>
						</div>
					) : filteredApplicants.length === 0 ? (
						<div className="text-center py-8">
							<svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
							<h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
							<p className="text-muted-foreground">This job posting hasn't received any applications yet.</p>
						</div>
					) : (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleDragEnd}
						>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
								{columns.map(status => (
									<PipelineColumn
										key={status}
										status={status}
										applicants={filteredApplicants.filter(
											app => app.pipelineStatus === status
										)}
									/>
								))}
							</div>
						</DndContext>
					)}
				</div>
			) : (
				<div className="bg-card p-12 rounded-lg border border-border text-center">
					<div className="text-muted-foreground">
						<svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						<h3 className="text-lg font-medium mb-2">Select a Job Posting</h3>
						<p>Choose a job posting above to view and manage candidate applications.</p>
					</div>
				</div>
			)}
		</div>
	)
}

export default AtsPage

// Extend the Application interface for the mock data
declare module '../../../../types' {
	interface Application {
		candidateName?: string
	}
}