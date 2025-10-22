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
		jobTitle: 'Desarrollador Frontend (React)',
		jobDescription: '',
		status: 'published',
		companyName: 'Tech Solutions Inc.',
		location: 'Mexico City, MX',
	},
	{
		jobId: 'rec-2',
		companyId: 'comp-2',
		createdByUserId: 'user-rec',
		jobTitle: 'Ingeniero Senior de JavaScript',
		jobDescription: '',
		status: 'published',
		companyName: 'Innovate Co.',
		location: 'Remoto',
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
			router.push('/')
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
				<p className="text-gray-600 mt-1">¡Bienvenido de vuelta! Aquí está lo que está pasando con tu búsqueda de empleo.</p>
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
							<h3 className="text-lg font-semibold text-gray-900">Buscar Empleos</h3>
							<p className="text-sm text-gray-500">Explora posiciones disponibles</p>
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
							<h3 className="text-lg font-semibold text-gray-900">Mis Aplicaciones</h3>
							<p className="text-sm text-gray-500">Rastrea tus aplicaciones</p>
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
							<h3 className="text-lg font-semibold text-gray-900">Mi Currículum</h3>
							<p className="text-sm text-gray-500">Actualiza tu perfil</p>
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
							<h3 className="text-lg font-semibold text-gray-900">Cuenta</h3>
							<p className="text-sm text-gray-500">Gestiona configuraciones</p>
						</div>
					</div>
				</Link>
			</div>

			{/* Recent Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Recommended Jobs */}
				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Empleos Recomendados</h2>
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
							Ver todos los empleos →
						</Link>
					</div>
				</div>

				{/* Quick Tips */}
				<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Consejos de Búsqueda de Empleo</h2>
					<div className="space-y-4">
						<div className="flex items-start">
							<div className="p-2 bg-blue-100 rounded-lg mr-3">
								<span className="text-sm">💡</span>
							</div>
							<div>
								<h3 className="text-sm font-medium text-gray-900">Completa tu Perfil</h3>
								<p className="text-sm text-gray-500">Un perfil completo aumenta tus posibilidades de ser notado por los empleadores.</p>
							</div>
						</div>
						<div className="flex items-start">
							<div className="p-2 bg-green-100 rounded-lg mr-3">
								<span className="text-sm">🎯</span>
							</div>
							<div>
								<h3 className="text-sm font-medium text-gray-900">Aplica Estratégicamente</h3>
								<p className="text-sm text-gray-500">Enfócate en empleos que coincidan con tus habilidades y experiencia.</p>
							</div>
						</div>
						<div className="flex items-start">
							<div className="p-2 bg-purple-100 rounded-lg mr-3">
								<span className="text-sm">📈</span>
							</div>
							<div>
								<h3 className="text-sm font-medium text-gray-900">Rastrea tu Progreso</h3>
								<p className="text-sm text-gray-500">Usa la página de aplicaciones para monitorear tu progreso en la búsqueda de empleo.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CandidateDashboard