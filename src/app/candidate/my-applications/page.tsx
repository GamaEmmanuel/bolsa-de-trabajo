'use client'

import React, { useState, useEffect } from 'react'
import { Application, JobPosting } from '../../../../types'
import { db, auth } from '../../../lib/firebase'
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import ApplicantKanban from '../../../components/ApplicantKanban'

// Helper to get status color
const getStatusColor = (status: string) => {
	switch (status) {
		case 'reviewed':
			return 'bg-blue-100 text-blue-800'
		case 'interview':
			return 'bg-yellow-100 text-yellow-800'
		case 'offer':
			return 'bg-purple-100 text-purple-800'
		case 'hired':
			return 'bg-green-100 text-green-800'
		case 'rejected':
			return 'bg-red-100 text-red-800'
		default:
			return 'bg-gray-100 text-gray-800'
	}
}

// Helper to translate status labels
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
		case 'rejected':
			return 'Rechazado'
		default:
			return status
	}
}

const MyApplicationsPage = () => {
	const [applications, setApplications] = useState<Application[]>([])
	const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')
	const [user, setUser] = useState(auth.currentUser)

	// Fetch applications and job postings
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			if (!currentUser) {
				setLoading(false)
				return
			}

			// Fetch user's applications
			const applicationsQuery = query(
				collection(db, 'applications'),
				where('candidateId', '==', currentUser.uid)
			)

			const unsubscribeApplications = onSnapshot(applicationsQuery,
				(querySnapshot) => {
					const applicationsData: Application[] = []
					querySnapshot.forEach(doc => {
						applicationsData.push({ applicationId: doc.id, ...doc.data() } as Application)
					})
					setApplications(applicationsData)
					setLoading(false)
				},
				(error) => {
					console.error('Error fetching applications:', error)
					setError('Error al cargar las aplicaciones')
					setLoading(false)
				}
			)

			// Fetch job postings to get job details
			const jobsQuery = query(collection(db, 'jobPostings'))

			const unsubscribeJobs = onSnapshot(jobsQuery,
				(querySnapshot) => {
					const jobsData: JobPosting[] = []
					querySnapshot.forEach(doc => {
						jobsData.push({ jobId: doc.id, ...doc.data() } as JobPosting)
					})
					setJobPostings(jobsData)
				},
				(error) => {
					console.error('Error fetching job postings:', error)
				}
			)

			return () => {
				unsubscribeApplications()
				unsubscribeJobs()
			}
		})

		return () => unsubscribeAuth()
	}, [])

	// Enrich applications with job details
	const enrichedApplications = React.useMemo(() => {
		return applications.map(app => {
			const job = jobPostings.find(j => j.jobId === app.jobId)
			return {
				...app,
				jobTitle: job?.jobTitle || 'Job Title',
				companyName: job?.companyName || 'Company Name',
			}
		})
	}, [applications, jobPostings])

	// Handle application withdrawal
	const handleWithdraw = async (applicationId: string) => {
		if (!confirm('¿Estás seguro de que quieres retirar esta aplicación?')) {
			return
		}

		try {
			await deleteDoc(doc(db, 'applications', applicationId))
		} catch (error) {
			console.error('Error withdrawing application:', error)
			setError('Error al retirar la aplicación')
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 p-8">
				<div className="max-w-7xl mx-auto">
					<div className="flex items-center justify-center py-12">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<p className="ml-2 text-gray-600">Cargando aplicaciones...</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-4 md:space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-4">
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mis Aplicaciones</h1>
					<p className="text-sm md:text-base text-gray-600 mt-1">Rastrea el progreso de tus aplicaciones de empleo</p>
				</div>
				<div className="flex gap-2 flex-shrink-0">
					<button
						onClick={() => setViewMode('kanban')}
						className={`flex-1 sm:flex-initial px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium ${
							viewMode === 'kanban'
								? 'bg-pink-600 text-white'
								: 'bg-white text-gray-700 border border-gray-300'
						}`}
					>
						<span className="hidden sm:inline">Vista Kanban</span>
						<span className="sm:hidden">Kanban</span>
					</button>
					<button
						onClick={() => setViewMode('table')}
						className={`flex-1 sm:flex-initial px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium ${
							viewMode === 'table'
								? 'bg-pink-600 text-white'
								: 'bg-white text-gray-700 border border-gray-300'
						}`}
					>
						<span className="hidden sm:inline">Vista de Tabla</span>
						<span className="sm:hidden">Tabla</span>
					</button>
				</div>
			</div>

				{error && (
					<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
						<p className="text-red-600">{error}</p>
					</div>
				)}

				{viewMode === 'kanban' ? (
					<ApplicantKanban
						applications={enrichedApplications}
						onWithdraw={handleWithdraw}
						loading={loading}
					/>
				) : (
					<div className="bg-white rounded-lg shadow-md overflow-hidden">
						{/* Mobile Card View */}
						<div className="block md:hidden divide-y divide-gray-200">
							{enrichedApplications.length === 0 ? (
								<div className="p-6 text-center text-gray-500 text-sm">
									No se encontraron aplicaciones. Comienza a aplicar a empleos para verlos aquí.
								</div>
							) : (
								enrichedApplications.map(app => (
									<div key={app.applicationId} className="p-4 space-y-3">
										<div>
											<h3 className="font-semibold text-gray-900 text-sm">{app.jobTitle}</h3>
											<p className="text-xs text-gray-600 mt-0.5">{app.companyName}</p>
										</div>
										<div className="flex items-center justify-between">
											<p className="text-xs text-gray-500">
												{new Date(app.applicationDate).toLocaleDateString()}
											</p>
											<span
												className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
													app.pipelineStatus
												)}`}
											>
												{translateStatus(app.pipelineStatus)}
											</span>
										</div>
										{(app.pipelineStatus === 'applied' || app.pipelineStatus === 'reviewed') && (
											<button
												onClick={() => handleWithdraw(app.applicationId)}
												className="w-full px-3 py-2 text-red-600 hover:text-red-800 text-xs font-medium border border-red-200 rounded-lg hover:bg-red-50"
											>
												Retirar Aplicación
											</button>
										)}
									</div>
								))
							)}
						</div>

						{/* Desktop Table View */}
						<div className="hidden md:block overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Título del Empleo
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Empresa
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Fecha de Aplicación
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Estado
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Acciones
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{enrichedApplications.length === 0 ? (
										<tr>
											<td colSpan={5} className="px-6 py-12 text-center text-gray-500">
												No se encontraron aplicaciones. Comienza a aplicar a empleos para verlos aquí.
											</td>
										</tr>
									) : (
										enrichedApplications.map(app => (
											<tr key={app.applicationId}>
												<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
													{app.jobTitle}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													{app.companyName}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													{new Date(app.applicationDate).toLocaleDateString()}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													<span
														className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
															app.pipelineStatus
														)}`}
													>
														{translateStatus(app.pipelineStatus)}
													</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm">
													{(app.pipelineStatus === 'applied' || app.pipelineStatus === 'reviewed') && (
														<button
															onClick={() => handleWithdraw(app.applicationId)}
															className="text-red-600 hover:text-red-800 text-sm font-medium"
														>
															Retirar
														</button>
													)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				)}
		</div>
	)
}

export default MyApplicationsPage

// Extend the Application interface for the mock data
declare module '../../../../types' {
	interface Application {
		jobTitle?: string
		companyName?: string
	}
}