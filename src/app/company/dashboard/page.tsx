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
	LineChart,
	Line,
	CartesianGrid,
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

const CompanyDashboard = () => {
	const [user, loading] = useAuthState(auth)
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Mock demographic data - in a real app, this would come from candidate profiles
	const demographicData = {
		gender: [
			{ name: 'Masculino', value: 48, count: 24 },
			{ name: 'Femenino', value: 52, count: 26 }
		],
		age: [
			{ name: '18-22', value: 8, count: 4 },
			{ name: '23-27', value: 24, count: 12 },
			{ name: '28-32', value: 32, count: 16 },
			{ name: '33-37', value: 20, count: 10 },
			{ name: '38-42', value: 12, count: 6 },
			{ name: '43+', value: 4, count: 2 }
		],
		education: [
			{ name: 'Preparatoria', value: 12, count: 6 },
			{ name: 'Licenciatura', value: 56, count: 28 },
			{ name: 'Maestría', value: 28, count: 14 },
			{ name: 'Doctorado', value: 4, count: 2 }
		],
		experience: [
			{ name: '0-2 años', value: 20, count: 10 },
			{ name: '3-5 años', value: 36, count: 18 },
			{ name: '6-10 años', value: 32, count: 16 },
			{ name: '10+ años', value: 12, count: 6 }
		],
		location: [
			{ name: 'Ciudad de México', value: 40, count: 20 },
			{ name: 'Guadalajara', value: 24, count: 12 },
			{ name: 'Monterrey', value: 20, count: 10 },
			{ name: 'Remoto', value: 16, count: 8 }
		]
	}

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
				setError('Error al cargar los datos de análisis')
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
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
						<p className="mt-2 text-gray-600">Cargando panel...</p>
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<p className="text-red-600">{error}</p>
				</div>
			</div>
		)
	}

	if (!analyticsData) {
		return (
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="text-center">
					<p className="text-gray-600">No hay datos de análisis disponibles</p>
				</div>
			</div>
		)
	}

	return (
		<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-2">Análisis de Reclutamiento</h1>
				<p className="text-muted-foreground">Rastrea el rendimiento de contratación y métricas clave</p>
			</div>

			{/* Key Metrics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<div className="flex items-center gap-4">
						<div className="text-4xl">
							📋
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Total de Aplicaciones</p>
							<p className="text-2xl font-bold text-foreground">{analyticsData.totalApplications}</p>
						</div>
					</div>
				</div>
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<div className="flex items-center gap-4">
						<div className="text-4xl">
							💼
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Empleos Activos</p>
							<p className="text-2xl font-bold text-foreground">{analyticsData.activeJobs}</p>
						</div>
					</div>
				</div>
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<div className="flex items-center gap-4">
						<div className="text-4xl">
							👥
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Total de Contrataciones</p>
							<p className="text-2xl font-bold text-foreground">{analyticsData.totalHires}</p>
						</div>
					</div>
				</div>
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<div className="flex items-center gap-4">
						<div className="text-4xl">
							⏱️
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Tiempo Promedio de Contratación</p>
							<p className="text-2xl font-bold text-foreground">{analyticsData.averageTimeToHire} días</p>
						</div>
					</div>
				</div>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Recruitment Funnel */}
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<h2 className="text-xl font-semibold mb-4 text-foreground">
						Embudo de Reclutamiento
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

				{/* Total Applications Over Time */}
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<h2 className="text-xl font-semibold mb-4 text-foreground">
						Total de Aplicaciones en el Tiempo
					</h2>
					<ResponsiveContainer width="100%" height={300}>
						<LineChart data={analyticsData.applicantsTimeSeriesData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip />
							<Line
								type="monotone"
								dataKey="applicants"
								stroke="#f97316"
								strokeWidth={3}
								dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
								activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>

				{/* Gender Demographics */}
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<h3 className="text-xl font-semibold mb-4 text-foreground">Género</h3>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={demographicData.gender}
								cx="50%"
								cy="50%"
								labelLine={false}
								label={renderCustomizedLabel}
								outerRadius={100}
								fill="#f97316"
								dataKey="value"
							>
								{demographicData.gender.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={COLORS[index % COLORS.length]}
									/>
								))}
							</Pie>
							<Tooltip formatter={(value, name, props) => [`${value}%`, name]} />
						</PieChart>
					</ResponsiveContainer>
					<div className="mt-4 text-center text-sm text-muted-foreground">
						Total de candidatos: {demographicData.gender.reduce((sum, item) => sum + item.count, 0)}
					</div>
				</div>

				{/* Age Demographics */}
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<h3 className="text-xl font-semibold mb-4 text-foreground">Edad</h3>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={demographicData.age}>
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip formatter={(value, name, props) => [`${value}%`, name]} />
							<Bar dataKey="value" fill="#f97316" />
						</BarChart>
					</ResponsiveContainer>
					<div className="mt-4 text-center text-sm text-muted-foreground">
						Total de candidatos: {demographicData.age.reduce((sum, item) => sum + item.count, 0)}
					</div>
				</div>

				{/* Education Demographics */}
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<h3 className="text-xl font-semibold mb-4 text-foreground">Educación</h3>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={demographicData.education}>
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip formatter={(value, name, props) => [`${value}%`, name]} />
							<Bar dataKey="value" fill="#f97316" />
						</BarChart>
					</ResponsiveContainer>
					<div className="mt-4 text-center text-sm text-muted-foreground">
						Total de candidatos: {demographicData.education.reduce((sum, item) => sum + item.count, 0)}
					</div>
				</div>

				{/* Experience Demographics */}
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<h3 className="text-xl font-semibold mb-4 text-foreground">Experiencia</h3>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={demographicData.experience}>
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip formatter={(value, name, props) => [`${value}%`, name]} />
							<Bar dataKey="value" fill="#f97316" />
						</BarChart>
					</ResponsiveContainer>
					<div className="mt-4 text-center text-sm text-muted-foreground">
						Total de candidatos: {demographicData.experience.reduce((sum, item) => sum + item.count, 0)}
					</div>
				</div>

				{/* Location Demographics */}
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<h3 className="text-xl font-semibold mb-4 text-foreground">Ubicación</h3>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={demographicData.location}>
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip formatter={(value, name, props) => [`${value}%`, name]} />
							<Bar dataKey="value" fill="#f97316" />
						</BarChart>
					</ResponsiveContainer>
					<div className="mt-4 text-center text-sm text-muted-foreground">
						Total de candidatos: {demographicData.location.reduce((sum, item) => sum + item.count, 0)}
					</div>
				</div>

				{/* AI Interviews */}
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<h2 className="text-xl font-semibold mb-4 text-foreground">
						Entrevistas con IA
					</h2>
					<div className="flex items-center justify-center h-[300px]">
						<div className="text-center">
							<div className="text-6xl mb-4">
								🤖
							</div>
							<h3 className="text-lg font-medium text-foreground mb-2">Entrevistas con IA</h3>
							<p className="text-muted-foreground text-sm">
								Análisis de entrevistas impulsado por IA próximamente
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CompanyDashboard