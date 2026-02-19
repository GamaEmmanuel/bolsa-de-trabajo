'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { JobPosting } from '../../types'
import { db } from '../../lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import Header from '../../components/Header'
import Link from 'next/link'

// Extend the JobPosting interface for additional fields
declare module '../../types' {
	interface JobPosting {
		companyName?: string
		location?: string
	}
}

interface JobFilters {
	keyword: string
	location: string
	jobType: string
	salaryMin: string
	salaryMax: string
	experience: string
	remote: boolean
}

const JobSearchPageClient = () => {
	const searchParams = useSearchParams()
	const [jobs, setJobs] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showFilters, setShowFilters] = useState(false)
	const [filters, setFilters] = useState<JobFilters>({
		keyword: '',
		location: '',
		jobType: '',
		salaryMin: '',
		salaryMax: '',
		experience: '',
		remote: false,
	})
	const [sortBy, setSortBy] = useState<'date' | 'salary' | 'relevance'>('date')

	// Read URL params and apply them as initial filters
	useEffect(() => {
		const q = searchParams.get('q')
		const loc = searchParams.get('location')
		if (q || loc) {
			setFilters(prev => ({
				...prev,
				keyword: q || '',
				location: loc || '',
			}))
			if (q) setSortBy('relevance')
		}
	}, [searchParams])

	// Fetch jobs from database
	useEffect(() => {
		const q = query(
			collection(db, 'jobPostings'),
			where('status', '==', 'published'),
			orderBy('postedDate', 'desc')
		)

		const unsubscribe = onSnapshot(q,
			(querySnapshot) => {
				const jobsData: JobPosting[] = []
				querySnapshot.forEach(doc => {
					jobsData.push({ jobId: doc.id, ...doc.data() } as JobPosting)
				})
				console.log('Fetched jobs:', jobsData.length, 'jobs found')
				console.log('Jobs data:', jobsData)
				setJobs(jobsData)
				setLoading(false)
			},
			(error) => {
				console.error('Error fetching job postings:', error)
				setError('Failed to load job postings. Please try again.')
				setLoading(false)
			}
		)

		return () => unsubscribe()
	}, [])

	// Filter and sort jobs
	const filteredJobs = useMemo(() => {
		const filtered = jobs.filter(job => {
			// Keyword filter
			if (filters.keyword) {
				const keyword = filters.keyword.toLowerCase()
				const matchesTitle = job.jobTitle?.toLowerCase().includes(keyword)
				const matchesDescription = job.jobDescription?.toLowerCase().includes(keyword)
				const matchesCompany = job.companyName?.toLowerCase().includes(keyword)
				if (!matchesTitle && !matchesDescription && !matchesCompany) return false
			}

			// Location filter
			if (filters.location) {
				const location = filters.location.toLowerCase()
				const jobLocation = job.location?.toLowerCase() || ''
				if (!jobLocation.includes(location) && !jobLocation.includes('remote')) return false
			}

			// Remote filter
			if (filters.remote) {
				const jobLocation = job.location?.toLowerCase() || ''
				if (!jobLocation.includes('remote')) return false
			}

			// Job type filter
			if (filters.jobType && job.jobType !== filters.jobType) return false

			// Salary filter
			if (filters.salaryMin && job.salaryMin) {
				if (job.salaryMin < parseInt(filters.salaryMin)) return false
			}
			if (filters.salaryMax && job.salaryMax) {
				if (job.salaryMax > parseInt(filters.salaryMax)) return false
			}

			return true
		})

		// Sort jobs
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'salary':
					return (b.salaryMin || 0) - (a.salaryMin || 0)
				case 'relevance':
					// Simple relevance based on keyword matches
					if (filters.keyword) {
						const keyword = filters.keyword.toLowerCase()
						const aMatches = (a.jobTitle?.toLowerCase().includes(keyword) ? 2 : 0) +
							(a.jobDescription?.toLowerCase().includes(keyword) ? 1 : 0)
						const bMatches = (b.jobTitle?.toLowerCase().includes(keyword) ? 2 : 0) +
							(b.jobDescription?.toLowerCase().includes(keyword) ? 1 : 0)
						return bMatches - aMatches
					}
					return 0
				case 'date':
				default:
					return new Date(b.postedDate || '').getTime() - new Date(a.postedDate || '').getTime()
			}
		})

		return filtered
	}, [jobs, filters, sortBy])

	const handleFilterChange = (key: keyof JobFilters, value: string | boolean) => {
		setFilters(prev => ({ ...prev, [key]: value }))
	}

	const clearFilters = () => {
		setFilters({
			keyword: '',
			location: '',
			jobType: '',
			salaryMin: '',
			salaryMax: '',
			experience: '',
			remote: false,
		})
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="flex items-center justify-center py-12">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
					<p className="ml-2 text-gray-600">Cargando empleos...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<div className="max-w-7xl mx-auto pt-20 sm:pt-24 pb-6 md:pb-10 px-4 sm:px-6 lg:px-8">
				<div className="space-y-4 md:space-y-6">
					{/* Header */}
					<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
						<div className="min-w-0 flex-1">
							<h1 className="text-2xl md:text-3xl font-bold text-gray-900">Encuentra tu Próxima Oportunidad</h1>
							<p className="text-sm md:text-base text-gray-500 mt-1">
								{filteredJobs.length} empleo{filteredJobs.length !== 1 ? 's' : ''} encontrado{filteredJobs.length !== 1 ? 's' : ''}
							</p>
						</div>
						<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
							<label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Ordenar por:</label>
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value as 'date' | 'salary' | 'relevance')}
								className="flex-1 sm:flex-initial px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
							>
								<option value="date">Fecha de publicación</option>
								<option value="salary">Salario</option>
								<option value="relevance">Relevancia</option>
							</select>
						</div>
					</div>

					{error && (
						<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-600">{error}</p>
						</div>
					)}

					{/* Mobile Filter Toggle */}
					<button
						onClick={() => setShowFilters(!showFilters)}
						className="lg:hidden w-full px-4 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 font-medium"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
						</svg>
						{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
					</button>

					<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
						{/* Filters Sidebar */}
						<div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
							<div className="bg-white p-5 md:p-6 rounded-xl shadow-sm">
								<div className="flex justify-between items-center mb-5">
									<h2 className="text-base md:text-lg font-semibold text-gray-900">Filtros</h2>
									<button
										onClick={clearFilters}
										className="text-xs md:text-sm text-pink-600 hover:text-pink-700 font-medium"
									>
										Limpiar todo
									</button>
								</div>

								<div className="space-y-4">
									{/* Keyword Search */}
									<div>
										<label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5">
											Palabras clave
										</label>
										<input
											type="text"
											placeholder="Puesto, empresa, habilidades..."
											value={filters.keyword}
											onChange={(e) => handleFilterChange('keyword', e.target.value)}
											className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent focus:bg-white transition-colors"
										/>
									</div>

									{/* Location */}
									<div>
										<label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5">
											Ubicación
										</label>
										<input
											type="text"
											placeholder="Ciudad o estado..."
											value={filters.location}
											onChange={(e) => handleFilterChange('location', e.target.value)}
											className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent focus:bg-white transition-colors"
										/>
									</div>

									{/* Remote Work */}
									<div className="flex items-center">
										<input
											type="checkbox"
											id="remote"
											checked={filters.remote}
											onChange={(e) => handleFilterChange('remote', e.target.checked)}
											className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
										/>
										<label htmlFor="remote" className="ml-2 text-xs md:text-sm text-gray-700">
											Solo remoto
										</label>
									</div>

									{/* Job Type */}
									<div>
										<label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5">
											Tipo de Empleo
										</label>
										<select
											value={filters.jobType}
											onChange={(e) => handleFilterChange('jobType', e.target.value)}
											className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent focus:bg-white transition-colors"
										>
											<option value="">Todos los tipos</option>
											<option value="full-time">Tiempo Completo</option>
											<option value="part-time">Medio Tiempo</option>
											<option value="contract">Contrato</option>
											<option value="internship">Prácticas</option>
										</select>
									</div>

									{/* Salary Range */}
									<div>
										<label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5">
											Rango Salarial (MXN)
										</label>
										<div className="grid grid-cols-2 gap-2">
											<input
												type="number"
												placeholder="Mínimo"
												value={filters.salaryMin}
												onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
												className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent focus:bg-white transition-colors"
											/>
											<input
												type="number"
												placeholder="Máximo"
												value={filters.salaryMax}
												onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
												className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent focus:bg-white transition-colors"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Job Listings */}
						<div className="lg:col-span-3">
							{filteredJobs.length === 0 ? (
								<div className="text-center py-16">
									<div className="text-gray-300 text-5xl md:text-6xl mb-4">🔍</div>
									<h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No se encontraron empleos</h3>
									<p className="text-sm md:text-base text-gray-500">Intenta ajustar tus filtros para ver más resultados.</p>
								</div>
							) : (
								<div className="space-y-3">
									{filteredJobs.map(job => (
										<article key={job.jobId}>
										<Link
											href={`/jobs/${job.jobId}`}
											className="block bg-white p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
										>
											<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
												<div className="flex-1 min-w-0">
													<div className="flex items-start justify-between gap-2 sm:gap-3 mb-1">
														<h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-pink-600 break-words">
															{job.jobTitle}
														</h3>
														{job.postedDate && (
															<span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-1">
																{new Date(job.postedDate).toLocaleDateString('es-MX', {
																	month: 'short',
																	day: 'numeric'
																})}
															</span>
														)}
													</div>
													<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
														<span className="text-gray-600 font-medium">
															{job.companyName || 'Empresa'}
														</span>
														<span className="hidden sm:inline text-gray-300">•</span>
														<span className="text-gray-400 text-xs sm:text-sm">
															{job.location || 'Ubicación no especificada'}
														</span>
													</div>
													<div className="flex items-center gap-2 flex-wrap mt-2.5">
														{job.jobType && (
															<span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-pink-50 text-pink-700 rounded-full">
																{job.jobType === 'full-time' && 'Tiempo Completo'}
																{job.jobType === 'part-time' && 'Medio Tiempo'}
																{job.jobType === 'contract' && 'Contrato'}
																{job.jobType === 'internship' && 'Prácticas'}
																{job.jobType === 'freelance' && 'Freelance'}
																{!['full-time', 'part-time', 'contract', 'internship', 'freelance'].includes(job.jobType) && job.jobType}
															</span>
														)}
														{job.employmentType && (
															<span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
																{job.employmentType === 'remote' && 'Remoto'}
																{job.employmentType === 'hybrid' && 'Híbrido'}
																{job.employmentType === 'on-site' && 'Presencial'}
															</span>
														)}
														{job.salaryMin && job.salaryMax && !job.isSalaryHidden && (
															<span className="text-xs sm:text-sm text-green-600 font-medium">
																${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} MXN
															</span>
														)}
													</div>
												</div>

												<div className="flex-shrink-0 sm:self-center">
													<span className="inline-block px-4 py-2 bg-pink-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-pink-700 transition-colors">
														Ver Detalles
													</span>
												</div>
											</div>
										</Link>
										</article>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default JobSearchPageClient

