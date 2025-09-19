'use client'

import React from 'react'
import { User } from '../../../../types'

// Mock data for users
const mockUsers: User[] = [
	{
		userId: 'user-1',
		emailAddress: 'alice@example.com',
		role: 'candidate',
		createdAt: '2024-07-20',
		roleId: 1,
	},
	{
		userId: 'user-2',
		emailAddress: 'bob@company.com',
		role: 'recruiter',
		createdAt: '2024-07-19',
		roleId: 2,
	},
	{
		userId: 'user-3',
		emailAddress: 'charlie@admin.com',
		role: 'super_admin',
		createdAt: '2024-07-18',
		roleId: 5,
	},
]

const UserManagementPage = () => {
	return (
		<div className="min-h-screen bg-gray-100 p-8">
			<h1 className="text-3xl font-bold mb-6">User Management</h1>
			<div className="bg-white p-6 rounded-lg shadow-md">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								User ID
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Email Address
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Role
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Created At
							</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{mockUsers.map(user => (
							<tr key={user.userId}>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{user.userId}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{user.emailAddress}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
										{user.role}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{user.createdAt}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<a
										href="#"
										className="text-indigo-600 hover:text-indigo-900"
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
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default UserManagementPage

// Extend the User interface for the mock data
declare module '../../../../types' {
	interface User {
		role?: string
	}
}