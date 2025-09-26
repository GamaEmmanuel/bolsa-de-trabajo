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
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [user, setUser] = useState(auth.currentUser)
	const [applying, setApplying] = useState(false)
	const [withdrawing, setWithdrawing] = useState(false)


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
			alert('Please sign in to apply for this job')
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
							<h1 className="text-3xl font-bold text-foreground">{job.jobTitle}</h1>
							<p className="text-xl text-muted-foreground font-semibold mt-1">
								{job.companyName || 'Company Name'}
							</p>
							<p className="text-md text-muted-foreground">{job.location || 'Location not specified'}</p>
							{job.jobType && (
								<span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
									{job.jobType}
								</span>
							)}
						</div>
						<div className="ml-6 text-right">
							{!job.isSalaryHidden && job.salaryMin && job.salaryMax && (
								<p className="text-2xl font-bold text-green-600 mb-4">
									${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} MXN
								</p>
							)}
							<div className="space-y-3">
								{applied ? (
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
				</div>
			</div>
		</div>
	)
}

export default JobDetailPage