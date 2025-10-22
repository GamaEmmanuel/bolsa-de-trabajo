'use client'

import React from 'react'
import { Application, PipelineStatus } from '../types'

// Define the columns for the Kanban board
const columns: PipelineStatus[] = [
	'applied',
	'reviewed',
	'interview',
	'assessments',
	'finalista',
	'rejected',
]

// Helper function to get status color
const getStatusColor = (status: PipelineStatus) => {
	switch (status) {
		case 'applied':
			return 'bg-gray-100 text-gray-800 border-gray-200'
		case 'reviewed':
			return 'bg-blue-100 text-blue-800 border-blue-200'
		case 'interview':
			return 'bg-yellow-100 text-yellow-800 border-yellow-200'
		case 'assessments':
			return 'bg-purple-100 text-purple-800 border-purple-200'
		case 'finalista':
			return 'bg-green-100 text-green-800 border-green-200'
		case 'rejected':
			return 'bg-red-100 text-red-800 border-red-200'
		default:
			return 'bg-gray-100 text-gray-800 border-gray-200'
	}
}

// Helper function to get status display name
const getStatusDisplayName = (status: PipelineStatus) => {
	switch (status) {
		case 'not_moving_forward':
			return 'Not Moving Forward'
		default:
			return status.charAt(0).toUpperCase() + status.slice(1)
	}
}

// Application Card Component (Read-only)
const ApplicationCard = ({
	app,
	onWithdraw
}: {
	app: Application
	onWithdraw: (applicationId: string) => void
}) => {
	const canWithdraw = app.pipelineStatus === 'applied' || app.pipelineStatus === 'reviewed'

	return (
		<div className="bg-white p-4 mb-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
			<div className="flex justify-between items-start mb-2">
				<h3 className="font-semibold text-gray-900 text-sm">
					{app.jobTitle || 'Job Title'}
				</h3>
				{canWithdraw && (
					<button
						onClick={() => onWithdraw(app.applicationId)}
						className="text-xs text-red-600 hover:text-red-800 font-medium"
					>
						Withdraw
					</button>
				)}
			</div>
			<p className="text-sm text-gray-600 mb-2">
				{app.companyName || 'Company Name'}
			</p>
			<p className="text-xs text-gray-500">
				Applied on {new Date(app.applicationDate).toLocaleDateString()}
			</p>
			{app.updatedAt && (
				<p className="text-xs text-gray-400 mt-1">
					Last updated: {new Date(app.updatedAt).toLocaleDateString()}
				</p>
			)}
		</div>
	)
}

// Pipeline Column Component (Read-only)
const PipelineColumn = ({
	status,
	applications,
	onWithdraw,
}: {
	status: PipelineStatus
	applications: Application[]
	onWithdraw: (applicationId: string) => void
}) => {
	return (
		<div className="flex-1 min-w-[250px] p-4 rounded-lg border border-gray-200 bg-gray-50">
			<div className="flex items-center justify-between mb-4">
				<h2 className={`text-lg font-semibold capitalize ${getStatusColor(status).split(' ')[1]}`}>
					{getStatusDisplayName(status)}
				</h2>
				<span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
					{applications.length}
				</span>
			</div>
			<div className="min-h-[200px]">
				{applications.length === 0 ? (
					<div className="text-center text-gray-500 text-sm py-8">
						No applications in this stage
					</div>
				) : (
					applications.map(app => (
						<ApplicationCard
							key={app.applicationId}
							app={app}
							onWithdraw={onWithdraw}
						/>
					))
				)}
			</div>
		</div>
	)
}

// Main Applicant Kanban Component
interface ApplicantKanbanProps {
	applications: Application[]
	onWithdraw: (applicationId: string) => void
	loading?: boolean
}

const ApplicantKanban: React.FC<ApplicantKanbanProps> = ({
	applications,
	onWithdraw,
	loading = false
}) => {
	// Group applications by status
	const applicationsByStatus = React.useMemo(() => {
		const grouped: Record<PipelineStatus, Application[]> = {
			applied: [],
			reviewed: [],
			interview: [],
			assessments: [],
			finalista: [],
			rejected: [],
		}

		applications.forEach(app => {
			// Map old 'offer' and 'hired' statuses to new 'finalista' status
			const status = (app.pipelineStatus === 'offer' || app.pipelineStatus === 'hired') ? 'finalista' : app.pipelineStatus
			if (grouped[status]) {
				grouped[status].push(app)
			}
		})

		return grouped
	}, [applications])

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p className="ml-2 text-gray-600">Loading applications...</p>
			</div>
		)
	}

	if (applications.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="text-gray-400 text-6xl mb-4">📋</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
				<p className="text-gray-500">Start applying to jobs to see your progress here.</p>
			</div>
		)
	}

	return (
		<div className="w-full">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Application Pipeline</h2>
				<p className="text-gray-600">
					Track the progress of your job applications. You can withdraw applications that are still in the early stages.
				</p>
			</div>

			<div className="flex gap-4 overflow-x-auto pb-4">
				{columns.map(status => (
					<PipelineColumn
						key={status}
						status={status}
						applications={applicationsByStatus[status]}
						onWithdraw={onWithdraw}
					/>
				))}
			</div>
		</div>
	)
}

export default ApplicantKanban
