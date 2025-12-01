'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { JobPosting } from '../../../types'
import { db } from '../../../lib/firebase'
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'

// Extend the JobPosting interface for additional fields
declare module '../../../types' {
	interface JobPosting {
		companyName?: string
		companyLogoUrl?: string
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

const JobsPage = () => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const companyIdParam = searchParams?.get('companyId')

	const [jobs, setJobs] = useState<JobPosting[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [companyName, setCompanyName] = useState<string | null>(null)
	const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)
	const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({})
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

	// Fetch company name if companyId is provided
	useEffect(() => {
		const fetchCompanyName = async () => {
			if (!companyIdParam) {
				setCompanyName(null)
				return
			}

			try {
				const userDoc = await getDoc(doc(db, 'users', companyIdParam))
				if (userDoc.exists()) {
					const userData = userDoc.data()

					// Get company name from companyData (matching job detail page)
					if (userData.companyData?.companyName) {
						setCompanyName(userData.companyData.companyName)
					}

					// Get logo from companies collection
					const actualCompanyId = userData.companyId || companyIdParam
					const companyDoc = await getDoc(doc(db, 'companies', actualCompanyId))
					if (companyDoc.exists()) {
						const companyData = companyDoc.data()
						if (companyData.logoUrl) {
							setCompanyLogoUrl(companyData.logoUrl)
						}
					}
				}
			} catch (err) {
				console.error('Error fetching company data:', err)
			}
		}

		fetchCompanyName()
	}, [companyIdParam])

	// Fetch company logos for all jobs
	useEffect(() => {
		const fetchCompanyLogos = async () => {
			if (jobs.length === 0) return

			// Get unique company IDs, filtering out mock/invalid IDs
			const uniqueCompanyIds = [...new Set(
				jobs
					.map(job => job.companyId)
					.filter(id => id && id !== 'mock-company-id' && !id.includes('mock'))
			)]
			console.log('🏢 Fetching logos for', uniqueCompanyIds.length, 'companies')

			const logos: Record<string, string> = {}

			// Fetch each company's logo
			await Promise.all(
				uniqueCompanyIds.map(async (companyId) => {
					try {
						// First try to get companyId from users collection
						const userDoc = await getDoc(doc(db, 'users', companyId as string))
						if (userDoc.exists()) {
							const userData = userDoc.data()
							const actualCompanyId = userData.companyId || companyId

							// Fetch from companies collection
							const companyDoc = await getDoc(doc(db, 'companies', actualCompanyId))
							if (companyDoc.exists()) {
								const companyData = companyDoc.data()
								if (companyData.logoUrl) {
									logos[companyId as string] = companyData.logoUrl
								}
							}
						}
					} catch (err: any) {
						// Silently skip permission errors for mock or invalid companies
						if (err?.code !== 'permission-denied') {
							console.error('Error fetching logo for company:', companyId, err)
						}
					}
				})
			)

			console.log('✅ Logos fetched:', Object.keys(logos).length)
			setCompanyLogos(logos)
		}

		fetchCompanyLogos()
	}, [jobs])

	// Fetch jobs from database
	useEffect(() => {
		let q

		// If companyId is provided, filter by company
		if (companyIdParam) {
			q = query(
				collection(db, 'jobPostings'),
				where('companyId', '==', companyIdParam),
				where('status', '==', 'published'),
				orderBy('postedDate', 'desc')
			)
		} else {
			q = query(
				collection(db, 'jobPostings'),
				where('status', '==', 'published'),
				orderBy('postedDate', 'desc')
			)
		}

		const unsubscribe = onSnapshot(q,
			async (querySnapshot) => {
				const jobsData: JobPosting[] = []
				querySnapshot.forEach(doc => {
					jobsData.push({ jobId: doc.id, ...doc.data() } as JobPosting)
				})
				console.log('Fetched jobs:', jobsData.length, 'jobs found')

				// Enrich jobs with company names (matching job detail page approach)
				const enrichedJobs = await Promise.all(
					jobsData.map(async (job) => {
						// Skip enrichment for jobs with mock or invalid company IDs
						if (!job.companyName && job.companyId && job.companyId !== 'mock-company-id' && !job.companyId.includes('mock')) {
							try {
								// Get company data from users collection (same as job detail page)
								const userDoc = await getDoc(doc(db, 'users', job.companyId))
								if (userDoc.exists()) {
									const userData = userDoc.data()
									// First try companyData (if it exists)
									if (userData.companyData?.companyName) {
										job.companyName = userData.companyData.companyName
									} else {
										// Fallback: try fetching from companies collection
										const actualCompanyId = userData.companyId || job.companyId
										const companyDoc = await getDoc(doc(db, 'companies', actualCompanyId))
										if (companyDoc.exists()) {
											const companyData = companyDoc.data()
											job.companyName = companyData.companyName || 'Nombre de la Empresa'
										}
									}
								}
							} catch (err: any) {
								// Silently skip permission errors for mock companies
								if (err?.code !== 'permission-denied') {
									console.error('Error fetching company name for job:', job.jobId, err)
								}
							}
						}
						return job
					})
				)

				console.log('Jobs enriched with company names:', enrichedJobs)
				setJobs(enrichedJobs)
				setLoading(false)
			},
			(error) => {
				console.error('Error fetching job postings:', error)
				setError('Error al cargar las publicaciones de empleo. Por favor, inténtalo de nuevo.')
				setLoading(false)
			}
		)

		return () => unsubscribe()
	}, [companyIdParam])

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

