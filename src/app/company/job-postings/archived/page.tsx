'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { db, auth } from '../../../../lib/firebase'
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { JobPosting } from '../../../../../types'

const ArchivedJobPostingsPage = () => {
	const [jobs, setJobs] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState(auth.currentUser)
	const [error, setError] = useState<string | null>(null)

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
			default:
				return status.replace('_', ' ')
		}
	}

	const handleUnarchiveJob = async (jobId: string) => {
		try {
			const jobRef = doc(db, 'jobPostings', jobId)
			await updateDoc(jobRef, {
				status: 'published',
				unarchivedAt: new Date().toISOString()
			})
		} catch (error) {
			console.error('Error unarchiving job:', error)
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

			// Query only archived jobs created by the current user
			const q = query(
				collection(db, 'jobPostings'),
				where('createdByUserId', '==', currentUser.uid),
				where('status', '==', 'archived'),
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
					console.error('Error fetching archived job postings:', error)
					setError('Error al cargar las publicaciones archivadas. Por favor, inténtalo de nuevo.')
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
					<div className="flex items-center space-x-4 mb-2">
						<Link
							href="/company/job-postings"
							className="text-gray-500 hover:text-gray-700 transition-colors"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
						</Link>
						<h1 className="text-3xl font-bold text-foreground">Publicaciones Archivadas</h1>
					</div>
					<p className="text-muted-foreground ml-10">Gestiona tus publicaciones de empleo archivadas</p>
				</div>
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
							<p className="mt-2 text-gray-600">Cargando publicaciones archivadas...</p>
						</div>
					</div>
				) : !user ? (
					<div className="text-center py-8">
						<p className="text-red-600">Por favor, inicia sesión para ver tus publicaciones archivadas.</p>
					</div>
				) : (
					<>
						{/* Job Statistics */}
						<div className="mb-6">
							<div className="bg-gray-50 p-4 rounded-lg inline-block">
								<div className="text-2xl font-bold text-gray-600">{jobs.length}</div>
								<div className="text-sm text-gray-700">Total de Empleos Archivados</div>
							</div>
						</div>

						{/* Job Cards */}
						<div className="space-y-4">
							{jobs.length > 0 ? (
								jobs.map(job => (
									<div
										key={job.jobId}
										className="block bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
									>
										<div className="flex justify-between items-center gap-4">
											<div className="flex-1 min-w-0">
												<h3 className="text-lg font-semibold text-gray-900 mb-1">{job.jobTitle}</h3>
												<p className="text-sm text-gray-600 line-clamp-1">
													{job.jobDescription?.substring(0, 150)}...
												</p>
											</div>
											<div className="flex items-center gap-3 flex-shrink-0">
												<span className="text-xs text-gray-500 capitalize whitespace-nowrap">{job.tier || 'Clásico'} Nivel</span>
												<span className="text-xs text-gray-500 whitespace-nowrap">{job.postedDate || 'No publicado'}</span>
												<span className="px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap bg-gray-100 text-gray-800">
													{translateStatus(job.status || '')}
												</span>
												<Link
													href={`/jobs/${job.jobId}`}
													className="text-primary text-sm font-medium whitespace-nowrap"
												>
													Ver Detalles →
												</Link>
											</div>
										</div>
									</div>
								))
							) : (
								<div className="text-center py-12">
									<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
									</svg>
									<h3 className="mt-2 text-sm font-medium text-gray-900">No hay publicaciones archivadas</h3>
									<p className="mt-1 text-sm text-gray-500">Las publicaciones archivadas aparecerán aquí.</p>
									<div className="mt-6">
										<Link
											href="/company/job-postings"
											className="inline-flex items-center px-4 py-2 text-sm font-semibold text-primary hover:underline"
										>
											← Volver a Publicaciones de Empleo
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

export default ArchivedJobPostingsPage
