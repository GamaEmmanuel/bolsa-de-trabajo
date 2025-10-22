'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, auth } from '../../../../../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { JobPosting, JobTier, JobStatus } from '../../../../../../types'
import LocationSelector from '../../../../../components/ui/LocationSelector'

const EditJobPage = () => {
	const { jobId } = useParams()
	const router = useRouter()
	const [job, setJob] = useState<JobPosting | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [user, setUser] = useState(auth.currentUser)

	// Form state
	const [formData, setFormData] = useState({
		jobTitle: '',
		jobDescription: '',
		requirements: '',
		salaryMin: '',
		salaryMax: '',
		isSalaryHidden: false,
		jobType: '',
		location: '',
		category: '',
		tier: 'clasica' as JobTier,
		status: 'pending_approval' as JobStatus
	})

	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			if (!currentUser) {
				router.push('/signin')
				return
			}
		})

		const fetchJob = async () => {
			if (!jobId || !user) return

			try {
				const jobRef = doc(db, 'jobPostings', jobId as string)
				const jobDoc = await getDoc(jobRef)

				if (jobDoc.exists()) {
					const jobData = { jobId: jobDoc.id, ...jobDoc.data() } as JobPosting

					// Check if the current user owns this job
					if (jobData.createdByUserId !== user.uid) {
						setError('You do not have permission to edit this job posting.')
						setLoading(false)
						return
					}

					setJob(jobData)

					// Populate form with existing data
					setFormData({
						jobTitle: jobData.jobTitle || '',
						jobDescription: jobData.jobDescription || '',
						requirements: jobData.requirements ? String(jobData.requirements) : '',
						salaryMin: jobData.salaryMin?.toString() || '',
						salaryMax: jobData.salaryMax?.toString() || '',
						isSalaryHidden: jobData.isSalaryHidden || false,
						jobType: jobData.jobType || '',
						location: jobData.location || '',
						category: jobData.category || '',
						tier: jobData.tier || 'clasica',
						status: jobData.status || 'pending_approval'
					})
				} else {
					setError('Job posting not found.')
				}
			} catch (err) {
				console.error('Error fetching job:', err)
				setError('Failed to load job posting.')
			} finally {
				setLoading(false)
			}
		}

		if (user && jobId) {
			fetchJob()
		}

		return () => unsubscribeAuth()
	}, [jobId, user, router])

	const handleInputChange = (field: string, value: string | boolean | number) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}))
	}

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!user || !jobId) {
			setError('You must be signed in to edit job postings.')
			return
		}

		setSaving(true)
		setError(null)
		setSuccess(false)

		try {
			// Prepare update data
			const updateData = {
				jobTitle: formData.jobTitle,
				jobDescription: formData.jobDescription,
				requirements: formData.requirements,
				salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
				salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
				isSalaryHidden: formData.isSalaryHidden,
				jobType: formData.jobType,
				location: formData.location,
				category: formData.category,
				tier: formData.tier,
				status: formData.status,
				updatedAt: new Date().toISOString()
			}

			// Update job in Firestore
			const jobRef = doc(db, 'jobPostings', jobId as string)
			await updateDoc(jobRef, updateData)

			setSuccess(true)
			setTimeout(() => {
				router.push('/company/job-postings')
			}, 2000)

		} catch (error) {
			console.error('Error updating job:', error)
			setError('Failed to update job posting. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
						<p className="mt-2 text-gray-600">Loading job posting...</p>
					</div>
				</div>
			</div>
		)
	}

	if (error && !job) {
		return (
			<div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
			</div>
		)
	}

	return (
		<div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-2">Edit Job Posting</h1>
				<p className="text-muted-foreground">Update your job posting information</p>
			</div>

			{/* Success Message */}
			{success && (
				<div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm font-medium text-green-800">
								Job posting updated successfully! Redirecting...
							</p>
						</div>
					</div>
				</div>
			)}

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

			<div className="bg-card rounded-lg border border-border">
				<div className="p-6">
					<form onSubmit={handleSave} className="space-y-8">

						{/* Basic Information */}
						<div className="border-b border-border pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Basic Information</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-foreground mb-2">
										Job Title *
									</label>
									<input
										type="text"
										value={formData.jobTitle}
										onChange={(e) => handleInputChange('jobTitle', e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
										required
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-foreground mb-2">
										Job Description *
									</label>
									<textarea
										value={formData.jobDescription}
										onChange={(e) => handleInputChange('jobDescription', e.target.value)}
										rows={6}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
										required
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-foreground mb-2">
										Requirements
									</label>
									<textarea
										value={formData.requirements}
										onChange={(e) => handleInputChange('requirements', e.target.value)}
										rows={4}
										placeholder="List the key requirements for this position..."
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
							</div>
						</div>

						{/* Job Details */}
						<div className="border-b border-border pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Job Details</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Job Type
									</label>
									<select
										value={formData.jobType}
										onChange={(e) => handleInputChange('jobType', e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									>
										<option value="">Select job type</option>
										<option value="full-time">Full-time</option>
										<option value="part-time">Part-time</option>
										<option value="contract">Contract</option>
										<option value="internship">Internship</option>
										<option value="freelance">Freelance</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Location
									</label>
									<LocationSelector
										value={formData.location}
										onChange={(locationData) => {
											if (locationData) {
												const locationString = locationData.city + (locationData.state ? `, ${locationData.state}` : '')
												handleInputChange('location', locationString)
											} else {
												handleInputChange('location', '')
											}
										}}
										placeholder="Selecciona una ciudad"
										className="w-full"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Category
									</label>
									<select
										value={formData.category}
										onChange={(e) => handleInputChange('category', e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									>
										<option value="">Select category</option>
										<option value="technology">Technology</option>
										<option value="healthcare">Healthcare</option>
										<option value="finance">Finance</option>
										<option value="education">Education</option>
										<option value="marketing">Marketing</option>
										<option value="sales">Sales</option>
										<option value="other">Other</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Status
									</label>
									<select
										value={formData.status}
										onChange={(e) => handleInputChange('status', e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									>
										<option value="pending_approval">Pending Approval</option>
										<option value="published">Published</option>
										<option value="paused">Paused</option>
										<option value="closed">Closed</option>
									</select>
								</div>
							</div>
						</div>

						{/* Salary Information */}
						<div className="border-b border-border pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Salary Information</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Minimum Salary (MXN)
									</label>
									<input
										type="number"
										value={formData.salaryMin}
										onChange={(e) => handleInputChange('salaryMin', e.target.value)}
										placeholder="50000"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground mb-2">
										Maximum Salary (MXN)
									</label>
									<input
										type="number"
										value={formData.salaryMax}
										onChange={(e) => handleInputChange('salaryMax', e.target.value)}
										placeholder="80000"
										className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="flex items-center">
										<input
											type="checkbox"
											checked={formData.isSalaryHidden}
											onChange={(e) => handleInputChange('isSalaryHidden', e.target.checked)}
											className="mr-2"
										/>
										<span className="text-sm text-foreground">Hide salary information</span>
									</label>
								</div>
							</div>
						</div>

						{/* Job Tier */}
						<div className="pb-8">
							<h2 className="text-xl font-semibold text-foreground mb-4">Job Tier</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
									formData.tier === 'clasica' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
								}`} onClick={() => handleInputChange('tier', 'clasica')}>
									<div className="text-center">
										<h3 className="font-semibold text-foreground">Classic</h3>
										<p className="text-sm text-muted-foreground">Basic job posting</p>
									</div>
								</div>
								<div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
									formData.tier === 'destacada' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
								}`} onClick={() => handleInputChange('tier', 'destacada')}>
									<div className="text-center">
										<h3 className="font-semibold text-foreground">Featured</h3>
										<p className="text-sm text-muted-foreground">Enhanced visibility</p>
									</div>
								</div>
								<div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
									formData.tier === 'premium' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
								}`} onClick={() => handleInputChange('tier', 'premium')}>
									<div className="text-center">
										<h3 className="font-semibold text-foreground">Premium</h3>
										<p className="text-sm text-muted-foreground">Maximum exposure</p>
									</div>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex justify-end space-x-4">
							<button
								type="button"
								onClick={() => router.push('/company/job-postings')}
								className="px-6 py-2 text-muted-foreground bg-secondary border border-border rounded-md hover:bg-accent transition-colors"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={saving}
								className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{saving ? (
									<div className="flex items-center">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Saving...
									</div>
								) : (
									'Save Changes'
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default EditJobPage