	const clearCompanyFilter = () => {
		router.push('/candidate/jobs')
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p className="ml-2 text-gray-600">Cargando empleos...</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Company Filter Banner */}
			{companyIdParam && companyName && (
				<div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							{/* Company Logo */}
							<div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border border-orange-300">
								{companyLogoUrl ? (
									<img
										src={companyLogoUrl}
										alt={companyName}
										className="w-full h-full object-cover"
									/>
								) : (
									<span className="text-lg font-semibold text-orange-600">
										{companyName.charAt(0)}
									</span>
								)}
							</div>
							<div>
								<p className="text-sm font-semibold text-orange-900">
									Mostrando empleos de: <span className="font-bold">{companyName}</span>
								</p>
								<p className="text-xs text-orange-700">
									{filteredJobs.length} {filteredJobs.length === 1 ? 'posición disponible' : 'posiciones disponibles'}
								</p>
							</div>
						</div>
						<button
							onClick={clearCompanyFilter}
							className="flex items-center gap-2 px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
							Ver todos los empleos
						</button>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Encuentra Tu Próximo Empleo</h1>
					<p className="text-gray-600 mt-1">
						{filteredJobs.length} empleo{filteredJobs.length !== 1 ? 's' : ''} encontrado{filteredJobs.length !== 1 ? 's' : ''}
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<label className="text-sm font-medium text-gray-700">Ordenar por:</label>
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as 'date' | 'salary' | 'relevance')}
						className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="date">Fecha de Publicación</option>
						<option value="salary">Salario</option>
						<option value="relevance">Relevancia</option>
					</select>
				</div>
			</div>

			{error && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-md">
					<p className="text-red-600">{error}</p>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Filters Sidebar */}
				<div className="lg:col-span-1">
					<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
							<button
								onClick={clearFilters}
								className="text-sm text-blue-600 hover:text-blue-800"
							>
								Limpiar Todo
							</button>
						</div>

						<div className="space-y-4">
							{/* Keyword Search */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Palabras Clave
								</label>
								<input
									type="text"
									placeholder="Título del empleo, empresa, habilidades..."
									value={filters.keyword}
									onChange={(e) => handleFilterChange('keyword', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							{/* Location */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Ubicación
								</label>
								<input
									type="text"
									placeholder="Ciudad, estado, país..."
									value={filters.location}
									onChange={(e) => handleFilterChange('location', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							{/* Remote Work */}
							<div className="flex items-center">
								<input
									type="checkbox"
									id="remote"
									checked={filters.remote}
									onChange={(e) => handleFilterChange('remote', e.target.checked)}
									className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<label htmlFor="remote" className="ml-2 text-sm text-gray-700">
									Solo remoto
								</label>
							</div>

							{/* Job Type */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Tipo de Empleo
								</label>
								<select
									value={filters.jobType}
									onChange={(e) => handleFilterChange('jobType', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="">Todos los Tipos</option>
									<option value="full-time">Tiempo Completo</option>
									<option value="part-time">Medio Tiempo</option>
									<option value="contract">Contrato</option>
									<option value="internship">Prácticas</option>
								</select>
							</div>

							{/* Salary Range */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Rango Salarial (MXN)
								</label>
								<div className="grid grid-cols-2 gap-2">
									<input
										type="number"
										placeholder="Mín"
										value={filters.salaryMin}
										onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
										className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
									<input
										type="number"
										placeholder="Máx"
										value={filters.salaryMax}
										onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
										className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Job Listings */}
				<div className="lg:col-span-3">
					{filteredJobs.length === 0 ? (
						<div className="text-center py-12">
							<div className="text-gray-400 text-6xl mb-4">🔍</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron empleos</h3>
							<p className="text-gray-500">Intenta ajustar tus filtros para ver más resultados.</p>
						</div>
					) : (
						<div className="space-y-4">
							{filteredJobs.map(job => (
								<Link
									key={job.jobId}
									href={`/jobs/${job.jobId}`}
									className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
								>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<div className="flex items-start gap-3">
												{/* Company Logo */}
												<div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
													{companyLogos[job.companyId] ? (
														<img
															src={companyLogos[job.companyId]}
															alt={job.companyName || 'Company'}
															className="w-full h-full object-cover"
														/>
													) : (
														<span className="text-lg font-semibold text-gray-400">
															{job.companyName?.charAt(0) || 'C'}
														</span>
													)}
												</div>

												<div className="flex-1">
													<h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
														{job.jobTitle}
													</h3>
													<p className="text-gray-600 font-medium mt-1">
														{job.companyName || 'Nombre de la Empresa'}
													</p>
													<p className="text-gray-500 text-sm mt-1">
														{job.location || 'Ubicación no especificada'}
													</p>
													<div className="flex items-center gap-2 mt-2">
														{job.jobType && (
															<span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
																{job.jobType}
															</span>
														)}
														{job.salaryMin && job.salaryMax && !job.isSalaryHidden && (
															<span className="text-sm text-green-600 font-medium">
																${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} MXN
															</span>
														)}
													</div>
												</div>
											</div>
										</div>
										<div className="ml-4 flex flex-col items-end">
											{job.postedDate && (
												<p className="text-xs text-gray-500">
													Publicado {new Date(job.postedDate).toLocaleDateString()}
												</p>
											)}
											<div className="mt-2 text-blue-600 text-sm font-medium">
												Ver Detalles →
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default JobsPage
