'use client'

import React from 'react'
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

// Mock data for the charts
const funnelData = [
	{ name: 'Applied', value: 100 },
	{ name: 'Reviewed', value: 75 },
	{ name: 'Interview', value: 30 },
	{ name: 'Offer', value: 10 },
	{ name: 'Hired', value: 5 },
]

const timeToHireData = [
	{ name: 'Jan', days: 25 },
	{ name: 'Feb', days: 30 },
	{ name: 'Mar', days: 22 },
	{ name: 'Apr', days: 28 },
]

const acceptanceRateData = [
	{ name: 'Accepted', value: 8 },
	{ name: 'Rejected', value: 2 },
]
const COLORS = ['#0088FE', '#FF8042']

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

const CompanyDashboard = () => {
	return (
		<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-2">Recruitment Analytics</h1>
				<p className="text-muted-foreground">Track your hiring performance and key metrics</p>
			</div>

			{/* Key Metrics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<div className="bg-card p-6 rounded-lg border border-border">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Total Applications</p>
							<p className="text-2xl font-bold text-foreground">247</p>
						</div>
						<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
							<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-card p-6 rounded-lg border border-border">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
							<p className="text-2xl font-bold text-foreground">12</p>
						</div>
						<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-card p-6 rounded-lg border border-border">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Interviews Scheduled</p>
							<p className="text-2xl font-bold text-foreground">18</p>
						</div>
						<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
							<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h6m-6 0l.01.01M6 20v-2a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2z" />
							</svg>
						</div>
					</div>
				</div>
				<div className="bg-card p-6 rounded-lg border border-border">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Avg. Time to Hire</p>
							<p className="text-2xl font-bold text-foreground">26 days</p>
						</div>
						<div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
							<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
				</div>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Recruitment Funnel */}
				<div className="bg-card p-6 rounded-lg border border-border">
					<h2 className="text-xl font-semibold mb-4 text-foreground">
						Recruitment Funnel
					</h2>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={funnelData}>
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip />
							<Bar dataKey="value" fill="#8884d8" />
						</BarChart>
					</ResponsiveContainer>
				</div>

				{/* Time to Hire */}
				<div className="bg-card p-6 rounded-lg border border-border">
					<h2 className="text-xl font-semibold mb-4 text-foreground">
						Average Time to Hire (Days)
					</h2>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={timeToHireData}>
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip />
							<Bar dataKey="days" fill="#82ca9d" />
						</BarChart>
					</ResponsiveContainer>
				</div>

				{/* Offer Acceptance Rate */}
				<div className="bg-card p-6 rounded-lg border border-border">
					<h2 className="text-xl font-semibold mb-4 text-foreground">
						Offer Acceptance Rate
					</h2>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={acceptanceRateData}
								cx="50%"
								cy="50%"
								labelLine={false}
								label={renderCustomizedLabel}
								outerRadius={100}
								fill="#8884d8"
								dataKey="value"
							>
								{acceptanceRateData.map((entry, index) => (
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

				{/* Quick Actions */}
				<div className="bg-card p-6 rounded-lg border border-border">
					<h2 className="text-xl font-semibold mb-4 text-foreground">Quick Actions</h2>
					<div className="space-y-3">
						<button className="w-full text-left p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors">
							<div className="font-medium text-foreground">Create New Job Posting</div>
							<div className="text-sm text-muted-foreground">Post a new position to attract candidates</div>
						</button>
						<button className="w-full text-left p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors">
							<div className="font-medium text-foreground">Review Applications</div>
							<div className="text-sm text-muted-foreground">Check new candidate applications</div>
						</button>
						<button className="w-full text-left p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors">
							<div className="font-medium text-foreground">Schedule Interviews</div>
							<div className="text-sm text-muted-foreground">Coordinate upcoming interviews</div>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CompanyDashboard