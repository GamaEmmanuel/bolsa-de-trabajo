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
	const [showShareModal, setShowShareModal] = useState(false)

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

	const copyCompanyJobsLink = () => {
		if (!user) return
		const companyJobsUrl = `${window.location.origin}/company/${user.uid}/jobs`
		navigator.clipboard.writeText(companyJobsUrl).then(() => {
			alert('¡Link copiado al portapapeles!')
		}).catch(() => {
			alert('Error al copiar el link.')
		})
	}

	const shareToSocial = (platform: string) => {
		if (!user) return
		const url = encodeURIComponent(`${window.location.origin}/company/${user.uid}/jobs`)
		const title = encodeURIComponent(`Oportunidades laborales en nuestra empresa`)
		const text = encodeURIComponent(`¡Mira las oportunidades laborales en nuestra empresa!`)

		let shareUrl = ''
		switch (platform) {
			case 'twitter':
				shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
				break
			case 'linkedin':
				shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${text}`
				break
			case 'facebook':
				shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`
				break
		}

		if (shareUrl) {
			const width = 600
			const height = 600
			const left = (window.screen.width - width) / 2
			const top = (window.screen.height - height) / 2
			window.open(shareUrl, '_blank', `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`)
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
		<div className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-4 sm:px-6 lg:px-8">
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Tus Publicaciones de Empleo</h1>
					<p className="text-sm sm:text-base text-muted-foreground">Gestiona y rastrea las ofertas de empleo de tu empresa</p>
				</div>
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
					<button
						onClick={() => setShowShareModal(true)}
						className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-pink-500 rounded-lg shadow-sm hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200"
					>
						<svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
						</svg>
						Compartir Empleos
					</button>
					<Link
						href="/company/job-postings/new"
						className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-pink-600 rounded-lg shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200"
					>
						<svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Crear Nuevo Empleo
					</Link>
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
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
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
						<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
							<button
								onClick={() => setStatusFilter(null)}
								className={`p-3 sm:p-4 rounded-lg transition-colors text-left ${
									statusFilter === null
										? 'bg-pink-100 border-2 border-pink-500'
										: 'bg-pink-50 hover:bg-pink-100'
								}`}
							>
								<div className="text-xl sm:text-2xl font-bold text-pink-600">
									{jobs.filter(job => job.status !== 'archived').length}
								</div>
								<div className="text-xs sm:text-sm text-pink-700">Total de Empleos</div>
							</button>
							<button
								onClick={() => setStatusFilter('published')}
								className={`p-3 sm:p-4 rounded-lg transition-colors text-left ${
									statusFilter === 'published'
										? 'bg-green-100 border-2 border-green-500'
										: 'bg-green-50 hover:bg-green-100'
								}`}
							>
								<div className="text-xl sm:text-2xl font-bold text-green-600">
									{jobs.filter(job => job.status === 'published').length}
								</div>
								<div className="text-xs sm:text-sm text-green-700">Publicados</div>
							</button>
							<button
								onClick={() => setStatusFilter('draft')}
								className={`p-3 sm:p-4 rounded-lg transition-colors text-left ${
									statusFilter === 'draft'
										? 'bg-yellow-100 border-2 border-yellow-500'
										: 'bg-yellow-50 hover:bg-yellow-100'
								}`}
							>
								<div className="text-xl sm:text-2xl font-bold text-yellow-600">
									{jobs.filter(job => job.status === 'draft').length}
								</div>
								<div className="text-xs sm:text-sm text-yellow-700">Borradores</div>
							</button>
							<Link
								href="/company/job-postings/archived"
								className="bg-gray-50 p-3 sm:p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer block"
							>
								<div className="text-xl sm:text-2xl font-bold text-gray-600">
									{jobs.filter(job => job.status === 'archived').length}
								</div>
								<div className="text-xs sm:text-sm text-gray-700">Archivados</div>
							</Link>
						</div>

						{/* Active Filter Indicator */}
						{statusFilter && (
							<div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 bg-pink-50 border border-pink-200 rounded-lg p-2.5 sm:p-3">
								<span className="text-xs sm:text-sm text-pink-700">
									Filtrando por: <span className="font-semibold">{translateStatus(statusFilter)}</span>
								</span>
								<button
									onClick={() => setStatusFilter(null)}
									className="text-xs text-pink-600 hover:text-pink-800 underline"
								>
									Limpiar filtro
								</button>
							</div>
						)}

						{/* Job Cards */}
						<div className="space-y-3 sm:space-y-4">
							{jobs.filter(job => job.status !== 'archived').length > 0 ? (
								jobs
									.filter(job => job.status !== 'archived')
									.filter(job => statusFilter === null || job.status === statusFilter)
									.map(job => (
									<Link
										key={job.jobId}
										href={`/jobs/${job.jobId}`}
										className="block bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-pink-500 hover:shadow-md transition-all duration-200 cursor-pointer"
									>
										<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
											<div className="flex-1 min-w-0">
												<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 break-words">{job.jobTitle}</h3>
												<p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-1">
													{job.jobDescription?.substring(0, 150)}...
												</p>
											</div>
											<div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 flex-shrink-0">
												<span className="text-xs text-gray-500 capitalize">{job.tier || 'Clásico'} Nivel</span>
												<span className="hidden sm:inline text-xs text-gray-500 whitespace-nowrap">{job.postedDate || 'No publicado'}</span>
												<span
													className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
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
												<span className="hidden sm:inline text-pink-600 text-sm font-medium whitespace-nowrap">
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
											className="inline-flex items-center px-4 py-2 text-sm font-semibold text-pink-600 hover:text-pink-700 hover:underline"
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
											className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-pink-600 rounded-lg shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
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

			{/* Share Modal */}
			{showShareModal && user && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
						<h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Compartir Empleos de Tu Empresa</h3>
						<p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
							Comparte esta página con todos tus empleos disponibles:
						</p>

						{/* Copy Link */}
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
							<input
								type="text"
								value={`${window.location.origin}/company/${user.uid}/jobs`}
								readOnly
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-xs sm:text-sm"
							/>
							<button
								onClick={copyCompanyJobsLink}
								className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm whitespace-nowrap"
							>
								Copiar
							</button>
						</div>

						{/* Social Media Buttons */}
						<div className="mb-4">
							<p className="text-xs sm:text-sm text-gray-600 mb-2">Compartir en redes sociales:</p>
							<div className="flex flex-col sm:flex-row gap-2">
								<button
									onClick={() => shareToSocial('linkedin')}
									className="flex-1 px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm flex items-center justify-center gap-1"
								>
									<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
									</svg>
									LinkedIn
								</button>
								<button
									onClick={() => shareToSocial('twitter')}
									className="flex-1 px-3 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors text-sm flex items-center justify-center gap-1"
								>
									<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
									</svg>
									Twitter
								</button>
								<button
									onClick={() => shareToSocial('facebook')}
									className="flex-1 px-3 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 transition-colors text-sm flex items-center justify-center gap-1"
								>
									<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
									</svg>
									Facebook
								</button>
							</div>
						</div>

						<div className="flex justify-end space-x-2">
							<button
								onClick={() => setShowShareModal(false)}
								className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
							>
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default JobPostingsPage