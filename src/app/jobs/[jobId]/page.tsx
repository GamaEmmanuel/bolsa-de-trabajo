'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { JobPosting } from '../../../types'
import { db, auth, functions } from '../../../lib/firebase'
import { doc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { JOB_CATEGORY_OPTIONS } from '../../../lib/constants'

// Extend the JobPosting interface for additional fields
declare module '../../../types' {
	interface JobPosting {
		companyName?: string
		location?: string
	}
}

const JobDetailPage = () => {
	const { jobId } = useParams()
	const router = useRouter()
	const [applied, setApplied] = useState(false)
	const [applicationId, setApplicationId] = useState<string | null>(null)
	const [job, setJob] = useState<JobPosting | null>(null)
	const [companyData, setCompanyData] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [user, setUser] = useState(auth.currentUser)
	const [applying, setApplying] = useState(false)
	const [withdrawing, setWithdrawing] = useState(false)
	const [isJobOwner, setIsJobOwner] = useState(false)
	const [showShareModal, setShowShareModal] = useState(false)
	const [archiving, setArchiving] = useState(false)
	const [republishing, setRepublishing] = useState(false)
	const [showCompanyJobsModal, setShowCompanyJobsModal] = useState(false)


	// Fetch job details from database and check auth state
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
		})

		const fetchJob = async () => {
			if (!jobId) return

			try {
				const jobDoc = await getDoc(doc(db, 'jobPostings', jobId as string))

				if (jobDoc.exists()) {
					const jobData = { jobId: jobDoc.id, ...jobDoc.data() } as JobPosting
					setJob(jobData)

					// Check if current user is the job owner
					if (user && (jobData.createdByUserId === user.uid || jobData.companyId === user.uid)) {
						setIsJobOwner(true)
					}

					// Fetch company data
					if (jobData.companyId) {
						try {
							console.log('Fetching company data for companyId:', jobData.companyId)
							const companyUserDoc = await getDoc(doc(db, 'users', jobData.companyId))
							if (companyUserDoc.exists()) {
								const userData = companyUserDoc.data()
								console.log('User data found:', userData)
								if (userData.companyData) {
									console.log('Company data found:', userData.companyData)
									setCompanyData(userData.companyData)
								} else {
									console.log('No company data found in user document')
								}
							} else {
								console.log('Company user document does not exist')
							}
						} catch (companyErr) {
							console.error('Error fetching company data:', companyErr)
							// Continue without company data - this is not critical for job display
						}
					} else {
						console.log('No companyId found in job data')
					}
				} else {
					setError('Job not found')
				}
			} catch (err) {
				console.error('Error fetching job:', err)
				setError('Failed to load job details')
			} finally {
				setLoading(false)
			}
		}

		const checkApplicationStatus = async () => {
			if (!user || !jobId) return

			try {
				const applicationsQuery = query(
					collection(db, 'applications'),
					where('candidateId', '==', user.uid),
					where('jobId', '==', jobId)
				)
				const applicationsSnapshot = await getDocs(applicationsQuery)

				if (!applicationsSnapshot.empty) {
					const applicationDoc = applicationsSnapshot.docs[0]
					setApplied(true)
					setApplicationId(applicationDoc.id)
				}
			} catch (err) {
				console.error('Error checking application status:', err)
			}
		}

		fetchJob()
		checkApplicationStatus()

		return () => unsubscribeAuth()
	}, [jobId, user])

	const handleApply = async () => {
		if (!user) {
			// Redirect to sign-in page with return URL
			router.push(`/signin?returnUrl=${encodeURIComponent(window.location.pathname)}`)
			return
		}

		if (!job) {
			alert('Información del empleo no disponible')
			return
		}

		setApplying(true)
		try {
			// Get candidate name from their profile
			let candidateName = 'Candidato Desconocido'
			try {
				const candidateProfileQuery = query(
					collection(db, 'candidateProfiles'),
					where('userId', '==', user.uid)
				)
				const candidateSnapshot = await getDocs(candidateProfileQuery)
				if (!candidateSnapshot.empty) {
					const candidateData = candidateSnapshot.docs[0].data()
					if (candidateData.firstName && candidateData.lastName) {
						candidateName = `${candidateData.firstName} ${candidateData.lastName}`
					} else if (candidateData.fullName) {
						candidateName = candidateData.fullName
					}
				}
			} catch (profileError) {
				console.warn('Could not fetch candidate profile:', profileError)
				// Continue with default name
			}

			// Create application in Firestore
			const applicationRef = await addDoc(collection(db, 'applications'), {
				candidateId: user.uid,
				jobId: jobId, // Use the jobId from URL params
				companyId: job.companyId,
				candidateName: candidateName,
				applicationDate: new Date().toISOString(),
				pipelineStatus: 'applied',
				updatedAt: new Date().toISOString(),
			})

			setApplied(true)
			setApplicationId(applicationRef.id)
			alert('¡Solicitud enviada exitosamente!')

		// Send email notifications via Firebase Function (Gmail API with preference checking)
		try {
			console.log('📧 Sending email notifications via Firebase Function (Gmail)...')

			const sendApplicationEmail = httpsCallable(functions, 'sendApplicationEmail')

			sendApplicationEmail({
				candidateId: user.uid,
				candidateEmail: user.email,
				candidateName: candidateName,
				jobTitle: job.jobTitle,
				companyId: job.companyId,
				companyName: companyData?.companyName || job.companyName || 'La Empresa',
				applicationDate: new Date().toISOString(),
			})
				.then((result: any) => {
					console.log('✅ Email notifications result:', result.data)

					if (result.data.candidateEmail?.success) {
						console.log('✅ Candidate email sent via Gmail')
					} else if (result.data.candidateEmail?.messageId === 'skipped_by_preferences') {
						console.log('⏭️ Candidate email skipped - user preferences')
					} else if (result.data.candidateEmail?.error) {
						console.error('❌ Candidate email error:', result.data.candidateEmail.error)
					}

					if (result.data.companyEmail?.success) {
						console.log('✅ Company email sent via Gmail')
					} else if (result.data.companyEmail?.messageId === 'skipped_by_preferences') {
						console.log('⏭️ Company email skipped - user preferences')
					} else if (result.data.companyEmail?.error) {
						console.error('❌ Company email error:', result.data.companyEmail.error)
					}
				})
				.catch((err) => {
					console.error('❌ Error sending email notifications:', err)
					// Don't show error to user - email is secondary
				})
		} catch (emailError) {
			console.error('❌ Error triggering email notifications:', emailError)
			// Don't show error to user - email is secondary
		}
		} catch (error) {
			console.error('Error applying for job:', error)
			alert('Error al enviar la solicitud. Por favor, inténtalo de nuevo.')
		} finally {
			setApplying(false)
		}
	}

	const handleWithdraw = async () => {
		if (!user || !applicationId) {
			alert('No se puede retirar la solicitud')
			return
		}

		const confirmed = window.confirm('¿Estás seguro de que quieres retirar tu solicitud? Esta acción no se puede deshacer.')
		if (!confirmed) return

		setWithdrawing(true)
		try {
			await deleteDoc(doc(db, 'applications', applicationId))
			setApplied(false)
			setApplicationId(null)
			alert('¡Solicitud retirada exitosamente!')
		} catch (error) {
			console.error('Error withdrawing application:', error)
			alert('Error al retirar la solicitud. Por favor, inténtalo de nuevo.')
		} finally {
			setWithdrawing(false)
		}
	}

	const handleShare = () => {
		setShowShareModal(true)
	}

	const copyJobLink = () => {
		const jobUrl = `${window.location.origin}/jobs/${jobId}`
		navigator.clipboard.writeText(jobUrl).then(() => {
			alert('¡Enlace del empleo copiado!')
		}).catch(() => {
			alert('Error al copiar enlace. Por favor, copia manualmente.')
		})
	}

	const copyCompanyJobsLink = () => {
		if (!job?.companyId) return
		const companyJobsUrl = `${window.location.origin}/company/${job.companyId}/jobs`
		navigator.clipboard.writeText(companyJobsUrl).then(() => {
			alert('¡Enlace de empleos de la empresa copiado!')
		}).catch(() => {
			alert('Error al copiar enlace. Por favor, copia manualmente.')
		})
	}

	const shareCompanyJobsToSocial = (platform: string) => {
		if (!job?.companyId) return
		const url = encodeURIComponent(`${window.location.origin}/company/${job.companyId}/jobs`)
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

	const handleArchiveJob = async () => {
		if (!user || !jobId) {
			alert('No se puede archivar la publicación')
			return
		}

		const confirmed = window.confirm('¿Estás seguro de que quieres archivar esta publicación? Ya no será visible para los candidatos.')
		if (!confirmed) return

		setArchiving(true)
		try {
			const jobRef = doc(db, 'jobPostings', jobId as string)
			await updateDoc(jobRef, {
				status: 'archived',
				archivedAt: new Date().toISOString()
			})

			alert('¡Publicación archivada exitosamente!')
			// Refresh the page to show updated status
			window.location.reload()
		} catch (error) {
			console.error('Error archiving job:', error)
			alert('Error al archivar la publicación. Por favor, inténtalo de nuevo.')
		} finally {
			setArchiving(false)
		}
	}

	const handleRepublishJob = async () => {
		if (!user || !jobId) {
			alert('No se puede republicar la publicación')
			return
		}

		const confirmed = window.confirm('¿Quieres publicar nuevamente esta posición? Será visible para los candidatos.')
		if (!confirmed) return

		setRepublishing(true)
		try {
			const jobRef = doc(db, 'jobPostings', jobId as string)
			await updateDoc(jobRef, {
				status: 'published',
				republishedAt: new Date().toISOString()
			})

			alert('¡Publicación republicada exitosamente!')
			// Refresh the page to show updated status
			window.location.reload()
		} catch (error) {
			console.error('Error republishing job:', error)
			alert('Error al republicar la publicación. Por favor, inténtalo de nuevo.')
		} finally {
			setRepublishing(false)
		}
	}

	const handleDeleteJob = async () => {
		if (!user || !jobId) {
			alert('No se puede eliminar la publicación')
			return
		}

		const confirmed = window.confirm('¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.')
		if (!confirmed) return

		try {
			// Delete the job from Firestore
			await deleteDoc(doc(db, 'jobPostings', jobId as string))

			// Redirect to job postings page
			router.push('/company/job-postings')
			alert('¡Publicación eliminada exitosamente!')
		} catch (error) {
			console.error('Error deleting job:', error)
			alert('Error al eliminar la publicación. Por favor, inténtalo de nuevo.')
		}
	}

	// Show loading state
	if (loading) {
		return (
			<div className="min-h-screen bg-secondary">
				<div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						<p className="mt-2 text-muted-foreground">Cargando detalles del empleo...</p>
					</div>
				</div>
			</div>
		)
	}

	// Show error state
	if (error || !job) {
		return (
			<div className="min-h-screen bg-secondary">
				<div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<p className="text-red-500">{error || 'Empleo no encontrado'}</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-secondary">
			<div className="max-w-4xl mx-auto py-6 md:py-12 px-4 sm:px-6 lg:px-8">
				{/* Back Button */}
				<button
					onClick={() => router.back()}
					className="mb-4 md:mb-6 flex items-center text-primary hover:text-primary/80 transition-colors"
				>
					<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
					Volver a Empleos
				</button>

				<div className="bg-card p-4 md:p-8 rounded-lg border border-border">
					<div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 md:gap-6 mb-6">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-3 mb-4">
								{companyData?.logoUrl ? (
									<img
										src={companyData.logoUrl}
										alt={`${companyData.companyName || 'Company'} logo`}
										className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-contain border border-border bg-gray-50 p-1 flex-shrink-0"
										onError={(e) => {
											console.error('Failed to load company logo:', companyData.logoUrl)
											e.currentTarget.style.display = 'none'
											const fallback = e.currentTarget.nextElementSibling
											if (fallback) {
												(fallback as HTMLElement).style.display = 'flex'
											}
										}}
									/>
								) : null}
								<div
									className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gray-200 flex items-center justify-center border border-border flex-shrink-0"
									style={{ display: companyData?.logoUrl ? 'none' : 'flex' }}
								>
									<svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
								</div>
								<div className="flex-1 min-w-0">
									<h1 className="text-xl md:text-3xl font-bold text-foreground truncate">{job.jobTitle}</h1>
									<p className="text-base md:text-xl text-muted-foreground font-semibold mt-1 truncate">
										{companyData?.companyName || job.companyName || 'Company Name'}
									</p>
									<div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
										{job.location && (
											<div className="flex items-center text-xs md:text-sm text-muted-foreground">
												<svg className="w-3 h-3 md:w-4 md:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
												</svg>
												<span className="truncate">{job.location}</span>
											</div>
										)}
										{job.jobType && (
											<span className="inline-block px-2 md:px-3 py-1 text-xs md:text-sm font-medium bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
												{job.jobType === 'full-time' ? 'Tiempo Completo' :
												 job.jobType === 'part-time' ? 'Medio Tiempo' :
												 job.jobType === 'contract' ? 'Contrato' :
												 job.jobType === 'internship' ? 'Prácticas' :
												 job.jobType === 'freelance' ? 'Freelance' : job.jobType}
											</span>
										)}
										{job.employmentType && (
											<span className="inline-block px-2 md:px-3 py-1 text-xs md:text-sm font-medium bg-green-100 text-green-800 rounded-full whitespace-nowrap">
												{job.employmentType === 'remote' ? 'Remoto' :
												 job.employmentType === 'hybrid' ? 'Híbrido' :
												 job.employmentType === 'on-site' ? 'Presencial' : job.employmentType}
											</span>
										)}
									</div>
								</div>
							</div>
						</div>
						<div className="lg:ml-6 w-full lg:w-auto lg:text-right">
							{!job.isSalaryHidden && job.salaryMin && job.salaryMax && (
								<p className="text-xl md:text-2xl font-bold text-green-600 mb-3 md:mb-4">
									${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} MXN
								</p>
							)}
							<div className="space-y-2 md:space-y-3">
								{isJobOwner ? (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										<button
											onClick={handleShare}
											className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg bg-green-500/80 text-white hover:bg-green-600/80 transition-all duration-200"
										>
											<div className="flex items-center justify-center">
												<svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
												</svg>
												Compartir Empleo
											</div>
										</button>
										<button
											onClick={() => router.push(`/company/job-postings/${jobId}/edit`)}
											className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg bg-blue-500/80 text-white hover:bg-pink-600/80 transition-all duration-200"
										>
											<div className="flex items-center justify-center">
												<svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
												Editar Empleo
											</div>
										</button>
										{job.status === 'archived' ? (
											<button
												onClick={handleRepublishJob}
												disabled={republishing}
												className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 ${
													republishing
														? 'bg-gray-300 text-gray-500 cursor-not-allowed'
														: 'bg-green-500/80 text-white hover:bg-green-600/80'
												}`}
											>
												{republishing ? (
													<div className="flex items-center justify-center">
														<div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-1 md:mr-1.5"></div>
														<span className="hidden sm:inline">Publicando...</span>
													</div>
												) : (
													<div className="flex items-center justify-center">
														<svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
														</svg>
														<span className="hidden sm:inline">Publicar Nuevamente</span>
														<span className="sm:hidden">Publicar</span>
													</div>
												)}
											</button>
										) : (
											<button
												onClick={handleArchiveJob}
												disabled={archiving}
												className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 ${
													archiving
														? 'bg-gray-300 text-gray-500 cursor-not-allowed'
														: 'bg-orange-500/80 text-white hover:bg-orange-600/80'
												}`}
											>
												{archiving ? (
													<div className="flex items-center justify-center">
														<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>
														Archivando...
													</div>
												) : (
													<div className="flex items-center justify-center">
														<svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
														</svg>
														Archivar Empleo
													</div>
												)}
											</button>
										)}
										<button
											onClick={() => setShowCompanyJobsModal(true)}
											className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg bg-purple-500/80 text-white hover:bg-purple-600/80 transition-all duration-200"
										>
											<div className="flex items-center justify-center">
												<svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
												</svg>
												<span className="hidden sm:inline">Compartir Todos los Empleos</span>
												<span className="sm:hidden">Compartir Todos</span>
											</div>
										</button>
									</div>
								) : applied ? (
									<>
										<button
											onClick={handleWithdraw}
											disabled={withdrawing}
											className={`w-full sm:w-auto px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 ${
												withdrawing
													? 'bg-gray-100 text-gray-500 cursor-not-allowed'
													: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
											}`}
										>
											{withdrawing ? (
												<div className="flex items-center justify-center">
													<div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-red-500 mr-1 md:mr-1.5"></div>
													Retirando...
												</div>
											) : (
												<div className="flex items-center justify-center">
													<svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
													</svg>
													Retirar Solicitud
												</div>
											)}
										</button>
										<div className="flex items-center justify-center text-green-600 text-xs md:text-sm font-medium mt-2">
											<svg className="w-3 h-3 md:w-4 md:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
											Solicitud Enviada
										</div>
									</>
								) : (
									<button
										onClick={handleApply}
										disabled={applying || !user}
										className={`w-full sm:w-auto px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 ${
											applying
												? 'bg-gray-100 text-gray-500 cursor-not-allowed'
												: !user
												? 'bg-orange-50 text-orange-700 border border-orange-200'
												: 'bg-blue-500/80 text-white hover:bg-pink-600/80'
										}`}
									>
										{applying ? (
											<div className="flex items-center">
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-1.5"></div>
												Aplicando...
											</div>
										) : !user ? (
											'Iniciar Sesión para Aplicar'
										) : (
											'Aplicar Ahora'
										)}
									</button>
								)}
							</div>
						</div>
					</div>

				<hr className="my-6 border-border" />

				{/* Job Description Section - Moved to Top */}
				<div className="prose prose-sm md:prose-lg max-w-none text-foreground mb-6 md:mb-8">
					<h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">Descripción del Empleo</h2>
					<p>{job.jobDescription}</p>

					{job.requirements && (
						<>
							<h2 className="text-xl md:text-2xl font-semibold mt-4 md:mt-6 mb-3 md:mb-4">Requisitos</h2>
							{typeof job.requirements === 'string'
								? <div dangerouslySetInnerHTML={{ __html: job.requirements }} />
								: <div className="whitespace-pre-wrap">{String(job.requirements as any)}</div>
							}
						</>
					)}
				</div>

				{/* Job Details Section */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
						{job.yearsOfExperience && (
							<div className="bg-gray-50 p-4 rounded-lg">
								<h3 className="font-semibold text-gray-700 mb-2">Experiencia Requerida</h3>
								<p className="text-gray-600">
									{job.yearsOfExperience === '0-1' ? '0-1 años' :
									 job.yearsOfExperience === '1-3' ? '1-3 años' :
									 job.yearsOfExperience === '3-5' ? '3-5 años' :
									 job.yearsOfExperience === '5-10' ? '5-10 años' :
									 job.yearsOfExperience === '10+' ? '10+ años' : job.yearsOfExperience}
								</p>
							</div>
						)}
						{job.educationLevel && (
							<div className="bg-gray-50 p-4 rounded-lg">
								<h3 className="font-semibold text-gray-700 mb-2">Nivel de Educación</h3>
								<p className="text-gray-600">
									{job.educationLevel === 'no-requirement' ? 'Sin requisito' :
									 job.educationLevel === 'high-school' ? 'Preparatoria' :
									 job.educationLevel === 'bachelor' ? 'Licenciatura' :
									 job.educationLevel === 'master' ? 'Maestría' :
									 job.educationLevel === 'phd' ? 'Doctorado' : job.educationLevel}
								</p>
							</div>
						)}
						{job.jobLevel && (
							<div className="bg-gray-50 p-4 rounded-lg">
								<h3 className="font-semibold text-gray-700 mb-2">Nivel del Empleo</h3>
								<p className="text-gray-600">
									{job.jobLevel === 'entry' ? 'Junior' :
									 job.jobLevel === 'mid-level' ? 'Intermedio' :
									 job.jobLevel === 'senior' ? 'Senior' :
									 job.jobLevel === 'lead' ? 'Líder' :
									 job.jobLevel === 'executive' ? 'Ejecutivo' : job.jobLevel}
								</p>
							</div>
						)}
						{job.jobCategory && (
							<div className="bg-gray-50 p-4 rounded-lg">
								<h3 className="font-semibold text-gray-700 mb-2">Categoría</h3>
								<p className="text-gray-600">
									{JOB_CATEGORY_OPTIONS.find(cat => cat.value === job.jobCategory)?.label || job.jobCategory}
								</p>
							</div>
						)}
					</div>

					{/* Skills Section */}
					{((job.requiredSkills && job.requiredSkills.length > 0) || (job.preferredSkills && job.preferredSkills.length > 0)) && (
						<div className="mb-8">
							{job.requiredSkills && job.requiredSkills.length > 0 && (
								<div className="mb-4">
									<h3 className="text-lg font-semibold text-gray-700 mb-2">Habilidades Requeridas</h3>
									<div className="flex flex-wrap gap-2">
										{job.requiredSkills.map((skill, index) => (
											<span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
												{skill}
											</span>
										))}
									</div>
								</div>
							)}
							{job.preferredSkills && job.preferredSkills.length > 0 && (
								<div>
									<h3 className="text-lg font-semibold text-gray-700 mb-2">Habilidades Preferidas</h3>
									<div className="flex flex-wrap gap-2">
										{job.preferredSkills.map((skill, index) => (
											<span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
												{skill}
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Phase 3: Advanced Information */}
					{(job.companySize || job.industry || job.startDate || job.applicationDeadline || job.urgencyLevel) && (
						<div className="mb-8">
							<h3 className="text-lg font-semibold text-gray-700 mb-4">Información Adicional</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{job.companySize && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Tamaño de la Empresa</h4>
										<p className="text-gray-600">
											{job.companySize === '1-10' ? '1-10 empleados' :
											 job.companySize === '11-50' ? '11-50 empleados' :
											 job.companySize === '51-200' ? '51-200 empleados' :
											 job.companySize === '201-500' ? '201-500 empleados' :
											 job.companySize === '500+' ? '500+ empleados' : job.companySize}
										</p>
									</div>
								)}
								{job.industry && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Industria</h4>
										<p className="text-gray-600">
											{job.industry === 'technology' ? 'Tecnología' :
											 job.industry === 'healthcare' ? 'Salud' :
											 job.industry === 'finance' ? 'Finanzas' :
											 job.industry === 'education' ? 'Educación' :
											 job.industry === 'retail' ? 'Retail' :
											 job.industry === 'manufacturing' ? 'Manufactura' :
											 job.industry === 'consulting' ? 'Consultoría' :
											 job.industry === 'non-profit' ? 'Sin fines de lucro' :
											 job.industry === 'government' ? 'Gobierno' :
											 job.industry === 'other' ? 'Otro' : job.industry}
										</p>
									</div>
								)}
								{job.startDate && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Fecha de Inicio</h4>
										<p className="text-gray-600">
											{job.startDate === 'immediate' ? 'Inmediato' :
											 job.startDate === '1-2-weeks' ? '1-2 semanas' :
											 job.startDate === '1-month' ? '1 mes' :
											 job.startDate === '2-months' ? '2 meses' :
											 job.startDate === 'flexible' ? 'Flexible' : job.startDate}
										</p>
									</div>
								)}
								{job.applicationDeadline && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Fecha Límite de Solicitud</h4>
										<p className="text-gray-600">{new Date(job.applicationDeadline).toLocaleDateString()}</p>
									</div>
								)}
								{job.urgencyLevel && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Urgencia</h4>
										<p className={`font-medium ${
											job.urgencyLevel === 'urgent' ? 'text-orange-600' :
											job.urgencyLevel === 'critical' ? 'text-red-600' :
											'text-gray-600'
										}`}>
											{job.urgencyLevel === 'normal' ? 'Normal' :
											 job.urgencyLevel === 'urgent' ? 'Urgente' :
											 job.urgencyLevel === 'critical' ? 'Crítico' : job.urgencyLevel}
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Application Process */}
					{(job.applicationProcess || job.interviewRounds || job.requiredDocuments?.length > 0) && (
						<div className="mb-8">
							<h3 className="text-lg font-semibold text-gray-700 mb-4">Proceso de Solicitud</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{job.applicationProcess && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Proceso de Solicitud</h4>
										<p className="text-gray-600">
											{job.applicationProcess === 'resume-only' ? 'Solo CV' :
											 job.applicationProcess === 'portfolio-required' ? 'Portafolio requerido' :
											 job.applicationProcess === 'cover-letter-required' ? 'Carta de presentación requerida' :
											 job.applicationProcess === 'video-interview' ? 'Entrevista en video' :
											 job.applicationProcess === 'technical-test' ? 'Prueba técnica' : job.applicationProcess}
										</p>
									</div>
								)}
								{job.interviewRounds && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Rondas de Entrevista</h4>
										<p className="text-gray-600">
											{job.interviewRounds === '1' ? '1 ronda' :
											 job.interviewRounds === '2' ? '2 rondas' :
											 job.interviewRounds === '3' ? '3 rondas' :
											 job.interviewRounds === '4+' ? '4+ rondas' :
											 job.interviewRounds === 'varies' ? 'Varía' : job.interviewRounds}
										</p>
									</div>
								)}
								{job.requiredDocuments?.length > 0 && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Documentos Requeridos</h4>
										<div className="flex flex-wrap gap-2">
											{job.requiredDocuments.map((doc, index) => (
												<span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm">
													{doc}
												</span>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Benefits & Culture */}
					{(job.benefits?.length > 0 || job.companyCulture?.length > 0) && (
						<div className="mb-8">
							<h3 className="text-lg font-semibold text-gray-700 mb-4">Beneficios y Cultura</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{job.benefits?.length > 0 && (
									<div>
										<h4 className="font-semibold text-gray-700 mb-2">Beneficios</h4>
										<div className="flex flex-wrap gap-2">
											{job.benefits.map((benefit, index) => (
												<span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
													{benefit === 'health-insurance' ? 'Seguro médico' :
													 benefit === 'dental-insurance' ? 'Seguro dental' :
													 benefit === 'vision-insurance' ? 'Seguro de visión' :
													 benefit === 'life-insurance' ? 'Seguro de vida' :
													 benefit === 'retirement-plan' ? 'Plan de retiro' :
													 benefit === 'vacation-days' ? 'Días de vacaciones' :
													 benefit === 'sick-leave' ? 'Días de enfermedad' :
													 benefit === 'flexible-hours' ? 'Horarios flexibles' :
													 benefit === 'remote-work' ? 'Trabajo remoto' :
													 benefit === 'professional-development' ? 'Desarrollo profesional' :
													 benefit === 'gym-membership' ? 'Membresía de gimnasio' :
													 benefit === 'meal-vouchers' ? 'Vales de comida' :
													 benefit === 'transportation' ? 'Transporte' :
													 benefit === 'stock-options' ? 'Opciones de acciones' :
													 benefit === 'bonus' ? 'Bonos' : benefit}
												</span>
											))}
										</div>
									</div>
								)}
								{job.companyCulture?.length > 0 && (
									<div>
										<h4 className="font-semibold text-gray-700 mb-2">Cultura de la Empresa</h4>
										<div className="flex flex-wrap gap-2">
											{job.companyCulture.map((culture, index) => (
												<span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
													{culture === 'startup' ? 'Startup' :
													 culture === 'corporate' ? 'Corporativo' :
													 culture === 'innovative' ? 'Innovador' :
													 culture === 'collaborative' ? 'Colaborativo' :
													 culture === 'fast-paced' ? 'Ritmo acelerado' :
													 culture === 'work-life-balance' ? 'Equilibrio trabajo-vida' :
													 culture === 'diverse' ? 'Diverso' :
													 culture === 'inclusive' ? 'Inclusivo' :
													 culture === 'creative' ? 'Creativo' :
													 culture === 'data-driven' ? 'Basado en datos' :
													 culture === 'customer-focused' ? 'Enfocado en el cliente' :
													 culture === 'team-oriented' ? 'Orientado al equipo' : culture}
												</span>
											))}
										</div>
									</div>
								)}
							</div>
					</div>
				)}

				{/* Delete Button for Job Owners */}
					{isJobOwner && (
						<div className="mt-8 pt-6 border-t border-border">
							<button
								onClick={handleDeleteJob}
								className="px-6 py-3 text-lg font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
							>
								<div className="flex items-center">
									<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
									Eliminar Publicación
								</div>
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Share Individual Job Modal */}
			{showShareModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-xl font-semibold mb-4">Compartir Publicación de Empleo</h3>
						<p className="text-gray-600 mb-4">
							Comparte esta publicación con candidatos copiando el enlace:
						</p>
						<div className="flex items-center space-x-2 mb-4">
							<input
								type="text"
								value={`${window.location.origin}/jobs/${jobId}`}
								readOnly
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
							/>
							<button
								onClick={copyJobLink}
								className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
							>
								Copiar
							</button>
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

			{/* Share All Company Jobs Modal */}
			{showCompanyJobsModal && job && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-xl font-semibold mb-4">Compartir Todos los Empleos de la Empresa</h3>
						<p className="text-gray-600 mb-4">
							Comparte todas las oportunidades laborales de {companyData?.companyName || 'tu empresa'}:
						</p>

						{/* Copy Link */}
						<div className="flex items-center space-x-2 mb-4">
							<input
								type="text"
								value={`${window.location.origin}/company/${job.companyId}/jobs`}
								readOnly
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
							/>
							<button
								onClick={copyCompanyJobsLink}
								className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
							>
								Copiar
							</button>
						</div>

						{/* Social Media Buttons */}
						<div className="mb-4">
							<p className="text-sm text-gray-600 mb-2">Compartir en redes sociales:</p>
							<div className="flex gap-2">
								<button
									onClick={() => shareCompanyJobsToSocial('linkedin')}
									className="flex-1 px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm flex items-center justify-center gap-1"
								>
									<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
									</svg>
									LinkedIn
								</button>
								<button
									onClick={() => shareCompanyJobsToSocial('twitter')}
									className="flex-1 px-3 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors text-sm flex items-center justify-center gap-1"
								>
									<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
									</svg>
									Twitter
								</button>
								<button
									onClick={() => shareCompanyJobsToSocial('facebook')}
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
								onClick={() => setShowCompanyJobsModal(false)}
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

export default JobDetailPage