'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../../lib/firebase'
import { signOut } from 'firebase/auth'
import { JobPosting } from '../../../types'

// Mock data for recommended jobs
const recommendedJobs: JobPosting[] = [
	{
		jobId: 'rec-1',
		companyId: 'comp-1',
		createdByUserId: 'user-rec',
		jobTitle: 'Frontend Developer (React)',
		jobDescription: '',
		status: 'published',
		companyName: 'Tech Solutions Inc.',
		location: 'Mexico City, MX',
	},
	{
		jobId: 'rec-2',
		companyId: 'comp-2',
		createdByUserId: 'user-rec',
		jobTitle: 'Senior JavaScript Engineer',
		jobDescription: '',
		status: 'published',
		companyName: 'Innovate Co.',
		location: 'Remote',
	},
]

// Extend the JobPosting interface for the mock data
declare module '../../../types' {
	interface JobPosting {
		companyName?: string
		location?: string
	}
}

const CandidateDashboard = () => {
	const router = useRouter()

	const handleSignOut = async () => {
		try {
			await signOut(auth)
			router.push('/signin')
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
				<p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening with your job search.</p>
			</div>
			{/* Quick Actions */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Link
					href="/candidate/jobs"
					className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center">
						<div className="p-3 bg-blue-100 rounded-lg">
							<span className="text-2xl">🔍</span>
						</div>
						<div className="ml-4">
							<h3 className="text-lg font-semibold text-gray-900">Find Jobs</h3>
							<p className="text-sm text-gray-500">Browse available positions</p>
						</div>
					</div>
				</Link>

				<Link
					href="/candidate/my-applications"
					className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center">
						<div className="p-3 bg-green-100 rounded-lg">
							<span className="text-2xl">📋</span>
						</div>
						<div className="ml-4">
							<h3 className="text-lg font-semibold text-gray-900">My Applications</h3>
							<p className="text-sm text-gray-500">Track your applications</p>
						</div>
					</div>
				</Link>

				<Link
					href="/candidate/resume"
					className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center">
						<div className="p-3 bg-purple-100 rounded-lg">
							<span className="text-2xl">📄</span>
						</div>
						<div className="ml-4">
							<h3 className="text-lg font-semibold text-gray-900">My Resume</h3>
							<p className="text-sm text-gray-500">Update your profile</p>
						</div>
					</div>
				</Link>

				<Link
					href="/candidate/account"
					className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center">
						<div className="p-3 bg-orange-100 rounded-lg">
							<span className="text-2xl">👤</span>
						</div>
						<div className="ml-4">
							<h3 className="text-lg font-semibold text-gray-900">Account</h3>
							<p className="text-sm text-gray-500">Manage settings</p>
						</div>
					</div>
				</Link>
			</div>

			{/* Recent Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Recommended Jobs */}
				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Recommended Jobs</h2>
					<div className="space-y-4">
						{recommendedJobs.map(job => (
							<div key={job.jobId} className="border-b border-gray-200 pb-3 last:border-b-0">
								<Link
									href={`/jobs/${job.jobId}`}
									className="font-semibold text-blue-600 hover:text-blue-800"
								>
									{job.jobTitle}
								</Link>
								<p className="text-sm text-gray-500 mt-1">
									{job.companyName} - {job.location}
								</p>
							</div>
						))}
					</div>
					<div className="mt-4">
						<Link
							href="/candidate/jobs"
							className="text-sm text-blue-600 hover:text-blue-800"
						>
							View all jobs →
						</Link>
					</div>
				</div>

				{/* Quick Tips */}
				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Job Search Tips</h2>
					<div className="space-y-4">
						<div className="flex items-start">
							<div className="p-2 bg-blue-100 rounded-lg mr-3">
								<span className="text-sm">💡</span>
							</div>
							<div>
								<h3 className="text-sm font-medium text-gray-900">Complete Your Profile</h3>
								<p className="text-sm text-gray-500">A complete profile increases your chances of being noticed by employers.</p>
							</div>
						</div>
						<div className="flex items-start">
							<div className="p-2 bg-green-100 rounded-lg mr-3">
								<span className="text-sm">🎯</span>
							</div>
							<div>
								<h3 className="text-sm font-medium text-gray-900">Apply Strategically</h3>
								<p className="text-sm text-gray-500">Focus on jobs that match your skills and experience.</p>
							</div>
						</div>
						<div className="flex items-start">
							<div className="p-2 bg-purple-100 rounded-lg mr-3">
								<span className="text-sm">📈</span>
							</div>
							<div>
								<h3 className="text-sm font-medium text-gray-900">Track Your Progress</h3>
								<p className="text-sm text-gray-500">Use the applications page to monitor your job search progress.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CandidateDashboard