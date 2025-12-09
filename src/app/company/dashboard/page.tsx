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
	LineChart,
	Line,
	CartesianGrid,
} from 'recharts'

const CompanyDashboard = () => {
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
					{analyticsData.applicantsTimeSeriesData.length > 0 ? (
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
					) : (
						<div className="flex items-center justify-center h-[300px]">
							<div className="text-center">
								<div className="text-6xl mb-4">📊</div>
								<p className="text-muted-foreground text-sm">
									Sin datos aún. Las aplicaciones aparecerán aquí cuando comiences a recibir candidatos.
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Recruitment Progress */}
				<div className="bg-card p-6 rounded-xl shadow-sm">
					<h2 className="text-xl font-semibold mb-4 text-foreground">
						Progreso de Reclutamiento
					</h2>
					<div className="flex items-center justify-center h-[300px]">
						<div className="text-center">
							<div className="text-6xl mb-4">
								🎯
							</div>
							<h3 className="text-lg font-medium text-foreground mb-2">Comienza a Reclutar</h3>
							<p className="text-muted-foreground text-sm max-w-md">
								Publica tu primera vacante para comenzar a recibir aplicaciones y ver análisis detallados de tus candidatos.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CompanyDashboard