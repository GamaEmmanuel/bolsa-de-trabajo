'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { JobPosting } from '../../../types'
import { db, auth } from '../../../lib/firebase'
import { doc, getDoc, collection, addDoc } from 'firebase/firestore'
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
	const [applied, setApplied] = useState(false)
	const [job, setJob] = useState<JobPosting | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [user, setUser] = useState(auth.currentUser)
	const [applying, setApplying] = useState(false)


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

		fetchJob()

		return () => unsubscribeAuth()
	}, [jobId])

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
			// Create application in Firestore
			await addDoc(collection(db, 'applications'), {
				candidateId: user.uid,
				jobId: job.jobId,
				companyId: job.companyId,
				applicationDate: new Date().toISOString(),
				pipelineStatus: 'applied',
				updatedAt: new Date().toISOString(),
			})

			setApplied(true)
			alert('Application submitted successfully!')
		} catch (error) {
			console.error('Error applying for job:', error)
			alert('Failed to submit application. Please try again.')
		} finally {
			setApplying(false)
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
				<div className="bg-card p-8 rounded-lg border border-border">
					<div className="flex justify-between items-start">
						<div>
							<h1 className="text-3xl font-bold text-foreground">{job.jobTitle}</h1>
							<p className="text-xl text-muted-foreground font-semibold mt-1">
								{job.companyName || 'Company Name'}
							</p>
							<p className="text-md text-muted-foreground">{job.location || 'Location not specified'}</p>
							{job.jobType && (
								<p className="text-sm text-muted-foreground mt-1">{job.jobType}</p>
							)}
						</div>
						<div className="text-right">
							{!job.isSalaryHidden && job.salaryMin && job.salaryMax && (
								<p className="text-lg font-semibold text-primary">
									${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} MXN
								</p>
							)}
							<button
								onClick={handleApply}
								disabled={applied || applying || !user}
								className="mt-2 w-full px-6 py-2 text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:bg-primary/50"
							>
								{applying ? 'Applying...' : applied ? 'Applied' : !user ? 'Sign In to Apply' : 'Instant Apply'}
							</button>
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