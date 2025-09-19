'use client'

import React, { useState } from 'react'
import { JobPosting } from '../../../../types'

// Mock data for job postings pending moderation
const mockPendingJobs: JobPosting[] = [
	{
		jobId: 'job-101',
		companyId: 'comp-12',
		companyName: 'Startup Innovators',
		createdByUserId: 'user-45',
		jobTitle: 'Growth Hacker',
		jobDescription: 'Seeking a creative growth hacker...',
		status: 'pending_approval',
		postedDate: '2024-07-21',
	},
	{
		jobId: 'job-102',
		companyId: 'comp-15',
		companyName: 'Data Corp',
		createdByUserId: 'user-52',
		jobTitle: 'Data Scientist (Remote)',
		jobDescription: 'Join our data team...',
		status: 'pending_approval',
		postedDate: '2024-07-20',
	},
]

const ModerationPage = () => {
	const [pendingJobs, setPendingJobs] = useState(mockPendingJobs)

	const handleApprove = (jobId: string) => {
		console.log(`Approving job ${jobId}`)
		setPendingJobs(pendingJobs.filter(job => job.jobId !== jobId))
	}

	const handleReject = (jobId: string) => {
		console.log(`Rejecting job ${jobId}`)
		setPendingJobs(pendingJobs.filter(job => job.jobId !== jobId))
	}

	return (
		<div className="min-h-screen bg-gray-100 p-8">
			<h1 className="text-3xl font-bold mb-6">Content Moderation</h1>
			<h2 className="text-xl font-semibold mb-4">
				Job Postings Pending Approval
			</h2>
			<div className="bg-white p-6 rounded-lg shadow-md">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Job Title
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Company
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Date Posted
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{pendingJobs.map(job => (
							<tr key={job.jobId}>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
									{job.jobTitle}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{job.companyName}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{job.postedDate}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<button
										onClick={() => handleApprove(job.jobId)}
										className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-green-700"
									>
										Approve
									</button>
									<button
										onClick={() => handleReject(job.jobId)}
										className="ml-2 px-3 py-1 text-white bg-red-600 rounded-md hover:bg-red-700"
									>
										Reject
									</button>
								</td>
							</tr>
						))}
						{pendingJobs.length === 0 && (
							<tr>
								<td colSpan={4} className="text-center py-4 text-gray-500">
									No job postings are pending approval.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default ModerationPage

// Extend the JobPosting interface for the mock data
declare module '../../../../types' {
	interface JobPosting {
		companyName?: string
	}
}