'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { db, auth } from '../../../lib/firebase'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { JobPosting } from '../../../../types'

const JobPostingsPage = () => {
	const [jobs, setJobs] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState(auth.currentUser)
	const [error, setError] = useState<string | null>(null)

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
					setError('Failed to load job postings. Please try again.')
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
					<h1 className="text-3xl font-bold text-foreground mb-2">Your Job Postings</h1>
					<p className="text-muted-foreground">Manage and track your company's job listings</p>
				</div>
				<Link
					href="/company/job-postings/new"
					className="px-4 py-2 text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
				>
					+ Create New Job
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

			<div className="bg-card p-6 rounded-lg border border-border">
					{loading ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-center">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
							<p className="mt-2 text-gray-600">Loading your job postings...</p>
						</div>
					</div>
					) : !user ? (
					<div className="text-center py-8">
						<p className="text-red-600">Please sign in to view your job postings.</p>
					</div>
				) : (
					<>
						{/* Job Statistics */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div className="bg-orange-50 p-4 rounded-lg">
								<div className="text-2xl font-bold text-orange-600">{jobs.length}</div>
								<div className="text-sm text-orange-700">Total Jobs</div>
							</div>
							<div className="bg-green-50 p-4 rounded-lg">
								<div className="text-2xl font-bold text-green-600">
									{jobs.filter(job => job.status === 'published').length}
								</div>
								<div className="text-sm text-green-700">Published</div>
							</div>
							<div className="bg-yellow-50 p-4 rounded-lg">
								<div className="text-2xl font-bold text-yellow-600">
									{jobs.filter(job => job.status === 'pending_approval').length}
								</div>
								<div className="text-sm text-yellow-700">Pending</div>
							</div>
						</div>

						{/* Jobs Table */}
						<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Job Title
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Tier
										</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Posted Date
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{jobs.length > 0 ? (
									jobs.map(job => (
											<tr key={job.jobId} className="hover:bg-gray-50">
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm font-medium text-gray-900">
												{job.jobTitle}
													</div>
													<div className="text-sm text-gray-500 truncate max-w-xs">
														{job.jobDescription?.substring(0, 100)}...
													</div>
											</td>
												<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
														job.status === 'published'
															? 'bg-green-100 text-green-800'
																: job.status === 'pending_approval'
																? 'bg-yellow-100 text-yellow-800'
																: 'bg-gray-100 text-gray-800'
													}`}
												>
														{job.status?.replace('_', ' ')}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													<span className="capitalize">{job.tier || 'Classic'}</span>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
													{job.postedDate || 'Not posted'}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
													<div className="flex justify-end space-x-2">
														<Link
															href={`/jobs/${job.jobId}`}
															className="text-blue-600 hover:text-blue-900"
														>
															View
														</Link>
														<Link
															href={`/company/job-postings/${job.jobId}/edit`}
															className="text-indigo-600 hover:text-indigo-900"
														>
															Edit
														</Link>
														<button
															onClick={() => {
																// TODO: Implement delete functionality
																if (confirm('Are you sure you want to delete this job posting?')) {
																	alert('Delete functionality coming soon!')
																}
															}}
															className="text-red-600 hover:text-red-900"
														>
															Delete
														</button>
													</div>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
												colSpan={5}
												className="text-center py-8 text-gray-500"
											>
												<div className="text-center">
													<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
													</svg>
													<h3 className="mt-2 text-sm font-medium text-gray-900">No job postings</h3>
													<p className="mt-1 text-sm text-gray-500">Get started by creating your first job posting.</p>
													<div className="mt-6">
														<Link
															href="/company/job-postings/new"
															className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
														>
															+ Create New Job
														</Link>
													</div>
												</div>
										</td>
									</tr>
								)}
							</tbody>
						</table>
						</div>
					</>
					)}
			</div>
		</div>
	)
}

export default JobPostingsPage