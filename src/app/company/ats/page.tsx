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
	'assessments',
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

	// Format the application date to be more readable and shorter
	const formatApplicationDate = (dateString: string) => {
		try {
			const date = new Date(dateString)
			return date.toLocaleDateString('es-ES', {
				day: '2-digit',
				month: '2-digit',
				year: '2-digit'
			})
		} catch {
			return dateString
		}
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`bg-white p-4 mb-3 rounded-lg shadow-sm border border-gray-100 cursor-grab hover:shadow-md transition-all duration-200 w-full ${
				isDragging ? 'cursor-grabbing shadow-lg border-primary/30' : ''
			}`}
		>
			<div className="flex items-center space-x-3 w-full">
				<div className="flex-shrink-0">
					<div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
						<span className="text-xs font-semibold text-primary">
							{initials}
						</span>
					</div>
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-gray-900 text-sm leading-tight mb-1 break-words">
						{candidateName}
					</p>
					<p className="text-xs text-gray-500 break-words">
						Aplicado: {formatApplicationDate(app.applicationDate)}
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
			case 'assessments':
				return 'Candidatos en evaluación'
			case 'finalista':
				return 'Candidatos finalistas'
			default:
				return 'Arrastra candidatos aquí'
		}
	}

	return (
			<div
				ref={setNodeRef}
				className={`p-4 rounded-xl transition-all duration-200 w-full ${
					status === 'finalista'
						? 'bg-green-50/40 border-2 border-green-200'
						: 'bg-gray-50/50 border-2 border-gray-200'
				} ${
					isOver
						? 'bg-primary/5 border-2 border-dashed border-primary/30'
						: ''
				}`}
			>
								<div className="flex items-center justify-between mb-5">
									<h2 className={`text-sm font-bold capitalize ${
									status === 'finalista'
										? 'text-green-700'
										: 'text-gray-800'
								}`}>
										{translateStatus(status)}
								</h2>
									<span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
										status === 'finalista'
											? 'bg-green-100 text-green-700'
											: 'bg-gray-100 text-gray-600'
									}`}>
										{applicants.length}
									</span>
								</div>
								<SortableContext
									items={applicants.map(a => a.applicationId)}
									strategy={verticalListSortingStrategy}
								>
									<div className="min-h-[250px]">
										{applicants.length > 0 ? (
											applicants.map(app => (
											<ApplicantCard key={app.applicationId} app={app} />
											))
										) : (
											<div className="flex items-center justify-center h-48 text-center">
												<div className="text-gray-400">
													<svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
													</svg>
													<p className="text-sm text-gray-500 font-medium">
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

// Resultado Column Component (contains both finalista and rejected)
const ResultadoColumn = ({
	finalistaApplicants,
	rejectedApplicants,
	translateStatus,
}: {
	finalistaApplicants: Application[]
	rejectedApplicants: Application[]
	translateStatus: (status: string) => string
}) => {
	const { setNodeRef: setFinalistaRef, isOver: isFinalistaOver } = useDroppable({
		id: 'finalista',
	})

	const { setNodeRef: setRejectedRef, isOver: isRejectedOver } = useDroppable({
		id: 'not_moving_forward',
	})

	return (
		<div className="p-4 rounded-xl bg-gray-50/50 border-2 border-gray-200 w-full">
			<h2 className="text-sm font-bold text-gray-800 mb-4">Resultado</h2>

			{/* Finalista Section */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-xs font-semibold text-green-700">Finalista</h3>
					<span className="px-2 py-1 text-xs rounded-full font-semibold bg-green-100 text-green-700">
						{finalistaApplicants.length}
					</span>
				</div>
				<div
					ref={setFinalistaRef}
					className={`p-3 rounded-lg transition-all duration-200 ${
						isFinalistaOver
							? 'bg-primary/5 border-2 border-dashed border-primary/30'
							: 'bg-green-50/40 border-2 border-green-200'
					}`}
				>
					<SortableContext
						items={finalistaApplicants.map(a => a.applicationId)}
						strategy={verticalListSortingStrategy}
					>
						<div className="min-h-[120px]">
							{finalistaApplicants.length > 0 ? (
								finalistaApplicants.map(app => (
									<ApplicantCard key={app.applicationId} app={app} />
								))
							) : (
								<div className="flex items-center justify-center h-24 text-center">
									<div className="text-gray-400">
										<svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
										</svg>
										<p className="text-xs text-gray-500">Candidatos finalistas</p>
									</div>
								</div>
							)}
						</div>
					</SortableContext>
				</div>
			</div>

			{/* Rejected Section */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-xs font-semibold text-red-700">No Continúa</h3>
					<span className="px-2 py-1 text-xs rounded-full font-semibold bg-red-100 text-red-700">
						{rejectedApplicants.length}
					</span>
				</div>
				<div
					ref={setRejectedRef}
					className={`p-3 rounded-lg transition-all duration-200 ${
						isRejectedOver
							? 'bg-primary/5 border-2 border-dashed border-primary/30'
							: 'bg-red-50/40 border-2 border-red-200'
					}`}
				>
					<SortableContext
						items={rejectedApplicants.map(a => a.applicationId)}
						strategy={verticalListSortingStrategy}
					>
						<div className="min-h-[120px]">
							{rejectedApplicants.length > 0 ? (
								rejectedApplicants.map(app => (
									<ApplicantCard key={app.applicationId} app={app} />
								))
							) : (
								<div className="flex items-center justify-center h-24 text-center">
									<div className="text-gray-400">
										<svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
										</svg>
										<p className="text-xs text-gray-500">Candidatos no seleccionados</p>
									</div>
								</div>
							)}
						</div>
					</SortableContext>
				</div>
			</div>
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
	const [jobsCurrentPage, setJobsCurrentPage] = useState(1)
	const jobsPerPage = 6

	const translateStatus = (status: string) => {
		switch (status) {
			case 'applied':
				return 'Aplicado'
			case 'reviewed':
				return 'Revisado'
			case 'interview':
				return 'Entrevista'
			case 'assessments':
				return 'Evaluación'
			case 'finalista':
				return 'Finalista'
			case 'not_moving_forward':
				return 'No Continúa'
			default:
				return status
		}
	}

	const selectedJob = useMemo(() => {
		return jobPostings.find(job => job.jobId === selectedJobId)
	}, [jobPostings, selectedJobId])

	// Pagination for jobs
	const totalJobPages = Math.ceil(jobPostings.length / jobsPerPage)
	const startJobIndex = (jobsCurrentPage - 1) * jobsPerPage
	const endJobIndex = startJobIndex + jobsPerPage
	const currentJobsPage = jobPostings.slice(startJobIndex, endJobIndex)

	const handleJobPageChange = (page: number) => {
		setJobsCurrentPage(page)
	}

	const filteredApplicants = useMemo(() => {
		if (!selectedJobId) return []

		return applicants.filter(app =>
			app.jobId === selectedJobId &&
			(app.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			 app.candidateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
			 searchTerm === '')
		).map(app => {
			// Map old 'offer' and 'hired' statuses to new 'finalista' status
			if (app.pipelineStatus === 'offer' || app.pipelineStatus === 'hired') {
				return { ...app, pipelineStatus: 'finalista' as PipelineStatus }
			}
			return app
		})
	}, [applicants, searchTerm, selectedJobId])

	// Fetch data from Firestore
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			if (!currentUser) {
				setLoading(false)
				return
			}

			// Fetch job postings created by the current user (only published, not archived)
			const jobsQuery = query(
				collection(db, 'jobPostings'),
				where('createdByUserId', '==', currentUser.uid),
				where('status', '==', 'published'),
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

		// All valid droppable statuses including resultado columns
		const allValidStatuses = [...columns, 'finalista', 'not_moving_forward']

		// If dropping over a column directly
		if (allValidStatuses.includes(overId as PipelineStatus)) {
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
				// Map 'finalista' back to 'offer' when saving to database for backward compatibility
				const statusToSave = newStatus === 'finalista' ? 'offer' : newStatus

				// Update in Firestore
				const applicationRef = doc(db, 'applications', String(activeId))
				await updateDoc(applicationRef, {
					pipelineStatus: statusToSave,
					updatedAt: new Date().toISOString()
				})

				// Update local state (this will be overridden by the real-time listener)
				setApplicants(prev =>
					prev.map(app =>
						app.applicationId === activeId
							? { ...app, pipelineStatus: statusToSave as PipelineStatus }
							: app
					)
				)
			} catch (error) {
				console.error('Error updating application status:', error)
			}
		}
	}

	return (
		<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<div className="mb-6">
				<h1 className="text-3xl font-bold text-foreground">Candidatos</h1>
			</div>

			{/* Job Selection */}
			<div className="bg-card p-4 rounded-xl shadow-sm mb-6">
				<h2 className="text-lg font-semibold text-foreground mb-3">Seleccionar Publicación de Empleo</h2>
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
					<>
						<div className="space-y-1.5">
							{currentJobsPage.map(job => (
								<div
									key={job.jobId}
									onClick={() => setSelectedJobId(job.jobId)}
									className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
										selectedJobId === job.jobId
											? 'bg-orange-50 border-2 border-orange-400'
											: 'bg-card hover:bg-gray-50 border border-gray-200'
									}`}
								>
									<div className="flex items-center justify-between gap-3">
										<h3 className="text-base font-semibold text-foreground truncate flex-1 min-w-0">{job.jobTitle}</h3>
										<div className="flex items-center gap-3 flex-shrink-0">
											<span className={`px-2 py-0.5 text-xs rounded-full ${
												job.status === 'published'
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-800'
											}`}>
												{job.status}
											</span>
											<div className="flex items-center text-xs text-gray-500">
												<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
												</svg>
												<span className="font-medium">{getApplicationCount(applicants, job.jobId)}</span>
											</div>
											<div className="flex items-center text-xs text-gray-500">
												<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
												<span>{job.postedDate ? new Date(job.postedDate).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }) : 'N/A'}</span>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Pagination */}
						{totalJobPages > 1 ? (
							<div className="flex items-center justify-between mt-4">
								<div className="flex items-center justify-center gap-2 flex-1">
									<button
										onClick={() => handleJobPageChange(jobsCurrentPage - 1)}
										disabled={jobsCurrentPage === 1}
										className={`px-3 py-1 rounded-md text-sm font-medium ${
											jobsCurrentPage === 1
												? 'bg-gray-100 text-gray-400 cursor-not-allowed'
												: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
										}`}
									>
										Anterior
									</button>

									{Array.from({ length: totalJobPages }, (_, i) => i + 1).map(page => (
										<button
											key={page}
											onClick={() => handleJobPageChange(page)}
											className={`px-3 py-1 rounded-md text-sm font-medium ${
												jobsCurrentPage === page
													? 'bg-orange-600 text-white'
													: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
											}`}
										>
											{page}
										</button>
									))}

									<button
										onClick={() => handleJobPageChange(jobsCurrentPage + 1)}
										disabled={jobsCurrentPage === totalJobPages}
										className={`px-3 py-1 rounded-md text-sm font-medium ${
											jobsCurrentPage === totalJobPages
												? 'bg-gray-100 text-gray-400 cursor-not-allowed'
												: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
										}`}
									>
										Siguiente
									</button>
								</div>

								{/* Results Info */}
								<div className="text-xs text-gray-600 ml-4 whitespace-nowrap">
									Mostrando {startJobIndex + 1}-{Math.min(endJobIndex, jobPostings.length)} de {jobPostings.length}
								</div>
							</div>
						) : (
							<div className="text-center mt-3 text-xs text-gray-600">
								Mostrando {startJobIndex + 1}-{Math.min(endJobIndex, jobPostings.length)} de {jobPostings.length} publicaciones
							</div>
						)}
					</>
				)}
			</div>

			{/* Kanban Board - Only show when job is selected */}
			{selectedJobId ? (
				<div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
					<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
						<div>
							<h2 className="text-2xl font-bold text-gray-900 mb-1">
								{selectedJob?.jobTitle} - Pipeline de Candidatos
							</h2>
							<p className="text-gray-600">
								{filteredApplicants.length} candidato{filteredApplicants.length !== 1 ? 's' : ''}
							</p>
						</div>
						<div className="relative w-full sm:w-80">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
						</div>
						<input
							type="text"
							placeholder="Buscar candidatos..."
								className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all duration-200"
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
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
								<ResultadoColumn
									finalistaApplicants={filteredApplicants.filter(
										app => app.pipelineStatus === 'finalista'
									)}
									rejectedApplicants={filteredApplicants.filter(
										app => app.pipelineStatus === 'not_moving_forward'
									)}
									translateStatus={translateStatus}
								/>
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