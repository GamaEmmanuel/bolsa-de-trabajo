'use client'

import React, { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../../../lib/firebase'
import { getRecruitmentAnalytics, AnalyticsData } from '../../../lib/analytics'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from 'recharts'

const COLORS = ['#f97316', '#ef4444'] // Orange theme colors

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({
	cx,
	cy,
	midAngle,
	innerRadius,
	outerRadius,
	percent,
}: any) => {
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5
	const x = cx + radius * Math.cos(-midAngle * RADIAN)
	const y = cy + radius * Math.sin(-midAngle * RADIAN)

	return (
		<text
			x={x}
			y={y}
			fill="white"
			textAnchor={x > cx ? 'start' : 'end'}
			dominantBaseline="central"
		>
			{`${(percent * 100).toFixed(0)}%`}
		</text>
	)
}

const AnalyticsPage = () => {
	const [user, loading] = useAuthState(auth)
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchAnalytics = async () => {
			if (!user) return

			setIsLoading(true)
			setError(null)

			try {
				const data = await getRecruitmentAnalytics(user.uid)
				setAnalyticsData(data)
			} catch (err) {
				console.error('Error fetching analytics:', err)
				setError('Failed to load analytics data')
			} finally {
				setIsLoading(false)
			}
		}

		if (user && !loading) {
			fetchAnalytics()
		}
	}, [user, loading])

	if (loading || isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 p-8">
				<div className="max-w-7xl mx-auto">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
							<p className="mt-2 text-gray-600">Loading analytics...</p>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 p-8">
				<div className="max-w-7xl mx-auto">
					<div className="bg-red-50 border border-red-200 rounded-lg p-4">
						<p className="text-red-600">{error}</p>
					</div>
				</div>
			</div>
		)
	}

	if (!analyticsData) {
		return (
			<div className="min-h-screen bg-gray-50 p-8">
				<div className="max-w-7xl mx-auto">
					<div className="text-center">
						<p className="text-gray-600">No analytics data available</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Recruitment Analytics</h1>

				{/* Key Metrics Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white p-6 rounded-lg shadow-md">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Total Applications</p>
								<p className="text-2xl font-bold text-gray-900">{analyticsData.totalApplications}</p>
							</div>
							<div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
						</div>
					</div>
					<div className="bg-white p-6 rounded-lg shadow-md">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Active Jobs</p>
								<p className="text-2xl font-bold text-gray-900">{analyticsData.activeJobs}</p>
							</div>
							<div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
								</svg>
							</div>
						</div>
					</div>
					<div className="bg-white p-6 rounded-lg shadow-md">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Total Hires</p>
								<p className="text-2xl font-bold text-gray-900">{analyticsData.totalHires}</p>
							</div>
							<div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
						</div>
					</div>
					<div className="bg-white p-6 rounded-lg shadow-md">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Avg. Time to Hire</p>
								<p className="text-2xl font-bold text-gray-900">{analyticsData.averageTimeToHire} days</p>
							</div>
							<div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Recruitment Funnel */}
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-4">
							Recruitment Funnel
						</h2>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={analyticsData.funnelData}>
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="value" fill="#f97316" />
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Time to Hire */}
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-4">
							Average Time to Hire (Days)
						</h2>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={analyticsData.timeToHireData}>
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="days" fill="#f97316" />
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Offer Acceptance Rate */}
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-4">
							Offer Acceptance Rate
						</h2>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={analyticsData.acceptanceRateData}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={renderCustomizedLabel}
									outerRadius={100}
									fill="#f97316"
									dataKey="value"
								>
									{analyticsData.acceptanceRateData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AnalyticsPage