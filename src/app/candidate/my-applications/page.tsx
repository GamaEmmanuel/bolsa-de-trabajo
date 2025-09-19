'use client'

import React, { useState, useEffect } from 'react'
import { Application, JobPosting } from '../../../../types'
import { db, auth } from '../../../lib/firebase'
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import ApplicantKanban from '../../../components/ApplicantKanban'

// Helper to get status color
const getStatusColor = (status: string) => {
	switch (status) {
		case 'reviewed':
			return 'bg-blue-100 text-blue-800'
		case 'interview':
			return 'bg-yellow-100 text-yellow-800'
		case 'offer':
			return 'bg-purple-100 text-purple-800'
		case 'hired':
			return 'bg-green-100 text-green-800'
		case 'rejected':
			return 'bg-red-100 text-red-800'
		default:
			return 'bg-gray-100 text-gray-800'
	}
}

const MyApplicationsPage = () => {
	const [applications, setApplications] = useState<Application[]>([])
	const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')
	const [user, setUser] = useState(auth.currentUser)

	// Fetch applications and job postings
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser)
			if (!currentUser) {
				setLoading(false)
				return
			}

			// Fetch user's applications
			const applicationsQuery = query(
				collection(db, 'applications'),
				where('candidateId', '==', currentUser.uid)
			)

			const unsubscribeApplications = onSnapshot(applicationsQuery,
				(querySnapshot) => {
					const applicationsData: Application[] = []
					querySnapshot.forEach(doc => {
						applicationsData.push({ applicationId: doc.id, ...doc.data() } as Application)
					})
					setApplications(applicationsData)
					setLoading(false)
				},
				(error) => {
					console.error('Error fetching applications:', error)
					setError('Failed to load applications')
					setLoading(false)
				}
			)

			// Fetch job postings to get job details
			const jobsQuery = query(collection(db, 'jobPostings'))

			const unsubscribeJobs = onSnapshot(jobsQuery,
				(querySnapshot) => {
					const jobsData: JobPosting[] = []
					querySnapshot.forEach(doc => {
						jobsData.push({ jobId: doc.id, ...doc.data() } as JobPosting)
					})
					setJobPostings(jobsData)
				},
				(error) => {
					console.error('Error fetching job postings:', error)
				}
			)

			return () => {
				unsubscribeApplications()
				unsubscribeJobs()
			}
		})

		return () => unsubscribeAuth()
	}, [])

	// Enrich applications with job details
	const enrichedApplications = React.useMemo(() => {
		return applications.map(app => {
			const job = jobPostings.find(j => j.jobId === app.jobId)
			return {
				...app,
				jobTitle: job?.jobTitle || 'Job Title',
				companyName: job?.companyName || 'Company Name',
			}
		})
	}, [applications, jobPostings])

	// Handle application withdrawal
	const handleWithdraw = async (applicationId: string) => {
		if (!confirm('Are you sure you want to withdraw this application?')) {
			return
		}

		try {
			await deleteDoc(doc(db, 'applications', applicationId))
		} catch (error) {
			console.error('Error withdrawing application:', error)
			setError('Failed to withdraw application')
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 p-8">
				<div className="max-w-7xl mx-auto">
					<div className="flex items-center justify-center py-12">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<p className="ml-2 text-gray-600">Loading applications...</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
					<p className="text-gray-600 mt-1">Track the progress of your job applications</p>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setViewMode('kanban')}
						className={`px-4 py-2 rounded-md text-sm font-medium ${
							viewMode === 'kanban'
								? 'bg-blue-600 text-white'
								: 'bg-white text-gray-700 border border-gray-300'
						}`}
					>
						Kanban View
					</button>
					<button
						onClick={() => setViewMode('table')}
						className={`px-4 py-2 rounded-md text-sm font-medium ${
							viewMode === 'table'
								? 'bg-blue-600 text-white'
								: 'bg-white text-gray-700 border border-gray-300'
						}`}
					>
						Table View
					</button>
				</div>
			</div>

				{error && (
					<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
						<p className="text-red-600">{error}</p>
					</div>
				)}

				{viewMode === 'kanban' ? (
					<ApplicantKanban
						applications={enrichedApplications}
						onWithdraw={handleWithdraw}
						loading={loading}
					/>
				) : (
					<div className="bg-white p-6 rounded-lg shadow-md">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Job Title
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Company
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date Applied
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{enrichedApplications.length === 0 ? (
									<tr>
										<td colSpan={5} className="px-6 py-12 text-center text-gray-500">
											No applications found. Start applying to jobs to see them here.
										</td>
									</tr>
								) : (
									enrichedApplications.map(app => (
										<tr key={app.applicationId}>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{app.jobTitle}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{app.companyName}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{new Date(app.applicationDate).toLocaleDateString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
														app.pipelineStatus
													)}`}
												>
													{app.pipelineStatus}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">
												{(app.pipelineStatus === 'applied' || app.pipelineStatus === 'reviewed') && (
													<button
														onClick={() => handleWithdraw(app.applicationId)}
														className="text-red-600 hover:text-red-800 text-sm font-medium"
													>
														Withdraw
													</button>
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}
		</div>
	)
}

export default MyApplicationsPage

// Extend the Application interface for the mock data
declare module '../../../../types' {
	interface Application {
		jobTitle?: string
		companyName?: string
	}
}