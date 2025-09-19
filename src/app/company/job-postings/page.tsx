'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { db, auth } from '../../../lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { JobPosting } from '../../../../types'

const JobPostingsPage = () => {
	const [jobs, setJobs] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [user, setUser] = useState(auth.currentUser)

	useEffect(() => {
		// Listen for auth state changes
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			if (!currentUser) {
				setLoading(false)
				return
			}

			// Query jobs created by the current user
			// In a real app, you might query by companyId instead
			const q = query(
				collection(db, 'jobPostings'),
				where('createdByUserId', '==', currentUser.uid)
			)

			const unsubscribe = onSnapshot(q,
				(querySnapshot) => {
					const jobsData: JobPosting[] = []
					querySnapshot.forEach(doc => {
						jobsData.push({ jobId: doc.id, ...doc.data() } as JobPosting)
					})
					setJobs(jobsData)
					setLoading(false)
				},
				(error) => {
					console.error('Error fetching job postings:', error)
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
					<h1 className="text-3xl font-bold text-foreground mb-2">Job Postings</h1>
					<p className="text-muted-foreground">Create, edit, and view your company's job listings</p>
				</div>
				<Link
					href="/company/job-postings/new"
					className="px-4 py-2 text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
				>
					+ Create New Job
				</Link>
			</div>
			<div className="bg-card p-6 rounded-lg border border-border">
					{loading ? (
						<p>Loading job postings...</p>
					) : !user ? (
						<p className="text-red-600">Please sign in to view your job postings.</p>
					) : (
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
										<tr key={job.jobId}>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{job.jobTitle}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
														job.status === 'published'
															? 'bg-green-100 text-green-800'
															: 'bg-yellow-100 text-yellow-800'
													}`}
												>
													{job.status}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{job.postedDate}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<a
													href="#"
													className="text-blue-600 hover:text-blue-900"
												>
													Edit
												</a>
												<a
													href="#"
													className="text-red-600 hover:text-red-900 ml-4"
												>
													Delete
												</a>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan={4}
											className="text-center py-4 text-gray-500"
										>
											You have not created any job postings yet.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					)}
			</div>
		</div>
	)
}

export default JobPostingsPage