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

const AnalyticsPage = () => {
	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Recruitment Analytics</h1>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Recruitment Funnel */}
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-4">
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
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-4">
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
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-4">
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
				</div>
			</div>
		</div>
	)
}

export default AnalyticsPage