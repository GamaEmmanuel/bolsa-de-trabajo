'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Head from 'next/head'
import { JobPosting } from '../../../../types'
import { db, auth } from '../../../../lib/firebase'
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, increment, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

// Extend the JobPosting interface
declare module '../../../../types' {
	interface JobPosting {
		companyName?: string
		location?: string
	}
}

interface CompanyData {
	companyName: string
	logoUrl?: string
	description?: string
	website?: string
	industry?: string
	companySize?: string
}

const CompanyJobsPage = () => {
	const params = useParams()
	const router = useRouter()
	const companyId = params?.companyId as string

	const [jobs, setJobs] = useState<JobPosting[]>([])
	const [companyData, setCompanyData] = useState<CompanyData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [user, setUser] = useState(auth.currentUser)
	const [showShareModal, setShowShareModal] = useState(false)
	const jobsPerPage = 20

	// Track page view analytics
	useEffect(() => {
		const trackPageView = async () => {
			if (!companyId) return

			try {
				const companyRef = doc(db, 'users', companyId)
				await updateDoc(companyRef, {
					'analytics.jobPageViews': increment(1),
					'analytics.lastViewed': new Date().toISOString()
				})
			} catch (error) {
				console.log('Analytics tracking failed (non-critical):', error)
			}
		}

		trackPageView()
	}, [companyId])

	// Check authentication and redirect if logged in
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			if (currentUser && companyId) {
				// Redirect authenticated users to candidate jobs page with filter
				router.push(`/candidate/jobs?companyId=${companyId}`)
			}
		})

		return () => unsubscribe()
	}, [companyId, router])

	// Fetch company data and jobs
	useEffect(() => {
		if (!companyId || user) return // Don't fetch if redirecting

		const fetchCompanyData = async () => {
			try {
				const companyDoc = await getDoc(doc(db, 'users', companyId))
				if (companyDoc.exists()) {
					const userData = companyDoc.data()
					if (userData.companyData) {
						setCompanyData(userData.companyData as CompanyData)
					}
				}
			} catch (err) {
				console.error('Error fetching company data:', err)
			}
		}

		const jobsQuery = query(
			collection(db, 'jobPostings'),
			where('companyId', '==', companyId),
			where('status', '==', 'published'),
			orderBy('postedDate', 'desc')
		)

		const unsubscribe = onSnapshot(jobsQuery,
			(querySnapshot) => {
				const jobsData: JobPosting[] = []
				querySnapshot.forEach(doc => {
					jobsData.push({ jobId: doc.id, ...doc.data() } as JobPosting)
				})
				setJobs(jobsData)
				setLoading(false)
			},
			(error) => {
				console.error('Error fetching jobs:', error)
				setError('Error al cargar las publicaciones de empleo.')
				setLoading(false)
			}
		)

		fetchCompanyData()
		return () => unsubscribe()
	}, [companyId, user])

	// Pagination logic
	const totalPages = Math.ceil(jobs.length / jobsPerPage)
	const startIndex = (currentPage - 1) * jobsPerPage
	const endIndex = startIndex + jobsPerPage
	const currentJobs = jobs.slice(startIndex, endIndex)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const handleShare = () => {
		setShowShareModal(true)
	}

	const copyJobLink = () => {
		const url = `${window.location.origin}/company/${companyId}/jobs`
		navigator.clipboard.writeText(url).then(() => {
			alert('Link copied to clipboard!')
		}).catch(() => {
			alert('Failed to copy link.')
		})
	}

	const shareToSocial = (platform: string) => {
		const url = encodeURIComponent(`${window.location.origin}/company/${companyId}/jobs`)
		const title = encodeURIComponent(`Oportunidades laborales en ${companyData?.companyName || 'nuestra empresa'}`)
		const text = encodeURIComponent(`¡Mira las oportunidades laborales en ${companyData?.companyName || 'nuestra empresa'}!`)

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

	const renderPagination = () => {
		if (totalPages <= 1) return null

		const pages = []
		const maxVisiblePages = 5
		let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1)
		}

		pages.push(
			<button
				key="prev"
				onClick={() => handlePageChange(currentPage - 1)}
				disabled={currentPage === 1}
				className={`px-3 py-2 rounded-lg font-medium ${
					currentPage === 1
						? 'bg-gray-100 text-gray-400 cursor-not-allowed'
						: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
				}`}
			>
				Anterior
			</button>
		)

		if (startPage > 1) {
			pages.push(
				<button
					key={1}
					onClick={() => handlePageChange(1)}
					className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
				>
					1
				</button>
			)
			if (startPage > 2) {
				pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>)
			}
		}

		for (let i = startPage; i <= endPage; i++) {
			pages.push(
				<button
					key={i}
					onClick={() => handlePageChange(i)}
					className={`px-4 py-2 rounded-lg font-medium ${
						currentPage === i
							? 'bg-orange-600 text-white'
							: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
					}`}
				>
					{i}
				</button>
			)
		}

		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>)
			}
			pages.push(
				<button
					key={totalPages}
					onClick={() => handlePageChange(totalPages)}
					className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
				>
					{totalPages}
				</button>
			)
		}

		pages.push(
			<button
				key="next"
				onClick={() => handlePageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				className={`px-3 py-2 rounded-lg font-medium ${
					currentPage === totalPages
						? 'bg-gray-100 text-gray-400 cursor-not-allowed'
						: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
				}`}
			>
				Siguiente
			</button>
		)

		return (
			<div className="flex items-center justify-center gap-2 mt-8">
				{pages}
			</div>
		)
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
					<p className="ml-2 text-gray-600 mt-4">Cargando empleos...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="p-4 bg-red-50 border border-red-200 rounded-md">
					<p className="text-red-600">{error}</p>
				</div>
			</div>
		)
	}

	return (
		<>
			<Head>
				<title>{companyData?.companyName ? `Empleos en ${companyData.companyName}` : 'Empleos Disponibles'}</title>
				<meta name="description" content={companyData?.description || `Explora las oportunidades laborales en ${companyData?.companyName || 'nuestra empresa'}`} />

				{/* Open Graph / Facebook */}
				<meta property="og:type" content="website" />
				<meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/company/${companyId}/jobs`} />
				<meta property="og:title" content={`Empleos en ${companyData?.companyName || 'nuestra empresa'}`} />
				<meta property="og:description" content={companyData?.description || `${jobs.length} posiciones abiertas en ${companyData?.companyName || 'nuestra empresa'}`} />
				{companyData?.logoUrl && <meta property="og:image" content={companyData.logoUrl} />}

				{/* Twitter */}
				<meta property="twitter:card" content="summary_large_image" />
				<meta property="twitter:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/company/${companyId}/jobs`} />
				<meta property="twitter:title" content={`Empleos en ${companyData?.companyName || 'nuestra empresa'}`} />
				<meta property="twitter:description" content={companyData?.description || `${jobs.length} posiciones abiertas`} />
				{companyData?.logoUrl && <meta property="twitter:image" content={companyData.logoUrl} />}
			</Head>

			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<div className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-6 py-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-6">
							{companyData?.logoUrl && (
								<img
									src={companyData.logoUrl}
									alt={`${companyData.companyName} logo`}
									className="w-20 h-20 rounded-lg object-cover border border-gray-200"
								/>
							)}
							<div>
								<h1 className="text-3xl font-bold text-gray-900">
									{companyData?.companyName || 'Company'}
								</h1>
								{companyData?.industry && (
									<p className="text-gray-600 mt-1">{companyData.industry}</p>
								)}
								{companyData?.companySize && (
									<p className="text-sm text-gray-500 mt-1">{companyData.companySize} empleados</p>
								)}
							</div>
						</div>
						<button
							onClick={handleShare}
							className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
							</svg>
							Compartir
						</button>
					</div>

					{companyData?.description && (
						<div className="mt-6 max-w-3xl">
							<p className="text-gray-700">{companyData.description}</p>
						</div>
					)}

					{companyData?.website && (
						<div className="mt-4">
							<a
								href={companyData.website}
								target="_blank"
								rel="noopener noreferrer"
								className="text-orange-600 hover:text-orange-700 flex items-center gap-1"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
								</svg>
								{companyData.website}
							</a>
						</div>
					)}
				</div>
			</div>

			{/* Jobs Section */}
			<div className="max-w-7xl mx-auto px-6 py-8">
				{/* Total Count */}
				{jobs.length > 0 && (
					<div className="mb-8 text-center">
						<div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl shadow-lg">
							<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
							<div className="text-left">
								<div className="text-3xl font-bold">{jobs.length}</div>
								<div className="text-sm font-medium opacity-90">Posiciones Abiertas</div>
							</div>
						</div>
					</div>
				)}

				{jobs.length === 0 ? (
					<div className="text-center py-12">
						<div className="text-gray-400 text-6xl mb-4">💼</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No hay empleos disponibles</h3>
						<p className="text-gray-500">Esta empresa no tiene posiciones abiertas en este momento.</p>
					</div>
				) : (
					<>
						{/* Jobs List */}
						<div className="space-y-3">
							{currentJobs.map(job => (
								<div
									key={job.jobId}
									className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all duration-200"
								>
									<div className="flex justify-between items-center gap-4">
										<div className="flex-1 min-w-0">
											<div className="flex items-start gap-3 mb-2">
												<div className="flex-1 min-w-0">
													<h3 className="text-lg font-semibold text-gray-900 truncate">
														{job.jobTitle}
													</h3>
													<div className="flex items-center gap-2 text-sm mt-1">
														<span className="text-gray-600 font-medium">
															{companyData?.companyName || 'Empresa'}
														</span>
														<span className="text-gray-400">•</span>
														<span className="text-gray-500 text-sm">
															{job.location || 'Ubicación no especificada'}
														</span>
													</div>
												</div>
												{job.postedDate && (
													<span className="text-xs text-gray-500 whitespace-nowrap">
														{new Date(job.postedDate).toLocaleDateString('es-MX', {
															month: 'short',
															day: 'numeric'
														})}
													</span>
												)}
											</div>

											<div className="flex items-center gap-2 flex-wrap">
												{job.jobType && (
													<span className="inline-block px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
														{job.jobType === 'full-time' && 'Tiempo Completo'}
														{job.jobType === 'part-time' && 'Medio Tiempo'}
														{job.jobType === 'contract' && 'Contrato'}
														{job.jobType === 'internship' && 'Prácticas'}
													</span>
												)}
												{job.salaryMin && job.salaryMax && !job.isSalaryHidden && (
													<span className="text-sm text-green-600 font-medium">
														${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
													</span>
												)}
											</div>
										</div>

										<div className="flex-shrink-0">
											<Link
												href="/signin"
												className="inline-block px-5 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
											>
												Inicia sesión para aplicar
											</Link>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Pagination */}
						{renderPagination()}

						{/* Results Info */}
						{jobs.length > 0 && (
							<div className="text-center mt-6 text-sm text-gray-600">
								Mostrando {startIndex + 1}-{Math.min(endIndex, jobs.length)} de {jobs.length} empleos
							</div>
						)}
					</>
				)}
			</div>

			{/* Share Modal */}
			{showShareModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-xl font-semibold mb-4">Compartir Empleos</h3>
						<p className="text-gray-600 mb-4">
							Comparte las ofertas de empleo de {companyData?.companyName} con candidatos:
						</p>

						{/* Copy Link */}
						<div className="flex items-center space-x-2 mb-4">
							<input
								type="text"
								value={`${window.location.origin}/company/${companyId}/jobs`}
								readOnly
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
							/>
							<button
								onClick={copyJobLink}
								className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
							>
								Copiar
							</button>
						</div>

						{/* Social Media Buttons */}
						<div className="mb-4">
							<p className="text-sm text-gray-600 mb-2">Compartir en redes sociales:</p>
							<div className="flex gap-2">
								<button
									onClick={() => shareToSocial('linkedin')}
									className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
									</svg>
									LinkedIn
								</button>
								<button
									onClick={() => shareToSocial('twitter')}
									className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
									</svg>
									Twitter
								</button>
								<button
									onClick={() => shareToSocial('facebook')}
									className="flex-1 px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
									</svg>
									Facebook
								</button>
							</div>
						</div>

						<div className="flex justify-end">
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
		</>
	)
}

export default CompanyJobsPage

