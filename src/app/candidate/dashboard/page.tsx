'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, db } from '../../../lib/firebase'
import { signOut } from 'firebase/auth'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { JobPosting } from '../../../types'

// Extend the JobPosting interface for additional fields
declare module '../../../types' {
	interface JobPosting {
		companyName?: string
		location?: string
	}
}

const CandidateDashboard = () => {
	const router = useRouter()
	const [recommendedJobs, setRecommendedJobs] = useState<JobPosting[]>([])
	const [loadingJobs, setLoadingJobs] = useState(true)

	// Fetch real recommended jobs from Firebase
	useEffect(() => {
		const fetchRecommendedJobs = async () => {
			try {
				const jobsQuery = query(
					collection(db, 'jobPostings'),
					where('status', '==', 'published'),
					orderBy('postedDate', 'desc'),
					limit(5)
				)
				const snapshot = await getDocs(jobsQuery)
				const jobs = snapshot.docs.map(doc => ({
					jobId: doc.id,
					...doc.data()
				} as JobPosting))
				setRecommendedJobs(jobs)
			} catch (error) {
				console.error('Error fetching recommended jobs:', error)
			} finally {
				setLoadingJobs(false)
			}
		}

		fetchRecommendedJobs()
	}, [])

	const handleSignOut = async () => {
		try {
			await signOut(auth)
			router.push('/')
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel de Control</h1>
				<p className="text-sm sm:text-base text-gray-600 mt-1">¡Bienvenido de vuelta! Aquí está lo que está pasando con tu búsqueda de empleo.</p>
			</div>
			{/* Quick Actions */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
				<Link
					href="/candidate/jobs"
					className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center">
						<div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
							<span className="text-xl sm:text-2xl">🔍</span>
						</div>
						<div className="ml-3 sm:ml-4 min-w-0">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Buscar Empleos</h3>
							<p className="text-xs sm:text-sm text-gray-500">Explora posiciones disponibles</p>
						</div>
					</div>
				</Link>

				<Link
					href="/candidate/my-applications"
					className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center">
						<div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
							<span className="text-xl sm:text-2xl">📋</span>
						</div>
						<div className="ml-3 sm:ml-4 min-w-0">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Mis Aplicaciones</h3>
							<p className="text-xs sm:text-sm text-gray-500">Rastrea tus aplicaciones</p>
						</div>
					</div>
				</Link>

				<Link
					href="/candidate/resume"
					className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center">
						<div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
							<span className="text-xl sm:text-2xl">📄</span>
						</div>
						<div className="ml-3 sm:ml-4 min-w-0">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Mi Currículum</h3>
							<p className="text-xs sm:text-sm text-gray-500">Actualiza tu perfil</p>
						</div>
					</div>
				</Link>

				<Link
					href="/candidate/account"
					className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center">
						<div className="p-2 sm:p-3 bg-orange-100 rounded-lg flex-shrink-0">
							<span className="text-xl sm:text-2xl">👤</span>
						</div>
						<div className="ml-3 sm:ml-4 min-w-0">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Cuenta</h3>
							<p className="text-xs sm:text-sm text-gray-500">Gestiona configuraciones</p>
						</div>
					</div>
				</Link>
			</div>

			{/* Recent Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Recommended Jobs */}
				<div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
					<h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Empleos Recomendados</h2>
					{loadingJobs ? (
						<div className="flex items-center justify-center py-8">
							<div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
						</div>
					) : recommendedJobs.length > 0 ? (
						<>
							<div className="space-y-3 sm:space-y-4">
								{recommendedJobs.map(job => (
									<div key={job.jobId} className="border-b border-gray-200 pb-2 sm:pb-3 last:border-b-0">
										<Link
											href={`/jobs/${job.jobId}`}
											className="text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-800 break-words"
										>
											{job.jobTitle}
										</Link>
										<p className="text-xs sm:text-sm text-gray-500 mt-1">
											{job.companyName || 'Empresa'} - {job.location || 'Ubicación no especificada'}
										</p>
									</div>
								))}
							</div>
							<div className="mt-3 sm:mt-4">
								<Link
									href="/candidate/jobs"
									className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
								>
									Ver todos los empleos →
								</Link>
							</div>
						</>
					) : (
						<div className="text-center py-8">
							<div className="text-4xl mb-3">💼</div>
							<p className="text-sm text-gray-600">
								No hay empleos disponibles en este momento.
							</p>
							<Link
								href="/candidate/jobs"
								className="inline-block mt-3 text-xs sm:text-sm text-pink-600 hover:text-pink-700 font-medium"
							>
								Explorar trabajos →
							</Link>
						</div>
					)}
				</div>

				{/* Quick Tips */}
				<div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
					<h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Consejos de Búsqueda de Empleo</h2>
					<div className="space-y-3 sm:space-y-4">
						<div className="flex items-start">
							<div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
								<span className="text-xs sm:text-sm">💡</span>
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="text-xs sm:text-sm font-medium text-gray-900">Completa tu Perfil</h3>
								<p className="text-xs sm:text-sm text-gray-500 mt-0.5">Un perfil completo aumenta tus posibilidades de ser notado por los empleadores.</p>
							</div>
						</div>
						<div className="flex items-start">
							<div className="p-1.5 sm:p-2 bg-green-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
								<span className="text-xs sm:text-sm">🎯</span>
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="text-xs sm:text-sm font-medium text-gray-900">Aplica Estratégicamente</h3>
								<p className="text-xs sm:text-sm text-gray-500 mt-0.5">Enfócate en empleos que coincidan con tus habilidades y experiencia.</p>
							</div>
						</div>
						<div className="flex items-start">
							<div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
								<span className="text-xs sm:text-sm">📈</span>
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="text-xs sm:text-sm font-medium text-gray-900">Rastrea tu Progreso</h3>
								<p className="text-xs sm:text-sm text-gray-500 mt-0.5">Usa la página de aplicaciones para monitorear tu progreso en la búsqueda de empleo.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CandidateDashboard