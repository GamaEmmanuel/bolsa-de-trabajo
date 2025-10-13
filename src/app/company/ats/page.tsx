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

// Helper function to generate initials from name
const getInitials = (name: string) => {
	if (!name) return 'UC'
	return name
		.split(' ')
		.map(word => word.charAt(0).toUpperCase())
		.slice(0, 2)
		.join('')
}

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

	const candidateName = app.candidateName || `Candidate ${app.candidateId.slice(0, 8)}`
	const initials = getInitials(candidateName)

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`bg-card p-4 mb-3 rounded-xl shadow-sm cursor-grab hover:shadow-md hover:scale-[1.02] transition-all duration-200 ${
				isDragging ? 'cursor-grabbing shadow-lg' : ''
			}`}
		>
			<div className="flex items-start space-x-3">
				<div className="flex-shrink-0">
					<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
						<span className="text-sm font-semibold text-primary">
							{initials}
						</span>
					</div>
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-bold text-foreground text-sm leading-tight">
						{candidateName}
					</p>
					<p className="text-xs text-gray-500 mt-1">
				Aplicado el {app.applicationDate}
			</p>
				</div>
			</div>
		</div>
	)
}

// Pipeline Column Component
const PipelineColumn = ({
	status,
	applicants,
	translateStatus,
}: {
	status: PipelineStatus
	applicants: Application[]
	translateStatus: (status: string) => string
}) => {
	const { setNodeRef, isOver } = useDroppable({
		id: status,
	})

	const getEmptyStateMessage = (status: PipelineStatus) => {
		switch (status) {
			case 'applied':
				return 'Arrastra candidatos aquí'
			case 'reviewed':
				return 'Candidatos revisados aparecerán aquí'
			case 'interview':
				return 'Candidatos en entrevista'
			case 'offer':
				return 'Ofertas pendientes'
			case 'hired':
				return 'Candidatos contratados'
			case 'not_moving_forward':
				return 'Candidatos no seleccionados'
			default:
				return 'Arrastra candidatos aquí'
		}
	}

	return (
		<div
			ref={setNodeRef}
			className={`p-4 rounded-xl transition-all duration-200 ${
				status === 'not_moving_forward'
					? 'bg-red-50/50'
					: 'bg-gray-50/30'
			} ${
				isOver
					? 'bg-primary/5 border-2 border-dashed border-primary/30'
					: ''
			}`}
		>
			<div className="flex items-center justify-between mb-4">
				<h2 className={`text-base font-bold capitalize ${
				status === 'not_moving_forward'
					? 'text-red-700'
					: 'text-foreground'
			}`}>
					{status === 'not_moving_forward' ? 'No Continúa' : translateStatus(status)}
			</h2>
				<span className={`px-2 py-1 text-xs rounded-full font-medium ${
					status === 'not_moving_forward'
						? 'bg-red-100 text-red-700'
						: 'bg-gray-100 text-gray-600'
				}`}>
					{applicants.length}
				</span>
			</div>
			<SortableContext
				items={applicants.map(a => a.applicationId)}
				strategy={verticalListSortingStrategy}
			>
				<div className="min-h-[200px]">
					{applicants.length > 0 ? (
						applicants.map(app => (
						<ApplicantCard key={app.applicationId} app={app} />
						))
					) : (
						<div className="flex items-center justify-center h-48 text-center">
							<div className="text-gray-400">
								<svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
								</svg>
								<p className="text-xs text-gray-500">
									{getEmptyStateMessage(status)}
								</p>
							</div>
						</div>
					)}
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

	const translateStatus = (status: string) => {
		switch (status) {
			case 'applied':
				return 'Aplicado'
			case 'reviewed':
				return 'Revisado'
			case 'interview':
				return 'Entrevista'
			case 'offer':
				return 'Oferta'
			case 'hired':
				return 'Contratado'
			case 'not_moving_forward':
				return 'No Continúa'
			default:
				return status
		}
	}

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
				<h1 className="text-3xl font-bold text-foreground mb-2">Candidatos</h1>
				<p className="text-muted-foreground">Gestiona tu pipeline de candidatos y seguimiento de aplicaciones</p>
			</div>

			{/* Job Selection */}
			<div className="bg-card p-6 rounded-xl shadow-sm mb-8">
				<h2 className="text-xl font-semibold text-foreground mb-4">Seleccionar Publicación de Empleo</h2>
				{loading ? (
					<div className="text-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
						<p className="text-muted-foreground">Cargando publicaciones de empleo...</p>
					</div>
				) : jobPostings.length === 0 ? (
					<div className="text-center py-8">
						<svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
						</svg>
						<h3 className="text-lg font-medium mb-2">No se Encontraron Publicaciones de Empleo</h3>
						<p className="text-muted-foreground mb-4">Crea tu primera publicación de empleo para comenzar a recibir aplicaciones.</p>
						<a
							href="/company/job-postings/new"
							className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
						>
							Crear Publicación de Empleo
						</a>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{jobPostings.map(job => (
							<div
								key={job.jobId}
								onClick={() => setSelectedJobId(job.jobId)}
								className={`p-6 rounded-xl cursor-pointer transition-all duration-200 ${
									selectedJobId === job.jobId
										? 'bg-orange-50 shadow-lg shadow-orange-200/50'
										: 'bg-card hover:shadow-lg hover:shadow-gray-200/50 hover:bg-gray-50'
								} shadow-sm`}
							>
								<h3 className="text-lg font-bold text-foreground mb-3">{job.jobTitle}</h3>
								<div className="space-y-2">
									<div className="flex items-center text-xs text-gray-500">
										<svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
										<span>Publicado: {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'N/A'}</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center text-xs text-gray-500">
											<svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
											</svg>
											<span>{getApplicationCount(applicants, job.jobId)} aplicaciones</span>
										</div>
									<span className={`px-2 py-1 text-xs rounded-full ${
										job.status === 'published'
											? 'bg-green-100 text-green-800'
											: 'bg-gray-100 text-gray-800'
									}`}>
										{job.status}
									</span>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Kanban Board - Only show when job is selected */}
			{selectedJobId ? (
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<div className="flex justify-between items-center mb-6">
						<div>
							<h2 className="text-xl font-semibold text-foreground">
								{selectedJob?.jobTitle} - Pipeline de Candidatos
							</h2>
							<p className="text-sm text-muted-foreground">
								{filteredApplicants.length} candidato{filteredApplicants.length !== 1 ? 's' : ''}
							</p>
						</div>
						<div className="relative w-1/4">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
						</div>
						<input
							type="text"
							placeholder="Buscar candidatos..."
								className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
							onChange={e => setSearchTerm(e.target.value)}
						/>
						</div>
					</div>
					{loading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
							<p className="text-muted-foreground">Cargando aplicaciones...</p>
						</div>
					) : filteredApplicants.length === 0 ? (
						<div className="text-center py-8">
							<svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
							<h3 className="text-lg font-medium mb-2">Aún No Hay Aplicaciones</h3>
							<p className="text-muted-foreground">Esta publicación de empleo aún no ha recibido aplicaciones.</p>
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
										translateStatus={translateStatus}
									/>
								))}
							</div>
						</DndContext>
					)}
				</div>
			) : (
				<div className="bg-card p-12 rounded-xl shadow-sm text-center">
					<div className="text-muted-foreground">
						<svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						<h3 className="text-lg font-medium mb-2">Selecciona una Publicación de Empleo</h3>
						<p>Elige una publicación de empleo arriba para ver y gestionar las aplicaciones de candidatos.</p>
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