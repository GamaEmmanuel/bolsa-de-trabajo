'use client'

import React from 'react'

const AdminDashboardPage = () => {
	// Mock data for dashboard widgets
	const stats = [
		{ name: 'Total Users', value: '1,234' },
		{ name: 'Active Job Postings', value: '567' },
		{ name: 'Companies Registered', value: '89' },
		{ name: 'Revenue (Last 30 Days)', value: '$12,345' },
	]

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Admin Sidebar Navigation would go here */}
			<div className="p-8">
				<h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{stats.map(stat => (
						<div
							key={stat.name}
							className="bg-white p-6 rounded-lg shadow-md"
						>
							<h3 className="text-gray-500 text-sm font-medium">
								{stat.name}
							</h3>
							<p className="text-3xl font-semibold mt-1">{stat.value}</p>
						</div>
					))}
				</div>

				{/* Placeholder for more widgets and reports */}
				<div className="mt-8">
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-4">
							Recent Activity
						</h2>
						<p className="text-gray-600">
							Activity feed will be displayed here.
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AdminDashboardPage