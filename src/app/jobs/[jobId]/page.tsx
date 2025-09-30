'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { JobPosting } from '../../../types'
import { db, auth } from '../../../lib/firebase'
import { doc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

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
						// Continue without company data
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
			alert('Job information not available')
			return
		}

		setApplying(true)
		try {
			// Get candidate name from their profile
			let candidateName = 'Unknown Candidate'
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
			alert('Application submitted successfully!')
		} catch (error) {
			console.error('Error applying for job:', error)
			alert('Failed to submit application. Please try again.')
		} finally {
			setApplying(false)
		}
	}

	const handleWithdraw = async () => {
		if (!user || !applicationId) {
			alert('Unable to withdraw application')
			return
		}

		const confirmed = window.confirm('Are you sure you want to withdraw your application? This action cannot be undone.')
		if (!confirmed) return

		setWithdrawing(true)
		try {
			await deleteDoc(doc(db, 'applications', applicationId))
			setApplied(false)
			setApplicationId(null)
			alert('Application withdrawn successfully!')
		} catch (error) {
			console.error('Error withdrawing application:', error)
			alert('Failed to withdraw application. Please try again.')
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
			alert('Job link copied to clipboard!')
		}).catch(() => {
			alert('Failed to copy link. Please copy manually.')
		})
	}

	const handleDeleteJob = async () => {
		if (!user || !jobId) {
			alert('Unable to delete job posting')
			return
		}

		const confirmed = window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')
		if (!confirmed) return

		try {
			// Delete the job from Firestore
			await deleteDoc(doc(db, 'jobPostings', jobId as string))

			// Redirect to job postings page
			router.push('/company/job-postings')
			alert('Job posting deleted successfully!')
		} catch (error) {
			console.error('Error deleting job:', error)
			alert('Failed to delete job posting. Please try again.')
		}
	}

	// Show loading state
	if (loading) {
		return (
			<div className="min-h-screen bg-secondary">
				<div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						<p className="mt-2 text-muted-foreground">Loading job details...</p>
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
						<p className="text-red-500">{error || 'Job not found'}</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-secondary">
			<div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
				{/* Back Button */}
				<button
					onClick={() => router.back()}
					className="mb-6 flex items-center text-primary hover:text-primary/80 transition-colors"
				>
					<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
					Back to Jobs
				</button>

				<div className="bg-card p-8 rounded-lg border border-border">
					<div className="flex justify-between items-start mb-6">
						<div className="flex-1">
							<div className="flex items-center mb-4">
								{companyData?.logoUrl ? (
									<img
										src={companyData.logoUrl}
										alt={`${companyData.companyName || 'Company'} logo`}
										className="w-16 h-16 rounded-lg object-cover mr-4 border border-border"
									/>
								) : (
									<div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center mr-4 border border-border">
										<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
										</svg>
									</div>
								)}
								<div className="flex-1">
									<h1 className="text-3xl font-bold text-foreground">{job.jobTitle}</h1>
									<p className="text-xl text-muted-foreground font-semibold mt-1">
										{companyData?.companyName || job.companyName || 'Company Name'}
									</p>
									<div className="flex flex-wrap items-center gap-4 mt-2">
										{job.location && (
											<div className="flex items-center text-sm text-muted-foreground">
												<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
												</svg>
												{job.location}
											</div>
										)}
										{job.jobType && (
											<span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
												{job.jobType === 'full-time' ? 'Tiempo Completo' :
												 job.jobType === 'part-time' ? 'Medio Tiempo' :
												 job.jobType === 'contract' ? 'Contrato' :
												 job.jobType === 'internship' ? 'Prácticas' :
												 job.jobType === 'freelance' ? 'Freelance' : job.jobType}
											</span>
										)}
										{job.employmentType && (
											<span className="inline-block px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
												{job.employmentType === 'remote' ? 'Remoto' :
												 job.employmentType === 'hybrid' ? 'Híbrido' :
												 job.employmentType === 'on-site' ? 'Presencial' : job.employmentType}
											</span>
										)}
									</div>
								</div>
							</div>
						</div>
						<div className="ml-6 text-right">
							{!job.isSalaryHidden && job.salaryMin && job.salaryMax && (
								<p className="text-2xl font-bold text-green-600 mb-4">
									${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} MXN
								</p>
							)}
							<div className="space-y-3">
								{isJobOwner ? (
									<div className="flex flex-col space-y-3">
										<button
											onClick={handleShare}
											className="px-8 py-3 text-lg font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
										>
											<div className="flex items-center">
												<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
												</svg>
												Share Job
											</div>
										</button>
										<button
											onClick={() => router.push(`/company/job-postings/${jobId}/edit`)}
											className="px-8 py-3 text-lg font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
										>
											<div className="flex items-center">
												<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
												Edit Job
											</div>
										</button>
									</div>
								) : applied ? (
									<>
										<button
											onClick={handleWithdraw}
											disabled={withdrawing}
											className={`px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 ${
												withdrawing
													? 'bg-gray-100 text-gray-500 cursor-not-allowed'
													: 'bg-red-100 text-red-800 border-2 border-red-300 hover:bg-red-200 hover:border-red-400'
											}`}
										>
											{withdrawing ? (
												<div className="flex items-center">
													<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
													Withdrawing...
												</div>
											) : (
												<div className="flex items-center">
													<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
													</svg>
													Withdraw Application
												</div>
											)}
										</button>
										<div className="flex items-center justify-center text-green-600 text-sm font-medium">
											<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
											Application Submitted
										</div>
									</>
								) : (
									<button
										onClick={handleApply}
										disabled={applying || !user}
										className={`px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 ${
											applying
												? 'bg-gray-100 text-gray-500 cursor-not-allowed'
												: !user
												? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
												: 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
										}`}
									>
										{applying ? (
											<div className="flex items-center">
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
												Applying...
											</div>
										) : !user ? (
											'Sign In to Apply'
										) : (
											'Apply Now'
										)}
									</button>
								)}
							</div>
						</div>
					</div>

					<hr className="my-6 border-border" />

					{/* Job Details Section */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
						{job.yearsOfExperience && (
							<div className="bg-gray-50 p-4 rounded-lg">
								<h3 className="font-semibold text-gray-700 mb-2">Experience Required</h3>
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
								<h3 className="font-semibold text-gray-700 mb-2">Education Level</h3>
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
								<h3 className="font-semibold text-gray-700 mb-2">Job Level</h3>
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
								<h3 className="font-semibold text-gray-700 mb-2">Category</h3>
								<p className="text-gray-600">
									{job.jobCategory === 'engineering' ? 'Ingeniería' :
									 job.jobCategory === 'sales' ? 'Ventas' :
									 job.jobCategory === 'marketing' ? 'Marketing' :
									 job.jobCategory === 'design' ? 'Diseño' :
									 job.jobCategory === 'hr' ? 'Recursos Humanos' :
									 job.jobCategory === 'finance' ? 'Finanzas' :
									 job.jobCategory === 'operations' ? 'Operaciones' :
									 job.jobCategory === 'customer-service' ? 'Atención al Cliente' :
									 job.jobCategory === 'other' ? 'Otro' : job.jobCategory}
								</p>
							</div>
						)}
					</div>

					{/* Skills Section */}
					{(job.requiredSkills?.length > 0 || job.preferredSkills?.length > 0) && (
						<div className="mb-8">
							{job.requiredSkills?.length > 0 && (
								<div className="mb-4">
									<h3 className="text-lg font-semibold text-gray-700 mb-2">Required Skills</h3>
									<div className="flex flex-wrap gap-2">
										{job.requiredSkills.map((skill, index) => (
											<span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
												{skill}
											</span>
										))}
									</div>
								</div>
							)}
							{job.preferredSkills?.length > 0 && (
								<div>
									<h3 className="text-lg font-semibold text-gray-700 mb-2">Preferred Skills</h3>
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
							<h3 className="text-lg font-semibold text-gray-700 mb-4">Additional Information</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{job.companySize && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Company Size</h4>
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
										<h4 className="font-semibold text-gray-700 mb-1">Industry</h4>
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
										<h4 className="font-semibold text-gray-700 mb-1">Start Date</h4>
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
										<h4 className="font-semibold text-gray-700 mb-1">Application Deadline</h4>
										<p className="text-gray-600">{new Date(job.applicationDeadline).toLocaleDateString()}</p>
									</div>
								)}
								{job.urgencyLevel && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Urgency</h4>
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
							<h3 className="text-lg font-semibold text-gray-700 mb-4">Application Process</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{job.applicationProcess && (
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-semibold text-gray-700 mb-1">Application Process</h4>
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
										<h4 className="font-semibold text-gray-700 mb-1">Interview Rounds</h4>
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
										<h4 className="font-semibold text-gray-700 mb-1">Required Documents</h4>
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
							<h3 className="text-lg font-semibold text-gray-700 mb-4">Benefits & Culture</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{job.benefits?.length > 0 && (
									<div>
										<h4 className="font-semibold text-gray-700 mb-2">Benefits</h4>
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
										<h4 className="font-semibold text-gray-700 mb-2">Company Culture</h4>
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

					<div className="prose prose-lg max-w-none text-foreground">
						<h2 className="text-2xl font-semibold mb-4">Job Description</h2>
						<p>{job.jobDescription}</p>

						{job.requirements && (
							<>
								<h2 className="text-2xl font-semibold mt-6 mb-4">Requirements</h2>
								{typeof job.requirements === 'string'
									? <div dangerouslySetInnerHTML={{ __html: job.requirements }} />
									: <div className="whitespace-pre-wrap">{String(job.requirements as any)}</div>
								}
							</>
						)}
					</div>

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
									Delete Job Posting
								</div>
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Share Modal */}
			{showShareModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-xl font-semibold mb-4">Share Job Posting</h3>
						<p className="text-gray-600 mb-4">
							Share this job posting with candidates by copying the link below:
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
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
							>
								Copy
							</button>
						</div>
						<div className="flex justify-end space-x-2">
							<button
								onClick={() => setShowShareModal(false)}
								className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default JobDetailPage