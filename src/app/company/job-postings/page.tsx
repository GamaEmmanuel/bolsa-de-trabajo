'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { db, auth } from '../../../lib/firebase'
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { JobPosting } from '../../../../types'

const JobPostingsPage = () => {
	const [jobs, setJobs] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState(auth.currentUser)
	const [error, setError] = useState<string | null>(null)
	const [statusFilter, setStatusFilter] = useState<string | null>(null)

	const translateStatus = (status: string) => {
		switch (status) {
			case 'published':
				return 'Publicado'
			case 'pending_approval':
				return 'Pendiente de Aprobación'
			case 'draft':
				return 'Borrador'
			case 'closed':
				return 'Cerrado'
			case 'archived':
				return 'Archivado'
			case 'filled':
				return 'Llenado'
			case 'expired':
				return 'Expirado'
			default:
				return status.replace('_', ' ')
		}
	}

	const handleArchiveJob = async (jobId: string) => {
		try {
			const jobRef = doc(db, 'jobPostings', jobId)
			await updateDoc(jobRef, {
				status: 'archived',
				archivedAt: new Date().toISOString()
			})
		} catch (error) {
			console.error('Error archiving job:', error)
		}
	}

	useEffect(() => {
		// Listen for auth state changes
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			if (!currentUser) {
				setLoading(false)
				return
			}

			// Query jobs created by the current user (company)
			// This ensures only the current company's jobs are shown
			const q = query(
				collection(db, 'jobPostings'),
				where('createdByUserId', '==', currentUser.uid),
				orderBy('postedDate', 'desc')
			)

			const unsubscribe = onSnapshot(q,
				(querySnapshot) => {
					const jobsData: JobPosting[] = []
					querySnapshot.forEach(doc => {
						jobsData.push({ jobId: doc.id, ...doc.data() } as JobPosting)
					})
					setJobs(jobsData)
					setLoading(false)
					setError(null)
				},
				(error) => {
					console.error('Error fetching job postings:', error)
					setError('Error al cargar las publicaciones de empleo. Por favor, inténtalo de nuevo.')
					setLoading(false)
				}
			)

			// Return cleanup function for Firestore listener
			return unsubscribe
		})

		// Cleanup auth listener on unmount
		return () => unsubscribeAuth()
	}, [])

	return (
		<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold text-foreground mb-2">Tus Publicaciones de Empleo</h1>
					<p className="text-muted-foreground">Gestiona y rastrea las ofertas de empleo de tu empresa</p>
				</div>
				<Link
					href="/company/job-postings/new"
					className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
				>
					<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Crear Nuevo Empleo
				</Link>
			</div>

			{/* Error Message */}
			{error && (
				<div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm font-medium text-red-800">{error}</p>
						</div>
					</div>
				</div>
			)}

			<div className="bg-card p-6 rounded-xl shadow-sm">
					{loading ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-center">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
							<p className="mt-2 text-gray-600">Cargando tus publicaciones de empleo...</p>
						</div>
					</div>
					) : !user ? (
					<div className="text-center py-8">
						<p className="text-red-600">Por favor, inicia sesión para ver tus publicaciones de empleo.</p>
					</div>
				) : (
					<>
						{/* Job Statistics */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
							<button
								onClick={() => setStatusFilter(null)}
								className={`p-4 rounded-lg transition-colors text-left ${
									statusFilter === null
										? 'bg-orange-100 border-2 border-orange-500'
										: 'bg-orange-50 hover:bg-orange-100'
								}`}
							>
								<div className="text-2xl font-bold text-orange-600">
									{jobs.filter(job => job.status !== 'archived').length}
								</div>
								<div className="text-sm text-orange-700">Total de Empleos</div>
							</button>
							<button
								onClick={() => setStatusFilter('published')}
								className={`p-4 rounded-lg transition-colors text-left ${
									statusFilter === 'published'
										? 'bg-green-100 border-2 border-green-500'
										: 'bg-green-50 hover:bg-green-100'
								}`}
							>
								<div className="text-2xl font-bold text-green-600">
									{jobs.filter(job => job.status === 'published').length}
								</div>
								<div className="text-sm text-green-700">Publicados</div>
							</button>
							<button
								onClick={() => setStatusFilter('draft')}
								className={`p-4 rounded-lg transition-colors text-left ${
									statusFilter === 'draft'
										? 'bg-yellow-100 border-2 border-yellow-500'
										: 'bg-yellow-50 hover:bg-yellow-100'
								}`}
							>
								<div className="text-2xl font-bold text-yellow-600">
									{jobs.filter(job => job.status === 'draft').length}
								</div>
								<div className="text-sm text-yellow-700">Borradores</div>
							</button>
							<Link
								href="/company/job-postings/archived"
								className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer block"
							>
								<div className="text-2xl font-bold text-gray-600">
									{jobs.filter(job => job.status === 'archived').length}
								</div>
								<div className="text-sm text-gray-700">Archivados</div>
							</Link>
						</div>

						{/* Active Filter Indicator */}
						{statusFilter && (
							<div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
								<span className="text-sm text-blue-700">
									Filtrando por: <span className="font-semibold">{translateStatus(statusFilter)}</span>
								</span>
								<button
									onClick={() => setStatusFilter(null)}
									className="text-xs text-blue-600 hover:text-blue-800 underline"
								>
									Limpiar filtro
								</button>
							</div>
						)}

						{/* Job Cards */}
						<div className="space-y-4">
							{jobs.filter(job => job.status !== 'archived').length > 0 ? (
								jobs
									.filter(job => job.status !== 'archived')
									.filter(job => statusFilter === null || job.status === statusFilter)
									.map(job => (
									<Link
										key={job.jobId}
										href={`/jobs/${job.jobId}`}
										className="block bg-white p-6 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
									>
										<div className="flex justify-between items-start">
											<div className="flex-1">
												<div className="flex items-center justify-between mb-2">
													<h3 className="text-lg font-semibold text-gray-900">{job.jobTitle}</h3>
													<span
														className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
															job.status === 'published'
																? 'bg-green-100 text-green-800'
																: job.status === 'pending_approval'
																? 'bg-yellow-100 text-yellow-800'
																: job.status === 'archived'
																? 'bg-gray-100 text-gray-800'
																: 'bg-gray-100 text-gray-800'
														}`}
													>
														{translateStatus(job.status || '')}
													</span>
												</div>
												<p className="text-sm text-gray-600 mb-2 line-clamp-2">
													{job.jobDescription?.substring(0, 150)}...
												</p>
												<div className="flex items-center space-x-4 text-sm text-gray-500">
													<span className="capitalize">{job.tier || 'Clásico'} Nivel</span>
													<span>•</span>
													<span>{job.postedDate || 'No publicado'}</span>
												</div>
											</div>
											<div className="ml-4 flex items-center space-x-2">
												{job.status !== 'archived' && (
													<button
														onClick={(e) => {
															e.preventDefault()
															handleArchiveJob(job.jobId)
														}}
														className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
													>
														Archivar
													</button>
												)}
												<span className="text-primary text-sm font-medium">
													Ver Detalles →
												</span>
											</div>
										</div>
									</Link>
								))
							) : statusFilter ? (
								<div className="text-center py-12">
									<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
									<h3 className="mt-2 text-sm font-medium text-gray-900">No hay publicaciones con este filtro</h3>
									<p className="mt-1 text-sm text-gray-500">No se encontraron publicaciones con el estado "{translateStatus(statusFilter)}".</p>
									<div className="mt-6">
										<button
											onClick={() => setStatusFilter(null)}
											className="inline-flex items-center px-4 py-2 text-sm font-semibold text-primary hover:underline"
										>
											Limpiar filtro
										</button>
									</div>
								</div>
							) : (
								<div className="text-center py-12">
									<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
									</svg>
									<h3 className="mt-2 text-sm font-medium text-gray-900">Sin publicaciones de empleo</h3>
									<p className="mt-1 text-sm text-gray-500">Comienza creando tu primera publicación de empleo.</p>
									<div className="mt-6">
										<Link
											href="/company/job-postings/new"
											className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
										>
											<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
											</svg>
											Crear Nuevo Empleo
										</Link>
									</div>
								</div>
							)}
						</div>
					</>
					)}
			</div>
		</div>
	)
}

export default JobPostingsPage